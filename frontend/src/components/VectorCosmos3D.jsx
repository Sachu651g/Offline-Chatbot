import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RefreshCw, Compass, Binary, Layers, Eye, Zap } from "lucide-react";

/**
 * VectorCosmos3D - Modern 3D HNSW Graph & High-Dimensional Document Vector Space Simulator
 * Procedural Three.js simulation with OrbitControls, hierarchical HNSW layers,
 * semantic document clusters, and animated query laser probes.
 */
export function VectorCosmos3D({
    isProbing = false,
    activeFilter = "all",
    selectedTask = "all",
    onSelectNode = null,
    className = ""
}) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const frameIdRef = useRef(null);
    const cosmosGroupRef = useRef(null);
    const probeLaserRef = useRef(null);
    const nodesRef = useRef([]);

    const [hoveredNode, setHoveredNode] = useState(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 360;
        const height = container.clientHeight || 260;

        const scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(0, 2.2, 5.2);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current = renderer;
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 14;
        controls.minDistance = 2.0;
        controlsRef.current = controls;

        const ambientLight = new THREE.AmbientLight(0x0f172a, 3.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x06b6d4, 4.0, 20);
        pointLight.position.set(2, 5, 4);
        scene.add(pointLight);

        const pinkLight = new THREE.PointLight(0xec4899, 3.0, 15);
        pinkLight.position.set(-3, -2, -3);
        scene.add(pinkLight);

        const cosmosGroup = new THREE.Group();
        cosmosGroupRef.current = cosmosGroup;
        scene.add(cosmosGroup);

        // 3D HNSW Multi-Layer Coordinate Grids
        // Ground Layer (Layer 0 - Dense Chunks)
        const gridLayer0 = new THREE.GridHelper(5.0, 16, 0x1e1e38, 0x0f0f20);
        gridLayer0.position.y = -1.4;
        cosmosGroup.add(gridLayer0);

        // Express Highway Layer (Layer 1 - Semantic Centroids)
        const gridLayer1 = new THREE.GridHelper(3.8, 8, 0x312e81, 0x1e1b4b);
        gridLayer1.position.y = 0.6;
        cosmosGroup.add(gridLayer1);

        // Vector Clusters (Text Docs, Visual CLIP Docs, Audio Modalities, Financial Tables)
        const nodeSpheres = [];
        const baseGeo = new THREE.SphereGeometry(0.075, 14, 14);
        const centroidGeo = new THREE.OctahedronGeometry(0.14);

        const textMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 1.4, roughness: 0.2 });
        const visualMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 1.4, roughness: 0.2 });
        const audioMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.4, roughness: 0.2 });
        const tableMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.4, roughness: 0.2 });

        const clusterCentroids = [
            { x: -1.2, y: -0.6, z: -0.8, type: "document", label: "Technical Research & Specs (MiniLM 384-d)", mat: textMat },
            { x: 1.3, y: -0.7, z: 0.6, type: "image", label: "Visual Figures & Diagrams (CLIP 512-d)", mat: visualMat },
            { x: 0.1, y: -0.5, z: 1.3, type: "audio", label: "Recorded Voice Audio (Whisper STT)", mat: audioMat },
            { x: -0.2, y: 0.8, z: -0.4, type: "table", label: "Financial Ledgers & Invoices (HNSW L1)", mat: tableMat }
        ];

        // Create Centroid Hubs
        clusterCentroids.forEach((c) => {
            const cMesh = new THREE.Mesh(centroidGeo, c.mat);
            cMesh.position.set(c.x, c.y + 0.3, c.z);
            cosmosGroup.add(cMesh);

            // Orbit Ring around Centroid
            const ringGeo = new THREE.TorusGeometry(0.24, 0.012, 8, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: c.mat.color, transparent: true, opacity: 0.45 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(c.x, c.y + 0.3, c.z);
            cosmosGroup.add(ring);
        });

        // Populate Dense Document Chunk Vectors around cluster centroids
        const totalPoints = 64;
        for (let i = 0; i < totalPoints; i++) {
            const cluster = clusterCentroids[i % clusterCentroids.length];
            const spread = 0.85;
            const x = cluster.x + (Math.random() - 0.5) * spread;
            const y = cluster.y + (Math.random() - 0.5) * (spread * 0.7);
            const z = cluster.z + (Math.random() - 0.5) * spread;

            const mesh = new THREE.Mesh(baseGeo, cluster.mat);
            mesh.position.set(x, y, z);
            cosmosGroup.add(mesh);

            nodeSpheres.push({
                id: `chunk_${i + 1}`,
                pos: new THREE.Vector3(x, y, z),
                mesh,
                type: cluster.type,
                label: `Document Chunk #${i + 1} (${cluster.type})`,
                baseY: y
            });
        }
        nodesRef.current = nodeSpheres;

        // HNSW Proximity Edges (Connect points with distance < threshold)
        const edgePositions = [];
        const edgeColors = [];

        for (let i = 0; i < nodeSpheres.length; i++) {
            for (let j = i + 1; j < nodeSpheres.length; j++) {
                const p1 = nodeSpheres[i].pos;
                const p2 = nodeSpheres[j].pos;
                const dist = p1.distanceTo(p2);
                if (dist < 0.75) {
                    edgePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
                }
            }
        }

        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
        const edgeMat = new THREE.LineBasicMaterial({
            color: 0x4338ca,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        cosmosGroup.add(edges);

        // Dynamic 3D Holographic Query Laser & Target Crosshair
        const laserGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 3.0, 0),
            new THREE.Vector3(clusterCentroids[0].x, clusterCentroids[0].y, clusterCentroids[0].z)
        ]);
        const laserMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const laser = new THREE.Line(laserGeo, laserMat);
        cosmosGroup.add(laser);
        probeLaserRef.current = laser;

        // Target Ripple Beacon Mesh
        const beaconGeo = new THREE.RingGeometry(0.1, 0.22, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.rotation.x = Math.PI / 2;
        beacon.position.set(clusterCentroids[0].x, clusterCentroids[0].y, clusterCentroids[0].z);
        cosmosGroup.add(beacon);

        // Raycaster for Hover & Selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onPointerMove = (e) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const meshes = nodeSpheres.map(n => n.mesh);
            const intersects = raycaster.intersectObjects(meshes);

            if (intersects.length > 0) {
                const hitMesh = intersects[0].object;
                const foundNode = nodeSpheres.find(n => n.mesh === hitMesh);
                if (foundNode) {
                    setHoveredNode(foundNode);
                    container.style.cursor = "pointer";
                }
            } else {
                setHoveredNode(null);
                container.style.cursor = "grab";
            }
        };

        const onPointerDown = () => {
            if (hoveredNode && onSelectNode) {
                onSelectNode(hoveredNode);
            }
        };

        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerdown", onPointerDown);

        // Animation Loop
        let clock = new THREE.Clock();
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            controls.update();

            // Gentle ambient rotation
            if (!controls.state || controls.state === -1) {
                cosmosGroup.rotation.y += 0.0025;
            }

            // Pulse beacon ring
            const beaconScale = 1.0 + Math.sin(elapsed * 6.0) * 0.3;
            beacon.scale.set(beaconScale, beaconScale, 1);
            beacon.material.opacity = 0.5 + Math.sin(elapsed * 6.0) * 0.4;

            // Animate laser pulse when probing
            laser.material.opacity = 0.4 + Math.sin(elapsed * 8.0) * 0.5;

            renderer.render(scene, camera);
        };
        animate();

        // Resize Listener
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
            container.removeEventListener("pointermove", onPointerMove);
            container.removeEventListener("pointerdown", onPointerDown);
            cancelAnimationFrame(frameIdRef.current);
            controls.dispose();
            renderer.dispose();
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Filter node visibility based on selected modality or task
    useEffect(() => {
        if (!nodesRef.current.length) return;
        nodesRef.current.forEach((n) => {
            const matchesModality = activeFilter === "all" || n.type === activeFilter;
            n.mesh.visible = matchesModality;
        });
    }, [activeFilter, selectedTask]);

    const resetView = () => {
        if (!cameraRef.current || !controlsRef.current) return;
        cameraRef.current.position.set(0, 2.2, 5.2);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
    };

    return (
        <div className={`relative w-full rounded-2xl border border-indigo-500/30 bg-[#070710] overflow-hidden shadow-2xl ${className}`}>
            {/* Top HUD Overlay */}
            <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 pointer-events-auto">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-mono text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Compass size={12} className="text-cyan-400" />
                        HNSW Spatial Vector Cosmos
                    </span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-300 border border-indigo-500/30">
                        Hierarchical L0/L1
                    </span>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                    <button
                        onClick={resetView}
                        className="bg-black/75 hover:bg-black text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/10 font-mono text-[10px] flex items-center gap-1 transition-all"
                        title="Reset Vector Perspective"
                    >
                        <RefreshCw size={11} /> Reset Camera
                    </button>
                </div>
            </div>

            {/* Hover Tooltip Overlay */}
            {hoveredNode && (
                <div className="absolute top-12 left-4 z-20 pointer-events-none bg-black/85 backdrop-blur-md border border-cyan-500/40 p-2.5 rounded-xl font-mono text-xs shadow-xl space-y-1 max-w-xs">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-[11px] truncate">{hoveredNode.label}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded uppercase font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {hoveredNode.type}
                        </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-2">
                        <span>Coord: [{hoveredNode.pos.x.toFixed(2)}, {hoveredNode.pos.y.toFixed(2)}, {hoveredNode.pos.z.toFixed(2)}]</span>
                    </div>
                </div>
            )}

            {/* 3D Canvas */}
            <div ref={containerRef} className="w-full h-80 sm:h-[340px] cursor-grab active:cursor-grabbing" />

            {/* Bottom Telemetry Legend */}
            <div className="absolute bottom-2.5 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[9px] pointer-events-none">
                <div className="flex items-center gap-3 text-zinc-300">
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" /> Text Chunks (MiniLM)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-pink-400" /> Visual Patches (CLIP)
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Voice Transcripts
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-400" /> Financial Tables
                    </span>
                </div>
                <div className="text-cyan-400 font-extrabold flex items-center gap-1">
                    <Zap size={11} /> {isProbing ? "COMPUTING COSINE PROJECTION…" : "DRAG TO ORBIT SPATIAL GRAPH"}
                </div>
            </div>
        </div>
    );
}

export default VectorCosmos3D;
