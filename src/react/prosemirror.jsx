import React, { useState, useEffect, useRef } from 'react'
import { HtmlEditor, Toolbar, Editor } from '@aeaton/react-prosemirror'
import { Schema } from 'prosemirror-model'
import { toggleMark } from 'prosemirror-commands'
import { baseKeymap } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import { history, undo, redo } from 'prosemirror-history'
import { isMarkActive } from '@aeaton/prosemirror-commands'

import {BoldIcon, ItalicIcon} from './prosemirror_buttons'

const schema = new Schema({
  nodes: {
    // a text node
    text: {},
    // a top-level doc node, which can contain at least one paragraph
    doc: {
      content: 'paragraph+'
    },
    // a paragraph node, which can contain some text nodes, represented in HTML as `<p>`
    paragraph: {
      content: 'text*',
      parseDOM: [{ tag: 'p' }],
      toDOM: () => ['p', 0],
    },
  },
  marks: {
    // a strong mark, represented in HTML as `<strong>`
    strong: {
      parseDOM: [{ tag: 'strong' }],
      toDOM: () => ['strong', 0],
    },
    // an emphasis mark, represented in HTML as `<em>`
    emphasis: {
      parseDOM: [{ tag: 'em' }],
      toDOM: () => ['em', 0],
    }
  }
})

const toggleMarkStrong = toggleMark(schema.marks.strong)
const toggleMarkEmphasis = toggleMark(schema.marks.emphasis)

const plugins = [
  history(),
  keymap({
    'Mod-z': undo,
    'Shift-Mod-z': redo,
    'Meta-b': toggleMarkStrong,
    'Meta-i': toggleMarkEmphasis,
  }),
  keymap(baseKeymap),
]

const width = 24
const height = 24

const toolbar = [
  {
    id: 'marks',
    items: [
      {
        id: 'toggle-strong',
        className: 'testing1212',
        content: <BoldIcon {...{width, height}} />,
        action: toggleMarkStrong,
        enable: toggleMarkStrong,
        active: isMarkActive(schema.marks.strong),
      },
      {
        id: 'toggle-emphasis',
        title: 'Toggle emphasis',
        content: <ItalicIcon {...{width, height}} />,
        action: toggleMarkEmphasis,
        enable: toggleMarkEmphasis,
        active: isMarkActive(schema.marks.emphasis),
      },
    ]
  }
]

export const ProseMirror = () => {
  const [value, setValue] = useState('<p></p>')

  console.log({ value })

  return (
    <HtmlEditor
      schema={schema}
      plugins={plugins}
      value={value}
      handleChange={setValue}
      debounce={250}
    >
      <Toolbar toolbar={toolbar} />
      <Editor autoFocus />
    </HtmlEditor>
  )
}

