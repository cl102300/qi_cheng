import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { PhotoService } from '@/services/photoService';

export function PhotoDetail() {
  const { photos, selectedPhotoId, selectPhoto, removePhoto } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);
  const currentIndex = photos.findIndex((photo) => photo.id === selectedPhotoId);
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex >= 0 && currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  useEffect(() => {
    if (!selectedPhotoId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selectPhoto(null);
      if (event.key === 'ArrowLeft' && prevPhoto) {
        event.preventDefault();
        selectPhoto(prevPhoto.id);
      }
      if (event.key === 'ArrowRight' && nextPhoto) {
        event.preventDefault();
        selectPhoto(nextPhoto.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoId, prevPhoto, nextPhoto, selectPhoto]);

  if (!selectedPhoto) return null;

  const handleDelete = async () => {
    if (!window.confirm(`确定从相册中删除“${selectedPhoto.name}”吗？`)) return;
    setIsDeleting(true);
    setError(null);
    try {
      await PhotoService.deleteFromDB(selectedPhoto.id);
      removePhoto(selectedPhoto.id);
      PhotoService.releasePhoto(selectedPhoto);
      selectPhoto(null);
    } catch {
      setError('删除失败，照片仍保留在本地相册中，请重试。');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`正在查看${selectedPhoto.name}`}
      onClick={(event) => { if (event.target === event.currentTarget) selectPhoto(null); }}
    >
      <button className="lightbox-close" onClick={() => selectPhoto(null)} aria-label="关闭查看">×</button>

      {prevPhoto && (
        <button className="lightbox-nav lightbox-nav--prev" onClick={() => selectPhoto(prevPhoto.id)} aria-label="上一张">‹</button>
      )}

      <figure className="lightbox-content">
        <div className="lightbox-image-wrap">
          <img src={selectedPhoto.dataUrl || selectedPhoto.thumbnail} alt={selectedPhoto.name} />
        </div>
        <figcaption className="lightbox-caption">
          <div className="lightbox-caption__name">
            <strong>{selectedPhoto.name}</strong>
            <span>{selectedPhoto.width} × {selectedPhoto.height}</span>
          </div>
          <span className="lightbox-counter">{currentIndex + 1} / {photos.length}</span>
        </figcaption>
        {error && <p className="lightbox-error" role="alert">{error}</p>}
        <button className="lightbox-delete" onClick={() => void handleDelete()} disabled={isDeleting}>
          {isDeleting ? '正在删除…' : '删除这张照片'}
        </button>
      </figure>

      {nextPhoto && (
        <button className="lightbox-nav lightbox-nav--next" onClick={() => selectPhoto(nextPhoto.id)} aria-label="下一张">›</button>
      )}
    </div>
  );
}
