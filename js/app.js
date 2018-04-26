var app = angular.module("App", ['ui-rangeSlider', 'ngResource']);

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
    depDate: new Date('15-Mar-2018'),
    retDate: '',
    err: '',
    oneWay: true
  };
  
  // Literal to populate data after searching
  $scope.searched = {
    flights: [],
    depDate: '',
    retDate: '',
    oneWay: false,
    loading: false
  }
  
  // search function
  var search = function () {
    console.log($scope.filter);
    // validations for input fields in the search filter
    if ($scope.filter.srcCity == '') {
      $scope.filter.err = "Please enter your source city.";
      return;
    } else if ($scope.filter.destCity == '') {
      $scope.filter.err = "Please enter your destination city.";
      return;
    } else if ($scope.filter.depDate == null) {
      $scope.filter.err = "Please enter your departure date.";
      return;
    } else if ($scope.filter.retDate == null && $scope.filter.oneWay == false) {
      $scope.filter.err = "Please enter your departure date.";
      return;
    } else {
      $scope.filter.err = '';
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
        $scope.searched.depDate = $filter('date')($scope.filter.depDate, "dd-MMM-yyyy");
        $scope.searched.retDate = $filter('date')($scope.filter.retDate, "dd-MMM-yyyy");
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

// This service holds all the data for flights
app.service('Flight', ['$q', '$filter', '$timeout', 'JsonService', '$http', function ($q, $filter, $timeout, JsonService, $http) {
  
  // possible dates in the departure and return date input fields
  this.allDates = ['2nd May', '4th May', '6th May', '19th May'];
  
  // possible cities in the source and destination city input fields
  this.allCities = [
    {
      name: "Pune",
      code: "PNQ"
    }, {
      name: "Delhi",
      code: "DEL"
    }, {
      name: "Mumbai",
      code: "BOM"
    }
  ];
  
  // variable to save one way flights array
  var oneWayFlights = [];
  // variable to save return flights array
  var oneWayAndReturnFlights = [];
  
  // A method which return a promise
  // This method fetches the json from the local file and performs a search based on the filter params
  this.searchFlights = function (filterParams) {
    
    var deferred = $q.defer();
    
    var filteredFlights = [];
    
    var config = {
      "Content-Type": "application/json"
    };

    var data = {
      OperationDate:$filter('date')(filterParams.depDate, 'dd-MMM-yyyy'),
      airlineCode:"",
      fromAirport:filterParams.srcCity,
      fromTime:"",
      source:1,
      toAirport:filterParams.destCity,
      toTime:""
    };

    $http.post('http://airsewa.gov.in/api/Web/AKS_GetFlightSchedule', data, config)
      .then(function (res) {
      console.log(res);
      if (res.data.errJson)
        deferred.resolve({code: 200, data: res.data.errJson.airlineList});
      else
        deferred.reject({code: 404, data: []});
    }, function (err) {
      deferred.reject({code: 404, data: err});
    });

//    $timeout(function () {
//      JsonService.allFlights.get({}, function (data) {
//        var oneWayFlights = data.oneWay;
//        var oneWayAndReturnFlights = data.return;
//        if (filterParams.oneWay)
//          filteredFlights = $filter('flightsFilter')(oneWayFlights, filterParams);
//        else
//          filteredFlights = $filter('flightsFilter')(oneWayAndReturnFlights, filterParams);
//
//        if (filteredFlights)
//          deferred.resolve({code: 200, data: filteredFlights});
//        else
//          deferred.reject({code: 404, data: []});
//      });
//    }, 1000);
    
    return deferred.promise;
  }
  
}]);

// this service fetches the json file from the data directory
app.service('JsonService', ['$resource', function($resource) {
  this.allFlights = $resource('/data/allFlights.json');
}]);

// time filter for dates of flights schedule
app.filter('onlyTime', ['$filter', function ($filter) {
  return function (schedule) {
    if (schedule == '--')
      return "NA";
    else
      return $filter('date')(new Date(schedule), "shortTime");

  }
}]);

// a reusable autocomplete input elements used for all the input types in the search field
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
                  <input type="text" class="form-control" placeholder="{{placeholder}}" aria-haspopup="true" aria-expanded="false" ng-model="term" ng-change="search(term)" ng-focus="search(term)" ng-blur="hide()">
                  <ul class="dropdown-menu" aria-labelledby="autocomplete">
                    <li ng-repeat="item in items" ng-mousedown="selectItem(item)"><a href=""><span ng-if="isCity">{{item.name}} - {{item.code}}</span><span ng-if="!isCity">{{item}}</span></a></li>
                  </ul>
                </div>`
    };
}]);

// a directive to display flight card in the search results
app.directive('flightCard', [function () {
  return {
    restrict: 'E',
    scope: {
      flight: '=',
      isOneWay: '=',
      filter: '='
    },
    template: `
      <div class="card">
        <div class="card-body">
          <div class="card-content">
            <div class="one-way">
              <div>
                <div class="time">{{flight.departureTime | onlyTime}}</div>
                <div class="city">{{filter.srcCity}}</div>
              </div>
              <div>
                <div class="flight">{{flight.airlineName}} - {{flight.flightNo}}</div>
                <div><img src="./img/srp_arrow.svg"></div>
                <div class="type">Departure</div>
              </div>
              <div>
                <div class="time">{{flight.arrivalTime | onlyTime}}</div>
                <div class="city">{{filter.destCity}}</div>
              </div>
            </div>
            <div class="return" ng-hide="isOneWay">
              <div>
                <div class="time">{{flight.departureTime}}</div>
                <div class="city">{{filter.destCity}}</div>
              </div>
              <div>
                <div class="flight">{{flight.airlineName}} - {{flight.flightNo}}</div>
                <div><img src="./img/srp_arrow.svg"></div>
                <div class="type">Return</div>
              </div>
              <div>
                <div class="time">{{flight.arrivalTime}}</div>
                <div class="city">{{filter.srcCity}}</div>
              </div>
            </div>
            <div class="action">
              <!--<div class="price" ng-if="isOneWay">₹{{flight.dep.price}}</div>
              <div class="price" ng-if="!isOneWay">₹{{flight.dep.price + flight.ret.price}}</div>-->
              <button class="btn btn-primary">BOOK</button>
            </div>
          </div>
        </div>
      </div>`
  };
}]);
