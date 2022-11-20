import React, { useState, useEffect, useRef } from 'react'

import { RecipeCarrousel } from "./core"
import { getLocale, Link } from "./lib"
import { getUrlParams } from "../utils"
import { t } from "../translate"

export const ExploreViewer = ({kinds, recipeKindsByAncestorId}) => {

  return <>
    <div className='trunk'>
      {kinds.map(kind => {
        return <div key={kind.id}>
          <h2 className="fs-14 bold"><a href={'/d/'+kind.id} className="plain-link">{kind.name}</a></h2>
          <RecipeCarrousel {...{items: recipeKindsByAncestorId[kind.id], isRecipeKind: true}}/>
        </div>
      })}
    </div>
  </> 
}

export const ShowExplore = () => {

  const locale = getLocale()
  const [kinds, ] = useState(gon.kinds)
  const [recipeKindsByAncestorId, ] = useState(gon.recipeKindsByAncestorId)
  
  window.disableLazyLoading = getUrlParams().disableLazyLoading

  return <ExploreViewer {...{kinds, recipeKindsByAncestorId}} />
}
