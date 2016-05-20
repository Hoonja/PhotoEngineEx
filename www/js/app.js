// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'ngCordova'])

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
      return 'http://maukitest.cloudapp.net';
    }
  }
}])
.factory('remoteAPIService', [function() {
  return {
    getURL: function() {
      return 'http://maukitest.cloudapp.net';
    }
  }
}])
.factory('remoteStorageService', ['$http', 'RESTServer', function($http, RESTServer) {
  var getServerURL = RESTServer.getURL;

  function downloadData(key) {
    return $http({
      method: 'GET',
      url: getServerURL() + '/storage/',
      params: { key: key }
    });
  }

  function uploadData(key, data) {
    return $http({
      method: 'POST',
      url: getServerURL() + '/storage/',
      data: JSON.stringify({ key: key, data: JSON.stringify(data) })
    });
  }

  return {
    downloadData: downloadData,
    uploadData: uploadData
  };
}])
.factory('photoEngineService', ['$q', '$cordovaFile', function($q, $cordovaFile) {
  function getPhotoList() {
    var deferred = $q.defer();

    PhotoEngine.photoList(function(results) {
      var data = JSON.parse(results.data);
      if (results.error === '0') {
        deferred.resolve(data);
      } else {
        deferred.reject(data);
      }
    });

    return deferred.promise;
  }

  function getPhoto(index) {
    var deferred = $q.defer();

    PhotoEngine.base64Encoded(index, function(results) {
      console.dir(results);
      if (results.error === '0') {
        $cordovaFile.checkFile(cordova.file.documentsDirectory, index + '')
        .then(function(success) {
          console.log(index + 'file is exist');
          deferred.resolve(results.data);
        }, function(err) {
          console.dir(err);
          deferred.reject(err);
        });
      } else {
        deferred.reject(results.data);
      }
    });

    return deferred.promise;
  }

  return {
    getPhotoList: getPhotoList,
    getPhoto: getPhoto
  };
}])
.factory('imageImporter', ['$q', '$ionicPlatform', '$cordovaFileTransfer', 'remoteAPIService', 'photoEngineService', 'remoteStorageService', function($q,  $ionicPlatform, $cordovaFileTransfer, remoteAPIService, photoEngineService, remoteStorageService) {
  var beforeImages = [];
  var uploadedImages = [];
  var status;

  function init() {
    var deferred = $q.defer();
    remoteStorageService.downloadData('uploadedImages')
    .then(function(result) {
      beforeImages = result.data;
      // console.log(beforeImages);
      deferred.resolve(beforeImages);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function start() {

  }

  function pause() {

  }

  function resume() {

  }

  function stop() {

  }

  function getStatus() {
    return status;
  }

  return {
    getUploadedImages: function() { return beforeImages; },
    init: init,
    start: start,
    pause: pause,
    resume: resume,
    stop: stop,
    getStatus: getStatus
  }
}])
.controller('importImageCtrl', [function($scope) {

}])
.controller('mainCtrl', function($scope, $ionicPlatform, $cordovaFile, photoEngineService) {
  console.log('mainCtrl is invoked.');

  $scope.init = function() {
    console.log('ionic platform is ready.');
    $scope.photoes = [];
    photoEngineService.getPhotoList()
    .then(function(results){
      console.dir(results);
      for (var i = 0; i < results.length; i++) {
        (function(i){
          photoEngineService.getPhoto(results[i].id)
          .then(function(result) {
            $scope.photoes.push('file://' + result);
            console.dir($scope.photoSrces);
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
    $scope.init();
  });
});
