// Routes.js
import Gallery from "./pages/Gallery";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import {
    GALLERY_ROUTE,
    LOGIN_ROUTE,
    REGISTRATION_ROUTE,
    ADMIN_ROUTE
} from "./utils/consts";

export const authRoutes = [
    {
        path: GALLERY_ROUTE,
        Component: Gallery
    },
    {
        path: ADMIN_ROUTE,
        Component: Admin
    }
];

export const publicRoutes = [ // Исправлено: publicRoutes вместо publickRoutes
    {
        path: LOGIN_ROUTE,
        Component: Auth
    },
    {
        path: REGISTRATION_ROUTE,
        Component: Auth
    }
];