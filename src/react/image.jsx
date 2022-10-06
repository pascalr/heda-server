import React from 'react'

import { isTrue } from "./utils"
import {image_variant_path} from './routes'

export const RecipeMediumImage = ({recipe, recipeKinds, images, showCredit}) => {
  const recipe_kind = recipeKinds.find(k => k.id == recipe.recipe_kind_id)
  const image_used_id = isTrue(recipe.use_personalised_image) ? recipe.image_id : recipe_kind && recipe_kind.image_id
  const image = images.find(i => i.id == image_used_id)
  const imagePath = image ? image_variant_path(image, 'medium') : "/img/default_recipe_01.png"
  return <>
    <div style={{width: "452px", height: "304px", overflow: 'hidden'}}>
      <img src={imagePath} width="452" height="304" style={{transform: 'translateY(calc(-50% + 152px))'}} />
    </div>
    {!showCredit || !image || !image.author || !image.source ? '' : <>
      <div className="text-center">
        <i>Crédit photo: </i><u><a style={{color: 'block', fontSize: '0.95em'}} href={image.source}>{image.author}</a></u>
      </div>
    </>}
  </>
}
