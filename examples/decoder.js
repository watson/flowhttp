'use strict';

console.log('This example should output two lines of "Hello World"');

var fs = require('fs');
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
  this.on('pipe', function (src) {
    // The original http.IncomingMessage object will always be available
    // on the `.res` attribute of the source object
    if (src.res && src.res.headers['content-encoding'] === 'gzip') {
      src.unpipe(decoder);
      src.pipe(zlib.createGunzip()).pipe(decoder);
    }
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

  // Attach the Decoder as middleware to the flowHttp module. Can either
  // be an array or a single object. If present the response from the
  // server will be piped through these before being returned
  flowHttp.middleware = Decoder;

  // Make a normal request without encoding
  flowHttp(options).pipe(process.stdout);

  // Make a gzip request
  options.headers = { 'Accept-Encoding': 'gzip' };
  flowHttp(options).pipe(process.stdout);
};
