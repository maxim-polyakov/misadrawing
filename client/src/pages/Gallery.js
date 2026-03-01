import { observer } from "mobx-react-lite";
import { useContext, useState, useEffect } from "react";
import { Context } from "../index.js";
import { getImages, deleteImage } from "../http/imageApi.js";
import "./Gallery.css";

const Gallery = observer(() => {
    const { user } = useContext(Context);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [backgroundUrl, setBackgroundUrl] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        getImages()
            .then((data) => {
                setImages(data.images || []);
                setBackgroundUrl(data.backgroundUrl || "");
            })
            .catch(() => setImages([]))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Удалить картинку?")) return;
        setDeletingId(id);
        try {
            await deleteImage(id);
            setImages((prev) => prev.filter((img) => img.id !== id));
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div
            className="scroll-container"
            style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
        >
            <div className="gallery">
                {loading ? (
                    <div>Загрузка...</div>
                ) : images.length === 0 ? (
                    <div>Нет изображений. Загрузите первую картинку.</div>
                ) : (
                    images.map((img, i) => (
                        <div key={img.id || i} className="gallery-item">
                            <img
                                src={img.url}
                                width={300}
                                height={300}
                                alt={`изображение ${i + 1}`}
                                loading="lazy"
                            />
                            {user?.user?.role === "ADMIN" && (
                                <button
                                    type="button"
                                    className="gallery-item-delete"
                                    onClick={(e) => handleDelete(e, img.id)}
                                    disabled={deletingId === img.id}
                                    title="Удалить"
                                >
                                    {deletingId === img.id ? "…" : "×"}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
});

export default Gallery;