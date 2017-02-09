var cfenv = require("cfenv"),
  appEnv = cfenv.getAppEnv(),
  express = require('express'),
  bodyParser = require('body-parser'),
  jsonParser = bodyParser.json(),
  json2csv = require('json2csv'),
  opts = appEnv.services.cloudantNoSQLDB[0].credentials
  // opts = { url: 'http://bradnoble:cl0udant@127.0.0.1:5984' }
  ;

// Initialize the library with my account
//var cloudant = Cloudant(account:'bradnoble', password:'cl0udant', url:'http://127.0.0.1:5984');// if you don't specify URL, assumes cloudant.com'
var cloudant = require('cloudant')(opts);
var db = cloudant.db.use("msc");

// Create a new Express application.
var app = express();
var http = require('http').Server(app);

http.listen(appEnv.port, "0.0.0.0", function() {
  console.log("server starting on " + appEnv.url);     // print a message when the server starts listening
});

// auth
var passport = require('passport'),
  Strategy = require('passport-http').BasicStrategy,
  users = require('./lib/auth.js');

passport.use(users.passportStrategy());

app.use(express.static(__dirname + '/public'));

app.get('/getHouseholdsAndPeople', 
  users.auth,
  function(req, res){
    //db.view(designname, viewname, [params], [callback])
    db.view('app', 'householdsAndPeople', {'include_docs': true}, function(err, resp){
      if (!err) {
        var mapped = function(data){
          return data.rows.map(function(row) {
            return row.doc; // this is the entire payload
          });
        };
        // add people to the household
        var docs = mapped(resp);
        var households = [];
        var people = {};
        for (i = 0; i < docs.length; i++) { 
          if(docs[i].type == 'person'){
            // build an object that holds objects that hold arrays of people
            if(!people[docs[i].household_id]){
              people[docs[i].household_id] = [];
            }
            people[docs[i].household_id].push(docs[i]);
          } else if (docs[i].type == 'household') {
            households[i] = docs[i];
          }
          // console.log(people);
        }
        for (i = 0; i < households.length; i++) { 
          var household_id = households[i]._id;
          households[i].people = [];
          households[i].people = people[household_id];
        }
        // console.log(docs[1]);
        res.send(households);
      }
    });
  }
);

app.get('/getPeopleForCSV', 
  function(req, res){

      db.view('app', 'householdsAndPeople', {'include_docs': true}, function(err, resp){
        if(!err){

          var households = {};
          var people = [];
          var rows = [];
          var z = 0;
          var people_fields = [];
          var household_fields = [];
          var whitelist = ['_id', '_rev', 'type'];



          var mapped = function(data){
            return data.rows.map(function(row) {
              if(row.doc.type == 'household'){
                households[row.doc._id] = row.doc;
/*
                if(household_fields.length == 0 && row.doc.street1){
                  household_fields = Object.keys(row.doc);
                  console.log(household_fields);
                }
*/
              }
              if(row.doc.type == 'person'){
                people[z] = row.doc;
                if(people_fields.length == 0 && row.doc.household_id){
                  people_fields = Object.keys(row.doc);
                  // console.log(people_fields);
                }
                z++;              
              }
              return row.doc; 
            });
          };



/*
var keys = [];
for(var k in obj) keys.push(k);
*/

        var data = mapped(resp);
/*
        var people_fields = [ 'last','first','status','household_id','phone','email','work_phone','dob','gender','type'];
        var household_fields = ['name', 'label_name', 'street1', 'street2', 'city', 'state', 'zip','mail_list', 'mail_news'];
*/
        var household_fields = ['name', 'label_name', 'street1', 'street2', 'city', 'state', 'zip','mail_list', 'mail_news'];

        var fields = people_fields.concat(household_fields);

          // associate the households to the person
          for (i = 0; i < people.length; i++) { 
            rows[i] = people[i];
            var household = households[people[i].household_id];
            if(household){
              for(j in household_fields){
                rows[i][household_fields[j]] = household[household_fields[j]];
              }
            }
          }

          console.log(fields);
//          console.log(rows);

          // http://stackoverflow.com/questions/35138765/download-csv-file-node-js/35140031
          json2csv({ data: rows, fields: fields }, function(err, csv) {
            res.set('Content-disposition', 'attachment; filename=people.csv');
            res.set('Content-Type', 'text/csv');
            res.status(200).send(csv);
          });
        } else {
          console.log(err);
        }
      });
  }
);

