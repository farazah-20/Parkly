'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// ─── Layout constants ─────────────────────────────────────────────────────────
const SP_W   = 1.55
const SP_D   = 2.70
const LANE   = 2.90
const COLS   = 12
const ROWS_N = 2

// ─── Derived positions ────────────────────────────────────────────────────────
const totalZ = ROWS_N * (SP_D * 2 + LANE)
const startZ = -totalZ / 2 + 0.5
const startX = -(COLS * SP_W) / 2

const getLaneZ  = (row: number) => startZ + row * (SP_D * 2 + LANE) + SP_D
const getSpotZ  = (laneZ: number, side: -1 | 1) =>
  side === -1 ? laneZ - SP_D / 2 : laneZ + SP_D / 2
const getSpotX  = (col: number) => startX + col * SP_W + SP_W / 2
const spotKey   = (row: number, side: -1 | 1, col: number) => `${row}_${side}_${col}`

// ─── Palette ─────────────────────────────────────────────────────────────────
const PALETTE = [
  0x3b82f6, 0x6366f1, 0x10b981, 0xf59e0b,
  0x8b5cf6, 0xe11d48, 0xe2e8f0, 0x475569,
]

// ─── Car state ───────────────────────────────────────────────────────────────
type Phase = 'driving' | 'turning' | 'parked' | 'reversing' | 'leaving'

interface Car3D {
  group:        THREE.Group
  phase:        Phase
  row:          number
  side:         -1 | 1
  col:          number
  laneZ:        number
  spotX:        number
  spotZ:        number
  speed:        number
  parkTimer:    number
  parkDuration: number
  dir:          1 | -1
}

