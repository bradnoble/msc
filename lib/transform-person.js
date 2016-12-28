// transform the household info
// from the mysql db to couch
// remove unnecessary key strings
// this eliminates the need to do any editing of the CSV export from mysql

/*
function(doc) {
	if(doc.type == "person"){
		emit(doc._id, 1);
	}
}
*/

var statusConverter = function(num){
  var str = '';
  switch(num){
    case '1':
      str = "active";
      break;
    case '2':
      str = "inactive";
      break;
    case '3':
      str = "life";
      break;
    case '4':
      str = "junior";
      break;
    case '5':
      str = "non-member";
      break;
    case '6':
      str = "honorary";
      break;
    case '8':
      str = "applicant";
      break;
    case '9':
      str = "child";
      break;
  }
  return str;
};


var x = function(doc) {

  var z = {};

  for(i in doc){
    //replace the key
    var key = i.replace('person_','');
//    key = key.replace('','');
    key = key.replace('_name','');
    key = key.replace('persontype_id','status');
    key = key.replace('birth_date','dob');
    key = key.replace('cell_phone','phone');
    z[key] = doc[i];
  }

  z._id = 'person-' + doc.person_id;
  z.type = 'person';
  z.household_id = 'household-' + z.household_id;
  z.status = statusConverter(doc.person_persontype_id);

  if(z.id){
    delete z.id;
  }

  return z;
}

module.exports = x;