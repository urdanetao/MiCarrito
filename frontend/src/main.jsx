import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './hooks/Toast';
import { backHandlerRegistry } from './util/util';

window.onAndroidBack = () => {
    if (!backHandlerRegistry.invoke()) {
        window.history.back();
    }
};

window.addEventListener('popstate', () => {
    if (typeof backHandlerRegistry.restore === 'function') {
        backHandlerRegistry.restore();
    }
});

createRoot(document.getElementById('root')).render(
    <ToastProvider>
        <App />
    </ToastProvider>,
)
