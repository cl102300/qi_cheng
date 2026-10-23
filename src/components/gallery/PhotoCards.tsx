import { useEffect } from 'react';
import { PhotoCard } from './PhotoCard';
import { useAppStore } from '@/stores/appStore';
import { computeLayout } from '@/three/layouts/autoLayout';

interface PhotoCardsProps {
  photos: any[];
  layout: string;
  selectedPhotoId: string | null;
}

export function PhotoCards({ photos, layout, selectedPhotoId }: PhotoCardsProps) {
  const { updatePhotoPosition } = useAppStore();

  // 计算布局位置
  useEffect(() => {
    if (photos.length === 0) return;

    try {
      const result = computeLayout(photos, layout as any);
      result.positions.forEach((pos: any, id: string) => {
        updatePhotoPosition(id, pos, result.scales?.get(id));
      });
    } catch (error) {
      console.error('布局计算失败:', error);
    }
  }, [photos.length, layout]);

  return (
    <>
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isSelected={photo.id === selectedPhotoId}
          showFilmDetails={photos.length <= 99}
          onClick={(id) => useAppStore.getState().selectPhoto(id)}
        />
      ))}
    </>
  );
}
