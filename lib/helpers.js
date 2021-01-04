// Helpers

const strings = require('./strings');
const crypto = require('crypto');
const config = require('../config');

const helpers = {};

helpers.hash = function(str) {
	if (strings.isNonEmptyString(str)){
		const hash = crypto.createHmac('sha256', config.hashingSecret)
			.update(str)
			.digest('hex');
		return hash;
	}
	else {
		return false;
	}
};

helpers.parseJsonToObject = function(str) {
	try {
		var obj = JSON.parse(str);
	}
	catch (e) {
		var obj = {};
	}
	return obj;
};

module.exports = helpers;