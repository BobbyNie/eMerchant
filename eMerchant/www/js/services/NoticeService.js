'use strict';
app.factory('NoticeService', ['QrCodeIntf', '$rootScope', '$interval', '$cordovaNativeAudio', '$log', function (QrCodeIntf, $rootScope, $interval, $cordovaNativeAudio, $log) {
  var payResult = null;
  var closeNotice = false;
  var iconType = 'ion-help-circled';
  var updatePayStatus = false;

  return {

    all: function () {
      var refreshData = function () {
        if ($rootScope.pollOrderList.length == 0) {
          $interval.cancel(promise);
        }

        QrCodeIntf.getOrderPayResult($rootScope.pollOrderList).then(function (succ) {
          if (succ != null && succ.res == true) {
            if (succ.data != null) {
              for (var i = 0; i < succ.data.length; i++) {
                switch (succ.data[i].orderStatus) {
                  case "09":
                  case "19":
                  case "29":
                    payResult = "支付失败";
                    iconType = 'ion-close-circled';
                    updatePayStatus = true;
                    break;
                  case "31":
                    payResult = "支付成功";
                    iconType = 'ion-ios-checkmark';
                    updatePayStatus = true;
                    break;
                }

                if (updatePayStatus) {
                  for (var j = 0; j < $rootScope.pollOrderList.length; j++) {
                    if (succ.data[i].orderId == $rootScope.pollOrderList[j]) {
                      for(var k = 0; k < $rootScope.notices.length; k++){
                        if($rootScope.notices[k].orderId == succ.data[i].orderId){
                          $rootScope.notices[k].realAmount = succ.data[i].realAmount / 100;
                          $rootScope.notices[k].updateDate = succ.data[i].updateDate;
                          $rootScope.notices[k].payResult = payResult;
                          $rootScope.notices[k].iconType = iconType;
                        }
                      }
                      $rootScope.unreadNoticeCount++;
                      $rootScope.pollOrderList.splice(j, 1);

                      if($rootScope.openNoticeSound){
                        $cordovaNativeAudio.preloadSimple('beep', 'media/beep.wav').then(function (msg) {
                          $cordovaNativeAudio.play('beep');
                        }, function (error) {
                          console.error(error);
                        });
                      }
                    }
                  }
                  updatePayStatus = false;
                }
              }
            } else {
              $log.error(succ);
            }
          }
        }, function (err) {
          $log.error(err);
        });
      };

      var promise = $interval(refreshData, 5000);//设置每5秒轮询一次

      if (closeNotice) {
        $interval.cancel(promise);
      }

      return $rootScope.notices;
    },
    setUnreadNoticeCount: function (count) {
      $rootScope.unreadNoticeCount = count;
    },
    closeNotice: function () {
      closeNotice = true;
    },
    remove: function (notice) {
      $rootScope.notices.splice($rootScope.notices.indexOf(notice), 1);
    },
    get: function (noticeId) {
      for (var i = 0; i < notices.length; i++) {
        if ($rootScope.notices[i].id == parseInt(noticeId)) {
          return $rootScope.notices[i];
        }
      }
      return null;
    }
  };
}]);
