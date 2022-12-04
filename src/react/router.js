import { useState, useEffect } from 'react'
import { match } from "path-to-regexp"

import { queryToParams } from "../utils"

export const useRouter = (routes, defaultElement) => {
  
  const [route, setRoute] = useState(null)
  
  const matchRoutes = (pathname, params) => {
    // TODO: Use params, which are query parameters as an object
    // Combine alongside the other params (named params)? User must be careful no name clashes...
    for (let i = 0; i < routes.length; i++) {
      const r = match(routes[i].match, { end: false, decode: decodeURIComponent })(pathname);
      if (r) {return setRoute({idx: i, params: {...params, ...r.params}})}
    }
    setRoute({idx: -1, params})
  }

  useEffect(() => {

    matchRoutes(window.location.pathname, queryToParams(window.location.search))
    const historyChanged = (event) => {
      console.log('history changed', event.detail.pathname, event.detail.params)
      matchRoutes(event.detail.pathname, event.detail.params)
    }
    window.addEventListener('history-changed', historyChanged)
    window.preventLinksDefaultEvent = true
    return () => {
      window.removeEventListener('history-changed', historyChanged)
    }
  }, [])
  
  useEffect(() => {
    window.onpopstate = (event) => {
      console.log('onpopstate')
      matchRoutes(window.location.pathname, queryToParams(window.location.search))
    }
  }, [])
  
  if (route === null) {return {idx: -1, elem: ''}}

  let e = (route.idx < 0) ? defaultElement : routes[route.idx].elem
  let el = null
  if (typeof e !== 'function') {el = e}
  else {el = e(route.params)}
  
  return {idx: route.idx, elem: el}
}
