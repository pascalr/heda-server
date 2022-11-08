/**
 * Each key is a table name.
 * The value is an object with the properties:
 *   - allow_create(user, obj) { return modifiedObjOrNullIfNotAllowed }
 *   - write_attrs: an array of all attributes that can be mass-assigned.
 *   - security_attrs???: an array of all attributes that must be set from the security object
 */
const schema = {
  'meals': {},
  'mixes': {},
  'translations': {
    write_attrs: ['from', 'original', 'to', 'translated'],
    security_key: 'ADMIN_ONLY',
    allow_create(user, obj) {
      if (!user.is_admin) {return null}
      return obj
    },
    allow_create_2: (user, obj) => user.is_admin,
  },
  'images': {
    write_attrs: ['filename', 'author', 'is_user_author', 'source'],
    attrs_types: {is_user_author: 'bool'},
    security_key: 'user_id',
    allow_create(user, obj) {
      obj.user_id = user.user_id
      return obj
    },
    security_attrs: ['user_id'],
    // When creating an object, set the security attribute based on the security object
    // When updating, fetch the object to make sure the security attribute is the same as the one given from the security object
  },
  'recipe_comments': {},
  'recipe_notes': {},
  'recipe_ratings': {},
  'recipe_tools' : {},
  'references' : {},
  'machine_users' : {},
  'machine_foods' : {},
  'machines' : {},
  'container_formats' : {},
  'container_quantities' : {},
  'containers' : {},
  'foods' : {},
  'units' : {},
  'recipe_kinds': {
    write_attrs: ['image_slug', 'name_fr', 'json_fr', 'name_en', 'json_en'],
    security_key: 'ADMIN_ONLY',
    allow_create(user, obj) {
      if (!user.is_admin) {return null}
      return obj
    },
  },
  'translated_recipes': {
    write_attrs: ['name', 'servings_name', 'ingredients', 'json'],
    security_key: 'original_id',
    allow_create(user, obj) {
      obj.original_id = user.original_id
      return obj
    },
  },
  'recipes': {
    write_attrs: ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'ingredients', 'recipe_kind_id', 'image_slug', 'servings_name'],
    security_key: 'user_id',
    dependant_destroy: {recipe_id: ['favorite_recipes', 'meals', 'mixes', 'recipe_comments', 'recipe_notes', 'recipe_ratings', 'recipe_tools', 'references', 'suggestions']},

    before_create(recipe) {
      //const recipeKinds = db.fetchTable('recipe_kinds', {}, ['name'])
      //const recipeKind = findRecipeKindForRecipeName(recipe.name, recipeKinds)
      //if (recipeKind) {recipe.recipe_kind_id = recipeKind.id}
      return recipe
    },
    allow_create(user, obj) {
      obj.user_id = user.user_id
      return obj
    },
    security_attrs: ['user_id'],
  },
  'users': {
    write_attrs: ['name', 'gender', 'image_slug', 'locale', 'is_public'],
    attrs_types: {is_public: 'bool'},
    security_key: 'account_id',
    allow_create(user, obj) {
      obj.account_id = user.account_id
      return obj
    },
  },
  'favorite_recipes': {
    write_attrs: ['list_id', 'recipe_id'],
    security_key: 'user_id',
    allow_create(user, obj) {
      obj.user_id = user.user_id
      return obj
    },
  },
  'tags': {
    write_attrs: ['name', 'image_slug', 'position'],
    security_key: 'user_id',
    allow_create(user, obj) {
      obj.user_id = user.user_id
      return obj
    },
  },
  'suggestions': {
    write_attrs: ['tag_id', 'recipe_id'],
    security_key: 'user_id',
    allow_create(user, obj) {
      obj.user_id = user.user_id
      return obj
    },
  }
}
export default schema
