'use strict';

var assert = require('assert');
var stream = require('stream');
var http = require('http');
var url = require('url');
var fh = require('./index');
var Request = fh.Request;

fh.agent = false; // opt out of connection pooling - makes the tests fail

describe('flowHttp.Request', function () {
  it('should be a duplex stream', function () {
    assert(Request.prototype instanceof stream.Duplex, 'The Request object should be an instance of stream.Duplex');
  });
});

describe('request', function () {
  var req;

  before(function () {
    req = new Request(url.parse('http://example.com'));
  });

  it('should have the original http.ClientRequest object', function () {
    assert(req.req instanceof http.ClientRequest);
  });

  it('should have the reqular http.ClientRequest methods', function () {
    assert.strictEqual(typeof req.setHeader, 'function');
    assert.strictEqual(typeof req.getHeader, 'function');
    assert.strictEqual(typeof req.removeHeader, 'function');
  });
});

describe('flowHttp module', function () {
  it('shoud be a function', function () {
    assert.strictEqual(typeof fh, 'function');
  });

  it('should have functions for each REST HTTP method', function () {
    assert.strictEqual(typeof fh.get, 'function');
    assert.strictEqual(typeof fh.post, 'function');
    assert.strictEqual(typeof fh.put, 'function');
    assert.strictEqual(typeof fh.del, 'function');
  });

  it('should alias fh as fh.get', function () {
    assert.strictEqual(fh, fh.get);
  });
});

describe('flowHttp', function () {
  var url = 'http://localhost:5000';
  var server;

  before(function (done) {
    server = http.createServer(function (req, res) {
      res.end('server response');
    });
    server.listen(5000, done);
  });

  after(function () {
    server.close();
  });

  it('should return instances of Request', function () {
    assert(fh.request(url) instanceof Request, '.request() should return an instance of Request');
    assert(fh(url) instanceof Request, 'Implicit GET should return an instance of Request');
    assert(fh.get(url) instanceof Request, 'Explicit GET should return an instance of Request');
    assert(fh.post(url) instanceof Request, 'POST should return an instance of Request');
    assert(fh.put(url) instanceof Request, 'PUT should return an instance of Request');
    assert(fh.del(url) instanceof Request, 'DELETE should return an instance of Request');
  });

  it('should include the original http.IncomingMessage object on the returned Request object', function (done) {
    var req = fh(url);
    req.on('response', function (res) {
      assert(res instanceof http.IncomingMessage);
      assert.strictEqual(req.res, res);
      done();
    });
  });

  ['get', 'del'].forEach(function (method) {
    describe('fh.' + method, function () {
      var response = false;
      before(function (done) {
        var req = fh[method](url).on('response', function (res) {
          response = true;
          done();
        });
        setTimeout(function () {
          if (!response) done(new Error('the response event was never emitted'));
        }, 100);
      });

      it('should autimatically send the request', function () {
        assert.ok(response);
      });
    });
  });

  ['request', 'post', 'put'].forEach(function (method) {
    describe('fh.' + method, function () {
      before(function (done) {
        var req = fh[method](url).on('response', function () {
          done(new Error('the response event should not have been emitted'));
        });
        setTimeout(done, 100);
      });

      it('should not autimatically send the request', function () {
        assert(true);
      });
    });
  });

  ['get', 'del'].forEach(function (method) {
    describe('fh.' + method, function () {
      var data = false, end = false, body = '';

      before(function (done) {
        fh[method](url)
          .on('data', function (chunk) {
            body += chunk;
            data = true;
          })
          .on('end', function () {
            end = true;
            done();
          });
        setTimeout(function () {
          if (!end) done(new Error('the end event was never fired'));
        }, 100);
      });

      it('should emit a data event', function () {
        assert.ok(data);
      });

      it('should emit an end event', function () {
        assert.ok(end);
      });

      it('should get expected body', function () {
        assert.equal(body, 'server response');
      });
    });
  });

  ['post', 'put'].forEach(function (method) {
    describe('Write to fh.' + method, function () {
      var data = false, end = false, body = '';

      before(function (done) {
        var req = fh[method](url)
          .on('data', function (chunk) {
            body += chunk;
            data = true;
          })
          .on('end', function () {
            end = true;
            done();
          });
        req.end('sending data...');
        setTimeout(function () {
          if (!end) done(new Error('the end event was never fired'));
        }, 100);
      });

      it('should emit a data event', function () {
        assert.ok(data);
      });

      it('should emit an end event', function () {
        assert.ok(end);
      });

      it('should get expected body', function () {
        assert.equal(body, 'server response');
      });
    });

    describe('Pipe to fh.' + method, function () {
      var data = false, end = false, body = '';

      before(function (done) {
        var readableStream = require('fs').createReadStream(__filename);
        readableStream.pipe(fh[method](url))
          .on('data', function (chunk) {
            body += chunk;
            data = true;
          })
          .on('end', function () {
            end = true;
            done();
          });
        setTimeout(function () {
          if (!end) done(new Error('the end event was never fired'));
        }, 100);
      });

      it('should emit a data event', function () {
        assert.ok(data);
      });

      it('should emit an end event', function () {
        assert.ok(end);
      });

      it('should get expected body', function () {
        assert.equal(body, 'server response');
      });
    });
  });
});
