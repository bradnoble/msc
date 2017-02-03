/* to do
list 
  x search by name, link to household page
  export to CSV
    households
    people
x restrict list to only members
cancel someone without deleting them from list
  create cancel object to store this info
  restore from cancelled
D signups
D households
get membership list download
  get emails, excluding non-member
don't save dates til signup chair is in
toggle to show notes per name on assign
keep the dob for junior, too
  if wrong, email montclairskiclub@gmail.com to update it
change dob to dob.month and dob.year

// working

// done
x upload new info from MSC list from old site
x get on bluemix
x update the data from msc.com
x uninstall couchimport if jsonToCSV works
x creating signup generates password for signup admin privs
    needs to be retrievable somehow
    make the signup chair's unique id the password for the signup
x hidden/publish assignments
x elimate DOB, store month/year of birth
  when you turn 23, data goes away; actually, when you move from child to junior, data is deleted
x add tooltip to assign beds that shows notes
x notes field on the signup page
x edit order of signup list
x google drive for embedded folder on /docs

- - - - - 
cycle the admin password

add alerts to all failures
  auth
add alerts to all successes
  auth?
redirect auth failures to / for now, in the controller
		.error(function(data){
      // probably an auth error
      $scope.alerts.push({msg: data.error});
      $location.path('/');
		});
*/

app.controller('home', function ($scope, $rootScope, $routeParams, $timeout, $location, simpleFactory){});

app.controller('admin', function ($scope, $rootScope, $routeParams, $timeout, $location, simpleFactory){});

app.controller('docs', function ($scope, $rootScope, $routeParams, $timeout, $location, simpleFactory){});

app.controller('list', function ($scope, $rootScope, simpleFactory) {
	$scope.households = [];
  $scope.results = [];

  // get all the people for the typeaheads
  simpleFactory.getPeople()
    .success(function(data){
      $scope.results = data;
    });

/*
	simpleFactory.getHouseholdsAndPeople()
		.success(function(data){
      $scope.households = data;
		})
		.error(function(data){
			$scope.households = data;
		});
*/
});

app.controller('household', function ($scope, $routeParams, $timeout, $location, simpleFactory) {
	$scope.household = {}; // holds all the household metadata
	$scope.household.people = []; // holds the people associated to the household
	$scope.statuses = ['active','inactive','life','junior','child','non-member']; // each person can be one of these
  $scope.mail_news = ['yes', 'no'];

  if(!!$routeParams.id){ // if the id exists, will return true
		simpleFactory.getHousehold($routeParams.id)
			.success(function(data){
				$scope.household = data;
			})
			.error(function(err){
				console.log(err);
			});
  } else {
  	$scope.household = simpleFactory.docDefaults('household');
  	$scope.household.people = []; // holds the people associated to the household
  };

  $scope.updateHousehold = function(){
    angular.forEach($scope.household.people, function(person, key){
      if(person.status != 'child'){
        delete $scope.household.people[key].dob;
      }
    });
    simpleFactory.postHousehold($scope.household)
      .success(function(data){
        // update _rev for the household with the rev that the res delivers 
        $scope.household._rev = data.rev;
        // loop through the people and update the _rev
        angular.forEach(data.people, function(value, key){
          // make the _rev for each person the rev that the res delivers
          $scope.household.people[key]._rev = data.people[key].rev;
        });
				// redirect to the location
	      $location.path('/list/' + data.id);
        $scope.alerts.push({msg: 'Household updated'});

      })
      .error(function(err){
				console.log(err);
      });
  };

	$scope.addPerson = function() {
		// get defaults
		var obj = simpleFactory.docDefaults('person');
		// add person to household
		obj.household_id = $scope.household._id;
		// present the default status
		obj.status = $scope.statuses[0];
		// add obj to the people array
		$scope.household.people.push(obj);
	};

	$scope.removePerson = function(index) {
		// cloudant will delete docs with this flag once they're pushed up
		$scope.household.people[index]._deleted = true;
    // need to also remove the person from the array so that the view behaves correctly
		// $scope.household.people.splice(index, 1);
	};

});

