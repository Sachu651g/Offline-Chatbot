import React, { useRef, useState } from "react";

/**
 * Card3D - Interactive 3D Perspective Tilt Card with Holographic Sheen
 */
export function Card3D({
    children,
    className = "",
    glare = true,
    maxTilt = 8,
    scale = 1.02,
    onClick,
}) {
    const cardRef = useRef(null);
    const [style, setStyle] = useState({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        setStyle({
            transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
            transition: "transform 0.1s ease-out",
        });

        if (glare) {
            setGlarePos({
                x: (x / rect.width) * 100,
                y: (y / rect.height) * 100,
                opacity: 0.25,
            });
        }
    };

    const handleMouseLeave = () => {
        setStyle({
            transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
            transition: "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
        });
        if (glare) {
            setGlarePos((prev) => ({ ...prev, opacity: 0 }));
        }
    };

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={style}
            className={`relative overflow-hidden cursor-pointer ${className}`}
        >
            {children}

            {/* Dynamic Holographic Glare Sheen */}
            {glare && (
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.15) 0%, rgba(99, 102, 241, 0.08) 35%, transparent 70%)`,
                        opacity: glarePos.opacity,
                    }}
                />
            )}
        </div>
    );
}

export default Card3D;
