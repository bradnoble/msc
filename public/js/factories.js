app.factory('simpleFactory', function($http, $timeout, $location) {
	var factory = {};

  factory.docDefaults = function(type) {
	  var now = new Date(),
	   stamp = [
	   	type,
	   	now.getFullYear(),
	   	now.getMonth() + 1,
	   	now.getDate() + 1,
	   	now.getMilliseconds()
	   ],
	   obj = {
	   	_id: stamp.join('-'),
	   	type: type
	   };

	  return obj;
  };

  factory.getHousehold = function(id){
    return $http.get('/getHousehold', {
      params: {
        id: id
      }
    })
    .success(function(data){
      // console.log('yep');
      return data; 
    })
    .error(function(data){
      console.log(data);
      return data;
    });    
  };
  
  factory.postHousehold = function(data){
    return $http.post('/postHousehold', data, {json: true})
  };

  factory.getHouseholdsAndPeople = function(){
    return $http.get('/getHouseholdsAndPeople');
  };

  factory.getSignups = function(){
    return $http.get('/getSignups')
      .success(function(data){
        // console.log('yep');
        return data; 
      })
      .error(function(data){
        console.log(data);
        return data;
      });    
  };

  // http://stackoverflow.com/questions/7114152
	factory.getAllDays = function(start, end) {
	  var start = new Date(start),
	  	end = new Date(end),
	  	dates = {};
	  while(start < end) {
	    dates[start.toJSON()] = {};
	    start = new Date( start.setDate( start.getDate() + 1 ));
	  }
	  return dates;
	};

  factory.getRoomSchema = function(){
    var schema =  {
      "antelope": {
        "max": 4
      },
      "beaver": {
        "max": 4
      },
      "bunny": {
        "max": 6
      },
      "chipmunk": {
        "max": 4
      },
      "paradise": {
        "max": 3
      },
      "panther": {
        "max": 5
      },
      "porcupine": {
        "max": 6
      },
      "quacky": {
        "max": 4
      },
      "robin": {
        "max": 4
      }
    };
    return schema;    
  };

  factory.getAllBeds = function(){
    var schema = factory.getRoomSchema();
    var rooms = {};
    angular.forEach(schema, function(value, key){
      rooms[key] = [];
    });
    return rooms;    
  };

  factory.getSignup = function(id){
    return $http.get('/getSignup/', {
      params: {
        id: id
      }
    })
    .success(function(data){
      // console.log('yep');
      return data; 
    })
    .error(function(data){
      console.log(data);
      return data;
    });    
  };

  factory.getEditSignup = function(id){
    return $http.get('/editSignup/', {
      params: {
        id: id
      }
    })
    .success(function(data){
      // console.log('yep');
      return data; 
    })
    .error(function(data){
      console.log(data);
      return data;
    });    
  };

	factory.putSignup = function(data){
    return $http.post('/update', data,{json: true})
	};

  factory.getPeople = function(obj){
    return $http.get('/getPeople')
      .success(function(data){
        // console.log(data);
      })
      .error(function(data){
        console.log(data);        
      });
  };

  return factory;
});




/*
      var results = [
      {
        _id: "123",
        name: "barney donkey",
        household_id: "180"
      },
      {
        _id: "234",
        name: "dinkey blonkey",
        household_id: "180"
      }
    ];

	factory.getPeopleForHousehold = function(household_id) {
//		return $http.get('/msc-couchapp/_design/app/_view/join_people_to_household', {
		return $http.get('/getPeopleForHousehold', {
			params: {
				include_docs: true,
				key: angular.toJson(household_id)
			}
		});
	};

 factory.getDatabases = function(){
    return $http.get('/allDatabases');
  }

 

*/