app.controller('signups', function ($scope, simpleFactory) {

	$scope.signups = [];

	simpleFactory.getSignups()
		.success(function(data){
      var mapped = function(data){
        return data.rows.map(function(row) {
          return row.doc;
        });
      };
			$scope.signups = mapped(data);
		})
		.error(function(data){
      // probably an auth error
			$scope.signups = data;
		});
});

app.controller('getSignup', function ($scope, $location, $rootScope, $routeParams, $http, simpleFactory) {
    simpleFactory.getSignup($routeParams.id)
      .success(function(data){
        $scope.signup = data;
        $scope.max = simpleFactory.getRoomSchema();
      })
      .error(function(data){
        // probably an auth error
        $scope.alerts.push({msg: data.error});
        $location.path('/');
      });
});

app.controller('signup', function ($scope, $cookies, $location, $rootScope, $routeParams, $http, simpleFactory) {

  var beds = simpleFactory.getAllBeds();
  $scope.max = simpleFactory.getRoomSchema();
  $scope.selected = {};
  $scope.assigned = {};
  $scope.guestStarter = []; // val from guest field in edit list
  $scope.view = 'list'; // default tab/tab-container view for edit list
  $scope.type = 'list'; // to reinstate people

  // get all the people for the typeaheads
  simpleFactory.getPeople()
    .success(function(data){
      $rootScope.results = data;
    });

  if($routeParams.id == null){
    $scope.signup = simpleFactory.docDefaults('signup');
    $scope.signup.arrive = new Date();
    $scope.signup.depart = new Date();
    $scope.signup.list = [];
    $scope.signup.published = false;
  } else {
    simpleFactory.getEditSignup($routeParams.id)
      .success(function(data){
        $scope.signup = data;
        $scope.signup.arrive = new Date($scope.signup.arrive);
        $scope.signup.depart = new Date($scope.signup.depart);
        $scope.updateSignupList(); // is the person in the list already assigned?
      })
      .error(function(data){
        // probably an auth error
        $scope.alerts.push({msg: data.error});
        $location.path('/');
      });
  };

  $scope.moveUp = function(person, index){
    // make sure the person being moved doesn't move off the top of the list
    if(index > 0){
      // temporarily store the person being replaced
      var temp = $scope.signup.list[index - 1];
      // put the person being moved into her new spot, up one from where she started
      $scope.signup.list[index - 1] = person;
      // put the person being replaced in the person being moved's empty spot
      $scope.signup.list[index] = temp;
    }    
  };

  $scope.moveDown = function(person, index){
    // make sure the person doesn't move off the bottom of the list
    if(index < $scope.signup.list.length - 1){
      var temp = $scope.signup.list[index + 1];
      $scope.signup.list[index + 1] = person;
      $scope.signup.list[index] = temp;
    }    
  };

  $scope.cancel = function(person){
    var here = false;
    // create cancellations if they don't exists
    if(!$scope.signup.cancelled){
      $scope.signup.cancelled = [];
    }
    // add person to cancelled
    $scope.signup.cancelled.push(person);      
    // remove person from list
    angular.forEach($scope.signup.list, function(value, key){
      // if value._id == person._id, splice it
      if(value._id == person._id){
        $scope.signup.list.splice(key, 1);
      }
    });
    // save
  };

  $scope.toggleView = function(str){
    $scope.view = str;
  };

  $scope.addGuest = function(index, person){
    var guest = simpleFactory.docDefaults('guest');
    guest.name = $scope.guestStarter[index];
    guest.status = 'guest'; // this is not the same as type
    guest.member = person;
    // insert into list below sponsor member, and bump things down
    $scope.signup.list.splice(index + 1, 0, guest); 
    $scope.guestStarter = [];
  };
  
  $scope.select = function(person){
    if($scope.selected._id == person._id){
      return $scope.selected = {};
    }
    $scope.selected = person;
  };

// flag people in the list who are already assigned
  $scope.updateSignupList = function(){

      angular.forEach($scope.signup.assignments, function(rooms, date){
        angular.forEach(rooms, function(beds, room){
          angular.forEach(beds, function(person, key){
              $scope.assigned[person] = true;
          });
        });
      });
    
    var flatten = JSON.stringify($scope.signup.assignments);
    angular.forEach($scope.signup.list, function(value, key){
      if(flatten.indexOf(value._id) > -1){
        $scope.assigned[value._id] = true;
      } 
    });
    // console.log($scope.assigned);
  };

  $scope.applyToDuration = function(obj){
    // get dates from span
    var dates = simpleFactory.getAllDays($scope.signup.arrive, $scope.signup.depart);
    // get room from param
    var room = obj.room;
    // get person from $scope.selected
    // var person = $scope.selected;
    // loop through dates and assign person to room
    angular.forEach(dates, function(value, key){
      // addToBed({date:date,room:room})
      // console.log(key, room)
      $scope.addToBed({date:key, room:room});
    });
  };

  $scope.addToBed = function(obj){
    var person = $scope.selected;
    var here = false;
    var array = $scope.signup.assignments[obj.date][obj.room];

    angular.forEach(array, function(value, key){
      if(value._id == person._id){
        here = true;
      }
    });
    if(!here){
      $scope.signup.assignments[obj.date][obj.room].push(person);
      // console.log($scope.signup.assignments[obj.date][obj.room]);
    }
    $scope.updateSignupList();
  };

  $scope.removeBedAssignment = function(obj){
    // only allow people to be deleted if a member is not being assigned
    if(!$scope.selected._id){ 
      $scope.signup.assignments[obj.date][obj.room].splice(obj.index, 1);
      $scope.updateSignupList();
    }
  };

  $scope.clearAssignments = function(){
    if(!$scope.selected._id){ 
      angular.forEach($scope.signup.assignments, function(rooms, date){
        angular.forEach(rooms, function(bed, room){
          $scope.signup.assignments[date][room] = [];
        });
      });
      //$scope.signup.assignments = {};
      $scope.assigned = {};
      $scope.selected = {};
      $scope.updateAssignments();
    }
  };

  $scope.updateAssignments = function(){
    var dates = simpleFactory.getAllDays($scope.signup.arrive, $scope.signup.depart);
    // need to make sure the dates are in order
    var array = Object.keys(dates);
    var obj = {};

    if(!$scope.signup.assignments){
      $scope.signup.assignments = {};
    }
    
    // use the dates array to order the dates
    angular.forEach(array, function(value, key){
      if($scope.signup.assignments[value]){
        obj[value] = $scope.signup.assignments[value];
      } else {
        obj[value] = beds;
      }
    });
    $scope.signup.assignments = obj;
  };

  // save edits to signup
  $scope.updateSignup = function(type) {
    $scope.updateAssignments();
    simpleFactory.putSignup($scope.signup)
      .success(function(data){
        $location.path('/signups/' + $scope.signup._id);
        $scope.alerts.push({msg: 'saved!'});
      });
  };
});

