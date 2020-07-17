import React, { useRef, useState, useEffect } from 'react'
import ReactDom from 'react-dom'
import trilateration from 'node-trilateration'

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 800

function TrilaterationSandbox(props) {
  const canvasRef = useRef(null)
  const [testSpot, setTestSpot] = useState({x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2})

  const [beaconA, setBeaconA] = useState({x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.1})
  const [beaconB, setBeaconB] = useState({x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.25})
  const [beaconC, setBeaconC] = useState({x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.8})

  const redraw = () => {
    if (!canvasRef.current) {
      return
    }
    const context = canvasRef.current.getContext('2d')

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
    const result = trilateration.calculate([
      {...beaconA, distance: distance(testSpot, beaconA)},
      {...beaconB, distance: distance(testSpot, beaconB)},
      {...beaconC, distance: distance(testSpot, beaconC)},
    ])
    // draw result spot
    context.beginPath()
    context.arc(result.x, result.y, 5, 0, 2 * Math.PI)
    context.fillStyle = '#44e'
    context.fill()
  }

  // redraw on any change
  useEffect(() => {
    redraw()
  }, [
    testSpot.x,
    testSpot.y,
  ])

  const handleCanvasClick = (event) => {
    if (!canvasRef.current) {
      return
    }
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - canvasRect.x
    const y = event.clientY - canvasRect.y
    setTestSpot({x, y})
  }

  return (
    <>
      <h1>Trilateration Sandbox</h1>
      <p>Welcome to the trilateration sandbox</p>
      <p>Test location: ({testSpot.x}, {testSpot.y})</p>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        style={{cursor: 'crosshair'}}
      />
    </>
  )
}

const mount = document.querySelector('.trilateration-sandbox-mount')
if (mount) {
  ReactDom.render(<TrilaterationSandbox />, mount)
}
