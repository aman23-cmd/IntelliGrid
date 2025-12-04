import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Torus, Text3D, Center, useTexture } from '@react-three/drei';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Zap, Play, Pause, RotateCcw } from 'lucide-react';

// Animated energy sphere
function EnergySphere({ usage, color }: { usage: number; color: string }) {
  const meshRef = useRef<any>(null);
  const [scale, setScale] = useState(1);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const normalizedUsage = Math.min(usage / 100, 2);
  const sphereSize = 0.5 + normalizedUsage * 0.5;

  return (
    <Sphere ref={meshRef} args={[sphereSize, 32, 32]} position={[0, 0, 0]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </Sphere>
  );
}

// Energy particles
function EnergyParticles({ count = 50 }: { count?: number }) {
  const particlesRef = useRef<any>(null);

  const particles = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    particles[i] = (Math.random() - 0.5) * 10;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001;
      particlesRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#06b6d4" transparent opacity={0.6} />
    </points>
  );
}

// Rotating energy ring
function EnergyRing({ radius = 2, color = "#10b981" }: { radius?: number; color?: string }) {
  const ringRef = useRef<any>(null);

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.x += 0.02;
      ringRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Torus ref={ringRef} args={[radius, 0.05, 16, 100]}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.7}
      />
    </Torus>
  );
}

// 3D House/Building model
function EnergyBuilding() {
  const buildingRef = useRef<any>(null);

  useFrame((state) => {
    if (buildingRef.current) {
      buildingRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={buildingRef} position={[0, -1, 0]}>
      {/* Building base */}
      <Box args={[2, 2, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#4b5563" metalness={0.3} roughness={0.7} />
      </Box>
      
      {/* Roof */}
      <Box args={[2.2, 0.3, 2.2]} position={[0, 1.15, 0]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      
      {/* Windows - glowing */}
      <Box args={[0.3, 0.4, 0.1]} position={[-0.5, 0.3, 1.01]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
      </Box>
      <Box args={[0.3, 0.4, 0.1]} position={[0.5, 0.3, 1.01]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
      </Box>
      <Box args={[0.3, 0.4, 0.1]} position={[-0.5, -0.3, 1.01]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
      </Box>
      <Box args={[0.3, 0.4, 0.1]} position={[0.5, -0.3, 1.01]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
      </Box>
      
      {/* Door */}
      <Box args={[0.5, 0.8, 0.1]} position={[0, -0.6, 1.01]}>
        <meshStandardMaterial color="#8b5cf6" />
      </Box>
      
      {/* Solar panel on roof */}
      <Box args={[1.5, 0.05, 1]} position={[0, 1.5, 0]} rotation={[Math.PI * 0.15, 0, 0]}>
        <meshStandardMaterial
          color="#1e40af"
          metalness={0.9}
          roughness={0.1}
          emissive="#3b82f6"
          emissiveIntensity={0.2}
        />
      </Box>
    </group>
  );
}

// Main scene
function Scene({ currentUsage, isPaused }: { currentUsage: number; isPaused: boolean }) {
  const getEnergyColor = (usage: number) => {
    if (usage < 30) return "#10b981"; // Green
    if (usage < 70) return "#fbbf24"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      
      {!isPaused && (
        <>
          <EnergySphere usage={currentUsage} color={getEnergyColor(currentUsage)} />
          <EnergyRing radius={2} color="#06b6d4" />
          <EnergyRing radius={2.5} color="#10b981" />
          <EnergyParticles count={100} />
        </>
      )}
      
      <EnergyBuilding />
      
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        minDistance={3}
        maxDistance={15}
        autoRotate={!isPaused}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

interface Energy3DVisualizationProps {
  currentUsage: number;
}

export function Energy3DVisualization({ currentUsage }: Energy3DVisualizationProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const togglePause = () => setIsPaused(!isPaused);
  
  const resetView = () => {
    setIsPaused(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-500" />
          <h3>3D Energy Visualization</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={togglePause}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </div>
      </div>
      
      <div className={`bg-gradient-to-br from-slate-900 to-slate-800 ${isFullscreen ? 'h-[calc(100%-4rem)]' : 'h-96'}`}>
        <Canvas camera={{ position: [5, 3, 5], fov: 50 }}>
          <Suspense fallback={null}>
            <Scene currentUsage={currentUsage} isPaused={isPaused} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Low Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-muted-foreground">Medium Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">High Usage</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            Current: <span className="text-cyan-500">{currentUsage.toFixed(1)} kWh</span>
          </div>
        </div>
      </div>
    </Card>
  );
}