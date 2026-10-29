import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Shield, Cpu, Zap, Eye, RotateCw } from "lucide-react";

/**
 * FuturisticBot3D - High-performance WebGL 3D Futuristic AI Bot
 * 
 * Features:
 * - 100% Procedural & Offline (no external 3D model downloads needed)
 * - Interactive Mouse Tracking (visage/eye follows cursor in 3D space)
 * - Gyroscopic Multi-Axis Holographic Rings with Neon Bloom
 * - Floating Quantum Satellite Nodes
 * - Animated 3D Floating Particle Field
 * - State Reactive: Reacts to Idle, Thinking/Generating, and Voice-Listening states
 * - Interactive Mouse Dragging to rotate in 3D
 */
export function FuturisticBot3D({
    mode = "hero", // "hero" | "compact" | "card"
    isGenerating = false,
    isListening = false,
    className = "",
    showHUD = true,
}) {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);
    const botGroupRef = useRef(null);
    const coreRef = useRef(null);
    const visorRef = useRef(null);
    const ring1Ref = useRef(null);
    const ring2Ref = useRef(null);
    const ring3Ref = useRef(null);
    const satellitesRef = useRef([]);
    const particlesRef = useRef(null);

    const [activeTheme, setActiveTheme] = useState("cyber"); // "cyber" | "quantum" | "solaris"
    const [isHovered, setIsHovered] = useState(false);

    // Mouse coordinates for 3D parallax tracking
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, lastX: 0, lastY: 0, rotX: 0, rotY: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || (mode === "compact" ? 140 : 360);
        const height = container.clientHeight || (mode === "compact" ? 140 : 360);

        // 1. Scene & Camera
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(
            mode === "compact" ? 38 : 42,
            width / height,
            0.1,
            1000
        );
        camera.position.z = mode === "compact" ? 5.2 : 5.8;

        // 2. WebGL Renderer with transparency & antialiasing
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        rendererRef.current = renderer;

        container.appendChild(renderer.domElement);

        // 3. Lighting (Dramatic Sci-Fi Studio Lights)
        const ambientLight = new THREE.AmbientLight(0x0f172a, 2.5);
        scene.add(ambientLight);

        // Main key light (Indigo / Cyan)
        const keyLight = new THREE.PointLight(0x6366f1, 5, 20);
        keyLight.position.set(4, 5, 6);
        scene.add(keyLight);

        // Rim/Fill light (Neon Purple / Pink)
        const rimLight = new THREE.PointLight(0xa855f7, 4.5, 20);
        rimLight.position.set(-4, -3, 4);
        scene.add(rimLight);

        // Under-glow (Cyan accent)
        const underGlow = new THREE.PointLight(0x06b6d4, 3, 15);
        underGlow.position.set(0, -4, 2);
        scene.add(underGlow);

        // 4. Master Bot Group
        const botGroup = new THREE.Group();
        botGroupRef.current = botGroup;
        scene.add(botGroup);

        // --- BOT GEOMETRY CONSTRUCTION ---

        // A. Sleek Cybernetic Head / Core (Dual-shell: inner faceted chrome + outer translucent shield)
        const innerGeo = new THREE.IcosahedronGeometry(0.95, 2);
        const innerMat = new THREE.MeshPhysicalMaterial({
            color: 0x090d16,
            metalness: 0.95,
            roughness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            wireframe: false,
        });
        const innerHead = new THREE.Mesh(innerGeo, innerMat);
        coreRef.current = innerHead;
        botGroup.add(innerHead);

        // Outer Wireframe Hologram Shield
        const wireGeo = new THREE.IcosahedronGeometry(1.08, 1);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            wireframe: true,
            transparent: true,
            opacity: 0.28,
        });
        const wireShield = new THREE.Mesh(wireGeo, wireMat);
        botGroup.add(wireShield);

        // B. Futuristic Curved Visor / Optical Eye
        const visorGeo = new THREE.TorusGeometry(0.55, 0.08, 16, 60, Math.PI * 0.95);
        const visorMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 2.2,
            roughness: 0.2,
            metalness: 0.8,
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.rotation.x = Math.PI * 0.5;
        visor.rotation.z = Math.PI * 0.02;
        visor.position.set(0, 0.05, 0.78);
        visorRef.current = visor;
        botGroup.add(visor);

        // Center Eye Pupil / Pulse Beacon
        const pupilGeo = new THREE.SphereGeometry(0.2, 32, 32);
        const pupilMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.95,
        });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(0, 0.05, 0.75);
        botGroup.add(pupil);

        // Halo Ring around the pupil
        const pupilRingGeo = new THREE.RingGeometry(0.26, 0.3, 32);
        const pupilRingMat = new THREE.MeshBasicMaterial({
            color: 0xa855f7,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
        });
        const pupilRing = new THREE.Mesh(pupilRingGeo, pupilRingMat);
        pupilRing.position.set(0, 0.05, 0.76);
        botGroup.add(pupilRing);

        // C. Gyroscopic 3D Holographic Orbit Rings (3 Axes)
        // Ring 1 - Equator Ring (Cyan Neon)
        const ring1Geo = new THREE.TorusGeometry(1.45, 0.02, 16, 100);
        const ring1Mat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 1.8,
            roughness: 0.3,
            metalness: 0.9,
        });
        const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
        ring1Ref.current = ring1;
        botGroup.add(ring1);

        // Ring 2 - Polar Ring (Violet / Indigo Neon)
        const ring2Geo = new THREE.TorusGeometry(1.65, 0.018, 16, 100);
        const ring2Mat = new THREE.MeshStandardMaterial({
            color: 0x8b5cf6,
            emissive: 0x8b5cf6,
            emissiveIntensity: 1.6,
            roughness: 0.3,
            metalness: 0.9,
        });
        const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
        ring2.rotation.x = Math.PI / 3;
        ring2Ref.current = ring2;
        botGroup.add(ring2);

        // Ring 3 - Tilted Quantum Ring (Pink / Rose Neon)
        const ring3Geo = new THREE.TorusGeometry(1.85, 0.016, 16, 100);
        const ring3Mat = new THREE.MeshStandardMaterial({
            color: 0xec4899,
            emissive: 0xec4899,
            emissiveIntensity: 1.4,
            roughness: 0.3,
            metalness: 0.9,
        });
        const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
        ring3.rotation.y = Math.PI / 4;
        ring3Ref.current = ring3;
        botGroup.add(ring3);

        // D. Floating Quantum Satellites (Mini Orbiting Drones)
        const satellites = [];
        const satColors = [0x38bdf8, 0xa855f7, 0xec4899];
        for (let i = 0; i < 3; i++) {
            const satPivot = new THREE.Group();
            const satGeo = new THREE.OctahedronGeometry(0.12);
            const satMat = new THREE.MeshStandardMaterial({
                color: satColors[i],
                emissive: satColors[i],
                emissiveIntensity: 2.0,
                metalness: 0.9,
                roughness: 0.1,
            });
            const satMesh = new THREE.Mesh(satGeo, satMat);
            satMesh.position.set(Math.cos((i * Math.PI * 2) / 3) * 2.2, (i - 1) * 0.4, Math.sin((i * Math.PI * 2) / 3) * 2.2);
            satPivot.add(satMesh);
            botGroup.add(satPivot);
            satellites.push({ pivot: satPivot, mesh: satMesh, speed: (i + 1) * 0.8 });
        }
        satellitesRef.current = satellites;

        // E. 3D Floating Cyber Stardust Particles
        const particleCount = mode === "compact" ? 80 : 160;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const color1 = new THREE.Color(0x6366f1);
        const color2 = new THREE.Color(0x06b6d4);
        const color3 = new THREE.Color(0xa855f7);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

            const c = Math.random() < 0.4 ? color1 : Math.random() < 0.7 ? color2 : color3;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending,
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        particlesRef.current = particles;
        scene.add(particles);

        // --- INTERACTIVE MOUSE TRACKING & DRAG ---
        const handleMouseMove = (e) => {
            const rect = container.getBoundingClientRect();
            const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const rawY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
            mouseRef.current.targetX = rawX * 0.85;
            mouseRef.current.targetY = rawY * 0.65;

            if (mouseRef.current.isDragging) {
                const deltaX = e.clientX - mouseRef.current.lastX;
                const deltaY = e.clientY - mouseRef.current.lastY;
                mouseRef.current.rotY += deltaX * 0.008;
                mouseRef.current.rotX += deltaY * 0.008;
                mouseRef.current.lastX = e.clientX;
                mouseRef.current.lastY = e.clientY;
            }
        };

        const handleMouseDown = (e) => {
            mouseRef.current.isDragging = true;
            mouseRef.current.lastX = e.clientX;
            mouseRef.current.lastY = e.clientY;
        };

        const handleMouseUp = () => {
            mouseRef.current.isDragging = false;
        };

        const handleGlobalMouseMove = (e) => {
            // Screen-wide subtle parallax even when cursor is outside container
            if (!container) return;
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            mouseRef.current.targetX = ((e.clientX - cx) / cx) * 0.6;
            mouseRef.current.targetY = -((e.clientY - cy) / cy) * 0.45;
        };

        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleGlobalMouseMove);

        // --- ANIMATION LOOP ---
        let clock = new THREE.Clock();

        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();
            const delta = clock.getDelta();

            // Smooth interpolation for mouse tracking
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

            // Hover floating physics (smooth sinusoidal levitation)
            if (botGroupRef.current) {
                botGroupRef.current.position.y = Math.sin(elapsedTime * 1.8) * 0.12;

                // Base rotation combining user drag + mouse tracking + idle sway
                const targetRotY = mouseRef.current.rotY + mouseRef.current.x * 0.65 + Math.sin(elapsedTime * 0.8) * 0.08;
                const targetRotX = mouseRef.current.rotX - mouseRef.current.y * 0.55 + Math.cos(elapsedTime * 1.0) * 0.06;

                botGroupRef.current.rotation.y += (targetRotY - botGroupRef.current.rotation.y) * 0.08;
                botGroupRef.current.rotation.x += (targetRotX - botGroupRef.current.rotation.x) * 0.08;
            }

            // Gyroscopic Ring Rotations (Multi-Axis)
            const speedMultiplier = isGenerating ? 3.5 : 1.0;

            if (ring1Ref.current) {
                ring1Ref.current.rotation.z += 0.012 * speedMultiplier;
                ring1Ref.current.rotation.x = Math.sin(elapsedTime * 0.9) * 0.3;
            }
            if (ring2Ref.current) {
                ring2Ref.current.rotation.y += 0.016 * speedMultiplier;
                ring2Ref.current.rotation.z = Math.cos(elapsedTime * 0.7) * 0.4;
            }
            if (ring3Ref.current) {
                ring3Ref.current.rotation.x -= 0.014 * speedMultiplier;
                ring3Ref.current.rotation.y = Math.sin(elapsedTime * 1.1) * 0.35;
            }

            // Wireframe Shield subtle pulse
            if (wireShield) {
                wireShield.rotation.y -= 0.005;
                const pulse = Math.sin(elapsedTime * 3) * 0.05 + 1.0;
                wireShield.scale.set(pulse, pulse, pulse);
            }

            // Core breathing pulse
            if (coreRef.current) {
                const corePulse = Math.sin(elapsedTime * 2.5) * 0.02 + 1.0;
                coreRef.current.scale.set(corePulse, corePulse, corePulse);
            }

            // Orbiting Satellites
            satellitesRef.current.forEach((sat, i) => {
                sat.pivot.rotation.y += (0.015 * sat.speed) * speedMultiplier;
                sat.pivot.rotation.x = Math.sin(elapsedTime * (1 + i * 0.2)) * 0.3;
                sat.mesh.rotation.x += 0.04;
                sat.mesh.rotation.y += 0.05;
            });

            // Particles slow galactic swirl
            if (particlesRef.current) {
                particlesRef.current.rotation.y = elapsedTime * 0.03;
                particlesRef.current.rotation.x = Math.sin(elapsedTime * 0.02) * 0.15;
            }

            // Dynamic Visor Glow Color depending on state
            if (visorRef.current) {
                if (isGenerating) {
                    // Energized Amber / Cyan oscillating pulse
                    const glow = (Math.sin(elapsedTime * 8) + 1) * 1.5 + 1.2;
                    visorRef.current.material.emissiveIntensity = glow;
                    visorRef.current.material.emissive.setHex(0xf59e0b); // Amber
                } else if (isListening) {
                    // Pulsing Emerald Audio Reactive
                    const glow = (Math.sin(elapsedTime * 12) + 1) * 1.8 + 1.5;
                    visorRef.current.material.emissiveIntensity = glow;
                    visorRef.current.material.emissive.setHex(0x10b981); // Emerald
                } else {
                    // Calm Cyber Cyan
                    const glow = (Math.sin(elapsedTime * 2) + 1) * 0.6 + 1.4;
                    visorRef.current.material.emissiveIntensity = glow;
                    visorRef.current.material.emissive.setHex(0x00f0ff);
                }
            }

            renderer.render(scene, camera);
        };

        animate();

        // Resize Listener
        const handleResize = () => {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
            container.removeEventListener("mousemove", handleMouseMove);
            container.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleGlobalMouseMove);
            window.removeEventListener("resize", handleResize);

            if (rendererRef.current && rendererRef.current.domElement) {
                try {
                    container.removeChild(rendererRef.current.domElement);
                    rendererRef.current.dispose();
                } catch { /* ignore */ }
            }

            // Dispose geometries & materials
            scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach((m) => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        };
    }, [mode, isGenerating, isListening]);

    // Update color schemes dynamically
    const handleThemeSwitch = (theme) => {
        setActiveTheme(theme);
        if (!ring1Ref.current || !ring2Ref.current || !ring3Ref.current) return;

        if (theme === "quantum") {
            ring1Ref.current.material.color.setHex(0x10b981);
            ring1Ref.current.material.emissive.setHex(0x10b981);
            ring2Ref.current.material.color.setHex(0x06b6d4);
            ring2Ref.current.material.emissive.setHex(0x06b6d4);
            ring3Ref.current.material.color.setHex(0x3b82f6);
            ring3Ref.current.material.emissive.setHex(0x3b82f6);
        } else if (theme === "solaris") {
            ring1Ref.current.material.color.setHex(0xf59e0b);
            ring1Ref.current.material.emissive.setHex(0xf59e0b);
            ring2Ref.current.material.color.setHex(0xef4444);
            ring2Ref.current.material.emissive.setHex(0xef4444);
            ring3Ref.current.material.color.setHex(0xec4899);
            ring3Ref.current.material.emissive.setHex(0xec4899);
        } else {
            ring1Ref.current.material.color.setHex(0x06b6d4);
            ring1Ref.current.material.emissive.setHex(0x06b6d4);
            ring2Ref.current.material.color.setHex(0x8b5cf6);
            ring2Ref.current.material.emissive.setHex(0x8b5cf6);
            ring3Ref.current.material.color.setHex(0xec4899);
            ring3Ref.current.material.emissive.setHex(0xec4899);
        }
    };

    return (
        <div
            className={`relative flex flex-col items-center justify-center select-none ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 3D Canvas Viewport */}
            <div
                ref={containerRef}
                className={`cursor-grab active:cursor-grabbing relative z-10 ${
                    mode === "compact"
                        ? "w-28 h-28 sm:w-32 sm:h-32"
                        : "w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96"
                }`}
                title="Drag to rotate Bot in space"
            />

            {/* Glowing 3D Radial Depth Aura */}
            <div
                className={`absolute pointer-events-none rounded-full blur-3xl transition-all duration-700 ${
                    isGenerating
                        ? "bg-gradient-to-r from-amber-500/35 via-rose-500/25 to-indigo-500/30 w-72 h-72 animate-pulse"
                        : isListening
                        ? "bg-gradient-to-r from-emerald-500/35 via-cyan-500/25 to-teal-500/30 w-72 h-72 animate-pulse"
                        : "bg-gradient-to-r from-indigo-600/25 via-purple-600/20 to-cyan-500/20 w-64 h-64"
                }`}
            />

            {/* Sci-Fi HUD Badges & Interactive Controls for Hero Mode */}
            {mode === "hero" && showHUD && (
                <div className="relative z-20 flex flex-col items-center gap-2.5 mt-[-10px]">
                    {/* Status Holographic Pill */}
                    <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-[#0A0A12]/90 backdrop-blur-xl px-4 py-1.5 font-mono text-[11px] font-extrabold shadow-2xl">
                        <span className="relative flex h-2 w-2">
                            <span
                                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                                    isGenerating ? "bg-amber-400" : isListening ? "bg-emerald-400" : "bg-cyan-400"
                                }`}
                            />
                            <span
                                className={`relative inline-flex rounded-full h-2 w-2 ${
                                    isGenerating ? "bg-amber-500" : isListening ? "bg-emerald-500" : "bg-cyan-500"
                                }`}
                            />
                        </span>
                        <span className="text-zinc-300">
                            {isGenerating ? "NEURAL SYNAPSE ACTIVE" : isListening ? "AUDIO STREAM CAPTURE" : "AUTONOMOUS CORE READY"}
                        </span>
                        <span className="text-indigo-400/80 font-black">|</span>
                        <span className="text-indigo-300 text-[10px]">100% OFFLINE</span>
                    </div>

                    {/* Interactive 3D Color Matrix Switches */}
                    <div className="flex items-center gap-1.5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-zinc-400">
                        <span className="text-zinc-500 font-bold mr-1">MATRIX:</span>
                        <button
                            onClick={() => handleThemeSwitch("cyber")}
                            className={`px-2 py-0.5 rounded-lg transition-all ${
                                activeTheme === "cyber"
                                    ? "bg-indigo-600/40 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm"
                                    : "hover:text-white"
                            }`}
                        >
                            Cyber
                        </button>
                        <button
                            onClick={() => handleThemeSwitch("quantum")}
                            className={`px-2 py-0.5 rounded-lg transition-all ${
                                activeTheme === "quantum"
                                    ? "bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm"
                                    : "hover:text-white"
                            }`}
                        >
                            Quantum
                        </button>
                        <button
                            onClick={() => handleThemeSwitch("solaris")}
                            className={`px-2 py-0.5 rounded-lg transition-all ${
                                activeTheme === "solaris"
                                    ? "bg-amber-600/40 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                                    : "hover:text-white"
                            }`}
                        >
                            Solaris
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FuturisticBot3D;
