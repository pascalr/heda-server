import React, { useState, useEffect, useRef } from 'react'

import { RecipeCarrousel } from "./core"
import { RecipeSmallImage } from "./image"
import { MainSearch } from './main_search'
import { getLocale, Link } from "./lib"
import { t } from "../translate"
//import { IngredientList } from "./recipe_viewer"
//import { DescriptionTiptap, RecipeTiptap } from "./tiptap"
//import { prettyMinutes } from "../lib"

export const KindViewer = ({kind, ancestors, kinds, recipeKinds}) => {

  if (!kind) {return ''}

  return <>
    <div className="trunk">
      {!ancestors?.length ? null :
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb" style={{margin: '-0.15em 0 0.5em 0'}}>
            {ancestors.map(k => {
              console.log('ancestor', k)
              return <li key={k.id} className="breadcrumb-item"><Link path={'/d/'+k.id}>{k.name}</Link></li>
            })}
            <li className="breadcrumb-item active" aria-current="page">{kind.name}</li>
          </ol>
        </nav>
      }
      <h1>{kind.name}</h1>
      {(kinds||[]).map(k => {
        return <div key={k.id}>
          <h2><Link path={'/d/'+k.id} className='plain-link'>{k.name}</Link></h2>
          <RecipeCarrousel items={k.recipeKinds||[]} isRecipeKind={true} />
        </div>
      })}
      {(recipeKinds||[]).map(k => {
        let count = k.recipe_count || 0
        return <div key={k.id} className="mb-3">
          <Link path={"/k/"+k.id} className="plain-link">
            <div className='d-block d-xsm-flex'>
              <RecipeSmallImage {...{recipe: k}} />
              <div style={{width: '1em', marginTop: '-0.5em'}}/>
              <div>
                <div className='ff-satisfy fs-2 bold mt-3' style={{lineHeight: 1}}>{k.name}</div>
                <div className='fs-13'>({count} {count > 1 ? t('recipes') : t('recipe')})</div>
              </div>
            </div>
          </Link>
        </div>
      })}
    </div>
  </>
}

export const ShowKind = () => {

  const locale = getLocale()
  const [kind, ] = useState(gon.kind)
  const [kinds, ] = useState(gon.kinds)
  const [recipeKinds, ] = useState(gon.recipe_kinds)
  const [ancestors, ] = useState(gon.ancestors)

  return <>
    <MainSearch {...{locale}} />
    <KindViewer {...{kind, ancestors, kinds, recipeKinds}} />
  </>
}