app.controller('search', function ($scope) {
  $scope.type = "search";
});

app.controller('signup-list-member', function ($scope) {
  $scope.type = "list";
});

app.controller('chair', function ($scope) {
  $scope.type = "chair";
});

app.controller('mgr', function ($scope) {
  $scope.type = "mgr";
});

app.controller('memberCtrl', function ($scope, $rootScope, $location, simpleFactory) {
    
    // when a user clicks to pick a member
    $scope.assign = function(obj){

      var here = false;
      if(angular.isArray($scope.signup[$scope.type])){
        // is this person already in here?
        angular.forEach($scope.signup[$scope.type], function(value, key){
          if(value._id == obj._id){
            here = true;
          }
        });

        // is this person already cancelled?
        // if so, remove them from the cancelled list
        angular.forEach($scope.signup.cancelled, function(value, key){
          if(value._id == obj._id){
            $scope.signup.cancelled.splice(key, 1);
          }
        });

        if(!here){
          $scope.signup[$scope.type].push(obj);
        }
      }
      else {
        $scope.signup[$scope.type] = obj;
      }
      delete $scope.searchText;
    };

    // if the user hits return to pick the top option 
    $scope.pick = function(){
      // searching is simpler than adding to the list array so just do a redirect
      if($scope.type == 'search'){
        $location.path('/list/' + $scope.filtered[0].household_id);
      } else {
        var here = false;
        if(angular.isArray($scope.signup[$scope.type])){
          // is this person already in here?
          angular.forEach($scope.signup[$scope.type], function(value, key){
            if(value._id == $scope.filtered[0]._id){
              here = true;
            }
          });          
          if(!here){
            $scope.signup[$scope.type].push($scope.filtered[0]);        
          }
        } else {
          $scope.signup[$scope.type] = $scope.filtered[0];
        }
        
      }
      delete $scope.searchText;
    };
});






