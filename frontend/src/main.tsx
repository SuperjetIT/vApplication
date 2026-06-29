import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { migrateLegacyStorageKeys } from './config/storageKeys'
import './index.css'
import App from './App.tsx'

migrateLegacyStorageKeys()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
