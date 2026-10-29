import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Layers, Eye, RefreshCw, Sparkles, Box, ShieldCheck, Cpu } from "lucide-react";

/**
 * DocumentTaskSimulator3D - Modern 3D Holographic Document Analysis & Neural Attention Simulator
 * Features real 3D multi-layer isometric document planes, attention laser vectors,
 * and procedural particle manifolds with full OrbitControls.
 */
export function DocumentTaskSimulator3D({
    activeTask = "financial",
    temperature = 0.2,
    topK = 5,
    isSimulating = false,
    className = ""
}) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const frameIdRef = useRef(null);
    const rootGroupRef = useRef(null);
    const attentionBeamsRef = useRef([]);
    const particlesRef = useRef(null);

    // 3D Scene Initialization
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 480;
        const height = container.clientHeight || 340;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
        camera.position.set(3.5, 3.2, 4.8);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;
        container.appendChild(renderer.domElement);

        // OrbitControls for true 3D inspection
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 12;
        controls.minDistance = 2.5;
        controls.target.set(0, 0.2, 0);
        controlsRef.current = controls;

        // Ambient & Accent Lights
        const ambient = new THREE.AmbientLight(0x0a0f1d, 3.0);
        scene.add(ambient);

        const cyanLight = new THREE.PointLight(0x06b6d4, 4.0, 15);
        cyanLight.position.set(-3, 4, 3);
        scene.add(cyanLight);

        const pinkLight = new THREE.PointLight(0xec4899, 3.5, 15);
        pinkLight.position.set(3, -2, -3);
        scene.add(pinkLight);

        const rootGroup = new THREE.Group();
        rootGroupRef.current = rootGroup;
        scene.add(rootGroup);

        // 3D Holographic Floating Grid
        const gridHelper = new THREE.GridHelper(5, 14, 0x38bdf8, 0x141428);
        gridHelper.position.y = -1.4;
        rootGroup.add(gridHelper);

        // Create 3 Multi-Layer Document Planes (Layer 0: Raw Document, Layer 1: Token Vectors, Layer 2: Attention Manifold)
        const planeGeo = new THREE.PlaneGeometry(2.4, 3.2);

        // 1. Bottom Document Layer (Raw Structure)
        const docMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.15,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        const docPlane = new THREE.Mesh(planeGeo, docMat);
        docPlane.rotation.x = -Math.PI / 2;
        docPlane.position.y = -0.6;
        rootGroup.add(docPlane);

        // Document Edges Wireframe
        const edgeGeo = new THREE.EdgesGeometry(planeGeo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 });
        const docEdges = new THREE.LineSegments(edgeGeo, edgeMat);
        docEdges.rotation.x = -Math.PI / 2;
        docEdges.position.y = -0.6;
        rootGroup.add(docEdges);

        // 2. Middle Vector Layer (HNSW Embedding Nodes)
        const vectorPlaneMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const vectorPlane = new THREE.Mesh(planeGeo, vectorPlaneMat);
        vectorPlane.rotation.x = -Math.PI / 2;
        vectorPlane.position.y = 0.1;
        rootGroup.add(vectorPlane);

        // Vector Chunk Tokens (3D Spheres on middle layer)
        const chunkNodes = [];
        const sphereGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const chunkMat = new THREE.MeshStandardMaterial({
            color: 0x818cf8,
            emissive: 0x4f46e5,
            emissiveIntensity: 1.5,
            roughness: 0.2
        });

        for (let i = 0; i < 16; i++) {
            const x = (Math.random() - 0.5) * 1.9;
            const z = (Math.random() - 0.5) * 2.6;
            const chunkMesh = new THREE.Mesh(sphereGeo, chunkMat);
            chunkMesh.position.set(x, 0.1, z);
            rootGroup.add(chunkMesh);
            chunkNodes.push(new THREE.Vector3(x, 0.1, z));
        }

        // 3. Top Layer: Query Focus Anchor (3D Holographic Icosahedron)
        const queryGeo = new THREE.IcosahedronGeometry(0.3, 1);
        const queryMat = new THREE.MeshStandardMaterial({
            color: 0xec4899,
            emissive: 0xf43f5e,
            emissiveIntensity: 2.0,
            wireframe: true
        });
        const queryCore = new THREE.Mesh(queryGeo, queryMat);
        queryCore.position.set(0, 1.3, 0);
        rootGroup.add(queryCore);

        // Inner Pulsing Core
        const innerGeo = new THREE.SphereGeometry(0.14, 16, 16);
        const innerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const innerCore = new THREE.Mesh(innerGeo, innerMat);
        innerCore.position.set(0, 1.3, 0);
        rootGroup.add(innerCore);

        // Attention Beams: Laser Lines from Query Core to Document Tokens
        const beams = [];
        for (let i = 0; i < 6; i++) {
            const targetPos = chunkNodes[i % chunkNodes.length];
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 1.3, 0),
                targetPos
            ]);
            const lineMat = new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? 0x06b6d4 : 0xec4899,
                transparent: true,
                opacity: 0.75,
                blending: THREE.AdditiveBlending
            });
            const line = new THREE.Line(lineGeo, lineMat);
            rootGroup.add(line);
            beams.push({ line, target: targetPos });
        }
        attentionBeamsRef.current = beams;

        // Holographic Particle Swarm (Token Probability Cloud)
        const particleCount = 80;
        const particleGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            pPositions[i] = (Math.random() - 0.5) * 3.0;
            pPositions[i + 1] = (Math.random() - 0.5) * 2.2 + 0.3;
            pPositions[i + 2] = (Math.random() - 0.5) * 3.0;
        }

        particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x38bdf8,
            size: 0.04,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        rootGroup.add(particles);
        particlesRef.current = particles;

        // Animation Loop
        let clock = new THREE.Clock();
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();

            controls.update();

            // Slow cinematic orbit when not dragging
            if (!controls.state || controls.state === -1) {
                rootGroup.rotation.y += 0.003;
            }

            // Query Core Pulsing & Rotation
            queryCore.rotation.x = elapsed * 0.8;
            queryCore.rotation.y = elapsed * 0.6;
            const pulseScale = 1.0 + Math.sin(elapsed * 4.0) * 0.08;
            queryCore.scale.set(pulseScale, pulseScale, pulseScale);

            // Floating bobbing motion for planes
            docPlane.position.y = -0.6 + Math.sin(elapsed * 1.5) * 0.03;
            docEdges.position.y = docPlane.position.y;
            vectorPlane.position.y = 0.1 + Math.sin(elapsed * 1.5 + 1.0) * 0.03;

            // Animate Attention Beam Pulsing
            beams.forEach((b, idx) => {
                b.line.material.opacity = 0.4 + Math.sin(elapsed * 5.0 + idx) * 0.4;
            });

            // Swirl particle swarm
            particles.rotation.y = -elapsed * 0.08;

            renderer.render(scene, camera);
        };
        animate();

        // Responsive Resize
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const newW = container.clientWidth;
            const newH = container.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(frameIdRef.current);
            controls.dispose();
            renderer.dispose();
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Update scene when temperature or task changes
    useEffect(() => {
        if (!particlesRef.current || !rootGroupRef.current) return;
        // Higher temperature expands particle cloud entropy
        const spread = 1.0 + temperature * 1.5;
        particlesRef.current.scale.set(spread, spread, spread);

        // Adjust beam opacity based on simulation activity
        attentionBeamsRef.current.forEach((b) => {
            b.line.material.color.setHex(activeTask === "financial" ? 0x10b981 : activeTask === "legal" ? 0xef4444 : 0x06b6d4);
        });
    }, [temperature, activeTask, isSimulating]);

    const resetCamera = () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(3.5, 3.2, 4.8);
        controlsRef.current.target.set(0, 0.2, 0);
        controlsRef.current.update();
    };

    return (
        <div className={`relative w-full rounded-2xl border border-indigo-500/30 bg-[#080812] overflow-hidden shadow-2xl ${className}`}>
            {/* Top 3D Control HUD Bar */}
            <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Box size={13} className="text-cyan-400" />
                        Multi-Layer Neural Document Manifold
                    </span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-300 border border-indigo-500/30">
                        Interactive Orbit
                    </span>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={resetCamera}
                        className="bg-black/70 hover:bg-black text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[10px] flex items-center gap-1 transition-all"
                        title="Reset Camera Angle"
                    >
                        <RefreshCw size={11} /> Reset View
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div ref={containerRef} className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing" />

            {/* Bottom 3D Layer Telemetry Legend */}
            <div className="absolute bottom-2.5 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 bg-black/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 font-mono text-[10px] pointer-events-none">
                <div className="flex items-center gap-3 text-zinc-300">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded bg-cyan-400" /> Layer 1: Document OCR Surface
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded bg-indigo-400" /> Layer 2: 384d/512d Vector Lattice
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded bg-rose-400" /> Layer 3: Query Softmax Attention Focus
                    </span>
                </div>
                <div className="text-cyan-400 font-extrabold">
                    {isSimulating ? "⚡ RUNNING FORWARD PASS & ATTENTION BEAMS" : "DRAG MOUSE TO ORBIT SPATIAL SCENE"}
                </div>
            </div>
        </div>
    );
}

export default DocumentTaskSimulator3D;
