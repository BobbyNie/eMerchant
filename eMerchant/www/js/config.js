var app = angular.module('eMerchant', ['ionic', 'eMerchant.config', 'eMerchant.controllers', 'eMerchant.services', 'ngMockE2E', 'ngCordova']);
var controllers = angular.module('eMerchant.controllers', []);
var services = angular.module('eMerchant.services', []);
var config = angular.module('eMerchant.config', []);



config.constant('DEV', false);
config.constant("ENV", {
  name: "eMerchant",
  accessToken: '',
  debug: false,
  appleId: 'xxxx',
  version:'0.0.1'
})

config.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})

config.constant('USER_ROLES', {
  admin: 'admin_role',
  public: 'public_role'
});
