/*jshint esversion: 6 */
const PORT = 4321;
import express from 'express';
import path from 'path';
import request from 'request';
import url from 'url';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';

import User from './bd/publicUsers';

class Toy {
	type="SOFT";
	get getType(){
		return this.type;
	}
}

const chebu = new Toy();


const ensureAuth = (req, res, done)=>{
	if (!req.isAuthenticated()) {
		res.redirect('/login');
	} else {
	    //console.log(req.user); here we have like { _id: 599e171c2858b303814cac71,  username: 'teacher',  password: 'qq' }
		return done();
	}
};



	  
const app = express();
app
  .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({
      extended: true
  }))
      
  .use((req, res, next) => next())

  ;

passport.use(new LocalStrategy(
  {
      usernameField: 'login',
      passwordField: 'pass'
  },
  (username, password, done)=>{ 
	//нечто, что возвращает нужный вид done  
	//это может быть любой мок-код, например, ищущий имя в JSON-файле и т.п.  
	
    User.findOne({ username },  (err, user)=>{
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
	
	
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(_id, done) {
  User.findById(_id, function(err, user) {
    done(err, user);
  });
});

app
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true }  ))
  .use(passport.initialize())
  .use(passport.session());


app  
  .get('/', (req, res) => {
    res
      .send('<h1>Welcome to Express!</h1><a href="/private">Private section</a>');
  })

  
  .get('/private', ensureAuth,  (req, res) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'elias': 'goss'
      })
      .json({
        'gossApi': 'protected!'
      });
  })

  .get('/lalala', (r,res)=>res.send(chebu.getType))

  .get('/bla', (r, res) => res.set({'refresh':'5', 'elias': 'go'}).sendFile(path.resolve(__dirname, 'public/1.txt')))

  .get('/user/:username/:password',(req, res) => {
       
  			 const {username, password} = req.params;
             User.findOne({ username },  (err, user)=>{
               if (err) { throw new Error(err); }
               if (!user) {
                 return res.json( { message: 'Incorrect username.' });
               }
               if (user.password !== password) {
                 return res.json( { message: 'Incorrect password.' });
               }
               return res.json( user);
             });
  
  
  })

  
  
  .get('/login', (req, res) =>  request(url.format({protocol:'https',host:'kodaktor.ru',pathname: '/g/session_post'})).pipe(res))

  .post('/login/check',
      passport.authenticate('local', { successRedirect: '/',
                                       failureRedirect: '/fail',
                                     })
  )

  .get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
  })

   
  .get('/fail', () => {
    throw new Error('Fail!');
  })
  .get('/my', (req, res) => res.send('MY'))
  .use((req, res) => res.send('404'))
  .use((err, req, res, next) => res.send(`500 ${err}`))
  .set('port', process.env.port || PORT)
  .listen(app.get('port'),
    () => console.log(`­­> Port ${ app.get('port') } listening!!!`));
