'use strict';

angular.module('starter')
.factory('photoEngineService', ['$q', '$cordovaFile', function($q, $cordovaFile) {
  function getPhotoList() {
    var deferred = $q.defer();

    PhotoEngine.photoList(function(results) {
      console.dir(results);
      // var parsed = JSON.parse(results);

      if (results.error === 0) {
        deferred.resolve(results.data);
      } else {
        deferred.reject(results.error);
      }
    });

    return deferred.promise;
  }

  function getPhoto(index) {
    var deferred = $q.defer();

    console.log('in getPhoto[' + index + ']');
    PhotoEngine.storePhoto(index, function(results) {
      // console.log('storePhoto..');
      // console.dir(results);
      if (results.error === 0) {
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
