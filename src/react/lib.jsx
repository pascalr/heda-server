import React, { useState, useEffect, useRef } from 'react';
import toastr from 'toastr'

import { ajax, omit, join, bindSetter, capitalize, changeUrl } from "./utils"
import { localeHref, shuffle } from "../utils"
import { t } from '../translate'

export function useShuffled(list) {
  const [items, setItems] = useState(list)

  useEffect(() => {
    setItems(list ? shuffle(list) : list)
  }, [list])
  return items
}

/**
 * Extract the locale from the meta tag. Ex:
 * <meta name="locale" content="fr" /> => "fr"
 * FIXME: Maybe extract from <html lang="fr"> instead...
 */
export function getLocale(val) {
  return (document.querySelector('[name="locale"]')||{}).content
}

// DEPRECATED since I changed the way translation are done?
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
 * FIXME: Is this usefull? How about only using useFalseOnce???
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

export const useFalseOnce = () => {
  const [v, setV] = useState(false) 
  useEffect(() => {setV(true)}, [])
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
  return url === '' || url === '/' || url === '/h'
}

export const currentPathIs = (p) => {
  return window.location.pathname === p
}

export const Link = ({href, className, children, active, checkIfActive, path, onClick, ...props}) => {
  if (href) {throw 'Error bad argument href for Link, expected path.'}
  const handleClick = (evt) => {
    if (window.preventLinksDefaultEvent) {
      evt.preventDefault()
      if (onClick) {onClick(evt)}
      changeUrl(path)
    }
  }
  active = active || (checkIfActive && currentPathIs(path))
  path = (window.preventLinksDefaultEvent) ? path : localeHref(path)
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

// FIXME: Badly implemented... Don't use window...
// This is better with dependencies, but still bad
export const useCacheOrFetch2 = (url, dependencies=[]) => {
  const [data, setData] = useState(window[`fetched_${url}`]);

  useEffect(() => {
    let waiting = dependencies.find(d => d === null || d === undefined)
    if (!window[`fetching_${url}`] && !waiting) {
      async function fetchData() {
        console.log(`Fetching data at ${url}`)
        const response = await fetch(url);
        const json = await response.json();
        window[`fetched_${url}`] = json
        setData(json);
      }
      window[`fetching_${url}`] = true
      fetchData();
    } else if (window[`fetched_${url}`]) {
      setData(window[`fetched_${url}`])
    }
  }, [url, dependencies]);

  return data;
};

// FIXME: Badly implemented... Don't use window...
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
    } else if (window[`fetched_${url}`]) {
      setData(window[`fetched_${url}`])
    }
  }, [url, waitFor]);

  return data;
};

export const useElemWidth = () => {

  const ref = useRef(null)
  const [width, setWidth] = useState(null)

  useEffect(() => {
    setWidth(ref.current.offsetWidth)
    const f = () => {
      let w = ref.current.offsetWidth
      if (w != width) {setWidth(w)}
    }
    window.addEventListener('resize', f)
    return () => {
      window.removeEventListener('resize', f)
    }
  }, [ref])

  return [width, ref]
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

//export const useFetch = (url, args={}) => {
//  const {waitFor} = args
//  const [data, setData] = useState(null);
//
//  useEffect(() => {
//    if (waitFor != false) {
//      async function fetchData() {
//        console.log(`Fetching data at ${url}`)
//        const response = await fetch(url);
//        const json = await response.json();
//        setData(json);
//      }
//      fetchData();
//    }
//  }, [url, waitFor]);
//
//  return data;
//};

/**
 * Yet another implement attempt.
 * Returns the first record from the group that matches the match function.
 * Otherwiser fetches the record at the record and sets it inside hcu.
 */
export const useOrFetch = (table, group, match, url, dependency='none') => {

  let disabled = !dependency

  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (disabled) {return}
    let r = group.find(e => match(e))
    if (r && r != record) {
      setRecord(r)
    } else if (!r) {
      ajax({url, type: 'GET', success: (fetched) => {
        window.hcu.addRecord(table, fetched)
        setRecord(fetched)
      }, error: handleError(t('Error_fetching')) })
    }
  }, [match])
  
  return record
}

export const useFetch = (url, dependency='none') => {

  let disabled = !dependency

  const [data, setData] = useState(null)

  useEffect(() => {
    if (disabled) {return}
    ajax({url, type: 'GET', success: (fetched) => {
      setData(fetched)
    }, error: handleError(t('Error_fetching')) })
  }, [url, dependency])
  
  return data
}

export const useCsrf = () => {
  const [_csrf, setCsrf] = useState('')
  useEffect(() => {
    setCsrf(document.querySelector('[name="csrf-token"]').content)
  }, [])
  return _csrf
}
