import React, { useState, useEffect, useRef } from 'react'

import { UserThumbnailImage, RecipeThumbnailImage } from "./image"
import { ajax, changeUrl } from "./utils"
import { t } from "../translate"
import { localeHref, getPathFromUrl, ArrayCombination, getUrlParams } from "../utils"
import { useTransition, Link, currentPathIsRoot } from "./lib"
import { SearchWhiteIcon, PersonFillWhiteIcon, XLgWhiteIcon, ListWhiteIcon } from '../server/image.js'
import { normalizeSearchText } from "./utils"

const minChars = 3
const filterItems = (items, term) => {
  if (!term || term.length < minChars || !items) {return []}
  const normalized = normalizeSearchText(term)
  return items.filter(r => (
    r.name && ~normalizeSearchText(r.name).indexOf(normalized)
  ))
}

const RecipeListItem = ({recipe, isSelected, users, user, selectedRef, setIsSearching}) => {
  let userName = null
  if (user.id != recipe.user_id) {
    const recipeUser = users.find(u => u.id == recipe.user_id)
    userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`
  }
  return (
    <li key={recipe.id} ref={isSelected ? selectedRef : null}>
      <Link path={"/r/"+recipe.id} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined} onClick={() => setIsSearching(false)}>
        <div className="d-flex align-items-center">
          <RecipeThumbnailImage {...{recipe}} />
          <div style={{marginRight: '0.5em'}}></div>
          {userName ? <div><div>{recipe.name}</div><div className="h002">{t('by_2')} {userName}</div></div> : recipe.name}
        </div>
      </Link>
    </li>
  )
}

export const AppNavbar = ({locale, renderingHome, setIsSearching, otherProfiles, _csrf}) => {
  return <>
    <div className="float-start" style={{margin: '0.3em 0 0 0.5em'}}>
      <img className="clickable" src={"/icons/arrow-left-square-white.svg"} style={{paddingLeft: "0.5em", width: '2em'}} onClick={() => window.history.back()} />
    </div>
    <div className="float-end" style={{marginTop: '0.25em'}}>
      <img id="search-btn" className="clickable" src={"/icons/search.svg"} onClick={() => {setIsSearching(true)}} style={{marginRight: '1em', width: '1.5em'}} />
      <div className="dropdown d-inline-block">
        <button className="plain-btn dropdown-toggle" type="button" id="dropdownUserButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{marginRight: '1em', color: 'white'}}>
          <img className="clickable" src={"/icons/person-fill-white.svg"} style={{width: '1.8em'}}/>
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownUserButton">
          <a href="/edit_profile" className="dropdown-item">{t('My_profile')}</a>
          <a href="/edit_account" className="dropdown-item">{t('My_account')}</a>
          <form action={locale ? "/logout?locale="+locale : "/logout"} method="post">
            <button className="dropdown-item" type="submit">{t('Logout')}</button>
            <input type="hidden" name="_csrf" value={_csrf}/>
          </form>
          <a href="/new_user" className="dropdown-item">{t('New_profile')}</a>
          { otherProfiles.length == 0 ? '' : <>
            <hr className="dropdown-divider"/>
            <h6 className="dropdown-header">{t('Switch_user')}</h6>
            { otherProfiles.map(usr => { 
              return <form key={usr.id} action="/change_user" method="post">
                <button className="dropdown-item" type="submit">{ usr.name }</button>
                <input type="hidden" name="user_id" value={usr.id}/>
                <input type="hidden" name="_csrf" value={_csrf}/>
              </form>
            })}
          </>}
          <hr className="dropdown-divider"/>
          <a href={localeHref("/contact")} className="dropdown-item">{t('Contact_us', locale)}</a>
        </div>
      </div>
    </div>
    <a href="/" className='d-block plain-link' style={{margin: 'auto', width: 'fit-content', fontWeight: '500', fontSize: '1.5em', color: '#f9f9f9'}}>HedaCuisine</a>
  </>
}

export const PublicNavbar2 = ({locale}) => {

  //const [foo] = withBaseNavbar({locale})

  let otherLocale = (locale.toLowerCase() == 'en') ? 'FR' : 'EN'
  
  let collapsableStartItems = [
    <Link key='a1' path="/rs" className="nav-btn">{t('Recipes', locale)}</Link>,
  ]

  let startItems = [
    <Link key='b2' path={window.location.pathname+'?locale='+otherLocale} className="nav-btn fs-13" rel="alternate" hrefLang={otherLocale.toLowerCase()}>{otherLocale}</Link>,
  ]

  let endItems = [
    <Link key='c1' path="/login" className="nav-btn">{t('Login', locale)}</Link>,
    <Link key='c2' path="/signup" className="nav-btn">{t('Create_account', locale)}</Link>,
    <Link key='c3' path="/contact" className="nav-btn">{t('Contact', locale)}</Link>,
  ]

  return <BaseNavbar {...{locale, startItems, endItems, collapsableStartItems}} />
}

        //<input id="menu-toggle" type="checkbox" className='d-none'/>
        //  <img id="search-btn" className="clickable" src={SearchWhiteIcon} style={{marginRight: '1em', width: '1.4em'}} onClick={() => setIsSearching(true)}/>
        //  <label className='menu-button-container' for="menu-toggle">
        //    <img className="clickable" src={ListWhiteIcon} style={{width: '1.9em'}}/>
        //  </label>
        //<div className="menu">
        //</div>

const BaseNavbar = ({locale, startItems=[], endItems=[], collapsableStartItems=[], collapsableEndItems=[]}) => {

  // Le plus beau serait chacun des éléments qui grandit

  return <>
    <nav style={{backgroundColor: 'rgb(33, 37, 41)', marginBottom: '0.5em', borderBottom: '1px solid rgb(206, 226, 240)'}}>
      <div className='position-relative' style={{minHeight: '52px'}}>
        <div className='position-absolute fs-15' style={{left: '50vw', transform: 'translateX(-50%)', fontWeight: '500', color: 'rgb(249, 249, 249)'}}>
          { currentPathIsRoot() ? 'HedaCuisine' : <Link path="/" className="plain-link white">HedaCuisine</Link>}
        </div>
        <input id="menu-toggle" type="checkbox" className='d-none'/>
        <div className='float-end d-lg-none'>
          <label className='menu-button-container' htmlFor="menu-toggle">
            <img className="clickable mx-2" src={ListWhiteIcon} style={{width: '1.9em'}}/>
          </label>
        </div>
        <div className='d-lg-none'>
          {startItems}
        </div>
        <div className='menu-toggled d-flex'>
          {collapsableStartItems}
          <div className='d-lg-flex d-none'>
            {startItems}
          </div>
          <div className='flex-grow-1'/>
          {endItems}
        </div>
      </div>
    </nav>
  </>
}

export const PublicNavbar = ({locale, renderingHome, setIsSearching}) => {

  let otherLocale = (locale.toLowerCase() == 'en') ? 'FR' : 'EN'
  return <>
    <div className="float-start fs-15 px-3">
      <Link path={window.location.pathname+'?locale='+otherLocale} className="nav-btn" rel="alternate" hrefLang={otherLocale.toLowerCase()}>{otherLocale}</Link>
    </div>
    <div className="float-end" style={{marginTop: '0.25em'}}>
      <img id="search-btn" className="clickable" src={SearchWhiteIcon} style={{marginRight: '1em', width: '1.4em'}} onClick={() => setIsSearching(true)}/>
      <div className="dropdown d-inline-block">
        <button className="plain-btn" type="button" id="dropdownUserButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true" style={{marginRight: '1em', color: 'white'}}>
          <img className="clickable" src={ListWhiteIcon} style={{width: '1.9em'}}/>
        </button>
        <div className="dropdown-menu" aria-labelledby="dropdownUserButton">
          <Link path="/login" className="dropdown-item">{t('Login', locale)} ({t('beta')})</Link>
          <Link path="/signup" className="dropdown-item">{t('Create_account', locale)} ({t('beta')})</Link>
          <Link path="/contact" className="dropdown-item">{t('Contact_us', locale)}</Link>
        </div>
      </div>
    </div>
    <div style={{margin: 'auto', width: 'fit-content', fontWeight: '500', fontSize: '1.5em', color: 'rgb(249, 249, 249)'}}>
      { renderingHome ? 'HedaCuisine' : <Link path="/" className="plain-link white">HedaCuisine</Link>}
    </div>
  </>
}

/**
 * Allow hidding nav by adding noNav=true to the url
 */
export const useHiddenNavParam = () => {
 
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    if (getUrlParams(window.location.href).noNav) {setHidden(true)}
  }, [])
  return hidden
}

export const AppSearch = ({user, _csrf, recipes, friendsRecipes, users, recipeKinds}) => {

  let otherProfiles = users.filter(u => u.id != user.id)
  
  //if (useHiddenNavParam()) {return ''}

  let locale = user.locale
  let renderingHome = currentPathIsRoot()

  const config = {

    data: {
      My_recipes: recipes.map(recipe => ({
        ...recipe,
        //url: localeHref("/k/"+recipeKind.id),
        elem: ({isSelected, item, selectedRef, setIsSearching}) => (
          <RecipeListItem key={item.id} {...{recipe: item, isSelected, users, user, selectedRef, setIsSearching}}/>
        ),
      })),
      Same_account_recipes: (friendsRecipes||[]).map(recipe => ({
        ...recipe,
        //url: localeHref("/k/"+recipeKind.id),
        elem: ({isSelected, item, selectedRef, setIsSearching}) => (
          <RecipeListItem key={item.id} {...{recipe: item, isSelected, users, user, selectedRef, setIsSearching}}/>
        ),
      })),
      Suggestions: recipeKinds.map(recipeKind => ({
        ...recipeKind,
        list: 'rk',
        //url: localeHref("/k/"+recipeKind.id),
        elem: ({isSelected, item, selectedRef}) => <>
          <li key={item.id} ref={isSelected ? selectedRef : null}>
            <a href={localeHref('/k/'+item.id)} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined}>
              <div className="d-flex align-items-center">
                <RecipeThumbnailImage {...{recipe: item}} />
                <div style={{marginRight: '0.5em'}}></div>
                <div>{item.name}</div>
              </div>
            </a>
          </li>
        </>
      })),
    },
    printResults({selected, selectedRef, setIsSearching}) {
      return <>
        {matchingUserRecipes.length >= 1 ? <h2 className="h001">{t('My_recipes')}</h2> : ''}
        <ul className="recipe-list">
          {matchingUserRecipes.map((recipe, current) => (
            <RecipeListItem key={recipe.id} {...{recipe, current, selected, users, user, selectedRef, setIsSearching}}/>
          ))}
        </ul>
        {matchingFriendsRecipes.length >= 1 ? <h2 className="h001">{t('Same_account_recipes')}</h2> : ''}
        <ul className="recipe-list">
          {matchingFriendsRecipes.map((recipe, current) => (
            <RecipeListItem key={recipe.id} {...{recipe, current: current+matchingUserRecipes.length, selected, users, user, selectedRef, setIsSearching}}/>
          ))}
        </ul>
      </>
    },
    printNavbar({setIsSearching}) {
      return <AppNavbar {...{locale, renderingHome, setIsSearching, otherProfiles, _csrf}}/>
    },
    onItemChoosen(item, {setIsSearching}) {
      if (item.list === 'rk') {
        changeUrl("/k/"+item.id)
      } else {
        changeUrl("/r/"+item.id)
      }
      setIsSearching(false)
    },
  }
  return <BaseSearch {...{locale, renderingHome, ...config}} />
}

export const MainSearch = ({locale, renderingHome}) => {

  const [data, setData] = useState(undefined) // New way of doing this
  //if (useHiddenNavParam()) {return ''}

  const config = {

    data,
    onItemChoosen(item, args) {
      if (item.list === 'u') {
        window.location.href = localeHref("/u/"+item.id)
      } else {
        window.location.href = localeHref("/k/"+item.id)
      }
    },
    onTermChanged(term) {
      if (term.length >= 1 && data === undefined) {
        setData(null)
        ajax({url: localeHref("/fetch_search_data"), type: 'GET', success: (fetched) => {
          let d = {
            Recipes: fetched.recipeKinds.map(recipeKind => ({
              ...recipeKind,
              list: 'rk',
              //url: localeHref("/k/"+recipeKind.id),
              elem: ({isSelected, item, selectedRef}) => <>
                <li key={item.id} ref={isSelected ? selectedRef : null}>
                  <Link path={'/k/'+item.id} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined}>
                    <div className="d-flex align-items-center">
                      <RecipeThumbnailImage {...{recipe: item}} />
                      <div style={{marginRight: '0.5em'}}></div>
                      <div>{item.name}</div>
                    </div>
                  </Link>
                </li>
              </>
            })),
            Public_members: fetched.publicUsers.map(publicUser => ({
              ...publicUser,
              list: 'u',
              //url: localeHref("/u/"+publicUser.id),
              elem: ({isSelected, item, selectedRef}) => <>
                <li key={item.id} className="list-group-item" ref={isSelected ? selectedRef : null}>
                  <Link path={`/u/${item.id}`} className={isSelected ? "selected" : undefined}>
                    <div className="d-flex align-items-center">
                      <UserThumbnailImage {...{user: item}} />
                      <div style={{marginRight: '0.5em'}}></div>
                      {item.name}
                    </div>
                  </Link>
                </li>
              </>
            })),
          }
          setData(d)
        }, error: (errors) => {
          console.error('Fetch search results error...', errors.responseText)
        }})
      }
    },
    printNavbar({setIsSearching}) {
      return <PublicNavbar {...{locale, renderingHome, setIsSearching}}/>
    },
  }

  return <BaseSearch {...{locale, renderingHome, ...config}} />
}

export const BaseSearch = ({locale, renderingHome, data, onItemChoosen, onTermChanged, printNavbar}) => {

  // Search is the text shown in the input field
  // Term is the term currently used to filter the search
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const inputField = useRef(null)
  const selectedRef = useRef(null)
  const searchTransition = useTransition(isSearching)

  const reset = () => {
    setTerm('')
    setSearch('')
    setSelected(-1)
  }

  //const allMatching = data ? filterItems([].concat(...Object.values(data)), term) : []
  const filtered = {}
  Object.keys(data||{}).forEach(key => {filtered[key] = filterItems(data[key], term)})
  const allMatching = new ArrayCombination(Object.values(filtered))

  useEffect(() => {
    if (onTermChanged) { onTermChanged(term) }
  }, [term])

  useEffect(() => {
    if (isSearching) { inputField.current.focus() }
  }, [isSearching])
  
  useEffect(() => {
    //displayRef.current.scrollTop = 56.2*(selected||0)
    if (selectedRef.current) { selectedRef.current.scrollIntoView(false) }
  }, [selected])

  let select = (pos) => {
    setSelected(pos)
    setSearch(pos == -1 ? '' : allMatching[pos].name)
  }

  let onKeyDown = ({key}) => {
    if (key == "ArrowDown") {select(selected >= allMatching.length-1 ? -1 : selected+1)}
    else if (key == "ArrowUp") {select(selected < 0 ? allMatching.length-1 : selected-1)}
    else if (key == "Enter") {if (onItemChoosen) {reset(); onItemChoosen(allMatching[selected], {setIsSearching})}}
    else if (key == "Escape") {
      if (!term || term == '') { setIsSearching(false) }
      else { reset() }
    }
  }

  let current = -1
  const searchMode = <>
    <div style={{position: 'relative', margin: '0.5em 1em 0 1em'}}>
      <div className="d-flex justify-content-end">
        <input id="search-input" ref={inputField} type="search" placeholder={`${t('Search')}...`} onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" className="plain-input white ps-1" style={{borderBottom: '2px solid white', width: searchTransition ? "100%" : "10px", transition: 'width 1s'}} onKeyDown={onKeyDown} value={search}/>
        <img className="clickable ps-2" src={XLgWhiteIcon} width="36" onClick={() => setIsSearching(false)}/>
      </div>
      {allMatching.length <= 0 ? '' : <>
        <div id="search-results" style={{position: 'absolute', zIndex: '200', backgroundColor: 'white', border: '1px solid black', width: '100%', padding: '0.5em', maxHeight: 'calc(100vh - 80px)', overflowY: 'scroll'}}>
          {Object.keys(filtered).map(key => {
            if (filtered[key].length <= 0) {return ''}
            return <div key={key}>
              <h2 className="h001">{t(key)}</h2>
              <ul className="recipe-list">
                {filtered[key].map(e => {
                  current += 1
                  return <div key={key+e.id}>
                    {e.elem({item: allMatching[current], selectedRef, isSelected: selected===current, setIsSearching})}
                  </div>
                })}
              </ul>
            </div>
          })}
        </div>
      </>}
    </div>
  </>

  return (<>
    <nav style={{backgroundColor: 'rgb(33, 37, 41)', marginBottom: '0.5em', borderBottom: '1px solid rgb(206, 226, 240)'}}>
      <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0', height: '52px'}}>
        {isSearching ? searchMode : printNavbar({setIsSearching})}
      </div>
    </nav>
  </>)
}
