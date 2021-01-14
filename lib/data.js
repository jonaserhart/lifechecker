//deps
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};

lib.basePath = path.join(__dirname, '/../.data/');

lib.create = function (dir, file, data, callback) {

	if (typeof(data) != 'object')
		return;

	lib.ensureDatastoreCreated(dir, (err) => {
		if (!err) {
			fs.open(`${lib.basePath + dir}/${file}.json`, 'wx', (err, fd) => {
				if (!err && fd) {
					var stringData = JSON.stringify(data);
		
					fs.writeFile(fd, stringData, (err) => {
						if (!err){
							fs.close(fd, err => {
								if (!err) {
									callback(false);
								}
								else {
									callback('Error closing file');
								}
							});
						}
						else {
							callback('error writing file');
						}
					})
				}
				else {
					callback('Could not create file, it may already exist');
				}
			});

		} else {
			callback('error while creating data store')
		}
	});
};

lib.read = function(dir, file, callback) {
	fs.readFile(`${lib.basePath}${dir}/${file}.json`, 'utf8', (err, data) => {
		if (!err && data){
			var parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData);
		}
		else {
			callback(err, data);
		}
	});
};

lib.update = function(dir, file, data, callback) {

	if (typeof(data) != 'object'){
		callback('data was not an object');
		return;
	}
	
	fs.open(`${lib.basePath + dir}/${file}.json`, 'r+', (err, fd) => {
		if (!err && fd){
			var stringData = JSON.stringify(data);
			
			fs.ftruncate(fd, err => {
				if (!err) {
					fs.writeFile(fd, stringData, err => {
						if (!err){
							callback(false);
						}
						else {
							callback('error writing file');
						}
					});
				}
				else {
					callback('error truncating file' + err);
				}
			})
		}
		else {
			callback(`could not open the file '${file}' for updating, it may not exist yet`);
		}
	});

};

lib.delete = function(dir, file, callback){
	fs.unlink(`${lib.basePath}${dir}/${file}.json`, err => {
		if(!err){
			callback(false);
		}
		else {
			callback(`could not delete file '${file}'`);
		}
	});
};

const checkDir = function(p, callback){
	fs.access(p, (err) => {
		if (err) {
			fs.mkdir(p, (err) => {
				if (err){
					callback(err)
				} else {
					callback(false);
				}
			});
		} else {
			callback(false);
		}
	});
};

lib.ensureDatastoreCreated = function(store, callback) {
	var pathToCheck = path.join(lib.basePath, store);
	checkDir(pathToCheck, callback);
};

module.exports = lib;