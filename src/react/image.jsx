import React from 'react'

import { isTrue } from "./utils"
import {image_variant_path, image_slug_variant_path } from './routes'

const ImageCredit = ({imageId, images}) => {
  const image = images.find(i => i.id == imageId)
  if (!image || !image.author || !image.source) {return ''}
  return <>
    <div className="text-center">
      <i>Crédit photo: </i>
      <u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
    </div>
  </>
}

// Variant can be "thumb", "small", "medium"
const RecipeImage = ({recipe, recipeKinds, images, showCredit, width, height, variant}) => {
  const recipe_kind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const imageId = isTrue(recipe.use_personalised_image) ? recipe.image_id : recipe_kind && recipe_kind.image_id
  const imagePath = imageId ? image_variant_path({id: imageId}, variant) : "/img/default_recipe_01.png"
  return <>
    <div style={{width: `${width}px`, height: `${height}px`, overflow: 'hidden', flexShrink: '0'}}>
      <img src={imagePath} width={width} height={height} style={{transform: `translateY(calc(-50% + ${height/2}px))`}} />
    </div>
    {showCredit ? <ImageCredit {...{imageId, images}} /> : ''}
  </>
}

export const RecipeMediumImage = (props) => {
  return <RecipeImage {...{...props, width: 452, height: 304}} />
}

export const RecipeThumbnailImage = (props) => {
  return <RecipeImage {...{...props, width: 71, height: 48}} />
}
