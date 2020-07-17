import React, { useRef, useState, useEffect } from 'react'
import ReactDom from 'react-dom'
import trilateration from 'node-trilateration'

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 600

function TrilaterationSandbox(props) {
  const canvasRef = useRef(null)
  const [testSpot, setTestSpot] = useState({x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2})

  const [beaconA, setBeaconA] = useState({x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.1})
  const [beaconB, setBeaconB] = useState({x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.25})
  const [beaconC, setBeaconC] = useState({x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.8})

  const [xScale, setXScale] = useState(1)
  const [yScale, setYScale] = useState(1)
  const [uniformScaleAdjustment, setUniformScaleAdjustment] = useState(true)

  const [clicking, setClicking] = useState(false)

  const redraw = () => {
    if (!canvasRef.current) {
      return
    }
    const context = canvasRef.current.getContext('2d')

    const transform = (loc) => {
      return {
        x: loc.x * xScale,
        y: loc.y * yScale,
      }
    }
    const untransform = (loc) => {
      return {
        x: loc.x / xScale,
        y: loc.y / yScale,
      }
    }

    // fill background white
    context.beginPath()
    context.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    context.fillStyle = '#fff'
    context.fill()

    // draw beacons
    const drawBeacon = (beacon, colour) => {
      context.beginPath()
      context.arc(beacon.x, beacon.y, 5, 0, 2 * Math.PI)
      context.fillStyle = colour
      context.fill()
    }
    drawBeacon(beaconA, '#0b0')
    drawBeacon(beaconB, '#e0e')
    drawBeacon(beaconC, '#f00')

    // draw test spot
    context.beginPath()
    context.arc(testSpot.x, testSpot.y, 20, 0, 2 * Math.PI)
    context.strokeStyle = '#44e4'
    context.lineWidth = '2'
    context.stroke()

    // calculate result spot
    const distance = (loc1, loc2) => {
      return Math.pow(Math.pow(loc1.x - loc2.x, 2) + Math.pow(loc1.y - loc2.y, 2), 0.5)
    }
    const transformedBeaconA = transform(beaconA)
    const transformedBeaconB = transform(beaconB)
    const transformedBeaconC = transform(beaconC)
    let beaconADistance = distance(testSpot, beaconA)
    let beaconBDistance = distance(testSpot, beaconB)
    let beaconCDistance = distance(testSpot, beaconC)
    if (uniformScaleAdjustment) {
      const beaconsScale = (bec1, bec2, bec3) => {
        const dist12 = distance(bec1, bec2)
        const dist13 = distance(bec1, bec3)
        const dist23 = distance(bec2, bec3)
        return (dist12 + dist13 + dist23) / 3
      }
      const originalScale = beaconsScale(beaconA, beaconB, beaconC)
      const transformedScale = beaconsScale(transformedBeaconA, transformedBeaconB, transformedBeaconC)
      const scaleAdjustment = originalScale / transformedScale
      beaconADistance /= scaleAdjustment
      beaconBDistance /= scaleAdjustment
      beaconCDistance /= scaleAdjustment
    }
    const result = untransform(trilateration.calculate([
      {...transformedBeaconA, distance: beaconADistance},
      {...transformedBeaconB, distance: beaconBDistance},
      {...transformedBeaconC, distance: beaconCDistance},
    ]))
    // draw result spot
    context.beginPath()
    context.arc(result.x, result.y, 5, 0, 2 * Math.PI)
    context.fillStyle = '#44e'
    context.fill()
  }

  const updateTestSpot = (event) => {
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - canvasRect.x
    const y = event.clientY - canvasRect.y
    setTestSpot({x, y})
  }
  const handleCanvasMouseDown = (event) => {
    if (!canvasRef.current) {
      return
    }
    setClicking(true)
    updateTestSpot(event)
  }
  const handleCanvasMouseMove = (event) => {
    if (!clicking) {
      return
    }
    updateTestSpot(event)
  }
  const handleDocumentMouseUp = (event) => {
    setClicking(false)
  }
  const handleXScaleChange = (event) => {
    setXScale(event.target.value)
  }
  const handleYScaleChange = (event) => {
    setYScale(event.target.value)
  }
  const handleUniformScaleAdjustmentChange = (event) => {
    setUniformScaleAdjustment(event.target.checked)
  }

  // document mouse listener
  useEffect(() => {
    document.addEventListener('mouseup', handleDocumentMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp)
    }
  }, [])
  // redraw on any change
  useEffect(() => {
    redraw()
  }, [
    testSpot.x,
    testSpot.y,
    xScale,
    yScale,
    uniformScaleAdjustment,
  ])

  return (
    <>
      <h1>Trilateration Sandbox</h1>
      <p>Welcome to the trilateration sandbox</p>
      <p>Test location: ({testSpot.x}, {testSpot.y})</p>
      <h2>Transformation</h2>
      <p>
        Identify inaccuracies by adjusting the following transformation, which is applied to the
        trilateration algorithm's beacon locations then reversed to draw relative to the original
        test spot.
      </p>
      <div>
        <label>X Scale</label>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={xScale}
          onChange={handleXScaleChange}
        />
        <input type="text" value={xScale} onChange={handleXScaleChange} />
      </div>
      <div>
        <label>Y Scale</label>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={yScale}
          onChange={handleYScaleChange}
        />
        <input type="text" value={yScale} onChange={handleYScaleChange} />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={uniformScaleAdjustment}
            onChange={handleUniformScaleAdjustmentChange}
          />
          Uniform Scale Adjustment
        </label>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        style={{cursor: 'crosshair'}}
      />
    </>
  )
}

const mount = document.querySelector('.trilateration-sandbox-mount')
if (mount) {
  ReactDom.render(<TrilaterationSandbox />, mount)
}
