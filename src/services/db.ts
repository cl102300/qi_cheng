import { apiRequest } from './api';

export const MAX_PHOTOS = 999;

export interface DbPhoto {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: number;
  thumbnail: string;
  dataUrl?: string;
  size: number;
  createdAt: number;
  image?: Blob;
}

export interface PhotoSnapshot {
  photos: DbPhoto[];
  revision: number;
}

let cachedSnapshot: (PhotoSnapshot & { ownerId: string }) | null = null;

class DatabaseService {
  async getAllPhotos(ownerId: string): Promise<PhotoSnapshot> {
    const headers = new Headers();
    if (cachedSnapshot?.ownerId === ownerId) {
      headers.set('If-None-Match', `"${ownerId}-${cachedSnapshot.revision}"`);
    }

    const response = await fetch('/api/photos', { headers, credentials: 'same-origin' });
    if (response.status === 304 && cachedSnapshot?.ownerId === ownerId) return cachedSnapshot;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || '读取相册失败');

    cachedSnapshot = { ...body, ownerId } as PhotoSnapshot & { ownerId: string };
    return cachedSnapshot;
  }

  async addPhotos(photos: DbPhoto[]): Promise<void> {
    const addedIds: string[] = [];
    try {
      for (const photo of photos) {
        if (!photo.image) throw new Error(`无法上传“${photo.name}”，没有读取到图片数据`);
        const form = new FormData();
        form.set('id', photo.id);
        form.set('name', photo.name);
        form.set('width', String(photo.width));
        form.set('height', String(photo.height));
        form.set('createdAt', String(photo.createdAt));
        form.set('thumbnail', photo.thumbnail);
        form.set('image', photo.image, photo.name);
        await apiRequest('/api/photos', { method: 'POST', body: form });
        addedIds.push(photo.id);
      }
      this.invalidate();
    } catch (error) {
      await Promise.all(addedIds.map((id) =>
        apiRequest(`/api/photos/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => undefined)
      ));
      this.invalidate();
      throw error;
    }
  }

  async deletePhoto(id: string): Promise<void> {
    await apiRequest(`/api/photos/${encodeURIComponent(id)}`, { method: 'DELETE' });
    this.invalidate();
  }

  async clearAll(): Promise<void> {
    await apiRequest('/api/photos', { method: 'DELETE' });
    this.invalidate();
  }

  async count(ownerId: string): Promise<number> {
    return (await this.getAllPhotos(ownerId)).photos.length;
  }

  invalidate(): void {
    cachedSnapshot = null;
  }
}

export const dbService = new DatabaseService();
