import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * KnowledgeVault3D - Interactive 3D Quantum Data Vault for Knowledge Base
 * 100% Offline & Procedural
 */
export function KnowledgeVault3D({ docCount = 0, className = "" }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);

    const vaultRef = useRef(null);
    const ring1Ref = useRef(null);
    const ring2Ref = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 260;
        const height = container.clientHeight || 180;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 1.2, 4.2);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x0a0f1d, 3.5);
        scene.add(ambientLight);

        const keyLight = new THREE.PointLight(0x06b6d4, 4.0, 20);
        keyLight.position.set(3, 4, 4);
        scene.add(keyLight);

        const vaultGroup = new THREE.Group();
        scene.add(vaultGroup);

        // Quantum Vault Core: Faceted Dodecahedron
        const coreGeo = new THREE.DodecahedronGeometry(0.85, 0);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: 0x070b19,
            metalness: 0.95,
            roughness: 0.15,
            clearcoat: 1.0,
            emissive: 0x4338ca,
            emissiveIntensity: 0.4,
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        vaultRef.current = core;
        vaultGroup.add(core);

        // Outer Wireframe Cage
        const wireGeo = new THREE.DodecahedronGeometry(0.98, 0);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.45,
        });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        vaultGroup.add(wire);

        // Concentric Holographic Storage Rings
        const r1Geo = new THREE.TorusGeometry(1.35, 0.016, 16, 80);
        const r1Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.8 });
        const r1 = new THREE.Mesh(r1Geo, r1Mat);
        r1.rotation.x = Math.PI / 3;
        ring1Ref.current = r1;
        vaultGroup.add(r1);

        const r2Geo = new THREE.TorusGeometry(1.55, 0.014, 16, 80);
        const r2Mat = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.75 });
        const r2 = new THREE.Mesh(r2Geo, r2Mat);
        r2.rotation.y = Math.PI / 4;
        ring2Ref.current = r2;
        vaultGroup.add(r2);

        // Orbiting Vector Shards
        const shards = [];
        const shardGeo = new THREE.TetrahedronGeometry(0.08);
        const shardColors = [0x00f0ff, 0x818cf8, 0xf43f5e, 0x10b981];
        for (let i = 0; i < 4; i++) {
            const pivot = new THREE.Group();
            const sMat = new THREE.MeshBasicMaterial({ color: shardColors[i] });
            const sMesh = new THREE.Mesh(shardGeo, sMat);
            sMesh.position.set(Math.cos(i * 1.57) * 1.85, Math.sin(i * 1.57) * 0.4, Math.sin(i * 1.57) * 1.85);
            pivot.add(sMesh);
            vaultGroup.add(pivot);
            shards.push(pivot);
        }

        let clock = new THREE.Clock();

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            if (vaultRef.current) {
                vaultRef.current.rotation.y += 0.008;
                vaultRef.current.rotation.x = Math.sin(t * 0.8) * 0.12;
                wire.rotation.y = vaultRef.current.rotation.y;
                wire.rotation.x = vaultRef.current.rotation.x;
            }

            if (ring1Ref.current) ring1Ref.current.rotation.z += 0.012;
            if (ring2Ref.current) ring2Ref.current.rotation.z -= 0.015;

            shards.forEach((p, idx) => {
                p.rotation.y += 0.014 * (idx + 1);
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
            <div ref={containerRef} className="w-full h-36 sm:h-44 cursor-pointer" />
            <div className="absolute pointer-events-none w-32 h-32 rounded-full bg-indigo-500/15 blur-xl animate-pulse" />
        </div>
    );
}

export default KnowledgeVault3D;
