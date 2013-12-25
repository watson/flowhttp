# flowHttp

Treat node.js http(s) as a simple duplex stream

[![build
status](https://secure.travis-ci.org/watson/flowhttp.png)](http://travis-ci.org/watson/flowhttp)

## Install

```
npm install flowhttp
```

## Usage

Get the `flowHttp` module:
```javascript
var flowHttp = require('flowhttp');
```

The `flowHttp` module exposes 4 basic functions, each corresponding to the
standard HTTP REST verbs:

- `flowHttp.get(options)`: Perform a GET request
- `flowHttp.post(options)`: Perform a POST request
- `flowHttp.put(options)`: Perform a PUT request
- `flowHttp.del(options)`: Perform a DELETE request
- `flowHttp(options)`: An alias for the `flowHttp.get(options)` function

The `options` argument is identical to the first argument of the
[http.request()](http://nodejs.org/api/http.html#http_http_request_options_callback)
method in core, but basically `options` can be an object or a string. If
`options` is a string, it is automatically parsed with
[url.parse()](http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost).
For details see the
[http.request()](http://nodejs.org/api/http.html#http_http_request_options_callback)
documentation.

### Streams

Each of the 4 basic functions available on the `flowHttp` module returns a
duplex stream. This makes it very easy to read data from any request and
optionally write data to a `POST` or `PUT` request:

```javascript
var flowHttp = require('flowhttp');

// A dead simple GET request piped to STDOUT
flowHttp('http://example.com').pipe(process.stdout);

// Same as above, but using the standard events from stream.Readable
var body = '';
flowHttp('http://example.com')
  .on('data', function (chunk) {
    body += chunk;
  })
  .on('end', function () {
    // output the body returned from the GET example.com reqeust
    console.log(body);
  });

// A readable stream piped through a simple POST request and the response piped
// to STDOUT
someReadableStream
  .pipe(flowHttp.post('http://example.com'))
  .pipe(process.stdout);

// POST data to the remote server and pipe the response to STDOUT
var req = flowHttp.put('http://example.com');
req.pipe(process.stdout);
req.write('data to be sent to the server');
red.end();
```

## License

MIT
