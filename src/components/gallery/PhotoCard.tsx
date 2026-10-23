import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Photo } from '@/types';

interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  showFilmDetails: boolean;
  onClick: (id: string) => void;
}

export function PhotoCard({ photo, isSelected, showFilmDetails, onClick }: PhotoCardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const currentScale = useRef(1);
  const targetScale = useRef(1);

  // 计算照片尺寸
  const { width, height } = useMemo(() => {
    const baseWidth = isSelected ? 3.0 : 2.0;
    return {
      width: baseWidth,
      height: baseWidth * (5 / 4),
    };
  }, [isSelected]);

  // 创建纹理
  const texture = useMemo(() => {
    const url = photo.thumbnail || photo.dataUrl;
    if (!url) return null;
    try {
      const tex = new THREE.TextureLoader().load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    } catch {
      return null;
    }
  }, [photo.thumbnail, photo.dataUrl]);

  const borderColor = isSelected ? 0xff6b9e : 0x4488ff;

  // 动画循环
  useFrame(({ clock }) => {
    if (!groupRef.current || !meshRef.current) return;

    const t = clock.getElapsedTime();

    // 平滑缩放过渡
    targetScale.current = isSelected ? 1.3 : 1;
    currentScale.current += (targetScale.current - currentScale.current) * 0.1;
    groupRef.current.scale.setScalar(currentScale.current * photo.scale);

    // 照片自转动画
    if (!isSelected) {
      const phase = photo.id.charCodeAt(0) * 0.1;
      meshRef.current.rotation.y = Math.sin(t * 0.1 + phase) * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.07 + phase) * 0.05;
    } else {
      meshRef.current.rotation.y *= 0.95;
      meshRef.current.rotation.x *= 0.95;
    }

    // 浮动动画
    const floatOffset = Math.sin(t * 0.6 + photo.id.charCodeAt(0) * 0.05) * 0.08;
    groupRef.current.position.y = photo.position.y + floatOffset;
  });

  return (
    <group
      ref={groupRef}
      position={[photo.position.x, photo.position.y, photo.position.z]}
      rotation={[photo.position.rx, photo.position.ry, photo.position.rz]}
    >
      {/* 照片主体 */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(photo.id);
        }}
      >
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          color={0xffffff}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 发光边框 */}
      {isSelected && (
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[width + 0.2, height + 0.2]} />
          <meshBasicMaterial
            color={borderColor}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {showFilmDetails ? (
        <>
          {/* 数量较少时显示胶片边缘和齿孔装饰。 */}
          <mesh position={[0, height / 2 + 0.05, 0.01]}>
            <planeGeometry args={[width + 0.15, 0.1]} />
            <meshStandardMaterial color={isSelected ? 0xffaa44 : 0x665544} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -height / 2 - 0.05, 0.01]}>
            <planeGeometry args={[width + 0.15, 0.1]} />
            <meshStandardMaterial color={isSelected ? 0xffaa44 : 0x665544} metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          {Array.from({ length: 8 }).flatMap((_, i) => [
            <mesh key={`left-${i}`} position={[-width / 2 - 0.06, height / 2 - 0.1 - i * 0.2, 0.02]}>
              <circleGeometry args={[0.03, 8]} />
              <meshStandardMaterial color={0x1a1a1a} side={THREE.DoubleSide} />
            </mesh>,
            <mesh key={`right-${i}`} position={[width / 2 + 0.06, height / 2 - 0.1 - i * 0.2, 0.02]}>
              <circleGeometry args={[0.03, 8]} />
              <meshStandardMaterial color={0x1a1a1a} side={THREE.DoubleSide} />
            </mesh>,
          ])}
        </>
      ) : (
        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[width + 0.08, height + 0.08]} />
          <meshBasicMaterial color={isSelected ? 0xffaa44 : 0x2b2630} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
