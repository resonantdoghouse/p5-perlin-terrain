import './style.css'

import p5 from 'p5'

const sketch = (p5) => {
  const generateTerrain = () => {
    for (let x = 0; x < window.innerWidth; x += 6) {
      const offsetX = 0.02 * x // cache x offset
      for (let y = 0; y < window.innerHeight; y += 6) {
        const offsetY = 0.02 * y // cache y offset
        let c = 255 * p5.noise(offsetX, offsetY)
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
  }

  p5.setup = () => {
    p5.createCanvas(window.innerWidth, window.innerHeight)
    p5.background(0)
    p5.noStroke()
    p5.noLoop()
  }

  p5.draw = () => {
    generateTerrain()
  }

  p5.windowResized = () => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight)
  }
}

new p5(sketch)
