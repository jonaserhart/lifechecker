//Request handlers

const strings = require('./strings');
const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

const tokenInterval = 1000 * 60 * 60;

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
	
	var firstName = strings.isNonEmptyString(data.payload.firstName) 
		? data.payload.firstName.trim() : false;
	var lastName = strings.isNonEmptyString(data.payload.lastName) 
		? data.payload.lastName.trim() : false;
	var phone = strings.isNonEmptyString(data.payload.phone) 
		? data.payload.phone.trim() : false;
	var password = strings.isNonEmptyString(data.payload.password) 
		? data.payload.password.trim() : false;
	var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' 
		? data.payload.tosAgreement : false;

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
							callback(500, 
								{'Error': 'could not create user'});
						}
					});
				} 
				else {
					callback(500, 
						{'Error': 'could not hash the user password'});
				}
			}
			else {
				callback(400, 
					{'Error' : 'user with that number already exists'});
			}
		});
	}
	else {
		callback(400, {'Error' : 'missing required fields'});
	}

};

handlers._users.get = function(data, callback) {
	
	var phone = strings.isNonEmptyString(data.queryStringObject.phone) 
		? data.queryStringObject.phone : false;

	if (phone) {

		var token =  strings.isNonEmptyString(data.headers.token) ? data.headers.token : false;
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
				_data.read('users', phone, (err, data) => {
					if (!err && data) {
						delete data.password;
						callback(200, data);
					}
					else {
						callback(404)
					}
				})
			} else {
				callback(403, {'Error' : 'missing required token in header or token is invalid'})
			}
		});
	}
	else {
		callback(400, {'Error' : 'missing required field'});
	}
};

handlers._users.put = function(data, callback) {
	var phone = strings.isNonEmptyString(data.payload.phone) 
		? data.payload.phone : false;

	var firstName = strings.isNonEmptyString(data.payload.firstName) 
		? data.payload.firstName.trim() : false;
	var lastName = strings.isNonEmptyString(data.payload.lastName) 
		? data.payload.lastName.trim() : false;
	var password = strings.isNonEmptyString(data.payload.password) 
		? data.payload.password.trim() : false;

	if (phone) {
		if (firstName || lastName || password){

			var token =  strings.isNonEmptyString(data.headers.token) ? data.headers.token : false;
			handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
				if (tokenIsValid) {
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
									callback(500, 
										{'Error': 'Could not update the user'})
								}
							})
						}
						else {
							callback(400, 
								{'Error' : 'the specified user does not exist'});
						}
					})
			}
			else {
				callback(403, {'Error' : 'missing required token in header or token is invalid'})
			}
			});
		}
		else {
			callback(400, {'Error': 'missing fields to update'})
		}
	} else {
		callback(400, {'Error': 'missing required field'});
	}
};


handlers._users.delete = function(data, callback) {
	var phone = strings.isNonEmptyString(data.queryStringObject.phone) 
		? data.queryStringObject.phone : false;

	if (phone) {
		var token =  strings.isNonEmptyString(data.headers.token) ? data.headers.token : false;
		handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
			if (tokenIsValid) {
				_data.read('users', phone, (err, userData) => {
					if (!err && userData) {
						_data.delete('users', phone, err => {
							if (!err) {
								//delete all checks associated with user
								var userChecks = typeof(userData.checks) == 'object'
										&& userData.checks instanceof Array ? userData.checks : [];
								var checksToDelete = userChecks.length;
								if (checksToDelete > 0) {
									var checksDeleted = 0;
									var deletionErrors = false;
									userChecks.forEach(checkId => {
										_data.delete('checks', checkId, err => {
											if (err) {
												deletionErrors = true;
											}
											checksDeleted++;
											if (checksDeleted == checksToDelete) {
												if (!deletionErrors) {
													callback(200)
												} else {
													callback(500, {'Error': 'errors encountered while deleting all of the users checks'})
												}
											}
										})
									});
								} else {
									callback(200);
								}
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
				});
			} else {
				callback(403, {'Error' : 'missing required token in header or token is invalid'})
			}
		});
	}
	else {
		callback(400, {'Error' : 'missing required field'});
	}
};

//#endregion

//#region Tokens
handlers.tokens = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) >= 0) {
		handlers._tokens[data.method](data, callback);
	}
	else {
		callback(405);
	}
};

handlers._tokens={};

handlers._tokens.post = function(data, callback) {
	var phone = strings.isNonEmptyString(data.payload.phone) 
		? data.payload.phone.trim() : false;
	var password = strings.isNonEmptyString(data.payload.password) 
		? data.payload.password.trim() : false;
	
	if (phone && password) {
		_data.read('users', phone, (err, userData) => {
			if (!err && userData){
				//hash sent password and compare
				var hashed = helpers.hash(password);
				if (hashed == userData.password){

					var tokenId = helpers.createRandomString(20);
					var expires = Date.now() + tokenInterval;
					var token = {
						'phone': phone,
						'id': tokenId,
						'expires': expires
					};

					_data.create('tokens', tokenId, token, err => {
						if (!err){
							callback(200, token);
						} else {
							callback(500, 
								{'Error': 'could not create a new token'});
						}
					});

				} else {
					callback(400, {'Error': 'passwords did not match'});
				}
			} else {
				callback(400, {'Error': 'Could not find user'});
			}
		});

	} else {
		callback(400, {'Error': 'missing required fields'});
	}
}

