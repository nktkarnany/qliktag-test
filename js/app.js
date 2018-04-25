var app = angular.module("App", ['ui-rangeSlider']);

app.controller("mainCtrl", ['$scope', 'Flight', '$filter', function ($scope, Flight, $filter) {

  // Price Slider Intialization
  $scope.price = {
    min: 0,
    max: 10000,
    userMin: 0,
    userMax: 10000
  };
  
  // Ideally, these should be populated inside the directive by 
  // making an http call to fetch them but for simplicity I am getting them from the service
  
  // Populating dates in autocomplete 
  $scope.allDates = Flight.allDates;
  
  // Populating Cities in autocomplete
  $scope.allCities = Flight.allCities;
  
  // Searching filter conditions
  $scope.filter = {
    srcCity: 'PNQ',
    destCity: 'DEL',
    depDate: '2nd May',
    retDate: '',
    err: '',
    oneWay: true
  };
  
  $scope.searched = {
    flights: [],
    depDate: '',
    retDate: '',
    oneWay: false,
    loading: false
  }
  
  var search = function () {
    // validations for input fields in the search filter
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
    // Also adding the price range to the filter so that all the filter conditions are inside filter literal
    $scope.filter.price = [$scope.price.userMin, $scope.price.userMax];
    
    // setting the loading to true to display the loader in the view
    $scope.searched.loading = true;
    
    $scope.searched.flights = [];
    
    // Fetching the searched results from the service which is built upon '$q' service of angularjs
    Flight.searchFlights($scope.filter).then(
      function(res) {
        $scope.searched.flights = res.data;
        $scope.searched.depDate = $scope.filter.depDate;
        $scope.searched.retDate = $scope.filter.retDate;
        $scope.searched.oneWay = $scope.filter.oneWay;
        $scope.searched.loading = false;
      },
      function (err) {
        console.log(err);
        $scope.searched.loading = false;
      });
  }
  
  $scope.search = function() {
    search();
  }
  
  $scope.priceChanged = function () {
    $scope.$apply(function() {
      search();
    });
  }
  
  // Searching With Initial Search Filter
  search();

}]);

app.service('Flight', ['$q', '$filter', '$timeout', function ($q, $filter, $timeout) {
  
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
    
    $timeout(function () {
      if (filterParams.oneWay)
        filteredFlights = $filter('flightsFilter')(oneWayFlights, filterParams);
      else
        filteredFlights = $filter('flightsFilter')(oneWayAndReturnFlights, filterParams);
    
      if (filteredFlights)
        deferred.resolve({code: 200, data: filteredFlights});
      else
        deferred.reject({code: 404, data: []});
    }, 1000);
    
    return deferred.promise;
  }
  
}]);

app.filter('flightsFilter', function() {
  return function(flights, filter) {
    var newFlights = [];
    flights.forEach(function (flight) { 
      if (filter.oneWay) {
        if (flight.date == filter.depDate && flight.source.city.code == filter.srcCity && flight.destination.city.code == filter.destCity && flight.price > filter.price[0] && flight.price < filter.price[1]) {
          newFlights.push({
            dep: flight
          });
        }
      } else {
        if (flight.dep.date == filter.depDate && flight.ret.date == filter.retDate && flight.dep.source.city.code == filter.srcCity && flight.dep.destination.city.code == filter.destCity && flight.ret.source.city.code == filter.destCity && flight.ret.destination.city.code == filter.srcCity && (flight.dep.price + flight.ret.price) > filter.price[0] && (flight.dep.price + flight.ret.price) < filter.price[1]) {
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
        $scope.open = true;
        $scope.items = $filter('filter')($scope.values, s);
      }
      
      $scope.selectItem = function (item) {
        if ($scope.isCity)
          $scope.term = item.code;
        else
          $scope.term = item;
        $scope.open = false;
      }
      
      $scope.hide = function () {
        $scope.open = false;
      }
      
    },
    template: `<div class="dropdown ng-class:{'open': open}">
                  <input type="text" class="form-control" placeholder="{{placeholder}}" aria-haspopup="true" aria-expanded="false" ng-model="term" ng-focus="search(term)" ng-blur="hide()">
                  <ul class="dropdown-menu" aria-labelledby="autocomplete">
                    <li ng-repeat="item in items" ng-mousedown="selectItem(item)"><a href=""><span ng-if="isCity">{{item.name}} - {{item.code}}</span><span ng-if="!isCity">{{item}}</span></a></li>
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
