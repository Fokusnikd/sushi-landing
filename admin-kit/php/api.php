<?php
// Landing admin API: one file, no dependencies, PHP 8.0+ (any Russian shared hosting).
// Lives in <site>/admin/ and writes only <site>/content.json, <site>/uploads/ and <site>/admin/data/.
// None of those are part of the build, so uploading a new build never overwrites the client's edits.
declare(strict_types=1);

const CONTENT_FILE = __DIR__ . '/../content.json';
const UPLOAD_DIR = __DIR__ . '/../uploads';
const DATA_DIR = __DIR__ . '/data';
const BACKUP_DIR = DATA_DIR . '/backups';
const AUTH_FILE = DATA_DIR . '/auth.php';
const INITIAL_AUTH_FILE = __DIR__ . '/initial-auth.php';
const ATTEMPTS_FILE = DATA_DIR . '/attempts.php';
// Data files are .php starting with exit, so even a server that ignores .htaccess never serves them
const GUARD = "<?php exit; ?>\n";

const MAX_BODY_BYTES = 1000000;
const MAX_UPLOAD_BYTES = 8000000;
const KEEP_BACKUPS = 30;
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 900;
const SESSION_IDLE_SECONDS = 8 * 3600;
const MIN_PASSWORD_LENGTH = 8;
const IMAGE_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function reply(array $body, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): void
{
    reply(['ok' => false, 'error' => $message], $status);
}

function ensure_dir(string $dir): void
{
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        fail('Не удалось создать папку на хостинге. Проверьте права на папку сайта.', 500);
    }
}

function write_atomic(string $file, string $data): void
{
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, $data, LOCK_EX) === false || !rename($tmp, $file)) {
        @unlink($tmp);
        fail('Не удалось записать файл на хостинге. Проверьте права на папку сайта.', 500);
    }
}

function ensure_data_dir(): void
{
    ensure_dir(BACKUP_DIR);
    if (!is_file(DATA_DIR . '/.htaccess')) {
        file_put_contents(DATA_DIR . '/.htaccess', "Require all denied\n");
    }
}

function read_guarded(string $file): ?string
{
    if (!is_file($file)) return null;
    $raw = file_get_contents($file);
    return is_string($raw) && str_starts_with($raw, GUARD) ? substr($raw, strlen(GUARD)) : null;
}

function read_guarded_array(string $file): ?array
{
    $json = read_guarded($file);
    $data = $json === null ? null : json_decode($json, true);
    return is_array($data) ? $data : null;
}

function write_guarded(string $file, string $json): void
{
    ensure_data_dir();
    write_atomic($file, GUARD . $json);
}

function encode(mixed $value): string
{
    return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
}

// Objects stay stdClass so an empty {} in the content is not turned into [] on the way through
function read_body(bool $assoc): mixed
{
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
    if (!is_string($raw) || strlen($raw) > MAX_BODY_BYTES) fail('Слишком большой объём данных', 413);
    $data = json_decode($raw, $assoc);
    if ($assoc ? !is_array($data) : !($data instanceof stdClass)) fail('Неверный формат данных');
    return $data;
}

