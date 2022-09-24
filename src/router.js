var express = require('express');
var crypto = require('crypto');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;

var db = require('./db');
var passport = require('./passport');
var utils = require('./utils');

var ensureLoggedIn = ensureLogIn();
var router = express.Router();

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.get('/choose_user', fetchUsers, function(req, res, next) {
  res.render('choose_user');
});

router.post('/choose_user', function(req, res, next) {
  req.user.user_id = req.body.user_id
  res.redirect('/');
});

router.post('/change_user', function(req, res, next) {
  req.user.user_id = req.body.user_id
  res.redirect('/');
});

router.post('/login/password', passport.authenticate('local', {
  successReturnToOrRedirect: '/choose_user',
  failureRedirect: '/login',
  failureMessage: true
}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

/* POST /signup
 *
 * This route creates a new user account.
 *
 * A desired username and password are submitted to this route via an HTML form,
 * which was rendered by the `GET /signup` route.  The password is hashed and
 * then a new user record is inserted into the database.  If the record is
 * successfully created, the user is logged in.
 */
router.post('/signup', function(req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    db.run('INSERT INTO accounts (email, encrypted_password, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
      req.body.email, hashedPassword, salt, utils.now(), utils.now() 
    ], function(err) {
      if (err) { return next(err); }
      var user = {
        account_id: this.lastID,
        email: req.body.email
      };
      req.login(user, function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    });
  });
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.get('/forgot', function (req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); /* user is alreay logged in */ }
  res.render('forgot');
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.post('/forgot', function (req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); /* user is alreay logged in */ }
  users.forgot(req, res, function (err) {
    if (err) {
      req.flash('error', err);
    }
    else {
      req.flash('success', 'Please check your email for further instructions.');
    }
    res.redirect('/');
  });
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.get('/reset/:token', function (req, res, next) {
  if (req.isAuthenticated()) { return res.redirect('/'); /* user is alreay logged in */ }

  var token = req.params.token;
  res.locals.token = token;
  //users.checkReset(token, req, res, function (err, data) {
  //  if (err)
  //    req.flash('error', err);

  //  //show the UI with new password entry
  //  res.render('reset');
  //});
  res.render('reset');
});

// https://stackoverflow.com/questions/20277020/how-to-reset-change-password-in-node-js-with-passport-js
router.post('/reset', function (req, res, next) {
  if (req.isAuthenticated() || !req.body.token) { return res.redirect('/'); /* user is alreay logged in */ }
  
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
    if (err) { return next(err); }
    db.run('UPDATE accounts SET encrypted_password = ?, salt = ?, updated_at = ? WHERE reset_password_token = ?', [
        hashedPassword, salt, utils.now(), req.body.token
      ], function(err) {
        if (err) { return next(err); }
        var user = {
          id: this.lastID,
          username: req.body.username
        };
        req.login(user, function(err) {
          if (err) { return next(err); }
          res.redirect('/');
        });
      }
    );
  });
});

//class AppController < ApplicationController
//  def index
//    gon.current_user_admin = current_user_admin?
//    gon.containers = current_user.containers.map {|c| c.to_obj}
//    gon.machine_foods = current_user.machine_foods.includes(:food).sort_by(&:name).map {|f| f.to_obj}
//    gon.container_quantities = current_user.container_quantities.includes(:container_format).map {|c| c.to_obj}
//    gon.ingredient_sections = IngredientSection.where(recipe_id: gon.recipes.map{|e|e[:id]}).map {|e| e.to_obj}
//    gon.images = Image.where(id: gon.recipes.map{|e|e[:image_id]}+gon.recipe_kinds.map{|e|e[:image_id]}).map {|e| e.to_obj }
//    gon.contractionList = FrenchExpression.where(contract_preposition: true).map(&:singular)
//  end
//end

function mapClassName(objs, tableName) {
  // TODO: Handle exceptions like mixes
  let className = tableName.substr(0, tableName.length-1)
  return objs.map(o => {o.class_name = className; return o;})
}

function fetchTable(tableName, conditions, attributes, next, callback) {
  let s = 'SELECT '+['id',...attributes].join(', ')+' FROM '+tableName
  let a = []
  let l = Object.keys(conditions).length
  if (l != 0) {s += ' WHERE '}
  Object.keys(conditions).forEach((cond,i) => {
    if (i < l-1) {s += ' AND '}
    let val = conditions[cond]
    if (val == null) {
      s += cond + ' IS NULL'
    } else if (Array.isArray(val) && val.length > 1) {
      s += cond + ' IN ('
      val.forEach((v,i) => {
        s += '?' + ((i < val.length - 1) ? ', ' : '')
        a.push(v)
      })
      s += ')'
    } else {
      s += cond + ' = ?'
      a.push(val)
    }
  })
  console.log('statement:', s)
  console.log('values', a)
  db.all(s, a, function(err, rows) {
    if (err) { return next(err); }
    callback(mapClassName(rows, tableName))
    next();
  })
}


function fetchUsers(req, res, next) {
  fetchTable('users', {account_id: req.user.account_id}, ['name'], next, (records) => {
    res.locals.users = records
  })
}