handlers._tokens.get = function(data, callback) {
	
	var id = strings.isNonEmptyString(data.queryStringObject.id) 
		? data.queryStringObject.id : false;

	if (id && id.trim().length === 20) {
		_data.read('tokens', id, (err, data) => {
			if (!err && data) {
				callback(200, data);
			} else {
				callback(404)
			}
		});
	} else {
		callback(400, {'Error': 'missing required field'})
	}
}

handlers._tokens.put = function(data, callback) {
	var id = strings.isNonEmptyString(data.payload.id) && data.payload.id.trim().length == 20
		? data.payload.id : false;
	var extend = typeof(data.payload.extend) == 'boolean' ? data.payload.extend : false;

	if (id && extend) {
		//look up token
		_data.read('tokens', id, (err, data) => {
			if (!err && data) {
				if (data.expires > Date.now()) {
					data.expires = Date.now() + tokenInterval;

					_data.update('tokens', id, data, err => {
						if (!err) {
							callback(200);
						} else {
							callback(500, {'Error' : 'could not update token'})
						}
					})
				} else {
					callback(400, {'Error' : 'token has expired and can no longer be extended'})
				}
			} else {
				callback(400, {'Error' : 'Specified token does not exist'})
			}
		})
	} else {
		callback(400, { 'Error': 'Missing required field(s) or field(s) are invalid'});
	}
}

handlers._tokens.delete = function(data, callback) {
	var id = strings.isNonEmptyString(data.queryStringObject.id) && data.queryStringObject.id.trim().length == 20
		? data.queryStringObject.id : false;

	if (id) {
		_data.read('tokens', id, (err, data) => {
			if (!err && data) {
				_data.delete('tokens', id, err => {
					if (!err) {
						callback(200);
					}
					else {
						callback(500, {'Error': 'could not delete token'});
					}
				})
			}
			else {
				callback(400, {'Error': 'could not find the specified token'})
			}
		})
	}
	else {
		callback(400, {'Error' : 'missing required field'});
	}
};

handlers._tokens.verifyToken = function(id, phone, callback) {

	_data.read('tokens', id, (err, data) => {
		if (!err && data) {
			if (data.phone == phone && data.expires > Date.now()) {
				callback(true);
			} else {
				callback(false)
			}
		} else {
			callback(false);
		}
	})
}

//#endregion

//#region checks
handlers.checks = function(data, callback) {
	var acceptableMethods = ['post', 'get', 'put', 'delete'];
	if (acceptableMethods.indexOf(data.method) >= 0) {
		handlers._checks[data.method](data, callback);
	}
	else {
		callback(405);
	}
};

handlers._checks = {};

//Checks-post
//data: protocol, url, method, sucessCodes, timoutSeconds
//optional: none

handlers._checks.post = function(data, callback) {
	var protocol = strings.isNonEmptyString(data.payload.protocol) 
		&& ['http', 'https'].indexOf(data.payload.protocol.trim()) >= 0 
		? data.payload.protocol.trim() : false;

	var url = strings.isNonEmptyString(data.payload.url) ?
		data.payload.url : false;

	var method = strings.isNonEmptyString(data.payload.method) 
		&& ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim()) >= 0 
		? data.payload.method.trim() : false;

	var successCodes = typeof(data.payload.successCodes) == 'object' 
		&& data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0
		? data.payload.successCodes : false;
	
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number'
		&& data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1
		&& data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

	if (protocol && url && method && successCodes && timeoutSeconds){
		//get the token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token.trim() : false;

		//look up user by reading token
		_data.read('tokens', token, (err, tokenData) => {
			if (!err && tokenData){
				var userPhone = tokenData.phone;

				_data.read('users', userPhone, (err, userData) => {
					if (!err && userData) {
						var userChecks = typeof(userData.checks) == 'object'
							&& userData.checks instanceof Array ? userData.checks : [];
							//verify that the user has less than max checks
						if (userChecks.length <= config.maxChecks) {
							//create random id for the check
							var checkId = helpers.createRandomString(20);

							//create check object and include users phone
							var check = {
								'id': checkId,
								'userPhone': userPhone,
								'protocol': protocol,
								'method': method,
								'successCodes': successCodes,
								'timeoutSeconds': timeoutSeconds
							};

							//save the object
							
							_data.create('checks', check.id, check, (err) => {
								if (!err) {
									userData.checks = userChecks;
									userData.checks.push(checkId);

									//save the new userData
									_data.update('users', userPhone, userData, (err) => {
										if (!err) {
											callback(200, check);
										} else {
											callback(500, {'Error': 'could not update the user data with new check'});
										}
									})
								} else {
									callback(500, {'Error': 'could not create the new check'});
								}
							})
						} else {
							callback(400, {'Error' : 'user already has the maximum number of checks'})
						}
					} else {
						callback(403);
					}
				})
			} else {
				callback(403);
			}
		})
	} else {
		callback(400, {'Error': 'Missing required fields'})
	}
}

