'use strict';
app.controller('PayResultCtrl', ['$scope', '$state', '$stateParams','QrCodeIntf', '$ionicPopup', 'AuthService', '$log',
  function ($scope, $state, $stateParams, QrCodeIntf, $ionicPopup, AuthService, $log) {

    $scope.failReason = $stateParams.failReason;

    QrCodeIntf.getThisOrderInfo($stateParams.orderId).then(function (succ) { //dwr返回值错误 二进制格式 改Long
      if (succ != null && succ.res == true) {
        $scope.orderId = succ.data.orderId;
        $scope.costAmount = succ.data.costAmount /100;
        $scope.addFeeAmount = succ.data.addFeeAmount;
        $scope.discountAmount = succ.data.discountAmount;
        $scope.realAmount = succ.data.realAmount /100;
        $scope.custId = succ.data.custId;
        $scope.courierId = succ.data.courierId;

      } else {
        $log.error(succ);
      }
    }, function (err) {
      $log.error(err);
    });

//处理其他订单----------------------------------------------------------------------
    $scope.goBackToDash = function () {
      $state.go('main.dash', {}, {reload: true});
    };


  }])
;
