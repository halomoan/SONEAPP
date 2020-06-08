/**
/**
 * Created by Administrator on 12-Aug-15.
 */
angular
  .module("ServiceONE.services", ["angular-cache"])
  .factory("ServiceONEApi", function(
    $interval,
    $window,
    $q,
    $http,
    config,
    CacheFactory
  ) {
    /*sTemp = '{"header":{"title":"SAP Work Orders","pubDate":"12-Aug-2015 03:27:02","version":"1.0"},"orders":[{"OrderNo":"12345","RequestDate":"12-Aug-2015","RequestTime":"03:27:02 PM","RoomNo":"1201","Location":"Level 15","GuestName":"Mr Rajak","Priority":"3","Tasks":[{"task":"Guest Request - 3 Towels"},{"task":"Carpet Dirty"}],"Notes":[{"note":"Greet Mr Rajak our VIP Guest"},{"note":"Mr Rajak can speak Malay only"}]},{"OrderNo":"22222","RequestDate":"12-Aug-2015","RequestTime":"04:27:02 PM","RoomNo":"1202","Location":"Level 13","GuestName":"Mr Raja","Priority":"5","Tasks":[{"task":"Guest Request - 1 Towels"},{"task":"Carpet Dirty"}],"Notes":[{"note":"Greet Mr Raja our VIP Guest"},{"note":"Mr Raja can speak Hindi only"}]}]}';
        var jsonData = JSON.parse(sTemp);*/
    /*
        var incidentItems = [
            {id: 1, text: 'AirCon Not Cool', checked: false, icon: null, show: true},
            {id: 2, text: 'AirCon Not Working', checked: false, icon: null, show: true},
            {id: 3, text: 'AirCon Remote Is Missing', checked: false, icon: null, show: true}];


        var  locationItems = [
            {id: 1, text: 'Room 1401',  icon: null, show: true},
            {id: 2, text: 'Room 1201',  icon: null, show: true},
            {id: 3, text: 'Exit 2001',  icon: null, show: true}];
        */
    CacheFactory("dataCache", {
      maxAge: 15 * 60 * 1000,
      cacheFlushInterval: 60 * 60 * 1000,
      deleteOnExpire: "aggressive"
    });

    var incidentPriorities = [
      { id: "1", text: "Very Low", show: true },
      { id: "2", text: "Low", show: true },
      { id: "3", text: "Medium", show: true },
      { id: "4", text: "Important", show: true },
      { id: "5", text: "Very Important", show: true }
    ];
    var incidentDB = {
      priority: { id: "3", text: "Medium", show: true },
      location: null,
      incidents: [],
      notes: []
    };
    var updatingMyWO = false;
    var myWOCountChanged = false;
    var myWOItemChanged = false;
    var refreshMonitorWO = false;
    var workOrderDB;
    var myInfo = {
      myName: "",
      soneid: "",
      isLeader: "",
      myGroup: "",
      phoneNo: "",
      userType: ""
    };
    var workTimer;
    var startTimer = false;
    var arr_msgid = [];
    var msgid_interval = 0;
    var phone = { uuid: "supermario" };
    var imageDir = "";

    function logout() {
      if (angular.isDefined(workTimer)) {
        $interval.cancel(workTimer);
        workTimer = undefined;
      }

      startTimer = false;
      updatingMyWO = false;
      workOrderDB;

      $window.localStorage.clear();
      myWOCountChanged = true;
      myWOItemChanged = true;
      arr_msgid = [];
      myInfo = {
        myName: "",
        soneid: "",
        isLeader: "",
        myGroup: "",
        phoneNo: "",
        userType: ""
      };
    }

    function login() {
      $window.localStorage.clear();
      myWOCountChanged = true;
      myWOItemChanged = true;
      // console.log('settimmer');
      workTimer = $interval(setMyWorkTimer, 60000);
    }

    function setMyWorkTimer() {
      if (!startTimer) return;

      // Get Data & Set Timer
      arr = _getFromStorage("myorders");
      var requeston;
      var mins;
      var d = new Date();
      for (var i in arr) {
        if (!isNaN(arr[i].Interval)) {
          if (myInfo.userType == "SVC") {
            requeston = new Date(arr[i].RequestDate + " " + arr[i].RequestTime);
            mins = Math.floor((d - requeston) / 60000);
          } else {
            requeston = new Date(arr[i].StartDateTime);
            mins = Math.floor((d - requeston) / 60000);
            //console.log(arr[i].OrderNo, d.toMysqlFormat(),requeston.toMysqlFormat(),(d-requeston),mins);
          }
          arr[i].Interval = mins;
          if (mins > 0) {
            arr[i].TimeDisplay = arr[i].Interval.toString().toHHMM();
          }

          /* arr[i].Interval = arr[i].Interval + 1;
                    arr[i].TimeDisplay = arr[i].Interval.toString().toHHMM();*/
        }
      }

      _saveToStorage("myorders", arr);
    }

    function setImageDir(dir) {
      imageDir = dir;
    }

    function getImageDir() {
      return imageDir;
    }

    function getMSGIDARRAY() {
      return arr_msgid;
    }

    function setMSGIDARRAY(id) {
      arr_msgid.push(id);
    }

    function saveNote(note) {
      incidentDB.notes.push(note);
    }

    function setShortText(text) {
      incidentDB.title = text;
    }

    function getShortText() {
      return incidentDB.title;
    }

    function getNotes() {
      return incidentDB.notes;
    }

    function removeNote(idx) {
      incidentDB.notes.splice(idx, 1);
    }

    function getPriorities() {
      return incidentPriorities;
    }

    function getIncidentPriority() {
      /* if (incidentDB.priority) {
                return incidentDB.priority.text;
            } else{
                return null;
            }*/

      return incidentDB.priority;
    }
    function savePriority(priority) {
      incidentDB.priority = priority;
    }

    /*  function getIncidentItems(incidentGroupID){
            //return incidentItems;

            var deferred = $q.defer();
            var dataCache = CacheFactory.get('dataCache');

            if (dataCache.get(incidentGroupID)){
                deferred.resolve(dataCache.get(incidentGroupID));
            } else{
                $http.get(config.serverBaseURL + '/REST_incidentitem/records/'+incidentGroupID).success(function(result){

                    var data = _(result.data).forEach(function(item){
                        item.checked = false;
                    }).value();
                    dataCache.put(incidentGroupID,data);
                    deferred.resolve(data);
                });
            }

            return  deferred.promise;
        }*/

    function getLocation(locationID) {
      var deferred = $q.defer();

      $http
        .get(config.serverBaseURL + "/REST_locations/locsysid/id/" + locationID)
        .success(function(result) {
          deferred.resolve(result);
        });

      return deferred.promise;
    }

    function getIncidentGroup() {
      var deferred = $q.defer();
      var dataCache = CacheFactory.get("dataCache");

      if (dataCache.get("locationGroup")) {
        deferred.resolve(dataCache.get("locationGroup"));
      } else {
        $http
          .get(config.serverBaseURL + "/REST_incidentgroup/records")
          .success(function(result) {
            var data = _.groupBy(result.data, function(n, index) {
              return Math.floor(index / 3);
            });

            var i = _.size(data);
            if (i > 0) {
              for (var j = 0; j < 3; j++) {
                if (data[i - 1][j] === undefined) {
                  data[i - 1].push(false);
                }
              }
            }
            dataCache.put("incidentGroup", data);
            deferred.resolve(data);
          });
      }

      return deferred.promise;
    }
    function getIncidentLocationSysId() {
      if (incidentDB.location) {
        return incidentDB.location.sysid
          ? incidentDB.location.sysid
          : incidentDB.location.id;
      } else {
        return false;
      }
    }
    function getIncidentLocation() {
      return incidentDB.location;
    }

    function saveIncidentLocation(item) {
      incidentDB.location = item;
    }

    function getIncidents() {
      var data = incidentDB.incidents;
      for (var i in data) {
        data[i].order = parseInt(i + 1);
      }
      return data;
    }

    function saveIncident(item) {
      var i = _.findIndex(incidentDB.incidents, "id", item.id);
      if (i == -1) {
        incidentDB.incidents.push(item);
      }
    }

    function clearIncident() {
      incidentDB = {
        priority: { id: "3", text: "Medium", show: true },
        location: null,
        incidents: [],
        notes: []
      };
    }

    function removeIncidentByItem(item) {
      var i = _.findIndex(incidentDB.incidents, "id", item.id);

      if (i != -1) {
        _.pullAt(incidentDB.incidents, i);
      }

      if (item.hasOwnProperty("qty")) {
        item.qty = 0;
      }
    }

    function removeIncidentByIndex(incidentItems, idx) {
      var removedIncident = incidentDB.incidents.splice(idx, 1);

      if (removedIncident) {
        var i = _.findIndex(incidentItems, "id", removedIncident[0].id);

        if (i != -1) {
          incidentItems[i].checked = false;
          if (incidentItems[i].hasOwnProperty("qty")) {
            incidentItems[i].qty = 0;
          }
        }
      }
    }

    function getWorkOrders(fromServer) {
      var deferred = $q.defer();

      if (fromServer) {
        $http
          .get(config.serverBaseURL + "/REST_groupworkorder/allworkorders")
          .success(function(data) {
            var d = new Date();
            for (var i in data.orders) {
              var requeston = new Date(
                data.orders[i].RequestDate + " " + data.orders[i].RequestTime
              );
              var mins = Math.floor((d - requeston) / 60000);

              data.orders[i].Interval = mins;
              data.orders[i].TimeDisplay = mins.toString().toHHMM();

              switch (myInfo.userType) {
                case "SVC":
                  var diffhrs =
                    Math.round(d.getTime() - requeston.getTime()) / 3600000;
                  if (diffhrs > 0) {
                    data.orders[i].Alert = true;

                    if (data.orders[i].Status == "0") {
                      data.orders[i].DisplayText = "!";
                    } else {
                      data.orders[i].DisplayText = _getWOStatus(
                        data.orders[i].Status
                      );
                    }
                  } else {
                    data.orders[i].Alert = false;
                    data.orders[i].DisplayText = "";
                  }
                case "PMC":
                  var diffhrs =
                    Math.round(d.getTime() - requeston.getTime()) / 7200000;
                  if (diffhrs > 0) {
                    data.orders[i].Alert = true;

                    if (data.orders[i].Status == "0") {
                      data.orders[i].DisplayText = "!";
                    } else {
                      data.orders[i].DisplayText = _getWOStatus(
                        data.orders[i].Status
                      );
                    }
                  } else {
                    data.orders[i].Alert = false;
                    data.orders[i].DisplayText = "";
                  }
              }
            }

            workOrderDB = data.orders;
            deferred.resolve(workOrderDB);
          })
          .error(function(data) {
            deferred.reject();
          });
      } else {
        deferred.resolve(workOrderDB);
      }
      return deferred.promise;
    }

    function getWorkOrder(OrderNo) {
      var workOrder = _.find(workOrderDB, function(workOrder) {
        return workOrder.OrderNo == OrderNo;
      });
      return workOrder;
    }

    function sortWorkOrdersByLocation(sortToggle) {
      if (sortToggle) {
        workOrderDB = _.sortByOrder(
          workOrderDB,
          function(order) {
            return order.Location;
          },
          ["asc"]
        );
      } else {
        workOrderDB = _.sortByOrder(
          workOrderDB,
          function(order) {
            return order.Location;
          },
          "[desc]"
        );
      }
      return workOrderDB;
      //console.log(sorted);
    }

    function sortWorkOrdersByTime(sortToggle) {
      var sorted;
      if (sortToggle) {
        workOrderDB = _.sortByOrder(
          workOrderDB,
          function(order) {
            return new Date(order.RequestDate + " " + order.RequestTime);
          },
          ["asc"]
        );
      } else {
        workOrderDB = _.sortByOrder(
          workOrderDB,
          function(order) {
            return new Date(order.RequestDate + " " + order.RequestTime);
          },
          "[desc]"
        );
      }
      return workOrderDB;
      //console.log(sorted);
    }

    function sortWorkOrdersByPriority(sortToggle) {
      if (sortToggle) {
        workOrderDB = _.sortByOrder(
          workOrderDB,
          function(order) {
            return order.Priority;
          },
          ["asc"]
        );
      } else {
        workOrderDB = _.sortByOrder(
          workOrderDB,
          function(order) {
            return order.Priority;
          },
          "[desc]"
        );
      }

      return workOrderDB;
      //console.log(sorted);
    }

    function getWorkOrdersCount() {
      if (Array.isArray(workOrderDB)) {
        return workOrderDB.length;
      } else {
        return 0;
      }
    }

    function startMyWorkOrder(key, data) {
      var postData = { OrderNo: key, soneid: myInfo.soneid };

      var deferred = $q.defer(),
        timeout = $q.defer(),
        timedOut = false;

      setTimeout(function() {
        timedOut = true;
        timeout.resolve();
      }, 1000 * 5000);

      var httpRequest = $http({
        method: "post",
        url: config.serverBaseURL + "/REST_myworkorder/setstart",
        data: postData,
        cache: false,
        timeout: timeout.promise
      });

      httpRequest.success(function(result, status, headers, config) {
        if (result.status == "OK") {
          var d = new Date();

          data.Interval = 0;
          data.TimeDisplay = "";
          data.StartDateTime = d.toMysqlFormat();

          for (var i in data.Tasks) {
            data.Tasks[i].Checked = false;
            data.Tasks[i].started_on = d.toMysqlFormat();
            data.Tasks[i].started = 1;
          }

          var arr = _getFromStorage("myorders");
          var index = _.indexOf(arr, _.find(arr, { OrderNo: key }));

          if (index > -1) {
            arr.splice(index, 1, data);
            _saveToStorage("myorders", arr);
          }

          deferred.resolve(result);
        } else {
          deferred.reject(result);
        }
        //result.resolve(data);
      });

      httpRequest.error(function(result, status, headers, config) {
        deferred.reject(result);
      });
      /*   $http.post(config.serverBaseURL + '/REST_myworkorder/setstart',postData,{timeout:5000}).success(function(result){

                if(result.status == 'OK'){

                    var d = new Date();

                    data.Interval = 0;
                    data.TimeDisplay = "";
                    data.StartDateTime = d.toMysqlFormat();

                    for(var i in data.Tasks) {
                        data.Tasks[i].Checked = false;
                        data.Tasks[i].started_on = d.toMysqlFormat();
                        data.Tasks[i].started = 1;
                    }

                    var arr =  _getFromStorage('myorders');
                    var index = _.indexOf(arr, _.find(arr,{OrderNo: key}));

                    if (index > -1) {
                        arr.splice(index, 1, data);
                        _saveToStorage('myorders', arr);
                    }

                    deferred.resolve(result);
                } else {
                    deferred.reject(result);
                }
            }).error(function(result){
                //console.log(data);
                deferred.reject(result);
            })*/

      return deferred.promise;
    }

    function getMyWorkOrders(fromServer) {
      var arr = [];
      var d = new Date();
      var deferred = $q.defer();

      if (fromServer && !updatingMyWO) {
        // reset arr_msgid - nothing todo with GetMyWorkOrders
        msgid_interval = msgid_interval + 1;
        if (msgid_interval > 5) {
          msgid_interval = 0;
          arr_msgid.shift();
        }

        $http
          .get(config.serverBaseURL + "/REST_myworkorder/workorder")
          .success(function(data) {
            arr = _getFromStorage("myorders");

            if (arr.length > 0) {
              //Cache had data, compare with my cache

              _.forEach(data.orders, function(obj, key) {
                /* var found = _.find(arr, function (localworkorder) {
                                return localworkorder.OrderNo == obj.OrderNo;
                            });*/

                var idx = _.findIndex(arr, function(cache) {
                  return cache.OrderNo == obj.OrderNo;
                });

                if (idx > -1) {
                  if (!_.isEqual(arr[idx].Tasks.sort(), obj.Tasks.sort())) {
                    arr[idx].Tasks = obj.Tasks;
                  }

                  /* if ( arr[idx].Notes.length != obj.Notes.length ) {
                                    arr[idx].Notes = obj.Notes;
                                }*/
                } else {
                  /*switch(obj.Status){
                                  case  '0': obj.TimeDisplay = 'New'; break;
                                  case  '2': obj.TimeDisplay = 'DND'; break;
                                }*/

                  obj.TimeDisplay = _getWOStatus(obj.Status);

                  switch (obj.OnHold) {
                    case "0":
                      var requeston = new Date(
                        obj.RequestDate + " " + obj.RequestTime
                      );
                      var mins = Math.floor((d - requeston) / 60000);

                      obj.Interval = mins;
                      obj.TimeDisplay = mins.toString().toHHMM();
                      obj.StartDateTime = d.toMysqlFormat();
                      for (var i in obj.Tasks) {
                        obj.Tasks[i].Checked = false;
                      }
                      break;
                    case "1":
                      for (var i in obj.Tasks) {
                        obj.Tasks[i].Checked = false;
                        if (
                          obj.Tasks[i].started == "1" &&
                          obj.Tasks[i].soneid == myInfo.soneid
                        ) {
                          var requeston = new Date(obj.Tasks[i].started_on);
                          var mins = Math.floor((d - requeston) / 60000);
                          obj.TimeDisplay = mins.toString().toHHMM();
                          obj.Interval = mins;
                          obj.StartDateTime = obj.Tasks[i].started_on;
                        }
                      }
                      break;
                  }

                  //SORT Tasks - Put my tasks on top
                  /* obj.Tasks = _.sortBy(obj.Tasks, function(n) {
                                    return n.disabled;
                                });*/
                  obj.Tasks = _.sortBy(obj.Tasks, "disabled");

                  arr.push(obj);
                }
              });
            } else {
              _.forEach(data.orders, function(obj, key) {
                obj.TimeDisplay = _getWOStatus(obj.Status);

                switch (obj.OnHold) {
                  case "0":
                    var requeston = new Date(
                      obj.RequestDate + " " + obj.RequestTime
                    );
                    var mins = Math.floor((d - requeston) / 60000);

                    obj.Interval = mins;
                    obj.TimeDisplay = mins.toString().toHHMM();
                    obj.StartDateTime = d.toMysqlFormat();
                    for (var i in obj.Tasks) {
                      obj.Tasks[i].Checked = false;
                    }
                    break;
                  case "1":
                    for (var i in obj.Tasks) {
                      obj.Tasks[i].Checked = false;
                      if (
                        obj.Tasks[i].started == "1" &&
                        obj.Tasks[i].soneid == myInfo.soneid
                      ) {
                        var requeston = new Date(obj.Tasks[i].started_on);
                        var mins = Math.floor((d - requeston) / 60000);

                        obj.TimeDisplay = mins.toString().toHHMM();
                        obj.Interval = mins;
                        obj.StartDateTime = obj.Tasks[i].started_on;
                      }
                    }
                    break;
                }

                /*
                             SORT Tasks - Put my tasks on top
                            obj.Tasks = _.sortBy(obj.Tasks, function(n) {
                                return n.soneid != myInfo.soneid;
                            });*/

                obj.Tasks = _.sortBy(obj.Tasks, "disabled");
                arr.push(obj);
                //console.log(d,arr);
                startTimer = true;
              });
            }
            _saveToStorage("myorders", arr);
            deferred.resolve(arr);
          })
          .error(function(data) {
            deferred.reject();
          });
      } else {
        arr = _getFromStorage("myorders");
        deferred.resolve(arr);
      }
      return deferred.promise;
    }

    function getMyWOCount() {
      var arr = _getFromStorage("myorders");
      return arr.length;
    }

    /*function getMyNewWOCount(){
            var arr = _getFromStorage('myorders');

            arr = _.filter(arr, function(obj) {
                return typeof(obj.Interval) == "undefined";
            });

            return arr.length;

        }


        function getMyWorkOrdersOrderNo(){
            var arr = $window.localStorage && $window.localStorage.getItem('myorders');
            var str = "";
            if(Array.isArray(arr)) {
                for(var i = 0; i < arr.length; i++) {
                    str = str + arr[i].OrderNo + ';';
                }
            }
            return str;
        }*/

    function getMyWorkOrder(OrderNo) {
      var arr = _getFromStorage("myorders");
      var workOrder = _.find(arr, function(workOrder) {
        return workOrder.OrderNo == OrderNo;
      });

      return workOrder;
    }

    function getIsMyWOCountChanged() {
      return myWOCountChanged;
    }
    function setMyWOCountChanged(flag) {
      myWOCountChanged = flag;
    }

    function getIsMyWOItemChanged() {
      return myWOItemChanged;
    }

    function setMyWOItemChanged(flag) {
      myWOItemChanged = flag;
    }

    function setMyWorkOrder(status, WorkOrder) {
      var deferred = $q.defer();

      updatingMyWO = true;
      if (status == "COMP") {
        var postData = {
          OrderNo: WorkOrder.OrderNo,
          status: "COMP",
          soneid: myInfo.soneid
        };
        var incident_id = "";
        var counter = 0;
        for (var i in WorkOrder.Tasks) {
          if (WorkOrder.Tasks[i].Checked && !WorkOrder.Tasks[i].disabled) {
            if (counter > 0) {
              incident_id += "," + WorkOrder.Tasks[i].incident_id;
            } else {
              incident_id += WorkOrder.Tasks[i].incident_id;
            }
            counter++;
          }
        }
        postData.incident_id = incident_id;

        $http
          .post(config.serverBaseURL + "/REST_myworkorder/workorder", postData)
          .success(function(data) {
            updatingMyWO = false;
            if (data.status == "OK") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            } else if (data.status == "DELETE") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            }
            deferred.resolve(data);
          })
          .error(function(data) {
            //console.log(data);
            updatingMyWO = false;
            deferred.reject(data);
          });
      } else if (status == "DND") {
        var postData = {
          OrderNo: WorkOrder.OrderNo,
          status: "DND",
          soneid: myInfo.soneid
        };
        var incident_id = "";
        var counter = 0;
        for (var i in WorkOrder.Tasks) {
          if (WorkOrder.Tasks[i].Checked && !WorkOrder.Tasks[i].disabled) {
            if (counter > 0) {
              incident_id += "," + WorkOrder.Tasks[i].incident_id;
            } else {
              incident_id += WorkOrder.Tasks[i].incident_id;
            }
            counter++;
          }
        }
        postData.incident_id = incident_id;
        $http
          .post(config.serverBaseURL + "/REST_myworkorder/workorder", postData)
          .success(function(data) {
            updatingMyWO = false;
            if (data.status == "OK") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            } else if (data.status == "DELETE") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            }
            deferred.resolve(data);
          })
          .error(function(data) {
            //console.log(data);
            updatingMyWO = false;
            deferred.reject(data);
          });
      } else if (status == "STFPREV") {
        var postData = {
          OrderNo: WorkOrder.OrderNo,
          status: "STFPREV",
          soneid: myInfo.soneid
        };
        var incident_id = "";
        var counter = 0;
        for (var i in WorkOrder.Tasks) {
          if (!WorkOrder.Tasks[i].disabled) {
            if (counter > 0) {
              incident_id += "," + WorkOrder.Tasks[i].incident_id;
            } else {
              incident_id += WorkOrder.Tasks[i].incident_id;
            }
            counter++;
          }
        }
        postData.incident_id = incident_id;
        $http
          .post(config.serverBaseURL + "/REST_myworkorder/workorder", postData)
          .success(function(data) {
            updatingMyWO = false;
            if (data.status == "OK") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            } else if (data.status == "DELETE") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            }
            deferred.resolve(data);
          })
          .error(function(data) {
            //console.log(data);
            updatingMyWO = false;
            deferred.reject(data);
          });
      } else if (status == "STFSYS") {
        var postData = {
          OrderNo: WorkOrder.OrderNo,
          status: "STFSYS",
          soneid: myInfo.soneid
        };
        var incident_id = "";
        var counter = 0;
        for (var i in WorkOrder.Tasks) {
          if (!WorkOrder.Tasks[i].disabled) {
            if (counter > 0) {
              incident_id += "," + WorkOrder.Tasks[i].incident_id;
            } else {
              incident_id += WorkOrder.Tasks[i].incident_id;
            }
            counter++;
          }
        }
        postData.incident_id = incident_id;
        $http
          .post(config.serverBaseURL + "/REST_myworkorder/workorder", postData)
          .success(function(data) {
            updatingMyWO = false;
            if (data.status == "OK") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            } else if (data.status == "DELETE") {
              _removeMyWorkOrder(WorkOrder.OrderNo);
            }
            deferred.resolve(data);
          })
          .error(function(data) {
            //console.log(data);
            updatingMyWO = false;
            deferred.reject(data);
          });
      }
      return deferred.promise;
    }

    function _removeMyWorkOrder(OrderNo) {
      var arr = _getFromStorage("myorders");
      var index = _.indexOf(arr, _.find(arr, { OrderNo: OrderNo }));

      if (index > -1) {
        arr.splice(index, 1);

        _saveToStorage("myorders", arr);
      }
    }

    function sortMyWorkOrdersByLocation(sortToggle) {
      var orders = _getFromStorage("myorders");
      var sorted;

      if (sortToggle) {
        sorted = _.sortByOrder(
          orders,
          function(order) {
            return order.Location;
          },
          ["asc"]
        );
      } else {
        sorted = _.sortByOrder(
          orders,
          function(order) {
            return order.Location;
          },
          "[desc]"
        );
      }

      _saveToStorage("myorders", sorted);
      return sorted;
    }

    function sortMyWorkOrdersByTime(sortToggle) {
      var orders = _getFromStorage("myorders");
      var sorted;
      if (sortToggle) {
        sorted = _.sortByOrder(
          orders,
          function(order) {
            return new Date(order.RequestDate + " " + order.RequestTime);
          },
          ["asc"]
        );
      } else {
        sorted = _.sortByOrder(
          orders,
          function(order) {
            return new Date(order.RequestDate + " " + order.RequestTime);
          },
          "[desc]"
        );
      }
      _saveToStorage("myorders", sorted);
      return sorted;
    }

    function sortMyWorkOrdersByPriority(sortToggle) {
      var orders = _getFromStorage("myorders");
      var sorted;
      if (sortToggle) {
        sorted = _.sortByOrder(
          orders,
          function(order) {
            return order.Priority;
          },
          ["asc"]
        );
      } else {
        sorted = _.sortByOrder(
          orders,
          function(order) {
            return order.Priority;
          },
          "[desc]"
        );
      }

      _saveToStorage("myorders", sorted);
      return sorted;
    }

    function updEscalatedWO(OrderNo, incident_id) {
      var data = _getFromStorage("myorders");
      var deleteWO = true;
      var position = -1;
      for (var i in data) {
        if (data[i].OrderNo == OrderNo) {
          position = i;
          for (var j in data[i].Tasks) {
            if (incident_id.indexOf(data[i].Tasks[j].incident_id) != -1) {
              data[i].Tasks[j].disabled = true;
            } else {
              deleteWO = false;
            }
          }
        }
      }

      if (deleteWO && position != -1) {
        data.splice(position, 1);
      }
      _saveToStorage("myorders", data);
      return true;
    }

    function getPriorityText(priority) {
      var text = "Unknown";

      if (priority >= 0 && priority <= 5) {
        text = incidentPriorities[priority - 1].text;
      }

      return text;
    }

    function deleteWorkOrder(Id) {
      updatingMyWO = true;
      _removeMyWorkOrderById(Id);
      updatingMyWO = false;
    }

    function _removeMyWorkOrderById(id) {
      var arr = _getFromStorage("myorders");
      var index = _.indexOf(arr, _.find(arr, { Id: id }));

      if (index > -1) {
        arr.splice(index, 1);
        _saveToStorage("myorders", arr);
      }
    }

    function _getFromStorage(key) {
      var jsonString =
        $window.localStorage && $window.localStorage.getItem(key);
      try {
        var data = JSON.parse(jsonString);
        if (!data) {
          data = [];
        }
        return data;
      } catch (e) {
        return [];
      }
    }

    function _saveToStorage(key, arr) {
      var jsonString = JSON.stringify(arr);
      $window.localStorage && $window.localStorage.setItem(key, jsonString);
      myWOCountChanged = true;
      myWOItemChanged = true;
    }

    function _getWOStatus(status) {
      var text = "";
      switch (status) {
        case "0":
          text = "New";
          break;
        case "2":
          text = "DND";
          break;
      }
      return text;
    }

    function getUserType() {
      return myInfo.userType;
    }

    function getMyName() {
      return myInfo.myName;
    }

    function getSONEID() {
      return myInfo.soneid;
    }

    function getUUID() {
      return phone.uuid;
    }

    function setUUID(uuid) {
      phone.uuid = uuid;
    }

    function getIsLeader() {
      return myInfo.isLeader;
    }

    function postWorkOrder(dataForm) {
      return $http
        .post(config.serverBaseURL + "/REST_incident/add", dataForm)
        .then(
          function(response) {
            if (typeof response.data === "object") {
              return response.data;
            } else {
              // invalid response
              return $q.reject(response);
            }
          },
          function(response) {
            if (typeof response.data === "object") {
              return $q.reject(response.data);
            } else {
              return $q.reject(response);
            }
          }
        );
    }

    function getWhoAmI() {
      return $http.get(config.serverBaseURL + "/REST_mobileuser/whoami").then(
        function(response) {
          if (typeof response.data === "object") {
            return response.data;
          } else {
            // invalid response
            return $q.reject(response);
          }
        },
        function(response) {
          if (typeof response.data === "object") {
            return $q.reject(response.data);
          } else {
            return $q.reject(response);
          }
        }
      );
    }

    function setRefreshMonitorWO(flag) {
      refreshMonitorWO = flag;
    }

    function getRefreshMonitorWO() {
      return refreshMonitorWO;
    }

    function formatDateTime(mysqldate) {
      var datepart = mysqldate.split("-");
      var timepart = datepart[2].split(" ");
      return (
        timepart[0] + "-" + datepart[1] + "-" + datepart[0] + " " + timepart[1]
      );
    }

    function formatDate(mysqldate) {
      try {
        var datepart = mysqldate.split("-");
        return datepart[2] + "-" + datepart[1] + "-" + datepart[0];
      } catch (err) {}
    }

    function setUserInfo(id, data) {
      myInfo.userType = data.usertype;
      myInfo.myName = data.name;
      myInfo.soneid = id == null ? data.soneid : id;
      myInfo.myGroup = data.usergroup;
      myInfo.isLeader = data.isleader == "1";
      myInfo.phoneNo = data.phone;
    }

    function getUserInfo() {
      return myInfo;
    }

    function getSelectItems(resource, resparam, page, limit) {
      var deferred = $q.defer();
      var postData = { page: page, limit: limit };
      var url = "";

      if (resparam) {
        url = "/" + resource + "/records/" + resparam;
      } else {
        url = "/" + resource + "/records/";
      }

      $http
        .post(config.serverBaseURL + url, postData)
        .success(function(data) {
          if (typeof data === "object") {
            for (var idx in data.data) {
              data.data[idx].show = true;
            }
            deferred.resolve(data.data);
          } else {
            deferred.reject(data);
          }
        })
        .error(function(data) {
          deferred.reject(data);
        });

      return deferred.promise;
    }

    function searchSelectItem(resource, resparam, searchText) {
      var deferred = $q.defer();
      var postData = { search: searchText };
      var url = "";

      if (resparam) {
        url = "/" + resource + "/search/" + resparam;
      } else {
        url = "/" + resource + "/search/";
      }

      $http
        .post(config.serverBaseURL + url, postData)
        .success(function(data) {
          if (typeof data === "object") {
            for (var idx in data.data) {
              data.data[idx].show = true;
            }
            deferred.resolve(data.data);
          } else {
            deferred.reject(data);
          }
        })
        .error(function(data) {
          deferred.reject(data);
        });

      return deferred.promise;
    }

    return {
      getShortText: getShortText,
      setShortText: setShortText,
      saveNote: saveNote,
      getNotes: getNotes,
      removeNote: removeNote,
      getPriorities: getPriorities,
      getIncidentPriority: getIncidentPriority,
      savePriority: savePriority,
      getIncidentGroup: getIncidentGroup,
      getIncidentLocation: getIncidentLocation,
      getIncidentLocationSysId: getIncidentLocationSysId,
      saveIncidentLocation: saveIncidentLocation,
      getLocation: getLocation,
      getIncidents: getIncidents,
      saveIncident: saveIncident,
      clearIncident: clearIncident,
      removeIncidentByIndex: removeIncidentByIndex,
      removeIncidentByItem: removeIncidentByItem,
      getWorkOrders: getWorkOrders,
      getWorkOrder: getWorkOrder,
      sortWorkOrdersByLocation: sortWorkOrdersByLocation,
      sortWorkOrdersByTime: sortWorkOrdersByTime,
      sortWorkOrdersByPriority: sortWorkOrdersByPriority,
      getMyWOCount: getMyWOCount,
      getIsMyWOCountChanged: getIsMyWOCountChanged,
      setMyWOCountChanged: setMyWOCountChanged,
      getIsMyWOItemChanged: getIsMyWOItemChanged,
      setMyWOItemChanged: setMyWOItemChanged,
      getMyWorkOrders: getMyWorkOrders,
      getMyWorkOrder: getMyWorkOrder,
      startMyWorkOrder: startMyWorkOrder,
      sortMyWorkOrdersByLocation: sortMyWorkOrdersByLocation,
      sortMyWorkOrdersByTime: sortMyWorkOrdersByTime,
      sortMyWorkOrdersByPriority: sortMyWorkOrdersByPriority,
      getPriorityText: getPriorityText,
      getUserType: getUserType,
      getMyName: getMyName,
      getIsLeader: getIsLeader,
      getSONEID: getSONEID,
      getUUID: getUUID,
      setUUID: setUUID,
      setImageDir: setImageDir,
      getImageDir: getImageDir,
      setUserInfo: setUserInfo,
      getUserInfo: getUserInfo,
      setMyWorkOrder: setMyWorkOrder,
      postWorkOrder: postWorkOrder,
      getWhoAmI: getWhoAmI,
      login: login,
      logout: logout,
      setRefreshMonitorWO: setRefreshMonitorWO,
      getRefreshMonitorWO: getRefreshMonitorWO,
      formatDateTime: formatDateTime,
      formatDate: formatDate,
      getMSGIDARRAY: getMSGIDARRAY,
      setMSGIDARRAY: setMSGIDARRAY,
      getSelectItems: getSelectItems,
      searchSelectItem: searchSelectItem,
      updEscalatedWO: updEscalatedWO,
      deleteWorkOrder: deleteWorkOrder
    };
  })
  .factory("Camera", [
    "$q",
    function($q) {
      return {
        /** ---------------------------------------------------------------------
             *
             * @param options
             * @returns {*}
             *
             --------------------------------------------------------------------- */
        getPictureFromGallery: function(options) {
          var q = $q.defer();

          navigator.camera.getPicture(
            function(result) {
              // Do any magic you need
              q.resolve(result);
            },
            function(err) {
              q.reject(err);
            },
            options
          );

          return q.promise;
        },

        /** ---------------------------------------------------------------------
             *
             * @param options
             * @returns {*}
             *
             --------------------------------------------------------------------- */
        getPicture: function(options) {
          var q = $q.defer();

          navigator.camera.getPicture(
            function(result) {
              // Do any magic you need
              q.resolve(result);
            },
            function(err) {
              q.reject(err);
            },
            options
          );

          return q.promise;
        },
        /** ---------------------------------------------------------------------
             *
             * @param img_path
             * @returns {*}
             *
             --------------------------------------------------------------------- */
        resizeImage: function(img_path) {
          var q = $q.defer();
          window.imageResizer.resizeImage(
            function(success_resp) {
              // console.log('success, img re-size: ' + JSON.stringify(success_resp));
              q.resolve(success_resp);
            },
            function(fail_resp) {
              // console.log('fail, img re-size: ' + JSON.stringify(fail_resp));
              q.reject(fail_resp);
            },
            img_path,
            200,
            0,
            {
              imageDataType: ImageResizer.IMAGE_DATA_TYPE_URL,
              resizeType: ImageResizer.RESIZE_TYPE_MIN_PIXEL,
              pixelDensity: true,
              storeImage: false,
              photoAlbum: false,
              format: "jpg"
            }
          );

          return q.promise;
        },

        /** ---------------------------------------------------------------------
             *
             * @param img_path
             * @returns {*}
             *
             --------------------------------------------------------------------- */
        toBase64Image: function(img_path) {
          var q = $q.defer();
          window.imageResizer.resizeImage(
            function(success_resp) {
              // console.log('success, img toBase64Image: ' + JSON.stringify(success_resp));
              q.resolve(success_resp);
            },
            function(fail_resp) {
              // console.log('fail, img toBase64Image: ' + JSON.stringify(fail_resp));
              q.reject(fail_resp);
            },
            img_path,
            1,
            1,
            {
              imageDataType: ImageResizer.IMAGE_DATA_TYPE_URL,
              resizeType: ImageResizer.RESIZE_TYPE_FACTOR,
              format: "jpg"
            }
          );

          return q.promise;
        }
      };
    }
  ])
  .factory("AuthenticationService", function() {
    var auth = {
      isLogged: false
    };
    return auth;
  })
  .factory("UserService", function(config, $http) {
    return {
      login: function(soneid, uuid) {
        return $http.post(
          config.serverBaseURL + "/mobile/login",
          { soneid: soneid, uuid: uuid },
          { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" }
        );
      },
      logout: function(soneid, uuid) {
        //console.log($http.config);
        return $http.post(
          config.serverBaseURL + "/mobile/logout",
          { soneid: soneid, uuid: uuid },
          { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" }
        );
      }
    };
  })
  .factory("AuthInterceptor", function(
    $q,
    $rootScope,
    $window,
    $location,
    AuthenticationService
  ) {
    return {
      request: function(config) {
        /*$rootScope.$broadcast('loading:show')*/
        config.headers = config.headers || {};

        if ($window.sessionStorage.token) {
          config.headers["X-API-KEY"] = $window.sessionStorage.token;
        }
        return config;
      },
      requestError: function(rejection) {
        $rootScope.$broadcast("loading:hide");
        if ($rootScope.conn) {
          $rootScope.conn.disconnect();
          $rootScope.conn = null;
        }
        return $q.reject(rejection);
      },
      /* Set Authentication.isAuthenticated to true if 200 received */
      response: function(response) {
        $rootScope.$broadcast("loading:hide");
        if (
          response != null &&
          response.status == 200 &&
          $window.sessionStorage.token &&
          !AuthenticationService.isAuthenticated
        ) {
          AuthenticationService.isAuthenticated = true;
        }
        return response || $q.when(response);
      },
      /* Revoke client authentication if 401 is received */
      responseError: function(rejection) {
        $rootScope.$broadcast("loading:hide");
        if (
          rejection != null &&
          rejection.status === 401 &&
          ($window.sessionStorage.token ||
            AuthenticationService.isAuthenticated)
        ) {
          delete $window.sessionStorage.token;
          AuthenticationService.isAuthenticated = false;
          if ($rootScope.conn) {
            $rootScope.conn.disconnect();
            $rootScope.conn = null;
          }
          $location.path("/login");
        }

        return $q.reject(rejection);
      }
    };
  });
