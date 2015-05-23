 // routes.js
var app = angular.module('digitalAssistant', ['ui.router', 'base64', 'UserMgmt', 'ngTouch']);


app.run(function ($rootScope, $state, loginModal, Session) {

  $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
    var requireLogin = toState.data.requireLogin;

    if (requireLogin && typeof $rootScope.currentUser === 'undefined') {
      event.preventDefault();
      Session.load().success(function (data){
        if (data.valid != true){
          loginModal()
            .then(function () {
              return $state.go(toState.name, toParams);
            })
            .catch(function () {
              return $state.go('welcome');
            });
          }
          else{
            Session.user
            return $state.go(toState.name, toParams);
          }

        });
        
      }
  });
});

app.controller('TaskController', 
  function ($scope, $rootScope,Tasks,Goals){
    $scope.user = $rootScope.currentUser;
    $scope.tasks = [];
    $scope.goals = [];
    
    function getTasks(){
      Tasks.get().success(function(data) {
        $scope.tasks = data.tasks;
      });
    }
    

    function getGoals(){
      Goals.get().success(function(data){
        $scope.goals = data.goals;
      });
    }

    
    $scope.getColor = Goals.getColor;

    $scope.addTask = function (t,g){
      Tasks.add(t,g).success(getTasks);
    };

    getGoals();
    getTasks();

  });
app.controller('GoalController', 
  function ($scope, Goals){
    $scope.goals = [];
    
    function getGoals(){
      Goals.get().success(function(data){
        $scope.goals = data.goals;
      });
    }

    $scope.addGoal = function (name,weight){
      Goals.add(name,weight).success(getGoals);
    };

    getGoals();

    
    $scope.getColor = Goals.getColor;

  });
app.service('Tasks',function ($http) {
    this.get = function (){
      return $http.get('/api/v1/tasks');
      
    }
    this.add = function (name,goal,tid) {
      return $http.post('/api/v1/tasks',{'name':name, 'goal':goal,'tid':tid});
    };
        
  });
app.factory('Goals',function ($http) {
  model = {};
    model.goal_index = [];
    model.get = function (){
      return $http.get('/api/v1/goals').success(function(data){
        model.goal_index = data.goals.map(function(element){
          return element.name; });
      });
      
    };

    model.add = function (name,weight,gid) {
      return $http.post('/api/v1/goals',{'name':name, 'weight':weight,'gid':gid});
    };

    model.getColor = function (goalname){
      var colors = ['blue','yellow','green','purple', 'black', 
                      'beige', 'magenta', 'red', 'brown']
      var i = model.goal_index.indexOf(goalname);
  
      if(i == -1)
        return 'white';
      return colors[i%colors.length];
    }

    return model;
        
  });

// app.js


app.config(function ($stateProvider, $urlRouterProvider, 
                        $httpProvider, $interpolateProvider) {

    $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('welcome', {
      url: '/',
      // abstract: true,
      // templateUrl: '/static/derp.html',
      // controller: 'LoginModalCtrl',
      data: {
        requireLogin: false
      }
    })
    .state('app',{

      abstract: true,
      template: "<ui-view/>",
      data: {
        requireLogin: true // this property will apply to all children of 'app'
      }
    })
    .state('app.tasks', {
      abstract: false,
      url: '/tasks',
      templateUrl: '/static/TaskList.html',
      controller: 'TaskController',
 
    })
    .state('app.goals', {
      // child state of `app`
      // requireLogin === true
      url: '/goals',
      templateUrl: '/static/GoalList.html',
      controller: 'GoalController',
    });

    $httpProvider.interceptors.push(function ($timeout, $q, $injector) {
    var loginModal, $http, $state;

    // this trick must be done so that we don't receive
    // `Uncaught Error: [$injector:cdep] Circular dependency found`
    $timeout(function () {
      loginModal = $injector.get('loginModal');
      $http = $injector.get('$http');
      $state = $injector.get('$state');
    });

    return {
      responseError: function (rejection) {
        if (rejection.status !== 401) {
          return rejection;
        }

        var deferred = $q.defer();

        loginModal()
          .then(function () {
            deferred.resolve( $http(rejection.config) );
          })
          .catch(function () {
            $state.go('welcome');
            deferred.reject(rejection);
          });

        return deferred.promise;
      }
    };
  });
  $interpolateProvider.startSymbol('{[{').endSymbol('}]}');

});


