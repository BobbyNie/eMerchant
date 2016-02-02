controllers.controller('MyCtrl', ['$scope', '$state', '$ionicPopup', '$timeout', '$cordovaAppVersion', '$ionicLoading', '$cordovaFileTransfer', '$cordovaFile', '$cordovaFileOpener2', 'AuthService', 'ENV',
      function($scope, $state, $ionicPopup, $timeout, $cordovaAppVersion, $ionicLoading,$cordovaFileTransfer, $cordovaFile, $cordovaFileOpener2, AuthService, ENV) {
  $scope.logout = function() {
    AuthService.logout();
    $state.go('login');
  };

  $scope.appVersion = ENV.version;

  $scope.checkUpdate = function() {
    var serverAppVersion = "0.1.0"; //从服务端获取最新版本
    //获取版本
    $cordovaAppVersion.getAppVersion().then(function (version) {
      //如果本地与服务端的APP版本不符合
      if (version != serverAppVersion) {
        showUpdateConfirm();
      }
    });
  };

  // 显示是否更新对话框
  function showUpdateConfirm() {
    var confirmPopup = $ionicPopup.confirm({
      title: '版本升级',
      template: '1.更新BUG1;</br>2.更新BUG2;</br>3.更新BUG3;</br>4.添加功能4', //从服务端获取更新的内容
      cancelText: '取消',
      okText: '升级'
    });
    confirmPopup.then(function (res) {
      if (res) {
        $ionicLoading.show({
          template: "已经下载：0%"
        });
        var url = "http://192.168.1.50/1.apk"; //可以从服务端获取更新APP的路径
        var targetPath = "file:///storage/sdcard0/Download/1.apk"; //APP下载存放的路径，可以使用cordova file插件进行相关配置
        var trustHosts = true;
        var options = {};
        $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function (result) {
          // 打开下载下来的APP
          $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive'
          ).then(function () {
            // 成功
          }, function (err) {
            // 错误
          });
          $ionicLoading.hide();
        }, function (err) {
          alert('下载失败');
        }, function (progress) {
          //进度，这里使用文字显示下载百分比
          $timeout(function () {
            var downloadProgress = (progress.loaded / progress.total) * 100;
            $ionicLoading.show({
              template: "已经下载：" + Math.floor(downloadProgress) + "%"
            });
            if (downloadProgress > 99) {
              $ionicLoading.hide();
            }
          })
        });
      } else {
        // 取消更新
      }
    });
  }

}]);


