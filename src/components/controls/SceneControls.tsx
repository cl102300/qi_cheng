import { useAppStore } from '@/stores/appStore';

export function SceneControls() {
  const { settings, updateSettings, resetCamera } = useAppStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: 'max(12px, env(safe-area-inset-bottom))',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: 'calc(100vw - 24px)',
      gap: 10,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(15px)',
      padding: '12px 20px',
      borderRadius: 30,
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <button
        onClick={() => updateSettings({ autoRotate: !settings.autoRotate })}
        style={{
          background: settings.autoRotate ? 'linear-gradient(135deg, rgba(255, 107, 158, 0.8), rgba(255, 143, 171, 0.8))' : 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          border: 'none',
          borderRadius: 15,
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: 13,
          transition: 'all 0.3s ease',
        }}
      >
        {settings.autoRotate ? '暂停旋转' : '继续旋转'}
      </button>

      <button
        onClick={resetCamera}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#ffb6c1',
          border: '1px solid rgba(255, 182, 193, 0.3)',
          borderRadius: 15,
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: 13,
          transition: 'all 0.3s ease',
        }}
      >
        重置视角
      </button>

    </div>
  );
}
