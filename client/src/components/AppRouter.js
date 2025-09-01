import { Context } from "../index.js";
import { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { authRoutes, publicRoutes } from "../Routes.js";
import { observer } from "mobx-react-lite";
import Gallery from "../pages/Gallery.js";
import { LOGIN_ROUTE, GALLERY_ROUTE } from "../utils/consts.js";

const AppRouter = observer(() => {
    const { user } = useContext(Context);
    const isAuth = user?.isAuth;

    console.log("User auth status:", user?.isAuth);

    return (
        <Routes>
            {/* Защищенные маршруты - только для авторизованных */}
            {isAuth &&
                authRoutes.map(({ path, Component }) => (
                    <Route
                        key={path}
                        path={path}
                        element={<Component />}
                    />
                ))}

            {/* Публичные маршруты - доступны всем */}
            {publicRoutes.map(({ path, Component }) => (
                <Route
                    key={path}
                    path={path}
                    element={<Component />}
                />
            ))}

            {/* КОРНЕВОЙ ПУТЬ - ВСЕГДА перенаправляем на логин */}
            <Route
                path="/"
                element={<Navigate to={LOGIN_ROUTE} replace />}
            />

            {/* Для всех других путей: если авторизован - галерея, если нет - логин */}
            <Route
                path="*"
                element={
                    isAuth ?
                        <Gallery /> :
                        <Navigate to={LOGIN_ROUTE} replace />
                }
            />
        </Routes>
    );
});

export default AppRouter;