import React, { useState, useEffect, useRef } from 'react'

import { UserThumbnailImage, RecipeThumbnailImage } from "./image"
import { changeUrl } from "./utils"
import { t } from "../translate"
import { ArrayCombination, getUrlParams, urlWithLocale } from "../utils"
import { useFalseOnce, Link, currentPathIsRoot } from "./lib"
import { ArrowLeftSquareWhiteIcon, SearchWhiteIcon, PersonFillWhiteIcon, XLgWhiteIcon, ListWhiteIcon } from '../server/image.js'
import { normalizeSearchText } from "./utils"
import { ajax, getLocale } from '../lib'
import { DEFAULT_LOCALE } from '../config'

const RecipeListItem = ({recipe, isSelected, siblings, user, selectedRef, setIsSearching}) => {
  let userName = null
  if (user.id != recipe.user_id) {
    const recipeUser = siblings.find(u => u.id == recipe.user_id)
    userName = recipeUser ? recipeUser.name : `user${recipe.user_id}`
  }
  return (
    <li key={recipe.id} ref={isSelected ? selectedRef : null}>
      <Link id={'r-'+recipe.id} path={"/r/"+recipe.id} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined} onClick={() => setIsSearching(false)}>
        <div className="d-flex align-items-center">
          <RecipeThumbnailImage {...{recipe}} />
          <div style={{marginRight: '0.5em'}}></div>
          {userName ? <div><div>{recipe.name}</div><div className="h002">{t('by_2')} {userName}</div></div> : recipe.name}
        </div>
      </Link>
    </li>
  )
}

export const AppNavbar = ({user, _csrf, recipes, friendsRecipes, siblings, recipeKinds}) => {

  const [isSearching, setIsSearching] = useState(false)
  
  //if (useHiddenNavParam()) {return ''}

  let locale = user.locale

  let transformRecipe = recipe => ({
    ...recipe, list: 'r',
    elem: ({isSelected, item, selectedRef}) => (
      <RecipeListItem key={item.id} {...{recipe: item, isSelected, siblings, user, selectedRef, setIsSearching}}/>
    ),
  })

  let userRecipes = recipes.filter(r => r.user_id == user.id)
  let favoriteRecipes = recipes.filter(r => r.user_id != user.id)

  let data = {
    My_recipes: userRecipes.map(transformRecipe),
    My_favorites: favoriteRecipes.map(transformRecipe),
    Same_account_recipes: (friendsRecipes||[]).map(transformRecipe),
    Recipe_kinds: recipeKinds.map(recipeKind => ({
      ...recipeKind, list: 'rk',
      elem: ({isSelected, item, selectedRef}) => <>
        <li key={item.id} ref={isSelected ? selectedRef : null}>
          <Link id={'rk-'+item.id} path={urlWithLocale('/k/'+item.id, locale)} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined}>
            <div className="d-flex align-items-center">
              <RecipeThumbnailImage {...{recipe: item}} />
              <div style={{marginRight: '0.5em'}}></div>
              <div>{item.name}</div>
            </div>
          </Link>
        </li>
      </>
    })),
  }

  let startItems = [
    <img className="clickable" src={ArrowLeftSquareWhiteIcon} style={{paddingLeft: "0.5em", width: '2em'}} onClick={() => window.history.back()} />,
  ]

  let endItems = [
    <SearchButton {...{setIsSearching}} />,
    <div className="dropdown">
      <button className="plain-btn dropdown-toggle" type="button" id="dropdownUserButton" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{marginRight: '1em', color: 'white'}}>
        <img src={PersonFillWhiteIcon} style={{width: '1.8em', marginTop: '-0.1em'}}/>
      </button>
      <div className="dropdown-menu" aria-labelledby="dropdownUserButton" style={{lineHeight: '1.5em'}}>
        <a href="/edit_profile" className="dropdown-item">{t('My_profile')}</a>
        <form action={locale ? "/logout?locale="+locale : "/logout"} method="post">
          <button className="dropdown-item" type="submit">{t('Logout')}</button>
          <input type="hidden" name="_csrf" value={_csrf}/>
        </form>
        { siblings.length == 0 ? '' : <>
          <hr className="dropdown-divider"/>
          <h6 className="dropdown-header">{t('Switch_user')}</h6>
          { siblings.map(usr => { 
            return <form key={usr.id} action="/change_user" method="post">
              <button className="dropdown-item" type="submit">{ usr.name }</button>
              <input type="hidden" name="user_id" value={usr.id}/>
              <input type="hidden" name="_csrf" value={_csrf}/>
            </form>
          })}
        </>}
        <hr className="dropdown-divider"/>
        <a href={urlWithLocale("/contact", locale)} className="dropdown-item">{t('Contact_us', locale)}</a>
      </div>
    </div>,
  ]

  return <SearchNavbar {...{isSearching, setIsSearching, data, locale}}>
    <div style={{maxWidth: '800px', margin: 'auto'}}>
      <CssNavbar {...{startItems, endItems}} />
    </div>
  </SearchNavbar>
}

