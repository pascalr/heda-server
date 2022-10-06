import React from 'react'

import { isTrue } from "./utils"
import {image_variant_path} from './routes'

const RecipeImage = ({recipe, recipeKinds, images, showCredit, width, height}) => {
  const recipe_kind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const image_used_id = isTrue(recipe.use_personalised_image) ? recipe.image_id : recipe_kind && recipe_kind.image_id
  const image = images.find(i => i.id == image_used_id)
  const imagePath = image ? image_variant_path(image, 'medium') : "/img/default_recipe_01.png"
  return <>
    <div style={{width: `${width}px`, height: `${height}px`, overflow: 'hidden'}}>
      <img src={imagePath} width={width} height={height} style={{transform: `translateY(calc(-50% + ${height/2}px))`}} />
    </div>
    {!showCredit || !image || !image.author || !image.source ? '' : <>
      <div className="text-center">
        <i>Crédit photo: </i><u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
      </div>
    </>}
  </>
}

export const RecipeMediumImage = (props) => {
  return <RecipeImage {...{...props, width: 452, height: 304}} />
}

export const RecipeThumbnailImage = (props) => {
  return <RecipeImage {...{...props, width: 71, height: 48}} />
}
