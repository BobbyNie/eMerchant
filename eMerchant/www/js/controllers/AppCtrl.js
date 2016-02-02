controllers.controller('AppCtrl', ['$scope','$state','$ionicPopup','AuthService','AUTH_EVENTS','ENV',
                        function($scope, $state, $ionicPopup, AuthService, AUTH_EVENTS,ENV) {
  $scope.username = AuthService.username();

  $scope.$on(AUTH_EVENTS.notAuthorized, function(event) {
    var alertPopup = $ionicPopup.alert({
      title: 'Unauthorized!',
      template: 'You are not allowed to access this resource.'
    });
  });

  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $state.go('login');
    var alertPopup = $ionicPopup.alert({
      title: 'Session Lost!',
      template: 'Sorry, You have to login again.'
    });
  });

  $scope.setCurrentUsername = function(name) {
    $scope.username = name;
  };

  $scope.$on(ENV.version, function(event) {
    var alertPopup = $ionicPopup.alert({
      title: 'Check for update',
      template: 'Do you want to update to newest version?'
    });
  });
}]);



