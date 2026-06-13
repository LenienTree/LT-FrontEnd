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

  const setPose = (pose, opts = {}) => {
    if (!meshRef.current) return;

    const { duration = 0.35, ease = "power2.out" } = opts;

    gsap.to(meshRef.current.position, {
      ...pose.position,
      duration,
      ease,
    });

    if (pose.scale) {
      gsap.to(meshRef.current.scale, {
        ...pose.scale,
        duration,
        ease,
      });
    }

    if (pose.rotation) {
      gsap.to(meshRef.current.rotation, {
        ...pose.rotation,
        duration,
        ease,
      });
    }
  };

  const { scene: threeScene } = useThree();
  const glowRef = useRef();

  const [
    eventSectionRef,
    heroSectionRef,
    journeyRef,
    teamRef,
    journeyPointsRef,
    stateHeadRef,
    connectRef,
  ] = scrollRef;

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
      meshRef.current.rotation.y += 0.0001;
    }
  });

useEffect(() => {
  const ctx = gsap.context(() => {
    if (
      !meshRef.current ||
      !heroSectionRef?.current ||
      !teamRef?.current ||
      !eventSectionRef?.current
    ) return;

    const heroPose = {
      position: { x: -11.4, y: -8, z: 0 },
      scale: { x: 0.00305, y: 0.00305, z: 0.00305 },
    };

    const heroExit = {
      position: { x: -13.4, y: 80, z: 0 },
    };

    const teamPose = {
      position: { x: -16.4, y: -2, z: 0 },
      scale: { x: 0.00305, y: 0.00305, z: 0.00305 },
    };

    const vanishScale = {
      x: 0.000001,
      y: 0.000001,
      z: 0.000001,
    };

    const vanishUp = { x: -13.4, y: 140, z: 0 };

    // HERO (pose only)
    ScrollTrigger.create({
      trigger: heroSectionRef.current,
      start: "top top",
      end: "bottom top",
      onEnter: () => setPose(heroPose),
      onEnterBack: () => setPose(heroPose),
    });

    // HERO LEAVE (when event begins)
    ScrollTrigger.create({
      trigger: eventSectionRef.current,
      start: "top 50%",
      onEnter: () => {
        gsap.to(meshRef.current.position, {
          ...heroExit.position,
          duration: 0.6,
          ease: "power2.in",
        });
      },
      onLeaveBack: () => {
        setPose(heroPose, { duration: 0.4 });
      },
    });

   ScrollTrigger.create({
      trigger: teamRef.current,
      start: "top 50%",
      end: "bottom 50%",

      // ✅ ENTER TEAM (scroll down)
      onEnter: () => {
        gsap.killTweensOf(meshRef.current);
        gsap.to(meshRef.current.position, {
          ...teamPose.position,
          duration: 0.6,
          ease: "power2.out",
        });
        gsap.to(meshRef.current.scale, {
          ...teamPose.scale,
          duration: 0.4,
          ease: "power2.out",
        });
      },

      // ✅ ENTER TEAM (scroll up)
      onEnterBack: () => {
        gsap.killTweensOf(meshRef.current);
        gsap.to(meshRef.current.position, {
          ...teamPose.position,
          duration: 0.6,
          ease: "power2.out",
        });
        gsap.to(meshRef.current.scale, {
          ...teamPose.scale,
          duration: 0.4,
          ease: "power2.out",
        });
      },

      // ❌ LEAVE TEAM (scroll down)
      onLeave: () => {
        gsap.killTweensOf(meshRef.current.scale);
        gsap.to(meshRef.current.scale, {
          ...vanishScale,
          duration: 0.35,
          ease: "power2.in",
        });
      },

      // ❌ LEAVE TEAM (scroll up)
      onLeaveBack: () => {
        gsap.killTweensOf(meshRef.current.scale);
        gsap.to(meshRef.current.scale, {
          ...vanishScale,
          duration: 0.35,
          ease: "power2.in",
        });
      },
    });
  });


  return () => ctx.revert();
}, []);




  useEffect(() => {
    const ctx = gsap.context(() => {
      if (
        !meshRef.current ||
        !heroSectionRef?.current ||
        !eventSectionRef?.current ||
        !teamRef?.current ||
        !journeyRef?.current ||
        !stateHeadRef?.current ||
        !connectRef?.current
      )
        return;

      // if (heroSectionRef?.current && meshRef.current) {
      //   // POSITION (scrub back + forth)
      //   gsap.to(meshRef.current.position, {
      //     x: -13.4,
      //     y: -8,
      //     z: 0,
      //     ease: "none",
      //     scrollTrigger: {
      //       trigger: heroSectionRef.current,
      //       start: "top bottom",
      //       end: "bottom top",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });

      //   // SCALE (scrub back + forth)
      //   gsap.to(meshRef.current.scale, {
      //     x: 0.00305,
      //     y: 0.00305,
      //     z: 0.00305,
      //     ease: "none",
      //     scrollTrigger: {
      //       trigger: heroSectionRef.current,
      //       start: "top bottom",
      //       end: "bottom top",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });
      // }

      // if (eventSectionRef?.current && meshRef.current) {
      //   const tl = gsap.timeline({
      //     scrollTrigger: {
      //       trigger: eventSectionRef.current,
      //       start: "top top",
      //       end: "bottom top",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });
      //   tl.to(
      //     meshRef.current.position,
      //     { x: -11, y: 9, duration: 0.5, ease: "power1.out" },
      //     ">",
      //   );

      //   tl.to(meshRef.current.position, {
      //     x: -11,
      //     y: 100,
      //     ease: "none",
      //   });
      // }
      // if (teamRef?.current && meshRef.current) {
      //   const tl = gsap.timeline({
      //     scrollTrigger: {
      //       trigger: teamRef.current,
      //       start: "top 70%",
      //       end: "top top",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });
      //   tl.fromTo(
      //     meshRef.current.position,
      //     { x: -100, y: 8 },
      //     {
      //       x: -16.4,
      //       y: -2,
      //       duration: 0.5,
      //       ease: "power1.out",
      //     },
      //     ">",
      //   );
      //   meshRef.current.traverse((child) => {
      //     if (!child.isMesh || !child.material) return;

      //     const materials = Array.isArray(child.material)
      //       ? child.material
      //       : [child.material];

      //     materials.forEach((mat) => {
      //       mat.transparent = true;
      //       mat.depthWrite = false;

      //       gsap.to(mat, {
      //         opacity: 0,
      //         scrollTrigger: {
      //           trigger: teamRef.current,
      //           start: "bottom bottom", // 👈 almost reached
      //           end: "bottom top",
      //           scrub: true,
      //         },
      //       });
      //     });
      //   });
      // }

      // if (stateHeadRef?.current && meshRef.current) {
      //   const tl2 = gsap.timeline({
      //     scrollTrigger: {
      //       trigger: stateHeadRef.current,
      //       start: "top 80%",
      //       end: "top 80%",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });

      //   meshRef.current.traverse((child) => {
      //     if (!child.isMesh || !child.material) return;

      //     const materials = Array.isArray(child.material)
      //       ? child.material
      //       : [child.material];

      //     materials.forEach((mat) => {
      //       mat.transparent = true;
      //       mat.depthWrite = false;

      //       tl2.to(mat, { opacity: 0, duration: 1 }, 0);
      //     });
      //   });
      // }
      // if (connectRef?.current && meshRef.current) {
      //   const tl = gsap.timeline({
      //     scrollTrigger: {
      //       trigger: connectRef.current,
      //       start: "top top",
      //       end: "top top",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });
      //   tl.to(meshRef.current.position, {
      //     x: -11,
      //     y: 9,
      //     duration: 0.5,
      //     ease: "power1.out",
      //   });
      // }

      // if (teamRef?.current) {
      //   ScrollTrigger.create({
      //     trigger: teamRef.current,
      //     start: "top top",
      //     end: () => "+=" + window.innerHeight * 5, // 👈 5 scrolls
      //     pin: true,
      //     scrub: false,
      //     markers: true,
      //   });
      // }

      // if (heroSectionRef.current && meshRef.current) {
      //   const tl = gsap.timeline({
      //     scrollTrigger: {
      //       trigger: heroSectionRef.current,
      //       start: "top 100%",
      //       end: "bottom 120%",
      //       scrub: true,
      //       // markers: true,
      //     },
      //   });
      //   meshRef.current.traverse((child) => {
      //     if (child.isMesh && child.material) {
      //       child.material.transparent = true; // REQUIRED
      //       tl.to(child.material, { opacity: 1 }, 0); // 1, not 100
      //     }
      //   });
      //   meshRef.current.traverse((child) => {
      //     if (child.isMesh && child.material) {
      //       child.material.transparent = true;
      //     }
      //   });

      //   tl.to(
      //     meshRef.current.position,
      //     { x: -30, y: -3, duration: 1, ease: "power1.out" },
      //     ">",
      //   );

      //   tl.to(
      //     meshRef.current.scale,
      //     {
      //       x: 0.0042,
      //       y: 0.00424,
      //       z: 0.00424,
      //       duration: 1,
      //       ease: "power1.out",
      //     },
      //     "<",
      //   );

      //   // Animate glow with the mesh
      //   // tl.to(
      //   //   glowRef.current.position,
      //   //   { x: -30, y: -3, duration: 1, ease: "power1.out" },
      //   //   "<"
      //   // );
      //   // tl.to(
      //   //   glowRef.current.scale,
      //   //   { x: 4, y: 4, z: 4, duration: 1, ease: "power1.out" },
      //   //   "<"
      //   // );
      // }
    });
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
          position={[-8.4, -12, 0]}
          scale={[0.00305, 0.00305, 0.00305]}
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
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-opacity-0 bg-[#003138]">
        <Canvas
          eventSource={undefined}
          eventPrefix="client"
          style={{ pointerEvents: "none", backgroundColor: "#022F2E" }}
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
            <EarthSphere className="z-40" scrollRef={scrollRef} />
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
