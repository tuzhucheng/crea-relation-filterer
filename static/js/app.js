var app = angular.module('crea-relation-filterer', []);

app.controller('FilterController', ['$scope', '$http', function($scope, $http) {
  $http.get('/api/get_all_relations').
    success(function(data) {
      var relations = data.relations;

      var verbGroups = _.groupBy(relations, function(relation) {
          return relation.predicate;
      });

      $scope.checkboxes = {};
      for (var i = 0; i < relations.length; i++) {
        $scope.checkboxes[relations[i].id] = {};
        _.each(relations[i].groups, function(group) {
          $scope.checkboxes[relations[i].id]['group' + group] = true;
        });
        if(_.isUndefined(relations[i].swapped)) {
          relations[i].swapped = false;
        }
      }

      $scope.verbGroups = verbGroups;

      $scope.updateCategories();
    }).
    error(function(data) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $scope.swap = function(relation) {
    var temp = relation.object;
    relation.object = relation.subject;
    relation.subject = temp;
    relation.swapped = !relation.swapped;
  };

  $scope.abstractLink = function(id) {
    return 'http://www.ncbi.nlm.nih.gov/pubmed/' + id;
  }

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

  $scope.save = function() {
    var hash = CryptoJS.MD5($scope.password);
    var postObj = {relations: [], password: hash.toString(CryptoJS.enc.Hex)};

    _.each($scope.verbGroups, function(verbGroup) {
      _.each(verbGroup, function(relation) {
        delete relation.$$hashKey;

        var groups = [];
        if ($scope.checkboxes && $scope.checkboxes[relation.id] && $scope.checkboxes[relation.id].group1) {
          groups.push(1);
        }

        if ($scope.checkboxes && $scope.checkboxes[relation.id] && $scope.checkboxes[relation.id].group2) {
          groups.push(2);
        }

        if ($scope.checkboxes && $scope.checkboxes[relation.id] && $scope.checkboxes[relation.id].group3) {
          groups.push(3);
        }

        relation.groups = groups;
        postObj.relations.push(relation);
      });
    });

    $http({
      url: '/api/save_relations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(postObj)
    }).
    success(function(data) {
      $("#saved-success-alert").fadeIn().slideDown();
      window.setTimeout(function() {
        $("#saved-success-alert").fadeOut().slideUp();
      }, 3000);
    }).
    error(function(data) {
      $("#saved-error-alert").fadeIn().slideDown();
      window.setTimeout(function() {
        $("#saved-error-alert").fadeOut().slideUp();
      }, 3000);
    });
  }

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