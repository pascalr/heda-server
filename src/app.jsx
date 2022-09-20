import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'

const App = () => {
  return <h2>IT WORKS!!!</h2>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  if (root) {ReactDOM.render(<App/>, root)}
})