const RECIPE_ATTRS = ['name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'image_id']
function fetchRecipes(req, res, next) {
  fetchTable('recipes', {user_id: req.user.user_id}, RECIPE_ATTRS, next, (records) => {
    res.locals.gon.recipes = utils.sortBy(records, 'name')
  })
}

function fetchRecipeIngredients(req, res, next) {
  let attrs = ['item_nb', 'raw', 'comment_json', 'food_id', 'raw_food', 'recipe_id']
  let ids = res.locals.gon.recipes.map(r=>r.id)
  fetchTable('recipe_ingredients', {recipe_id: ids}, attrs, next, (records) => {
    res.locals.gon.recipe_ingredients = utils.sortBy(records, 'item_nb').map(r => {
      r.name = r.raw_food||''; return r;
    })
  })
}

function fetchRecipeKinds(req, res, next) {
  fetchTable('recipe_kinds', {}, ['name', 'description_json'], next, (records) => {
    res.locals.gon.recipe_kinds = utils.sortBy(records, 'name')
  })
}

function fetchMixes(req, res, next) {
  let attrs = ['name', 'instructions', 'recipe_id', 'original_recipe_id']
  fetchTable('mixes', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.mixes = utils.sortBy(records, 'name')
  })
}

function fetchUserTags(req, res, next) {
  let attrs = ['tag_id', 'position']
  fetchTable('user_tags', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.user_tags = utils.sortBy(records, 'position')
  })
}

function fetchMachines(req, res, next) {
  // FIXME: Condition based on MachineUser model...
  fetchTable('machines', {}, ['name'], next, (records) => {
    res.locals.gon.machines = records
  })
}

function fetchFavoriteRecipes(req, res, next) {

  // , 'image_used_id'
  fetchTable('favorite_recipes', {}, ['list_id', 'recipe_id'], next, (records) => {
    res.locals.gon.favorite_recipes = utils.sortBy(records, 'name')
  })
}
 
function fetchFavoriteRecipesRecipe(res, res, next) {
  let recipe_ids = res.locals.gon.favorite_recipes.map(r=>r.recipe_id)
  fetchTable('recipes', {id: recipe_ids}, RECIPE_ATTRS, next, (records) => {
    res.locals.gon.recipes = utils.removeDuplicateIds(res.locals.gon.recipes.concat(utils.sortBy(records, 'name')))
  })
}

//function fetchFavoriteRecipesNames(req, res, next) {
//  let ids = res.locals.gon.favorite_recipes.map(r=>r.recipe_id)
//  fetchTable('recipes', {id: ids}, ['name'], next, (recipes) => {
//    res.locals.gon.favorite_recipes = res.locals.gon.favorite_recipes.map(f => {
//      let r = recipes.find(r => r.id == f.recipe_id)
//      if (r) {
//        f.name = r.name
//      } else {
//        console.log('WARNING: Missing recipe for favorite recipe')
//      }
//      return f
//    })
//  })
//}

//    gon.favorite_recipes = current_user.favorite_recipes.includes(:recipe).sort_by {|fav| fav.recipe.name}.map{|fav| fav.to_obj}

function fetchSuggestions(req, res, next) {
  let attrs = ['user_id', 'recipe_id', 'filter_id', 'score']
  fetchTable('suggestions', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.suggestions = records
  })
}

function fetchUserRecipeFilters(req, res, next) {
  let attrs = ['name', 'image_src', 'user_id']
  fetchTable('recipe_filters', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.gon.recipe_filters = utils.removeDuplicateIds([...(res.locals.gon.recipe_filters||[]), ...records])
  })
}

function fetchPublicRecipeFilters(req, res, next) {
  let attrs = ['name', 'image_src', 'user_id']
  fetchTable('recipe_filters', {user_id: null}, attrs, next, (records) => {
    res.locals.gon.recipe_filters = utils.removeDuplicateIds([...(res.locals.gon.recipe_filters||[]), ...records])
  })
}

function fetchFoods(req, res, next) {
  fetchTable('foods', {}, ['name'], next, (records) => {
    res.locals.gon.foods = utils.sortBy(records, 'name')
  })
}

function fetchUnits(req, res, next) {
  let attrs = ['name', 'value', 'is_weight', 'is_volume', 'show_fraction']
  fetchTable('units', {}, attrs, next, (records) => {
    res.locals.gon.units = records
  })
}

function fetchNotes(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.id)
  fetchTable('recipe_notes', {recipe_id: ids}, ['item_nb'], next, (records) => {
    res.locals.gon.notes = records
  })
}

function fetchIngredientSections(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.id)
  let attrs = ['before_ing_nb', 'name', 'recipe_id']
  fetchTable('ingredient_sections', {recipe_id: ids}, attrs, next, (records) => {
    res.locals.gon.ingredient_sections = records
  })
}

function fetchImages(req, res, next) {
  let ids = res.locals.gon.recipes.map(r=>r.image_id).filter(x=>x)
  ids = [...ids, ...res.locals.gon.recipe_kinds.map(r=>r.image_id).filter(x=>x)]
  let attrs = ['author', 'source', 'filename', 'is_user_author']
  fetchTable('images', {id: ids}, attrs, next, (records) => {
    res.locals.gon.notes = records
  })
}

function initGon(req, res, next) {
  res.locals.gon = {}; next()
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
  // FIXME: Split this list in two. In the second list, put the methods that must be ran after the first list, like fetchFavoriteRecipesRecipe
  // this way is it less error prone than simply respecting the order
}, initGon, fetchUsers, fetchRecipes, fetchRecipeIngredients, fetchRecipeKinds, fetchMixes, fetchUserTags, fetchMachines, fetchFavoriteRecipes, fetchSuggestions, fetchUserRecipeFilters, fetchPublicRecipeFilters, fetchFavoriteRecipesRecipe, fetchFoods, fetchUnits, fetchNotes, fetchIngredientSections, fetchImages, function(req, res, next) {
  let user = res.locals.users.find(u => u.id == req.user.user_id)

  res.render('index', { user, account: req.user });
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

module.exports = router;
