/**
 * Each key is a table name.
 * The value is an object with the properties:
 *   - allow_create(user, obj) { return modifiedObjOrNullIfNotAllowed }
 *   - write_attrs: an array of all attributes that can be mass-assigned.
 *   - security_attrs???: an array of all attributes that must be set from the security object
 */
const schema = {
  'translations': {
    write_attrs: ['from', 'original', 'to', 'translated'],
    is_allowed: user => user.is_admin,
  },
  'images': {
    write_attrs: ['filename', 'author', 'is_user_author', 'source'],
    attrs_types: {is_user_author: 'bool'},
    security_attrs: ['user_id'],
    // When creating an object, set the security attribute based on the security object
    // When updating, fetch the object to make sure the security attribute is the same as the one given from the security object
  },
  'recipe_kinds': {
    write_attrs: ['image_slug', 'name_fr', 'json_fr', 'name_en', 'json_en', 'kind_id'],
    is_allowed: user => user.is_admin,
  },
  'translated_recipes': {
    write_attrs: ['name', 'servings_name', 'ingredients', 'json'],
    security_attrs: ['original_id'],
  },
  'recipes': {
    write_attrs: ['name', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'ingredients', 'recipe_kind_id', 'image_slug', 'servings_name'],
    security_key: 'user_id',
    dependant_destroy: {recipe_id: ['favorite_recipes', 'meals', 'mixes', 'recipe_comments', 'recipe_notes', 'recipe_ratings', 'recipe_tools', 'references', 'suggestions']},

    security_attrs: ['user_id'],
  },
  'users': {
    write_attrs: ['name', 'gender', 'image_slug', 'locale', 'is_public'],
    attrs_types: {is_public: 'bool'},
    security_attrs: ['account_id'],
  },
  'favorite_recipes': {
    write_attrs: ['list_id', 'recipe_id'],
    security_attrs: ['user_id'],
  },
  'tags': {
    write_attrs: ['name', 'image_slug', 'position'],
    security_attrs: ['user_id'],
  },
  'suggestions': {
    write_attrs: ['tag_id', 'recipe_id'],
    security_attrs: ['user_id'],
  },
  'meals': {
    is_allowed: user => user.is_admin,
  },
  'mixes': {
    is_allowed: user => user.is_admin,
  },
  'recipe_comments': {
    is_allowed: user => user.is_admin,
  },
  'recipe_notes': {
    is_allowed: user => user.is_admin,
  },
  'recipe_ratings': {
    is_allowed: user => user.is_admin,
  },
  'recipe_tools' : {
    is_allowed: user => user.is_admin,
  },
  'references' : {
    is_allowed: user => user.is_admin,
  },
  'machine_users' : {
    is_allowed: user => user.is_admin,
  },
  'machine_foods' : {
    is_allowed: user => user.is_admin,
  },
  'machines' : {
    is_allowed: user => user.is_admin,
  },
  'container_formats' : {
    is_allowed: user => user.is_admin,
  },
  'container_quantities' : {
    is_allowed: user => user.is_admin,
  },
  'containers' : {
    is_allowed: user => user.is_admin,
  },
  'foods' : {
    is_allowed: user => user.is_admin,
  },
  'units' : {
    is_allowed: user => user.is_admin,
  },
  'kinds' : {
    write_attrs: ['name_fr', 'name_en', 'kind_id'],
    is_allowed: user => user.is_admin,
  },
  'accounts' : {
    is_allowed: user => false,
  },
}
export default schema