app.get('/getHousehold/', 
  users.auth,
  function(req, res){
    var role = req.user.role[0].value;
    if(role === 'admin'){
      // the factory passes the id of the document as a query parameter
      var id = req.query.id;
      db.get(id, function(err, doc){
        if (!err) {
          // get the people of this householdsAndPeople
          db.view(
            'app', 
            'join_people_to_household', 
            {
              'include_docs': true,
              'key': id
            }, 
            function(err, people){
              if (!err) {
                var mapped = function(data){
                  return data.rows.map(function(row) {
                    return row.doc; // this is the entire payload
                  });
                };
                // add people to the household
                doc.people = mapped(people);
                res.send(doc);
              }
            }
          );
          //console.log(doc);
          //res.send(doc);
        }
      });
    } else {
      return res.status(401).json({ "error": "Sorry, you don't have permission for this." }); 
    }
});

app.post('/postHousehold', 
  users.auth,
  jsonParser, 
  function(req, res){
    var role = req.user.role[0].value;
    if(role === 'admin'){

      var household = req.body,
        newPeople = [];
      // bulk insert people
      // todo: make sure this works when a household has zero people, even though that's very unlikely
      // might even wanna prevent saving a household until there's a person
      if(household.people.length > 0){
        // update people in bulk
          db.bulk({docs:household.people}, function(err, docs) {
          //db.insert(household.people[1], function(err, docs){
          if(!err){
            console.log(docs);
            // update the new people object with response, including _rev
            newPeople = docs;
            // don't push the people object into the household, b/c people are stored separately
            delete household.people;
            // update household
            db.insert(household, function(err, doc){
              if (!err) {
                console.log('success updating household, will add people to response next');
                // make sure there are no people in the household object
                doc.people = [];
                // append the updated people object to the household before sending the response
                doc.people = newPeople;
                console.log(doc);
                res.send(doc);
              }
              else {
                console.log('household:' + err.reason);
              }
            });
          } else {
            console.log('people: ' + err.reason);
          }
        });
      }
    } else {
      // console.log('not admin');
      return res.status(401).json({ "error": "Sorry, you don't have permission for this." }); 
    }
});

app.get('/getSignups', 
  users.auth,
  function(req, res){
    var role = req.user.role[0].value;
    if(role === 'member' || role === 'admin'){
      // console.log(role);
      db.view('app', 'signups', {'include_docs': true}, function(err, doc){
        if (!err) {
          res.send(doc);
        }
      });
    } else {
      // console.log('not admin');
      return res.status(401).json({ "error": "Sorry, you don't have permission for this." }); 
    }
});

app.get('/getSignupChairs', 
  users.auth,
  function(req, res){
    var role = req.user.role[0].value;
    if(role === 'admin'){
      // console.log(role);
      db.view('app', 'signups', {'include_docs': true}, function(err, doc){
        if (!err) {
          res.send(doc);
        }
      });
    } else {
      // console.log('not admin');
      return res.status(401).json({ "error": "Sorry, you don't have permission for this." }); 
    }
});

app.get('/getSignup/', 
  users.auth,
  function(req, res){
    var role = req.user.role[0].value;
    if(role === 'member' || role === 'admin'){
      // console.log(role);
      // the factory passes the id of the document as a query parameter
      var doc = req.query.id;
      db.get(doc, function(err, doc){
        if (!err) {
          res.send(doc);
        }
      });
    } else {
      // console.log('not admin');
      return res.status(401).json({ "error": "Sorry, you don't have permission for this." }); 
    }
});

app.get('/editSignup/', 
  users.auth,
  function(req, res){
    var role = req.user.role[0].value;
    if(role === 'admin'){
      // console.log(role);
      // the factory passes the id of the document as a query parameter
      var doc = req.query.id;
      db.get(doc, function(err, doc){
        if (!err) {
          res.send(doc);
        }
      });
    } else {
      // console.log('not admin');
      return res.status(401).json({ "error": "Sorry, you don't have permission for this." }); 
    }
});

app.get('/getPeople', 
  function(req, res){
      db.view('app', 'people', {'include_docs': true}, function(err, resp){
        var mapped = function(data){
          return data.rows.map(function(row) {
            var trimmed = {};
            trimmed._id = row.doc._id;
            trimmed.status = row.doc.status;
            trimmed.household_id = row.doc.household_id;
            trimmed.name = row.doc.first + ' ' + row.doc.last;
            return trimmed; 
          });
        };

        var people = mapped(resp);
        if (!err) {
          res.send(people);
        }
        else {
          console.log(err);
        }
      });
  }
);

app.post('/update', jsonParser, function(req, res){
  var doc = req.body;
  db.insert(doc, function(err, doc){
    if (!err) {
      res.send(doc);
    }
    else {
      console.log('error saving doc');
    }
  });
});








/*
TESTS

cloudant.db.list(function(err, allDbs) {
  console.log('All my databases: %s', allDbs.join(', '))
});

app.get('/allDatabases', function(req, res){
  cloudant.db.list(function(err, data) {
    res.send(data);
  });
});
*/