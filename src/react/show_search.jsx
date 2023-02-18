import React, { useState } from 'react'
import { getLocale } from '../lib'
import { translate } from '../translate'
import { urlWithLocale } from '../utils'
import { RecipeSmallImage, RecipeThumbnailImage } from './image'
import { Link } from './lib'

export const ShowSearch = () => {

  const locale = getLocale()
  const [query, ] = useState(gon.query)
  const [recipeKinds] = useState(gon.recipeKinds)
  const [recipes] = useState(gon.recipes)
  const t = translate(locale)

  /* <div className='d-flex align-items-end'>
    <UserThumbnailImage {...{user}} />
    <h2 className="fs-14 bold">{user.name}</h2>
  </div> */

    // {(recipeKinds||[]).map(k => {
    //   let count = k.recipe_count || 0
    //   return <div key={k.id} className="mb-3">
    //     <Link path={"/k/"+k.id} className="plain-link">
    //       <div className='d-block d-xsm-flex'>
    //         <RecipeSmallImage {...{recipe: k}} />
    //         <div style={{width: '1em', marginTop: '-0.5em'}}/>
    //         <div>
    //           <div className='ff-satisfy fs-2 bold mt-3' style={{lineHeight: 1}}>{k.name}</div>
    //           <div className='fs-13'>({count} {count > 1 ? t('recipes') : t('recipe')})</div>
    //         </div>
    //       </div>
    //     </Link>
    //   </div>
    // })}

  //let recipesByUsername = groupBy(recipe, '')

  return <>
    <div className='trunk'>
      {t('Searching_for')}: <b>{query}</b><br/><br/>
      <h2>Catégories</h2>
      <ul className="plain recipe-list">
        {(recipeKinds||[]).map(k => (
          <li key={k.id}>
          <Link id={'rk-'+k.id} path={urlWithLocale('/k/'+k.id, locale)} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}}>
            <div className="d-flex align-items-center">
              <RecipeThumbnailImage {...{recipe: k}} />
              <div style={{marginRight: '0.5em'}}></div>
              <div>{k.name}</div>
            </div>
          </Link>
        </li>
        ))}
      </ul>

      <h3>Recettes</h3>
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.id}>
            <Link path={'/r/'+recipe.id} className='plain-link'>
              {recipe.name} — {recipe.author}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </>
}
