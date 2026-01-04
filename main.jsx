import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { useControls } from 'leva'
import p5 from 'p5'
import './style.css'

// Shared settings object to bridge React and p5
let terrainSettings = {
  worldSize: 0.02,
  elevation: 255,
  step: 6,
  octaves: 4,
  seaLevel: 0.3,
  biome: 'Temperate',
  zoom: 1.0, // New target zoom (linked to slider)
  zoomAnchor: { x: window.innerWidth / 2, y: window.innerHeight / 2 } // Center default
}

let updateLeva = null // Helper to sync Leva from p5

let p5SketchInstance = null

// [Biomes object remains unchanged in this replacement context]
const biomes = {
  Temperate: {
    water: [69, 123, 157],
    sand: [76, 70, 50],
    grass: [0, 111, 50],
    mountain: [43, 45, 66],
    snow: [255, 255, 255]
  },
  Desert: {
    water: [60, 100, 140],
    sand: [210, 180, 140],
    grass: [200, 150, 80],
    mountain: [160, 82, 45],
    snow: [255, 240, 200]
  },
  Snow: {
    water: [100, 140, 180],
    sand: [200, 220, 240],
    grass: [220, 240, 250],
    mountain: [180, 190, 200],
    snow: [255, 255, 255]
  }
}

const sketch = (p) => {
  let camX = 0
  let camY = 0
  let camZoom = 1.0 // Current interpolated zoom

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight)
    p.pixelDensity(1)
    p.noSmooth()
    p.background(0)
    p.noStroke()
    // p.noLoop() // Removed noLoop to allow smooth animation
  }

  p.draw = () => {
    p.background(0)

    // Smooth Zoom Logic
    const targetZoom = terrainSettings.zoom
    if (Math.abs(camZoom - targetZoom) > 0.001) {
      const oldZoom = camZoom
      camZoom = p.lerp(camZoom, targetZoom, 0.1)
      const zoomFactor = camZoom / oldZoom

      // Adjust camera to zoom towards anchor
      const anchor = terrainSettings.zoomAnchor
      camX = anchor.x - (anchor.x - camX) * zoomFactor
      camY = anchor.y - (anchor.y - camY) * zoomFactor
    } else {
      camZoom = targetZoom
    }

    generateTerrain(p, camX, camY, camZoom)
  }

  let resizeTimeout
  p.windowResized = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
      // Reset anchor to center on resize to prevent weirdness
      terrainSettings.zoomAnchor = { x: p.width/2, y: p.height/2 }
    }, 200)
  }

  p.mouseWheel = (event) => {
    // Set anchor to mouse position
    terrainSettings.zoomAnchor = { x: p.mouseX, y: p.mouseY }
    
    // Calculate new target zoom
    const sensitivity = 0.001
    let newZoom = terrainSettings.zoom * (1 - event.delta * sensitivity)
    newZoom = p.constrain(newZoom, 0.1, 5.0)

    // Sync to Leva (which will update terrainSettings.zoom via useEffect)
    if (updateLeva) {
      updateLeva({ zoom: newZoom })
    }
    
    return false
  }

  p.mouseDragged = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return
    camX += p.mouseX - p.pmouseX
    camY += p.mouseY - p.pmouseY
  }
}

const generateTerrain = (p, camX, camY, camZoom) => {
  const { step, worldSize, elevation, octaves, seaLevel, biome } = terrainSettings
  const w = Math.ceil(window.innerWidth / step)
  const h = Math.ceil(window.innerHeight / step)

  const img = p.createImage(w, h)
  img.loadPixels()

  const palette = biomes[biome] || biomes.Temperate
  
  // Effective noise scale combines World Size slider and Interactive Zoom
  // worldSize is "base scale". camZoom > 1 means "zoom in", so we map smaller noise area -> smaller effective scale.
  const noiseScale = worldSize / camZoom

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Screen coordinates of the pixel block
      const screenX = x * step
      const screenY = y * step
      
      // World coordinates (camera applied)
      const worldX = screenX - camX
      const worldY = screenY - camY

      let noiseVal = 0
      let frequency = 1
      let amplitude = 1
      let maxValue = 0

      // Fractal Brownian Motion
      for (let i = 0; i < octaves; i++) {
        const nx = worldX * noiseScale * frequency
        const ny = worldY * noiseScale * frequency
        noiseVal += p.noise(nx, ny) * amplitude
        maxValue += amplitude
        amplitude *= 0.5
        frequency *= 2
      }
      
      noiseVal = noiseVal / maxValue
      const c = elevation * noiseVal
      let r, g, b

      const waterHeight = seaLevel * 255
      const sandHeight = waterHeight + 15
      const mountainHeight = 150
      const snowHeight = 210

      if (c < waterHeight) {
        [r, g, b] = palette.water
      } else if (c < sandHeight) {
        [r, g, b] = palette.sand
      } else if (c > snowHeight) {
        [r, g, b] = palette.snow
      } else if (c > mountainHeight) {
        [r, g, b] = palette.mountain
      } else {
        [r, g, b] = palette.grass
      }

      const index = (x + y * w) * 4
      img.pixels[index] = r
      img.pixels[index + 1] = g
      img.pixels[index + 2] = b
      img.pixels[index + 3] = 255
    }
  }

  img.updatePixels()
  p.image(img, 0, 0, w * step, h * step)
}

const App = () => {
  const handleZoomEditStart = () => {
    // When using slider, center the zoom anchor
    terrainSettings.zoomAnchor = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }

  // Use functional API to get 'set'
  const [settings, set] = useControls('Terrain Settings', () => ({
    worldSize: { value: 0.02, min: 0.001, max: 0.1, step: 0.001 },
    zoom: { 
      value: 1.0, min: 0.1, max: 5.0, step: 0.1,
      onEditStart: handleZoomEditStart 
    },
    elevation: { value: 255, min: 50, max: 400, step: 1 },
    octaves: { value: 4, min: 1, max: 8, step: 1 },
    seaLevel: { value: 0.3, min: 0, max: 0.8, step: 0.05 },
    biome: { value: 'Temperate', options: ['Temperate', 'Desert', 'Snow'] }
  }))

  useEffect(() => {
    Object.assign(terrainSettings, settings)
    updateLeva = set // expose set to p5
    
    if (p5SketchInstance) {
      // p5 is looping now, so manual redraw isn't strictly necessary for animation,
      // but might be for immediate response if loop was stopped.
      // p5SketchInstance.redraw() 
    }
  }, [settings, set])

  const p5ContainerRef = useRef(null)

  useEffect(() => {
    if (!p5SketchInstance) {
      p5SketchInstance = new p5(sketch, p5ContainerRef.current)
    }
    
    return () => {
      // Cleanup if necessary, though in this simple case staying mounted is fine
    }
  }, [])

  return (
    <div ref={p5ContainerRef} id="p5-container" style={{ position: 'absolute', top: 0, left: 0, zIndex: -1 }}></div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
