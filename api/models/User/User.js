/**
 * User.js
 *
 * @description :: TODO
 */
 
/*global CacheService*/
/*global User*/
/*global sails*/
 
const bcrypt = require('bcrypt');
const async = require('async');

const redisCache = CacheService.redisCache;


module.exports = {
	
	attributes: {
		username: {
			type: 'string',
			alphanumericdashed: true,
			minLength: 3,
			maxLength: 20,
			required: true,
			unique: true
		},
		email: {
			type: 'email',
			required: true,
			unique: true
		},
		password: {
			type: 'string',
			minLength: 6,
			required: true
		},
		emailConfirmed: {
			type: 'boolean',
			defaultsTo: false,
			required: true
		},
		profileImage: {
			model: 'image',
			// Default is in the beforeCreate() function - The defaultsTo attribute exist but it's sync only, and I need to do an async database call. If defaultsTo supported a callback function, it would be viable to use it for our use case.
		},
		validationCode: {
			collection: 'activationEmailCode',
			via: 'user'
		},
		resetPasswordCode: {
			collection: 'resetPasswordCode',
			via: 'user'
		},
		bans: {
			collection: 'userBan',
			via: 'user'
		},
		
		/**
		 * @callback isBannedCallback
		 * @param {object} err - Error.
		 * @param {boolean} banned - Is banned or not
		 */

		/**
		 * This function checks if the user is banned
		 *
		 * @param {string} type - String representing the ban type (e.g. "full", "chat", "shadow")
		 * @param {isBannedCallback} done - Callback function
		 */
		isBanned: function(type, done) {
			// This prevent the bans array to be unpopulated (BUG?)
			let user = this;
			
			// Check if the bans attribute as been populated
			if (!user._properties.joins.includes('userban')) {
				return done({message: 'Bans haven\'t been populated'});
			}

			// If the ban array is empty, there's nothing to check so the user isn't banned
			if (user.bans.length == 0) {
				return done(null, false);
			}
			
			// Invoking the Redis caching service to optimize the database calls

			redisCache.get("user-ban-cache-" + type + '-' + user.id, function(err, result) {
				if (err) {
					return done(err);
				}

				if (result && result.endDate > new Date()) {
					return done(null, result);
				}

				let banned = false;

				async.each(user.bans, function(banEntry, cb) {
					if (banEntry.banType === type && banEntry.isValid()) {
						banned = banEntry;
						return cb({
							done: true
						});
					}
					return cb();
				}, function(err) {
					if (err &&
						!err.done) {
						return done(err);
					}
					redisCache.set("user-ban-cache-" + type + '-' + user.id, banned, {
						ttl: 1800
					});
					return done(null, banned);
				});
			});
		},
		
		/**
		 * @callback isValidPasswordCallback
		 * @param {object} err - Error.
		 * @param {boolean} isValid - if the password is valid.
		 */
		
		/**
		 * This function check if the user password is valid
		 *
		 * @param {Object} password - The password to check if it matches
		 * @param {isValidPasswordCallback} done - Callback function
		 */
		isValidPassword: function(password, done) {
			bcrypt.compare(password, this.password, function(err, res) {
				if (err) return done(err);
			
				if (!res) {
					return done(null, false);
				}
			
				return done(null, true);
			});
		},
		toJSON: function() {
			var obj = this.toObject();
			delete obj.password;
			return obj;
		},
		toPublicJSON: function(cb) {
			let user = this;
			let obj = {};

			obj.username = user.username;

			if (user.profileImage) {
				user.profileImage.toPublicJSON(function(err, childImages) {
					obj.profileImage = childImages;
					return cb(err, obj);
				});
			}
			else {
				return cb(null, obj);
			}
		}
	},

	/**
	 * This function is called before the user is for the FIRST TIME commited to the database
	 * 
	 * Current actions :
	 * - Hashing the password
	 * - Assigning a random avatar from the default library
	 */ 
	beforeCreate: function(user, cb) {
		bcrypt.genSalt(10, function(err, salt) {
			if (err) { return cb(err); }
			bcrypt.hash(user.password, salt, function(err, hash) {
				if (err) { return cb(err); }
				else {
					user.password = hash;
					
					// Add the default Avatar Image
					Image.getDefaultProfileAvatar(function(err, image) {
						if (err && err.message !== 'Default Image Array is empty') {
							return cb(err);
						}
						
						// If the image is not null, set the id to the user
						if (image && image.id) user.profileImage = image.id;
						return cb();
					});
				}
			});
		});
	},
	
	isValidLogin: function(username, password, done) {
		var criteria = (username.indexOf('@') === -1) ? {
			username: username
		} : {
			email: username
		};

		User.findOne(criteria).populate('bans').exec( function(err, user) {
			// if(err) throw err;
			if (err) return done(null, false, err);
			if (!user) return done(null, false, {
				message: 'Incorrect username or email.'
			});

			// Debug Verbose, TODO: change for the built-in log handler
			sails.log.verbose('User authentication : ' + JSON.stringify(user));

			// Check if User as confirmed is email
			if (!user.emailConfirmed) return done(null, false, {
				message: 'Email isn\'t confirmed.'
			});

			// Check if user is banned from loggin-in
			user.isBanned('full', function(err, banned) {
				if (err) {
					sails.log.error(err);
					return done(null, false, err);
				}

				if (banned && banned.endDate > new Date()) return done(null, false, {
					message: 'The user is banned until ' + banned.endDate.toLocaleString()
				});

				bcrypt.compare(password, user.password, function(err, res) {
					if (err) return done(err);

					if (!res) {
						return done(null, false, {
							message: 'Invalid Password'
						});
					}

					var returnUser = {
						username: user.username,
						createdAt: user.createdAt,
						id: user.id
					};

					return done(null, returnUser, {
						message: 'Logged In Successfully'
					});
				});
			});
		});
	},
	
	/**
	 * @callback changePasswordCallback
	 * @param {object} err - Error from Waterline model create.
	 */

	/**
	* This function replace the user password for the new password. This encrypts the password using bcrypt.
	*
	* @param {Object} user - The person to change the password
	* @param {Object} password - The new password for the user
	* @param {changePasswordCallback} done - Callback function
	*/
	changePassword: function(user, password, done) {
		bcrypt.genSalt(10, function(err, salt) {
			if (err) return done(err); // Exit if there's an error when generating salt
			
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) return done(err); // Exit if there's an error when generating hash
				
				user.password = hash;
				user.save(done);
			});
		});
	}
};
