import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { useMainSearch, MainSearch } from './main_search'
import { getUrlParams } from "../utils"

const ShowError = () => {

  const isSearching = useMainSearch()

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0'}}>
      {isSearching ? <MainSearch /> : ''}
    </div>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  window.locale = getUrlParams(window.location.href).locale
  const root = document.getElementById('root-err')
  if (root) {ReactDOM.render(<ShowError />, root)}
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
