import React, { useState, useEffect } from 'react';
import toastr from 'toastr'

import { ajax, omit, join, bindSetter, capitalize } from "./utils"
import { t } from '../translate'

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

export function serializeIngredientsAndHeaders(ingredients) {
  return ingredients.map(ing => {
    if (ing.header != null) {return '#'+ing.header}
    return ing.qty + '; ' + ing.label
  }).join("\n")
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

export function parseIngredientsAndHeaders(text) {
  if (!text) {return []}
  let itemNb = 0
  return text.split("\n").map((line,i) => {
    if (line.length <= 0) {return null;}
    const key = `${i}-${line}`
    // An ingredient section
    if (line[0] == '#') {
      return {key: key, header: line.substr(1).trim()}
    }
    let args = line.split(";")
    itemNb += 1
    return {key: key, qty: args[0].trim(), label: args[1].trim(), item_nb: itemNb}
  }).filter(e => e)
}

export const LinkToPage = ({page, className, children, active, ...props}) => {
  const switchPage = (evt, page) => {
    evt.preventDefault()
    //getRegister('setPage')(page)
    window.hcu.changePage(page)
  }
  const href = '?'+new URLSearchParams(page).toString()

  return <a className={join(className, active ? 'active' : null)} href={href} onClick={(e) => switchPage(e, page)} {...props}>{children}</a>
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
