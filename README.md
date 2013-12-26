# flowHttp

Treat node.js http(s) as a simple duplex stream

[![build
status](https://secure.travis-ci.org/watson/flowhttp.png)](http://travis-ci.org/watson/flowhttp)

## Install

```
npm install flowhttp
```

## Basic usage

```javascript
var flowHttp = require('flowhttp');

// A simple GET request
flowHttp('http://example.com').pipe(process.stdout);

// Upload a file
fs.createReadStream('./file.txt').pipe(flowHttp.post('http://example.com/upload'));
```

## API

### flowHttp.request(options)

At the core of the `flowHttp` module is the `flowHttp.request()` method.
This method performs a basic HTTP or HTTPS request (defaults to GET).

`options` can be an object or a string. If `options` is a string, it is
automatically parsed with
[url.parse()](http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost).

The `options` argument is identical to the first argument of the
[http.request()](http://nodejs.org/api/http.html#http_http_request_options_callback)
method in the http core module. You should check out that documentation
for the most up-to-date info related to your version of node.js.

It returns a `flowHttp.Request` object which can be used to send data
along with the request and receive data from the response. This makes it
very easy to read data from any request and optionally write data to a
POST or PUT request.

### flowHttp.get(options)

One of 4 convenience methods corresponding to the standard HTTP REST
verbs. The only difference between this method and `flowHttp.request()`
is that it sets the method to GET and calls `req.end()` automatically.

### flowHttp.post(options)

One of 4 convenience methods corresponding to the standard HTTP REST
verbs. The only difference between this method and `flowHttp.request()`
is that it sets the method to POST.

### flowHttp.put(options)

One of 4 convenience methods corresponding to the standard HTTP REST
verbs. The only difference between this method and `flowHttp.request()`
is that it sets the method to PUT.

### flowHttp.del(options)

One of 4 convenience methods corresponding to the standard HTTP REST
verbs. The only difference between this method and `flowHttp.request()`
is that it sets the method to DELETE and calls `req.end()`
automatically.

### flowHttp(options)

Since most requests are GET requests, the `flowHttp.get()` method have
been aliased for your convenience.

### flowHttp.middleware

If you need to transform the stream based on the response headers you
can make use of the `flowHttp.middleware` property. Normally you would
set it to a `Duplex`, `Transform` or `PassThrough` object - or an array
of objects.

```javascript
// Set it to a single object
flowHttp.middleware = DuplexStream;
// Or an array of objects
flowHttp.middleware = [ Foo, Bar ];
```

Here is a complete example of how a `PassThrough` stream is used to
optionally decode gzip data or pass it through if the `Content-Encoding`
header doesn't specify gzip.

```javascript
var util = require('util');
var zlib = require('zlib');
var PassThrough = require('stream').PassThrough;

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

// Attach the Decoder as middleware to the flowHttp module. Can either
// be an array or a single object. If present the response from the
// server will be piped through these before being returned
flowHttp.middleware = Decoder;

// Request example.com, filter it through the Decoder middleware and
// pipe the response to STDOUT
flowHttp('http://example.com').pipe(process.stdout);
```

### flowHttp.agent

Set this property to
[http.globalAgent](http://nodejs.org/api/http.html#http_http_globalagent)
can easily be overwritten:

```javascript
flowHttp.agent = false; // don't use an agent
```

For more info about custom agents, see
[http.Agent](http://nodejs.org/api/http.html#http_class_http_agent).

## Class: flowHttp.Request

The `Request` object is returned by `flowHttp.request()` and its
convenience methods. `Request` inherits from
[stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex_1).

```javascript
var duplexRequestStream = flowHttp('http://example.com');
```

Besides the normal methods and properties avaliable on a duplex stream,
the following API have been made available:

### request.req

The native
[http.ClientRequest](http://nodejs.org/api/http.html#http_class_http_clientrequest)
object.

### request.res

The native
[http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage)
object. Note that this property will not be available until the
`response` event have been emittet.

### request.setHeader(name, value)

An alias for `request.req.setHeader()`.

### request.getHeader(name)

An alias for `request.req.getHeader()`.

### request.removeHeader(name)

An alias for `request.req.removeHeader()`.

### Event 'response'

`function (response) {}`

Get access to the raw [http.IncomingMessage](http://nodejs.org/api/http.html#http_http_incomingmessage) reponse object. This is emitted before any *data* or *end* event. You would normally not need to listen for this event unless you need to acceess the response headers or status code.

### Event 'data'

`function (chunk) {}`

Emitted for each chunk of the reponse body.

### Event 'end'

`function () {}`

Emitted when the entire reponse have been received.

### Event 'error'

`function (err) {}`

If an error occurs during the request/reponse cycle, you will get notified here.

## Examples

A dead simple GET request piped to STDOUT:

```javascript
flowHttp('http://example.com').pipe(process.stdout);
```

Same as above by listening to the emitted events:

```javascript
var body = '';
flowHttp('http://example.com')
  .on('response', function (res) {
    if (res.headers['some-header'] !== 'some-expected-value')
      res.destroy(); // terminate the request
  })
  .on('data', function (chunk) {
    body += chunk;
  })
  .on('end', function () {
    // output the body returned from the GET example.com reqeust
    console.log(body);
  });
```

Upload a picture by piping it through a simple POST request and outputting the 
response to STDOUT:

```javascript
fs.createReadableStream('./picture.jpg')
  .pipe(flowHttp.post('http://example.com'))
  .pipe(process.stdout);
```

POST data to the remote server and pipe the response to STDOUT:

```javascript
var req = flowHttp.post('http://example.com');
req.pipe(process.stdout);
req.write('data to be sent to the server');
red.end(); // call end to send the request
```

## License

MIT
