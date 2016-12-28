var passport = require('passport'),
  Strategy = require('passport-http').BasicStrategy;

var passportStrategy = function(){
  var records = [
      { id: 1, username: 'admin', password: 'asdf', displayName: 'admin', role: [{value: 'admin'}], emails: [ { value: 'bradfordnoble@gmail.com' } ] }
    , { id: 2, username: 'chair', password: 'asdf', displayName: 'chair', role: [{value: 'chair'}], emails: [ { value: 'bradfordnoble@gmail.com' } ] }
    , { id: 3, username: 'member', password: 'asdf', displayName: 'member', role: [{value: 'member'}], emails: [ { value: 'bradfordnoble@gmail.com' } ] }
  ];

  return new Strategy(
    function(username, password, cb) {
      for (var i = 0, len = records.length; i < len; i++) {
        var record = records[i];
        if (record.username === username && record.password === password) {
          return cb(null, record);
        }
      }      
      return cb(null, false);
    });
}

module.exports = {
  passportStrategy: passportStrategy,
	auth: passport.authenticate('basic', { session: false })
};
