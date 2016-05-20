'use strict';

beforeEach(module('starter'));

describe('SampleTest', function(){
  it('should be true', function() {
    expect(true).toEqual(true);
  });
});

describe('remoteStorageService', function() {
  var httpBackend;
  var remoteStorageService;
  var sampleStoredData = {
    foo: JSON.stringify([{id:123, timestamp: 1234567}, {id:456, timestamp: 2345678}])
  };

  beforeEach(inject(function($httpBackend, _remoteStorageService_) {
    httpBackend = $httpBackend;
    remoteStorageService = _remoteStorageService_;

  }));

  it('should download the json string for existed key', function() {
    httpBackend.expectGET( /http:\/\/maukitest.cloudapp.net\/storage\/\?key=(.+)/, undefined, undefined, ['key'])
    .respond(function(method, url, data, headers, params) {
      console.dir(params);
      if (sampleStoredData[params['key']] !== undefined) {
        return [200, sampleStoredData[params['key']], headers, 'OK'];
      } else {
        return [404, '', headers, 'Not found'];
      }
    });

    var data;
    var error;
    remoteStorageService.downloadData('foo')
    .then(function(result){
      data = result.data;
    }, function(err){
      error = err;
    });
    httpBackend.flush();
    expect(data.length).toBe(2);
    expect(error).toBeUndefined();
  });

  it('should get response of "404 error" for unexisted key', function() {
    httpBackend.expectGET( /http:\/\/maukitest.cloudapp.net\/storage\/\?key=(.+)/, undefined, undefined, ['key'])
    .respond(function(method, url, data, headers, params) {
      console.dir(params);
      if (sampleStoredData[params['key']] !== undefined) {
        return [200, sampleStoredData[params['key']], headers, 'OK'];
      } else {
        return [404, '', headers, 'Not found'];
      }
    });

    var data;
    var error;
    remoteStorageService.downloadData('bar')
    .then(function(result){
      data = result;
    }, function(err){
      error = err;
    });
    httpBackend.flush();
    expect(data).toBeUndefined();
    expect(error.status).toBe(404);
    expect(error.data).toBe('');
    expect(error.statusText).toBe('Not found');
  });

  it('should upload data', function() {
    httpBackend.expectPOST('http://maukitest.cloudapp.net/storage/')
    .respond(function(method, url, data, headers, params) {
      var get = JSON.parse(data);
      sampleStoredData[get.key] = get.data;
      return [200, '', headers, 'OK'];
    });

    remoteStorageService.uploadData('bar', [1, 2, 3]);
    httpBackend.flush();
    expect(sampleStoredData['bar']).toBeDefined();
    expect(JSON.parse(sampleStoredData['bar']).length).toBe(3);
  });
});

describe('imageImporter', function() {
  var imageImporter;

  beforeEach(inject(function(_imageImporter_) {
    imageImporter = _imageImporter_;
  }));

  //  start
  //  0. 필요한 DB와 테이블을 생성한다
  //  1. 읽어야 할 목록을 읽어와서 메모리에 갖고 있는다
  //  2. 하나씩 읽어야할 파일의 키를 가져온다
  //    2-1. 해당 키를 이전에 업로드한적이 있는지 완료 테이블로부터 확인한다.
  //    2-2. 좌표 정보가 있는지 살펴보고 없으면 제외하고 다시 2의 처음으로 돌아감
  //  3. 해당 키에 대한 파일의 URI를 가져온다
  //  4. 해당 파일을 서버로 업로드한다
  //  5. 완료한 파일에 대한 키를 완료 테이블에 추가한다
  //  6. 현재까지의 상황을 업데이트 한다 (이번 세션에서 완료한 갯수 / 업로드할 대상)
  //    6-1. 이경우, 2-2에서 제외된 것도 갯수에는 포함시킨다
  //  7. 다음 파일 키를 읽어오기 위해 2의 과정을 반복한다


  //  pause
  //  1. 현재까지 하던 작업을 정지하고, 다음 작업으로 넘어가지 않는다.
  //    1-1. 현재 진행하던 포인트를 저장해 둔다
  //  2. pause 되었음을 알린다 (status : curCount, total, state)

  //  resume
  //  1. 재개함을 알린다.
  //  2. 저장한 시점을 가져와서 업로드 작업을 진행한다

  //  stop
  //  1. 업로드 작업을 정지한다
  //  2. 읽어야 할 목록을 삭제한다.
  //  3. 중지되었음을 상태를 알린다.
});
