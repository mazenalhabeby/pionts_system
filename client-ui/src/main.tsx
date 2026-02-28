import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StandaloneConfigProvider } from './context/WidgetConfigContext';
import App from './App';
import './styles/widget.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/rewards">
      <AuthProvider>
        <StandaloneConfigProvider>
          <App />
        </StandaloneConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
