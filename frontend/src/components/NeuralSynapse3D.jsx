import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * NeuralSynapse3D - Interactive 3D Synaptic Neural Lattice
 * 100% Offline & Procedural
 */
export function NeuralSynapse3D({ isRunning = false, temperature = 0.2, className = "" }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);
    const meshGroupRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 320;
        const height = container.clientHeight || 200;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 0, 5.2);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x0f172a, 3.0);
        scene.add(ambientLight);

        const light = new THREE.PointLight(0x06b6d4, 4.0, 15);
        light.position.set(3, 4, 4);
        scene.add(light);

        const group = new THREE.Group();
        meshGroupRef.current = group;
        scene.add(group);

        // Generate Neuron Nodes in 3D Ellipsoid
        const nodeCount = 38;
        const nodes = [];
        const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x06b6d4,
            emissiveIntensity: 1.5,
            roughness: 0.2,
            metalness: 0.8,
        });

        for (let i = 0; i < nodeCount; i++) {
            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const r = Math.cbrt(Math.random()) * 1.8;
            const sinPhi = Math.sin(phi);
            const x = r * sinPhi * Math.cos(theta);
            const y = r * sinPhi * Math.sin(theta) * 0.75;
            const z = r * Math.cos(phi);

            const mesh = new THREE.Mesh(nodeGeo, nodeMat);
            mesh.position.set(x, y, z);
            group.add(mesh);
            nodes.push({ pos: new THREE.Vector3(x, y, z), mesh });
        }

        // Connect Synaptic Axons (Lines) between close neighbors
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
        });

        const lineGeo = new THREE.BufferGeometry();
        const linePositions = [];

        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                const dist = nodes[i].pos.distanceTo(nodes[j].pos);
                if (dist < 1.15) {
                    linePositions.push(nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
                    linePositions.push(nodes[j].pos.x, nodes[j].pos.y, nodes[j].pos.z);
                }
            }
        }

        lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        group.add(lines);

        // Core Pulsing Synapse Center
        const centerGeo = new THREE.IcosahedronGeometry(0.35, 1);
        const centerMat = new THREE.MeshBasicMaterial({ color: 0xec4899, wireframe: true });
        const center = new THREE.Mesh(centerGeo, centerMat);
        group.add(center);

        let clock = new THREE.Clock();

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            const speed = (isRunning ? 3.0 : 1.0) * (1.0 + temperature * 0.8);

            if (meshGroupRef.current) {
                meshGroupRef.current.rotation.y = t * 0.15 * speed;
                meshGroupRef.current.rotation.x = Math.sin(t * 0.2) * 0.15;
            }

            center.rotation.y -= 0.02 * speed;
            center.rotation.x += 0.015 * speed;
            const p = Math.sin(t * 4 * speed) * 0.1 + 1.0;
            center.scale.set(p, p, p);

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
    }, [isRunning, temperature]);

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
            <div ref={containerRef} className="w-full h-44 sm:h-52 cursor-pointer" />
            <div className="absolute pointer-events-none w-36 h-36 rounded-full bg-cyan-500/15 blur-2xl animate-pulse" />
        </div>
    );
}

export default NeuralSynapse3D;
