import React, { useRef, useState, useEffect } from 'react'
import ReactDom from 'react-dom'
import trilateration from 'node-trilateration'
import seedRandom from 'seedrandom'

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 600

const TRANSLATION_MIN = -500
const TRANSLATION_MAX = 500
const TRANSLATION_STEP = 10

const ROTATION_STEP = 1

const BEACON_SCALE_MIN = 0.1
const BEACON_SCALE_MAX = 5
const BEACON_SCALE_STEP = 0.025

const DISTANCE_SCALE_MIN = 0.1
const DISTANCE_SCALE_MAX = 5
const DISTANCE_SCALE_STEP = 0.025

const NOISE_MIN = 0
const NOISE_MAX = 100
const NOISE_STEP = 1

function TrilaterationSandbox(props) {
  const canvasRef = useRef(null)
  const [testSpot, setTestSpot] = useState({x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2})

  const [beaconA, setBeaconA] = useState({x: CANVAS_WIDTH * 0.3, y: CANVAS_HEIGHT * 0.1})
  const [beaconB, setBeaconB] = useState({x: CANVAS_WIDTH * 0.7, y: CANVAS_HEIGHT * 0.25})
  const [beaconC, setBeaconC] = useState({x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.8})

  const [xTranslation, setXTranslation] = useState(0)
  const [yTranslation, setYTranslation] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [xScale, setXScale] = useState(1)
  const [yScale, setYScale] = useState(1)
  const [lockScale, setLockScale] = useState(true)
  const [uniformScaleAdjustment, setUniformScaleAdjustment] = useState(true)
  const [distanceScale, setDistanceScale] = useState(1)
  const [drawTransformation, setDrawTransformation] = useState(false)
  const [drawCalculation, setDrawCalculation] = useState(true)
  const [noise, setNoise] = useState(0)

  const [clicking, setClicking] = useState(false)

  const redraw = () => {
    if (!canvasRef.current) {
      return
    }
    const context = canvasRef.current.getContext('2d')

    const seed = Math.random()

    const radian = (degree) => {
      return (degree / 180) * Math.PI
    }
    const transform = (loc, rng) => {
      let x = loc.x
      let y = loc.y
      x += (rng() - 0.5) * noise
      y += (rng() - 0.5) * noise
      x += +xTranslation
      y += +yTranslation
      const rotationRadian = radian(rotation)
      const origX = x
      const origY = y
      x = (origX * Math.cos(rotationRadian)) - (origY * Math.sin(rotationRadian))
      y = (origY * Math.cos(rotationRadian)) + (origX * Math.sin(rotationRadian))
      x *= xScale
      y *= yScale
      return {x, y}
    }
    const untransform = (loc) => {
      let x = loc.x
      let y = loc.y
      x /= xScale
      y /= yScale
      const rotationRadian = radian(-rotation)
      const origX = x
      const origY = y
      x = (origX * Math.cos(rotationRadian)) - (origY * Math.sin(rotationRadian))
      y = (origY * Math.cos(rotationRadian)) + (origX * Math.sin(rotationRadian))
      x -= +xTranslation
      y -= +yTranslation
      return {x, y}
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

    if (drawTransformation) {
      const rng = seedRandom(seed)
      drawBeacon(transform(beaconA, rng), '#0b03')
      drawBeacon(transform(beaconB, rng), '#e0e3')
      drawBeacon(transform(beaconC, rng), '#f003')
    }

    // draw test spot
    context.beginPath()
    context.arc(testSpot.x, testSpot.y, 20, 0, 2 * Math.PI)
    context.strokeStyle = '#44e4'
    context.lineWidth = '2'
    context.stroke()

    const drawResult = (result, colour) => {
      context.beginPath()
      context.arc(result.x, result.y, 5, 0, 2 * Math.PI)
      context.fillStyle = colour
      context.fill()
    }

    // calculate result spot
    const distance = (loc1, loc2) => {
      return Math.pow(Math.pow(loc1.x - loc2.x, 2) + Math.pow(loc1.y - loc2.y, 2), 0.5)
    }
    const rng = seedRandom(seed)
    const transformedBeaconA = transform(beaconA, rng)
    const transformedBeaconB = transform(beaconB, rng)
    const transformedBeaconC = transform(beaconC, rng)
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
    beaconADistance *= distanceScale
    beaconBDistance *= distanceScale
    beaconCDistance *= distanceScale
    let result = trilateration.calculate([
      {...transformedBeaconA, distance: beaconADistance},
      {...transformedBeaconB, distance: beaconBDistance},
      {...transformedBeaconC, distance: beaconCDistance},
    ])
    if (drawTransformation) {
      drawResult(result, '#44e3')
    }
    result = untransform(result)

    // draw calculation visualisation
    const drawDistance = (beacon, distance, colour) => {
      context.beginPath()
      context.arc(beacon.x, beacon.y, distance, 0, 2 * Math.PI)
      context.strokeStyle = colour
      context.lineWidth = '1'
      context.stroke()
    }
    if (drawCalculation) {
      const rng = seedRandom(seed)
      drawDistance(transform(beaconA, rng), beaconADistance,  '#0b03')
      drawDistance(transform(beaconB, rng), beaconBDistance, '#e0e3')
      drawDistance(transform(beaconC, rng), beaconCDistance, '#f003')
    }

    // draw result spot
    drawResult(result, '#44e')
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

  const handleTransformationReset = (event) => {
    if (event) {
      event.preventDefault()
    }
    setXTranslation(0)
    setYTranslation(0)
    setRotation(0)
    setXScale(1)
    setYScale(1)
  }
  const handleXTranslationChange = (event) => {
    setXTranslation(event.target.value)
  }
  const handleYTranslationChange = (event) => {
    setYTranslation(event.target.value)
  }
  const handleRotationChange = (event) => {
    setRotation(event.target.value)
  }
  const handleXScaleChange = (event) => {
    setXScale(event.target.value)
    if (lockScale) {
      setYScale(event.target.value)
    }
  }
  const handleYScaleChange = (event) => {
    setYScale(event.target.value)
    if (lockScale) {
      setXScale(event.target.value)
    }
  }
  const handleLockScaleChange = (event) => {
    setLockScale(event.target.checked)
  }
  const handleUniformScaleAdjustmentChange = (event) => {
    setUniformScaleAdjustment(event.target.checked)
  }
  const handleDistanceScaleChange = (event) => {
    setDistanceScale(event.target.value)
  }
  const handleNoiseChange = (event) => {
    setNoise(event.target.value)
  }
  const handleDrawTransformationChange = (event) => {
    setDrawTransformation(event.target.checked)
  }
  const handleDrawCalculationChange = (event) => {
    setDrawCalculation(event.target.checked)
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
    xTranslation,
    yTranslation,
    rotation,
    xScale,
    yScale,
    uniformScaleAdjustment,
    distanceScale,
    noise,
    drawTransformation,
    drawCalculation,
  ])

  return (
    <>
      <h1>Trilateration Sandbox</h1>
      <p>Test location: ({testSpot.x}, {testSpot.y})</p>
      <p><em>Click canvas below to change</em></p>
      <p>
        Identify inaccuracies by adjusting the following transformation, which is applied to the
        trilateration algorithm's beacon locations then reversed to draw relative to the original
        test spot.
      </p>
      <p>
        The blue ring represents the exact location of your test spot. The blue dot is the result
        of the trilateration algorithm. If all goes well, the dot appears exactly in the centre
        of the ring.
      </p>
      <h2>Transformation (<a href="#" onClick={handleTransformationReset}>reset</a>)</h2>
      <div>
        <label>X Translation</label>
        <input
          type="range"
          min={TRANSLATION_MIN}
          max={TRANSLATION_MAX}
          step={TRANSLATION_STEP}
          value={xTranslation}
          onChange={handleXTranslationChange}
        />
        <input type="text" value={xTranslation} onChange={handleXTranslationChange} />
      </div>
      <div>
        <label>Y Translation</label>
        <input
          type="range"
          min={TRANSLATION_MIN}
          max={TRANSLATION_MAX}
          step={TRANSLATION_STEP}
          value={yTranslation}
          onChange={handleYTranslationChange}
        />
        <input type="text" value={yTranslation} onChange={handleYTranslationChange} />
      </div>
      <div>
        <label>Rotation</label>
        <input
          type="range"
          min={-180}
          max={180}
          step={ROTATION_STEP}
          value={rotation}
          onChange={handleRotationChange}
        />
        <input type="text" value={rotation} onChange={handleRotationChange} />
      </div>
      <div>
        <label>X Scale</label>
        <input
          type="range"
          min={BEACON_SCALE_MIN}
          max={BEACON_SCALE_MAX}
          step={BEACON_SCALE_STEP}
          value={xScale}
          onChange={handleXScaleChange}
        />
        <input type="text" value={xScale} onChange={handleXScaleChange} />
      </div>
      <div>
        <label>Y Scale</label>
        <input
          type="range"
          min={BEACON_SCALE_MIN}
          max={BEACON_SCALE_MAX}
          step={BEACON_SCALE_STEP}
          value={yScale}
          onChange={handleYScaleChange}
        />
        <input type="text" value={yScale} onChange={handleYScaleChange} />
        <label>
          <input
            type="checkbox"
            checked={lockScale}
            onChange={handleLockScaleChange}
          />
          Lock Scales Together
        </label>
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
        <p>
          Use this setting to emulate uniform scaling adjustment - a hack to handle scaling of
          beacons by a uniform scaling factor even with a trilateration algorithm that is
          unit-dependent.
        </p>
      </div>
      <div>
        <label>Distance Scale</label>
        <input
          type="range"
          min={DISTANCE_SCALE_MIN}
          max={DISTANCE_SCALE_MAX}
          step={DISTANCE_SCALE_STEP}
          value={distanceScale}
          onChange={handleDistanceScaleChange}
        />
        <input type="text" value={distanceScale} onChange={handleDistanceScaleChange} />
      </div>
      <div>
        <label>Noise</label>
        <input
          type="range"
          min={NOISE_MIN}
          max={NOISE_MAX}
          step={NOISE_STEP}
          value={noise}
          onChange={handleNoiseChange}
        />
        <input type="text" value={noise} onChange={handleNoiseChange} />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={drawTransformation}
            onChange={handleDrawTransformationChange}
          />
          Draw Transformation (for debug purposes)
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={drawCalculation}
            onChange={handleDrawCalculationChange}
          />
          Draw Calculation Visualisation
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
