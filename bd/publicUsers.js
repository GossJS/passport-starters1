/*jshint esversion: 6 */
import m from 'mongoose';

const UserSchema = new m.Schema({
    "username": {
      "type": "String"
    },
    "password": {
      "type": "String"
    }},
    {"collection": "userlist"}
),
  User = m.model(null, UserSchema);
m.Promise = global.Promise;
m.connect('mongodb://userreader:Qwerty.123@kodaktor.ru/users', {}, err => {
  if (err) throw err;
});

export default User;
