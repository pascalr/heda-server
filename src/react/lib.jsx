import React, { useState, useEffect } from 'react';
import toastr from 'toastr'

import { ajax, omit, join, bindSetter, capitalize, changeUrl } from "./utils"
import { t } from '../translate'

/**
 * Extract the locale from the meta tag. Ex:
 * <meta name="locale" content="fr" /> => "fr"
 * FIXME: Maybe extract from <html lang="fr"> instead...
 */
export function getLocale(val) {
  return (document.querySelector('[name="locale"]')||{}).content
}

export function recipeOrTranslation(originalRecipe, translatedRecipes, locale) {

  if (locale != 'fr') { // FIXME: use locale from recipe when added.
    const translatedRecipe = translatedRecipes.find(r => r.original_id == originalRecipe.id)
    return {...originalRecipe, ...omit(translatedRecipe, 'id')}
  }
  return originalRecipe
}

/**
 * Delay for a single render frame. This way the initial element is rendered, then
 * the transition can take place.
 *
 * Usage:
 * const [bool, setBool] = useState(false)
 * const boolTransition = useTransition(bool)
 * return <div style={{width: boolTransition ? "100%" : "10px", transition: 'width 1s'}}></div>
 */
export const useTransition = (variable) => {
  const [v, setV] = useState(variable) 
  useEffect(() => {
    setV(variable)
  }, [variable])
  return v
}

// errorId: 'Error_updating'
export const handleError = (errorId) => (response) => {
  console.log('response', response)
  if (response.publicError) {
    console.error('ERROR...', response.publicError)
    toastr.error(t(errorId)+' '+response.publicError)
  } else {
    console.error('ERROR...', response.responseText)
    toastr.error(t(errorId))
  }
}

export function parseIngredientsOldFormat(text) {
  if (!text) {return []}
  let itemNb = 0
  return text.split("\n").map(line => {
    if (line.length <= 0) {return null;}
    if (line[0] == '#') {return null;}
    let args = line.split(";")
    itemNb += 1
    return {key: `${itemNb}-${line}`, item_nb: itemNb, raw: args[0].trim(), raw_food: args[1].trim()}
  }).filter(e => e)
}

export const currentPathIsRoot = () => {
  let url = window.location.pathname
  return url === '' || url === '/'
}

export const currentPathIs = (p) => {
  return window.location.pathname === p
}

export const Link = ({className, children, active, path, onClick, ...props}) => {
  const handleClick = (evt) => {
    evt.preventDefault()
    if (onClick) {onClick(evt)}
    changeUrl(path)
  }
  return <a className={join(className, active ? 'active' : null)} href={path} onClick={handleClick} {...props}>{children}</a>
}

export const mapModels = (list, func) => {
  if (!list) {return null;}
  return list.map((item,i) => <span key={item.id}>{func(item,i)}</span>)
}

export const Show = ({cond, children}) => {
  return cond ? children : ''
}

export const useCacheOrFetchHTML = (url, args={}) => {
  const {waitFor, cache} = args
  const [data, setData] = useState(window[`fetched_${url}`]);

  useEffect(() => {
    if (!window[`fetching_${url}`] && !!waitFor) {
      console.log('FETCHING',url)
      fetch(url)
        .then(result => result.text())
        .then(content => {
          window[`fetched_${url}`] = content
          setData(content)
        });
      window[`fetching_${url}`] = true
    }
  }, [url, waitFor]);

  return data;
};

// FIXME: Badly implemented I believe...
export const useCacheOrFetch = (url, args={}) => {
  const {waitFor, cache} = args
  const [data, setData] = useState(window[`fetched_${url}`]);

  useEffect(() => {
    if (!window[`fetching_${url}`] && waitFor != false) {
      async function fetchData() {
        console.log(`Fetching data at ${url}`)
        const response = await fetch(url);
        const json = await response.json();
        window[`fetched_${url}`] = json
        setData(json);
      }
      window[`fetching_${url}`] = true
      fetchData();
    }
  }, [url, waitFor]);

  return data;
};

export const useWindowWidth = (args={}) => {

  const [winWidth, setWinWidth] = useState(window.innerWidth)
  useEffect(() => {
    const f = () => setWinWidth(window.innerWidth)
    window.addEventListener('resize', f)
    return () => {
      window.removeEventListener('resize', f)
    }
  }, [])

  return winWidth
};

export const useFetch = (url, args={}) => {
  const {waitFor} = args
  const [data, setData] = useState(null);

  useEffect(() => {
    if (waitFor != false) {
      async function fetchData() {
        console.log(`Fetching data at ${url}`)
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      }
      fetchData();
    }
  }, [url, waitFor]);

  return data;
};

/**
 * This is the latest implementation. It uses hcu.
 */
export const useOrFetchRecord = (table, group, id) => {

  const [record, setRecord] = useState(group.find(e => e.id == id))

  useEffect(() => {
    if (id) {
      let r = group.find(e => e.id == id)
      if (!r) {window.hcu.fetchRecord(table, id)}
      setRecord(r)
    } else {
      setRecord(null)
    }
  }, [table, group, id])
  
  return record
}
