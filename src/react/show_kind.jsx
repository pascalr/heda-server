import React, { useState, useEffect, useRef } from 'react'

import { localeHref } from "../utils"
import { Carrousel } from "./carrousel"
import { RecipeSmallImage } from "./image"
import { MainSearch } from './main_search'
//import { getLocale } from "./lib"
import { t } from "../translate"
//import { IngredientList } from "./recipe_viewer"
//import { DescriptionTiptap, RecipeTiptap } from "./tiptap"
//import { prettyMinutes } from "../lib"

export const KindViewer = ({kind, ancestors, kinds, recipeKinds}) => {

  if (!kind) {return ''}

  let childCount = kind.child_count || 0

  return <>
    <div className="trunk">
      {!ancestors || ancestors.length === 0 ? '' :
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb" style={{margin: '-0.15em 0 0.5em 0'}}>
            {ancestors.map(k => {
              console.log('ancestor', k)
              return <li key={k.id} className="breadcrumb-item"><a href={localeHref('/d/'+k.id)}>{k.name}</a></li>
            })}
            <li className="breadcrumb-item active" aria-current="page">{kind.name}</li>
          </ol>
        </nav>
      }
      <h1>{kind.name}</h1>
      {recipeKinds.map(k => {
        return <div key={k.id} className="mb-3">
          <a href={localeHref("/k/"+k.id)} className="plain-link">
            <div className='d-flex'>
              <RecipeSmallImage {...{recipe: k}} />
              <div style={{width: '1em'}}/>
              <div>
                <div className='ff-satisfy fs-2 bold mt-3' style={{lineHeight: 1}}>{k.name}</div>
                <div className='fs-13'>({childCount} {childCount > 1 ? t('recipes') : t('recipe')})</div>
              </div>
            </div>
          </a>
        </div>
      })}
      {kinds.map(k => {
        return <div key={k.id}>
          <h2><a href={localeHref('/d/'+k.id)} className='plain-link'>{k.name}</a></h2>
          <Carrousel {...{items: k.recipeKinds||[]}}>{item => <>
            <a href={localeHref("/k/"+item.id)} className="plain-link">
              <RecipeSmallImage {...{recipe: item}} />
              <div className="mt-1 mb-3" style={{lineHeight: 1}}>{item.name}</div>
            </a>
          </>}</Carrousel>
        </div>
      })}
    </div>
  </>
}

export const ShowKind = () => {

  //const locale = getLocale()
  const [kind, ] = useState(gon.kind)
  const [kinds, ] = useState(gon.kinds)
  const [recipeKinds, ] = useState(gon.recipe_kinds)
  const [ancestors, ] = useState(gon.ancestors)

  return <>
    <MainSearch {...{locale}} />
    <KindViewer {...{kind, ancestors, kinds, recipeKinds}} />
  </>
}