function convertSearchData(fetched) {
  return ({
    Recipes: fetched.recipeKinds.map(recipeKind => ({
      ...recipeKind,
      list: 'rk',
      elem: ({isSelected, item, selectedRef}) => <>
        <li key={item.id} ref={isSelected ? selectedRef : null}>
          <Link id={'rk-'+item.id} path={'/k/'+item.id} style={{color: 'black', fontSize: '1.1em', textDecoration: 'none'}} className={isSelected ? "selected" : undefined}>
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
      elem: ({isSelected, item, selectedRef}) => <>
        <li key={item.id} className="list-group-item" ref={isSelected ? selectedRef : null}>
          <Link id={'u-'+item.id} path={`/u/${item.id}`} className={isSelected ? "selected" : undefined}>
            <div className="d-flex align-items-center">
              <UserThumbnailImage {...{user: item}} />
              <div style={{marginRight: '0.5em'}}></div>
              {item.name}
            </div>
          </Link>
        </li>
      </>
    })),
  })
}

const SearchButton = ({setIsSearching}) => {
  return <>
    <button id="search-btn" type='button' className='plain-btn mx-2' onClick={() => setIsSearching(true)}>
      <img src={SearchWhiteIcon} style={{width: '1.4em', marginTop: '-0.1em'}}/>
    </button>
  </>
}

export const PublicNavbar = ({locale}) => {

  const [data, setData] = useState(undefined)
  const [isSearching, setIsSearching] = useState(false)
  //if (useHiddenNavParam()) {return ''}

  let onTermChanged = (term) => {
    if (term.length >= 1 && data === undefined) {
      setData(null)
      ajax({url: urlWithLocale("/fetch_search_data", locale), type: 'GET', success: (fetched) => {
        setData(convertSearchData(fetched))
      }, error: (errors) => {
        console.error('Fetch search results error...', errors.responseText)
      }})
    }
  }
  
  let collapsableStartItems = [
    <Link path="/" className="nav-btn" active={currentPathIsRoot()}>{t('Home', locale)}</Link>,
    <Link path="/x" className="nav-btn" checkIfActive={true}>{t('Recipes', locale)}</Link>,
    <Link path="/g" className="nav-btn" checkIfActive={true}>{t('Suggestions', locale)}</Link>,
  ]

  let otherLocale = (locale.toLowerCase() == 'en') ? 'fr' : 'en'
  let url = urlWithLocale(window.location.href, otherLocale)
  let startItems = [
    <a href={url} className="nav-btn fs-lg-14" rel="alternate" hrefLang={otherLocale}>{otherLocale.toUpperCase()}</a>,
  ]

  let collapsableEndItems = [
    <Link path="/login" className="nav-btn">{t('Login', locale)}</Link>,
    <Link path="/contact" className="nav-btn" checkIfActive={true}>{t('Contact', locale)}</Link>,
  ]

  let endItems = [
    <SearchButton {...{setIsSearching}} />,
  ]

  return <SearchNavbar {...{data, isSearching, setIsSearching, onTermChanged, locale}}>
    <div className='mx-lg-3' style={{height: '100%'}}>
      <RightSlideNavbar {...{startItems, endItems, setIsSearching, collapsableEndItems, collapsableStartItems}} />
    </div>
  </SearchNavbar>
}

const minChars = 3
const filterItems = (items, term) => {
  if (!term || term.length < minChars || !items) {return []}
  const normalized = normalizeSearchText(term)
  return items.filter(r => (
    r.name && ~normalizeSearchText(r.name).indexOf(normalized)
  ))
}

