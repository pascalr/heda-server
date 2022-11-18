import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { RecipeEditor } from "./recipe_editor"
import { UserThumbnailImage, RecipeSmallImage, RecipeThumbnailImage, RecipeImage } from "./image"
import { ajax, preloadImage } from "./utils"
import { t } from "../translate"
import { Carrousel } from "./carrousel"
import { initHcu, useHcuState } from '../hcu'
import { getUrlParams, localeHref } from "../utils"
import { MainSearch } from './main_search'
import { getLocale, Link } from "./lib"
import { SuggestionsPage } from "./suggestions"

export const Home = () => {

  //window.gon = {...JSON.parse("{\"locale\":\"EN\",\"recipes1\":[{\"id\":88,\"name\":\"Pain aux bananes\",\"image_slug\":\"169.jpeg\"},{\"id\":113,\"name\":\"Croustade aux pommes\",\"image_slug\":\"134.jpeg\"},{\"id\":129,\"name\":\"Bûche de noël\",\"image_slug\":\"150.jpg\"},{\"id\":323,\"name\":\"Biscuits aux brisures de chocolat\",\"image_slug\":\"15.jpg\"},{\"id\":669,\"name\":\"Biscuits aux amandes\",\"image_slug\":\"132.jpeg\"},{\"id\":670,\"name\":\"Cowboy cookies\",\"image_slug\":\"161.jpeg\"},{\"id\":672,\"name\":\"Biscuits à la crème sure\",\"image_slug\":\"145.jpeg\"},{\"id\":689,\"name\":\"Biscuits à l'avoine et aux raisins secs\",\"image_slug\":\"138.jpeg\"}],\"recipes2\":[{\"id\":66,\"name\":\"Purée de courge poivrée\",\"image_slug\":\"2.jpg\"},{\"id\":558,\"name\":\"Potage à la citrouille\",\"image_slug\":\"181.jpeg\"},{\"id\":755,\"name\":\"Quiche aux épinards\",\"image_slug\":\"139.jpeg\"},{\"id\":757,\"name\":\"Hamburger aux haricots noirs et riz\",\"image_slug\":\"133.jpeg\"}],\"recipe\":{\"id\":82,\"user_id\":5,\"name\":\"Confiture de canneberge\",\"recipe_kind_id\":null,\"main_ingredient_id\":null,\"preparation_time\":null,\"cooking_time\":null,\"total_time\":null,\"json\":\"{\\\"type\\\":\\\"doc\\\",\\\"content\\\":[{\\\"type\\\":\\\"step\\\",\\\"attrs\\\":{\\\"first\\\":false},\\\"content\\\":[{\\\"type\\\":\\\"text\\\",\\\"text\\\":\\\"Ajouter l'eau et le sucre dans une casserole et porter à ébullition.\\\"}]},{\\\"type\\\":\\\"ings\\\",\\\"attrs\\\":{\\\"raw\\\":\\\"1-2\\\"}},{\\\"type\\\":\\\"step\\\",\\\"attrs\\\":{\\\"first\\\":false},\\\"content\\\":[{\\\"type\\\":\\\"text\\\",\\\"text\\\":\\\"Ajouter \\\"},{\\\"type\\\":\\\"ing\\\",\\\"attrs\\\":{\\\"raw\\\":\\\"3\\\"}},{\\\"type\\\":\\\"text\\\",\\\"text\\\":\\\" et cuire pendant 8 à 10 minutes. Les canneberges devraient commencer à se défaire et la sauce devrait commencer à s'épaissir.\\\"}]},{\\\"type\\\":\\\"step\\\",\\\"attrs\\\":{\\\"first\\\":false},\\\"content\\\":[{\\\"type\\\":\\\"text\\\",\\\"text\\\":\\\"Réfrigérer et servir froid.\\\"}]}]}\",\"ingredients\":\"1 t; sucre\\n1 t; eau\\n2 t; canneberges surgelées\\n\",\"image_slug\":\"148.jpeg\"}}"), ...(window.gon||{})}

  window.disableLazyLoading = getUrlParams().disableLazyLoading

  const locale = getLocale()
  const recipe = useHcuState([gon.recipe], {tableName: 'recipes'})[0]
  const images = useHcuState([], {tableName: 'images'})

  if (!window.hcu) {initHcu(); window.hcu.makeDummy() }

  const preloadItem = (i) => {if (i.image_slug) {preloadImage('/imgs/small/'+i.image_slug)}}
  return <>
    <MainSearch {...{locale, renderingHome: true}} />
    <div style={{padding: '4em 0.3em 8em 0.3em', maxWidth: '70em', margin: 'auto'}}>
      <div className="d-block d-md-flex">
        <div className='flex-grow-1'></div>
        <div style={{width: '25em', maxWidth: '100%', margin: 'auto', fontFamily: 'Montserra'}}>
          <h1 className="fs-25">Heda cuisine</h1>
          <h5><i>{t('Home_2')}</i></h5>
          <p className="py-3 fs-095">{t('Home_1')}</p>
          <Link className="btn btn-primary" style={{padding: '0.5em 3em', margin: 'auto'}} path={"/login"}>{t('Sign_in')} ({t('beta')})</Link>
        </div>
        <div className='flex-grow-1' style={{height: '3em'}}></div>
        <div style={{width: '25em', maxWidth: '100%', margin: 'auto'}}>
          <RecipeImage {...{recipe: {image_slug: '131.jpeg'}, variant: 'original'}} width="380" height="300" />
        </div>
        <div className='flex-grow-1'></div>
      </div>
    </div>
    <hr style={{border: '1px solid black', width: '70%', margin: 'auto'}} />
    <div style={{padding: '5em 0.3em', backgroundColor: '#fafbfc'}}>
      <div className='d-flex align-items-center' style={{maxWidth: '50em', margin: 'auto'}}>
        <div className="smartphone d-none d-sm-block">
          <div className='content'>
            <iframe src={localeHref("/k/51")} style={{width: '100%', border: 'none', height: '100%'}}/>
          </div>
        </div>
        <div style={{width: '2em', flexShrink: '0'}}/>
        <div className="ff-montserra">
          <h2>{t('Home_11')}</h2>
          <p>{t('Home_12')}</p>
          <p>{t('Home_13')}</p>
        </div>
      </div>
    </div>
    <hr style={{border: '1px solid black', width: '70%', margin: 'auto'}} />
    <div className='trunk'style={{padding: '5em 0.3em'}}>
      <div className="ff-montserra" style={{maxWidth: '40em', margin: 'auto'}}>
        <h2>{t('Home_3')}</h2>
        <p>{t('Home_4')}</p>
      </div>
      <SuggestionsPage />
    </div>
    <hr style={{border: '1px solid black', width: '70%', margin: 'auto'}} />
    <div style={{padding: '5em 0.3em', backgroundColor: '#fafbfc'}}>
      <div className="trunk">
        <div className="ff-montserra mb-2">
          <h2>{t('Home_9')}</h2>
          <p>{t('Home_10')}</p>
        </div>
        <div style={{border: "2px solid black", padding: '0.5em', borderRadius: '5px'}}>
          <RecipeEditor recipe={recipe} images={images} mixes={[]} foods={[]} locale={locale} editable={true} user={{id: recipe.user_id}} />
        </div>
      </div>
    </div>
    <hr style={{border: '1px solid black', width: '70%', margin: 'auto'}} />
    <div style={{padding: '5em 0.3em'}}>
      <div className="trunk">
        <div className="ff-montserra mb-2">
          <h2>{t('About_HedaCuisine')}</h2>
          <p>{t('Home_14')}</p>
          <h4>{t('Timeline')}</h4>
          <ul>
            <li>{t('Home_15')}</li>
            <li>{t('Home_16')}</li>
          </ul>
          <h4>{t('Features')}</h4>
          <ul>
            <li>✅ {t('Home_17')}</li>
            <li>✅ {t('Home_18')}</li>
            <li>✅ {t('Home_27')}</li>
            <li>❌ {t('Home_19')}</li>
            <li>❌ {t('Home_20')}</li>
            <li>❌ {t('Home_21')}</li>
            <li>❌ {t('Home_22')}</li>
            <li>❌ {t('Home_23')}</li>
            <li>❌ {t('Home_24')}</li>
            <li>❌ {t('Home_25')}</li>
            <li>❌ {t('Home_26')}</li>
          </ul>
        </div>
      </div>
    </div>
  </>
}
