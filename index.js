//primary file for api

//deps
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');

//define http server
var httpServer = http.createServer((req, res) => {
	main(req, res);
})

//start http server
httpServer.listen(config.httpPort, () => {
	console.log('http server is listening on port', config.httpPort)
});

//define https server
httpsServerOptions = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
	main(req, res);
});

//start http server
httpsServer.listen(config.httpsPort, () => {
	console.log('https server is listening on port', config.httpsPort)
});

var router = {
	'ping' : handlers.ping,
	'users' : handlers.users,
	'tokens' : handlers.tokens,
	'checks' : handlers.checks
};

var main = function(req, res) {
	var parsedUrl = url.parse(req.url, true);

	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g,'')

	var queryStringObject = parsedUrl.query;

	var method = req.method.toLowerCase();

	var headers = req.headers;

	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', (data) => {
		buffer += decoder.write(data);
	});
	res.setHeader('Content-Type', 'application/json');

	req.on('end', () => {
		buffer += decoder.end();

		var chosenHandler = typeof(router[trimmedPath]) != 'undefined' ? router[trimmedPath] : handlers.notFound;

		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': helpers.parseJsonToObject(buffer)
		}

		chosenHandler(data, (statusCode, payload) => {
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			payload = typeof(payload) == 'object' ? payload : {};

			var payloadString = JSON.stringify(payload);
			res.writeHead(statusCode);
			res.end(payloadString);
			console.log('returned response:', statusCode, payloadString);
		});
	})
}