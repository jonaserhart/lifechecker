//Request handlers

const strings = require('./strings');
const _data = require('./data');
const helpers = require('./helpers');

var handlers = {};

//#region Users

handlers.users = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) >= 0) {
		handlers._users[data.method](data, callback);
	}
	else {
		callback(405);
	}
};

handlers._users = {};
/**
 * post method for user
 * @param data :{payload {firstName, lastName, phone, password, tosAgreement}}
 **/
handlers._users.post = function(data, callback) {
	
	var firstName = strings.isNonEmptyString(data.payload.firstName) ? data.payload.firstName.trim() : false;
	var lastName = strings.isNonEmptyString(data.payload.lastName) ? data.payload.lastName.trim() : false;
	var phone = strings.isNonEmptyString(data.payload.phone) ? data.payload.phone.trim() : false;
	var password = strings.isNonEmptyString(data.payload.password) ? data.payload.password.trim() : false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' ? data.payload.tosAgreement : false;

	if (firstName && lastName && phone && password && tosAgreement){
		_data.read('users', phone, (err, data) => {
			if (err) {
				//hash password
				var hashed = helpers.hash(password);

				if (hashed) {
					var userObject = {
						'firstName': firstName,
						'lastName': lastName,
						'phone': phone,
						'password' : hashed,
						'tosAgreement' : true,
					};
	
					_data.create('users', phone, userObject, err => {
						if (!err){
							callback(200);
						}
						else {
							console.log(err)
							callback(500, {'Error': 'could not create user'});
						}
					});
				} 
				else {
					callback(500, {'Error': 'could not hash the user password'});
				}
			}
			else {
				callback(400, {'Error' : 'user with that number already exists'});
			}
		});
	}
	else {
		callback(400, {'Error' : 'missing required fields'});
	}

};

//@TODO Only let authenticated users access their user Object
handlers._users.get = function(data, callback) {
	var phone = strings.isNonEmptyString(data.queryStringObject.phone) ? data.queryStringObject.phone : false;

	if (phone) {
		_data.read('users', phone, (err, data) => {
			if (!err && data) {
				delete data.password;
				callback(200, data);
			}
			else {
				callback(404)
			}
		})
	}
	else {
		callback(400, {'Error' : 'missing required field'});
	}
};

//@TODO only let authenticated user update their object
handlers._users.put = function(data, callback) {
	var phone = strings.isNonEmptyString(data.payload.phone) ? data.payload.phone : false;

	var firstName = strings.isNonEmptyString(data.payload.firstName) ? data.payload.firstName.trim() : false;
	var lastName = strings.isNonEmptyString(data.payload.lastName) ? data.payload.lastName.trim() : false;
	var password = strings.isNonEmptyString(data.payload.password) ? data.payload.password.trim() : false;

	if (phone) {
		if (firstName || lastName || password){
			_data.read('users', phone, (err, userData) => {
				if (!err && userData){

					if (firstName){
						userData.firstName = firstName;
					}
					if (lastName){
						userData.lastName = lastName;
					}
					if (password){
						userData.password = helpers.hash(password);
					}

					_data.update('users', phone, userData, (err) => {
						if (!err) {
							callback(200);
						}
						else {
							console.log(err);
							callback(500, {'Error': 'Could not update the user'})
						}
					})
				}
				else {
					callback(400, {'Error' : 'the specified user does not exist'});
				}
			})
		}
		else {
			callback(400, {'Error': 'missing fields to update'})
		}
	}
	else  {
		callback(400, {'Error': 'missing required field'});
	}
};

// @TODO only let an authenticated user delete their object
// @TODO cleanup all related data files associated with this user
handlers._users.delete = function(data, callback) {
	var phone = strings.isNonEmptyString(data.queryStringObject.phone) ? data.queryStringObject.phone : false;

	if (phone) {
		_data.read('users', phone, (err, data) => {
			if (!err && data) {
				_data.delete('users', phone, err => {
					if (!err) {
						callback(200);
					}
					else {
						console.log(err);
						callback(500, {'Error': 'could not delete user'});
					}
				})
			}
			else {
				callback(400, {'Error': 'could not find the specified user'})
			}
		})
	}
	else {
		callback(400, {'Error' : 'missing required field'});
	}
};

//#endregion

handlers.tokens = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) >= 0) {
		handlers._tokens[data.method](data, callback);
	}
	else {
		callback(405);
	}
};

handlers.ping = function(data, callback) {
	callback(200);
};

handlers.notFound = function(data, callback) {
	callback(400);
};

module.exports = handlers;