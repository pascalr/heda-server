import React, { useState, useEffect, useRef } from 'react'

import { Carrousel } from './carrousel'
import { preloadImage } from "./utils"
import { RecipeSmallImage } from "./image"
import { Link, currentPathIs } from "./lib"
import { t } from "../translate"

export const HomeTab = ({title, path}) => {
  const isActive = currentPathIs(path)
  return <>
    <li className="nav-item">
      <Link {...{path, className: 'nav-link', active: isActive}}>{title}</Link>
    </li>
  </>
}

/**
 * This file contains small components that I don't want to create a file for them
 * because I find them too small.
 */

export const RecipeCarrousel = ({items, isRecipeKind}) => {
  const preloadItem = (i) => {if (i.image_slug) {preloadImage('/imgs/small/'+i.image_slug)}}
  let p = isRecipeKind ? '/k/' : '/r/'
  return <>
    <Carrousel {...{items, preloadItem, maxItems: 3}}>{item => <>
      <Link {...{className: 'plain-link', path: p+item.id}}>
        <RecipeSmallImage {...{recipe: item}} />
        <div className="mt-1 mb-3" style={{lineHeight: 1}}>{item.name} {isRecipeKind ? <span className='d-inline-block fs-075'>{'('+(item.recipe_count||0)+' '+(item.recipe_count > 1 ? t('recipes') : t('recipe'))+')'}</span> : null}</div>
      </Link>
    </>}</Carrousel>
  </>
}
