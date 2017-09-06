const fs = require('fs'),
    path = require('path'),
    express = require('express'),
    mustacheExpress = require('mustache-express'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    session = require('express-session'),
    bodyParser = require('body-parser'),
    flash = require('express-flash-messages'),
    mongoose = require('mongoose'),
    expressValidator = require('express-validator'),
    logins = require("./routers/logins"), //gets to logins file
    Snippet = require("./models/snippet");
    router = require("./routers/routes");
    User = logins.User;

const app = express();
const DUPLICATE_RECORD_ERROR = 11000;

const mongoURL = 'mongodb://localhost:27017/snippets';
mongoose.connect(mongoURL, {useMongoClient: true});
mongoose.Promise = require('bluebird');

app.use(bodyParser.urlencoded({ extended: true }));

app.engine('mustache', mustacheExpress());
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'mustache')
app.set('layout', 'layout')
app.use('/static', express.static('static'));
// app.use('/:id', logins);//need to check this fxn name and location



 passport.use(new LocalStrategy(
     function(username, password, done) {
         User.authenticate(username, password, function(err, user) {
             if (err) {
                 return done(err)
             }
             if (user) {
                 return done(null, user)
             } else {
                 return done(null, false, {
                     message: "There is no user with that username and password."
                 })
             }
         })
     }));

 passport.serializeUser(function(user, done) {
     done(null, user.id);
 });

 passport.deserializeUser(function(id, done) {
     User.findById(id, function(err, user) {
         done(err, user);
     });
 });

 app.use(bodyParser.urlencoded({
     extended: false
 }));
 app.use(expressValidator());


 app.use(session({
     secret: 'keyboard cat',
     resave: false,
     saveUninitialized: false,
     store: new(require('express-sessions'))({
         storage: 'mongodb',
         instance: mongoose, // optional
         host: 'localhost', // optional
         port: 27017, // optional
         db: 'test', // optional
         collection: 'sessions', // optional
         expire: 86400 // optional
     })
 }));

 app.use(passport.initialize());
 app.use(passport.session());
 app.use(flash());

 app.use(function (req, res, next) {
   res.locals.user = req.user;
   next();
 })

 app.get('/', function(req, res) {
     res.render("login");
 })

 app.get('/login/', function(req, res) {
     res.render("login", {
         messages: res.locals.getMessages()
     });
 });

 app.post('/login/', passport.authenticate('local', {
     successRedirect: '/index',
     failureRedirect: '/login/',
     failureFlash: true
 }))

 app.get('/register/', function(req, res) {
     res.render('register');
 });

 app.post('/register/', function(req, res) {
     req.checkBody('username', 'Username must be alphanumeric').isAlphanumeric();
     req.checkBody('username', 'Username is required').notEmpty();
     req.checkBody('password', 'Password is required').notEmpty();

     req.getValidationResult()
         .then(function(result) {
             if (!result.isEmpty()) {
                 return res.render("register", {
                     username: req.body.username,
                     errors: result.mapped()
                 });
             }
             const user = new User({
                 username: req.body.username,
                 password: req.body.password
             })

             const error = user.validateSync();
             if (error) {
                 return res.render("register", {
                     errors: normalizeMongooseErrors(error.errors)
                 })
             }

             user.save(function(err) {
                 if (err) {
                     return res.render("register", {
                         messages: {
                             error: ["That username is already taken."]
                         }
                     })
                 }
                 return res.redirect('/');
             })
         })
 });

 function normalizeMongooseErrors(errors) {
     Object.keys(errors).forEach(function(key) {
         errors[key].message = errors[key].msg;
         errors[key].param = errors[key].path;
     });
 }

 app.get('/logout/', function(req, res) {
     req.logout();
     res.redirect('/');
 });

 const requireLogin = function (req, res, next) {
   if (req.user) {
     next()
   } else {
     res.redirect('/login/');
   }
 }

 app.get('/create/', requireLogin, function (req, res) {

   res.render("create");
 })

app.post('/create/', function(req, res){
  Snippet.create(req.body).then(function(){
      res.redirect('/index');
  })
  // .catch(function(error) {
  //     let errorMsg;
  //     if (error.code === DUPLICATE_RECORD_ERROR) {
  //         // make message about duplicate
  //         errorMsg = `The snippet title "${req.body.title}" has already been used.`
  //     } else {
  //       console.log(error.code);
  //         errorMsg = "You have encountered an unknown error."
  //     }
  //     res.render('create', {errorMsg: errorMsg});
  // })
 })

app.get('/index', requireLogin, function(req, res){
  Snippet.find().then(function(snippets){
    let values = [];
    res.render('index', {snippets, values});
  })
})

app.post('/searchKey', function(req, res){
  // Snippet.find().then(function(snippets){
   let key = req.body;
   console.log(key);
   console.log(key.searchBy[0]);
   Snippet.distinct(key.searchBy[0], function(error, values){
     if(error){
      //  console.log(error);
     }else{
       console.log(values);
    // let values = snippets.distinct(key);
       res.render('index', {values})
     }
  });
 })

app.post('/searchValue', function(req, res){
    let key = req.body.value;
    Snippet.distinct(key).then(function(values){
      res.render('index', {snippets, values})
    })
})

app.get('/snippet/:id', function(req, res){
   Snippet.findOne({_id: req.params.id}).then(function(snippets){
     res.render('snippet', {snippets});
   })
})

 app.listen(3000, function() {
     console.log('Express running on http://localhost:3000/.')
 });