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
    Home_8: "Desserts",
    Home_9: "A specialized recipe editor",
    Home_10: "Create your recipes quickly with a specialized recipe editor. Explore by yourself what it can do with the live editor below!",
    Who_cooking: "Who's cooking?",
    Image_format_not_supported: "Image format not supported. Expected jpg, jpeg or png. Was ",
    I_am_author: "I am the author of this image",
    Image_public_license: "The image is under a license that allows it's usage",
    Note_create_tag: "Note: You can create new tags in your ",
    n1: "Enter one ingredient per line.",
    n2: "Separate the quantity from the ingredient by a semi-colon.",
    n3: "Sections start with a «#».",
    n4: "Start a line with «#» for each step of the recipe.",
    n5: "Start a line with «$» for a big title.",
    n6: "Start a line with «$$» for a medium title.",
    n7: "Start a line with «$$$» for a small title.",
    n8: "Start a line with «/» to write a paragraph in italic.",
    n9: "Show ingredient 3",
    n10: "Show ingredients 3, 4 and 5",
    n11: "Show ingredients 3 and 5",
  }
  let fr = {
    Many_meals: "Plusieurs repas",
    Current_tags: "Tags actuels",
    Add_a_tag: "Ajouter un tag",
    Notes: "Notes",
    n1: "Entrer un ingrédient par ligne.",
    n2: "Séparer la quantité de l'ingrédient par un point-virgule.",
    n3: "Les sections commencent par «#».",
    n4: "Commencer une ligne avec «#» pour chaque étape de la recette.",
    n5: "Commencer une ligne avec «$» pour un grand titre.",
    n6: "Commencer une ligne avec «$$» pour un moyen titre.",
    n7: "Commencer une ligne avec «$$$» pour un petit titre.",
    n8: "Commencer une ligne avec «/» pour faire un paragraph en italique.",
    n9: "Afficher l'ingrédient 3",
    n10: "Afficher les ingrédients 3, 4 et 5",
    n11: "Afficher les ingrédients 3 et 5",
    Keyboard_shortcuts: "Racourcis clavier",
    Note_create_tag: "Note: Vous pouvez créer de nouveaux tags dans vos ",
    parameters: "paramètres",
    Author: "Auteur",
    Source: "Source",
    Choose_an_image: "Choisir une image",
    I_am_author: "Je suis l'auteur de cette image",
    Image_public_license: "L'image est sous une license qui permet son usage",
    Image_format_not_supported: "Le format d'image n'est pas supporté. Les formats jpg, jpeg ou png sont valide, mais le format reçu était ",
    Username: "Nom d'utilisateur",
    Password: "Mot de passe",
    Who_cooking: "Qui cuisine?",
    Home_1: "Accèdez à vos recettes de n'importe où. Partagez avec votre famille et vos amis. Reçevez des suggestions de recettes personalisées.",
    Home_2: "Des recettes personnalisées",
    Home_3: "Suggestions par catégories",
    Home_4: "Arrêtez de vous casser la tête pour savoir quoi cuisiner. Organisez vos recettes par catégories pour avoir des suggestions selon vos besoins. Par exemple:",
    Home_8: "Désserts",
    Home_9: "Un éditeur de recette spécialisé",
    Home_10: "Créez des recettes rapidement à l'aide d'un éditeur de recette spécialisé. Explorez par vous-même ce qu'il peut faire ici-bas!",
    Help_login: 'Vous avez déjà un compte?',
    Help_signup: "Vous n'avez pas de compte?",
    Attribute_to_this_profil: "Attribuer à ce profil",
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
