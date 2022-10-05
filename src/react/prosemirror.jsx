import React, { useState, useEffect, useRef } from 'react'

import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, DOMParser} from "prosemirror-model"
import {schema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"
import {exampleSetup} from "prosemirror-example-setup"
import {toggleMark, setBlockType, wrapIn} from "prosemirror-commands"

export const Menu = ({view}) => {
  const test = () => {
    toggleMark(schema.marks.strong)(view.state, view.dispatch, view)
  }
  return <button type="button" className="btn btn-primary" onClick={test}>Testing</button>
}

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks
})

export const ProseMirror = ({ingredients}) => {

  let ref = useRef(null)
  let [view, setView] = useState(null)
    
  useEffect(() => {
    if (view) {console.log('View destroyed'); view.destroy()}
    console.log('View created')
    setView(new EditorView(ref.current, {
      state: EditorState.create({
        doc: DOMParser.fromSchema(mySchema).parse(''),
        plugins: exampleSetup({schema: mySchema})
      })
    }))
    return () => {
      if (view) {console.log('View destroyed'); view.destroy()}
    }
  }, [ingredients])

  return <>
    <Menu {...{view}} />
    <div ref={ref}></div>
  </>
}
