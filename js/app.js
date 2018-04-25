var app = angular.module("App", ['ui-rangeSlider']);

app.controller("mainCtrl", function ($scope) {

  $scope.minPrice = 0;
  $scope.maxPrice = 10000;

  $scope.userMinPrice = $scope.minPrice;
  $scope.userMaxPrice = $scope.maxPrice;
  
  $scope.showValues = true;
  
  $scope.searched_flights = [
    {
      dep: {
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
        price: 4800
      }
    }
  ];

});

app.directive('flightCard', function () {
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
});
