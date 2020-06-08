angular
  .module("ServiceONE.controllers", [])

  .controller("AppCtrl", function (
    $scope,
    $rootScope,
    $ionicModal,
    ServiceONEApi
  ) {
    /*
        $scope.$watchCollection(
            function(){
                return ServiceONEApi.getIsMyWOCountChanged();
            },
            function(newVal,oldVal){
                ServiceONEApi.setMyWOCountChanged(false);
                $scope.myWorkOrdersCount = ServiceONEApi.getMyWOCount();
            }
        )
*/
    $rootScope.$on("updateBadge", function () {
      $scope.myWorkOrdersCount = ServiceONEApi.getMyWOCount();
    });
    $scope.isLeader = function () {
      return ServiceONEApi.getIsLeader();
    };

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});
    /*
  // Form data for the login modal
  $scope.loginData = {};


  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/mlogin.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      //$scope.closeLogin();
        //ServiceONEApi.getMyWorkOrders();

    }, 1000);
  };
*/
  })

  .controller("loginCtrl", function (
    $scope,
    $ionicPopup,
    $ionicHistory,
    $cordovaDevice,
    $cordovaVibration,
    $rootScope,
    $state,
    $window,
    $cordovaDialogs,
    ServiceONEApi,
    config,
    UserService,
    AuthenticationService
  ) {
    function alertMesage(m_id, m_soneid, m_text) {
      var arr_id = ServiceONEApi.getMSGIDARRAY();

      if (m_soneid != undefined && m_soneid == ServiceONEApi.getSONEID()) {
        ServiceONEApi.getMyWorkOrders(true).then(function (data) {
          $scope.myWorkOrders = data;

          if (data && data.length < 1) {
            $scope.loadingStatus = "Currently There is No Work Order.";
          } else {
            $rootScope.$broadcast("updateBadge");
            $rootScope.$broadcast("updateMyWO");
          }
        });
        if (!window.cordova) {
          if (arr_id.indexOf(m_id) === -1) {
            ServiceONEApi.setMSGIDARRAY(m_id);
            alert(m_text);
          }
        } else {
          if (cordova.plugins.backgroundMode.isActive()) {
            if (arr_id.indexOf(m_id) == -1) {
              ServiceONEApi.setMSGIDARRAY(m_id);
              cordova.plugins.backgroundMode.configure({
                title: "ServiceONE",
                text: m_text,
              });
              navigator.notification.alert(
                m_text, // message
                "", // title
                "New Work Order!" // buttonName
              );
              navigator.notification.beep(1);
              $cordovaVibration.vibrate(100);
            }
          } else {
            try {
              if (arr_id.indexOf(m_id) == -1) {
                ServiceONEApi.setMSGIDARRAY(m_id);
                $cordovaDialogs.alert(m_text, "New Work Order!");
                navigator.notification.beep(1);
                $cordovaVibration.vibrate(100);
              }
            } catch (e) {
              alert(m_text);
            }
          }
        }
        return true;
      }
      return false;
    }

    function getOnline(soneid, mygroup) {
      if (!$rootScope.conn) {
        $rootScope.conn = io.connect(config.socketBaseURL, { forceNew: true });
        $rootScope.conn.on("connect", function (data) {
          $rootScope.conn.on("disconnect", function () {});

          $rootScope.conn.on("message", function (message) {
            var m_type;
            var m_soneid;

            try {
              data = JSON.parse(message);
              m_type = data.type;
              m_soneid = data.soneid;
              if (ServiceONEApi.getSONEID() == m_soneid) {
                switch (m_type) {
                  case "MSG":
                    var m_id = data.id;
                    var m_text = data.text;

                    if (alertMesage(m_id, m_soneid, m_text)) {
                      $rootScope.conn.emit("msg_ack", {
                        taskid: m_id,
                        soneid: m_soneid,
                      });
                    }
                    break;
                  case "RFR":
                    var m_id = data.id;
                    ServiceONEApi.deleteWorkOrder(m_id);
                    $rootScope.conn.emit("rfr_ack", {
                      taskid: m_id,
                      soneid: m_soneid,
                    });
                    break;
                  case "ESC":
                    var m_id = data.id;
                    var m_task_id = data.task_id;
                    var m_incident_id = data.incident_id;
                    ServiceONEApi.updEscalatedWO(m_task_id, m_incident_id);
                    $rootScope.conn.emit("esc_ack", {
                      taskid: m_id,
                      soneid: m_soneid,
                      incidents: m_incident_id,
                    });
                    break;
                }
              }
            } catch (e) {
              //console.log(e);
              m_id = "0";
              m_text = message;
            }
          });

          $rootScope.conn.emit("subscribe", { group: mygroup, soneid: soneid });
        });
      }
    }

    function getOffline() {
      if ($rootScope.conn) {
        $rootScope.conn.disconnect();
        $rootScope.conn = null;
      }
    }

    $scope.UUID = ServiceONEApi.getUUID();

    document.addEventListener(
      "deviceready",
      function () {
        $scope.UUID = $cordovaDevice.getUUID();
      },
      false
    );

    $scope.doLogin = function (soneid) {
      if (soneid != undefined) {
        $rootScope.$broadcast("loading:show");

        UserService.login(soneid, ServiceONEApi.getUUID())
          .success(function (data) {
            if (data.status && data.status == "success" && data.usertype) {
              AuthenticationService.isLogged = true;
              $window.sessionStorage.token = data.token;
              ServiceONEApi.login();
              ServiceONEApi.setUserInfo(soneid, data);
              $ionicHistory.nextViewOptions({
                disableBack: true,
              });

              if (window.cordova && cordova.plugins.backgroundMode) {
                cordova.plugins.backgroundMode.enable();
              }

              getOnline(soneid, data.group);
              $state.go("app.myworks");
            } else {
              AuthenticationService.isLogged = false;
              delete $window.sessionStorage.token;
              var alertPopup = $ionicPopup.alert({
                title: "Login failed!",
                template: "Please check your serviceONE ID!",
              });
            }
            $rootScope.$broadcast("loading:hide");
          })
          .error(function (status, data) {
            $rootScope.$broadcast("loading:hide");
            AuthenticationService.isLogged = false;
            delete $window.sessionStorage.token;

            var alertPopup = $ionicPopup.alert({
              title: "Login failed!",
              template: "Please check your credentials!",
            });
          })
          .finally(function () {
            $rootScope.$broadcast("loading:hide");
          });
      }
    };

    if ($state.current.data.status == "logout") {
      if (AuthenticationService.isLogged) {
        var confirmPopup = $ionicPopup.confirm({
          title: "Logout",
          template: "Are you sure want to logout?",
          cancelText: "Cancel",
          okText: "Yes",
        });
        confirmPopup.then(function (res) {
          if (res) {
            $rootScope.$broadcast("loading:show");
            var uuid = ServiceONEApi.getUUID();
            var soneid = ServiceONEApi.getSONEID();

            UserService.logout(soneid, uuid)
              .success(function (data) {
                $rootScope.$broadcast("loading:hide");
                if (data.status && data.status == "success") {
                  AuthenticationService.isLogged = false;
                  delete $window.sessionStorage.token;
                  ServiceONEApi.logout();
                  $ionicHistory.nextViewOptions({
                    disableBack: true,
                  });

                  if (window.cordova && cordova.plugins.backgroundMode) {
                    cordova.plugins.backgroundMode.disable();
                  }
                  getOffline();

                  $rootScope.$broadcast("updateMyWO");
                  $state.go("app.login");
                } else {
                  var alertPopup = $ionicPopup.alert({
                    title: "Logout failed!",
                    template: data.reason,
                  });
                }
              })
              .error(function (status, data) {
                $rootScope.$broadcast("loading:hide");
                /* AuthenticationService.isLogged = false;
                        delete $window.sessionStorage.token;

                        var alertPopup = $ionicPopup.alert({
                            title: 'Logout failed!',
                            template: 'Please try again or check your network connection!'
                        });*/
                AuthenticationService.isLogged = false;
                delete $window.sessionStorage.token;
                ServiceONEApi.logout();
                $ionicHistory.nextViewOptions({
                  disableBack: true,
                });
                getOffline();
                $state.go("app.login");
              });
          } else {
            $ionicHistory.nextViewOptions({
              disableBack: true,
            });
            $state.go("app.myworks");
          }
        });
      }
    }
  })
  .controller("MonitorWorkOrdersCtrl", function (
    $scope,
    $rootScope,
    $ionicTabsDelegate,
    ServiceONEApi
  ) {
    var sortToggle = false;

    $scope.sortasc = -1;

    $scope.loadingStatus = "Loading...";

    $scope.formatDateTime = function (mysqldate) {
      return ServiceONEApi.formatDateTime(mysqldate);
    };

    if (ServiceONEApi.getRefreshMonitorWO()) {
      $rootScope.$broadcast("loading:show");
      ServiceONEApi.getWorkOrders(true).then(
        function (data) {
          $scope.workOrders = data;
          if (data && data.length < 1) {
            $scope.loadingStatus = "Currently There is No Work Order.";
          }
          $rootScope.$broadcast("loading:hide");
          ServiceONEApi.setRefreshMonitorWO(false);
        },
        function (error) {
          $scope.loadingStatus = "Error During Loading. Please Try Again.";
          $rootScope.$broadcast("loading:hide");
          ServiceONEApi.setRefreshMonitorWO(false);
        }
      );
    } else {
      ServiceONEApi.getWorkOrders(false).then(function (data) {
        $scope.workOrders = data;
      });
    }

    $scope.refreshData = function () {
      $scope.sortasc = -1;
      $scope.loadingStatus = "Loading...";
      $rootScope.$broadcast("loading:show");
      ServiceONEApi.getWorkOrders(true).then(
        function (data) {
          $scope.workOrders = data;
          if (data && data.length < 1) {
            $scope.loadingStatus = "Currently There is No Work Order.";
          }
          $rootScope.$broadcast("loading:hide");
        },
        function (error) {
          $rootScope.$broadcast("loading:hide");
        }
      );
    };

    $scope.sortByLocation = function () {
      sortToggle = !sortToggle;
      $scope.sortasc = sortToggle ? 1 : 0;
      $ionicTabsDelegate.select(1);
      $scope.workOrders = ServiceONEApi.sortWorkOrdersByLocation(sortToggle);
    };

    $scope.sortByTime = function () {
      sortToggle = !sortToggle;
      $scope.sortasc = sortToggle ? 1 : 0;
      $ionicTabsDelegate.select(2);
      $scope.workOrders = ServiceONEApi.sortWorkOrdersByTime(sortToggle);
    };

    $scope.sortByPriority = function () {
      sortToggle = !sortToggle;
      $scope.sortasc = sortToggle ? 1 : 0;
      $ionicTabsDelegate.select(3);
      $scope.workOrders = ServiceONEApi.sortWorkOrdersByPriority(sortToggle);
    };

    $scope.getPriorityText = function (priority) {
      return ServiceONEApi.getPriorityText(priority);
    };
  })

  .controller("MyWorkOrdersCtrl", function (
    $scope,
    $rootScope,
    $ionicTabsDelegate,
    $interval,
    ServiceONEApi
  ) {
    var sortToggle = false;

    $scope.loadingStatus = "Loading...";
    $scope.sortasc = -1;
    $scope.userType = ServiceONEApi.getUserType();

    $scope.formatDateTime = function (mysqldate) {
      return ServiceONEApi.formatDateTime(mysqldate);
    };

    /*  $scope.$watchCollection(
            function(){
                return ServiceONEApi.getIsMyWOItemChanged();
            },
            function(newVal,oldVal){

                ServiceONEApi.setMyWOItemChanged(false);
                ServiceONEApi.getMyWorkOrders(false).then(function(data){
                    //$scope.sortasc = -1;
                    $scope.myWorkOrders = data;
                    if(data && data.length < 1){
                        $scope.loadingStatus = 'Currently There is No Work Order.';
                    }
                });

            }
      )*/

    $rootScope.$on("updateMyWO", function () {
      ServiceONEApi.getMyWorkOrders(false).then(function (data) {
        //$scope.sortasc = -1;
        $scope.myWorkOrders = data;
        if (data && data.length < 1) {
          $scope.loadingStatus = "Currently There is No Work Order.";
        }
      });
      $rootScope.$broadcast("updateBadge");
    });

    ServiceONEApi.getMyWorkOrders(true).then(
      function (data) {
        //console.log(data);
        $scope.myWorkOrders = data;

        if (data && data.length < 1) {
          $scope.loadingStatus = "Currently There is No Work Order.";
        } else {
          $rootScope.$broadcast("updateBadge");
        }
      },
      function (error) {
        $scope.loadingStatus = "Error During Loading. Please Try Again.";
      }
    );

    $interval(function () {
      ServiceONEApi.getMyWorkOrders(true).then(function (data) {
        //console.log(data);
        $scope.myWorkOrders = data;
        $rootScope.$broadcast("updateBadge");
      });
    }, 15000);

    $scope.sortByLocation = function () {
      sortToggle = !sortToggle;
      $scope.sortasc = sortToggle ? 1 : 0;
      $ionicTabsDelegate.select(0);
      $scope.myWorkOrders = ServiceONEApi.sortMyWorkOrdersByLocation(
        sortToggle
      );
    };

    $scope.sortByTime = function () {
      sortToggle = !sortToggle;
      $scope.sortasc = sortToggle ? 1 : 0;
      $ionicTabsDelegate.select(1);
      $scope.myWorkOrders = ServiceONEApi.sortMyWorkOrdersByTime(sortToggle);
    };

    $scope.sortByPriority = function () {
      sortToggle = !sortToggle;
      $scope.sortasc = sortToggle ? 1 : 0;
      $ionicTabsDelegate.select(2);
      $scope.myWorkOrders = ServiceONEApi.sortMyWorkOrdersByPriority(
        sortToggle
      );
    };

    $scope.getPriorityText = function (priority) {
      return ServiceONEApi.getPriorityText(priority);
    };
  })

  .controller("MyWorkItemsCtrl", function (
    $scope,
    $stateParams,
    $state,
    $rootScope,
    $ionicModal,
    $ionicPopup,
    ServiceONEApi
  ) {
    $scope.workOrder = ServiceONEApi.getMyWorkOrder($stateParams.OrderNo);
    $scope.soneid = ServiceONEApi.getSONEID();

    $scope.formatDate = function (mysqldate) {
      return ServiceONEApi.formatDate(mysqldate);
    };

    $ionicModal
      .fromTemplateUrl("templates/deescalate.html", {
        scope: $scope,
      })
      .then(function (modal) {
        $scope.modalDeescalate = modal;
      });

    $ionicModal
      .fromTemplateUrl("templates/endWork.html", {
        scope: $scope,
      })
      .then(function (modal) {
        $scope.modalEnd = modal;
      });

    $ionicModal
      .fromTemplateUrl("image-modal.html", {
        scope: $scope,
        animation: "slide-in-up",
      })
      .then(function (modal) {
        $scope.modalImage = modal;
      });

    //Cleanup the modal when we're done with it!
    $scope.$on("$destroy", function () {
      $scope.modalImage.remove();
      $scope.modalEnd.remove();
      $scope.modalDeescalate.remove();
    });
    // Execute action on hide modal
    $scope.$on("modal.hide", function () {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on("modal.removed", function () {
      // Execute action
    });
    $scope.$on("modal.shown", function () {});

    $scope.imageSrc = "http://ionicframework.com/img/ionic-logo-blog.png";

    // Triggered in the login modal to close it
    $scope.closeDeescalate = function () {
      $scope.modalDeescalate.hide();
    };

    $scope.closeEndMyWork = function () {
      $scope.modalEnd.hide();
    };

    $scope.closeImageModal = function () {
      $scope.modalImage.hide();
    };
    $scope.isWIP = function (workOrder) {
      return typeof workOrder.Interval !== "undefined";
    };

    $scope.isSVCUser = function () {
      return ServiceONEApi.getUserType() == "SVC";
    };

    $scope.showPicture = function (link) {
      $scope.imageSrc = link;
      $scope.modalImage.show();
    };

    $scope.showStatus = function (text, phone) {
      if (text.length > 0) {
        $ionicPopup.confirm({
          title: "Info",
          template: "<strong>" + text + "</strong>",
          buttons: [
            {
              text: "Call",
              type: "button button-assertive",
              onTap: function (e) {
                e.preventDefault();
                document.location.href = "tel:" + phone;
              },
            },
            {
              text: "Close",
              type: "button button-positive",
            },
          ],
        });
      }
    };

    $scope.deEscalate = function (OrderNo) {
      var tasksChecked = true;

      for (var i in $scope.workOrder.Tasks) {
        if ($scope.workOrder.Tasks[i].soneid == ServiceONEApi.getSONEID()) {
          if (!$scope.workOrder.Tasks[i].disabled) {
            tasksChecked = tasksChecked && $scope.workOrder.Tasks[i].Checked;
          }
        }
      }

      if (tasksChecked) {
        $scope.modalDeescalate.show();
      } else {
        $ionicPopup.alert({
          title: "Tasks Checklist",
          template:
            '<div align="center">Please check each Task for confirmation.</div>',
        });
      }
    };

    $scope.endMyWork = function (OrderNo) {
      var tasksChecked = true;

      for (var i in $scope.workOrder.Tasks) {
        if ($scope.workOrder.Tasks[i].soneid == ServiceONEApi.getSONEID()) {
          if (!$scope.workOrder.Tasks[i].disabled) {
            tasksChecked = tasksChecked && $scope.workOrder.Tasks[i].Checked;
          }
        }
      }

      if (tasksChecked) {
        $scope.modalEnd.show();
      } else {
        $ionicPopup.alert({
          title: "Tasks Checklist",
          template:
            '<div align="center">Please check each Task for confirmation.</div>',
        });
      }
    };

    $scope.startMyWork = function (OrderNo) {
      var confirmPopup = $ionicPopup.confirm({
        title: "Start Order# " + OrderNo,
        template: "Execute this Work Order?",
        cancelText: "Cancel",
        okText: "Yes",
      });
      confirmPopup.then(function (res) {
        if (res) {
          $rootScope.$broadcast("loading:show");
          ServiceONEApi.startMyWorkOrder(OrderNo, $scope.workOrder).then(
            function (result) {
              $rootScope.$broadcast("loading:hide");

              if (result.status == "OK") {
                $rootScope.$broadcast("updateMyWO");
                $state.go("app.myworks");
              }
            },
            function (error) {
              $rootScope.$broadcast("loading:hide");
              var alertPopup = $ionicPopup.alert({
                title: "Error",
                template: "Error in connecting the server. Please try again.",
              });
            }
          );
        }
      });
    };

    $scope.submitStatus = function (status) {
      if (status == "COMP") {
        var confirmPopup = $ionicPopup.confirm({
          title: "Complete Order# " + $scope.workOrder.OrderNo,
          template: "Complete this Work Order?",
          cancelText: "Cancel",
          okText: "Yes",
        });
        confirmPopup.then(function (res) {
          if (res) {
            $rootScope.$broadcast("loading:show");
            ServiceONEApi.setMyWorkOrder(status, $scope.workOrder).then(
              function (data) {
                $rootScope.$broadcast("loading:hide");
                $rootScope.$broadcast("updateMyWO");
                $scope.closeEndMyWork();
                if (data.status == "DELETE") {
                  var alertPopup = $ionicPopup.alert({
                    title: "Order# " + $scope.workOrder.OrderNo,
                    template: "The Work Order Has Been Escalated or Deleted.",
                  });

                  alertPopup.then(function (res) {
                    $state.go("app.myworks");
                  });
                } else {
                  $state.go("app.myworks");
                }
              },
              function (error) {
                $rootScope.$broadcast("loading:hide");
                //console.log(error);
                $ionicPopup.alert({
                  title: "Error",
                  template:
                    "Failed To Update The Status.<br> Please Try Again.",
                });
              }
            );
          }
          /* console.log($scope.workOrder);
                    return;*/
        });
      } else if (status == "DND") {
        var confirmPopup = $ionicPopup.confirm({
          title: "Complete Order# " + $scope.workOrder.OrderNo,
          template: "Complete this Work Order With 'DND' Status?",
          cancelText: "Cancel",
          okText: "Yes",
        });
        confirmPopup.then(function (res) {
          if (res) {
            $rootScope.$broadcast("loading:show");
            ServiceONEApi.setMyWorkOrder(status, $scope.workOrder).then(
              function (data) {
                $rootScope.$broadcast("loading:hide");
                $rootScope.$broadcast("updateMyWO");
                $scope.closeEndMyWork();
                $state.go("app.myworks");
              },
              function (error) {
                $rootScope.$broadcast("loading:hide");
                //console.log(error);
                $ionicPopup.alert({
                  title: "Error",
                  template:
                    "Failed To Update The Status.<br> Please Try Again.",
                });
              }
            );
          }
        });
      }
    };

    $scope.submitDeescalate = function (status) {
      if (status == "STFPREV") {
        var confirmPopup = $ionicPopup.confirm({
          title:
            "Assign To Previous Staff - (" + $scope.workOrder.OrderNo + ")",
          template: "Assign This Task To Previous Staff ?",
          cancelText: "Cancel",
          okText: "Yes",
        });
        confirmPopup.then(function (res) {
          if (res) {
            $rootScope.$broadcast("loading:show");
            ServiceONEApi.setMyWorkOrder(status, $scope.workOrder).then(
              function (data) {
                $rootScope.$broadcast("loading:hide");
                $rootScope.$broadcast("updateMyWO");
                $scope.closeEndMyWork();
                $state.go("app.myworks");
              },
              function (error) {
                $rootScope.$broadcast("loading:hide");
                //console.log(error);
                $ionicPopup.alert({
                  title: "Error",
                  template:
                    "Failed To Update The Status.<br> Please Try Again.",
                });
              }
            );
          }
        });
      } else if (status == "STFSYS") {
        var confirmPopup = $ionicPopup.confirm({
          title: "System Finds New Staff - (" + $scope.workOrder.OrderNo + ")",
          template: "Let The System To Finds New Staff?",
          cancelText: "Cancel",
          okText: "Yes",
        });
        confirmPopup.then(function (res) {
          if (res) {
            ServiceONEApi.setMyWorkOrder(status, $scope.workOrder).then(
              function (data) {
                $rootScope.$broadcast("loading:hide");
                $rootScope.$broadcast("updateMyWO");
                $scope.closeEndMyWork();
                $state.go("app.myworks");
              },
              function (error) {
                $rootScope.$broadcast("loading:hide");
                //console.log(error);
                $ionicPopup.alert({
                  title: "Error",
                  template:
                    "Failed To Update The Status.<br> Please Try Again.",
                });
              }
            );
          }
        });
      }
    };
  })

  .controller("MonitorWorkItemsCtrl", function (
    $scope,
    $stateParams,
    $state,
    $ionicHistory,
    $ionicPopup,
    ServiceONEApi
  ) {
    $scope.workOrder = ServiceONEApi.getWorkOrder($stateParams.OrderNo);

    $scope.formatDate = function (mysqldate) {
      return ServiceONEApi.formatDate(mysqldate);
    };

    $scope.addToMyWorks = function (OrderNo) {
      var confirmPopup = $ionicPopup.confirm({
        title: "Add Order# " + OrderNo + " To My Works",
        template: "Are you sure you want to add this Work Order?",
        cancelText: "Cancel",
        okText: "Yes",
      });
      confirmPopup.then(function (res) {
        if (res) {
          ServiceONEApi.putMyWorkOrders(
            OrderNo,
            ServiceONEApi.getWorkOrder(OrderNo)
          );
          ServiceONEApi.removeWorkOrders(OrderNo);
          if (ServiceONEApi.getWorkOrdersCount() == 0) {
            $ionicHistory.nextViewOptions({
              disableBack: true,
            });
            $state.go("app.myworks");
          } else {
            $state.go("app.works");
          }
        }
      });
    };
  })

  .controller("IncidentListCtrl", function ($scope, $rootScope, ServiceONEApi) {
    $scope.loadingStatus = "Loading...";
    ServiceONEApi.getIncidentGroup().then(function (data) {
      $scope.incidentGroup = data;
      $scope.loadingStatus = false;
    });

    $scope.refreshList = function () {
      $scope.loadingStatus = "Loading...";
      ServiceONEApi.getIncidentGroup().then(function (data) {
        $scope.incidentGroup = data;
        $scope.loadingStatus = false;
      });
    };
  })

  .controller("IncidentFormCtrl", function (
    $scope,
    $rootScope,
    $window,
    $q,
    $state,
    $stateParams,
    $ionicPopup,
    $ionicModal,
    ServiceONEApi,
    Camera,
    config,
    $cordovaFile,
    $cordovaFileTransfer,
    $cordovaBarcodeScanner
  ) {
    $scope.images = [];
    $scope.incidentGroupID = $stateParams.IncidentGroupID;
    $scope.incidentText = $stateParams.IncidentText;
    $scope.incidentIcon = $stateParams.IncidentIcon;

    $scope.myNote = {};
    $scope.myNote.text = "";

    $scope.popup = { qty: 1 };

    $scope.textForm = {};
    $scope.textForm.shortText = ServiceONEApi.getShortText();
    //$scope.textForm.requester = ServiceONEApi.getMyName();
    $scope.textForm.locationID = ServiceONEApi.getIncidentLocationSysId()
      ? ServiceONEApi.getIncidentLocationSysId()
      : "Select Location";
    $scope.textForm.locationText = ServiceONEApi.getIncidentLocation()
      ? ServiceONEApi.getIncidentLocation().text
      : "Tap Here To Select Location";
    $scope.textForm.locationItems = [];
    $scope.textForm.locationResource = "REST_locations";
    $scope.textForm.locationResParam = undefined;

    /*ServiceONEApi.getLocations().then(function(data){

            if (typeof data === 'object') {
                for (var idx in data) {
                    data[idx].show = true;
                }
                $scope.textForm.locationItems = data;
            }
        });*/
    $scope.textForm.incidentItemsText = "Tap Here To Select Work Order";
    $scope.textForm.incidentItems = [];
    $scope.textForm.incidentItemsResource = "REST_incidentitem";
    $scope.textForm.incidentItemsResParam = $scope.incidentGroupID;
    /* ServiceONEApi.getIncidentItems($scope.incidentGroupID).then(function(data){

            if (typeof data === 'object') {
                for (var idx in data) {
                    data[idx].show = true;
                }
                $scope.textForm.incidentItems = data;
            }
        });*/

    $scope.shortTextChange = function () {
      ServiceONEApi.setShortText($scope.textForm.shortText.toUpperCase());
    };

    //$scope.textForm.priorityItemsText = "Tap Here To Select Priority";
    $scope.textForm.priorityItemsText = ServiceONEApi.getIncidentPriority().text;
    $scope.saveIncidentLocation = function (action, item) {
      if (action === "remove") return;

      if (item.sysid) {
        $scope.textForm.locationID = item.sysid;
      } else {
        $scope.textForm.locationID = item.id;
      }

      ServiceONEApi.saveIncidentLocation(item);
    };
    $scope.textForm.priorityItems = ServiceONEApi.getPriorities();
    $scope.textForm.incidents = ServiceONEApi.getIncidents();
    $scope.textForm.notes = ServiceONEApi.getNotes();

    $scope.saveIncident = function (action, item) {
      if (action == "add") {
        if (!item.hasOwnProperty("qty")) {
          item.qty = 0;
        }
        item.assignedto = "";
        if (item.text.indexOf("##") > -1) {
          if (item.qty == 0) {
            var myPopup = $ionicPopup.show({
              template: '<input type="number" ng-model="popup.qty">',
              title: item.text,
              subTitle: "Please enter the quantity",
              scope: $scope,
              buttons: [
                { text: "Cancel" },
                {
                  text: "<b>Save</b>",
                  type: "button-positive",
                  onTap: function (e) {
                    if ($scope.popup.qty == 0 || $scope.popup.qty == null) {
                      e.preventDefault();
                    } else {
                      return $scope.popup.qty;
                    }
                  },
                },
              ],
            });
            myPopup.then(function (res) {
              if (res != undefined) {
                item.qty = res;
                var data = JSON.parse(JSON.stringify(item));
                data.text = item.text.replace("##", res);
                data.qty = res;
                ServiceONEApi.saveIncident(data);
                var el = document.querySelector(".modal-open");
                if (el && el.classList) {
                  el.classList.remove("modal-open");
                }
                el = document.querySelector(".popup-open");
                if (el && el.classList) {
                  el.classList.remove("popup-open");
                }
              }
            });
          } else {
            ServiceONEApi.saveIncident(item);
          }
        } else {
          ServiceONEApi.saveIncident(item);
        }
      } else {
        ServiceONEApi.removeIncidentByItem(item);
      }
      /*$cordovaFile.removeFile(cordova.file.dataDirectory, item.id + '.jpg')
                    .then(function (success) {
                        // success
                    }, function (error) {
                        // error
                });*/
    };

    $scope.scanBarcode = function () {
      $rootScope.GoBack = false;
      $cordovaBarcodeScanner.scan().then(
        function (imageData) {
          if (!imageData.cancelled) {
            $scope.loadingStatus = true;
            ServiceONEApi.getLocation(imageData.text).then(function (data) {
              $scope.textForm.locationID = data[0].sysid;
              $scope.textForm.locationText = data[0].text;
              ServiceONEApi.saveIncidentLocation(data[0]);
              $scope.loadingStatus = false;
            });
          }

          //alert("Barcode Format -> " + imageData.format);
        },
        function (error) {
          alert("An error happened -> " + error);
        }
      );
    };

    $scope.getPicture = function (id) {
      var options = {
        buttonLabels: ["Take Picture", "Select From Gallery"],
        addCancelButtonWithLabel: "Cancel",
      };
      $scope.imageid = id;
      window.plugins.actionsheet.show(options, CameraCallback);
    };

    function CameraCallback(buttonIndex) {
      if (buttonIndex === 1) {
        var picOptions = {
          destinationType: navigator.camera.DestinationType.FILE_URI,
          quality: 100,
          targetWidth: 600,
          targetHeight: 600,
          allowEdit: false,
          saveToPhotoAlbum: true,
        };

        $rootScope.GoBack = false;

        Camera.getPicture(picOptions).then(
          function (imageURI) {
            //var name = imageURI.substr(imageURI.lastIndexOf('/') + 1);
            //var namePath = imageURI.substr(0, imageURI.lastIndexOf('/') + 1);
            //var extName = imageURI.substr(imageURI.lastIndexOf('.'));
            //var extName = '.jpg';
            //var newName = $scope.imageid + extName;

            var onSuccess = function (entry) {
              var newName = $scope.imageid + ".jpg";
              var newFolder = "ServiceONE";
              window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (
                fileSys
              ) {
                fileSys.root.getDirectory(
                  newFolder,
                  {
                    create: true,
                    exclusive: false,
                  },
                  function (directory) {
                    //$scope.imageDir = directory.nativeURL;
                    ServiceONEApi.setImageDir(directory.nativeURL);
                    entry.moveTo(directory, newName, successMove, onError);
                  }
                );
              });
            };

            var successMove = function (entry) {
              $scope.images.push($scope.imageid);
            };
            var onError = function (error) {
              console.log(e);
            };

            window.resolveLocalFileSystemURL(imageURI, onSuccess, onError);
          },
          function (err) {
            //console.log(err);
            alert(err);
          }
        );
      } else if (buttonIndex === 2) {
        var picOptions = {
          destinationType: navigator.camera.DestinationType.FILE_URI,
          quality: 100,
          targetWidth: 600,
          targetHeight: 600,
          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
        };

        $rootScope.GoBack = false;
        Camera.getPictureFromGallery(picOptions).then(
          function (imageURI) {
            //console.log(imageURI);
            //var name = imageURI.substr(imageURI.lastIndexOf('/') + 1);
            //var namePath = imageURI.substr(0, imageURI.lastIndexOf('/') + 1);
            //var extName = imageURI.substr(imageURI.lastIndexOf('.'));
            //var extName = '.jpg';
            //var newName = $scope.imageid + extName;

            var onSuccess = function (entry) {
              var newName = $scope.imageid + ".jpg";
              var newFolder = "ServiceONE";
              window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (
                fileSys
              ) {
                fileSys.root.getDirectory(
                  newFolder,
                  {
                    create: true,
                    exclusive: false,
                  },
                  function (directory) {
                    //$scope.imageDir = directory.nativeURL;
                    ServiceONEApi.setImageDir(directory.nativeURL);
                    entry.copyTo(directory, newName, successCopy, onError);
                  }
                );
              });
            };

            var successCopy = function (entry) {
              $scope.images.push($scope.imageid);
            };
            var onError = function (error) {
              console.log(e);
            };

            window.resolveLocalFileSystemURL(imageURI, onSuccess, onError);
          },
          function (err) {
            alert(err);
          }
        );
      }
    }

    $ionicModal
      .fromTemplateUrl("image-modal.html", {
        id: 0,
        scope: $scope,
        animation: "slide-in-up",
      })
      .then(function (modal) {
        $scope.modalImage = modal;
      });

    $ionicModal
      .fromTemplateUrl("submit-modal.html", {
        id: 1,
        scope: $scope,
        animation: "slide-in-up",
      })
      .then(function (modal) {
        $scope.modalSubmit = modal;
      });

    $scope.openModal = function (idx) {
      switch (idx) {
        case 0:
          $scope.modalImage.show();
          break;
        case 1:
          $scope.modalSubmit.show();
          break;
      }
    };

    $scope.closeModal = function (idx) {
      switch (idx) {
        case 0:
          $scope.modalImage.hide();
          break;
        case 1:
          $scope.modalSubmit.hide();
          break;
      }
    };

    //Cleanup the modal when we're done with it!
    $scope.$on("$destroy", function () {
      $scope.modalImage.remove();
    });
    // Execute action on hide modal
    $scope.$on("modal.hide", function (event, modal) {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on("modal.removed", function () {
      // Execute action
    });
    $scope.$on("modal.shown", function (event, modal) {
      if (modal.id == "0") {
        idx = $scope.selectedIncident.idx;
        imageDir = ServiceONEApi.getImageDir();

        $scope.hasPicture = false;
        $scope.Filename = $scope.selectedIncident.id + ".jpg";

        var onResolveSuccess = function (fileEntry) {
          var d = new Date();
          $scope.incident_Photo = window.Ionic.WebView.convertFileSrc(
            fileEntry.nativeURL + "?id=" + d.getTime()
          );
          $scope.hasPicture = true;
        };

        var onFail = function (error) {
          console.log(error);
          $scope.incident_Photo = "img/nopicture.png";
          $scope.hasPicture = false;
        };
        window.resolveLocalFileSystemURL(
          imageDir + $scope.Filename,
          onResolveSuccess,
          onFail
        );

        /*$cordovaFile.checkFile($scope.imageDir, $scope.selectedIncident.id + '.jpg' )
                .then(function (success) {
                    var d = new Date();
                    console.log(window.Ionic.WebView.convertFileSrc($scope.imageDir + $scope.selectedIncident.id + '.jpg' + '?id='+ d.getTime()));

                    $scope.incident_Photo = window.Ionic.WebView.convertFileSrc($scope.imageDir + $scope.selectedIncident.id + '.jpg' + '?id='+ d.getTime());
                    $scope.hasPicture = true;


                }, function (error) {
                    $scope.incident_Photo = 'img/nopicture.png';
                    $scope.hasPicture = false;
                }); */
      }
    });

    $scope.removeIncidentModal = function (idx) {
      $scope.selectedIncident = ServiceONEApi.getIncidents()[idx];
      $scope.selectedIncident.idx = idx;
      $scope.openModal(0);
    };

    $scope.removePicture = function () {
      idx = $scope.selectedIncident.idx;
      imageDir = ServiceONEApi.getImageDir();
      $scope.Filename = $scope.selectedIncident.id + ".jpg";

      var confirm = $ionicPopup.confirm({
        title: "Confirmation",
        template: "Delete The Picture?",
      });

      confirm.then(function (res) {
        if (res) {
          //$cordovaFile.removeFile(cordova.file.dataDirectory, $scope.selectedIncident.id + '.jpg')
          $cordovaFile.removeFile(imageDir, $scope.Filename).then(
            function (success) {
              var i = _.indexOf($scope.images, idx);
              if (i != -1) {
                $scope.images.splice(i, 1);
              }
              $scope.hasPicture = false;
            },
            function (error) {
              // error
            }
          );

          $scope.closeModal(0);
        }
      });
    };

    $scope.removeIncident = function () {
      idx = $scope.selectedIncident.idx;
      imageDir = ServiceONEApi.getImageDir();
      ServiceONEApi.removeIncidentByIndex($scope.textForm.incidentItems, idx);
      $scope.closeModal(0);
      $cordovaFile
        .removeFile(imageDir, $scope.selectedIncident.id + ".jpg")
        .then(
          function (success) {
            var i = _.indexOf($scope.images, idx);
            if (i != -1) {
              $scope.images.splice(i, 1);
            }
          },
          function (error) {
            // error
          }
        );
    };

    $scope.savePriority = function (priority) {
      ServiceONEApi.savePriority(priority);
    };

    $scope.addToNotes = function (note) {
      if (note) {
        ServiceONEApi.saveNote(note);
        this.myNote = "";
      }
    };

    $scope.removeNote = function (idx) {
      ServiceONEApi.removeNote(idx);
    };

    $scope.resetForm = function (confirm) {
      confirm = typeof confirm !== "undefined" ? confirm : true;

      if (confirm) {
        var confirmPopup = $ionicPopup.confirm({
          title: "Reset Form",
          template: "Are you sure you want to reset the form entry?",
        });
        confirmPopup.then(function (res) {
          if (res) {
            $scope.textForm.locationID = "Select Location";
            $scope.textForm.locationText = "Tap Here To Select Location";
            $scope.textForm.incidentItemsText = "Tap Here To Select Work Order";
            $scope.textForm.priorityItemsText = "Tap Here To Select Priority";

            for (var idx in $scope.textForm.incidentItems) {
              $scope.textForm.incidentItems[idx].show = true;
              $scope.textForm.incidentItems[idx].checked = false;
              $scope.textForm.incidentItems[idx].qty = 0;
            }

            ServiceONEApi.clearIncident();

            $scope.textForm.incidents = ServiceONEApi.getIncidents();
            $scope.textForm.notes = ServiceONEApi.getNotes();
            //$scope.textForm.requester = "";
            $scope.popup.qty = 1;
          }
        });
      } else {
        $scope.textForm.locationText = "Tap Here To Select Location";
        $scope.textForm.incidentItemsText = "Tap Here To Select Work Order";
        $scope.textForm.priorityItemsText = "Tap Here To Select Priority";

        for (var idx in $scope.textForm.incidentItems) {
          $scope.textForm.incidentItems[idx].show = true;
          $scope.textForm.incidentItems[idx].checked = false;
          $scope.textForm.incidentItems[idx].qty = 0;
        }

        ServiceONEApi.clearIncident();

        $scope.textForm.incidents = ServiceONEApi.getIncidents();
        $scope.textForm.notes = ServiceONEApi.getNotes();
        //$scope.textForm.requester = "";
        $scope.popup.qty = 1;
      }
    };

    var uploadPicturePromise = function (task_id, incident_id) {
      var deferred = $q.defer();
      var url = config.serverBaseURL + "/REST_incidentPhoto/upload";
      var imageDir = ServiceONEApi.getImageDir();
      // File name only
      var filename = incident_id + ".jpg";
      var targetPath = imageDir + filename;

      var options = {
        fileKey: "file",
        fileName: filename,
        chunkedMode: false,
        mimeType: "image/jpg",
        params: { taskid: task_id }, // directory represents remote directory,  fileName represents final remote file name
        headers: { "X-API-KEY": $window.sessionStorage.token },
      };

      $cordovaFileTransfer.upload(url, targetPath, options).then(
        function (result) {
          $scope.progressval = 100;
          deferred.resolve("Success");
        },
        function (err) {
          deferred.reject("Fail");
        },
        function (progress) {
          // PROGRESS HANDLING GOES HERE
          $scope.pictureName = filename;
          $scope.progressval = Math.round(
            (progress.loaded / progress.total) * 100
          );
        }
      );
      return deferred.promise;
    };

    $scope.uploadPicture = function (task_id) {
      var promises = [];

      $scope.images.forEach(function (incident_id) {
        promises.push(uploadPicturePromise(task_id, incident_id));
      });

      $q.all(promises).then(
        function (res) {
          /*for(var i=0; i<res.length; i++) {
                    console.log(res[i]);
                }*/

          var imageDir = ServiceONEApi.getImageDir();

          $scope.images.forEach(function (incident_id) {
            $cordovaFile.removeFile(imageDir, incident_id + ".jpg").then(
              function (success) {},
              function (error) {}
            );
          });
          $scope.images = [];
          $scope.closeModal(1);
        },
        function (error) {
          alert("Error: Some pictures cannot be uploaded.");
        }
      );
    };

    $scope.submitForm = function () {
      var dataForm = {};
      dataForm.incidents = {};
      dataForm.notes = [];
      dataForm.requester = ServiceONEApi.getMyName();
      dataForm.title = ServiceONEApi.getShortText();
      dataForm.dosequence = 0;

      if (!dataForm.title) {
        var alertPopup = $ionicPopup.alert({
          title: "Job Description",
          template: "Please enter the job description",
        });
        return;
      }

      var data = ServiceONEApi.getIncidentLocation();
      if (data && data.id) {
        dataForm.loc_id = data.id;
      } else {
        var alertPopup = $ionicPopup.alert({
          title: "Location",
          template: "Please select a location",
        });
        return;
      }

      data = ServiceONEApi.getIncidentPriority();

      if (data) {
        dataForm.priority = data.id;
      }

      data = ServiceONEApi.getIncidents();

      if (typeof data != "undefined" && data.length > 0) {
        dataForm.incidents = data;
      } else {
        var alertPopup = $ionicPopup.alert({
          title: "Work Order",
          template: "Please select at least 1 Work Order",
        });
        return;
      }

      data = ServiceONEApi.getNotes();

      if (data && data.length > 0) {
        dataForm.notes = data;
      } else {
        dataForm.notes.push($scope.myNote.text);
      }

      dataForm.soneid = ServiceONEApi.getSONEID();

      //$rootScope.$broadcast('loading:show');
      ServiceONEApi.postWorkOrder(dataForm)
        .then(function (res) {
          if (res.status == "OK") {
            if ($scope.images.length > 0) {
              $scope.progressval = 0;
              $scope.openModal(1);
              $scope.uploadPicture(res.id);
            }

            $ionicPopup.alert({
              title: "Success",
              template: "Successfully Submit A Work Order.",
            });

            $state.go("app.incidentlist");
            $scope.resetForm(false);
          } else {
            $ionicPopup.alert({
              title: "Error",
              template: "Failed To Submit A Work Order.<br> Please Try Again.",
            });
          }
        })
        .catch(function (data, status) {
          $ionicPopup.alert({
            title: "Error",
            template: "Failed To Submit A Work Order.<br> Please Try Again.",
          });
        })
        .finally(function () {
          //$rootScope.$broadcast('loading:hide');
        });
    };
  })
  .controller("whoamiCtrl", function ($scope, $rootScope, ServiceONEApi) {
    var res = ServiceONEApi.getUserInfo();
    if (res.myGroup === undefined) {
      $rootScope.$broadcast("loading:show");
      ServiceONEApi.getWhoAmI()
        .then(function (res) {
          if (res.status == "success") {
            ServiceONEApi.setUserInfo(null, res);
            if (res.isleader == "1") {
              $scope.name = res.name + " (L)";
            } else {
              $scope.name = res.name;
            }
            $scope.soneid = res.soneid;
            $scope.phone = res.phone;
            $scope.isleader = res.isleader;
            $scope.usergroup = res.usergroup;
            $scope.userType = res.usertype;
          }
        })
        .finally(function () {
          $rootScope.$broadcast("loading:hide");
        });
    } else {
      if (res.isLeader == "1") {
        $scope.name = res.myName + " (L)";
      } else {
        $scope.name = res.myName;
      }
      $scope.soneid = res.soneid;
      $scope.phone = res.phoneNo;
      $scope.isleader = res.isLeader;
      $scope.usergroup = res.myGroup;
      $scope.userType = res.userType;
    }
  })
  .controller("DialogCtrl", [
    "$scope",
    "$cordovaDialogs",
    "$cordovaLocalNotification",
    function ($scope, $cordovaDialogs, config, $cordovaLocalNotification) {
      var idx = 0;
      var conn;
      $scope.greeting = "Hello";
      $scope.items = ["my message"];

      /*$scope.alert = function() {
        $scope.greeting = "Gila";
        $cordovaDialogs.alert('Work Order','Work Order','Dismiss').then(function(){
            $cordovaDialogs.alert("Alert was closed.");
        });
    }
    $scope.add = function() {
        var alarmTime = new Date();
        alarmTime.setMinutes(alarmTime.getMinutes() + 1);
        $cordovaLocalNotification.add({
            id: "1234",
            date: alarmTime,
            message: "This is a message",
            title: "This is a title",
            autoCancel: true,
            sound: null
        }).then(function () {
        });
    };

    $scope.isScheduled = function() {
        $cordovaLocalNotification.isScheduled("1234").then(function(isScheduled) {
            alert("Notification 1234 Scheduled: " + isScheduled);
        });
    }*/

      /*$scope.subscribe = function() {

        //$scope.items.push(idx++ + 'new message');
        if (conn == null) {
            conn = new ab.Session('ws://localhost:8080',
                function() {
                    conn.subscribe('kittensCategory', function(topic, data) {
                        console.log(data.article);
                        //$scope.items.push(idx++ + 'new message');
                        $scope.items.push(idx++ + data.article);
                        $scope.$apply();

                    });
                },
                function() {
                    console.warn('WebSocket connection closed');
                    conn = null;
                },
                {'skipSubprotocolCheck': true}
            );
        }
    }

    /*$scope.close = function() {
         if (conn) {
            conn.close();
            conn = null;
         }
     }*/

      $scope.subscribe = function () {
        //$scope.items.push(idx++ + 'new message');

        if (!conn) {
          conn = io.connect(config.socketBaseURL, { forceNew: true });

          conn.on("connect", function (data) {
            conn.on("disconnect", function () {});

            conn.on("Housekeeping", function (msg) {
              $scope.items.push(idx++ + msg);
              $scope.$apply();
              if (cordova.plugins.backgroundMode.isActive()) {
                cordova.plugins.backgroundMode.configure({
                  text: idx + msg,
                });
              } else {
                $cordovaDialogs.alert(msg);
              }
            });

            conn.emit("subscribe", { group: "Housekeeping", soneid: "0001" });
          });

          conn.on("message", function (message) {
            console.log(message);
            //conn.emit('unsubscribe', 'Housekeeping');
          });
        }
      };

      $scope.sendmessage = function () {
        if (conn) {
          conn.emit("message", {
            group: "Housekeeping",
            msg: "pesan dari saya",
          });
        }
      };

      $scope.close = function () {
        if (conn) {
          conn.disconnect();
          conn = null;
        }
      };
    },
  ]);
