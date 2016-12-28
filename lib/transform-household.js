// transform the household info
// from the mysql db to couch
// remove unnecessary key strings
// this eliminates the need to do any editing of the CSV export from mysql
var x = function(doc) {

  var z = {};

  for(i in doc){
    //replace the key
    var key = i.replace('household_','');
    key = key.replace('address','street');
    z[key] = doc[i];
  }

  z._id = 'household-' + doc.household_id;
  z.type = 'household';

  if(z.id){
    delete z.id;
  }

  return z;
}

module.exports = x;