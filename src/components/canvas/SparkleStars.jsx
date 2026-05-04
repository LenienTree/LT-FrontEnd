import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

export default function SparkleStars() {
  const starsRef = useRef();

  const STAR_COUNT = 8000;
  const INNER = 100;
  const OUTER = 200;

  const starPositions = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const radius = INNER + Math.random() * (OUTER - INNER);
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const phi = Math.acos(u);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    return positions;
  }, []);

  useFrame(({ clock }) => {
    const points = starsRef.current;
    if (!points) return;

    const time = clock.getElapsedTime();
    const colors = points.geometry.attributes.color.array;

    for (let i = 0; i < STAR_COUNT; i++) {
      const intensity = Math.sin(time * 2 + i * 0.08) * 0.5 + 0.5;
      const idx = i * 3;

      colors[idx] = intensity;
      colors[idx + 1] = intensity;
      colors[idx + 2] = intensity;
    }

    points.geometry.attributes.color.needsUpdate = true;
  });

  const starColors = useMemo(() => {
    const colors = new Float32Array(STAR_COUNT * 3).fill(1);
    return colors;
  }, []);

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={starPositions}
          count={STAR_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={starColors}
          count={STAR_COUNT}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}