export function tr(id, locale) {
  let en = {
    by_2: 'by',
    Confirm_delete: 'Are you sure you want to remove this item?',
    Error_destroying: 'An error has occured that prevented this record from being destroyed.',
    Error_fetching: 'An error has occured that prevented this record from being showned.',
    Error_creating: 'An error has occured that prevented this record from being created.',
    Error_updating: 'An error has occured that prevented this record from being modified.',
    Sorry_error: 'We are very sorry, but something went wrong.',
    Help_login: 'Already have an account?',
    Help_signup: "Don't have an account?",
    Home_1: "Access your recipes from anywhere. Share with your family and friends. Get personalised recipe suggestions.",
    Home_2: "Personalised recipes",
    Home_3: "Suggestions by categories",
    Home_4: "Stop wondering what to eat. Organize your recipes by categories to get suggestions based on your needs. For example:",
    Home_5: "A quick recipe for the week",
    Home_6: "A big meal with lots of left overs",
    Home_7: "Special occasions like Christmas",
    Home_8: "Desserts",
    Home_9: "A specialized recipe editor",
    Home_10: "Create your recipes quickly with a specialized recipe editor. Explore by yourself what it can do with the live editor below!",
    Who_cooking: "Who's cooking?",
  }
  let fr = {
    Username: "Nom d'utilisateur",
    Password: "Mot de passe",
    Who_cooking: "Qui cuisine?",
    Home_1: "Accèdez à vos recettes de n'importe où. Partagez avec votre famille et vos amis. Reçevez des suggestions de recettes personalisées.",
    Home_2: "Des recettes personnalisées",
    Home_3: "Suggestions par catégories",
    Home_4: "Arrêtez de vous casser la tête pour savoir quoi cuisiner. Organisez vos recettes par catégories pour avoir des suggestions selon vos besoins. Par exemple:",
    Home_5: "Une recette rapide de semaine",
    Home_6: "Un gros repas avec des restants pour les lunchs",
    Home_7: "Des occasions spéciales comme noël",
    Home_8: "Désserts",
    Home_9: "Un éditeur de recette spécialisé",
    Home_10: "Créez des recettes rapidement à l'aide d'un éditeur de recette spécialisé. Explorez par vous-même ce qu'il peut faire ici-bas!",
    Help_login: 'Vous avez déjà un compte?',
    Help_signup: "Vous n'avez pas de compte?",
    Attribute_to_this_profile: "Attribuer à ce profil",
    Sorry_error: "Nous sommes vraiment désolé, mais une erreur s'est produite.",
    Login: 'Se connecter',
    Favorites: 'Favoris',
    Recipes_by: 'Les recettes de',
    Recipes: 'Recettes',
    Search: 'Rechercher',
    Search_for_a_public_member: 'Rechercher un membre publique',
    Public_members: 'Membres publics',
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
    Sign_in: 'Se connecter',
    Sign_up: 'Créer un compte',
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
  return tr(id, g.locale)
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
