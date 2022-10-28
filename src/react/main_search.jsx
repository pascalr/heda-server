import React, { useState, useEffect, useRef } from 'react'

import { UserThumbnailImage, RecipeThumbnailImage } from "./image"
import { ajax } from "./utils"
import { t } from "../translate"
import { localeHref, getPathFromUrl } from "../utils"
import { useTransition } from "./lib"
import { SearchWhiteIcon, PersonFillWhiteIcon, XLgWhiteIcon } from '../server/image.js'

export const MainSearch2 = ({locale, renderingHome}) => {

  // Search is the text shown in the input field
  // Term is the term currently used to filter the search
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState({users: [], recipes: []})
  const inputField = useRef(null)
  const selectedRef = useRef(null)
  const searchTransition = useTransition(isSearching)

  useEffect(() => {
    if (isSearching) { inputField.current.focus() }
  }, [isSearching])
  
  useEffect(() => {
    if (term.length >= 3) {
      ajax({url: "/search?q="+term, type: 'GET', success: ({results}) => {
        setSearchResults(results)
      }, error: (errors) => {
        console.error('Fetch search results error...', errors.responseText)
      }})
    } else {
      setSearchResults({users: [], recipes: []})
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
  
  let otherLocale = (locale.toLowerCase() == 'en') ? 'FR' : 'EN'

  const normalMode = <>
    <div className="float-start fs-15 px-3">
      <a href={localeHref(getPathFromUrl(window.location.href)+'?locale='+otherLocale)} className="nav-btn" rel="alternate" hrefLang={otherLocale.toLowerCase()}>
        {otherLocale}
      </a>
    </div>
    <div className="float-end" style={{marginTop: '0.25em'}}>
      <img className="clickable" src={SearchWhiteIcon} style={{marginRight: '1em'}} width="24" onClick={() => setIsSearching(true)}/>
      <div className="dropdown d-inline-block">
        <button className="plain-btn dropdown-toggle" type="button" id="dropdownUserButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true" style={{marginRight: '1em', color: 'white'}}>
          <img className="clickable" src={PersonFillWhiteIcon} width="28"/>
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownUserButton">
          <a href={localeHref("/login")} className="dropdown-item">{t('Login', locale)}</a>
        </div>
      </div>
    </div>
    <div style={{margin: 'auto', width: 'fit-content', fontWeight: '500', fontSize: '1.5rem', color: 'rgb(249, 249, 249)'}}>
      { renderingHome ? 'HedaCuisine' : <a href={localeHref("/")} className="plain-link white">HedaCuisine</a>}
    </div>
  </>

  const searchMode = <>
    <div style={{position: 'relative', margin: '0.5em 1em 0 1em'}}>
      <div className="d-flex justify-content-end">
        <input ref={inputField} type="search" placeholder={`${t('Search')}...`} onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" className="plain-input white ps-1" style={{borderBottom: '2px solid white', width: searchTransition ? "100%" : "10px", transition: 'width 1s'}} onKeyDown={onKeyDown} value={search}/>
        <img className="clickable ps-2" src={XLgWhiteIcon} width="36" onClick={() => setIsSearching(false)}/>
      </div>
      {searchResults.users.length + searchResults.recipes.length <= 0 ? '' :
        <div style={{position: 'absolute', zIndex: '200', backgroundColor: 'white', border: '1px solid black', width: '100%', padding: '0.5em'}}>
          {searchResults.users.length <= 0 ? '' : <>
            <h2 className="h001">{t('Public_members')}</h2>
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
          </>}
          {searchResults.recipes.length <= 0 ? '' : <>
            <h2 className="h001">{t('Recipes')}</h2>
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
          </>}
        </div>
      }
    </div>
  </>

  return (<>
    <nav style={{backgroundColor: 'rgb(33, 37, 41)', marginBottom: '0.5em', borderBottom: '1px solid rgb(206, 226, 240)'}}>
      <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0', height: '52px'}}>
        {isSearching ? searchMode : normalMode}
      </div>
    </nav>
  </>)
}

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
