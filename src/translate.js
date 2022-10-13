export function tr(id, locale) {
  let en = {
    by_2: 'by',
  }
  let fr = {
    Edit_profile: 'Modifier le profil',
    Name: 'Nom',
    Image: 'Image',
    Delete: 'Supprimer',
    Delete_recipe: 'Supprimer la recette',
    Ok: 'Ok',
    Language: 'Language',
    My_profile: 'Mon profil',
    Logout: 'Déconnexion',
    New_profile: 'Nouveau profil',
    Switch_user: "Changer d'utilisateur",
    My_recipes: 'Mes recettes',
    New_recipe: 'Nouvelle recette',
    To_cook_soon: 'À cuisinner prochainement',
    To_cook: 'À cuisinner',
    To_try: 'À essayer',
    Stop_cooking_soon: 'Ne plus cuisiner',
    Stop_trying_recipe: 'Ne plus essayer',
    Remove_from_favorites: 'Retirer de mes favoris',
    Personal_recipes: 'Recettes personnelles',
    Commands: 'Commandes',
    Add_section: 'Ajouter une section',
    Favorite_recipes: 'Recettes favorites',
    Settings: 'Paramètres',
    Tags: 'Tags',
    Create_tag: 'Créer un tag',
    Create: 'Créer',
    Modify_tag: 'Modifier le tag',
    Modify: 'Modifier',
    Edit: 'Modifier',
    Tag: 'Tagger',
    Category: 'Catégorie',
    No_matching_category_found: 'Aucune catégorie correspondante',
    Ingredients: 'Ingrédients',
    Instructions: 'Instructions',
    Servings: 'Portions',
    Total: 'Total',
    min: 'min',
    Preparation: 'Préparation',
    Cooking: 'Cuisson',
    by: 'par',
    by_2: 'de',
    Suggestions: 'Suggestions',
  }
  if (locale == 'fr') {
    if (!fr[id]) {console.log('Missing translation for '+id+' in '+locale)}
    else {return fr[id]}
  }
  return en[id] ? en[id] : id.replace(/_/g, ' ')
}

export function t(id) {
  let g = (typeof window === 'undefined') ? global : window
  return tr(id, g['locale'])
}

//let en = {
//  Edit_profile: 'Edit profile',
//  Name: 'Name',
//  Image: 'Image',
//  Delete: 'Delete',
//  Ok: 'Ok',
//  Language: 'Language',
//  My_profile: 'My profile',
//  Logout: 'Logout',
//  New_profile: 'New profile',
//  Switch_user: 'Switch user',
//  My_recipes: 'My recipes',
//  New_recipe: 'New recipe',
//  To_cook_soon: 'To cook soon',
//}
