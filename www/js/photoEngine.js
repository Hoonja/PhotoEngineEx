'use strict';

angular.module('starter')
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

    PhotoEngine.storePhoto(index, function(results) {
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
}]);
