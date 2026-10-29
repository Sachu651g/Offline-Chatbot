import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RefreshCw, Play, Sparkles, CheckCircle2, ChevronRight, Binary, Cpu } from "lucide-react";

/**
 * ExplainabilityPipeline3D - Interactive 3D Holographic 4-Stage RAG Pipeline Simulator
 * Procedural Three.js scene with OrbitControls, clickable stages, particle flow conduits,
 * and mathematical stage telemetry.
 */
export function ExplainabilityPipeline3D({
    activeStageIdx = 0,
    onSelectStage = null,
    className = ""
}) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const frameIdRef = useRef(null);
    const stagesRef = useRef([]);
    const conduitsRef = useRef([]);

    const STAGES = [
        { name: "1. Tokenize", model: "MiniLM-L6 (384-d)", color: 0x06b6d4, x: -2.4, desc: "Dense text embeddings map query words into 384-d semantic vector space." },
        { name: "2. HNSW Search", model: "ChromaDB Dual", color: 0x8b5cf6, x: -0.8, desc: "Approximate nearest neighbors query explores text and visual vector graphs." },
        { name: "3. RRF Fusion", model: "Reciprocal Rank", color: 0xec4899, x: 0.8, desc: "Fuses multimodal ranks: RRF(d) = Σ w_i / (k + rank_i) with zero scale distortion." },
        { name: "4. Synthesis", model: "Gemma 3 4B", color: 0x10b981, x: 2.4, desc: "Multimodal grounded token stream conditioned on verified context & images." },
    ];

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 440;
        const height = container.clientHeight || 220;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        camera.position.set(0, 1.4, 5.4);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 10;
        controls.minDistance = 2.5;
        controls.target.set(0, 0, 0);
        controlsRef.current = controls;

        const ambientLight = new THREE.AmbientLight(0x0a0f1d, 3.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x06b6d4, 4.0, 20);
        pointLight.position.set(2, 4, 4);
        scene.add(pointLight);

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        // Ground reference grid
        const grid = new THREE.GridHelper(6.0, 14, 0x1e1e38, 0x0f0f20);
        grid.position.y = -1.1;
        rootGroup.add(grid);

        // 4 3D Holographic Pipeline Stage Nodes
        const nodes = [];
        STAGES.forEach((cfg, i) => {
            const stGroup = new THREE.Group();
            stGroup.position.set(cfg.x, 0, 0);

            // Center faceted node geometry
            const geo = i === 3 ? new THREE.IcosahedronGeometry(0.36, 1) : new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: cfg.color,
                emissive: cfg.color,
                emissiveIntensity: 1.0,
                metalness: 0.8,
                roughness: 0.2,
            });
            const mesh = new THREE.Mesh(geo, mat);
            stGroup.add(mesh);

            // Outer wireframe glowing orbital ring
            const rGeo = new THREE.TorusGeometry(0.48, 0.015, 10, 32);
            const rMat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.7 });
            const ring = new THREE.Mesh(rGeo, rMat);
            ring.rotation.x = Math.PI / 2;
            stGroup.add(ring);

            rootGroup.add(stGroup);
            nodes.push({ group: stGroup, mesh, ring, cfg, idx: i });
        });
        stagesRef.current = nodes;

        // Data Flow Conduits (Lines between consecutive nodes)
        const conduitParticles = [];
        for (let i = 0; i < STAGES.length - 1; i++) {
            const p1 = new THREE.Vector3(STAGES[i].x, 0, 0);
            const p2 = new THREE.Vector3(STAGES[i + 1].x, 0, 0);

            // Conduit Line
            const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            const lineMat = new THREE.LineDashedMaterial({
                color: 0x38bdf8,
                dashSize: 0.12,
                gapSize: 0.06,
                transparent: true,
                opacity: 0.6
            });
            const line = new THREE.Line(lineGeo, lineMat);
            line.computeLineDistances();
            rootGroup.add(line);

            // Animated pulse bead traveling along conduit
            const beadGeo = new THREE.SphereGeometry(0.06, 8, 8);
            const beadMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
            const bead = new THREE.Mesh(beadGeo, beadMat);
            rootGroup.add(bead);
            conduitParticles.push({ bead, startX: p1.x, endX: p2.x, speed: 1.2 + i * 0.2, progress: (i * 0.33) });
        }
        conduitsRef.current = conduitParticles;

        // Raycasting for Click-to-Inspect
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerDown = (e) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const meshes = nodes.map(n => n.mesh);
            const intersects = raycaster.intersectObjects(meshes);

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                const found = nodes.find(n => n.mesh === hit);
                if (found && onSelectStage) {
                    onSelectStage(found.idx);
                }
            }
        };
        container.addEventListener("pointerdown", onPointerDown);

        // Animation Loop
        let clock = new THREE.Clock();
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();
            const delta = clock.getDelta();

            controls.update();

            // Rotate rings and bob nodes
            nodes.forEach((n, idx) => {
                n.mesh.rotation.y += 0.015 * (idx + 1);
                n.ring.rotation.z += 0.02 * (idx % 2 === 0 ? 1 : -1);
                n.group.position.y = Math.sin(elapsed * 2.0 + idx) * 0.06;

                // Pulsing highlight for currently selected active stage
                if (idx === activeStageIdx) {
                    const scale = 1.0 + Math.sin(elapsed * 5.0) * 0.12;
                    n.ring.scale.set(scale, scale, scale);
                    n.mesh.material.emissiveIntensity = 1.8;
                } else {
                    n.ring.scale.set(1, 1, 1);
                    n.mesh.material.emissiveIntensity = 0.9;
                }
            });

            // Animate conduit data pulses
            conduitParticles.forEach((cp) => {
                cp.progress = (cp.progress + delta * cp.speed) % 1.0;
                cp.bead.position.x = THREE.MathUtils.lerp(cp.startX, cp.endX, cp.progress);
                cp.bead.position.y = Math.sin(cp.progress * Math.PI) * 0.15;
            });

            renderer.render(scene, camera);
        };
        animate();

        // Resize
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
            container.removeEventListener("pointerdown", onPointerDown);
            cancelAnimationFrame(frameIdRef.current);
            controls.dispose();
            renderer.dispose();
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [activeStageIdx]);

    const resetView = () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(0, 1.4, 5.4);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
    };

    return (
        <div className={`relative w-full rounded-2xl border border-indigo-500/30 bg-[#070710] overflow-hidden shadow-2xl ${className}`}>
            {/* Top HUD Overlay */}
            <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={12} className="text-cyan-400" />
                        4-Stage Holographic Architecture Simulator
                    </span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-300 border border-indigo-500/30">
                        Interactive Nodes
                    </span>
                </div>

                <button
                    onClick={resetView}
                    className="pointer-events-auto bg-black/75 hover:bg-black text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[10px] flex items-center gap-1 transition-all"
                >
                    <RefreshCw size={11} /> Reset Camera
                </button>
            </div>

            {/* 3D Canvas */}
            <div ref={containerRef} className="w-full h-52 sm:h-60 cursor-grab active:cursor-grabbing" />

            {/* Bottom Active Stage Telemetry */}
            <div className="border-t border-[#1E1E2E] bg-black/60 backdrop-blur-md px-4 py-2.5 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Selected Stage:</span>
                    <span className="font-bold text-white">{STAGES[activeStageIdx].name}</span>
                    <span className="text-cyan-400 font-semibold text-[11px]">({STAGES[activeStageIdx].model})</span>
                </div>
                <p className="text-[10px] text-zinc-400 truncate max-w-md">
                    {STAGES[activeStageIdx].desc}
                </p>
            </div>
        </div>
    );
}

export default ExplainabilityPipeline3D;
