// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova'])
// .config(function($httpProvider) {
//   $httpProvider.defaults.xsrfCookieName = 'csrftoken';
// 	$httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
// 	$httpProvider.defaults.timeout = 5000;
// })
.run(function($ionicPlatform, $cordovaFile) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
.factory('RESTServer', [function() {
  return {
    getURL: function() {
      return 'http://neapk-test01.japaneast.cloudapp.azure.com';
    }
  }
}])
.factory('remoteStorageService', ['$http', 'RESTServer', function($http, RESTServer) {
  var getServerURL = RESTServer.getURL;

  function downloadData(key) {
    return $http({
      method: 'GET',
      url: getServerURL() + '/storages/' + key + '/',
      params: {
        auth_user_token: 'gAAAAABXObzjJ2VYfgLeZZr_uAyLpsht7GAFvHLs3dTM5zS2jR7TvaSJB5MierVs7O1ETeWsV2871MHKFAoT_WEnqMmMcsd4GfMTNWG5FsFWFwf8ngdzcNy_vLirUdAtq5S4Je7F5Hvx',
        auth_vd_token: 'gAAAAABXPmPV9aLRV9Ao98UatlmZ80wubuKdb0pQAEj_UkK3dDKWOp4ZzpUdztG2_Ya45KMPm0jVIaksW9-aHh8GUqLB73P60A=='
      }
    });
  }

  function uploadData(key, data) {
    return $http({
      method: 'PATCH',
      url: getServerURL() + '/storages/' + key + '/',
      data: { value: JSON.stringify(data) },
      params: {
        auth_user_token: 'gAAAAABXObzjJ2VYfgLeZZr_uAyLpsht7GAFvHLs3dTM5zS2jR7TvaSJB5MierVs7O1ETeWsV2871MHKFAoT_WEnqMmMcsd4GfMTNWG5FsFWFwf8ngdzcNy_vLirUdAtq5S4Je7F5Hvx',
        auth_vd_token: 'gAAAAABXPmPV9aLRV9Ao98UatlmZ80wubuKdb0pQAEj_UkK3dDKWOp4ZzpUdztG2_Ya45KMPm0jVIaksW9-aHh8GUqLB73P60A=='
      }
    });
  }

  return {
    downloadData: downloadData,
    uploadData: uploadData
  };
}])
.controller('mainCtrl', function($scope, $ionicPlatform, $cordovaFile, $timeout, photoEngineService, imageImporter, remoteStorageService, dummyImageImporter, $q) {
  var iImporter = null;
  if (ionic.Platform.isIOS() || ionic.Platform.isAndroid()) {
    iImporter = imageImporter;
  } else {
    iImporter = dummyImageImporter;
  }
  console.log('mainCtrl is invoked.');
  $scope.ratio = 0;
  $scope.started = false;
	$scope.paused = false;

  $scope.init = function() {
    console.log('ionic platform is ready.');
    $scope.photoes = [];
    photoEngineService.getPhotoList()
    .then(function(results){
      // console.dir(results);
      for (var i = 0; i < results.length; i++) {
        (function(i){
          photoEngineService.getPhoto(results[i].id)
          .then(function(result) {
            $scope.photoes.push('file://' + result);
            // console.dir($scope.photoSrces);
            // $scope.$apply();
          }, function(err) {
            console.error(err);
          });
        })(i);
      }
    }, function(err) {
      console.error(err.data);
    });
  };

  $ionicPlatform.ready(function() {
    // $scope.init();
    // iImporter.init();
  });

  $scope.load = function() {
    remoteStorageService.downloadData('uploaded_imgs')
    .then(function(result){
      console.dir(JSON.parse(result.data.value));
    });
  }

  $scope.save = function() {
    remoteStorageService.uploadData('test', ['a', 'b', 'c', 'd', 'e'])
    .then(function(result) {
      console.log('save complete');
    });
  }

  $scope.reset = function() {
    remoteStorageService.uploadData('uploaded_imgs', [])
    .then(function(result) {
      console.log('reset complete');
    });
  }

  $scope.start = function() {
    $scope.started = true;
    iImporter.start(progress);
  };

  $scope.pause = function() {
    $scope.paused = true;
    iImporter.pause();
  };

  $scope.resume = function() {
    $scope.paused = false;
    iImporter.resume();
  };

  $scope.stop = function() {
    $scope.started = false;
		$scope.paused = false;
    iImporter.stop();
  };

  function progress(status) {
    $timeout(function() {
      if (status.name === 'completed') {
        console.log('import completed in app.js');
        $scope.ratio = 100;
  			$scope.started = false;
  			$scope.paused = false;
      } else {
        $scope.ratio = Math.floor(100*status.current/status.total);
      }
      $scope.status = status;
    }, 1);
  };

  $scope.testPromise = function() {
    console.log('testPromise');
    $q.all([
      samplePromise(1),
      samplePromise(2),
      samplePromise(3),
      samplePromise(4),
      samplePromise(5),
    ])
    .then(function(vals){
      console.log(vals);
    });
  }

  function samplePromise(input) {
    var deferred = $q.defer();
    var periode = Math.floor(Math.random()*10000)
    console.log('periode:' + periode);

    $timeout(function() {
      deferred.resolve(input);
    }, periode);

    return deferred.promise;
  }
});
