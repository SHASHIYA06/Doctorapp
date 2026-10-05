import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Import Google Fonts (Figtree + Noto Sans)
// Font loading is handled in index.css @import

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
