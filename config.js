
//environments
var environments = {};

environments.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'name': 'staging',
	'hashingSecret' : 'thisIsASecret',
	'maxChecks' : 5
};

environments.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'name': 'production',
	'hashingSecret' : 'thisIsALongerSecret',
	'maxChecks' : 5
};

var env = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

var environmentToExport = typeof(environments[env]) == 'object' ? environments[env] : environments.staging;

module.exports = environmentToExport;