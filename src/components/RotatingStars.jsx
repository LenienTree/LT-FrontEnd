import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

const RotatingStars = () => {
  const starsRef = useRef();

  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.x += delta * 0.15; // Rotate only on X-axis
    }
  });

  return (
    <group ref={starsRef}>
      <Stars
        radius={500}
        depth={100}
        count={8000}
        factor={40}
        saturation={0}
        fade
        speed={0} // Disable built-in animation
      />
    </group>
  );
};

export default RotatingStars;
