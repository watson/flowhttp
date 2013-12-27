'use strict';

var util = require('util');
var http = require('http');
var https = require('https');
var stream = require('stream');

stream.Readable.prototype._forwardFlowHttpResponse = function (res) {
  var state = this._readableState;
  var forward = function (dest) {
    dest.emit('response', res);
  };
  switch (state.pipesCount) {
    case 0:
      break;
    case 1:
      forward(state.pipes);
      break;
    default:
      state.pipes.forEach(forward);
  }
};

var Request = function (options) {
  var self = this;

  stream.Duplex.call(this);

  var proto = options.protocol === 'https:' ? https : http;
  this.req = proto.request(options);

  this.req.once('response', function (res) {
    self._forwardFlowHttpResponse(res);
    res.on('data', self.push.bind(self));
    res.once('end', self.emit.bind(self, 'end'));
    res.once('error', self.emit.bind(self, 'error'));
    self.res = res;
    self.emit('response', res);
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

util.inherits(Request, stream.Duplex);

Request.prototype._write = function (chunk, encoding, done) {
  this.req.write(chunk); // ignore encoding unless we set decodeStrings to true
  done();
};

Request.prototype._read = function () {};

module.exports = Request;
