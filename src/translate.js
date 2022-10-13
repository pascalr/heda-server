export function tr(id, locale) {
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
  let fr = {
    Edit_profile: 'Modifier le profil',
    Name: 'Nom',
    Image: 'Image',
    Delete: 'Supprimer',
    Ok: 'Ok',
    Language: 'Language',
    My_profile: 'Mon profil',
    Logout: 'Déconnexion',
    New_profile: 'Nouveau profil',
    Switch_user: "Changer d'utilisateur",
    My_recipes: 'Mes recettes',
    New_recipe: 'Nouvelle recette',
    To_cook_soon: 'À cuisinner prochainement',
    To_try: 'À essayer',
    Personal_recipes: 'Recettes personnelles',
    Favorite_recipes: 'Recettes favorites',
    Settings: 'Paramètres',
  }
  if (locale == 'fr') {
    if (!fr[id]) {console.log('Missing translation for '+id+' in '+locale)}
    else {return fr[id]}
  }
  return id.replace(/_/g, ' ')
}

export function t(id) {
  let g = (typeof window === 'undefined') ? global : window
  return tr(id, g['locale'])
}
