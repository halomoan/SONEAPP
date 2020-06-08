// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular
  .module("ServiceONE", [
    "ngCordova",
    "ionic",
    "ServiceONE.controllers",
    "ServiceONE.services",
    "angular-cache",
    "ionic-zoom-view",
  ])

  .run(function (
    $ionicPlatform,
    $rootScope,
    $ionicPopup,
    $state,
    $ionicHistory,
    $cordovaDevice,
    $ionicLoading,
    AuthenticationService,
    ServiceONEApi
  ) {
    $ionicPlatform.ready(function () {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)

      /*if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    */
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      if (window.cordova && cordova.plugins.backgroundMode) {
        // Android customization
        cordova.plugins.backgroundMode.setDefaults({
          title: "ServiceONE",
          text: "Running In Background",
          silent: false,
        });
        /* cordova.plugins.backgroundMode.configure({
         silent: false
         });*/

        // Enable background mode
        cordova.plugins.backgroundMode.enable();

        // Called when background mode has been activated
        cordova.plugins.backgroundMode.on("activate", function () {
          cordova.plugins.backgroundMode.disableWebViewOptimizations();
          /*setTimeout(function () {
            // Modify the currently displayed notification
            cordova.plugins.backgroundMode.configure({
              text: "Running in background for more than 5s now.",
            });
          }, 5000);
          */
        });
      }
    });

    $ionicPlatform.registerBackButtonAction(function () {
      // A confirm dialog

      if ($state.current.name === "app.myworks") {
        $rootScope.dontAskExit = false;
      } else {
        $rootScope.dontAskExit = true;
      }

      if ($rootScope.dontAskExit) {
        //$rootScope.dontAskExit = false;
        if ($rootScope.GoBack) {
          switch ($state.current.name) {
            case "app.incidentform":
              $ionicHistory.goBack();
              $ionicHistory.nextViewOptions({
                disableBack: true,
              });
              break;
            default:
              $ionicHistory.nextViewOptions({
                disableBack: true,
              });
              $state.go("app.myworks");
              break;
          }
        }
        $rootScope.GoBack = true;
        return;
      } /* else {
        $rootScope.dontAskExit = false;
      }*/

      var confirmPopup = $ionicPopup.confirm({
        title: "Exit This Application",
        template: "Are you sure to end this application?",
      });

      confirmPopup.then(function (res) {
        if (res) {
          cordova.plugins.backgroundMode.disable();
          navigator.app.exitApp();
        }
      });
    }, 100);

    $rootScope.$on("$stateChangeStart", function (
      event,
      toState,
      toParams,
      fromState,
      fromParams
    ) {
      //console.log(toState.access.requiredLogin, AuthenticationService.isLogged);
      if (toState.access.requiredLogin && !AuthenticationService.isLogged) {
        event.preventDefault();
        $state.go("app.login");
      }
      return false;
    });

    $rootScope.$on("$stateChangeSuccess", function (
      event,
      toState,
      toParams,
      fromState,
      fromParams
    ) {
      if (
        fromState.name != "app.myworkitems" &&
        toState.name == "app.myworks"
      ) {
        ServiceONEApi.setRefreshMonitorWO(true);
      }
    });

    $rootScope.$on("loading:show", function () {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner>',
        showBackdrop: true,
      });
    });

    $rootScope.$on("loading:hide", function () {
      $ionicLoading.hide();
    });

    $rootScope.conn = null;
  })

  //.config(function($stateProvider, $urlRouterProvider) {
  .config(function (
    $httpProvider,
    $stateProvider,
    $urlRouterProvider,
    $ionicConfigProvider,
    CacheFactoryProvider
  ) {
    $httpProvider.defaults.timeout = 5000;

    $ionicConfigProvider.backButton.text("").icon("ion-ios7-arrow-left");
    $ionicConfigProvider.tabs.position("bottom"); // other values: top
    angular.extend(CacheFactoryProvider.defaults, { maxAge: Number.MAX_VALUE });

    //Define Custom Function

    function twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    }

    Date.prototype.toMysqlFormat = function () {
      return (
        this.getFullYear() +
        "-" +
        twoDigits(1 + this.getMonth()) +
        "-" +
        twoDigits(this.getDate()) +
        " " +
        twoDigits(this.getHours()) +
        ":" +
        twoDigits(this.getMinutes()) +
        ":" +
        twoDigits(this.getSeconds())
      );
    };

    Date.prototype.yyyymmdd = function () {
      var yyyy = this.getFullYear().toString();
      var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd = this.getDate().toString();
      return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
    };

    Date.prototype.ddmmyyhhMMss = function () {
      var yyyy = this.getFullYear().toString();
      var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
      var dd = this.getDate().toString();
      var hh = this.getHours().toString();
      var MM = this.getMinutes().toString();
      var ss = this.getSeconds().toString();

      return (
        (dd[1] ? dd : "0" + dd[0]) +
        "/" +
        (mm[1] ? mm : "0" + mm[0]) +
        "/" +
        yyyy +
        " " +
        (hh[1] ? hh : "0" + hh) +
        ":" +
        (MM[1] ? MM : "0" + MM) +
        ":" +
        (ss[1] ? ss : "0" + ss)
      ); // padding
    };

    String.prototype.toHHMMSS = function () {
      var sec_num = parseInt(this, 10); // don't forget the second param
      var hours = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - hours * 3600) / 60);
      var seconds = sec_num - hours * 3600 - minutes * 60;

      if (hours < 10) {
        hours = "0" + hours;
      }
      if (minutes < 10) {
        minutes = "0" + minutes;
      }
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      var time = hours + ":" + minutes + ":" + seconds;
      return time;
    };

    String.prototype.toHHMM = function () {
      var mins_num = parseInt(this, 10); // don't forget the second param
      if (mins_num < 0) return "";
      var hours = Math.floor(mins_num / 60);
      var minutes = Math.floor(mins_num % 60);
      var days = Math.floor(hours / 24);
      var time;
      if (hours == 0) {
        if (minutes < 10) {
          time = "0" + minutes + " min";
        } else {
          time = minutes + " mins";
        }
      } else if (hours < 23) {
        if (hours < 10) {
          hour = "0" + hours + " hr";
        } else {
          hour = hours + " hrs";
        }

        if (minutes < 10) {
          minute = "0" + minutes + " min";
        } else {
          minute = minutes + " mins";
        }
        time = hour + ":" + minute;
      } else {
        if (days == 1) {
          time = days + " day";
        } else {
          time = days + " days";
        }
      }

      return time;
    };

    $stateProvider

      .state("app", {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: "AppCtrl",
      })

      .state("app.myinfo", {
        url: "/myinfo",
        cache: false,
        views: {
          menuContent: {
            templateUrl: "templates/whoami.html",
            controller: "whoamiCtrl",
          },
        },
        access: { requiredLogin: true },
      })
      .state("app.login", {
        url: "/login",
        cache: false,
        views: {
          menuContent: {
            templateUrl: "templates/login.html",
            controller: "loginCtrl",
          },
        },
        data: {
          status: "logout",
        },
        access: { requiredLogin: false },
      })

      .state("app.mworks", {
        url: "/mworks",
        cache: false,
        views: {
          menuContent: {
            templateUrl: "templates/monitorworks.html",
            controller: "MonitorWorkOrdersCtrl",
          },
        },
        access: { requiredLogin: true },
      })

      .state("app.mworkitems", {
        url: "/mworkitems/:OrderNo",
        views: {
          menuContent: {
            templateUrl: "templates/monitorworkitems.html",
            controller: "MonitorWorkItemsCtrl",
          },
        },
        access: { requiredLogin: true },
      })

      .state("app.myworks", {
        url: "/myworks",
        views: {
          menuContent: {
            templateUrl: "templates/myworks.html",
            controller: "MyWorkOrdersCtrl",
          },
        },
        access: { requiredLogin: true },
      })

      .state("app.myworkitems", {
        url: "/myworkitems/:OrderNo",
        views: {
          menuContent: {
            templateUrl: "templates/myworkitems.html",
            controller: "MyWorkItemsCtrl",
          },
        },
        access: { requiredLogin: true },
      })

      .state("app.incidentlist", {
        url: "/incidentlist",
        views: {
          menuContent: {
            templateUrl: "templates/incidentList.html",
            controller: "IncidentListCtrl",
          },
        },
        access: { requiredLogin: true },
      })
      .state("app.incidentform", {
        url: "/incidentform/:IncidentGroupID:/:IncidentIcon/:IncidentText",
        views: {
          menuContent: {
            templateUrl: "templates/incidentForm.html",
            controller: "IncidentFormCtrl",
          },
        },
        access: { requiredLogin: true },
      })
      .state("app.logout", {
        url: "/logout",
        cache: false,
        views: {
          menuContent: {
            controller: "loginCtrl",
          },
        },
        data: {
          status: "logout",
        },
        access: { requiredLogin: true },
      })
      .state("app.dialog", {
        url: "/dialog",
        views: {
          menuContent: {
            templateUrl: "templates/dialog.html",
            controller: "DialogCtrl",
          },
        },
        access: { requiredLogin: false },
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise("/app/login");
    $httpProvider.interceptors.push("AuthInterceptor");
  })

  .directive("customSelect", [
    "$ionicModal",
    "$ionicPopup",
    "$timeout",
    "ServiceONEApi",
    function ($ionicModal, $ionicPopup, $timeout, ServiceONEApi) {
      return {
        restrict: "E",

        scope: {
          items: "=" /* Items list is mandatory */,
          text: "=" /* Displayed text is mandatory */,
          value: "=" /* Selected value binding is mandatory */,
          resource: "=",
          resparam: "=",
          callback: "&",
        },
        templateUrl: "templates/incidentSelect.html",
        link: function (scope, element, attrs) {
          /* Default values */
          scope.multiSelect = attrs.multiSelect === "true" ? true : false;
          scope.allowEmpty = attrs.allowEmpty === "false" ? false : true;

          /* Header used in ion-header-bar */
          scope.headerText = attrs.headerText || "";

          /* Text displayed on label */
          // scope.text          = attrs.text || '';
          // scope.defaultText   =  scope.text || '';

          /* Notes in the right side of the label */
          scope.noteText = attrs.noteText || "";
          scope.noteImg = attrs.noteImg || "";
          scope.noteImgClass = attrs.noteImgClass || "";
          scope.filterText = {};
          scope.backColor = scope.headerText == "Priorities" ? 1 : 0;

          scope.page = 1;
          scope.limit = 20;
          scope.doingSearch = false;
          scope.noMoreItemsAvailable = false;
          scope.notFound = false;
          scope.isLoading = false;

          scope.loadMore = function () {
            scope.notFound = false;

            if (scope.resource == undefined) {
              scope.noMoreItemsAvailable = true;
              scope.$broadcast("scroll.infiniteScrollComplete");
            } else {
              if (scope.isLoading) {
                return;
              }
              if (scope.page == 1) {
                scope.items = [];
              }
              scope.isLoading = true;
              ServiceONEApi.getSelectItems(
                scope.resource,
                scope.resparam,
                scope.page,
                scope.limit
              ).then(function (items) {
                if (items.length < scope.limit) {
                  scope.noMoreItemsAvailable = true;
                  scope.$broadcast("scroll.infiniteScrollComplete");
                }

                scope.page++;
                scope.items = scope.items.concat(items);
                scope.$broadcast("scroll.infiniteScrollComplete");
                scope.$broadcast("scroll.refreshComplete");
                scope.isLoading = false;
              });
            }
          };

          $timeout(function () {
            element[0].focus();
          }, 1000);

          /* Optionnal callback function */
          //scope.callback = attrs.callback || null;

          $ionicModal
            .fromTemplateUrl("templates/incidentSelectItems.html", {
              scope: scope,
            })
            .then(function (modal) {
              scope.modal = modal;
            });
          scope.validate = function (event) {
            // Hide modal
            scope.notFound = false;
            scope.hideItems();

            /*// Execute callback function
                        if (typeof scope.callback == 'function') {

                        }*/
          };

          /* Show list */
          scope.showItems = function (event) {
            event.preventDefault();
            scope.notFound = false;
            scope.modal.show();

            if (scope.resource) {
              //scope.page = 1;
              scope.noMoreItemsAvailable = false;
              scope.loadMore();
            }
          };

          /* Hide list */
          scope.hideItems = function () {
            for (var i in scope.items) {
              if (scope.items[i].checked) {
                if (typeof scope.callback == "function") {
                  scope.callback({ action: "add", item: scope.items[i] });
                }
              } else {
                if (typeof scope.callback == "function") {
                  scope.callback({ action: "remove", item: scope.items[i] });
                }
              }
            }

            scope.modal.hide();
          };

          /* Destroy modal */
          scope.$on("$destroy", function () {
            scope.modal.remove();
          });

          /* Validate single with data */
          scope.validateSingle = function (item) {
            scope.notFound = false;
            scope.text = item.text;
            if (scope.headerText != "Priorities") {
              scope.backColor = 1;
            } else {
              if (scope.text == "Important" || scope.text == "Very Important") {
                scope.backColor = 2;
              } else {
                scope.backColor = 1;
              }
            }

            // Hide items
            /*scope.hideItems();*/
            scope.modal.hide();
            // Execute callback function

            if (typeof scope.callback == "function") {
              scope.callback({ item: item });
            }
          };

          scope.pullToRefresh = function () {
            scope.page = 1;
            scope.noMoreItemsAvailable = false;
            scope.items = [];
            scope.loadMore();
          };

          scope.searchItems = function () {
            scope.notFound = false;
            var myPopup = $ionicPopup.show({
              template:
                '<input type="text" ng-init="filterText.text=\'\'" ng-model="filterText.text" autofocus>',
              title: "Search For " + scope.headerText,
              subTitle: "Type any word to search",
              scope: scope,
              buttons: [
                { text: "Cancel" },
                {
                  text: "<b>Search</b>",
                  type: "button-positive",
                  onTap: function (e) {
                    if (!scope.filterText.text) {
                      e.preventDefault();
                      myPopup.close();
                    } else {
                      return scope.filterText.text;
                    }
                  },
                },
              ],
            });
            myPopup.then(function (res) {
              if (res) {
                var count = 0;
                scope.noMoreItemsAvailable = true;

                scope.items = _(scope.items)
                  .forEach(function (item) {
                    //console.log(item.text.toLowerCase().indexOf(res.toLowerCase()));
                    if (
                      item.text.toLowerCase().indexOf(res.toLowerCase()) != -1
                    ) {
                      item.show = true;
                      count++;
                    } else {
                      item.show = false;
                    }
                  })
                  .value();

                if (count == 0) {
                  scope.doingSearch = true;
                  ServiceONEApi.searchSelectItem(
                    scope.resource,
                    scope.resparam,
                    res.toLowerCase()
                  ).then(function (data) {
                    //scope.items = scope.items.concat(data);

                    scope.doingSearch = false;
                    scope.items = data;

                    if (scope.items.length < 1) {
                      scope.notFound = true;
                    }
                  });
                }
              } else {
                scope.items = _(scope.items)
                  .forEach(function (item) {
                    item.show = true;
                  })
                  .value();
              }
            });
          };
        },
      };
    },
  ])
  .constant("appInfo", {
    appName: "ServiceONE",
    appVersion: "2.0",
    creator: "Halomoan Kasim",
  })
  .value("config", {
    //serverBaseURL: "http://localhost:8100",
    //serverBaseURL: "http://192.168.23.151/ServiceONE/index.php",
    serverBaseURL: "http://amber.uol.com.sg:8096/serviceone/index.php",
    socketBaseURL: "http://192.168.23.151:3700",
  });
