'use strict';

var url = require('url');
var Request = require('./lib/request');

var normalizeOptions = function (options) {
  if (typeof options === 'string')
    options = url.parse(options);
  return options;
};

var flowHttp = function (options) {
  options = normalizeOptions(options);
  var method = options.method || 'GET';
  var duplex = ['GET', 'DELETE', 'HEAD'].indexOf(method) === -1;
  var req = new Request(options);
  if (!duplex) req.end();
  return req;
};

flowHttp.get = flowHttp;

flowHttp.post = function (options) {
  options = normalizeOptions(options);
  options.method = 'POST';
  return flowHttp(options);
};

flowHttp.put = function (options) {
  options = normalizeOptions(options);
  options.method = 'PUT';
  return flowHttp(options);
};

flowHttp.del = function (options) {
  options = normalizeOptions(options);
  options.method = 'DELETE';
  return flowHttp(options);
};

module.exports = flowHttp;
