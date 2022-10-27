import React from 'react'

import { isTrue } from "./utils"
import {image_path, image_slug_variant_path } from './routes'

import DefaultRecipeImage from '../../public/img/default_recipe_01.png'

const ImageCredit = ({imageSlug, images}) => {
  const image = images.find(i => i.slug == imageSlug)
  if (!image || !image.author || !image.source) {return ''}
  return <>
    <div className="text-center">
      <i>Crédit photo: </i>
      <u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
    </div>
  </>
}

// Variant can be "thumb", "small", "medium"
export const RecipeImage = ({recipe, images, showCredit, width, height, variant}) => {
  const imagePath = recipe.image_slug ? image_path(recipe.image_slug, variant) : DefaultRecipeImage
  return <>
    <div style={{width: `${width}px`, height: `${height}px`, maxWidth: '100%', overflow: 'hidden', flexShrink: '0'}}>
      <img src={imagePath} width={width} height={height} style={{transform: `translateY(calc(-50% + ${height/2}px))`}} />
    </div>
    {showCredit ? <ImageCredit {...{imageSlug: recipe.image_slug, images}} /> : ''}
  </>
}

export const RecipeMediumImage = (props) => {
  return <RecipeImage {...{...props, width: 452, height: 304}} />
}

export const RecipeThumbnailImage = (props) => {
  return <RecipeImage {...{...props, width: 71, height: 48}} />
}

export const RecipeSmallImage = (props) => {
  return <RecipeImage {...{...props, width: 255, height: 171}} />
}

export const UserThumbnailImage = ({user}) => {
  return <img src={'/imgs/user_thumb/'+user.image_slug} width="36" height="36" style={{width: 'auto', height: '64px'}} />
}
