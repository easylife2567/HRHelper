import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { LocaleProvider } from '@douyinfe/semi-ui';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LocaleProvider locale={zh_CN}>
      <App />
    </LocaleProvider>
  </React.StrictMode>,
)
