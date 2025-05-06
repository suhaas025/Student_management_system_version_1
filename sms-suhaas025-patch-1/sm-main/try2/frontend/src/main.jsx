import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css'; // Import CSS reset and global styles
import { AppProvider } from './context/AppContext';

// Add transition style to avoid flash of unstyled content
const initialStyles = document.createElement('style');
initialStyles.innerHTML = `
  body {
    background-color: #0f172a;
    margin: 0;
    padding: 0;
    color: #fff;
    transition: background-color 0.3s ease;
  }
  * {
    box-sizing: border-box;
  }
`;
document.head.appendChild(initialStyles);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
); 