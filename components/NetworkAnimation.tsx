
import React, { useRef, useEffect } from 'react';

const NetworkAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];
    let pulses: SignalPulse[] = [];
    
    const nodeCount = 50;
    const connectionMaxDist = 200;
    const brandYellow = '#FACC15';

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      pulsePhase: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseRadius = Math.random() * 2 + 1;
        this.radius = this.baseRadius;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }

      update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.pulsePhase += 0.02;
        this.radius = this.baseRadius + Math.sin(this.pulsePhase) * 0.5;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = brandYellow;
        ctx.shadowBlur = 10;
        ctx.shadowColor = brandYellow;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    class SignalPulse {
      startNode: Node;
      endNode: Node;
      progress: number;
      speed: number;

      constructor(start: Node, end: Node) {
        this.startNode = start;
        this.endNode = end;
        this.progress = 0;
        this.speed = 0.005 + Math.random() * 0.01;
      }

      update() {
        this.progress += this.speed;
        return this.progress < 1;
      }

      draw() {
        if (!ctx) return;
        const x = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
        const y = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 15;
        ctx.shadowColor = brandYellow;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      nodes = [];
      pulses = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node(canvas.width, canvas.height));
      }
    };

    const drawSynapsesAndSpawnSignals = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionMaxDist) {
            const opacity = 1 - distance / connectionMaxDist;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(250, 204, 21, ${opacity * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            if (Math.random() < 0.0005) {
              pulses.push(new SignalPulse(nodes[i], nodes[j]));
            }
          }
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      nodes.forEach(node => {
        node.update(canvas.width, canvas.height);
        node.draw();
      });
      
      drawSynapsesAndSpawnSignals();

      pulses = pulses.filter(pulse => {
        const active = pulse.update();
        if (active) pulse.draw();
        return active;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    init();
    animate();

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ 
        opacity: 0.35,
        filter: 'contrast(1.2) brightness(1.1)' 
      }}
    />
  );
};

export default NetworkAnimation;
