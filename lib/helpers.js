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

helpers.createRandomString = function(strLen) {
	strLen = typeof(strLen) == 'number' && strLen > 0 ? strLen : false;
	if (strLen) {
		var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

		var str = '';

		for(var i = 0; i < strLen; i++){
			var rand = chars.charAt(Math.floor(Math.random() * chars.length));
			str += rand;
		}
		return str;
	} else {
		return false;
	}
}

module.exports = helpers;