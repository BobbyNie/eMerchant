controllers.controller('DashCtrl', ['$scope', '$state', '$http', '$ionicPopup', 'AuthService', '$cordovaBarcodeScanner',
                    function($scope, $state, $http, $ionicPopup, AuthService, $cordovaBarcodeScanner) {
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  };

  $scope.scanBarcode = function() {
    $cordovaBarcodeScanner.scan().then(function(imageData) {
      var qrCode = imageData.text;
      //alert(StrNumbers);
      //console.log("Barcode Format -> " + imageData.format);
      //console.log("Cancelled -> " + imageData.cancelled);
      $state.go('main.orders-payconfirm',{}, {reload: true});
    });
  };

  $scope.performValidRequest = function() {
    $http.get('http://localhost:8100/valid').then(
      function(result) {
        $scope.response = result;
      });
  };

  $scope.performUnauthorizedRequest = function() {
    $http.get('http://localhost:8100/notauthorized').then(
      function(result) {
        // No result here..
      }, function(err) {
        $scope.response = err;
      });
  };

  $scope.performInvalidRequest = function() {
    $http.get('http://localhost:8100/notauthenticated').then(
      function(result) {
        // No result here..
      }, function(err) {
        $scope.response = err;
      });
  };
}]);
