/**
 * 照片服务 - 处理照片的增删改查
 */

import { dbService } from './db';
import { legacyDbService } from './legacyDb';
import type { LegacyPhoto } from './legacyDb';
import type { Photo } from '../types';

export class PhotoService {
  private static readonly supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  private static readonly thumbnailWidth = 480;
  private static readonly thumbnailHeight = 600;

  static isSupportedFile(file: File): boolean {
    return file.type.toLowerCase().startsWith('image/') ||
      /\.(jpe?g|png|webp|heic|heif|avif|gif|bmp|tiff?|svg)$/i.test(file.name);
  }

  /**
   * 从文件列表加载照片
   */
  static async loadFromFiles(files: FileList | File[]): Promise<Photo[]> {
    const loaded: Photo[] = [];

    for (const selectedFile of Array.from(files)) {
      if (!this.isSupportedFile(selectedFile)) continue;

      let file: File;
      try {
        file = await this.prepareForUpload(selectedFile);
      } catch (error) {
        loaded.forEach(this.releasePhoto);
        throw error;
      }

      const dataUrl = URL.createObjectURL(file);
      try {
        const { width, height } = await this.getImageDimensions(dataUrl);
        const thumbnail = await this.generateThumbnail(dataUrl);

        loaded.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          name: file.name,
          width,
          height,
          aspectRatio: width / height,
          thumbnail,
          dataUrl,
          image: file,
          size: file.size,
          createdAt: Date.now(),
          position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
          targetPosition: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
          isSelected: false,
          isFocused: false,
          isLoading: false,
          opacity: 1,
          scale: 1,
        });
      } catch {
        URL.revokeObjectURL(dataUrl);
        loaded.forEach(this.releasePhoto);
        throw new Error(`无法读取图片“${file.name}”，请确认文件没有损坏`);
      }

    }

    return loaded;
  }

  /**
   * 上传照片到当前账户的服务器相册
   */
  static async saveToDB(photos: Photo[]): Promise<Photo[]> {
    const dbPhotos = photos.map(p => ({
      id: p.id,
      name: p.name,
      width: p.width,
      height: p.height,
      aspectRatio: p.aspectRatio,
      thumbnail: p.thumbnail || '',
      image: p.image,
      size: p.size,
      createdAt: p.createdAt,
    }));
    await dbService.addPhotos(dbPhotos);
    return photos.map((photo) => {
      this.releasePhoto(photo);
      return {
        ...photo,
        dataUrl: this.imageUrl(photo.id),
        image: undefined,
      };
    });
  }

  /**
   * 从当前账户的服务器相册加载所有照片
   */
  static async loadFromDB(ownerId: string): Promise<{ photos: Photo[]; revision: number }> {
    const snapshot = await dbService.getAllPhotos(ownerId);
    const photos = snapshot.photos.map((saved) => ({
      ...saved,
      position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
      targetPosition: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
      isSelected: false,
      isFocused: false,
      isLoading: false,
      opacity: 1,
      scale: 1,
    }));
    return { photos, revision: snapshot.revision };
  }

  static async loadLegacyFromDB(): Promise<Photo[]> {
    const savedPhotos = await legacyDbService.getAllPhotos();
    const photos: Photo[] = [];
    for (const saved of savedPhotos) {
      if (saved.dataUrl?.startsWith('https://picsum.photos/seed/hm')) continue;
      const photo = await this.restoreLegacyPhoto(saved);
      if (photo) photos.push(photo);
    }
    return photos;
  }

  /**
   * 删除照片
   */
  static async deleteFromDB(id: string): Promise<void> {
    await dbService.deletePhoto(id);
  }

  /**
   * 清空所有照片
   */
  static async clearFromDB(): Promise<void> {
    await dbService.clearAll();
  }

  /**
   * 获取照片数量
   */
  static async getCount(ownerId: string): Promise<number> {
    return dbService.count(ownerId);
  }

  static imageUrl(id: string): string {
    return `/api/photos/${encodeURIComponent(id)}/image`;
  }

  static releasePhoto(photo: Photo): void {
    if (photo.dataUrl?.startsWith('blob:')) URL.revokeObjectURL(photo.dataUrl);
  }

  // 私有辅助方法
  private static getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('图片解码失败'));
      img.src = dataUrl;
    });
  }

  private static async prepareForUpload(file: File): Promise<File> {
    const imageType = await this.detectImageType(file);
    if (imageType && this.supportedTypes.has(imageType)) return file;

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('当前浏览器无法解码此图片格式'));
        element.src = objectUrl;
      });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('无法转换图片格式');
      context.drawImage(image, 0, 0);
      const jpeg = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片转换失败')), 'image/jpeg', 0.9);
      });
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
      return new File([jpeg], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
    } catch {
      throw new Error(`无法自动转换“${file.name}”，请另存为 JPG、PNG 或 WebP 后重试`);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  private static async detectImageType(file: File): Promise<string | null> {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
    if (bytes.length >= 8 && bytes.subarray(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index])) {
      return 'image/png';
    }
    if (bytes.length >= 12 &&
      String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
    return null;
  }

  private static generateThumbnail(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const { thumbnailWidth, thumbnailHeight } = this;
        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法生成图片缩略图'));
          return;
        }
        const targetRatio = thumbnailWidth / thumbnailHeight;
        const sourceRatio = img.width / img.height;
        const cropWidth = sourceRatio > targetRatio ? img.height * targetRatio : img.width;
        const cropHeight = sourceRatio > targetRatio ? img.height : img.width / targetRatio;
        const cropX = (img.width - cropWidth) / 2;
        const cropY = (img.height - cropHeight) / 2;

        // 统一裁切为 4:5，并加轻微暖调；原图保存在服务器数据库。
        ctx.filter = 'sepia(0.14) saturate(0.9) contrast(1.04)';
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, thumbnailWidth, thumbnailHeight);
        ctx.filter = 'none';
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => reject(new Error('图片解码失败'));
      img.src = dataUrl;
    });
  }

  private static async restoreLegacyPhoto(saved: LegacyPhoto): Promise<Photo | null> {
    let dataUrl: string | null = null;
    try {
      const image = saved.image ?? (saved.dataUrl?.startsWith('data:image/')
        ? await fetch(saved.dataUrl).then((response) => response.blob())
        : null);
      if (!image) return null;
      dataUrl = URL.createObjectURL(image);
      const thumbnail = saved.thumbnail?.startsWith('data:image/')
        ? saved.thumbnail
        : await this.generateThumbnail(dataUrl);
      return {
        ...saved,
        image,
        dataUrl,
        thumbnail,
        size: saved.size || image.size,
        createdAt: saved.createdAt || Date.now(),
        position: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
        targetPosition: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 },
        isSelected: false,
        isFocused: false,
        isLoading: false,
        opacity: 1,
        scale: 1,
      };
    } catch (error) {
      if (dataUrl) URL.revokeObjectURL(dataUrl);
      console.warn(`跳过无法恢复的旧照片“${saved.name}”`, error);
      return null;
    }
  }
}
