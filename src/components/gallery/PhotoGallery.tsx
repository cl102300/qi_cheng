import { useEffect, useState, type ReactNode } from 'react';
import { useAppStore } from '@/stores/appStore';
import { accountSettingsService } from '@/services/api';
import { PhotoService } from '@/services/photoService';

interface PhotoGalleryProps {
  emptyUploader: ReactNode;
  onClearAll: () => void;
}

const FIRST_MEETING_DATE_KEY = 'heart-memories-first-meeting-date';
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function toDateInputValue(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function getDaysTogether(firstMeetingDate: string, today: Date): number | null {
  if (!firstMeetingDate) return null;
  const [year, month, day] = firstMeetingDate.split('-').map(Number);
  if (!year || !month || !day) return null;

  const firstDay = Date.UTC(year, month - 1, day);
  const currentDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const elapsedDays = Math.floor((currentDay - firstDay) / DAY_IN_MILLISECONDS);
  return elapsedDays < 0 ? null : elapsedDays + 1;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PhotoGallery({ emptyUploader, onClearAll }: PhotoGalleryProps) {
  const { photos, selectPhoto, removePhoto } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [dateSyncError, setDateSyncError] = useState<string | null>(null);
  const [firstMeetingDate, setFirstMeetingDate] = useState('');
  const [isDateReady, setIsDateReady] = useState(false);
  const [today, setToday] = useState(() => new Date());
  const daysTogether = getDaysTogether(firstMeetingDate, today);

  useEffect(() => {
    let active = true;
    let localDate = '';
    try {
      localDate = localStorage.getItem(FIRST_MEETING_DATE_KEY) ?? '';
      setFirstMeetingDate(localDate);
    } catch {
      // 浏览器禁用本地设置时，仍允许在当前页面查看天数。
    }

    void (async () => {
      try {
        const sharedDate = await accountSettingsService.getFirstMeetingDate();
        if (!active) return;
        if (sharedDate) {
          setFirstMeetingDate(sharedDate);
          try { localStorage.setItem(FIRST_MEETING_DATE_KEY, sharedDate); } catch { /* 服务器记录仍可正常使用。 */ }
        } else if (localDate) {
          // 将旧版本保存在本机的日期迁移到账户，供其他设备读取。
          await accountSettingsService.setFirstMeetingDate(localDate);
        }
        setDateSyncError(null);
      } catch {
        if (active) setDateSyncError('相识日期暂未同步到其他设备，请检查网络后重试。');
      } finally {
        if (active) setIsDateReady(true);
      }
    })();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleFirstMeetingDateChange = (value: string) => {
    setFirstMeetingDate(value);
    try {
      if (value) localStorage.setItem(FIRST_MEETING_DATE_KEY, value);
      else localStorage.removeItem(FIRST_MEETING_DATE_KEY);
    } catch {
      // 即使无法保存日期，也保留当前页面中的选择。
    }
    void accountSettingsService.setFirstMeetingDate(value || null)
      .then(() => setDateSyncError(null))
      .catch(() => setDateSyncError('相识日期暂未同步到其他设备，请检查网络后重试。'));
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定从相册中删除“${name}”吗？`)) return;
    const photo = photos.find((item) => item.id === id);
    try {
      await PhotoService.deleteFromDB(id);
      removePhoto(id);
      if (photo) PhotoService.releasePhoto(photo);
      setError(null);
    } catch {
      setError('删除失败，照片仍保留在本地相册中，请重试。');
    }
  };

  return (
    <main className="gallery-page">
      <section className="gallery-intro">
        <div className="gallery-intro__copy">
          <p className="eyebrow">齐娇与程龙 · 回忆相册</p>
          <h2 className="gallery-title">
            <span>独属于齐娇与程龙的</span>
            <em>回忆相册</em>
          </h2>
          <p className={`gallery-description${photos.length === 0 ? ' gallery-description--poetic' : ''}`}>
            {photos.length === 0
              ? '一眼万年'
              : `我们已经珍藏了 ${photos.length} 张照片，点击任意照片即可放大细看。`}
          </p>
        </div>
        <div className="gallery-intro__aside">
          <section className="anniversary-card" aria-label="相识纪念日">
            <div className="anniversary-card__topline">
              <label htmlFor="first-meeting-date">我们的第一次相识</label>
              {firstMeetingDate && (
                <button type="button" onClick={() => handleFirstMeetingDateChange('')} disabled={!isDateReady}>清除日期</button>
              )}
            </div>
            <div className="anniversary-card__date-field">
              <input
                id="first-meeting-date"
                className="anniversary-card__date"
                type="date"
                value={firstMeetingDate}
                max={toDateInputValue(today)}
                disabled={!isDateReady}
                onChange={(event) => handleFirstMeetingDateChange(event.currentTarget.value)}
                aria-label="选择第一次相识的日期"
              />
              {!firstMeetingDate && (
                <span className="anniversary-card__date-placeholder" aria-hidden="true">
                  {isDateReady ? '点击此处选择相识日期' : '正在同步日期…'}
                </span>
              )}
            </div>
            <div className="anniversary-card__count" aria-live="polite">
              <strong>{daysTogether?.toLocaleString('zh-CN') ?? '待设置'}</strong>
              {daysTogether !== null && <span>天</span>}
              <small>{daysTogether === null ? '选择日期后自动计算并同步' : '从初见至今'}</small>
            </div>
            {dateSyncError && <small className="anniversary-card__error" role="status">{dateSyncError}</small>}
          </section>
          {photos.length > 0 && (
            <div className="gallery-actions">
              <span className="photo-count"><strong>{photos.length}</strong> 张回忆</span>
              <button className="text-button" onClick={onClearAll}>清空相册</button>
            </div>
          )}
        </div>
      </section>

      {error && <div className="gallery-error" role="alert">{error}</div>}

      {photos.length === 0 ? (
        <section className="empty-gallery">
          <div className="empty-gallery__halo" aria-hidden="true" />
          <div className="empty-gallery__icon" aria-hidden="true">♡</div>
          <h3>从第一张照片开始，珍藏我们的故事</h3>
          {emptyUploader}
          <span className="empty-gallery__formats">支持多种图片格式 · JPG、PNG、WebP 原样保存，其他格式自动转为 JPG</span>
        </section>
      ) : (
        <section className="photo-grid" aria-label="我的照片">
          {photos.map((photo, index) => (
            <article className="photo-tile" key={photo.id} style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}>
              <button
                className="photo-tile__open"
                onClick={() => selectPhoto(photo.id)}
                aria-label={`放大查看${photo.name}`}
              >
                <img
                  src={photo.thumbnail || photo.dataUrl}
                  alt={photo.name}
                  loading="lazy"
                  decoding="async"
                />
                <span className="photo-tile__zoom" aria-hidden="true">⌕</span>
              </button>
              <div className="photo-tile__caption">
                <div>
                  <strong title={photo.name}>{photo.name}</strong>
                  <span>{formatSize(photo.size)}</span>
                </div>
                <button
                  className="photo-tile__delete"
                  onClick={() => void handleDelete(photo.id, photo.name)}
                  aria-label={`删除${photo.name}`}
                  title="删除照片"
                >
                  ×
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
