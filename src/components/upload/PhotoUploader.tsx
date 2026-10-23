import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { PhotoService } from '@/services/photoService';
import { MAX_PHOTOS } from '@/services/db';

interface PhotoUploaderProps {
  variant?: 'button' | 'hero';
  disabled?: boolean;
}

export function PhotoUploader({ variant = 'button', disabled = false }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const { photos, addPhotos } = useAppStore();

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled) return;
    const selected = Array.from(files);
    if (selected.length === 0) return;

    const supported = selected.filter((file) => PhotoService.isSupportedFile(file));
    const messages: string[] = [];
    if (supported.length < selected.length) {
      messages.push(`${selected.length - supported.length} 个文件格式不支持`);
    }

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setError(`相册最多保存 ${MAX_PHOTOS} 张照片`);
      return;
    }
    if (supported.length > remaining) {
      messages.push(`本次仅能添加 ${remaining} 张`);
    }

    const accepted = supported.slice(0, remaining);
    if (accepted.length === 0) {
      setError(messages.join('；') || '请选择手机相册中的图片');
      return;
    }

    setIsLoading(true);
    setError(null);
    let newPhotos: Awaited<ReturnType<typeof PhotoService.loadFromFiles>> = [];
    try {
      newPhotos = await PhotoService.loadFromFiles(accepted);
      if (newPhotos.length === 0) {
        setError('没有找到可用图片，请确认图片格式受支持且文件未损坏');
        return;
      }

      // 先上传，再更新界面，避免保存失败时照片看似已经添加。
      const savedPhotos = await PhotoService.saveToDB(newPhotos);
      addPhotos(savedPhotos);
      if (messages.length > 0) setError(messages.join('；'));
    } catch (cause) {
      newPhotos.forEach(PhotoService.releasePhoto);
      const message = cause instanceof Error ? cause.message : '添加失败，请重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [photos.length, addPhotos, disabled]);

  useEffect(() => {
    const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');
    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      if (event.dataTransfer?.files) void handleFiles(event.dataTransfer.files);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleFiles]);

  return (
    <>
      <div className="upload-control">
        <input
          ref={fileInputRef}
          id={inputId}
          className="upload-input"
          type="file"
          accept="image/*"
          multiple
          disabled={isLoading || disabled}
          onChange={(event) => {
            if (event.currentTarget.files) void handleFiles(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
        <label
          htmlFor={inputId}
          className={`upload-button${variant === 'hero' ? ' upload-button--hero' : ''}`}
          aria-disabled={isLoading || disabled}
        >
          <span aria-hidden="true">{isLoading ? '◌' : '＋'}</span>
          {isLoading ? '正在处理并上传…' : disabled ? '正在读取相册…' : variant === 'hero' ? '选择照片' : '添加照片'}
        </label>
      </div>
      {error && <div className="upload-error" role="status">{error}</div>}
      {isDragging && (
        <div className="drop-overlay" aria-live="polite">
          <div className="drop-overlay__card">
            <span>♡</span>
            <strong>松开鼠标，珍藏这张照片</strong>
            <small>JPG、PNG、WebP 原样上传；其他常见图片自动转为 JPG</small>
          </div>
        </div>
      )}
    </>
  );
}
