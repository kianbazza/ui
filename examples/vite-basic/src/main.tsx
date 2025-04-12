import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { NuqsAdapter } from 'nuqs/adapters/react'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
)
