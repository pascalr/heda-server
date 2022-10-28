import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { MainSearch } from './main_search'
import { getUrlParams } from "../utils"

const ShowError = () => {

  const [locale, ] = useState(gon.locale)

  return <>
    <MainSearch {...{locale}} />
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  window.locale = getUrlParams(window.location.href).locale
  const root = document.getElementById('root-err')
  if (root) {ReactDOM.render(<ShowError />, root)}
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
