import { normalizeSearchText } from "./react/utils.js"

export function findRecipeKindForRecipeName(recipeName, recipeKinds) {
  let name = normalizeSearchText(recipeName)
  return recipeKinds.find(k => name.includes(normalizeSearchText(k.name)))
}
