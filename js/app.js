var app = angular.module("App", ['ui-rangeSlider']);

app.controller("mainCtrl", ['$scope', 'Flight', '$filter', function ($scope, Flight, $filter) {

  // Intializations
  $scope.price = {
    min: 0,
    max: 10000,
    userMin: 2000,
    userMax: 7000
  };
  
  // Populating dates
  $scope.allDates = Flight.allDates;
  // Populating Cities
  $scope.allCities = Flight.allCities;
  
  $scope.filter = {
    srcCity: '',
    destCity: '',
    depDate: '',
    retDate: '',
    err: '',
    oneWay: true
  };
  
  $scope.searched_flights = [];
  
  var search = function () {
    if ($scope.filter.srcCity == '') {
      $scope.filter.err = "Please enter your source city.";
      return;
    } else if ($scope.filter.destCity == '') {
      $scope.filter.err = "Please enter your destination city.";
      return;
    } else if ($scope.filter.depDate == '') {
      $scope.filter.err = "Please enter your departure date.";
      return;
    } else if ($scope.filter.retDate == '' && $scope.filter.oneWay == false) {
      $scope.filter.err = "Please enter your departure date.";
      return;
    }
    $scope.filter.price = [$scope.price.userMin, $scope.price.userMax];
    Flight.searchFlights($scope.filter).then(
      function(res) {
        $scope.searched_flights = res.data;
      },
      function (err) {
        console.log(err);
      });
  }
  
  $scope.search = function() {
    search();
  }

}]);

app.service('Flight', ['$q', '$filter', function ($q, $filter) {
  
  this.allDates = ['2nd May', '4th May'];
  this.allCities = [
    {
      name: "Pune",
      code: "PNQ"
    }, {
      name: "Delhi",
      code: "DEL"
    }
  ];
  
  var oneWayFlights = [
    {
      date: "2nd May",
      source: {
        city: {
          name: "Pune",
          code: "PNQ"
        },
        time: "10:00AM"
      },
      destination: {
        city: {
          name: "Delhi",
          code: "DEL"
        },
        time: "12:00PM"
      },
      flight_no: "AOL-31",
      price: 4500
    }, {
      date: "4th May",
      source: {
        city: {
          name: "Delhi",
          code: "DEL"
        },
        time: "3:00PM"
      },
      destination: {
        city: {
          name: "Pune",
          code: "PNQ"
        },
        time: "6:00PM"
      },
      flight_no: "AOL-33",
      price: 4700
    }
  ];
  
  var oneWayAndReturnFlights = [
    {
      dep: {
        date: "2nd May",
        source: {
          city: {
            name: "Pune",
            code: "PNQ"
          },
          time: "10:00AM"
        },
        destination: {
          city: {
            name: "Delhi",
            code: "DEL"
          },
          time: "12:00PM"
        },
        flight_no: "AOL-31",
        price: 4500
      },
      ret: {
        date: "4th May",
        source: {
          city: {
            name: "Delhi",
            code: "DEL"
          },
          time: "3:00PM"
        },
        destination: {
          city: {
            name: "Pune",
            code: "PNQ"
          },
          time: "6:00PM"
        },
        flight_no: "AOL-33",
        price: 4700
      }
    }
  ];
  
  this.searchFlights = function (filterParams) {
    
    var deferred = $q.defer();
    
    var filteredFlights = [];
    
    if (filterParams.oneWay)
      filteredFlights = $filter('flightsFilter')(oneWayFlights, filterParams);
    else
      filteredFlights = $filter('flightsFilter')(oneWayAndReturnFlights, filterParams);
    
    if (filteredFlights)
      deferred.resolve({code: 200, data: filteredFlights});
    else
      deferred.reject({code: 404, data: []});
    
    return deferred.promise;
  }
  
}]);

app.filter('flightsFilter', function() {
  return function(flights, filter) {
    var newFlights = [];
    flights.forEach(function (flight) { 
      if (filter.oneWay) {
        if (flight.date == filter.depDate && flight.source.city.code == filter.srcCity && flight.destination.city.code == filter.destCity) {
          newFlights.push({
            dep: flight
          });
        }
      } else {
        if (flight.dep.date == filter.depDate && flight.ret.date == filter.retDate && flight.dep.source.city.code == filter.srcCity && flight.dep.destination.city.code == filter.destCity && flight.ret.source.city.code == filter.destCity && flight.ret.destination.city.code == filter.srcCity) {
          newFlights.push(flight);
        }
      }
    });
    return newFlights;
  }
});

app.directive('autocomplete', ['$timeout', '$filter', function ($timeout, $filter) {
  return {
    restrict: 'E',
    scope: {
      placeholder: '@',
      term: '=val',
      values: '=',
      isCity: '@'
    },
    controller: function ($scope) {
      $scope.search = function (s) {
        if (s != '')
          $scope.items = $filter('filter')($scope.values, s);
        else
          $scope.items = [];
      }
      $scope.selectItem = function (item) {
        if ($scope.isCity)
          $scope.term = item.code;
        else
          $scope.term = item;
        $scope.items = [];
      }
    },
    template: `<div class="dropdown ng-class:{'open':items.length > 0}">
                  <input type="text" class="form-control" placeholder="{{placeholder}}" aria-haspopup="true" aria-expanded="false" ng-model="term" ng-change="search(term)">
                  <ul class="dropdown-menu" aria-labelledby="autocomplete">
                    <li ng-repeat="item in items" ng-click="selectItem(item)"><a href=""><span ng-if="isCity">{{item.name}} - {{item.code}}</span><span ng-if="!isCity">{{item}}</span></a></li>
                  </ul>
                </div>`
    };
}]);

app.directive('flightCard', [function () {
  return {
    restrict: 'E',
    scope: {
      flight: '=',
      isOneWay: '='
    },
    template: `
      <div class="card">
        <div class="card-body">
          <div class="card-content">
            <div class="one-way">
              <div>
                <div class="time">{{flight.dep.source.time}}</div>
                <div class="city">{{flight.dep.source.city.code}}</div>
              </div>
              <div>
                <div class="flight">{{flight.dep.flight_no}}</div>
                <div><img src="./img/srp_arrow.svg"></div>
                <div class="type">Departure</div>
              </div>
              <div>
                <div class="time">{{flight.dep.destination.time}}</div>
                <div class="city">{{flight.dep.destination.city.code}}</div>
              </div>
            </div>
            <div class="return" ng-hide="isOneWay">
              <div>
                <div class="time">{{flight.ret.source.time}}</div>
                <div class="city">{{flight.ret.source.city.code}}</div>
              </div>
              <div>
                <div class="flight">{{flight.ret.flight_no}}</div>
                <div><img src="./img/srp_arrow.svg"></div>
                <div class="type">Return</div>
              </div>
              <div>
                <div class="time">{{flight.ret.destination.time}}</div>
                <div class="city">{{flight.ret.destination.city.code}}</div>
              </div>
            </div>
            <div class="action">
              <div class="price" ng-if="isOneWay">₹{{flight.dep.price}}</div>
              <div class="price" ng-if="!isOneWay">₹{{flight.dep.price + flight.ret.price}}</div>
              <button class="btn btn-primary">BOOK</button>
            </div>
          </div>
        </div>
      </div>`
  };
}]);
