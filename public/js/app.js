// top level file for the MSC site
// kicks off the app module and handles routes

var app = angular.module('app', ['ngRoute','ngCookies','ui.bootstrap']);

app.config( function($routeProvider) {
	$routeProvider
		.when('/',
			{
				controller: 'home',
				templateUrl: 'partials/home.html'
			})
		.when('/list',
			{
				controller: 'list',
				templateUrl: 'partials/list.html'
			})
		.when('/list/new',
			{
				controller: 'household',
				templateUrl: 'partials/household-edit.html'
			})
		.when('/list/:id',
			{
				controller: 'household',
				templateUrl: 'partials/household.html'
			})
		.when('/list/edit/:id',
			{
				controller: 'household',
				templateUrl: 'partials/household-edit.html'
			})
		.when('/signups',
			{
				controller: 'signups',
				templateUrl: 'partials/signups.html'
			})
		.when('/signups/new',
			{
				controller: 'signup',
				templateUrl: 'partials/edit-signup.html'
			})
		.when('/signups/:id',
			{
				controller: 'getSignup',
				templateUrl: 'partials/signup.html'
			})
		.when('/signups/:id/chair',
			{
				controller: 'signup',
				templateUrl: 'partials/chair.html'
			})
		.when('/signups/:id/edit',
			{
				controller: 'signup',
				templateUrl: 'partials/edit-signup.html'
			})
		.when('/signups/:id/edit/assignments',
			{
				controller: 'signup',
				templateUrl: 'partials/assign-edit-signup.html'
			})
		.when('/signups/:id/edit/list',
			{
				controller: 'signup',
				templateUrl: 'partials/list-edit-signup.html'
			})
		.when('/docs',
			{
				controller: 'docs',
				templateUrl: 'partials/docs.html'
			})
		.when('/admin',
			{
				controller: 'admin',
				templateUrl: 'partials/admin.html'
			})
		.otherwise(
			{
				redirectTo: '/'
			});
});