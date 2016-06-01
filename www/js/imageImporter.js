'use strict';

angular.module('starter')
.factory('imageImporter', ['$q', '$ionicPlatform', '$http', '$cordovaFileTransfer', 'RESTServer', 'photoEngineService', 'remoteStorageService', function($q,  $ionicPlatform, $http, $cordovaFileTransfer, RESTServer, photoEngineService, remoteStorageService) {
  var getServerURL = RESTServer.getURL;
  //  [URI, URI, ..]
  var uploadedImages = [];
  //  [{id, longitude, latitude, url}, {}, ... ]
  var imagesToUpload = [];
  var status = {
    name: 'notused',
    total: 0,
    current: 0
  };
  var timer = null;
  var progress = null;

  function updateProgress() {
    if (progress) {
      progress(status);
    }
  }

  function loadHistory() {
    var deferred = $q.defer();
    uploadedImages = [];
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

  function saveHistory(url) {
    uploadedImages.push(url);
    remoteStorageService.uploadData('uploaded_imgs', uploadedImages);
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

    while(findImage(imagesToUpload[status.current].url)) {
      status.current++;
      if (status.current === imagesToUpload.length) {
        complete();
        return;
      }
    }

    photoEngineService.getPhoto(imagesToUpload[status.current].id)
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
        // console.log('lon : ' + imagesToUpload[status.current].longitude);
        // console.log('lat : ' + imagesToUpload[status.current].latitude);
        console.log('local_datetime : ' + imagesToUpload[status.current].timestamp);
        $http({
          method: 'POST',
          url: getServerURL() + '/imgs/',
          data: JSON.stringify({
            content: response.url,
            lon: imagesToUpload[status.current].longitude,
            lat: imagesToUpload[status.current].latitude,
            local_datetime: '2015:04:22 11:54:19'
          }),
          params: {
            auth_user_token: 'gAAAAABXObzjJ2VYfgLeZZr_uAyLpsht7GAFvHLs3dTM5zS2jR7TvaSJB5MierVs7O1ETeWsV2871MHKFAoT_WEnqMmMcsd4GfMTNWG5FsFWFwf8ngdzcNy_vLirUdAtq5S4Je7F5Hvx',
            auth_vd_token: 'gAAAAABXPmPV9aLRV9Ao98UatlmZ80wubuKdb0pQAEj_UkK3dDKWOp4ZzpUdztG2_Ya45KMPm0jVIaksW9-aHh8GUqLB73P60A=='
          }
        })
        .then(function(result) {
          // console.dir(result);
          photoEngineService.deletePhoto(imagesToUpload[status.current].id);
          saveHistory(imagesToUpload[status.current].url);
          status.current++;
          updateProgress();
        }, function(err) {
          console.error('In posting to imgs :' + JSON.stringify(err));
          // console.dir(err);
        })
        .finally(function() {
          status.name = 'ready';
          if (status.current === imagesToUpload.length) {
            complete();
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

  function start(prograssCallback) {
    progress = prograssCallback || null;
    status.total = 0;
    status.current = 0;
    loadHistory()
    .then(function() {
      console.log('imageImporter start');
      photoEngineService.getPhotoList()
      .then(function(list) {
        console.log('In getPhotoList.');
        console.dir(list);
        imagesToUpload = list;
        status.total = imagesToUpload.length;
        // console.dir(imagesToUpload);
        status.name = 'ready';
        updateProgress();
        timer = setInterval(uploadImage, 1000);
        console.log('timerID : ' + JSON.stringify(timer));
      }, function(err) {
        console.error(err);
      });
    });
  }

  function pause() {
    console.log('imageImporter pause');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
      status.name = 'paused';
      updateProgress();
    }
  }

  function resume() {
    console.log('imageImporter resume');
    if (timer !== null) {
      return;
    }
    status.name = 'ready';
    updateProgress();
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
      updateProgress();
    }
  }

  function complete() {
    console.log('imageImporter complete');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
      updateProgress(); //  !! 이 위치가 중요(stop과의 차이점을 비교하라)
      status.name = 'completed';
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
    getImagesToUpload: function() { return imagesToUpload; },
    start: start,
    pause: pause,
    resume: resume,
    stop: stop,
    getStatus: getStatus
  }
}])
.factory('dummyImageImporter', [function() {
  return {
    getUploadedImages: function() {},
    getImagesToUpload: function() {},
    start: function() {},
    pause: function() {},
    resume: function() {},
    stop: function() {},
    getStatus: function() {},
  }
}]);