const SearchBar = ({data, isSearching, setIsSearching, onTermChanged, locale}) => {
  
  // Search is the text shown in the input field
  // Term is the term currently used to filter the search
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [selected, setSelected] = useState(-1)
  const selectedRef = useRef(null)
  const searchTransition = useFalseOnce()
  const inputField = useRef(null)

  console.log('searchTransition', searchTransition)
  console.log('isSearching', isSearching)

  useEffect(() => {
    inputField.current.focus()
  }, [])

  useEffect(() => {
    if (onTermChanged) { onTermChanged(term) }
  }, [term])
  
  useEffect(() => {
    if (selectedRef.current) { selectedRef.current.scrollIntoView(false) }
  }, [selected])

  const filtered = {}
  Object.keys(data||{}).forEach(key => {filtered[key] = filterItems(data[key], term)})
  const allMatching = new ArrayCombination(Object.values(filtered))

  const reset = () => {
    setTerm('')
    setSearch('')
    setSelected(-1)
  }

  let select = (pos) => {
    setSelected(pos)
    setSearch(pos == -1 ? '' : allMatching[pos].name)
  }

  let onKeyDown = ({key}) => {
    if (key == "ArrowDown") {select(selected >= allMatching.length-1 ? -1 : selected+1)}
    else if (key == "ArrowUp") {select(selected < 0 ? allMatching.length-1 : selected-1)}
    else if (key == "Enter") {
      reset()
      setIsSearching(false)
      let match = allMatching[selected]
      if (match) {
        document.getElementById(match.list+'-'+match.id).click()
      } else {
        window.location.href = urlWithLocale("/q?q="+search, locale)
      }
      //console.log('selected', selected)
      //console.log('matchi', allMatching[selected])

    } else if (key == "Escape") {
      if (!term || term == '') { setIsSearching(false) }
      else { reset() }
    }
  }

  let current = -1
  return <>
    <div style={{position: 'relative', margin: 'auto', padding: '0.8em 1em 0 1em', maxWidth: '800px'}}>
      <div className="d-flex justify-content-end">
        <input id="search-input" ref={inputField} type="search" placeholder={`${t('Search')}...`} onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" className="plain-input white ps-1" style={{borderBottom: '2px solid white', width: searchTransition ? "100%" : "10px", transition: 'width 1s'}} onKeyDown={onKeyDown} value={search}/>
        <img className="clickable ps-2" src={XLgWhiteIcon} width="36" onClick={() => setIsSearching(false)}/>
      </div>
      {allMatching.length <= 0 ? '' : <>
        <div id="search-results" style={{position: 'absolute', zIndex: '200', backgroundColor: 'white', border: '1px solid black', width: '90%', padding: '0.5em', maxHeight: 'calc(100vh - 80px)', overflowY: 'scroll'}}>
          {Object.keys(filtered).map(key => {
            if (filtered[key].length <= 0) {return ''}
            return <div key={key}>
              <h2 className="h001">{t(key)}</h2>
              <ul className="recipe-list">
                {filtered[key].map(e => {
                  current += 1
                  return <div key={key+e.id}>
                    {e.elem({item: allMatching[current], selectedRef, isSelected: selected===current})}
                  </div>
                })}
              </ul>
            </div>
          })}
        </div>
      </>}
    </div>
  </>
}

const NavbarTitle = () => {
  return <>
    <div className='position-absolute fs-15' style={{left: '50%', transform: 'translateX(-50%)', fontWeight: '500', color: 'rgb(249, 249, 249)'}}>
    { currentPathIsRoot() ? 'HedaCuisine' : <Link path="/" className="plain-link white">HedaCuisine</Link>}
  </div>
  </>
}

const CssNavbar = ({startItems=[], endItems=[], collapsableStartItems=[], collapsableEndItems=[]}) => {

  const hasCollapsable = collapsableStartItems.length && collapsableEndItems.length
        
  const keyedStartItems = startItems.map((e,i) => <div key={'a'+i}>{e}</div>)
  const keyedEndItems = endItems.map((e,i) => <div key={'c'+i}>{e}</div>)

  return <>
    <div className='position-relative m-auto' style={{backgroundColor: 'rgb(33, 37, 41)', zIndex: '10000', lineHeight: '3.25em', height: '100%'}}>
      <NavbarTitle />
      <input id="menu-toggle" type="checkbox" className='d-none'/>
      <div className='d-flex d-lg-none align-items-center' style={{height: '100%'}}>
        {keyedStartItems}
        <div className='flex-grow-1'/>
        {keyedEndItems}
        {hasCollapsable ?
          <label className='menu-button-container clickable' htmlFor="menu-toggle">
            <img className="me-3 ms-1" src={ListWhiteIcon} style={{width: '2em', marginTop: '-0.2em'}}/>
          </label>
        : null}
      </div>
      <div className='menu-toggled d-flex' style={{backgroundColor: 'rgb(33, 37, 41)'}}>
        {collapsableStartItems.map((e,i) => <div key={'b'+i}>{e}</div>)}
        <div className='d-lg-flex d-none'>
          {keyedStartItems}
        </div>
        <div className='flex-grow-1'/>
        <div className='d-lg-flex d-none'>
          {keyedEndItems}
        </div>
        {collapsableEndItems.map((e,i) => <div key={'d'+i}>{e}</div>)}
      </div>
    </div>
  </>
}

