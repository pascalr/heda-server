import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { RecipeMediumImage } from "./image"
import { isBlank, normalizeSearchText, join, sortBy, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"
import { SingleCarrousel } from "./app"

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
  const isSearching = useMainSearch()

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
      {isSearching ? <MainSearch {...{publicUsers}} /> : ''}
    </div>
    <div style={{padding: '5em 0'}}>
      <div className="text-center">
        <div className="d-flex flex-column" style={{gap: '4em'}}>
          <h1 style={{fontSize: '3.5em'}}>Heda cuisine</h1>
          <h2>Des recettes personnalisées pour toi</h2>
          <a className="btn btn-primary" style={{padding: '0.5em 3em', margin: 'auto'}} href="/login">Sign in</a>
        </div>
      </div>
    </div>
    <div style={{padding: '5em 0', backgroundColor: '#fafbfc', textAlign: 'center'}}>
      <h2>Suggestions par catégories</h2>
      <h3></h3>
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
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root-home')
  ReactDOM.render(<Home />, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
