import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
//import { createRoot } from 'react-dom/client';

import { Link } from "./lib"
import { MainSearch } from './main_search'
import { HomeTab } from './app'
import { t } from "../translate"

const AdminTabs = ({machines}) => {
  return <>
    <ul className="nav nav-tabs mb-3">
      <HomeTab {...{title: t('Admin'), path: '/admin'}} />
      <HomeTab {...{title: t('Translations'), path: '/translations'}} />
    </ul>
  </>
}

export const Admin = () => {

  const [locale, ] = useState(gon.locale)

  return <>
    <MainSearch {...{locale}} />
    <div className="trunk">
      <AdminTabs/>
      <h1>Admin</h1>
    </div>
  </>
}

root = document.getElementById('root-admin')
if (root) {ReactDOM.render(<Admin />, root)}
