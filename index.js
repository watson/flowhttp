'use strict';

var url = require('url');
var Request = require('./lib/request');

// Call with either one or two arguments:
//   flowHttp(method, options)
//   flowHttp(options)
var flowHttp = function () {
  var argc = arguments.length,
      options = arguments[argc-1];
  if (typeof options === 'string')
    options = url.parse(options);
  if (argc === 2)
    options.method = arguments[0];
  var method = options.method || 'GET';
  var duplex = ['GET', 'DELETE', 'HEAD'].indexOf(method) === -1;
  var req = new Request(options);
  if (!duplex) req.end();
  return req;
};

flowHttp.get = flowHttp;
flowHttp.post = flowHttp.bind(null, 'POST');
flowHttp.put = flowHttp.bind(null, 'PUT');
flowHttp.del = flowHttp.bind(null, 'DELETE');

module.exports = flowHttp;