export function ThreeHero() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ── Scene & camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.fog   = new THREE.Fog(0x0a1628, 22, 46)

    const camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 80)
    camera.position.set(0, 17, 11)
    camera.lookAt(0, 0, -1)

    // ── Floor ─────────────────────────────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 36),
      new THREE.MeshLambertMaterial({ color: 0x080f1e }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y  = -0.01
    scene.add(floor)

    // ── Parking grid lines ────────────────────────────────────────────────────
    const pts: THREE.Vector3[] = []
    const pushLine = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
      pts.push(new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz))
    }
    for (let row = 0; row < ROWS_N; row++) {
      const laneZ = getLaneZ(row)
      for (let s = 0; s < 2; s++) {
        const bz = s === 0 ? laneZ - SP_D : laneZ
        for (let c = 0; c <= COLS; c++) {
          const x = startX + c * SP_W
          pushLine(x, 0.01, bz, x, 0.01, bz + SP_D)
        }
        pushLine(startX, 0.01, bz, startX + COLS * SP_W, 0.01, bz)
        pushLine(startX, 0.01, bz + SP_D, startX + COLS * SP_W, 0.01, bz + SP_D)
      }
      for (let seg = 0; seg < 10; seg++) {
        const x0 = startX + (seg / 10) * COLS * SP_W
        const x1 = startX + ((seg + 0.4) / 10) * COLS * SP_W
        pushLine(x0, 0.01, laneZ + LANE / 2, x1, 0.01, laneZ + LANE / 2)
      }
    }
    scene.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.28 }),
    ))

    // ── Shared geometries ─────────────────────────────────────────────────────
    const bodyGeo  = new THREE.BoxGeometry(SP_W * 0.60, 0.28, SP_D * 0.50)
    const cabGeo   = new THREE.BoxGeometry(SP_W * 0.40, 0.22, SP_D * 0.28)
    const glintGeo = new THREE.BoxGeometry(SP_W * 0.30, 0.02, SP_D * 0.14)
    const glintMat = new THREE.MeshLambertMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.5 })
    const allMaterials: THREE.Material[] = [glintMat]

    // ── Car factory ───────────────────────────────────────────────────────────
    const occupied = new Set<string>()
    const cars: Car3D[] = []

    const makeCarGroup = (color: number): THREE.Group => {
      const mat    = new THREE.MeshLambertMaterial({ color })
      const cabMat = new THREE.MeshLambertMaterial({ color })
      allMaterials.push(mat, cabMat)

      const group = new THREE.Group()
      group.add(new THREE.Mesh(bodyGeo, mat))

      const cab = new THREE.Mesh(cabGeo, cabMat)
      cab.position.set(0, 0.25, SP_D * 0.01)
      group.add(cab)

      const glint = new THREE.Mesh(glintGeo, glintMat)
      glint.position.set(0, 0.37, SP_D * 0.06)
      group.add(glint)

      return group
    }

    // ── Seed initially-parked cars ────────────────────────────────────────────
    for (let row = 0; row < ROWS_N; row++) {
      const laneZ = getLaneZ(row)
      for (const side of [-1, 1] as const) {
        for (let col = 0; col < COLS; col++) {
          if (Math.random() > 0.68) continue
          const key = spotKey(row, side, col)
          if (occupied.has(key)) continue
          occupied.add(key)

          const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
          const group = makeCarGroup(color)
          const spotZ = getSpotZ(laneZ, side)
          group.position.set(getSpotX(col), 0.14, spotZ)
          group.rotation.y = side === -1 ? Math.PI : 0
          scene.add(group)

          cars.push({
            group,
            phase:        'parked',
            row, side, col,
            laneZ,
            spotX:        getSpotX(col),
            spotZ,
            speed:        0.022 + Math.random() * 0.014,
            parkTimer:    Math.floor(Math.random() * 200),
            parkDuration: Math.floor(Math.random() * 700 + 380),
            dir:          Math.random() > 0.5 ? 1 : -1,
          })
        }
      }
    }

    // ── Spawn a new driving car ───────────────────────────────────────────────
    const spawnCar = () => {
      const row   = Math.floor(Math.random() * ROWS_N)
      const side  = (Math.random() > 0.5 ? -1 : 1) as -1 | 1
      const laneZ = getLaneZ(row)

      const freeCols: number[] = []
      for (let c = 0; c < COLS; c++) {
        if (!occupied.has(spotKey(row, side, c))) freeCols.push(c)
      }
      if (!freeCols.length) return

      const col   = freeCols[Math.floor(Math.random() * freeCols.length)]
      const spotX = getSpotX(col)
      const spotZ = getSpotZ(laneZ, side)
      occupied.add(spotKey(row, side, col))

      const dir   = (Math.random() > 0.5 ? 1 : -1) as 1 | -1
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]
      const group = makeCarGroup(color)

      group.position.set(dir > 0 ? -14 : 14, 0.14, laneZ)
      group.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2
      scene.add(group)

      cars.push({
        group,
        phase:        'driving',
        row, side, col,
        laneZ, spotX, spotZ,
        speed:        0.022 + Math.random() * 0.016,
        parkTimer:    0,
        parkDuration: Math.floor(Math.random() * 600 + 300),
        dir,
      })
    }

    // ── Update a single car's state ───────────────────────────────────────────
    const updateCar = (car: Car3D) => {
      const { group } = car
      const spd = car.speed

      if (car.phase === 'driving') {
        // Drive along the lane toward target X, then peel off into spot
        const dx = car.spotX - group.position.x
        if (Math.abs(dx) < spd * 2) {
          group.position.x = car.spotX
          car.phase = 'turning'
          // Face into the spot
          group.rotation.y = car.side === -1 ? Math.PI : 0
        } else {
          group.position.x += Math.sign(dx) * spd
        }

      } else if (car.phase === 'turning') {
        // Move perpendicular from lane into parking spot
        const dz = car.spotZ - group.position.z
        if (Math.abs(dz) < spd) {
          group.position.z = car.spotZ
          car.phase = 'parked'
          car.parkTimer = 0
        } else {
          group.position.z += Math.sign(dz) * spd * 0.75
        }

      } else if (car.phase === 'parked') {
        car.parkTimer++
        // Gentle idle bob
        group.position.y = 0.14 + Math.sin(car.parkTimer * 0.04) * 0.012
        if (car.parkTimer > car.parkDuration) {
          car.phase = 'reversing'
          group.position.y = 0.14
        }

      } else if (car.phase === 'reversing') {
        // Back out to lane
        const dz = car.laneZ - group.position.z
        if (Math.abs(dz) < spd) {
          group.position.z = car.laneZ
          car.phase = 'leaving'
          occupied.delete(spotKey(car.row, car.side, car.col))
          const newDir = (Math.random() > 0.5 ? 1 : -1) as 1 | -1
          car.dir = newDir
          group.rotation.y = newDir > 0 ? -Math.PI / 2 : Math.PI / 2
        } else {
          group.position.z += Math.sign(dz) * spd * 0.6
        }

      } else if (car.phase === 'leaving') {
        group.position.x += car.dir * spd * 1.6
      }
    }

    const isOffScreen = (c: Car3D) =>
      c.phase === 'leaving' && (c.group.position.x < -16 || c.group.position.x > 16)

    // ── Lights ────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x182848, 3.5))
    const sun = new THREE.DirectionalLight(0x4a80f0, 3.2)
    sun.position.set(8, 22, 10)
    scene.add(sun)
    const blueAccent = new THREE.PointLight(0x3b82f6, 12, 22)
    blueAccent.position.set(-9, 7, -4)
    scene.add(blueAccent)
    const warmAccent = new THREE.PointLight(0xfbbf24, 5, 14)
    warmAccent.position.set(10, 4, 7)
    scene.add(warmAccent)
    const purpleAccent = new THREE.PointLight(0x6366f1, 6, 18)
    purpleAccent.position.set(4, 8, -8)
    scene.add(purpleAccent)

    // ── Animation loop ────────────────────────────────────────────────────────
    let tick = 0
    let rafId = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      tick++

      // Slow camera orbit
      const a = tick * 0.00022
      camera.position.x = Math.sin(a) * 3.5
      camera.position.z = 11 + Math.cos(a) * 2
      camera.lookAt(0, 0, -1)

      // Light pulse
      blueAccent.intensity = 10 + Math.sin(tick * 0.015) * 4

      // Remove off-screen cars
      for (let i = cars.length - 1; i >= 0; i--) {
        if (isOffScreen(cars[i])) {
          scene.remove(cars[i].group)
          cars.splice(i, 1)
        }
      }

      // Spawn new cars when activity is low
      if (tick % 140 === 0) {
        const moving = cars.filter(c => c.phase !== 'parked').length
        if (moving < 4) spawnCar()
      }

      cars.forEach(updateCar)
      renderer.render(scene, camera)
    }
    animate()

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    })
    ro.observe(el)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      allMaterials.forEach(m => m.dispose())
      bodyGeo.dispose()
      cabGeo.dispose()
      glintGeo.dispose()
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.55 }}
      aria-hidden
    />
  )
}
