app.filter('reverseArrayOnly', function() {
  return function(items) {
    if(!angular.isArray(items)) { return items; }
    return items.slice().reverse();
  };
});

app.directive('members', function($timeout){
  return {
    controller: 'memberCtrl',
    templateUrl: 'partials/tmp-members.html',
    link: function($scope, $rootScope, element, attrs){
//      console.log($scope.type);
    }
  };
});

// signup chair cookie setter
app.directive('cookie', function(){
  return {
    controller: 'CookieCtrl',
    templateUrl: 'partials/cookie.html'    
  }
});

// alert handler
app.directive('alerts', function($timeout){
  return {
    controller: 'AlertDemoCtrl',
    templateUrl: 'partials/alert.html',
    link: function($scope, $rootScope, element, attrs){

      // watch and use true b/c we're comparing an array'
      $scope.$watch('alerts', function(newVal, oldVal){
        if(newVal !== oldVal){
          $timeout(function(){
            $scope.alerts.splice($scope.alerts.length - 1, 1);
          }, 3000)
        }
      }, true);
    }
  };
});