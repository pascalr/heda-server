import React, { useState, useEffect, useRef } from 'react'

import { RecipeCarrousel } from "./core"
import { getLocale, Link } from "./lib"
import { getUrlParams } from "../utils"

export const ExploreViewer = ({roots}) => {

  return <>
    <div className='trunk'>
      {roots.map(root => {
        return <div key={root.id}>
          <h2 className="fs-14 bold"><a href={'/k/'+root.id} className="plain-link">{root.name}</a></h2>
          <RecipeCarrousel {...{items: root.children, isRecipeKind: true}}/>
        </div>
      })}
    </div>
  </> 
}

export const ShowExplore = () => {

  const locale = getLocale()
  const [roots, ] = useState(gon.roots)
  
  window.disableLazyLoading = getUrlParams().disableLazyLoading

  return <ExploreViewer {...{roots}} />
}
