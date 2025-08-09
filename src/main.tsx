
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { BrowserRouter, useNavigate } from "react-router-dom";
import "./config/axiosconfig.ts";


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" attribute="class">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
)
