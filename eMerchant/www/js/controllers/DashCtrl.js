'use strict';
app.controller('DashCtrl', ['$scope', '$rootScope', '$state', '$ionicLoading', '$timeout', '$http', '$ionicPopup', 'AuthService', '$cordovaBarcodeScanner',
  function ($scope, $rootScope, $state, $ionicLoading, $timeout, $http, $ionicPopup, AuthService, $cordovaBarcodeScanner) {
    $scope.logout = function () {
      AuthService.logout();
      $state.go('login');
    };

    $rootScope.username = AuthService.username();

    //二维码扫描---------------------------------------------------------------------------------------
    $scope.scanBarcode = function () {
        window.cordova.plugins.barcodeScanner.scan(
          function (result) {
            //$rootScope.barcoderesults = [{
            //  Result: result.text,
            //  Format: result.format,//QR_CODE  and others
            //  Cancelled: result.cancelled //true or false
            //}];
            if (result.format == "QR_CODE") {
                $state.go('main.payconfirm', {qrcodeId: result.text});
            }else if(!result.cancelled){
              $ionicLoading.show({ template: '非二維碼格式，請確認!', noBackdrop: true, duration: 2000 });
            }
          },
          function (error) {
            alert("Scanning failed: " + error);
          }
        );
    };

    //---------------------------------------------------------------------------------------------------

    $scope.performValidRequest = function () {
      $http.get('http://localhost:8100/valid').then(
        function (result) {
          $scope.response = result;
        });
    };

    $scope.performUnauthorizedRequest = function () {
      $http.get('http://localhost:8100/notauthorized').then(
        function (result) {
          // No result here..
        }, function (error) {
          $scope.response = error;
        });
    };

    $scope.performInvalidRequest = function () {
      var res = $http.get('http://localhost:8100/notauthenticated');

      res.then(
        function succ(result) {
          // No result here..
        }, function err(error) {
          $scope.response = error;
        });
    };

    $scope.deliverGoods = function () {
      $state.go('main.deliverGoodsMain', {}, {reload: true});
    }

    $scope.assignGoods = function () {
      $state.go('main.assignGoodsMain', {}, {reload: true});
    }

    $scope.todayOrder = function () {
      $state.go('main.todayOrder', {}, {reload: true});
    }
  }]);