/* ui-bootstrap stuff */

app.controller('navCtrl', function($scope, $location, $routeParams){
  var path = $location.url();
  $scope.nav = [
    {
      "label": "Montclair Ski Club",
      "url": "/"
    },
    {
      "label": "list",
      "url": "list"          
    },
    {
      "label": "signups",
      "url": "signups"          
    },
    {
      "label": "docs",
      "url": "docs"          
    }
  ];
/*
  angular.forEach($scope.nav, function(value, key){
    var path = $location.path();
    if(path.indexOf(value.url) > -1){
      $scope.nav[key].active = true;
    }
  });
*/
});

app.controller('dateCtrl', function ($scope) {
  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.opened = true;
  };
  $scope.format = 'yyyy-MM-dd Z';
});

app.controller('CookieCtrl', function ($scope, $cookies) {
  $scope.getCookie = function(){
    var cookie = $cookies.get('msc-signup');
    return cookie;
  };
  $scope.putCookie = function(){
    if($scope.cookie == $scope.signup.chair._id){
      $cookies.put('msc-signup', $scope.cookie);    
      $scope.addAlert("Hey, " + $scope.signup.chair.name + ". You're the sign up chair.");
    }
  }
});

app.controller('AlertDemoCtrl', function ($scope) {
  $scope.alerts = [];

  $scope.addAlert = function(msg) {
    $scope.alerts.push({msg: msg});
  };

  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };
});

app.controller('DatepickerPopupDemoCtrl', function ($scope) {

  $scope.clear = function() {
    $scope.dt = null;
  };

  $scope.inlineOptions = {
    customClass: getDayClass,
    minDate: new Date(),
    showWeeks: true
  };

  $scope.dateOptions = {
    dateDisabled: false, // http://stackoverflow.com/questions/33505896/ui-bootstrap-datepicker-enable-weekend-days
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(),
    startingDay: 1
  };

  // Disable weekend selection
  function disabled(data) {
    var date = data.date,
      mode = data.mode;
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  }

  $scope.toggleMin = function() {
    $scope.inlineOptions.minDate = $scope.inlineOptions.minDate ? null : new Date();
    $scope.dateOptions.minDate = $scope.inlineOptions.minDate;
  };

  $scope.toggleMin();

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.open2 = function() {
    $scope.popup2.opened = true;
  };

  $scope.setDate = function(year, month, day) {
    $scope.dt = new Date(year, month, day);
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];
  $scope.altInputFormats = ['M!/d!/yyyy'];

  $scope.popup1 = {
    opened: false
  };

  $scope.popup2 = {
    opened: false
  };

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  $scope.events = [
    {
      date: tomorrow,
      status: 'full'
    },
    {
      date: afterTomorrow,
      status: 'partially'
    }
  ];

  function getDayClass(data) {
    var date = data.date,
      mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }

    return '';
  }
});
