import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * IngestHologramScanner - 3D Ingestion Chamber & Laser Scanner
 * 100% Offline & Procedural Three.js
 */
export function IngestHologramScanner({ isUploading = false, isDragActive = false, className = "" }) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);

    const prismRef = useRef(null);
    const laserBeamRef = useRef(null);
    const ring1Ref = useRef(null);
    const ring2Ref = useRef(null);
    const particlesRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 200;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 1.8, 4.5);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x0f172a, 3.0);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x06b6d4, 4.0, 15);
        pointLight.position.set(2, 3, 3);
        scene.add(pointLight);

        const scannerGroup = new THREE.Group();
        scene.add(scannerGroup);

        // 1. Scanner Pad Base (Concentric neon rings)
        const padGeo = new THREE.CylinderGeometry(1.6, 1.7, 0.1, 40);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x090d16,
            metalness: 0.9,
            roughness: 0.2,
        });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.y = -0.8;
        scannerGroup.add(pad);

        // Pad Outer Neon Ring
        const ring1Geo = new THREE.TorusGeometry(1.62, 0.02, 16, 60);
        const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
        const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = -0.74;
        ring1Ref.current = ring1;
        scannerGroup.add(ring1);

        // Inner Rotating Scanner Gyro Ring
        const ring2Geo = new THREE.TorusGeometry(1.2, 0.018, 16, 60);
        const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.75 });
        const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = -0.72;
        ring2Ref.current = ring2;
        scannerGroup.add(ring2);

        // 2. Central Floating Document / Data Crystal
        const prismGeo = new THREE.OctahedronGeometry(0.75, 0);
        const prismMat = new THREE.MeshPhysicalMaterial({
            color: 0x1e1b4b,
            emissive: 0x6366f1,
            emissiveIntensity: 0.6,
            roughness: 0.1,
            metalness: 0.85,
            clearcoat: 1.0,
            wireframe: false,
        });
        const prism = new THREE.Mesh(prismGeo, prismMat);
        prism.position.y = 0.2;
        prismRef.current = prism;
        scannerGroup.add(prism);

        // Outer Wireframe Hologram Casing
        const wireGeo = new THREE.OctahedronGeometry(0.85, 0);
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.35 });
        const wireCasing = new THREE.Mesh(wireGeo, wireMat);
        wireCasing.position.y = 0.2;
        scannerGroup.add(wireCasing);

        // 3. Laser Scanner Sweep Plane
        const laserGeo = new THREE.RingGeometry(0.1, 1.1, 32);
        const laserMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45,
        });
        const laserBeam = new THREE.Mesh(laserGeo, laserMat);
        laserBeam.rotation.x = Math.PI / 2;
        laserBeam.position.y = 0.2;
        laserBeamRef.current = laserBeam;
        scannerGroup.add(laserBeam);

        // 4. Floating Vector Shard Particles
        const count = 90;
        const pGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const c1 = new THREE.Color(0x06b6d4);
        const c2 = new THREE.Color(0xa855f7);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 3;
            positions[i * 3 + 1] = Math.random() * 2.5 - 0.6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
            const c = Math.random() > 0.5 ? c1 : c2;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const pMat = new THREE.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
        const particles = new THREE.Points(pGeo, pMat);
        particlesRef.current = particles;
        scannerGroup.add(particles);

        let clock = new THREE.Clock();

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            const mult = isUploading || isDragActive ? 3.0 : 1.0;

            // Prism hover & rotation
            if (prismRef.current) {
                prismRef.current.position.y = 0.2 + Math.sin(t * 2) * 0.08;
                prismRef.current.rotation.y += 0.015 * mult;
                wireCasing.position.y = prismRef.current.position.y;
                wireCasing.rotation.y -= 0.012 * mult;
            }

            // Laser sweep
            if (laserBeamRef.current) {
                laserBeamRef.current.position.y = 0.2 + Math.sin(t * 3.5 * mult) * 0.55;
            }

            // Scanner pad rings rotation
            if (ring1Ref.current) ring1Ref.current.rotation.z += 0.01 * mult;
            if (ring2Ref.current) ring2Ref.current.rotation.z -= 0.018 * mult;

            // Particles rise
            if (particlesRef.current) {
                particlesRef.current.rotation.y += 0.006 * mult;
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
    }, [isUploading, isDragActive]);

    return (
        <div className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}>
            <div ref={containerRef} className="w-full h-44 sm:h-52 cursor-pointer" />
            {/* Ambient Hologram Glow */}
            <div className="absolute pointer-events-none w-48 h-48 rounded-full bg-cyan-500/15 blur-2xl animate-pulse" />
        </div>
    );
}

export default IngestHologramScanner;
