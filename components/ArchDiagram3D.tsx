'use client'
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import * as THREE from 'three'

function Node({ position, label, color, size = 0.3 }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime + position[0]) * 0.08
    }
  })
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  )
}

function Edge({ start, end }: { start: [number,number,number]; end: [number,number,number] }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end])
  return <Line points={points} color="#6366f1" opacity={0.25} transparent lineWidth={1} />
}

function ArchScene({ nodes, edges }: any) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0015
  })
  return (
    <group ref={groupRef}>
      {edges.map((e: any, i: number) => (
        <Edge key={i} start={nodes[e[0]]?.pos || [0,0,0]} end={nodes[e[1]]?.pos || [0,0,0]} />
      ))}
      {nodes.map((n: any, i: number) => (
        <Node key={i} position={n.pos} label={n.label} color={n.color} size={n.size} />
      ))}
    </group>
  )
}

export default function ArchDiagram3D({ repoData, owner, name }: any) {
  const COLORS = ['#6366f1','#818cf8','#c9a84c','#3b82f6','#8b5cf6','#06b6d4','#a5b4fc','#e6c97a']

  const { nodes, edges } = useMemo(() => {
    const tree = repoData?.tree || []
    const topLevel = Array.from(
      new Set<string>(tree.map((f: any) => f.path.split('/')[0]))
    ).slice(0, 10)

    const nodes = [
      { label: `${owner}/${name}`, pos: [0, 0, 0] as [number,number,number], color: '#6366f1', size: 0.5 },
      ...topLevel.map((dir: string, i: number) => {
        const angle = (i / topLevel.length) * Math.PI * 2
        const r = 2.8
        return {
          label: dir,
          pos: [Math.cos(angle)*r, (Math.random()-0.5)*1.5, Math.sin(angle)*r] as [number,number,number],
          color: COLORS[i % COLORS.length],
          size: 0.22,
        }
      }),
    ]

    const edges = topLevel.map((_: any, i: number) => [0, i+1])
    topLevel.slice(0,6).forEach((_: any, i: number) => {
      const j = (i+1) % topLevel.length
      if (i !== j) edges.push([i+1, j+1])
    })

    return { nodes, edges }
  }, [repoData, owner, name])

  return (
    <Canvas camera={{ position: [0,2,8], fov: 55 }} gl={{ antialias: true }} style={{ background:'transparent' }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5,5,5]} intensity={1.2} color="#6366f1" />
      <pointLight position={[-5,-5,-5]} intensity={0.6} color="#c9a84c" />
      <fog attach="fog" args={['#06080f', 18, 35]} />
      <ArchScene nodes={nodes} edges={edges} />
      <OrbitControls enableZoom enablePan makeDefault />
      <gridHelper args={[20, 20, '#1e2638', '#161b27']} position={[0,-2.5,0]} />
    </Canvas>
  )
}
