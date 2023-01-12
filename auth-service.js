var mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const e = require("express");
var Schema = mongoose.Schema;
var userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]

});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection("mongodb+srv://dbUser:Fol%40kunm1@senecaweb.5k7qips.mongodb.net/WEB322Assignment6");

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) {
        if(userData.password !== userData.password2){
            reject("Passwords do not match");
        }
        bcrypt.hash(userData.password, 10).then(hash=>{ // Hash the password using a Salt that was generated using 10 rounds
            userData.password = hash;
            let newUser = new User(userData);
            newUser.save()
            .then(()=>{
                resolve();
            })
            .catch((err)=>{
                if(err.code == 11000){
                    reject("User Name already taken");
                }else{
                    reject("There was an error creating the user:" +err);
                }
            });
        })
        .catch(err=>{
            reject("There was an error encrypting the password"); // Show any errors that occurred during the process
        });
    });
};

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({userName : userData.userName})
        .exec().then((users)=>{
            console.log(users[0].userName);
            console.log(users.length == 0);
            if(users.length==0){
                reject("Unable to find user: "+userData.userName);
            }

            bcrypt.compare(userData.password, users[0].password).then((result) => {
                // result === true if it matches and result === false if it does not match
                if(!result){reject("Incorrect Password for user: " + userData.userName)}
                else{
                    users[0].loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent});
                    User.update(
                        {userName: users[0].userName},{$set : {loginHistory : users[0].loginHistory}}
                    )
                    .then(()=>{resolve(users[0])
                    }).catch((error)=>{
                        reject("There was an error verifying the user: "+ error);
                    })
                }
             });
        }).catch((error)=>{
            reject("Unable to find user: " + userData.userName);
        })
    });
};