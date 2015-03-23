var app = angular.module('crea-relation-filterer', []);

app.controller('FilterController', ['$scope', '$http', function($scope, $http) {
  $http.get('/api/get_all_relations').
    success(function(data) {
      var relations = data.relations;

      _.each(relations, function(relation, index) {
        relation.id = index + 1;
      });
      var verbGroups = _.groupBy(relations, function(relation) {
          return relation.predicate;
      });

      $scope.checkboxes = {};
      for (var i = 1; i <= relations.length; i++) {
        $scope.checkboxes[i] = {};
      }

      $scope.verbGroups = verbGroups;
    }).
    error(function(data) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $scope.swap = function(relation) {
    var temp = relation.object;
    relation.object = relation.subject;
    relation.subject = temp;
    if(_.isUndefined(relation.swapped)) {
      relation.swapped = true;
    } else {
      relation.swapped = !relation.swapped;
    }
  };

  $scope.updateCategories = function() {
    var groups = {'1': [], '2': [], '3': []};
    _.each($scope.verbGroups, function(verbGroup) {
      _.each(verbGroup, function(relation) {
        if ($scope.checkboxes && $scope.checkboxes[relation.id] && $scope.checkboxes[relation.id].group1) {
          groups['1'].push(relation);
        }

        if ($scope.checkboxes && $scope.checkboxes[relation.id] && $scope.checkboxes[relation.id].group2) {
          groups['2'].push(relation);
        }

        if ($scope.checkboxes && $scope.checkboxes[relation.id] && $scope.checkboxes[relation.id].group3) {
          groups['3'].push(relation);
        }
      });
    });

    $scope.categorized = groups;
  };

  $scope.pgExport = function() {
    var postObj = {relations: []};

    _.each($scope.verbGroups, function(verbGroup) {
      _.each(verbGroup, function(relation) {
        delete relation.$$hashKey;
        postObj.relations.push(relation);
      });
    });

    $http({
      url: '/api/get_pg_export',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(postObj)
    }).
    success(function(data) {
      console.log('POST success');
      var element = angular.element('<a/>');
      element.attr({
         href: 'data:attachment/csv;charset=utf-8,' + encodeURI(data),
         target: '_blank',
         download: 'pg_export.csv'
      })[0].click();
    }).
    error(function(data) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  };

}]);