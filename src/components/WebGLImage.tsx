"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface WebGLImageProps {
  src: string;
  alt: string;
  className?: string;
}

// Maximum number of simultaneous active ripples to track
const MAX_RIPPLES = 5;

export default function WebGLImage({ src, alt, className = "" }: WebGLImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep refs of values to avoid re-triggering useEffect
  const ripplesRef = useRef<THREE.Vector2[]>(
    Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector2(-10, -10))
  );
  const progressRef = useRef<number[]>(Array(MAX_RIPPLES).fill(1.0)); // 1.0 means inactive/finished
  const lastMouseRef = useRef(new THREE.Vector2(0, 0));
  const activeIndexRef = useRef(0);
  
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Spawn a new ripple at current mouse coordinates
  const spawnRipple = (x: number, y: number) => {
    const idx = activeIndexRef.current;
    ripplesRef.current[idx].set(x, y);
    progressRef.current[idx] = 0.0; // Reset progress to start animation

    // Increment index circularly
    activeIndexRef.current = (idx + 1) % MAX_RIPPLES;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height; // Invert Y for WebGL

    const currentMouse = new THREE.Vector2(x, y);
    const dist = currentMouse.distanceTo(lastMouseRef.current);

    // Spawn ripple if mouse has moved sufficiently (creates a smooth trail)
    if (dist > 0.03) {
      spawnRipple(x, y);
      lastMouseRef.current.copy(currentMouse);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    lastMouseRef.current.set(x, y);
    spawnRipple(x, y);
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    const scene = new THREE.Scene();
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // GLSL Shaders for physical propagation wave ripples
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform vec2 uRipples[${MAX_RIPPLES}];
      uniform float uProgress[${MAX_RIPPLES}];
      uniform float uAspect;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        vec2 distortion = vec2(0.0);

        // Iterate through all active ripples to aggregate distortion forces
        for (int i = 0; i < ${MAX_RIPPLES}; i++) {
          float prog = uProgress[i];
          
          if (prog < 1.0) {
            vec2 center = uRipples[i];
            
            // Correct distance mapping using aspect ratio (makes waves perfectly circular)
            vec2 aspectUv = vec2(uv.x, uv.y / uAspect);
            vec2 aspectCenter = vec2(center.x, center.y / uAspect);
            float dist = distance(aspectUv, aspectCenter);
            
            // Wavefront propagates outwards
            float waveFront = prog * 0.4; 
            float d = dist - waveFront;
            
            // Peak intensity decays as wave expands and ages
            float amplitude = 0.06 * (1.0 - prog) * exp(-dist * 4.0);
            
            // High frequency sine wave
            float wave = sin(d * 50.0 - prog * 20.0) * amplitude;
            
            // Vector pointing away from ripple center
            vec2 dir = uv - center;
            float len = length(dir);
            if (len > 0.0) {
              distortion += (dir / len) * wave;
            }
          }
        }

        // Sample texture using distorted UVs
        vec4 color = texture2D(uTexture, clamp(uv + distortion, 0.0, 1.0));
        gl_FragColor = color;
      }
    `;

    const loader = new THREE.TextureLoader();
    loader.load(
      src,
      (texture) => {
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geometry = new THREE.PlaneGeometry(width, height);
        
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: texture },
            uRipples: { value: ripplesRef.current },
            uProgress: { value: progressRef.current },
            uAspect: { value: width / height },
          },
          transparent: true,
        });

        materialRef.current = material;

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        setIsLoaded(true);
      },
      undefined,
      (err) => console.error("Error loading texture:", err)
    );

    // Animation Loop
    const tick = () => {
      // Propagate active ripples (progress goes from 0 to 1)
      for (let i = 0; i < MAX_RIPPLES; i++) {
        if (progressRef.current[i] < 1.0) {
          progressRef.current[i] += 0.015; // Propagation speed
          if (progressRef.current[i] > 1.0) {
            progressRef.current[i] = 1.0; // Deactivate
          }
        }
      }

      if (materialRef.current) {
        materialRef.current.uniforms.uProgress.value = [...progressRef.current];
        materialRef.current.uniforms.uRipples.value = [...ripplesRef.current];
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    tick();

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;

      renderer.setSize(w, h);
      camera.left = w / -2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = h / -2;
      camera.updateProjectionMatrix();

      if (materialRef.current) {
        materialRef.current.uniforms.uAspect.value = w / h;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />

      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover block transition-opacity duration-700 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
