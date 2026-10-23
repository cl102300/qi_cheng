import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PhotoUploader } from '@/components/upload/PhotoUploader';
import { PhotoDetail } from '@/components/gallery/PhotoDetail';
import { PhotoGallery } from '@/components/gallery/PhotoGallery';
import { useAppStore } from '@/stores/appStore';
import { PhotoService } from '@/services/photoService';
import { dbService } from '@/services/db';
import { legacyDbService } from '@/services/legacyDb';
import { authService, type User } from '@/services/api';
import { MAX_PHOTOS } from '@/services/db';

const SceneCanvas = lazy(() => import('@/three/SceneCanvas').then((module) => ({ default: module.SceneCanvas })));
const SceneControls = lazy(() => import('@/components/controls/SceneControls').then((module) => ({ default: module.SceneControls })));

export default function App() {
  const { photos, addPhotos, replacePhotos, clearPhotos, settings, updateSettings } = useAppStore();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isSceneMode, setIsSceneMode] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [legacyPhotoCount, setLegacyPhotoCount] = useState(0);
  const [isImportingLegacy, setIsImportingLegacy] = useState(false);
  const photoRevision = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('heart-memories-settings');
      if (saved) updateSettings(JSON.parse(saved));
    } catch {
      // 设置损坏时使用默认值。
    }
  }, [updateSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('heart-memories-settings', JSON.stringify(settings));
    } catch {
      // 浏览器禁用本地设置时，仍可正常使用相册。
    }
  }, [settings]);

  useEffect(() => {
    let active = true;
    authService.currentUser().then((currentUser) => {
      if (active) setUser(currentUser);
    }).catch(() => {
      if (active) setAuthError('无法连接相册服务器，请检查服务器是否正常运行。');
    }).finally(() => {
      if (active) setIsCheckingAuth(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const refreshPhotos = async (initial = false) => {
      try {
        const snapshot = await PhotoService.loadFromDB(user.id);
        if (!active) return;
        if (!initial && photoRevision.current === snapshot.revision) {
          snapshot.photos.forEach(PhotoService.releasePhoto);
          return;
        }
        const currentIds = new Set(snapshot.photos.map((photo) => photo.id));
        useAppStore.getState().photos
          .filter((photo) => !currentIds.has(photo.id))
          .forEach(PhotoService.releasePhoto);
        photoRevision.current = snapshot.revision;
        replacePhotos(snapshot.photos);
        setStorageError(null);
        setIsReady(true);
      } catch (error) {
        if (!active) return;
        console.error('相册同步失败:', error);
        setStorageError('无法读取服务器相册，请检查网络后重试。');
        setIsReady(true);
      }
    };

    photoRevision.current = null;
    setIsReady(false);
    setLegacyPhotoCount(0);
    try {
      if (localStorage.getItem(`heart-memories-imported-${user.id}`) !== '1') {
        void legacyDbService.count().then(setLegacyPhotoCount).catch(() => setLegacyPhotoCount(0));
      }
    } catch {
      void legacyDbService.count().then(setLegacyPhotoCount).catch(() => setLegacyPhotoCount(0));
    }
    void refreshPhotos(true);
    const timer = window.setInterval(() => void refreshPhotos(), 15_000);
    const onFocus = () => void refreshPhotos();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, replacePhotos]);

  useEffect(() => {
    if (photos.length === 0) setIsSceneMode(false);
  }, [photos.length]);

  const handleClearAll = async () => {
    if (!window.confirm(`确定删除全部 ${photos.length} 张照片吗？此操作不可撤销。`)) return;
    try {
      await PhotoService.clearFromDB();
      photos.forEach(PhotoService.releasePhoto);
      clearPhotos();
      setStorageError(null);
      setIsSceneMode(false);
    } catch {
      setStorageError('清空失败，请检查网络连接后重试。');
    }
  };

  const handleImportLegacy = async () => {
    if (!user) return;
    if (!window.confirm(`检测到这台设备还有 ${legacyPhotoCount} 张旧照片。将可读取的照片上传到“${user.username}”账户。是否继续？`)) return;
    setIsImportingLegacy(true);
    setStorageError(null);
    let oldPhotos: Awaited<ReturnType<typeof PhotoService.loadLegacyFromDB>> = [];
    try {
      oldPhotos = await PhotoService.loadLegacyFromDB();
      if (oldPhotos.length > MAX_PHOTOS - photos.length) {
        throw new Error(`当前账户最多还能保存 ${MAX_PHOTOS - photos.length} 张照片，请先清理相册后再导入。`);
      }
      if (oldPhotos.length === 0) {
        setLegacyPhotoCount(0);
        return;
      }
      const savedPhotos = await PhotoService.saveToDB(oldPhotos);
      addPhotos(savedPhotos);
      try {
        localStorage.setItem(`heart-memories-imported-${user.id}`, '1');
      } catch {
        // 仍尝试清理已经迁入账户的旧数据。
      }
      setLegacyPhotoCount(0);
      if (oldPhotos.length === legacyPhotoCount) {
        try {
          await legacyDbService.clearAll();
        } catch {
          setStorageError('照片已导入账户，但这台设备上的旧缓存未能清理。');
        }
      } else {
        setStorageError(`已导入 ${oldPhotos.length} 张可读取的旧照片，其余照片仍保留在这台设备的旧缓存中。`);
      }
    } catch (error) {
      oldPhotos.forEach(PhotoService.releasePhoto);
      setStorageError(error instanceof Error ? error.message : '导入旧照片失败，请重试。');
    } finally {
      setIsImportingLegacy(false);
    }
  };

  const handleSignOut = async () => {
    await authService.logout().catch(() => undefined);
    photos.forEach(PhotoService.releasePhoto);
    clearPhotos();
    dbService.invalidate();
    photoRevision.current = null;
    setIsReady(false);
    setIsSceneMode(false);
    setUser(null);
  };

  if (isCheckingAuth || !user) {
    return (
      <AuthScreen
        isChecking={isCheckingAuth}
        initialError={authError}
        onAuthenticated={(authenticatedUser) => {
          setAuthError(null);
          setUser(authenticatedUser);
        }}
      />
    );
  }

  return (
    <div className={`app-shell${isSceneMode ? ' app-shell--scene' : ''}`}>
      <div className="ambient-light ambient-light--rose" aria-hidden="true" />
      <div className="ambient-light ambient-light--gold" aria-hidden="true" />

      <header className="app-header">
        <a className="brand" href="#top" aria-label="Heart Memories 首页">
          <span className="brand__mark" aria-hidden="true">♥</span>
          <span className="brand__copy">
            <strong>HEART MEMORIES</strong>
            <small>珍藏我们俩的每一个瞬间</small>
          </span>
        </a>

        <div className="header-right">
          <div className="header-actions">
            <span className="storage-badge" title="照片已保存到服务器数据库，同一账户的设备可以共享相册。">
              <span className="storage-badge__dot" />
              服务器已同步
            </span>
            {legacyPhotoCount > 0 && (
              <button className="button button--quiet" onClick={() => void handleImportLegacy()} disabled={isImportingLegacy}>
                {isImportingLegacy ? '正在导入…' : `导入旧照片（${legacyPhotoCount}）`}
              </button>
            )}
            {photos.length > 0 && (
              <>
                <button className="button button--quiet" onClick={() => setIsSceneMode((value) => !value)} disabled={isImportingLegacy}>
                  {isSceneMode ? '照片墙' : '三维展览'}
                </button>
                <PhotoUploader disabled={!isReady || isImportingLegacy} />
                {isSceneMode && <button className="button button--danger" onClick={() => void handleClearAll()} disabled={isImportingLegacy}>清空</button>}
              </>
            )}
          </div>
          <div className="header-account">
            <span className="account-name" title={user.username}>{user.username}</span>
            <button className="button button--quiet" onClick={() => void handleSignOut()} disabled={isImportingLegacy}>退出登录</button>
          </div>
        </div>
      </header>

      {storageError && <div className="storage-error" role="alert">{storageError}</div>}

      {isSceneMode ? (
        <Suspense fallback={<div className="scene-loading">正在准备三维展览…</div>}>
          <div className="scene-canvas"><SceneCanvas /></div>
          <div className="scene-hint">拖动旋转 · 滚轮缩放 · 点击照片查看大图</div>
          <SceneControls />
        </Suspense>
      ) : (
        <PhotoGallery
          emptyUploader={<PhotoUploader variant="hero" disabled={!isReady || isImportingLegacy} />}
          onClearAll={() => void handleClearAll()}
        />
      )}
      <PhotoDetail />
    </div>
  );
}
