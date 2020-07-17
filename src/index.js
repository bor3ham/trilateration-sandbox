import React, { useRef, useState, useEffect } from 'react'
import ReactDom from 'react-dom'

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
    // draw beacon a
    context.beginPath()
    context.arc(beaconA.x, beaconA.y, 5, 0, 2 * Math.PI)
    context.fillStyle = '#0b0'
    context.fill()
    // draw beacon b
    context.beginPath()
    context.arc(beaconB.x, beaconB.y, 5, 0, 2 * Math.PI)
    context.fillStyle = '#e0e'
    context.fill()
    // draw beacon c
    context.beginPath()
    context.arc(beaconC.x, beaconC.y, 5, 0, 2 * Math.PI)
    context.fillStyle = '#0ee'
    context.fill()
    // draw test spot
    context.beginPath()
    context.arc(testSpot.x, testSpot.y, 10, 0, 2 * Math.PI)
    context.strokeStyle = '#f00'
    context.lineWidth = '2'
    context.stroke()
  }

  // draw on any change
  useEffect(() => {
    console.log('there was a change')
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
      />
    </>
  )
}

const mount = document.querySelector('.trilateration-sandbox-mount')
if (mount) {
  ReactDom.render(<TrilaterationSandbox />, mount)
}
