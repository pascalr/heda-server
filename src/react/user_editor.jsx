import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client';

import { TextField } from './form'
import { useHcuState } from "./lib"
 

const UserEditor = () => {

  const user = useHcuState(gon.user, {className: 'user'})

  return <>
    <b>Name</b><br/>
    <TextField model={user} field="name" size="8" className="editable-input" /><br/><br/>
    <b>Gender</b><br/>
    <TextField model={user} field="foo" size="8" className="editable-input" /><br/><br/>
    <b>Password</b><br/>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = createRoot(document.getElementById("root"));
  root.render(<UserEditor/>);
})
