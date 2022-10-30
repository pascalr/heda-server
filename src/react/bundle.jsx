import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { ShowError } from "./error"
import { Home } from "./home"
import { App } from "./app"
import { ShowRecipe } from "./show_recipe"
import { ShowUser } from "./show_user"
import { getUrlParams } from "../utils"

// I want the javascript to load after the images on the front page.
// It works, but I have to remove this listener because it does not get this event anymore.
//document.addEventListener('DOMContentLoaded', () => {

window.locale = getUrlParams(window.location.href).locale

let root = document.getElementById('root-err')
if (root) {ReactDOM.render(<ShowError />, root)}

root = document.getElementById('root-home')
if (root) { ReactDOM.render(<Home />, root) }

root = document.getElementById('root')
if (root) {ReactDOM.render(<App/>, root)}
  
root = document.getElementById('root-r')
if (root) {ReactDOM.render(<ShowRecipe />, root)}
  
root = document.getElementById('root-u')
if (root) {ReactDOM.render(<ShowUser />, root)}
