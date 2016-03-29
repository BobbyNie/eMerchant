'use strict';
app.controller('MyCtrl', ['$rootScope','$scope', '$state', '$ionicPopup', '$timeout', '$cordovaAppVersion', '$ionicLoading', '$cordovaFileTransfer', '$cordovaFile', '$cordovaEmailComposer', 'AuthService', 'HsTrStoreDetailManager', 'ENV', '$log',
  function ($rootScope, $scope, $state, $ionicPopup, $timeout, $cordovaAppVersion, $ionicLoading, $cordovaFileTransfer, $cordovaFile, $cordovaEmailComposer, AuthService, HsTrStoreDetailManager, ENV, $log) {
    $scope.logout = function () {
      AuthService.logout();
      $state.go('login');
    };

//------------------------------------------------------------------
//检查版本更新

    $scope.appVersion = ENV.version;
    $scope.checkUpdate = function () {
      checkUpdate();
    };
    function checkUpdate() {

      var deploy = new Ionic.Deploy();
      // Update app code with new release from Ionic Deploy
      console.log('Ionic Deploy: Checking for updates');
      deploy.check().then(function(hasUpdate) {
        console.log('Ionic Deploy: Update available: ' + hasUpdate);
        if(hasUpdate){
          //有更新，获取更新信息
          HsTpVersionControlManager.getNewestVersion().then(function(data){
            if (data != null && data.res == true) {
              //获取到版本信息的PropmtUp
              $ionicPopup.confirm({
                title: '版本升级 v' + data.data[0].version,
                template: data.data[0].updateInfo, //从服务端获取更新的内容
                cancelText: '取消',
                okText: '升级',
                cssClass: 'custom-popup' // this was the solve
              }).then(function (res) {
                if (res) {
                  processUpdate(deploy);
                } else {
                  console.log('取消更新');
                }
              });
            } else {
              //获取不到版本信息的PromptUp
              $ionicPopup.confirm({
                title: '版本升级',
                template: '有新版本可以升級！', //从服务端获取更新的内容
                cancelText: '取消',
                okText: '升级',
                cssClass: 'custom-popup' // this was the solve
              }).then(function (res) {
                if (res) {
                  processUpdate(deploy);
                } else {
                  console.log('取消更新');
                }
              });
            }
          },function(err){
            //获取不到版本信息的PromptUp
            $ionicPopup.confirm({
              title: '版本升级',
              template: '有新版本可以升級！', //从服务端获取更新的内容
              cancelText: '取消',
              okText: '升级',
              cssClass: 'custom-popup' // this was the solve
            }).then(function (res) {
              if (res) {
                processUpdate(deploy);
              } else {
                console.log('取消更新');
              }
            });
          })
        }
      }, function(err) {
        console.error('Ionic Deploy: Unable to check for updates', err);
      });
    }

    function processUpdate(deploy){
      $ionicLoading.show({
        template: "開始下載：0%"
      });
      deploy.update().then(function(res) {
        console.log('Ionic Deploy: Update Success! ', res);
      }, function(err) {
        console.log('Ionic Deploy: Update error! ', err);
      }, function(prog) {
        console.log('Ionic Deploy: Progress... ', prog);
        $ionicLoading.show({
          template: "正在下載：" + Math.floor(prog) + "%"
        });
        if (prog > 99) {
          $ionicLoading.hide();
        }
      });
    };

//------------------------------------------------------------------
//意见反馈

    $scope.feedback = function () {

      $cordovaEmailComposer.isAvailable().then(function () {
        //console.log('available')
        var email = {
          to: 'webmaster@mc.icbc.com.cn',
          //cc: 'tatolu@mc.icbc.com.cn',
          //bcc: ['potato_Ly@163.com', 'tatolu@mc.icbc.com.cn'],
          subject: '意見反饋',
          body: '請填寫您的反饋意見',
          isHtml: true
        };
        $cordovaEmailComposer.open(email).then(null, function () {
          console.log('canceled email');
        });
      }, function () {
        //console.log('not available');
        $ionicPopup.alert({
          title: "意見反饋",
          template: "請先設置本機的電子郵件賬號",
          okText: "OK",
          cssClass: 'custom-popup' // this was the solve
        });
      });
    };
//AppInBrowser------------------------------------------------------------------------
    $scope.appInBrowser = function(){
      window.open('http://baidu.com', '_blank', 'location=yes');

    }


//-------------------------------------------------------------------------------------
    //通知声音
    $scope.settingsChange = function(){
      $rootScope.openNoticeSound = !$rootScope.openNoticeSound;
    };

//-------------------------------------------------------------------------------------
    //获取用户信息
    if(!$rootScope.storeId){
      HsTrStoreDetailManager.getHsTrStoreDetailByUser().then(function (succ) {
        if (succ != null && succ.res == true) {
          $rootScope.storeId = succ.data.storeId;
          $rootScope.storeNameCn = succ.data.storeNameCn;
        } else {
          $log.error(succ);
        }
      }, function (err) {
        $log.error(err);
      });
    }
//-------------------------------------------------------------------------------------------------
  }]);

//-------------------------------------------------------------------------------------
//隐藏TabBar directive
app.directive('hideTabBar', function ($timeout) {
  var style = angular.element('<style>').html(
    '.has-tabs.no-tabs:not(.has-tabs-top) { bottom: 0; }\n' +
    '.no-tabs.has-tabs-top { top: 44px; }');
  document.body.appendChild(style[0]);
  return {
    restrict: 'A',
    compile: function (element, attr) {
      var tabBar = document.querySelector('.tab-nav');
      return function ($scope, $element, $attr) {
        var scroll = $element[0].querySelector('.scroll-content');
        $scope.$on('$ionicView.beforeEnter', function () {
          tabBar.classList.add('slide-away');
          scroll.classList.add('no-tabs');
        });
        $scope.$on('$ionicView.beforeLeave', function () {
          tabBar.classList.remove('slide-away');
          scroll.classList.remove('no-tabs')
        });
      }
    }
  };
});


