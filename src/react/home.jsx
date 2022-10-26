import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { RecipeEditor } from "./recipe_editor"
import { UserThumbnailImage, RecipeSmallImage, RecipeThumbnailImage, RecipeMediumImage, RecipeImage } from "./image"
import { ajax, isBlank, normalizeSearchText, join, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { SingleCarrousel, Carrousel } from "./app"
import { initHcu, useHcuState } from '../hcu'
import { localeHref, getUrlParams } from "../utils"

export const MainSearch = () => {

  // Search is the text shown in the input field
  // Term is the term currently used to filter the search
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(-1)
  const [searchResults, setSearchResults] = useState({users: [], recipes: []})
  const inputField = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    inputField.current.focus()
  }, [])
  
  useEffect(() => {
    if (term.length >= 3) {
      ajax({url: "/search?q="+term, type: 'GET', success: ({results}) => {
        setSearchResults(results)
      }, error: (errors) => {
        console.error('Fetch search results error...', errors.responseText)
      }})
    }
  }, [term])
  
  useEffect(() => {
    //displayRef.current.scrollTop = 56.2*(selected||0)
    if (selectedRef.current) { selectedRef.current.scrollIntoView(false) }
  }, [selected])

  const allMatching = [...searchResults.users, ...searchResults.recipes]

  let select = (pos) => {
    setSelected(pos)
    setSearch(pos == -1 ? '' : allMatching[pos].name)
  }

  let onKeyDown = ({key}) => {
    if (key == "ArrowDown") {select(selected >= allMatching.length-1 ? -1 : selected+1)}
    else if (key == "ArrowUp") {select(selected < 0 ? allMatching.length-1 : selected-1)}
    else if (key == "Enter") {
      if (selected >= searchResults.users.length) {
        window.location.href = localeHref("/r/"+allMatching[selected].id)
      } else {
        window.location.href = localeHref("/u/"+allMatching[selected].id)
      }
    } else if (key == "Escape") {
      if (!term || term == '') { setIsSearching(false) }
      else { setSearch(''); setTerm('') }
    }
  }

  return (<>
    <div style={{transition: 'height 1s', margin: '1em'}}>
      <input ref={inputField} type="search" placeholder={`${t('Search')}...`} onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" style={{width: "100%"}} onKeyDown={onKeyDown} value={search}/>
      <br/><br/>
      <div style={{height: 'calc(100vh - 125px)', overflowY: 'scroll'}}>
        {searchResults.users.length >= 1 ? <h2 className="h001">{t('Public_members')}</h2> : ''}
        <ul>
          {searchResults.users.map((user, current) => {
            let isSelected = current == selected
            return (
              <li key={user.id} className="list-group-item" ref={isSelected ? selectedRef : null}>
                <a href={localeHref(`/u/${user.id}`)} className={isSelected ? "selected" : undefined}>
                  <div className="d-flex align-items-center">
                    <UserThumbnailImage {...{user}} />
                    <div style={{marginRight: '0.5em'}}></div>
                    {user.name}
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
        {searchResults.recipes.length >= 1 ? <h2 className="h001">{t('Recipes')}</h2> : ''}
        <ul className="recipe-list">
          {searchResults.recipes.map((recipe, current) => {
            let isSelected = (current+searchResults.users.length) == selected
            return (
              <li key={recipe.id} ref={isSelected ? selectedRef : null}>
                <a href={localeHref('/r/'+recipe.id)} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined}>
                  <div className="d-flex align-items-center">
                    <RecipeThumbnailImage {...{recipe}} />
                    <div style={{marginRight: '0.5em'}}></div>
                    <div><div>{recipe.name}</div><div className="h002">{t('by_2')} {recipe.user_name}</div></div>
                  </div>
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  </>)
}

export const useMainSearch = () => {

  const [isSearching, setIsSearching] = useState(false)
          
  useEffect(() => {
    const toggleSearch = (e) => {
      let t = e.target
      let searching = !(t.dataset.searching && t.dataset.searching != 'false')
      t.dataset.searching = searching
      t.src = searching ? '/icons/x-lg-white.svg' : '/icons/search.svg'
      setIsSearching(searching)
    }
    let e = document.getElementById("main-search-btn")
    e.addEventListener('click', toggleSearch, false)
    return () => {
      e.removeEventListener('click', toggleSearch, false)
    }
  }, [])

  return isSearching
}

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
