import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client';

import { TextField, RadioField } from './form'
import { useHcuState } from "./lib"
 

const UserEditor = () => {

  const user = useHcuState(gon.user, {className: 'user'})

  return <>
    <b>Name</b><br/>
    <TextField model={user} field="name" size="8" className="editable-input" /><br/><br/>
    <b>Gender</b><br/>
    <RadioField model={user} field="gender" value={1} label="Homme"/><br/>
    <RadioField model={user} field="gender" value={2} label="Femme"/><br/>
    <RadioField model={user} field="gender" value={3} label="Autre"/><br/>
    <b>Password</b><br/>
  </>
}

document.addEventListener('DOMContentLoaded', () => {

  const root = createRoot(document.getElementById("root"));
  root.render(<UserEditor/>);
})
