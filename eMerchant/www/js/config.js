"use strict";
var app = angular.module('eMerchant', ['ionic','ionic.service.core', 'ionic.service.analytics', 'ngMockE2E', 'ngCordova','$dwr','angular.filter']);

app.constant('DEV', false);
app.constant("ENV", {
  name: "eMerchant",
  accessToken: '',
  debug: false,
  appleId: 'xxxx',
  version:'1.1'
})

    .constant('AUTH_EVENTS', {
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })
    .constant('USER_ROLES', {
        admin: 'admin_role',
        public: 'public_role'
    })
    .constant('DWR_SETTINGS', {
//        WEB_ROOT: 'http://192.168.11.38:8080/icbc/mo/emerchant/'
      WEB_ROOT: 'http://202.175.59.29:38080/icbc/mo/emerchant'
    });
