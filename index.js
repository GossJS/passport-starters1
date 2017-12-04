import express from 'express';
import morgan from 'morgan';
import path from 'path';
import request from 'request';
import url from 'url';
import bodyParser from 'body-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as FBStrategy } from 'passport-facebook';
import { ensureLoggedIn } from 'connect-ensure-login';

import User from './bd/publicUsers';

const PORT = 4321;

const ensureAuth = (req, res, done) => {
  if (!req.isAuthenticated()) return res.redirect('/login');
  // console.log(req.user);
  // here we have  { _id: 599e171c2858b303814cac71,  username: 'teacher',  password: 'qq' }
  return done();
};


const app = express();
app
  .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(morgan('combined'))
  .use((req, res, next) => next())
;

passport.use(new FBStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://ikoder.xyz/auth/fb/done',
},
(accessToken, refreshToken, profile, done) => done(null, profile)
));

/*
// В продакшн,  Facebook-аккаунт должен быть
// ассоциирован с записью о пользователе в БД приложения, что
// обеспечивает связывание аккаунтов и аутентификацию при помощи
// других провайдеров идентичности
(accessToken, refreshToken, profile, done) =>
  User.findOrCreate({ facebookId: profile.id },  (err, user) => done(err, user));

*/


passport.use(new LocalStrategy({
  usernameField: 'login',
  passwordField: 'pass',
},
(username, password, done) => {
// нечто, что возвращает нужный вид done
// это может быть любой мок-код, например, ищущий имя в JSON-файле и т.п.

  User.findOne({ username }, (err, user) => {
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

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((_id, done) => User.findById(_id, (err, user) => done(err, user)));

app
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true }))
  .use(passport.initialize())
  .use(passport.session());


app
  .get('/', r => r.res.send(`
          <h1>Welcome to Passport!</h1>
          <div>
            <a href="/localprivate">Private section</a> - protected by local /login <br>
            <a href="/fbprivate">Private section</a> - protected by FB /auth <br>
          </div>
        `)
  )

  .get('/localprivate', ensureAuth, r => r.res.send('<a href="/logout">Log out</a>'))
// этот маршрут защищён локально
// после первого успешного входа уже не потребуется авторизоваться заново

  .get('/fbprivate', ensureLoggedIn(), r => r.res.send(`
          <h1>Welcome to Profile!</h1>
          <div>
           ID: ${r.user.id} <br>
           Display name: ${r.user.displayName} <br>
           <a href="/logout">Log out</a>
          </div>
          `)
  )
// этот маршрут защищён фейсбуком
// после первого успешного входа уже не потребуется авторизоваться заново

  .get('/auth/fb',
    passport.authenticate('facebook'))
// фактически это значит показать форму, по аналогии с /login

  .get('/auth/fb/done',
    passport.authenticate('facebook', { failureRedirect: '/auth/fb' }),
    (req, res) => res.redirect('/fbprivate')) // Successful authentication, redirect home.

  .get('/user/:username/:password', (req, res) => {
    // просто проверить, работает ли подключение к БД
    const { username, password } = req.params;
    User.findOne({ username }, (err, user) => {
      if (err) { throw new Error(err); }
      if (!user) {
        return res.json({ message: 'Incorrect username.' });
      }
      if (user.password !== password) {
        return res.json({ message: 'Incorrect password.' });
      }
      return res.json(user);
    });
  })


  .get('/login', (req, res) => request(url.format({ protocol: 'https', host: 'kodaktor.ru', pathname: '/g/session_post' })).pipe(res))

  .post('/login/check', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/fail' })
  )

  .get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  })


  .use((req, res) => res.send('404'))
  .use((err, req, res, next) => res.send(`500 ${err}`))
  .set('port', process.env.port || PORT)
  .listen(app.get('port'),
    () => console.log(`­­> Port ${app.get('port')} listening!!!`));
