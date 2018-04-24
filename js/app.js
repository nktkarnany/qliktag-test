angular.module("App", ['ui-rangeSlider']);

angular.module("App").controller("mainCtrl", function ($scope) {

  $scope.minPrice = 0;
  $scope.maxPrice = 10000;

  $scope.userMinPrice = $scope.minPrice;
  $scope.userMaxPrice = $scope.maxPrice;
  
  $scope.showValues = true;

});
