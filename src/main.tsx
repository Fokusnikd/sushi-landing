import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loadContent } from '../admin-kit/runtime'
import './index.css'
import App from './App.tsx'
import defaults from './content.json'
import { setContent } from './content'

loadContent(defaults).then((content) => {
  setContent(content)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