// get
// data - id
// optional: none
handlers._checks.get = function(data, callback) {
	var id = strings.isNonEmptyString(data.queryStringObject.id) 
	? data.queryStringObject.id : false;

	if (id && id.trim().length === 20) {

		_data.read('checks', id, (err, checkData) => {
			if (!err && checkData) {
				var token =  strings.isNonEmptyString(data.headers.token) ? data.headers.token : false;
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						callback(200, checkData);
					} else {
						callback(403);
					}
				});
			} else {
				callback(404);
			}
		});

		
	} else {
		callback(400, {'Error': 'missing required field'})
	}
};

// put
// data: id
// optional: protocol, url, method, sucessCodes, timoutSeconds (one of them must be sent)
handlers._checks.put = function(data, callback) {
	var id = strings.isNonEmptyString(data.payload.id) 
		? data.payload.id : false;

	var protocol = strings.isNonEmptyString(data.payload.protocol) 
		&& ['http', 'https'].indexOf(data.payload.protocol.trim()) >= 0 
		? data.payload.protocol.trim() : false;

	var url = strings.isNonEmptyString(data.payload.url) ?
		data.payload.url : false;

	var method = strings.isNonEmptyString(data.payload.method) 
		&& ['post', 'get', 'put', 'delete'].indexOf(data.payload.method.trim()) >= 0 
		? data.payload.method.trim() : false;

	var successCodes = typeof(data.payload.successCodes) == 'object' 
		&& data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0
		? data.payload.successCodes : false;
	
	var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number'
		&& data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1
		&& data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

	if (id) {
		if (protocol || url || method || successCodes || timeoutSeconds) {
			_data.read('checks', id, (err, checkData) => {
				if (!err && checkData) {
					var token =  strings.isNonEmptyString(data.headers.token) ? data.headers.token : false;
					handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
						if (tokenIsValid) {
							//update user check
							if (protocol) {
								checkData.protocol = protocol;
							}
							if (url) {
								checkData.url = url;
							}
							if (method){
								checkData.method = method;
							}
							if (successCodes) {
								checkData.successCodes = successCodes;
							}
							if (timeoutSeconds) {
								checkData.timeoutSeconds = timeoutSeconds;
							}

							_data.update('checks', id, checkData, (err) => {
								if (!err) {
									callback(200);
								} else {
									callback(500, {'Error': 'could not update check'})
								}
							})
						} else {
							callback(403);
						}
					});
				} else {
					callback(404)
				}
			})

		} else {
			callback(400, {'Error': 'missing fields to update'});
		}
	} else {
		callback(400, {'Error': 'missing required fields'})
	}

};

// delete
// data: id
handlers._checks.delete = function(data, callback) {
	var id = strings.isNonEmptyString(data.queryStringObject.id) 
		? data.queryStringObject.id : false;

	if (id) {
		_data.read('checks', id, (err, checkData) => {
			if (!err && checkData) {
				var token =  strings.isNonEmptyString(data.headers.token) ? data.headers.token : false;
				handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
					if (tokenIsValid) {
						_data.delete('checks', id, err => {
							if (!err) {
								_data.read('users', checkData.userPhone, (err, userData) => {
									if (!err && userData) {
										var userChecks = typeof(userData.checks) == 'object'
										&& userData.checks instanceof Array ? userData.checks : [];
										console.log(userChecks)
										var checkPosition = userChecks.indexOf(id);
										if (checkPosition >= 0){
											userChecks.splice(checkPosition, 1);
											_data.update('users', checkData.userPhone, userData, err => {
												if(!err) {
													callback(200);
												} else {
													callback(500, {'Error': 'could not update user'})
												}
											})
										} else {
											callback(500, {'Error': 'could not find the check on the users object'})
										}
										
									}
									else {
										callback(400, {'Error': 'could not find the user who created the check'})
									}
								});
							}
							else {
								callback(500, {'Error': 'could not delete user'});
							}
						})
						
					} else {
						callback(403)
					}
				});
			} else {
				callback(400, {'Error': 'checkid does not exist'})
			}
		})
		
	}
	else {
		callback(400, {'Error' : 'missing required field'});
	}
}

//#endregion



handlers.ping = function(data, callback) {
	callback(200);
};

handlers.notFound = function(data, callback) {
	callback(400);
};

module.exports = handlers;