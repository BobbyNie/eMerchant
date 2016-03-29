"use strict";
angular.module("$dwr")
  .service("QrCodeIntf", ["$dwr", function (dwr) {
    var p = this;
    (function () {
      if (dwr.engine._getObject("QrCodeIntf") == undefined) {

        p = {};
        var cn = "QrCodeIntf";
        p.getCustInfoByQrCodeId = function(p0, cb) {
          return dwr.$qcall.call(p,cn,'getCustInfoByQrCodeId', arguments,cb);
        };
        p.getCustInfoByQrCodeId.className = cn;
        p.getCustInfoByQrCodeId.methodName = "getCustInfoByQrCodeId";
        p.updateQrCodeTable = function(p0, p1, cb) {
          return dwr.$qcall.call(p,cn,'updateQrCodeTable', arguments,cb,true);
        };
        p.updateQrCodeTable.className = cn;
        p.updateQrCodeTable.methodName = "updateQrCodeTable";
        p.insertOneMasterOrderRecord = function(p0, p1, cb) {
          return dwr.$qcall.call(p,cn,'insertOneMasterOrderRecord', arguments,cb);
        };
        p.insertOneMasterOrderRecord.className = cn;
        p.insertOneMasterOrderRecord.methodName = "insertOneMasterOrderRecord";
        p.getThisOrderStatus = function(p0, cb) {
          return dwr.$qcall.call(p,cn,'getThisOrderStatus', arguments,cb,true);
        };
        p.getThisOrderStatus.className = cn;
        p.getThisOrderStatus.methodName = "getThisOrderStatus";
        p.getThisOrderInfo = function(p0, cb) {
          return dwr.$qcall.call(p,cn,'getThisOrderInfo', arguments,cb,true);
        };
        p.getThisOrderInfo.className = cn;
        p.getThisOrderInfo.methodName = "getThisOrderInfo";
        p.orderCanceledbyStore = function(p0, cb) {
          return dwr.$qcall.call(p,cn,'orderCanceledbyStore', arguments,cb,true);
        };
        p.orderCanceledbyStore.className = cn;
        p.orderCanceledbyStore.methodName = "orderCanceledbyStore";
        p.getOrderPayResult = function(p0, cb) {
          return dwr.$qcall.call(p,cn,'getOrderPayResult', arguments,cb,true);
        };
        p.getOrderPayResult.className = cn;
        p.getOrderPayResult.methodName = "getOrderPayResult";
        p.TestQrCodeFunc = function(p0, p1, cb) {
          return dwr.$qcall.call(p,cn,'TestQrCodeFunc', arguments,cb);
        };
        p.TestQrCodeFunc.className = cn;
        p.TestQrCodeFunc.methodName = "TestQrCodeFunc";

        dwr.engine._setObject("QrCodeIntf", p);
      }
    })();
    return p;
  }]);
