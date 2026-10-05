// Wires the standard admin into a landing build.
//   vite dev            — /admin/ works against a local mock API that writes src/content.json directly
//   LANDING_ADMIN=php   — production for the client's hosting: admin/api.php + initial password (ADMIN_PASSWORD)
//   LANDING_ADMIN=demo  — default build (GitHub Pages portfolio): no backend, edits stay in the visitor's browser
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

type Options = { content?: string; schema?: string }
type Mode = 'php' | 'demo'

const kitDir = fileURLToPath(new URL('.', import.meta.url))
const uiDir = join(kitDir, 'ui')
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const PBKDF2_ITERATIONS = 210000

function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256')
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function readBody(req: IncomingMessage) {
  return new Promise<Buffer>((done, fail) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => done(Buffer.concat(chunks)))
    req.on('error', fail)
  })
}

function send(res: ServerResponse, status: number, body: unknown, type = mime['.json']) {
  res.statusCode = status
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'no-store')
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
}

export function landingAdmin(options: Options = {}): Plugin {
  let root = process.cwd()
  let publicDir = join(root, 'public')
  const mode: Mode = process.env.LANDING_ADMIN === 'php' ? 'php' : 'demo'
  const contentPath = () => resolve(root, options.content ?? 'src/content.json')
  const schemaPath = () => resolve(root, options.schema ?? 'src/content.schema.json')
  const schemaTitle = () => (JSON.parse(readFileSync(schemaPath(), 'utf8')) as { title?: string }).title ?? 'Сайт'

  // Same contract as kit/php/api.php, minus auth: the dev server is only reachable from this machine
  async function devApi(req: IncomingMessage, res: ServerResponse, action: string) {
    switch (`${req.method} ${action}`) {
      case 'GET status':
        return send(res, 200, { ok: true, authed: true, csrf: 'dev', initialPassword: false })
      case 'POST login':
      case 'POST logout':
      case 'POST password':
        return send(res, 200, { ok: true, csrf: 'dev' })
      case 'POST save': {
        const { content } = JSON.parse((await readBody(req)).toString('utf8')) as { content: unknown }
        writeFileSync(contentPath(), JSON.stringify(content, null, 2) + '\n')
        return send(res, 200, { ok: true, savedAt: new Date().toISOString() })
      }
      case 'GET history':
        return send(res, 200, { ok: true, items: [] })
      case 'POST upload': {
        const request = new Request('http://dev/upload', {
          method: 'POST',
          headers: req.headers as Record<string, string>,
          body: new Uint8Array(await readBody(req)),
        })
        const file = (await request.formData()).get('file')
        if (!(file instanceof File)) return send(res, 400, { ok: false, error: 'Файл не загрузился' })
        const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type]
        if (!ext) return send(res, 400, { ok: false, error: 'Подходят только изображения JPG, PNG, WebP или GIF' })
        mkdirSync(join(publicDir, 'uploads'), { recursive: true })
        const name = `${randomBytes(6).toString('hex')}.${ext}`
        writeFileSync(join(publicDir, 'uploads', name), Buffer.from(await file.arrayBuffer()))
        return send(res, 200, { ok: true, path: `uploads/${name}` })
      }
      default:
        return send(res, 404, { ok: false, error: 'Неизвестное действие' })
    }
  }

  return {
    name: 'landing-admin',

    config(_, { command }) {
      const runtimeMode = command === 'serve' ? 'dev' : mode
      return { define: { 'import.meta.env.VITE_LANDING_ADMIN': JSON.stringify(runtimeMode) } }
    },

    configResolved(config) {
      root = config.root
      publicDir = config.publicDir || join(root, 'public')
      if (config.command === 'build' && mode === 'php' && !process.env.ADMIN_PASSWORD) {
        throw new Error('LANDING_ADMIN=php needs ADMIN_PASSWORD: the initial admin password for the client')
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://dev')
        const base = server.config.base.replace(/^\.?\/?/, '/')
        if (!url.pathname.startsWith(`${base}admin`)) return next()
        const path = url.pathname.slice(`${base}admin`.length)
        try {
          if (path === '') return res.writeHead(302, { Location: `${base}admin/` }).end()
          if (path === '/api.php') return await devApi(req, res, url.searchParams.get('action') ?? '')
          if (path === '/config.json') return send(res, 200, { mode: 'dev', title: schemaTitle() })
          if (path === '/defaults.json') return send(res, 200, readFileSync(contentPath()))
          if (path === '/schema.json') return send(res, 200, readFileSync(schemaPath()))
          const file = join(uiDir, path === '/' ? 'index.html' : path)
          if (!file.startsWith(uiDir) || !existsSync(file)) return next()
          return send(res, 200, readFileSync(file), mime[extname(file)] ?? 'application/octet-stream')
        } catch (error) {
          return send(res, 500, { ok: false, error: String(error) })
        }
      })
    },

    generateBundle() {
      const emit = (fileName: string, source: string | Uint8Array) => this.emitFile({ type: 'asset', fileName, source })
      for (const file of walk(uiDir)) {
        emit(`admin/${relative(uiDir, file).replaceAll('\\', '/')}`, readFileSync(file))
      }
      emit('admin/defaults.json', readFileSync(contentPath()))
      emit('admin/schema.json', readFileSync(schemaPath()))
      emit('admin/config.json', JSON.stringify({ mode, title: schemaTitle() }))
      if (mode === 'php') {
        emit('admin/api.php', readFileSync(join(kitDir, 'php', 'api.php')))
        emit('admin/initial-auth.php', `<?php exit; ?>\n${JSON.stringify({ hash: hashPassword(process.env.ADMIN_PASSWORD!) })}`)
      }
    },
  }
}
