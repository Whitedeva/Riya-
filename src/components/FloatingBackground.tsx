import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  type: "heart" | "petal" | "butterfly" | "sparkle";
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  flapScale?: number; // for butterflies flapping wings
  flapSpeed?: number;
}

const COLORS = ["#FFD1DC", "#FFC0CB", "#FFB6C1", "#FFF0F5", "#FFE4E1"];

export default function FloatingBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        const width = parent ? parent.clientWidth : window.innerWidth;
        const height = parent ? parent.clientHeight : window.innerHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        setWindowSize({ width, height });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];

    // Helper to draw a heart
    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, y + size / 4);
      ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
      ctx.bezierCurveTo(x - size, y + size * 0.8, x, y + size * 1.2, x, y + size * 1.3);
      ctx.bezierCurveTo(x, y + size * 1.2, x + size, y + size * 0.8, x + size, y + size / 4);
      ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
      ctx.fillStyle = color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#FFB6C1";
      ctx.fill();
      ctx.restore();
    };

    // Helper to draw a sparkle star
    const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        ctx.lineTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.lineTo(x + Math.cos(angle + Math.PI / 4) * (size / 3), y + Math.sin(angle + Math.PI / 4) * (size / 3));
      }
      ctx.closePath();
      ctx.fillStyle = "#FFF";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#FFF";
      ctx.fill();
      ctx.restore();
    };

    // Helper to draw a falling rose petal
    const drawPetal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number, rotation: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-size, -size / 2, -size, size, 0, size * 1.5);
      ctx.bezierCurveTo(size, size, size, -size / 2, 0, 0);
      ctx.fillStyle = color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = color;
      ctx.fill();
      ctx.restore();
    };

    // Helper to draw a flapping butterfly
    const drawButterfly = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number, flapScale: number, rotation: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;

      // Antennae
      ctx.beginPath();
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-5, -size, -10, -size - 2);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(5, -size, 10, -size - 2);
      ctx.stroke();

      // Left wing set
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.scale(flapScale, 1);
      ctx.arc(-size / 2, -size / 3, size / 2, 0, Math.PI * 2);
      ctx.arc(-size / 2, size / 4, size / 3, 0, Math.PI * 2);
      ctx.fill();

      // Right wing set
      ctx.beginPath();
      ctx.scale(-1, 1); // mirror left wing set
      ctx.arc(-size / 2, -size / 3, size / 2, 0, Math.PI * 2);
      ctx.arc(-size / 2, size / 4, size / 3, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 2, size / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#FF69B4";
      ctx.fill();

      ctx.restore();
    };

    // Create a new particle
    const createParticle = (initBottom = false): Particle => {
      const types: ("heart" | "petal" | "butterfly" | "sparkle")[] = ["heart", "petal", "butterfly", "sparkle"];
      const type = types[Math.floor(Math.random() * types.length)];
      const size = type === "butterfly" ? Math.random() * 8 + 6 : type === "sparkle" ? Math.random() * 5 + 4 : type === "heart" ? Math.random() * 10 + 6 : Math.random() * 12 + 6;
      
      return {
        x: Math.random() * canvas.width,
        y: initBottom ? canvas.height + 20 : Math.random() * canvas.height,
        size,
        speedX: Math.random() * 1 - 0.5,
        speedY: type === "petal" ? Math.random() * 0.8 + 0.4 : -(Math.random() * 0.6 + 0.3), // petals fall down, others float up
        type,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.02 - 0.01),
        flapScale: Math.random() * 0.5 + 0.5,
        flapSpeed: Math.random() * 0.15 + 0.05
      };
    };

    // Populate initial particles
    const maxParticles = 40;
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        // Apply mechanics based on type
        if (p.type === "petal") {
          p.y += p.speedY;
          p.x += Math.sin(p.y / 30) * 0.5 + p.speedX;
          p.rotation += p.rotationSpeed;
          // If past bottom, recycle back to top
          if (p.y > canvas.height + 20) {
            particles[index] = createParticle(false);
            particles[index].y = -20;
          }
        } else {
          // Heart, Sparkle, Butterfly float upwards
          p.y += p.speedY;
          p.x += Math.sin(p.y / 40) * 0.3 + p.speedX;
          p.rotation += p.rotationSpeed;
          
          if (p.type === "butterfly" && p.flapScale !== undefined && p.flapSpeed !== undefined) {
            p.flapScale = Math.sin(Date.now() * p.flapSpeed) * 0.4 + 0.6;
          }

          // If past top, recycle back to bottom
          if (p.y < -20) {
            particles[index] = createParticle(true);
          }
        }

        // Draw particle
        if (p.type === "heart") {
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha);
        } else if (p.type === "sparkle") {
          drawSparkle(ctx, p.x, p.y, p.size, p.color, p.alpha);
        } else if (p.type === "petal") {
          drawPetal(ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
        } else if (p.type === "butterfly") {
          drawButterfly(ctx, p.x, p.y, p.size, p.color, p.alpha, p.flapScale || 1.0, p.rotation);
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      id="floating-canvas"
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 block transition-opacity duration-1000"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
