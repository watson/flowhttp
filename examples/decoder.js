'use strict';

console.log('This example should output two lines of "Hello World"');

var http = require('http');
var util = require('util');
var zlib = require('zlib');
var HelloWorld = require('stream').Readable;
var PassThrough = require('stream').PassThrough;
var flowHttp = require('../index');

// The data being sent back from the server on each request
HelloWorld.prototype._read = function (n) {
  this.push('Hello World\n');
  this.push();
};

// Decoder that will check the Conent-Encoding headers and optionally
// decode the body of the HTTP request
var Decoder = function () {
  var decoder = this;
  PassThrough.call(this);

  // Listen for the special `response` event
  this.once('response', function (res) {
    decoder._forwardFlowHttpResponse(res);
    if (res.headers['content-encoding'] === 'gzip') {
      decoder._src.unpipe(decoder);
      decoder._src.pipe(zlib.createGunzip()).pipe(decoder);
    }
  });

  // Record the source of the pipe to be used above
  this.once('pipe', function (src) {
    decoder._src = src;
  });
};
util.inherits(Decoder, PassThrough);

// The HTTP server
http.createServer(function (req, res) {
  var helloWorld = new HelloWorld();
  if (req.headers['accept-encoding'] === 'gzip') {
    res.writeHead(200, { 'Content-Encoding': 'gzip' });
    helloWorld.pipe(zlib.createGzip()).pipe(res);
  } else {
    helloWorld.pipe(res);
  }
}).listen(3001, client);

// The client
function client () {
  var options = {
    host: 'localhost',
    port: 3001
  };

  // Make a normal request without encoding
  flowHttp(options).pipe(new Decoder()).pipe(process.stdout);

  // Make a gzip request
  options.headers = { 'Accept-Encoding': 'gzip' };
  flowHttp(options).pipe(new Decoder()).pipe(process.stdout);
};
