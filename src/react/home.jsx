import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { RecipeEditor } from "./recipe_editor"
import { RecipeMediumImage, RecipeImage } from "./image"
import { isBlank, normalizeSearchText, join, sortBy, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { SingleCarrousel } from "./app"
import { initHcu, useHcuState } from '../hcu'

export const MainSearch = ({publicUsers}) => {

  // Search is the text shown in the input field
  // Term is the term currently used to filter the search
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(-1)
  const inputField = useRef(null)
  const selectedRef = useRef(null)

  useEffect(() => {
    inputField.current.focus()
  }, [])
  
  useEffect(() => {
    //displayRef.current.scrollTop = 56.2*(selected||0)
    if (selectedRef.current) { selectedRef.current.scrollIntoView(false) }
  }, [selected])

  const filterItems = (items) => {
    if (isBlank(term)) {return items}
    //if (isBlank(term) || term.length < minChars) {return []}
    const normalized = normalizeSearchText(term)
    return items.filter(r => (
      r.name && ~normalizeSearchText(r.name).indexOf(normalized)
    ))
  }
  let matchingUsers = filterItems(publicUsers)
  let allMatching = [...matchingUsers]

  let select = (pos) => {
    setSelected(pos)
    setSearch(pos == -1 ? '' : allMatching[pos].name)
  }

  let onKeyDown = ({key}) => {
    if (key == "ArrowDown") {select(selected >= allMatching.length-1 ? -1 : selected+1)}
    else if (key == "ArrowUp") {select(selected < 0 ? allMatching.length-1 : selected-1)}
    else if (key == "Enter") {changePage({...page, page: PAGE_15, recipeId: allMatching[selected].id})}
    else if (key == "Escape") {
      if (!term || term == '') { setIsSearching(false) }
      else { setSearch(''); setTerm('') }
    }
  }

  return (<>
    <div style={{transition: 'height 1s', margin: '1em'}}>
      <input ref={inputField} type="search" placeholder={`${t('Search_for_a_public_member')}...`} onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" style={{width: "100%"}} onKeyDown={onKeyDown} value={search}/>
      <br/><br/>
      <div style={{height: 'calc(100vh - 125px)', overflowY: 'scroll'}}>
        {matchingUsers.length >= 1 ? <h2 className="h001">{t('Public_members')}</h2> : ''}
        <ul>
          {matchingUsers.map((user, current) => (
            <li key={user.id} className="list-group-item clickable" onClick={() => window.location.href = `/u/${user.id}`}>{user.name}</li>
          ))}
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

  const [publicUsers, ] = useState(gon.public_users)
  const [recipes, ] = useState(gon.recipes)
  const recipe = useHcuState([gon.recipe], {tableName: 'recipes'})[0]
  const isSearching = useMainSearch()
  
  if (!window.hcu) {initHcu(); window.hcu.makeDummy() }

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
      {isSearching ? <MainSearch {...{publicUsers}} /> : ''}
    </div>
    <div style={{padding: '3em 0.3em 5em 0.3em', maxWidth: '70em', margin: 'auto'}}>
      <div className="d-block d-md-flex">
        <div className='flex-grow-1'></div>
        <div style={{width: '25em', maxWidth: '100%', margin: 'auto', fontFamily: 'Montserra'}}>
          <h1 className="fs-25">Heda cuisine</h1>
          <h5><i>Des recettes personnalisées</i></h5>
          <p className="py-3 fs-095">Accèdez à vos recettes de n'importe où. Partagez avec votre famille et vos amis. Reçevez des suggestions de recettes personalisées.</p>
          <a className="btn btn-primary" style={{padding: '0.5em 3em', margin: 'auto'}} href="/login">Sign in</a>
        </div>
        <div className='flex-grow-1' style={{height: '3em'}}></div>
        <div style={{width: '25em', maxWidth: '100%', margin: 'auto'}}>
          <RecipeImage {...{recipe: {image_slug: '131.jpeg'}}} width="380" height="300" />
        </div>
        <div className='flex-grow-1'></div>
      </div>
    </div>
    <div style={{padding: '5em 0.3em', backgroundColor: '#fafbfc'}}>
      <div className="d-block d-md-flex ff-montserra" style={{maxWidth: '70em', margin: 'auto'}}>
        <div className='flex-grow-1' style={{order: 1}}></div>
        <div style={{maxWidth: '30em', margin: 'auto', order: 4}}>
          <h2>Suggestions par catégories</h2>
          <p>Arrêtez de vous casser la tête pour savoir quoi cuisiner. Organisez vos recettes par catégories pour avoir des suggestions selon vos besoins. Par exemple:</p>
          <ul>
            <li>Une recette rapide de semaine</li>
            <li>Un gros repas avec des restants pour les lunchs</li>
            <li>Des occasions spéciales comme noël</li>
          </ul>
        </div>
        <div className='flex-grow-1' style={{height: '1em', order: 3}}></div>
        <div style={{order: 2}}>
          <h3 className="text-center">Désserts</h3>
          <SingleCarrousel items={recipes}>{({item}) => {
            let recipe = item
            return <>
              <RecipeMediumImage {...{recipe}} />
              <a href={`/r/${recipe.id}`}>
                <h2 className="bottom-center font-satisfy" style={{borderRadius: "0.5em", border: "1px solid #777", color: "#000", bottom: "1em", backgroundColor: "rgba(245, 245, 245, 0.7)", fontSize: "2em", padding: "0.2em 0.2em 0.1em 0.2em"}}>{recipe.name}</h2>
              </a>
            </>
          }}</SingleCarrousel>
        </div>
        <div className='flex-grow-1' style={{order: 5}}></div>
      </div>
    </div>
    <div className="trunk" style={{padding: '5em 0.3em'}}>
      <div className="ff-montserra mb-2">
        <h2>Un éditeur de recette spécialisé</h2>
        <p>Créez des recettes rapidement à l'aide d'un éditeur de recette spécialisé. Explorez par vous-même ce qu'il peut faire ici-bas!</p>
      </div>
      <div style={{border: "2px solid black", padding: '0.5em', borderRadius: '5px'}}>
        <RecipeEditor recipe={recipe} images={[]} mixes={[]} foods={[]} editable={true} user={{id: recipe.user_id}} />
      </div>
    </div>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root-home')
  if (root) {ReactDOM.render(<Home />, root)}
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
