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
      return 'http://maukitest.cloudapp.net';
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
      // console.dir(results);
      if (results.error === '0') {
        // $cordovaFile.checkFile(cordova.file.documentsDirectory, index + '')
        // .then(function(success) {
        //   console.log(index + 'file is exist');
          deferred.resolve(results.data);
        // }, function(err) {
        //   console.dir(err);
        //   deferred.reject(err);
        // });
      } else {
        deferred.reject(results.data);
      }
    });

    return deferred.promise;
  }

  function deletePhoto(index) {
    var deferred = $q.defer();

    $cordovaFile.removeFile(cordova.file.documentsDirectory, index + '')
    .then(function(result) {
      // console.dir(result);
      // $cordovaFile.checkFile(cordova.file.documentsDirectory, index + '')
      // .then(function(success) {
      //   console.log(index + 'file is exist');
      // }, function(err) {
      //   console.dir(err);
      // })
      // .finally(function() {
        deferred.resolve();
      // });
    }, function(err) {
      console.error(err);
      deferred.reject(err);
    });

    return deferred.promise;
  }

  return {
    getPhotoList: getPhotoList,
    getPhoto: getPhoto,
    deletePhoto: deletePhoto
  };
}])
.factory('imageImporter', ['$q', '$ionicPlatform', '$http', '$cordovaFileTransfer', 'RESTServer', 'photoEngineService', 'remoteStorageService', function($q,  $ionicPlatform, $http, $cordovaFileTransfer, RESTServer, photoEngineService, remoteStorageService) {
  var getServerURL = RESTServer.getURL;
  //  [URI, URI, ..]
  var uploadedImages = [];
  //  [{id, longitude, latitude, url}, {}, ... ]
  var beforeImages = [];
  var completedImages = [];
  var status = {
    name: 'notused',
    total: 0,
    current: 0
  };
  var timer = null;

  function loadHistory() {
    var deferred = $q.defer();
    remoteStorageService.downloadData('uploaded_imgs')
    .then(function(result) {
      uploadedImages = JSON.parse(result.data.value) || [];
      console.dir(uploadedImages);
      status.name = 'init';
      deferred.resolve();
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function findImage(key) {
    for (var i = 0; i < uploadedImages.length; i++) {
      if (uploadedImages[i] === key) {
        return true;
      }
    }
    return false;
  }

  function uploadImage() {
    console.log('uploadImage..(status:' + status.name + ')');
    if (status.name !== 'ready') {
      return;
    } else {
      status.name = 'uploading';
    }

    while(findImage(beforeImages[status.current].url)) {
      status.current++;
      if (status.current === beforeImages.length) {
        stop();
        return;
      }
    }

    photoEngineService.getPhoto(beforeImages[status.current].id)
    .then(function(fileURI) {
      // console.log('image path : ' + fileURI);
      var options = {
        fileKey: 'file',
        httpMethod: 'POST',
        params: {
          auth_user_token: 'gAAAAABXObzjJ2VYfgLeZZr_uAyLpsht7GAFvHLs3dTM5zS2jR7TvaSJB5MierVs7O1ETeWsV2871MHKFAoT_WEnqMmMcsd4GfMTNWG5FsFWFwf8ngdzcNy_vLirUdAtq5S4Je7F5Hvx',
          auth_vd_token: 'gAAAAABXPmPV9aLRV9Ao98UatlmZ80wubuKdb0pQAEj_UkK3dDKWOp4ZzpUdztG2_Ya45KMPm0jVIaksW9-aHh8GUqLB73P60A=='
        }
      };
      $cordovaFileTransfer.upload(getServerURL() + '/rfs/', fileURI, options)
      .then(function(result) {
        var response = JSON.parse(result.response);
        // console.dir(response);
        // console.log('lon : ' + beforeImages[status.current].longitude);
        // console.log('lat : ' + beforeImages[status.current].latitude);
        $http({
          method: 'POST',
          url: getServerURL() + '/imgs/',
          data: JSON.stringify({
            content: response.url,
            lon: beforeImages[status.current].longitude,
            lat: beforeImages[status.current].latitude,
            local_datetime: '2015:04:22 11:54:19'
          }),
          params: {
            auth_user_token: 'gAAAAABXObzjJ2VYfgLeZZr_uAyLpsht7GAFvHLs3dTM5zS2jR7TvaSJB5MierVs7O1ETeWsV2871MHKFAoT_WEnqMmMcsd4GfMTNWG5FsFWFwf8ngdzcNy_vLirUdAtq5S4Je7F5Hvx',
            auth_vd_token: 'gAAAAABXPmPV9aLRV9Ao98UatlmZ80wubuKdb0pQAEj_UkK3dDKWOp4ZzpUdztG2_Ya45KMPm0jVIaksW9-aHh8GUqLB73P60A=='
          }
        })
        .then(function(result) {
          // console.dir(result);
          photoEngineService.deletePhoto(beforeImages[status.current].id);
          uploadedImages.push(beforeImages[status.current].url);
          remoteStorageService.uploadData('uploaded_imgs', uploadedImages);
          status.current++;
        }, function(err) {
          console.error('In posting to imgs :' + JSON.stringify(err));
          // console.dir(err);
        })
        .finally(function() {
          status.name = 'ready';
          if (status.current === beforeImages.length) {
            stop();
          }
        });
      }, function(err) {
        console.error('In cordovaFileTransfer: ' + err);
      });
      //  3. delete tempfile

    }, function(err) {
      console.error('In uploadImage : ' + err);
    });
  }

  function start() {
    loadHistory()
    .then(function() {
      console.log('imageImporter start');
      photoEngineService.getPhotoList()
      .then(function(list) {
        beforeImages = list;
        status.total = beforeImages.length;
        // console.dir(beforeImages);
        status.name = 'ready';
        timer = setInterval(uploadImage, 1000);
      }, function(err) {
        console.error(err);
      });
    });
  }

  function startTest() {
    beforeImages = ['a', 'b', 'c', 'd', 'e'];
    status.name = 'ready';
    timer = setInterval(uploadImage, 1000);
  }

  function pause() {
    console.log('imageImporter pause');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
      status.name = 'paused';
    }
  }

  function resume() {
    console.log('imageImporter resume');
    if (timer !== null) {
      return;
    }
    status.name = 'ready';
    timer = setInterval(uploadImage, 1000);
  }

  function stop() {
    console.log('imageImporter stop');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
      status.name = 'stopped';
      status.total = 0;
      status.current = 0;
      uploadedImages = [];
    }
  }

  function getStatus() {
    return status;
  }

  return {
    getUploadedImages: function() { return uploadedImages; },
    getImagesToUpload: function() { return beforeImages; },
    start: start,
    startTest: startTest,
    pause: pause,
    resume: resume,
    stop: stop,
    getStatus: getStatus
  }
}])
.controller('mainCtrl', function($scope, $ionicPlatform, $cordovaFile, photoEngineService, imageImporter, remoteStorageService) {
  console.log('mainCtrl is invoked.');

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
    // imageImporter.init();
  });

  $scope.load = function() {
    remoteStorageService.downloadData('test')
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
    imageImporter.start();
  };

  $scope.pause = function() {
    imageImporter.pause();
  };

  $scope.resume = function() {
    imageImporter.resume();
  };

  $scope.stop = function() {
    imageImporter.stop();
  };
});
