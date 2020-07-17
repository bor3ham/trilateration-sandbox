import React from 'react'
import ReactDom from 'react-dom'

function TrilaterationSandbox(props) {
  return (
    <p>Welcome to the trilateration sandbox</p>
  )
}

const mount = document.querySelector('.trilateration-sandbox-mount')
if (mount) {
  ReactDom.render(<TrilaterationSandbox />, mount)
}
