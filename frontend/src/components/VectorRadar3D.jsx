import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * VectorRadar3D - Interactive 3D Dual-Vector Radar & Cosine Angle Simulator
 * 100% Offline & Procedural
 */
export function VectorRadar3D({ similarity = 0.75, className = "" }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);
    const groupRef = useRef(null);
    const vecBRef = useRef(null);
    const arcRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 340;
        const height = container.clientHeight || 220;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 1.2, 4.8);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x0f172a, 3.0);
        scene.add(ambientLight);

        const light = new THREE.PointLight(0x06b6d4, 4.0, 15);
        light.position.set(2, 3, 3);
        scene.add(light);

        const radarGroup = new THREE.Group();
        groupRef.current = radarGroup;
        scene.add(radarGroup);

        // 3D Wireframe Radar Sphere
        const sphereGeo = new THREE.SphereGeometry(1.6, 24, 16);
        const sphereMat = new THREE.MeshBasicMaterial({
            color: 0x1e1e38,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        radarGroup.add(sphere);

        // Radar Equator Ring
        const ringGeo = new THREE.TorusGeometry(1.6, 0.015, 12, 60);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        radarGroup.add(ring);

        // Origin Node
        const originGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const origin = new THREE.Mesh(originGeo, originMat);
        radarGroup.add(origin);

        // Vector A Arrow (Cyan - Text Embedding MiniLM)
        const dirA = new THREE.Vector3(1.1, 0.7, 0.5).normalize();
        const arrowA = new THREE.ArrowHelper(dirA, new THREE.Vector3(0, 0, 0), 1.55, 0x06b6d4, 0.2, 0.08);
        radarGroup.add(arrowA);

        // Vector B Arrow (Pink - Target / Image Embedding CLIP)
        // Angle depends on similarity (similarity close to 1 => closer to dirA)
        const angle = Math.acos(Math.max(-1, Math.min(1, similarity)));
        const dirB = new THREE.Vector3(
            Math.cos(angle) * dirA.x + Math.sin(angle) * 0.8,
            Math.cos(angle) * dirA.y - Math.sin(angle) * 0.4,
            Math.cos(angle) * dirA.z + Math.sin(angle) * 0.6
        ).normalize();

        const arrowB = new THREE.ArrowHelper(dirB, new THREE.Vector3(0, 0, 0), 1.55, 0xec4899, 0.2, 0.08);
        vecBRef.current = arrowB;
        radarGroup.add(arrowB);

        // Angular Arc between vectors
        const curve = new THREE.QuadraticBezierCurve3(
            dirA.clone().multiplyScalar(0.7),
            new THREE.Vector3(0.5, 0.5, 0.5),
            dirB.clone().multiplyScalar(0.7)
        );
        const arcPoints = curve.getPoints(20);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
        const arcMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
        const arc = new THREE.Line(arcGeo, arcMat);
        arcRef.current = arc;
        radarGroup.add(arc);

        let clock = new THREE.Clock();

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            if (groupRef.current) {
                groupRef.current.rotation.y = t * 0.15;
                groupRef.current.rotation.x = Math.sin(t * 0.4) * 0.15;
            }

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
    }, [similarity]);

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
            <div ref={containerRef} className="w-full h-44 sm:h-52 cursor-pointer" />
            <div className="absolute pointer-events-none w-36 h-36 rounded-full bg-cyan-500/15 blur-2xl animate-pulse" />
        </div>
    );
}

export default VectorRadar3D;
