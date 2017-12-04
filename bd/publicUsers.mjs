/*jshint esversion: 6 */
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    "username": {
      "type": "String"
    },
    "password": {
      "type": "String"
    }},
    {"collection": "userlist"}
),
  User = mongoose.model(null, UserSchema);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://userreader:Qwerty.123@kodaktor.ru/users', {}, err => {
  if (err) throw err;
});

export default User;
