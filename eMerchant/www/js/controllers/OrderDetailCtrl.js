'use strict';
app.controller('orderDetailCtrl', ['$scope', '$state', '$stateParams', 'HsTrMasterOrderManager','$log',
    function ($scope, $state,$stateParams, HsTrMasterOrderManager,$log) {
        $scope.orderId = $stateParams.orderId;
        HsTrMasterOrderManager.findHsTrMasterOrderByOrderId($stateParams.orderId).then(function succ(data){
            //var data =  (function(){return {"authErr":false,"data":{"addFeeAmount":0,"addFeeRate":0,"addr":"香港 九龙 六头角","cardId":"622100121252452521405","costAmount":123,"courierAmount":23,"courierId":"01001","courierType":"1","createDate":"new Date(1456070400000)","currency":"MOP","custId":"100","discountAmount":23,"extAmount":0,"invoiceTitle":"发票抬头","orderId":"123","orderStatus":"01","orderStatusDisplay":"待付款","orderType":"1","payId":"12","payType":"1","realAmount":111,"remark":"测试","sendTime":"1129","storeId":"100","updateDate":"new Date(1456070400000)","updateId":"100","viewsuborderList":[{"createDate":"new Date(1456070400000)","currency":"MOP","discountId":"001","goodsId":null,"goodsIntroduceCn":null,"goodsIntroduceEn":null,"goodsNameCn":null,"goodsNameEn":null,"imgUrl":null,"orderId":"123","quantity":2,"storeId":"1","subOrderId":"001","subProId":"1","unitPrice":12},{"createDate":"new Date(1456070400000)","currency":"MOP","discountId":"001","goodsId":null,"goodsIntroduceCn":null,"goodsIntroduceEn":null,"goodsNameCn":null,"goodsNameEn":null,"imgUrl":null,"orderId":"123","quantity":2,"storeId":"1","subOrderId":"002","subProId":"1","unitPrice":13}]},"errMsg":null,"res":true,"trace":null};})();
            if(data.res == true){
                $scope.data = data.data;
            }else{
                $log.debug(data);
            }
        },function err(data){
            $log.debug(data);
        });
    }]);
