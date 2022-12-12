import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { PublicNavbar, AppNavbar } from './navbar'
import { Home } from "./home"
import { App } from "./app"
import { ShowRecipe } from "./show_recipe"
import { ShowRecipeKind } from "./show_recipe_kind"
import { ShowUser } from "./show_user"
import { ShowExplore } from "./show_explore"
import { getUrlParams } from "../utils"
import { getLocale } from "./lib"
import { ErrorBoundary } from './error_boundary'

export const AppSearchRoot = () => {

  // TODO: Show app search for /error
  return <>
    <AppNavbar {...{user, otherProfiles, _csrf, recipes, friendsRecipes, siblings, recipeKinds}} />
  </>
}

// I want the javascript to load after the images on the front page.
// It works, but I have to remove this listener because it does not get this event anymore.
//document.addEventListener('DOMContentLoaded', () => {

window.locale = getUrlParams(window.location.href).locale

let roots = {
  'root-search': <></>,
  'root-home': <Home/>,
  'root-r': <ShowRecipe/>,
  'root-x': <ShowExplore/>,
  'root-k': <ShowRecipeKind/>,
  'root-u': <ShowUser/>,
}

const PublicPage = ({children}) => {
  const locale = getLocale()
  return <>
    <PublicNavbar {...{locale}} />
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </>
}

root = document.getElementById('root-app-search')
if (root) {ReactDOM.render(<AppSearchRoot />, root)}

root = document.getElementById('root')
if (root) {ReactDOM.render(<App/>, root)}
  
Object.keys(roots).forEach(r => {
  root = document.getElementById(r)
  if (root) {ReactDOM.render(<PublicPage>{roots[r]}</PublicPage>, root)}
})
