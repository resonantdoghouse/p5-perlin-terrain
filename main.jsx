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
    p.background(0)
    p.noStroke()
    p.noLoop()
  }

  p.draw = () => {
    p.background(0)
    generateTerrain(p)
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
    generateTerrain(p)
    p.redraw()
  }
}

const generateTerrain = (p) => {
  const maxX = window.innerWidth
  const maxY = window.innerHeight
  const numX = Math.ceil(maxX / terrainSettings.step)
  const numY = Math.ceil(maxY / terrainSettings.step)

  for (let i = 0; i < numX * numY; i++) {
    const x = (i % numX) * terrainSettings.step
    const y = Math.floor(i / numX) * terrainSettings.step

    const offsetX = terrainSettings.zoom * x
    const offsetY = terrainSettings.zoom * y

    let c = terrainSettings.elevation * p.noise(offsetX, offsetY)
    p.fill(c)

    if (c > 170) {
      p.fill(255, 255, 255) // mountain top
    } else if (c > 130) {
      p.fill(43, 45, 66) // mountain
    } else if (c > 76) {
      p.fill(0, 111, 50) // grass
    } else {
      p.fill(69, 123, 157) // water
    }
    
    p.rect(x, y, 10, 10)
  }
}

const App = () => {
  const settings = useControls('Terrain Settings', {
    zoom: { value: 0.02, min: 0.003, max: 0.09, step: 0.001 },
    elevation: { value: 255, min: 80, max: 350, step: 1 },
    step: { value: 6, min: 6, max: 12, step: 1 }
  })

  useEffect(() => {
    // Update the shared settings object
    terrainSettings = settings
    
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
