import React from 'react'
import { LazyLoadImage } from "react-lazy-load-image-component";

import { isTrue } from "./utils"
import { useElemWidth } from "./lib"
import {image_path, image_slug_variant_path } from './routes'
import DefaultRecipeImage from '../../public/img/default_recipe_01.png'

const ImageCredit = ({imageSlug, image, images, width}) => {
  if (!image && !images) {return ''}
  image = image || images.find(i => i.slug == imageSlug)
  if (!image || !image.author || !image.source) {return ''}
  return <>
    <div className="text-center" style={{width: `${width}px`}}>
      <i>Crédit photo: </i>
      <u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
    </div>
  </>
}

// Variant can be "thumb", "small", "medium"
export const RecipeImage = ({recipe, image, images, showCredit, width, height, variant}) => {

  let [elemWidth, ref] = useElemWidth()
  console.log('elemWidth', elemWidth)
  let w = Math.min(width, elemWidth)
  let h = height * w / width

  const imagePath = recipe.image_slug ? image_path(recipe.image_slug, variant) : DefaultRecipeImage
  let args = {src: imagePath, width, height, style: {transform: `translateY(calc(-50% + ${h/2}px))`}}
  let img = (window.disableLazyLoading) ? <img {...args} /> : <LazyLoadImage {...args} />
  return <>
    <div ref={ref} style={{width: '100%'}}>
      <div style={{width: `${w}px`, height: `${h}px`, overflow: 'hidden', flexShrink: '0'}}>
        {img}
      </div>
      {showCredit ? <ImageCredit {...{width: w, imageSlug: recipe.image_slug, images, image}} /> : ''}
    </div>
  </>
}

export const RecipeMediumImage = (props) => {
  return <RecipeImage {...{...props, width: 452, height: 304, variant: 'original'}} />
}

export const RecipeThumbnailImage = (props) => {
  return <RecipeImage {...{...props, width: 71, height: 48, variant: 'thumb'}} />
}

export const RecipeSmallImage = (props) => {
  return <RecipeImage {...{...props, width: 255, height: 171, variant: 'small'}} />
}

export const UserThumbnailImage = ({user}) => {
  if (user && user.image_slug) {
    // FIXME: Don't send original sized image... Generate thumbnails for users too.
    return <img src={'/imgs/original/'+user.image_slug} width="64" height="64" style={{width: 'auto', height: '64px'}} />
  } else {
    return <img src={'/img/tux-cooking.svg'} width="64" height="64" style={{width: 'auto', height: '64px'}} />
  }
}
