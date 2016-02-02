controllers.controller('OrderCtrl', ['$scope','$ionicHistory','$ionicPopup', function($scope, $ionicHistory, $ionicPopup) {
  //离开提示框
  $scope.impMoneyGoBack = function() {
    var confirmPopup = $ionicPopup.confirm({
      title: '提示',
      template: '确定是否放弃输入金额</br>',
      okText: '确认离开',
      cancelText: '继续输入'
    });
    confirmPopup.then(function (res) {
      if (res) {
        //$ionicHistory.goBack();
        $state.go('main.dash', {}, {reload: true});
      } else {
        // 继续输入
      }
    });
  };

  //确认金额
  $scope.data = {};
  $scope.setCurrentMoney = function(money) {
    $scope.totalMoney += money;
    alert(money);
  };
  $scope.calculateMoney = function(data) {
    AuthService.login(data.totalMoney).then(function() {
      $scope.setCurrentMoney(data.totalMoney);
      $state.go('main.orders-waitpay', {}, {reload: true});
    }, function(err) {
      var alertPopup = $ionicPopup.alert({
        title: 'Pay failed!',
        template: 'Please check your input!'
      });
    });
  };

  //处理其他订单
  $scope.displayDash = function() {
    $state.go('main.dash', {}, {reload: true});
  };

}]);

