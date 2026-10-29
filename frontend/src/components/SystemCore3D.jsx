import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * SystemCore3D - Interactive 3D Cybernetic Reactor Core for System Status
 * 100% Offline & Procedural
 */
export function SystemCore3D({ status = "healthy", className = "" }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);
    const coreRef = useRef(null);
    const ringsRef = useRef([]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 320;
        const height = container.clientHeight || 200;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 1.0, 4.8);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x0a0f1d, 3.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x10b981, 4.0, 15);
        pointLight.position.set(2, 3, 3);
        scene.add(pointLight);

        const reactorGroup = new THREE.Group();
        scene.add(reactorGroup);

        // Reactor Core: 3D Torus Knot
        const knotGeo = new THREE.TorusKnotGeometry(0.65, 0.18, 64, 16, 2, 3);
        const knotMat = new THREE.MeshPhysicalMaterial({
            color: 0x064e3b,
            emissive: 0x10b981,
            emissiveIntensity: 0.8,
            metalness: 0.9,
            roughness: 0.15,
            clearcoat: 1.0,
        });
        const knot = new THREE.Mesh(knotGeo, knotMat);
        coreRef.current = knot;
        reactorGroup.add(knot);

        // Surrounding Telemetry Rings
        const ringConfigs = [
            { r: 1.35, color: 0x06b6d4, speed: 0.015, rotX: Math.PI / 4 },
            { r: 1.6, color: 0x10b981, speed: -0.012, rotX: -Math.PI / 3 },
            { r: 1.85, color: 0x6366f1, speed: 0.009, rotX: Math.PI / 6 },
        ];

        const ringMeshes = [];
        ringConfigs.forEach((cfg) => {
            const geo = new THREE.TorusGeometry(cfg.r, 0.015, 12, 64);
            const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.75 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = cfg.rotX;
            reactorGroup.add(mesh);
            ringMeshes.push({ mesh, speed: cfg.speed });
        });
        ringsRef.current = ringMeshes;

        let clock = new THREE.Clock();

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            if (coreRef.current) {
                coreRef.current.rotation.y += 0.015;
                coreRef.current.rotation.x = Math.sin(t * 0.8) * 0.15;
            }

            ringMeshes.forEach((r) => {
                r.mesh.rotation.z += r.speed;
            });

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener("resize", handleResize);
            if (rendererRef.current && rendererRef.current.domElement) {
                try {
                    container.removeChild(rendererRef.current.domElement);
                    rendererRef.current.dispose();
                } catch { /* ignore */ }
            }
        };
    }, []);

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
            <div ref={containerRef} className="w-full h-44 sm:h-52 cursor-pointer" />
            <div className="absolute pointer-events-none w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl animate-pulse" />
        </div>
    );
}

export default SystemCore3D;