//import {undo, redo, history} from "prosemirror-history"
//import {Plugin, EditorState} from "prosemirror-state"
//import {EditorView} from "prosemirror-view"
//import {Schema, DOMParser} from "prosemirror-model"
//import {schema} from "prosemirror-schema-basic"
//import {addListNodes} from "prosemirror-schema-list"
////import {exampleSetup} from "prosemirror-example-setup"
//import {keymap} from "prosemirror-keymap"
//import {baseKeymap, toggleMark, setBlockType, wrapIn} from "prosemirror-commands"
//
//import {Inline} from 'jsxstyle'
//
//import {MarkButton, BoldIcon, ImageButton, HelpButton, StepButton, IngredientButton, AddNoteButton, MeasuringButton, CharButton, ItalicIcon, MoreButton, LinkButton, SubscriptButton, SuperscriptButton} from './prosemirror_buttons'
//
//const Toolbar = ({ editor, ingredients }) => {
//  if (!editor) {return null}
//
//  console.log('Toolbar')
//
//  const width = 24
//  const height = 24
//
//  // REALLY UGLY
//  let selectedHeader = "0";
//  //if (editor.isActive('heading', { level: 3 })) {selectedHeader = "3"}
//  //if (editor.isActive('heading', { level: 4 })) {selectedHeader = "4"}
//  //if (editor.isActive('heading', { level: 5 })) {selectedHeader = "5"}
//  // selectedHeader = editor.getAttributes('heading').level // Does not work
//
//  return (
//    <div className="toolbar" style={{display: "flex"}}>
//      <Inline padding="0 1.5em">
//        <select value={selectedHeader} style={{display: "flex", alignItems: "center"}} onChange={(e) => {
//          let val = parseInt(e.target.value)
//          if (!val) {
//            editor.chain().focus().setParagraph().run()
//          } else {
//            editor.chain().focus().toggleHeading({ level: val }).run()
//          }
//        }}>
//          <option value="3">Titre 1</option>
//          <option value="4">Titre 2</option>
//          <option value="5">Titre 3</option>
//          <option value="0">Normal</option>
//        </select>
//      </Inline>
//      <Inline padding="0 1.5em">
//        <StepButton editor={editor} width={width} height={height} />
//        <IngredientButton editor={editor} width={width} height={height} ingredients={ingredients} />
//        <MeasuringButton editor={editor} width={width} height={height} />
//        <AddNoteButton editor={editor} width={width} height={height} />
//        <LinkButton editor={editor} width={width} height={height} />
//        <CharButton editor={editor} width={width} height={height} />
//        <MoreButton editor={editor} width={width} height={height} />
//      </Inline>
//      <Inline padding="0 1.5em">
//        <MarkButton {...{editor, type: schema.marks.strong}}><BoldIcon {...{width, height}}/></MarkButton>
//        <MarkButton {...{editor, type: schema.marks.em}}><ItalicIcon {...{width, height}}/></MarkButton>
//      </Inline>
//      <Inline flexGrow="1"></Inline>
//      <HelpButton editor={editor} width={width} height={height} />
//    </div>
//  )
//}
//
////export const Menu = ({view}) => {
////  console.log('Menu')
////  const test = () => {
////    toggleMark(schema.marks.strong)(view.state, view.dispatch, view)
////  }
////  return <button type="button" className="btn btn-primary" onClick={test}>Testing</button>
////}
////
//class MenuView {
//  constructor(editorView, setView) {
//    this.editorView = editorView
//    this.setView = setView
//  }
//  update() {
//    console.log('UPDATE')
//    this.setView({...this.editorView})
//  }
//  destroy() { }
//}
//
//function menuPlugin(setView) {
//  return new Plugin({
//    view(editorView) {
//      return new MenuView(editorView, setView)
//    }
//  })
//}
//
//// Mix the nodes from prosemirror-schema-list into the basic schema to
//// create a schema with list support.
//const mySchema = new Schema({
//  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
//  marks: schema.spec.marks
//})
//
//export const ProseMirror = ({ingredients}) => {
//
//  let ref = useRef(null)
//  let toolbarRef = useRef(null)
//  // FIXME: I don't like doing this. view should be immutable, but it is not here...
//  // But how else to update the Toolbar based on the view???
//  let [view, setView] = useState(null)
//
//  const [renderCount, setRenderCount] = useState(0)
//  
//  console.log('ProseMirror')
//  
//  //useEffect(() => {
//  //  createRoot(toolbarRef.current).render(<Menu view={view}/>);
//  //}, [])
//    
//  useEffect(() => {
//    if (view) {console.log('View destroyed'); view.destroy()}
//    console.log('View created')
//    let editorView = new EditorView(ref.current, {
//      state: EditorState.create({
//        doc: DOMParser.fromSchema(mySchema).parse(''),
//        plugins: [
//          history(),
//          keymap({"Mod-z": undo, "Mod-y": redo}),
//          keymap(baseKeymap),
//          menuPlugin(setView)
//        ]
//      }),
//      //dispatchTransaction(transaction) {
//      //  console.log("Document size went from", transaction.before.content.size,
//      //              "to", transaction.doc.content.size)
//      //  let newState = editorView.state.apply(transaction)
//      //  editorView.updateState(newState)
//      //  //setView({...editorView})
//      //  setRenderCount(renderCount+1)
//      //}
//    })
//    console.log('initialEditorView', editorView)
//    setView(editorView)
//    return () => {
//      if (view) {console.log('View destroyed'); view.destroy()}
//      if (editorView && !view) {console.log('!!!!!!!!!!!!!!!!!!!!')}
//    }
//  }, [ingredients])
//
//  return <>
//    <Toolbar {...{ingredients, editor: view ? {...view} : null, renderCount}} />
//    <div ref={toolbarRef}></div>
//    <div ref={ref}></div>
//  </>
//}
