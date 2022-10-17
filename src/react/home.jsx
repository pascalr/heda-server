import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { isBlank, normalizeSearchText, join, sortBy, capitalize } from "./utils"
import { image_slug_variant_path } from "./routes"
import { t } from "../translate"

const SearchBox = ({publicUsers}) => {

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
  console.log('publicUsers', publicUsers)
  let matchingUsers = filterItems(publicUsers)
  console.log('matchingUsers', matchingUsers)
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
      <input ref={inputField} type="search" placeholder={`${t('Search')}...`} onChange={(e) => {setTerm(e.target.value); setSearch(e.target.value)}} autoComplete="off" style={{width: "100%"}} onKeyDown={onKeyDown} value={search}/>
      <br/><br/>
      <div style={{height: 'calc(100vh - 125px)', overflowY: 'scroll'}}>
        {matchingUsers.length >= 1 ? <h2 className="h001">{t('Public_members')}</h2> : ''}
        <ul>
          {matchingUsers.map((user, current) => (
            <li key={user.id} className="list-group-item clickable" onClick={() => window.location.href = `/user/${user.id}`}>{user.name}</li>
          ))}
        </ul>
      </div>
    </div>
  </>)
}

const Home = () => {

  const [publicUsers, ] = useState(gon.public_users)
  const [isSearching, setIsSearching] = useState(false)
          
  useEffect(() => {
    const toggleSearch = () => {setIsSearching(!isSearching)}
    let e = document.getElementById("main-search-btn")
    e.addEventListener('click', toggleSearch, false)
    return () => {
      e.removeEventListener('click', toggleSearch, false)
    }
  }, [])

  if (!publicUsers || !isSearching) {return ''}

  return <>
    <div style={{maxWidth: '800px', margin: 'auto', padding: '0.5em 0 0.5em 0'}}>
      <SearchBox {...{publicUsers}} />
    </div>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = document.getElementById('root')
  ReactDOM.render(<Home />, root)
  //const root = createRoot(document.getElementById("root"));
  //root.render(<UserEditor/>);
})
