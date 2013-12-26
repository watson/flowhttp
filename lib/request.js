'use strict';

var util = require('util');
var http = require('http');
var https = require('https');
var Duplex = require('stream').Duplex;

var Request = function (options) {
  var self = this;

  Duplex.call(this);

  if (!Array.isArray(options.middleware))
    options.middleware = options.middleware ? [options.middleware] : [];

  var proto = options.protocol === 'https:' ? https : http;
  this.req = proto.request(options);

  this.req.once('response', function (res) {
    self.res = res;
    self.emit('response', res);

    if (options.middleware) {
      options.middleware.forEach(function (Stream) {
        res.res = self.res;
        res = res.pipe(new Stream());
      });
    }

    res.on('data', self.push.bind(self));
    res.once('end', self.emit.bind(self, 'end'));
    res.once('error', self.emit.bind(self, 'error'));
  });
  this.req.once('error', self.emit.bind(self, 'error'));

  // Ensure that the request gets sent when the client have no more input for
  // it. The 'finish' event will get fired both when someone call `.end()` or
  // when data is done being piped to the writable part of this duplex stream.
  this.once('finish', this.req.end.bind(this.req));

  this.setHeader = this.req.setHeader.bind(this.req);
  this.getHeader = this.req.getHeader.bind(this.req);
  this.removeHeader = this.req.removeHeader.bind(this.req);
};

util.inherits(Request, Duplex);

Request.prototype._write = function (chunk, encoding, done) {
  this.req.write(chunk); // ignore encoding unless we set decodeStrings to true
  done();
};

Request.prototype._read = function () {};

module.exports = Request;
