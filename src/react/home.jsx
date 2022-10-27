import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { RecipeEditor } from "./recipe_editor"
import { UserThumbnailImage, RecipeSmallImage, RecipeThumbnailImage, RecipeImage } from "./image"
import { ajax } from "./utils"
import { t } from "../translate"
import { Carrousel } from "./app"
import { initHcu, useHcuState } from '../hcu'
import { localeHref, getUrlParams } from "../utils"
import { useMainSearch, MainSearch } from './main_search'

const Home = () => {

  const [recipes1, ] = useState(gon.recipes1)
  const [recipes2, ] = useState(gon.recipes2)
  const recipe = useHcuState([gon.recipe], {tableName: 'recipes'})[0]
  const isSearching = useMainSearch()
  
  if (!window.hcu) {initHcu(); window.hcu.makeDummy() }

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
      {isSearching ? <MainSearch /> : ''}
    </div>
    <div style={{padding: '3em 0.3em 5em 0.3em', maxWidth: '70em', margin: 'auto'}}>
      <div className="d-block d-md-flex">
        <div className='flex-grow-1'></div>
        <div style={{width: '25em', maxWidth: '100%', margin: 'auto', fontFamily: 'Montserra'}}>
          <h1 className="fs-25">Heda cuisine</h1>
          <h5><i>{t('Home_2')}</i></h5>
          <p className="py-3 fs-095">{t('Home_1')}</p>
          <a className="btn btn-primary" style={{padding: '0.5em 3em', margin: 'auto'}} href={localeHref("/login")}>{t('Sign_in')}</a>
        </div>
        <div className='flex-grow-1' style={{height: '3em'}}></div>
        <div style={{width: '25em', maxWidth: '100%', margin: 'auto'}}>
          <RecipeImage {...{recipe: {image_slug: '131.jpeg'}}} width="380" height="300" />
        </div>
        <div className='flex-grow-1'></div>
      </div>
    </div>
    <div style={{padding: '5em 0.3em', backgroundColor: '#fafbfc'}}>
      <div style={{maxWidth: '40em', margin: 'auto'}}>
        <h2>{t('Home_3')}</h2>
        <p>{t('Home_4')}</p>
      </div>
      <div className="trunk">
        <h3>{t('Home_8')}</h3>
        <Carrousel {...{items: recipes1}}>{item => <>
          <a href={"/r/"+item.id} className="plain-link">
            <RecipeSmallImage {...{recipe: item}} />
            <div className="mt-1 mb-3" style={{lineHeight: 1}}>{item.name}</div>
          </a>
        </>}</Carrousel>
        <h3>{t('Many_meals')}</h3>
        <Carrousel {...{items: recipes2}}>{item => <>
          <a href={"/r/"+item.id} className="plain-link">
            <RecipeSmallImage {...{recipe: item}} />
            <div className="mt-1 mb-3" style={{lineHeight: 1}}>{item.name}</div>
          </a>
        </>}</Carrousel>
      </div>
    </div>
    <div className="trunk" style={{padding: '5em 0.3em'}}>
      <div className="ff-montserra mb-2">
        <h2>{t('Home_9')}</h2>
        <p>{t('Home_10')}</p>
      </div>
      <div style={{border: "2px solid black", padding: '0.5em', borderRadius: '5px'}}>
        <RecipeEditor recipe={recipe} images={[]} mixes={[]} foods={[]} editable={true} user={{id: recipe.user_id}} />
      </div>
    </div>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  window.locale = getUrlParams(window.location.href).locale
  const root = document.getElementById('root-home')
  if (root) {ReactDOM.render(<Home />, root)}
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
