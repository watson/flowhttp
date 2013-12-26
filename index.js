'use strict';

var url = require('url');
var http = require('http');
var Request = require('./lib/request');

// Call with either one or two arguments:
//   flowHttp(method, options)
//   flowHttp(options)
var request = function () {
  var argc = arguments.length,
      options = arguments[argc-1];
  if (typeof options === 'string')
    options = url.parse(options);
  if (argc === 2)
    options.method = arguments[0];
  if (!('agent' in options))
    options.agent = flowHttp.agent;
  return new Request(options);
};

var flowHttp = function (options) {
  var req = request(options);
  req.end();
  return req;
};

flowHttp.request = request;
flowHttp.get = flowHttp;
flowHttp.post = request.bind(null, 'POST');
flowHttp.put = request.bind(null, 'PUT');
flowHttp.del = function (options) {
  var req = request('DELETE', options);
  req.end();
  return req;
};

// Some might want easy access to the Request object - we don't really use it
flowHttp.Request = Request;

// The default agent used if not specified in options
flowHttp.agent = http.globalAgent;

module.exports = flowHttp;
