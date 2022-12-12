export const translate = (locale) => (id) => tr(id, locale)

export function tr(id, locale) {
  if (!id) {return id}
  let en = {
    by_2: 'by',
    Confirm_delete: 'Are you sure you want to remove this item?',
    Error_destroying: 'An error has occurred that prevented this record from being destroyed.',
    Error_fetching: 'An error has occurred that prevented this record from being showed.',
    Error_creating: 'An error has occurred that prevented this record from being created.',
    Error_updating: 'An error has occurred that prevented this record from being modified.',
    Sorry_error: 'We are very sorry, but something went wrong.',
    Help_login: 'Already have an account?',
    Help_signup: "Don't have an account?",
    Home_1: "Discover new recipes and customize them to your liking. Share with everyone if you want. Get recipe suggestions.",
    Home_2: "Personalized recipes",
    Home_3: "Suggestions for you",
    Home_4: "Stop wondering what to eat. Answer a few simple questions to get suggestions based on your needs.",
    Home_8: "Desserts",
    Home_9: "A specialized recipe editor",
    Home_10: "Create your recipes quickly with a specialized recipe editor. Explore by yourself what it can do with the live editor below!",
    Home_11: "Recipes by categories",
    Home_12: "Recipes are organized by categories so you can easily compare them with similar recipes. (Ex: Chocolate chip cookies)",
    Home_13: "Find the recipe you like the ingredients most and use that as a starting point. Use, copy and customize!",
    Home_14: "HedaCuisine is a pretty recent website. At first, the project was to make a robot that cooks. But in order to do that, I needed recipes. So I made a recipe website!",
    Home_15: "2022: The beginning of making the website",
    Home_16: "2023: Public release???",
    Home_17: "Bilingual",
    Home_18: "Recipe suggestions by questions",
    Home_19: "Suggest images for new recipes",
    Home_20: "Automatically classify recipes by categories",
    Home_21: "Recipe suggestions by an input (ex: a dessert with strawberries)",
    Home_22: "Share on social media button",
    Home_23: "Print recipe",
    Home_24: "Comments",
    Home_25: "Ratings",
    Home_26: "A button so a user can download all it's recipes",
    Home_27: "Browse recipes by categories",
    Home_28: "Add a button to the recipe editor to add a list of recipe (equivalent of ex {1-3})",
    Home_29: "An app so you can access your recipes when you are offline too",
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
    n12: "Everybody can see your recipes at the following address:",
    Confirm_destroy_profile: "Are you sure you want to destroy this profile permanently?\n\nAll your data could be lost forever.",
    Contact_msg: "For any question or comments, you can contact me at the following email address:",
    Confirm_destroy_recipe: 'Are you sure you want to destroy this remove permanently?',
    Account_already_associated: 'An account is already associated with this email address.',
    Next_f: 'Next',
    Previous_f: 'Previous',
    Invalid_email: 'Please enter a valid email address.',
    Invalid_password_length: 'Password must be at least 6 characters long.',
    Invalid_username_length: 'Username must be at least 3 characters long.',
    Wrong_answer: 'Wrong answer. Please try again',
    Username_not_unique: "This username is already taken",
    Email_not_unique: "This email address is already used",
    Sign_in_email: "Click the link below to finish signing in to HedaCuisine",
    Waiting_confirm: "An email has been sent. Please check your inbox and validate the email address",
    Waiting_reset: "An email has been sent. Please check your inbox to change your password",
    Reset_password_message: "Someone asked for the HedaCuisine account linked to this email to be reinitialized. Click on the link below to modify it",
    Invalid_username_is_email: "Invalid username. Username can't be an email",
    Invalid_login: "Incorrect username, email or password",
    Internal_error: "Internal error. Please try again later",
  }
  let fr = {
    Invalid_email_address_or_username: "Mauvais nom d'utilisateur ou d'adresse courriel",
    Internal_error: "Erreur du serveur. Veuillez réessayer plus tard",
    Invalid_login: "Nom d'utilisateur, mot de passe ou adresse courriel invalide",
    Invalid_username_is_email: "Nom d'utilisateur invalide. Le nom d'utilisateur ne peut pas être une adresse courriel",
    Reset: "Réinitialiser",
    Reset_password: "Réinitialiser le mot de passe",
    Reset_password_message: "Nous avons reçu une demande de réintialisation du mot de passe de votre compte HedaCuisine. Cliquer sur le lien ci-bas pour le modifier",
    Invalid_email_address: 'Mauvaise adresse courriel',
    Send_email: 'Envoyer un email',
    Forgot_password: 'Mot de passe oublié',
    Waiting_reset: "Un email vous a été envoyé. S'il vous plaît regarder votre boîte de réception pour changer votre mot de passe",
    Waiting_confirm: "Un email vous a été envoyé. S'il vous plaît regarder votre boîte de réception et valider l'adresse courriel",
    Hello: 'Bonjour',
    Sign_in_email: "Cliquer sur le lien ci-bas pour se connecter à HedaCuisine",
    Username_not_unique: "Ce nom d'utilisateur est déjà utilisé",
    Email_not_unique: "Cette adresse courriel est déjà utilisée",
    Wrong_answer: 'Mauvaise réponse. Veuillez réessayer',
    Validate: 'Valider',
    Other_question: 'Autre question',
    Are_you_having_difficulty: 'Avez-vous de la difficulté',
    Please_select: 'Veuillez sélectionner',
    Please_try_again_later: 'Veuillez réessayer plus tard.',
    Invalid_captcha: 'Mauvais captcha',
    I_am_not_a_robot: 'Je ne suis pas un robot',
    What_to_eat: 'Quoi cuisiner',
    What_quantity: 'Quelle quantité',
    Difficulty: 'Difficulté',
    For_when: 'Pour quand',
    An_appetizer: 'Une entrée',
    A_meal: 'Un repas',
    A_dessert: 'Un dessert',
    Other: 'Autre',
    Small: 'Petite',
    Average: 'Moyenne',
    Big: 'Grosse',
    Simple: 'Simple',
    Normal: 'Normale',
    Gourmet: 'Gastronomique',
    Right_now: 'Tout de suite',
    Soon: 'Bientôt',
    Skip: 'Peu importe',
    Recipe_kind: 'Catégorie',
    Same_account_recipes: 'Recettes du même compte',
    There_are_no_recipe_in_this_category_yet: "Il n'y a aucune recette dans cette catégorie pour l'instant",
    Users_recipes: "Recettes d'utilisateurs",
    Users: "Utilisateurs",
    minutes: 'minutes',
    minute: 'minute',
    hours: 'heures',
    hour: 'heure',
    Maximum_limit_reached: "Nombre maximal atteint",
    Suggestions_for_you: 'Suggestions pour vous',
    Account_already_associated: 'Un compte est déjà associé avec cette adresse courriel.',
    Name_already_used: "Nom d'utilisateur déjà utilisé",
    Username_or_Email: "Nom d'utilisateur ou Email",
    Confirm_destroy_recipe: 'Voulez vous supprimez définitivement cette recette?',
    Add_to_list: "Ajouter à une liste",
    Add_to_my_list: "Ajouter à ma liste",
    Add_to_my_favorites: "Ajouter à mes favoris",
    Remove_from_my_favorites: "Retirer de mes favoris",
    Remove_from_my_list: "Retirer de ma liste",
    Contact_us: "Nous contacter",
    Contact_msg: "Pour toutes questions ou commentaires, vous pouvez me rejoindre à l'adresse courriel suivante:",
    Confirm_destroy_profile: "Voulez-vous supprimer définitivement ce profil?\n\nToutes vos données pourraient être perdues à tout jamais.",
    Back: "Retour",
    No_name: "Sans nom",
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
    n8: "Commencer une ligne avec «/» pour faire un paragraphe en italique.",
    n9: "Afficher l'ingrédient 3",
    n10: "Afficher les ingrédients 3, 4 et 5",
    n11: "Afficher les ingrédients 3 et 5",
    n12: "Tout le monde peut maintenant voir vos recettes à l'adresse suivante:",
    Keyboard_shortcuts: "Raccourcis clavier",
    Note_create_tag: "Note: Vous pouvez créer de nouveaux tags dans vos ",
    parameters: "paramètres",
    Author: "Auteur",
    Source: "Source",
    Choose_an_image: "Choisir une image",
    I_am_author: "Je suis l'auteur de cette image",
    Image_public_license: "L'image est sous une licence qui permet son usage",
    Image_format_not_supported: "Le format d'image n'est pas supporté. Les formats jpg, jpeg ou png sont valide, mais le format reçu était ",
    Username: "Nom d'utilisateur",
    Password: "Mot de passe",
    Who_cooking: "Qui cuisine?",
    Home: 'Acceuil',
    Contact: 'Contact',
    Home_1: "Découvrez de nouvelles recettes et personnalisez-les à votre goût. Partagez avec tout le monde si vous le voulez. Recevez des suggestions de recettes.",
    Home_2: "Des recettes personnalisées",
    Home_3: "Suggestions pour vous",
    Home_4: "Arrêtez de vous casser la tête pour savoir quoi cuisiner. Répondez à quelques petites questions pour avoir des suggestions selon vos besoins.",
    Home_8: "Desserts",
    Home_9: "Un éditeur de recette spécialisé",
    Home_10: "Créez des recettes rapidement à l'aide d'un éditeur de recette spécialisé. Explorez par vous-même ce qu'il peut faire ici-bas!",
    Home_11: "Des recettes par catégories",
    Home_12: "Les recettes sont classées par catégories pour pouvoir facilement les comparer. (Ex: Biscuits aux brisures de chocolats)",
    Home_13: "Trouvez la recette qui vous plaît le plus et utilisez la comme point de départ. Copiez et personnalisez!",
    Home_14: "HedaCuisine est un site assez récent. Le projet de base était de fabriquer un robot qui fait la cuisine, mais pour ce faire il faut des recettes. Alors j'ai fait un site de recettes!",
    Home_15: "2022: Début de création du site",
    Home_16: "2023: Sortie public du site???",
    Home_17: "Bilingue",
    Home_18: "Suggestions de recettes par questions",
    Home_19: "Suggestions d'images pour les nouvelles recettes",
    Home_20: "Classification automatique des nouvelles recettes par catégories",
    Home_21: "Suggestions de recettes par un texte: (ex: un déssert avec des fraises)",
    Home_22: "Un bouton pour partager sur les réseaux sociaux",
    Home_23: "Imprimer une recette",
    Home_24: "Commentaires",
    Home_25: "Évaluations",
    Home_26: "Un bouton pour qu'un utilisateur télécharge toutes ses recettes",
    Home_27: "Explorer les recettes par catégories",
    Home_28: "Ajouter un bouton dans l'éditeur de recette pour ajouter une liste d'ingrédient (équivalent à ex {1-3})",
    Home_29: "Une application pour que tu puisses regarder tes recettes quand tu n'as pas internet",
    About_HedaCuisine: "À propos de HedaCuisine",
    Timeline: "Ligne du temps",
    Help_login: 'Vous avez déjà un compte?',
    Help_signup: "Vous n'avez pas de compte?",
    Attribute_to_this_profile: "Attribuer à ce profil",
    Sorry_error: "Nous sommes vraiment désolé, mais une erreur s'est produite.",
    Login: 'Se connecter',
    beta: 'bêta',
    Favorites: 'Favoris',
    Recipes_by: 'Les recettes de',
    Recipes: 'Recettes',
    Search: 'Rechercher',
    Search_for_a_public_member: 'Rechercher un membre publique',
    Public_members: 'Membres publics',
    Make_public: 'Rendre public',
    Make_private: 'Rendre privé',
    private: 'privé',
    public: 'public',
    Visibility: 'Visibilité',
    Edit_profile: 'Modifier le profil',
    Edit_account: 'Modifier le compte',
    Name: 'Nom',
    Image: 'Image',
    Delete: 'Supprimer',
    Delete_recipe: 'Supprimer la recette',
    Ok: 'Ok',
    Language: 'Langage',
    Image_suggestions: "Suggestions d'images",
    My_profile: 'Mon profil',
    My_account: 'Mon compte',
    My_list: 'Ma liste',
    Logout: 'Déconnexion',
    New_profile: 'Nouveau profil',
    Switch_user: "Changer d'utilisateur",
    My_recipes: 'Mes recettes',
    New_recipe: 'Nouvelle recette',
    New_images: 'Nouvelles images',
    To_cook_soon: 'À cuisiner prochainement',
    To_cook: 'À cuisiner',
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
    recipe: 'recette',
    recipes: 'recettes',
    Create_new_recipe: 'Créer une nouvelle recette',
    Create_account: 'Créer un compte',
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
    of: 'de',
    by_2: 'de',
    Next_f: 'Suiv.',
    Previous_f: 'Préc.',
    Suggestions: 'Suggestions',
    Confirm_delete: 'Êtes-vous certain de vouloir supprimer cet item?',
    Error_destroying: 'Une erreur est survenue qui a empêché la suppression de cet item.',
    Error_fetching: 'Une erreur est survenue qui a empêché de montrer cet item.',
    Error_creating: 'Une erreur est survenue qui a empêché de créer cet item.',
    Error_updating: 'Une erreur est survenue qui a empêché la modification cet item.',
    No_personal_recipes_yet: "Aucune recette personnelle pour l'instant",
    My_public_recipes: "Mes recettes publiques",
    My_private_recipes: "Mes recettes privées",
    Copy_and_edit: "Copier et éditer",
    filtered: 'filtrées',
    Filter: 'Filtrer',
    Features: 'Fonctionnalités', 
    My_public_page: 'Ma page publique',
    Explore: 'Explore',
    My_page: 'Ma page',
    Invalid_email: 'Veuillez entrer une adresse courriel valide.',
    Invalid_password_length: 'Le mot de passe doit avoir au minimum 6 caractères.',
    Invalid_username_length: "Le nom d'utilisateur doit avoir au minimum 3 caractères.",
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
