import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
var tt = process.env.TOKEN

// var GitHub = require('github-api');
import GitHub from 'github-api';

// basic auth
var gh = new GitHub({
   // username: 'FOO',
   // password: 'NotFoo'
   // /* also acceptable:
      token: tt
});

var me = gh.getUser(); // no user specified defaults to the user for whom credentials were provided
me.listNotifications(function(err, notifications) {
    console.log("ERROR", err)
   // do some stuff
});

var u1 = gh.getUser('brentreeves');
u1.listStarredRepos(function(err, repos) {
    console.log(repos)
   // look at all the starred repos!
});
