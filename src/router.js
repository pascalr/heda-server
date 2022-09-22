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
//    gon.favorite_recipes = current_user.favorite_recipes.includes(:recipe).sort_by {|fav| fav.recipe.name}.map{|fav| fav.to_obj}
//    gon.machines = current_user.machines.map {|m| m.to_obj}
//    gon.containers = current_user.containers.map {|c| c.to_obj}
//    gon.machine_foods = current_user.machine_foods.includes(:food).sort_by(&:name).map {|f| f.to_obj}
//    gon.container_quantities = current_user.container_quantities.includes(:container_format).map {|c| c.to_obj}
//    gon.ingredient_sections = IngredientSection.where(recipe_id: gon.recipes.map{|e|e[:id]}).map {|e| e.to_obj}
//    gon.images = Image.where(id: gon.recipes.map{|e|e[:image_id]}+gon.recipe_kinds.map{|e|e[:image_id]}).map {|e| e.to_obj }
//    #TODO: Tools
//    #TODO: Ingredient
//    gon.notes = RecipeNote.where(recipe_id: gon.recipes.map{|r|r[:id]}).map {|e| e.to_obj}
//    gon.foods = Food.order(:name).all.map {|food| food.to_obj}
//    gon.units = Unit.all.map {|unit| unit.to_obj}
//    gon.contractionList = FrenchExpression.where(contract_preposition: true).map(&:singular)
//    #gon.user_recipes = current_user.recipes.order(:name).map {|r| r.to_obj(only: :name)}
//    #gon.favorite_recipes = current_user.favorite_recipes.includes(:recipe).sort_by {|fav| fav.recipe.name}.map {|fav| o = fav.recipe.to_obj(only: :name); o[:fav_id] = fav.id; o}
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
    if (conditions[cond] == null) {
      s += cond + ' IS NULL'
    } else {
      s += cond + ' = ?'
      a.push(conditions[cond])
    }
  })
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

function fetchRecipes(req, res, next) {
  let attrs = ['name', 'recipe_kind_id', 'main_ingredient_id', 'preparation_time', 'cooking_time', 'total_time', 'json', 'use_personalised_image', 'image_id']
  fetchTable('recipes', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.recipes = utils.sortBy(records, 'name')
  })
}

function fetchRecipeIngredients(req, res, next) {
  let attrs = ['item_nb', 'raw', 'comment_json', 'food_id', 'raw_food', 'recipe_id']
  let ids = res.locals.recipes.map(r=>r.id)
  fetchTable('recipe_ingredients', {recipe_id: ids}, attrs, next, (records) => {
    res.locals.recipe_ingredients = utils.sortBy(records, 'item_nb')
  })
}

function fetchRecipeKinds(req, res, next) {
  fetchTable('recipe_kinds', {}, ['name', 'description_json'], next, (records) => {
    res.locals.recipe_kinds = utils.sortBy(records, 'name')
  })
}

function fetchMixes(req, res, next) {
  let attrs = ['name', 'instructions', 'recipe_id', 'original_recipe_id']
  fetchTable('mixes', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.mixes = utils.sortBy(records, 'name')
  })
}

function fetchUserTags(req, res, next) {
  let attrs = ['tag_id', 'position']
  fetchTable('user_tags', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.user_tags = utils.sortBy(records, 'position')
  })
}

function fetchMachines(req, res, next) {
  // FIXME: Condition based on MachineUser model...
  fetchTable('machines', {}, ['name'], next, (records) => {
    res.locals.machines = records
  })
}

function fetchFavoriteRecipes(req, res, next) {
  // , 'image_used_id'
  fetchTable('favorite_recipes', {}, ['list_id', 'recipe_id'], next, (records) => {
    res.locals.favorite_recipes = utils.sortBy(records, 'name')
  })
}

function fetchFavoriteRecipesNames(req, res, next) {
  let ids = res.locals.favorite_recipes.map(r=>r.recipe_id)
  fetchTable('recipes', {id: ids}, ['name'], next, (recipes) => {
    res.locals.favorite_recipes = res.locals.favorite_recipes.map(f => {
      let r = recipes.find(r => r.id == f.recipe_id)
      if (r) {
        f.name = r.name
      } else {
        console.log('WARNING: Missing recipe for favorite recipe')
      }
      return f
    })
  })
}

//    gon.favorite_recipes = current_user.favorite_recipes.includes(:recipe).sort_by {|fav| fav.recipe.name}.map{|fav| fav.to_obj}

function fetchSuggestions(req, res, next) {
  let attrs = ['user_id', 'recipe_id', 'filter_id', 'score']
  fetchTable('suggestions', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.suggestions = records
  })
}

function fetchUserRecipeFilters(req, res, next) {
  let attrs = ['name', 'image_src', 'user_id']
  fetchTable('recipe_filters', {user_id: req.user.user_id}, attrs, next, (records) => {
    res.locals.user_recipe_filters = records
  })
}

function fetchPublicRecipeFilters(req, res, next) {
  let attrs = ['name', 'image_src', 'user_id']
  fetchTable('recipe_filters', {user_id: null}, attrs, next, (records) => {
    res.locals.public_recipe_filters = records
  })
}

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, fetchUsers, fetchRecipes, fetchRecipeIngredients, fetchRecipeKinds, fetchMixes, fetchUserTags, fetchMachines, fetchFavoriteRecipes, fetchSuggestions, fetchUserRecipeFilters, fetchPublicRecipeFilters, fetchFavoriteRecipesNames, function(req, res, next) {
  let user = res.locals.users.find(u => u.id == req.user.user_id)

  //console.log('recipes', res.locals.recipes)
  //// Set the recipe name for the favorite recipes
  //res.locals.favorite_recipes.forEach(o => {
  //  console.log('id', o.recipe_id)
  //  let r = res.locals.recipes.find(r => r.id == o.recipe_id)
  //  if (r) {
  //    o.name = r.name
  //  } else {
  //    console.log('WARNING: Missing recipe for favorite recipe')
  //  }
  //})

  res.render('index', { user, account: req.user });
});

function handleError(err, req, res, next) {
  if (err) { return next(err); }
  return res.redirect('/' + (req.body.filter || ''));
}

module.exports = router;
