/**
 * Created by linchao on 19/2/2016.
 */
'use strict';
app.controller('QrCodeCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$ionicLoading', '$timeout', '$interval', 'QrCodeIntf', 'NoticeService', '$ionicPopup', 'AuthService', '$log', '$q',
  function ($rootScope, $scope, $state, $stateParams, $ionicLoading, $timeout, $interval, QrCodeIntf, NoticeService, $ionicPopup, AuthService, $log, $q) {

    $scope.isConfirmAmount = false;

    if ($stateParams.qrcodeId != null) {
      //通过QRcodeId识别客户
      QrCodeIntf.getCustInfoByQrCodeId($stateParams.qrcodeId).then(function (succ) {
        if (succ != null && succ.res == true) {
          if (!succ.data) {
            var alertPopup1 = $ionicPopup.alert({
              title: '掃描錯誤',
              template: "無匹配用戶信息，請重試！"
            });
            $state.go('main.dash');
          } else {
            $scope.custPhone = succ.data;
          }
          console.log(succ.data);
        } else {
          $log.error(succ);
          var alertTimeoutPopup = $ionicPopup.alert({
            title: '系統錯誤',
            template: "二維碼掃描錯誤，請重新掃描！"
          });
          $state.go('main.dash');
        }
      }, function (err) {
        $log.error(err);
      });
    }

    //未确认金额时点击返回按钮------------------------------------------------------
    $scope.$on('$destroy', function () {
      if(!$scope.isConfirmAmount){
        QrCodeIntf.orderCanceledbyStore($stateParams.qrcodeId).then(function (succ) {
          if (succ != null && succ.res == true) {
            $state.go('main.dash', {}, {reload: true});
          } else {
            $log.error(succ);
            var alertTimeoutPopup = $ionicPopup.alert({
              title: '系统错误',
              template: "服务器处理异常！"
            });
          }
        }, function (err) {
          $log.error(err);
        });
      }
    });

    //确认金额-----------------------------------------------------------------------
    $scope.data = {};
    $scope.confirmAmount = function (data) {
      if(!data.costAmount) {
        var alertAmountPop = $ionicPopup.alert({
          title: '輸入提示',
          template: "輸入金額不能為空！"
        });
        return;
      }

      $scope.isConfirmAmount = true;

      QrCodeIntf.insertOneMasterOrderRecord($stateParams.qrcodeId, data.costAmount).then(function (succ) {
          if (succ != null && succ.res == true) {
            if (succ.data == "1") {
              var alertPopup2 = $ionicPopup.alert({
                title: '超時提示',
                template: "輸入金額超時，請重新掃描二維碼！"
              });
              $state.go('main.dash');
            } else if (succ.data == "2") {
              var alertPopup3 = $ionicPopup.alert({
                title: '系統異常',
                template: "插入訂單記錄出錯！"
              });
              $state.go('main.dash');
            } else {
              $scope.orderId = succ.data;

              $rootScope.pollOrderList.push($scope.orderId);

              //开启通知轮询服务
              if ($rootScope.pollOrderList.length == 1) {
                console.log("开启轮询");
                NoticeService.all();
              }
              $rootScope.notices.push(
                {
                  "orderId": $scope.orderId,
                  "costAmount": data.costAmount,
                  "realAmount": '',
                  "updateDate": '',
                  "payResult": '等待付款',
                  "iconType":'ion-help-circled'
                });
              checkThisOrderStatus();
            }
          } else {
            $log.error(succ);
            var alertPopup4 = $ionicPopup.alert({
              title: '系统异常',
              template: "系统运行出错，请退出重新登陆！"
            });
            $state.go('main.dash');
          }
        }, function (err) {
          $log.error(err);
        }
      );

//服务端轮询--------------------------------------------------------------
      function checkThisOrderStatus() {
        if (AuthService.username()) {
          var refreshData = function () {
            QrCodeIntf.getThisOrderStatus($scope.orderId).then(function (succ) {
              if (succ != null && succ.res == true) {
                $scope.orderStatus = succ.data;

                switch ($scope.orderStatus) {
                  case "01":
                  case "11":
                  case "21":
                    break;
                  case "09":
                    $scope.failReason = "Customer canceled";
                    $state.go('main.payfail', {failReason: $scope.failReason, orderId:$scope.orderId});
                    $interval.cancel(promise);
                    break;
                  case "19":
                    $scope.failReason = "Store closed";
                    $state.go('main.payfail', {failReason: $scope.failReason, orderId:$scope.orderId});
                    $interval.cancel(promise);
                    break;
                  case "29":
                    $scope.failReason = "Timeout";
                    $state.go('main.payfail', {failReason: $scope.failReason, orderId:$scope.orderId});
                    $interval.cancel(promise);
                    break;
                  case "31":
                    $state.go('main.paysuccess', {orderId:$scope.orderId});
                    $interval.cancel(promise);
                    break;
                }
              } else {
                $log.error(succ);
              }
              $scope.$broadcast('payConfirm_finish');
            }, function (err) {
              $log.error(err);
            });
          };
          var promise = $interval(refreshData, 1000);
          $scope.$on('$destroy', function () {
            if (angular.isDefined(promise)) {
              $interval.cancel(promise);
              promise = undefined;
            }
          });
        }
      }
    };

//处理其他订单----------------------------------------------------------------------
    $scope.goBackToDash = function () {
      $state.go('main.dash', {}, {reload: true});
    };

  }])
;