function is_https(): bool
{
    $https = $_SERVER['HTTPS'] ?? '';
    return ($https !== '' && $https !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function start_session(): void
{
    session_name('landing_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
    if (!empty($_SESSION['auth']) && time() - (int)($_SESSION['seen'] ?? 0) > SESSION_IDLE_SECONDS) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (!empty($_SESSION['auth'])) $_SESSION['seen'] = time();
}

function require_auth(bool $write): void
{
    if (empty($_SESSION['auth'])) fail('Сессия закончилась, войдите снова', 401);
    if (!$write) return;
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals((string)($_SESSION['csrf'] ?? ''), $token)) {
        fail('Обновите страницу и попробуйте ещё раз', 403);
    }
}

// The build ships initial-auth.php (PBKDF2 from ADMIN_PASSWORD); a password changed in the admin goes to data/auth.php
function stored_hash(): ?string
{
    $auth = read_guarded_array(AUTH_FILE) ?? read_guarded_array(INITIAL_AUTH_FILE);
    return is_string($auth['hash'] ?? null) ? $auth['hash'] : null;
}

function verify_password(string $password, string $hash): bool
{
    if (str_starts_with($hash, 'pbkdf2$')) {
        $parts = explode('$', $hash);
        if (count($parts) !== 5 || $parts[1] !== 'sha256') return false;
        $actual = hash_pbkdf2('sha256', $password, (string)base64_decode($parts[3]), (int)$parts[2], 0, true);
        return hash_equals((string)base64_decode($parts[4]), $actual);
    }
    return password_verify($password, $hash);
}

function attempts(): array
{
    $now = time();
    return array_filter(read_guarded_array(ATTEMPTS_FILE) ?? [], fn ($entry) => ($entry['until'] ?? 0) > $now || ($entry['last'] ?? 0) > $now - LOCK_SECONDS);
}

function login(): void
{
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $all = attempts();
    $entry = $all[$ip] ?? ['count' => 0, 'until' => 0, 'last' => 0];
    $wait = (int)$entry['until'] - time();
    if ($wait > 0) fail('Слишком много попыток. Попробуйте через ' . (int)ceil($wait / 60) . ' мин.', 429);

    $password = read_body(true)['password'] ?? '';
    $hash = stored_hash();
    if ($hash === null) fail('Пароль ещё не задан. Обратитесь к разработчику сайта.', 500);

    if (!is_string($password) || !verify_password($password, $hash)) {
        $entry['count'] = (int)$entry['count'] + 1;
        $entry['last'] = time();
        if ($entry['count'] >= MAX_ATTEMPTS) $entry = ['count' => 0, 'until' => time() + LOCK_SECONDS, 'last' => time()];
        $all[$ip] = $entry;
        write_guarded(ATTEMPTS_FILE, encode($all));
        usleep(400000);
        fail('Неверный пароль', 401);
    }

    unset($all[$ip]);
    write_guarded(ATTEMPTS_FILE, encode($all));
    session_regenerate_id(true);
    $_SESSION['auth'] = true;
    $_SESSION['seen'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    reply(['ok' => true, 'csrf' => $_SESSION['csrf']]);
}

function backups(): array
{
    $files = glob(BACKUP_DIR . '/*.php') ?: [];
    rsort($files);
    return $files;
}

function save(): void
{
    require_auth(true);
    $content = read_body(false)->content ?? null;
    if (!($content instanceof stdClass) || count(get_object_vars($content)) === 0) fail('Неверный формат данных');

    ensure_data_dir();
    $previous = is_file(CONTENT_FILE) ? file_get_contents(CONTENT_FILE) : false;
    if (is_string($previous) && $previous !== '') {
        write_guarded(BACKUP_DIR . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.php', $previous);
        foreach (array_slice(backups(), KEEP_BACKUPS) as $old) @unlink($old);
    }
    write_atomic(CONTENT_FILE, encode($content));
    reply(['ok' => true, 'savedAt' => date(DATE_ATOM)]);
}

function history(): void
{
    require_auth(false);
    $items = [];
    if (is_file(CONTENT_FILE)) $items[] = ['id' => 'current', 'time' => date(DATE_ATOM, (int)filemtime(CONTENT_FILE))];
    foreach (backups() as $file) {
        $items[] = ['id' => basename($file, '.php'), 'time' => date(DATE_ATOM, (int)filemtime($file))];
    }
    reply(['ok' => true, 'items' => $items]);
}

function version(): void
{
    require_auth(false);
    $id = (string)($_GET['id'] ?? '');
    if ($id === 'current') {
        $json = is_file(CONTENT_FILE) ? file_get_contents(CONTENT_FILE) : null;
    } elseif (preg_match('/^\d{8}-\d{6}-[a-f0-9]{6}$/', $id)) {
        $json = read_guarded(BACKUP_DIR . "/$id.php");
    } else {
        $json = null;
    }
    if (!is_string($json) || !(json_decode($json) instanceof stdClass)) fail('Версия не найдена', 404);
    // Raw JSON keeps the content byte-for-byte as it was saved
    echo '{"ok":true,"content":' . $json . '}';
    exit;
}

function upload(): void
{
    require_auth(true);
    $file = $_FILES['file'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        fail('Файл не загрузился. Попробуйте другое изображение.');
    }
    if ($file['size'] > MAX_UPLOAD_BYTES) fail('Файл больше 8 МБ', 413);
    $info = @getimagesize($file['tmp_name']);
    $ext = is_array($info) ? (IMAGE_TYPES[$info['mime']] ?? null) : null;
    if ($ext === null) fail('Подходят только изображения JPG, PNG, WebP или GIF');

    ensure_dir(UPLOAD_DIR);
    if (!is_file(UPLOAD_DIR . '/.htaccess')) {
        file_put_contents(UPLOAD_DIR . '/.htaccess', "<FilesMatch \"\\.(?i:php\\d?|phtml|phar|cgi|pl|py)$\">\n  Require all denied\n</FilesMatch>\n");
    }
    $name = date('Ymd') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . "/$name")) fail('Не удалось сохранить файл на хостинге', 500);
    @chmod(UPLOAD_DIR . "/$name", 0644);
    reply(['ok' => true, 'path' => "uploads/$name", 'width' => $info[0], 'height' => $info[1]]);
}

function change_password(): void
{
    require_auth(true);
    $body = read_body(true);
    $current = $body['current'] ?? '';
    $next = $body['next'] ?? '';
    $hash = stored_hash();
    if (!is_string($current) || $hash === null || !verify_password($current, $hash)) fail('Текущий пароль указан неверно', 401);
    if (!is_string($next) || mb_strlen($next) < MIN_PASSWORD_LENGTH) fail('Новый пароль должен быть не короче ' . MIN_PASSWORD_LENGTH . ' символов');
    write_guarded(AUTH_FILE, encode(['hash' => password_hash($next, PASSWORD_DEFAULT)]));
    session_regenerate_id(true);
    reply(['ok' => true]);
}

start_session();
$route = $_SERVER['REQUEST_METHOD'] . ' ' . (string)($_GET['action'] ?? '');

switch ($route) {
    case 'GET status':
        reply([
            'ok' => true,
            'authed' => !empty($_SESSION['auth']),
            'csrf' => empty($_SESSION['auth']) ? null : $_SESSION['csrf'],
            'initialPassword' => !is_file(AUTH_FILE),
        ]);
    case 'POST login':
        login();
    case 'POST logout':
        $_SESSION = [];
        session_destroy();
        reply(['ok' => true]);
    case 'POST save':
        save();
    case 'GET history':
        history();
    case 'GET version':
        version();
    case 'POST upload':
        upload();
    case 'POST password':
        change_password();
    default:
        fail('Неизвестное действие', 404);
}
