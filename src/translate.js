export function tr(id, locale) {
  let en = {
    by_2: 'by',
    Confirm_delete: 'Are you sure you want to remove this item?',
    Error_destroying: 'An error has occured that prevented this record from being destroyed.',
    Error_fetching: 'An error has occured that prevented this record from being showned.',
    Error_creating: 'An error has occured that prevented this record from being created.',
    Error_updating: 'An error has occured that prevented this record from being modified.',
    Sorry_error: 'We are very sorry, but something went wrong.',
  }
  let fr = {
    Attribute_to_this_profile: "Attribuer à ce profil",
    Sorry_error: "Nous sommes vraiment désolé, mais une erreur s'est produite.",
    Login: 'Se connecter',
    Favorites: 'Favoris',
    Recipes_by: 'Les recettes de',
    Search: 'Rechercher',
    Search_for_a_public_member: 'Rechercher un membre publique',
    Public_members: 'Membres publiques',
    private: 'privé',
    public: 'public',
    Visibility: 'Visibilité',
    Edit_profile: 'Modifier le profil',
    Name: 'Nom',
    Image: 'Image',
    Delete: 'Supprimer',
    Delete_recipe: 'Supprimer la recette',
    Ok: 'Ok',
    Language: 'Language',
    Image_suggestions: "Suggestions d'images",
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
    Confirm_delete: 'Êtes-vous certain de vouloir supprimer cet item?',
    Error_destroying: 'Une erreur est survenue qui a empêché la suppression de cet item.',
    Error_fetching: 'Une erreur est survenue qui a empêché de montrer cet item.',
    Error_creating: 'Une erreur est survenue qui a empêché de créer cet item.',
    Error_updating: 'Une erreur est survenue qui a empêché la modification cet item.',
  }
  if (locale == 'fr' || locale == 'FR') {
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
