import {createContext} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import UserGallery from "./store/UserGallery.js";
import App from './App.js';

export const Context = createContext(null)

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
    <Context.Provider value={{
        user: new UserGallery()
    }}>
        <App />
    </Context.Provider>
);
