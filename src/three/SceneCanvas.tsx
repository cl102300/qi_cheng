import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/stores/appStore';
import { PhotoCards } from '@/components/gallery/PhotoCards';
import { StarField } from '@/three/particles/StarField';

// 宇宙背景组件
function CosmicBackground() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.005;
  });

  return (
    <group ref={groupRef}>
      {/* 远景星云 */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 40,
            -30 - Math.random() * 30,
          ]}
        >
          <sphereGeometry args={[6 + Math.random() * 10, 16, 16]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? 0x2244aa : 0xaa2266}
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export function SceneCanvas() {
  const { photos, layout, settings, camera, setCamera, selectedPhotoId } = useAppStore();
  const controlsRef = useRef<any>(null);

  // 相机位置计算
  const getCameraPosition = (theta: number, phi: number, distance: number) => {
    return new THREE.Vector3(
      distance * Math.sin(phi) * Math.sin(theta),
      distance * Math.cos(phi),
      distance * Math.sin(phi) * Math.cos(theta)
    );
  };

  // 同步相机
  useEffect(() => {
    if (!controlsRef.current) return;
    const { theta, phi, distance } = camera;
    const pos = getCameraPosition(theta, phi, distance);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.object.position.copy(pos);
    controlsRef.current.object.lookAt(0, 0, 0);
    controlsRef.current.update();
  }, [camera]);

  return (
    <Canvas
      camera={{
        position: [0, 5, 20],
        fov: 55,
        near: 0.1,
        far: 1000,
      }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
      }}
    >
      {/* 宇宙背景 */}
      <CosmicBackground />

      {/* 星空粒子 */}
      <StarField count={500} />

      {/* 灯光 */}
      <ambientLight color={0x222244} intensity={0.6} />
      <pointLight position={[10, 10, 10]} color={0xff88aa} intensity={1.5} distance={50} decay={2} />
      <pointLight position={[-10, 5, -10]} color={0x4488ff} intensity={1} distance={40} decay={2} />

      {/* 照片卡片 */}
      {photos.length > 0 && (
        <PhotoCards
          photos={photos}
          layout={layout}
          selectedPhotoId={selectedPhotoId}
        />
      )}

      {/* 轨道控制器 */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={0.5}
        minDistance={8}
        maxDistance={40}
        enablePan={false}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.15}
        onEnd={(e: any) => {
          if (e?.target?.object) {
            const pos = e.target.object.position;
            const theta = Math.atan2(pos.x, pos.z);
            const phi = Math.acos(pos.y / pos.length());
            const distance = pos.length();
            setCamera({ theta, phi, distance });
          }
        }}
      />
    </Canvas>
  );
}
