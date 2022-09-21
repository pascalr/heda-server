import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client';

const App = () => {
  return <h2>IT WORKS!!!</h2>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = createRoot(document.getElementById("root"));
  root.render(<App/>);
})
