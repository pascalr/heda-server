import React from 'react'
import { LazyLoadImage } from "react-lazy-load-image-component";

import { isTrue } from "./utils"
import {image_path, image_slug_variant_path } from './routes'
import DefaultRecipeImage from '../../public/img/default_recipe_01.png'

const ImageCredit = ({imageSlug, image, images}) => {
  if (!image && !images) {return ''}
  image = image || images.find(i => i.slug == imageSlug)
  if (!image || !image.author || !image.source) {return ''}
  return <>
    <div className="text-center">
      <i>Crédit photo: </i>
      <u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
    </div>
  </>
}

// Variant can be "thumb", "small", "medium"
export const RecipeImage = ({recipe, image, images, showCredit, width, height, variant}) => {
  const imagePath = recipe.image_slug ? image_path(recipe.image_slug, variant) : DefaultRecipeImage
  let img = null
  if (window.disableLazyLoading) {
    img = <img src={imagePath} width={width} height={height} style={{transform: `translateY(calc(-50% + ${height/2}px))`}} />
  } else {
    img = <LazyLoadImage src={imagePath} width={width} height={height} style={{transform: `translateY(calc(-50% + ${height/2}px))`}} />
  }
  return <>
    <div style={{width: `${width}px`, height: `${height}px`, maxWidth: '100%', overflow: 'hidden', flexShrink: '0'}}>
      {img}
    </div>
    {showCredit ? <ImageCredit {...{imageSlug: recipe.image_slug, images, image}} /> : ''}
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
