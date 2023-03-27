import * as dat from 'dat.gui'
import p5 from 'p5'
import './style.css'

const sketch = (p5) => {
  p5.setup = () => {
    p5.createCanvas(window.innerWidth, window.innerHeight)
    p5.background(0)
    p5.noStroke()
    p5.noLoop()
  }

  p5.draw = () => {
    generateTerrain(p5)
  }

  p5.windowResized = () => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight)
    generateTerrain()
    p5.redraw()
  }
}

const p5Sketch = new p5(sketch)

const terrainSettings = {
  zoom: 0.02,
  elevation: 255,
}

const gui = new dat.GUI()

const terrainSettingsFolder = gui.addFolder('Terrain Settings')

terrainSettingsFolder
  .add(terrainSettings, 'zoom', 0.006, 0.06)
  .onChange((value) => {
    terrainSettings.zoom = value
    p5Sketch.redraw()
  })

  terrainSettingsFolder
  .add(terrainSettings, 'elevation', 80, 350)
  .onChange((value) => {
    terrainSettings.elevation = value
    p5Sketch.redraw()
  })

terrainSettingsFolder.open()

const generateTerrain = (p5) => {
  const step = 6
  const maxX = window.innerWidth
  const maxY = window.innerHeight
  const numX = Math.ceil(maxX / step)
  const numY = Math.ceil(maxY / step)

  for (let i = 0; i < numX * numY; i++) {
    const x = (i % numX) * step
    const y = Math.floor(i / numX) * step

    const offsetX = terrainSettings.zoom * x
    const offsetY = terrainSettings.zoom * y

    let c = terrainSettings.elevation * p5.noise(offsetX, offsetY)
    p5.fill(c) // grayscale

    if (c > 170) {
      p5.fill(255, 255, 255) // mountain top
    } else if (c > 130) {
      p5.fill(43, 45, 66) // mountain
    } else if (c > 76) {
      p5.fill(0, 111, 50) // grass
    } else {
      p5.fill(69, 123, 157) // water
    }

    p5.rect(x, y, 10, 10) // draw shape
  }
}
