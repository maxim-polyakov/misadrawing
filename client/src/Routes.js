import { Auth } from "./pages/Auth.js";
import { Gallery } from "./pages/Gallery.js";
import {
    LOGIN_ROUTE,
    GALLERY_ROUTE,
    REGISTRATION_ROUTE,
} from "./utils/consts.js";

export const authRoutes = [];

export const publickRoutes = [
    {
        path: GALLERY_ROUTE,
        Component: Gallery,
    },
    {
        path: LOGIN_ROUTE,
        Component: Auth,
    },
    {
        path: REGISTRATION_ROUTE,
        Component: Auth,
    },
];
