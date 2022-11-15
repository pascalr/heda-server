import React, { useState, useEffect, useRef } from 'react'

import { shuffle } from "../utils"
import { ajax } from "./utils"
import { t } from "../translate"
import { RecipeCarrousel } from './core'

const QuestionPage = ({title, answers, answer}) => {

  let textForAttribute = {
    is_appetizer: t("An_appetizer"),
    is_meal: t("A_meal"),
    is_dessert: t("A_dessert"),
    is_other: t("Other"),
    is_small_qty: t("Small"),
    is_medium_qty: t("Average"),
    is_big_qty: t("Big"),
    is_simple: t("Simple"),
    is_normal: t("Normal"),
    is_gourmet: t("Gourmet"),
    is_very_fast: t("Right_now"),
    is_fast: t("Soon"),
  }

  return <>
    <br/>
    <div className='m-auto' style={{width: 'fit-content'}}>
      {answers.map(a =>
        <button key={a} type="button" className="btn btn-outline-primary d-block m-2" style={{minWidth: '10em'}} onClick={() => answer(a)}>{textForAttribute[a]}</button>
      )}
      <button type="button" className="btn btn-outline-primary d-block m-2" style={{minWidth: '10em'}} onClick={() => answer('')}>{t('Skip')}</button>
    </div>
  </>
}

export const SuggestionsPage = ({}) => {

  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState({})

  useEffect(() => {
    ajax({url: '/fetch_suggestions', type: 'GET', data: {answers}, success: (result) => {
      setResult(result)
    }})
  }, [answers])

  let questions = [
    {title: t('What_to_eat'), answers: ['is_appetizer', 'is_meal', 'is_dessert', "is_other"]},
    {title: t('Difficulty'), answers: ['is_simple', 'is_normal', 'is_gourmet']},
    {title: t('What_quantity'), answers: ['is_small_qty', 'is_medium_qty', "is_big_qty"]},
    {title: t('For_when'), answers: ['is_very_fast', 'is_fast']},
  ]

  const answer = (response) => {
    setAnswers([...answers, response]) 
  }

  let question = questions[answers.length]
  let nbResult = result.nbSuggestions||0
  let isDone = answers.length >= questions.length
  return <>
    <br/>
    <h2 className='text-center'>
      {isDone ? <>{t('Result')}: {nbResult}</> : question.title+'?'}
    </h2>
    { isDone ? null : <QuestionPage {...{...question, answer}} />}
    <br/><br/>
    <h2 className="fs-14 bold">{t('Suggestions')}</h2>
    <RecipeCarrousel {...{items: result.suggestions||[], isRecipeKind: true}}/>
  </>
}
