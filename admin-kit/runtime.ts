// Landing side of the admin: resolves the content to render before the app mounts.
//   dev  — the bundled src/content.json (the dev admin writes that file and HMR reloads)
//   php  — content.json saved by admin/api.php on the hosting; until the first save it does not exist
//   demo — portfolio builds without a backend: edits live in this browser's localStorage
import { draftKey, mergeContent } from './schema'

type Mode = 'dev' | 'php' | 'demo'

const mode = (import.meta.env.VITE_LANDING_ADMIN ?? 'dev') as Mode

export async function loadContent<T>(defaults: T, base: string = import.meta.env.BASE_URL): Promise<T> {
  if (mode === 'demo') {
    const key = draftKey(new URL(base, location.href).pathname)
    const draft = readDraft(key)
    if (draft === undefined) return defaults
    showDemoBanner(key, base)
    return mergeContent(defaults, draft)
  }
  if (mode === 'php') return mergeContent(defaults, await fetchSaved(base))
  return defaults
}

async function fetchSaved(base: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(`${base}content.json`, { cache: 'no-cache', signal: controller.signal })
    return response.ok ? await response.json() : undefined
  } catch {
    // Offline, slow hosting or a broken file: the bundled content is always a safe fallback
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

function readDraft(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : JSON.parse(raw)
  } catch {
    return undefined
  }
}

function showDemoBanner(key: string, base: string) {
  const bar = document.createElement('div')
  bar.setAttribute('role', 'status')
  bar.style.cssText =
    'position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;' +
    'max-width:calc(100vw - 24px);padding:10px 14px;border-radius:14px;background:#111827;color:#fff;' +
    'font:500 14px/1.35 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25)'
  const text = document.createElement('span')
  text.textContent = 'Вы видите свои правки из демо-админки — они хранятся только в этом браузере.'
  const link = document.createElement('a')
  link.href = `${base}admin/`
  link.textContent = 'Админка'
  link.style.cssText = 'color:#a5b4fc;font-weight:700'
  const reset = document.createElement('button')
  reset.type = 'button'
  reset.textContent = 'Сбросить'
  reset.style.cssText = 'all:unset;cursor:pointer;color:#fca5a5;font-weight:700'
  reset.onclick = () => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Storage blocked: nothing to reset
    }
    location.reload()
  }
  bar.append(text, link, reset)
  document.body.append(bar)
}
