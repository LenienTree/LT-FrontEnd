import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  useGLTF,
  Environment,
  OrbitControls,
  useProgress,
  GradientTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { useRef, useEffect, useState, Suspense } from "react";
import { useMemo } from "react";
import gsap from "gsap";
// import Particles from "../components/animations/Particles"
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StarsCanvas } from "./canvas";

gsap.registerPlugin(ScrollTrigger);

function SparkleStars() {
  const starsRef = useRef();

  // Generate random star positions inside a spherical shell [100, 200] radius
  const starPositions = useMemo(() => {
    const positions = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      const radius = 100 + Math.random() * 100;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  // Generate initial white color for each star
  const starColors = useMemo(() => {
    const colors = new Float32Array(5000 * 3);
    for (let i = 0; i < 5000; i++) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
    return colors;
  }, []);

  // Animate sparkle effect by changing color intensity over time
  useFrame(({ clock }) => {
    if (starsRef.current) {
      const time = clock.getElapsedTime();
      const colors = starsRef.current.geometry.attributes.color.array;

      for (let i = 0; i < 5000; i++) {
        const intensity = Math.sin(time * 2 + i * 0.1) * 0.5 + 0.5;
        colors[i * 3] = intensity;
        colors[i * 3 + 1] = intensity;
        colors[i * 3 + 2] = intensity;
      }

      starsRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starPositions.length / 3}
          array={starPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={starColors.length / 3}
          array={starColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.9}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}

function EarthSphere({ scrollRef }) {
  const { scene } = useGLTF("/earth/scene.gltf");
  const { camera } = useThree();
  const meshRef = useRef();
  const materialRef = useRef();

  const { scene: threeScene } = useThree();
  const glowRef = useRef();

  const [heroSectionRef, founderSectionRef, organizeSectionRef , teamSectionRef] = scrollRef;

  const [modelScale, setModelScale] = useState(1);

  useEffect(() => {
    if (scene) {
      // Calculate scale
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      // const center = box.getCenter(new THREE.Vector3());

      const maxDimension = Math.max(size.x, size.y, size.z);
      const targetSize = 9;
      const scaleFactor = targetSize / maxDimension;

      setModelScale(scaleFactor);
      // scene.position.sub(center);

      // Apply green emissive glow to all meshes
      scene.traverse((child) => {
        if (child.isMesh) {
          // Make the material glow green
          if (child.material) {
            // child.material.emissive = new THREE.Color(0x00ff88); // Green color
            // child.material.emissiveIntensity = 1.5; // Glow intensity
            // child.material.toneMapped = false; // Important for bloom!
            // child.material.needsUpdate = true;
          }
        }
      });
    }
  }, [scene]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (
        !meshRef.current ||
        !heroSectionRef?.current ||
        !organizeSectionRef?.current
      )
        return;

      if (heroSectionRef.current && meshRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: "top 100%",
            end: "bottom 120%",
            scrub: true,
            // markers: true,
          },
        });
       meshRef.current.traverse((child) => {
  if (child.isMesh && child.material) {
    child.material.transparent = true; // REQUIRED
    tl.to(child.material, { opacity: 1 }, 0); // 1, not 100
  }
});
meshRef.current.traverse((child) => {
  if (child.isMesh && child.material) {
    child.material.transparent = true;
  }
});

        tl.to(
          meshRef.current.position,
          { x: -30, y: -3, duration: 1, ease: "power1.out" },
          ">"
        );

        tl.to(
          meshRef.current.scale,
          {
            x: 0.0042,
            y: 0.00424,
            z: 0.00424,
            duration: 1,
            ease: "power1.out",
          },
          "<"
        );

        // Animate glow with the mesh
        // tl.to(
        //   glowRef.current.position,
        //   { x: -30, y: -3, duration: 1, ease: "power1.out" },
        //   "<"
        // );
        // tl.to(
        //   glowRef.current.scale,
        //   { x: 4, y: 4, z: 4, duration: 1, ease: "power1.out" },
        //   "<"
        // );
      }
      if (founderSectionRef.current && meshRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: founderSectionRef.current,
            start: "top 100%",
            end: "bottom 120%",
            scrub: true,
            toggleActions: "play none none reset",
            // markers: true,
          },
        });
        tl.to(
          meshRef.current.position,
          { x: 0.1, y: -0.7, duration: 2, ease: "power1.out" },
          ">"
        );

        tl.to(
          meshRef.current.scale,
          {
            x: 0.00105,
            y: 0.001051,
            z: 0.001051,
            duration: 1,
            ease: "power1.out",
          },
          "<"
        );

        // Animate glow
        // tl.to(
        //   glowRef.current.position,
        //   { x: 0.1, y: -0.6, duration: 2, ease: "power1.out" },
        //   "<"
        // );
        // tl.to(
        //   glowRef.current.scale,
        //   { x: 1, y: 1, z: 1, duration: 1, ease: "power1.out" },
        //   "<"
        // );
      }
      if (organizeSectionRef.current && meshRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: organizeSectionRef.current,
            start: "top 100%",
            end: "bottom 120%",
            scrub: true,
            // markers: true,
          },
        });
        meshRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            tl.to(child.material, { opacity: 0 }, 0);
          }
        });

        // Animate glow
        // tl.to(
        //   glowRef.current.position,
        //   { x: 0.1, y: -0.6, duration: 2, ease: "power1.out" },
        //   "<"
        // );
        // tl.to(
        //   glowRef.current.scale,
        //   { x: 1, y: 1, z: 1, duration: 1, ease: "power1.out" },
        //   "<"
        // );
      }
      if (teamSectionRef.current && meshRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: teamSectionRef.current,
            start: "top 100%",
            end: "bottom 120%",
            scrub: true,
            // markers: true,
          },
        });
        meshRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            tl.to(child.material, { opacity: 0 }, 0);
          }
        });
      }
    }, [scrollRef]);
    return () => ctx.revert();
  }, []);

  // Custom shader for atmospheric glow
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: {
      c: { value: 0.5 },
      p: { value: 4.5 },
      glowColor: { value: new THREE.Color(0x00ff88) },
      viewVector: { value: camera.position },
    },
    vertexShader: `
      uniform vec3 viewVector;
      varying float intensity;
      void main() {
        vec3 vNormal = normalize(normalMatrix * normal);
        vec3 vNormel = normalize(normalMatrix * viewVector);
        intensity = pow(0.7 - dot(vNormal, vNormel), 3.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying float intensity;
      void main() {
        vec3 glow = glowColor * intensity;
        gl_FragColor = vec4(glow, intensity);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  return (
    <>
      <group>
        {/* Main Earth mesh */}
        <primitive
          object={scene}
          ref={meshRef}
          position={[0.1, -0.7, 0]}
          scale={[0.00105, 0.00105, 0.00105]}
          dispose={null}
        />
        {/* <mesh ref={meshRef} position={[0.1, -1, 0]} scale={[1, 1, 1]}>
        <sphereGeometry args={[4.5, 64, 64]} />
        <meshStandardMaterial
          ref={materialRef}
          map={new THREE.TextureLoader().load("/earth/Surface.mat1.jpeg")}
          transparent
          opacity={1}
        />
      </mesh> */}

        {/* Glow layer - slightly larger */}
        {/* <mesh
          ref={glowRef}
          position={[0.1, -0.6, 0]}
          scale={[1.0001, 1.003, 1.01]}
        >
          <sphereGeometry args={[4.5, 64, 64]} />
          <primitive object={glowMaterial} attach="material" />
        </mesh> */}
      </group>
    </>
  );
}

function LoadingTracker({ onLoaded }) {
  const { active, progress } = useProgress();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!active && progress === 100 && !hasLoaded) {
      const timer = setTimeout(() => {
        setHasLoaded(true);
        if (onLoaded) onLoaded();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [active, progress, hasLoaded, onLoaded]);

  return null;
}

export default function Earth({ scrollRef, onLoaded }) {
  const darkTeal = [0x10 / 255, 0x20 / 255, 0x25 / 255]; // #102025 as [0.039, 0.078, 0.094]
  const black = [0, 0, 0];
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-[#102025]/90 to-black/95">
        <Canvas
          eventSource={undefined}
          eventPrefix="client"
          style={{
    background: 'linear-gradient(to bottom, #10b981, #000000)',pointerEvents : "none"
  }}
          // style={{ pointerEvents: "none" }}
          shadows
          gl={{
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ fov: 60, position: [0, 0, 11] }}
        >
          {/* <color attach="background" args={["#0c301d"]} /> */}
          {/* <color attach="background" args={["red"]} /> */}

          <Environment
            files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/venice_sunset_1k.hdr"
            background={false}
          />

          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} />

          <Suspense fallback={null}>
            <EarthSphere scrollRef={scrollRef} />
          </Suspense>

          {/* <StarsCanvas/> */}
          {/* <SparkleStars /> */}
          <LoadingTracker onLoaded={onLoaded} />

          {/* Add Bloom Effect */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={3} // Lower = more things glow
              luminanceSmoothing={0.9} // Smoothness of glow
              intensity={0.4} // Glow strength
              mipmapBlur // Better quality blur
            />
          </EffectComposer>
        </Canvas>
      </div>
    </>
  );
}

useGLTF.preload("/earth/scene.gltf");
