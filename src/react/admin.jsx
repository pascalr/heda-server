import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { Link } from "./lib"
import { MainSearch } from './main_search'
import { HomeTab } from './app'
import { t } from "../translate"
import { useRouter } from "./router"

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('Translations'), path: '/translations'}} />
    </ul>
  </>
}

const AdminPage = () => <h1>Admin page</h1>
const TranslationsPage = () => <h1>Translations page</h1>

export const Admin = () => {

  const [locale, ] = useState(gon.locale)

  const routes = [
    {match: "/admin", elem: () => <AdminPage />},
    {match: "/translations", elem: () => <TranslationsPage />},
  ]
  const defaultElement = (params) => <TranslationsPage />
  
  const elem = useRouter(routes, defaultElement)
  
  return <>
    <MainSearch {...{locale}} />
    <div className="trunk">
      <AdminTabs/>
      {elem}
    </div>
  </>
}

root = document.getElementById('root-admin')
if (root) {ReactDOM.render(<Admin />, root)}
