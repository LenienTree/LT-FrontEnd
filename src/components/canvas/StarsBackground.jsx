import { Canvas } from "@react-three/fiber";
import SparkleStars from "./SparkleStars";

export function StarsBackground() {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }} gl={{ antialias: false }} style={{ pointerEvents: "none", backgroundColor: "#022f2e" }}>
                <SparkleStars />
            </Canvas>
        </div>
    );
}