const ExpandedNavbar = ({startItems=[], endItems=[], collapsableStartItems=[], collapsableEndItems=[]}) => {
  
  return <>
    <div className='d-flex' style={{backgroundColor: 'rgb(33, 37, 41)'}}>
      {collapsableStartItems.map((e,i) => <div key={'b'+i}>{e}</div>)}
      {startItems.map((e,i) => <div key={'a'+i}>{e}</div>)}
      <div className='flex-grow-1'/>
      {endItems.map((e,i) => <div key={'c'+i}>{e}</div>)}
      {collapsableEndItems.map((e,i) => <div key={'d'+i}>{e}</div>)}
    </div>
  </>
}

const OpenedRightSlideNavbar = ({startItems=[], endItems=[], collapsableStartItems=[], collapsableEndItems=[]}) => {
  
  return <>
    <div className='position-absolute d-flex flex-column right-slide-navbar' style={{right: '0', top: '2.3em', lineHeight: '2em', fontSize: '1.4em', backgroundColor: 'rgb(33, 37, 41)', color: 'white', height: '100vh', maxWidth: '100vw', width: '200px'}}>
      {collapsableStartItems.map((e,i) => <div key={'b'+i}>{e}</div>)}
      {collapsableEndItems.map((e,i) => <div key={'d'+i}>{e}</div>)}
    </div>
  </>
}

const CollapsedNavbar = ({startItems=[], endItems=[], collapsableStartItems=[], collapsableEndItems=[]}) => {

  const hasCollapsable = collapsableStartItems.length && collapsableEndItems.length

  return <>
    <div className='d-flex d-lg-none align-items-center' style={{height: '100%'}}>
      {startItems.map((e,i) => <div key={'a'+i}>{e}</div>)}
      <div className='flex-grow-1'/>
      {endItems.map((e,i) => <div key={'c'+i}>{e}</div>)}
      {hasCollapsable ?
        <label className='menu-button-container clickable' htmlFor="menu-toggle">
          <img className="me-3 ms-1" src={ListWhiteIcon} style={{width: '2em', marginTop: '-0.2em'}}/>
        </label>
      : null}
    </div>
  </>
}

const RightSlideNavbar = ({startItems=[], endItems=[], collapsableStartItems=[], collapsableEndItems=[]}) => {

  return <>
    <div className='position-relative m-auto right-slide-navbar' style={{backgroundColor: 'rgb(33, 37, 41)', zIndex: '10000', lineHeight: '3.25em', height: '100%'}}>
      <NavbarTitle />
      <input id="menu-toggle" type="checkbox" className='d-none'/>
      <div className="d-none d-lg-block">
        <ExpandedNavbar {...{startItems, endItems, collapsableStartItems, collapsableEndItems}} />
      </div>
      <div className="d-lg-none">
        <CollapsedNavbar {...{startItems, endItems, collapsableStartItems, collapsableEndItems}} />
      </div>
      <div className='menu-toggled d-lg-none'>
        <OpenedRightSlideNavbar {...{startItems, endItems, collapsableStartItems, collapsableEndItems}} />
      </div>
    </div>
  </>
}


const SearchNavbar = ({onTermChanged, isSearching, setIsSearching, data, children, locale}) => {

  const searchMode = <SearchBar {...{data, isSearching, setIsSearching, onTermChanged, locale}} />

  return <>
    <nav style={{backgroundColor: 'rgb(33, 37, 41)', height: '3.25em', marginBottom: '0.5em'}}>
      {isSearching ? searchMode : children}
    </nav>
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
