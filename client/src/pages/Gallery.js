import { observer } from "mobx-react-lite";
import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Context } from "../index.js";
import { getImages } from "../http/imageApi.js";
import { ADMIN_ROUTE } from "../utils/consts.js";
import "./Gallery.css";

const Gallery = observer(() => {
    const { user } = useContext(Context);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [backgroundUrl, setBackgroundUrl] = useState("");

    useEffect(() => {
        getImages()
            .then((data) => {
                setImages(data.images || []);
                setBackgroundUrl(data.backgroundUrl || "");
            })
            .catch(() => setImages([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div
            className="scroll-container"
            style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
        >
            {user?.isAuth && user?.user?.role === "ADMIN" && (
                <div className="mb-3 px-3">
                    <Link to={ADMIN_ROUTE} className="btn btn-outline-light btn-sm">
                        Кабинет админа
                    </Link>
                </div>
            )}
            <div className="gallery">
                {loading ? (
                    <div>Загрузка...</div>
                ) : images.length === 0 ? (
                    <div>Нет изображений. Загрузите первую картинку.</div>
                ) : (
                    images.map((img, i) => (
                        <img
                            key={img.id || i}
                            src={img.url}
                            width={300}
                            height={300}
                            alt={`изображение ${i + 1}`}
                            loading="lazy"
                        />
                    ))
                )}
            </div>
        </div>
    );
});

export default Gallery;