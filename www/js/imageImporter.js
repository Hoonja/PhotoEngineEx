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
  var useCellNetwork = false;

  // function canUploadImage() {
  //   var conType = $cordovaNetwork.getNetwork();
  //   var isOnline = $cordovaNetwork.isOnline();
  //
  //   if (isOnline === false) {
  //     console.warn('Cannot upload images cause of Offline');
  //     return false;
  //   } else {
  //     if (useCellNetwork) {
  //       console.info('Can upload image cause of useCellNetwork');
  //       return true;
  //     } else {
  //       if (conType === 'wifi') {
  //         console.info('Can upload image cause of useCellNetwork = false but wifi');
  //         return true;
  //       } else {
  //         console.warn('Cannot upload image cause of useCellNetwork = false and wifi = false');
  //         return false;
  //       }
  //     }
  //   }
  //   // Connection.TYPE_UNKNOWN = "unknown";
  //   // Connection.TYPE_ETHERNET = "ethernet";
  //   // Connection.TYPE_ETHERNET_SHORT = "eth";
  //   // Connection.TYPE_WIFI = "wifi";
  //   // Connection.TYPE_2G = "2g";
  //   // Connection.TYPE_3G = "3g";
  //   // Connection.TYPE_4G = "4g";
  //   // Connection.TYPE_NONE = "none";
  // }

  function updateProgress(stateName) {
    status.name = stateName;

    if (progress) {
      progress(status);
    }
  }

  function loadHistory() {
    var deferred = $q.defer();
    uploadedImages = [];
    remoteStorageService.downloadData('uploaded_imgs')
    .then(function(result) {
      try {
      uploadedImages = JSON.parse(result.data.value) || [];
        // console.dir(uploadedImages);
      deferred.resolve();
      } catch (e) {
        console.error(e.message);
        deferred.reject(e);
      }
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  }

  function saveHistory(url) {
    uploadedImages.push(url);
    remoteStorageService.uploadData('uploaded_imgs', uploadedImages);
    console.dir(uploadedImages);
  }

  function findImage(key) {
    console.log('findImage : ' + key + ', uploadedIamges.length: ' + uploadedImages.length);
    for (var i = 0; i < uploadedImages.length; i++) {
      if (uploadedImages[i] === key) {
        return true;
      }
    }
    return false;
  }

  //  Android와 iOS에서 반환하는 타임스탬프의 형식이 서로 달라 부득이하게 분기해서 처리함
  //  원하는 최종 형식은 Android가 반환하는 형식이긴 함
  //  호성이가 수정해 줄때까지는 이 로직을 유지할 예정
  function convertToTimeString(timestamp) {
    var result = '';

    if (ionic.Platform.isIOS()) {
      var dd = new Date(timestamp * 1000);  // 자바스크립트는 초단위가 아닌 밀리초단위로 입력 받는다
      var month = (dd.getUTCMonth() + 1) + ':';
      var day = dd.getUTCDate() + ' ';
      var hour = dd.getUTCHours() + ':';
      var min = dd.getUTCMinutes() + ':';
      var sec = dd.getUTCSeconds() + '';

      result += dd.getUTCFullYear() + ':';
      result += ((month.length === 2) ? '0' : '') + month;
      result += ((day.length === 2) ? '0' : '') + day;
      result += ((hour.length === 2) ? '0' : '') + hour;
      result += ((min.length === 2) ? '0' : '') + min;
      result += ((sec.length === 1) ? '0' : '') + sec;
    } else if (ionic.Platform.isAndroid()) {
      result = timestamp;
    } else {
      result = '';
    }

    return result;  //  2015:04:22 11:54:19와 같은 형식
  }

  function uploadImage() {
    console.log('uploadImage..(status:' + status.name + ')');
    if (status.name !== 'ready') {
      return;
    } else {
      updateProgress('uploading');
    }

    // console.log('uploadImage : findImage');
    // console.log('status..');
    // console.dir(status);
    // console.log('imagesToUpload..');
    // console.dir(imagesToUpload);
    // console.log('imagesToUpload.url : ' + imagesToUpload[status.current].url);
    while(findImage(imagesToUpload[status.current].url)) {
      status.current++;
      console.log('In find Image :', status.name, status.current, status.total);
      if (status.current === imagesToUpload.length) {
        console.log('complete???');
        complete();
        return;
      }
    }

    console.log('uploadImage : getPhoto');
    console.log('imagesToUpload[status.current].id = ' + imagesToUpload[status.current].id);
    photoEngineService.getPhoto(imagesToUpload[status.current].id)
    .then(function(fileURI) {
      console.log('image path : ' + fileURI);
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
        var response;
        try {
          response = JSON.parse(result.response);
          // console.dir(response);
          // console.log('lon : ' + imagesToUpload[status.current].longitude);
          // console.log('lat : ' + imagesToUpload[status.current].latitude);
          // console.log('local_datetime : ' + imagesToUpload[status.current].timestamp);
        } catch (e) {
          console.error(e.message);
          return;
        }

        $http({
          method: 'POST',
          url: getServerURL() + '/imgs/',
          data: JSON.stringify({
            content: response.url,
            lon: imagesToUpload[status.current].longitude,
            lat: imagesToUpload[status.current].latitude,
            local_datetime: convertToTimeString(imagesToUpload[status.current].timestamp)
          }),
          params: {
            auth_user_token: 'gAAAAABXObzjJ2VYfgLeZZr_uAyLpsht7GAFvHLs3dTM5zS2jR7TvaSJB5MierVs7O1ETeWsV2871MHKFAoT_WEnqMmMcsd4GfMTNWG5FsFWFwf8ngdzcNy_vLirUdAtq5S4Je7F5Hvx',
            auth_vd_token: 'gAAAAABXPmPV9aLRV9Ao98UatlmZ80wubuKdb0pQAEj_UkK3dDKWOp4ZzpUdztG2_Ya45KMPm0jVIaksW9-aHh8GUqLB73P60A=='
          }
        })
        .then(function(result) {
          // console.dir(result);
          // photoEngineService.deletePhoto(imagesToUpload[status.current].id); 임시
          saveHistory(imagesToUpload[status.current].url);
        }, function(err) {
          console.error('In posting to imgs :' + JSON.stringify(err));
          // console.dir(err);
        })
        .finally(function() {
          status.current++;
          updateProgress('ready');
          if (status.current === imagesToUpload.length) {
            complete();
          }
        });
      }, function(err) {
        console.error('In cordovaFileTransfer: ' + err);
        status.current++;
        updateProgress('ready');
      });
    }, function(err) {
      console.error('In getPhoto : ' + err);
      status.current++;
      updateProgress('ready');
    });
  }

  function start(prograssCallback, useCell) {
    progress = prograssCallback || null;
    useCellNetwork = useCell || false;

    status.total = 0;
    status.current = 0;
    uploadedImages = [];
    loadHistory()
    .then(function() {
      console.log('imageImporter start');
      photoEngineService.getPhotoList()
      .then(function(list) {
        // console.log('In getPhotoList..');
        // console.dir(list);
        imagesToUpload = list;
        status.total = imagesToUpload.length;
        if (imagesToUpload.length === 0) {
          complete();
        } else {
          // console.dir(imagesToUpload);
          updateProgress('ready');
          timer = setInterval(uploadImage, 100);
        }
      }, function(err) {
        console.error(err);
      });
    });

    // photoEngineService.getPhotoList()
    // .then(function(list) {
    //   console.log('In getPhotoList.');
    //   console.dir(list);
    // }, function(err) {
    //   console.error(err);
    // });
  }

  function pause() {
    console.log('imageImporter pause');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
      updateProgress('paused');
    }
  }

  function resume() {
    console.log('imageImporter resume');
    if (timer !== null) {
      return;
    }
    updateProgress('ready');
    timer = setInterval(uploadImage, 100);
  }

  function stop() {
    console.log('imageImporter stop');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    updateProgress('stopped');
  }

  function complete() {
    console.log('imageImporter complete');
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    updateProgress('completed'); //  !! 이 위치가 중요(stop과의 차이점을 비교하라)
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
