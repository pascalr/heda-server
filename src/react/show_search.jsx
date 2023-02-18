import React, { useState } from 'react'
import { getLocale } from '../lib'
import { translate } from '../translate'
import { Link } from './lib'

export const ShowSearch = () => {

  const locale = getLocale()
  const [query, ] = useState(gon.query)
  const [recipeKinds] = useState(gon.recipeKinds)
  const [recipes] = useState(gon.recipes)
  const t = translate(locale)

{/* <div className='d-flex align-items-end'>
      <UserThumbnailImage {...{user}} />
      <h2 className="fs-14 bold">{user.name}</h2>
    </div> */}
  return <>
    <div className='trunk'>
      <h1>{t('Search')} {query}</h1>
      <h2>Catégories</h2>

      <h2>Recettes</h2>
      <ul>
        {recipes.map(recipe => (
          <li key={recipe.id}>
            <Link path={'/r/'+recipe.id} className='plain-link'>
              {recipe.name} — Pascal
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </>
}
