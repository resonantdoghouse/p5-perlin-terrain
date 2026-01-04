import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { useControls } from 'leva'
import p5 from 'p5'
import './style.css'

// Shared settings object to bridge React and p5
let terrainSettings = {
  zoom: 0.02,
  elevation: 255,
  step: 6
}

let p5SketchInstance = null

const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight)
    p.pixelDensity(1)
    p.noSmooth() // Optimization: Sharp scaling for blocky look
    p.background(0)
    p.noStroke()
    p.noLoop()
  }

  p.draw = () => {
    p.background(0)
    generateTerrain(p)
  }

  let resizeTimeout
  p.windowResized = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      p.resizeCanvas(p.windowWidth, p.windowHeight)
      generateTerrain(p)
      p.redraw()
    }, 200)
  }
}

const generateTerrain = (p) => {
  const { step, zoom, elevation } = terrainSettings
  const w = Math.ceil(window.innerWidth / step)
  const h = Math.ceil(window.innerHeight / step)

  const img = p.createImage(w, h)
  img.loadPixels()

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const offsetX = zoom * (x * step)
      const offsetY = zoom * (y * step)

      let noiseVal = p.noise(offsetX, offsetY)
      let c = elevation * noiseVal

      let r, g, b
      if (c > 170) {
        r = 255; g = 255; b = 255 // mountain top
      } else if (c > 130) {
        r = 43; g = 45; b = 66 // mountain
      } else if (c > 76) {
        r = 0; g = 111; b = 50 // grass
      } else {
        r = 69; g = 123; b = 157 // water
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
  const settings = useControls('Terrain Settings', {
    zoom: { value: 0.02, min: 0.003, max: 0.09, step: 0.001 },
    elevation: { value: 255, min: 80, max: 350, step: 1 }
  })

  useEffect(() => {
    // Update the shared settings object
    terrainSettings.zoom = settings.zoom
    terrainSettings.elevation = settings.elevation
    
    // Trigger redraw if sketch exists
    if (p5SketchInstance) {
      p5SketchInstance.redraw()
    }
  }, [settings])

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
