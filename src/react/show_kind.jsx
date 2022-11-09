import React, { useState, useEffect, useRef } from 'react'

import { localeHref } from "../utils"
//import { RecipeMediumImage } from "./image"
import { MainSearch } from './main_search'
//import { getLocale } from "./lib"
//import { t } from "../translate"
//import { IngredientList } from "./recipe_viewer"
//import { DescriptionTiptap, RecipeTiptap } from "./tiptap"
//import { prettyMinutes } from "../lib"

export const KindViewer = ({kind, ancestors}) => {

  if (!kind) {return ''}

  return <>
    <div className="trunk">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb" style={{margin: '-0.15em 0 0.5em 0'}}>
          {(ancestors||[]).map(kind => {
            return <li key={kind.kid} className="breadcrumb-item"><a href={localeHref('/d/'+kind.id)}>{kind.name}</a></li>
          })}
          <li className="breadcrumb-item active" aria-current="page">{kind.name}</li>
        </ol>
      </nav>
      <h1>{kind.name}</h1>
    </div>
  </>
}

export const ShowKind = () => {

  //const locale = getLocale()
  const [kind, ] = useState(gon.kind)
  const [ancestors, ] = useState(gon.ancestors)

  return <>
    <MainSearch {...{locale}} />
    <KindViewer {...{kind, ancestors}} />
  </>
}
