/**
 * ResetPasswordCode.js
 *
 * @description :: TODO
 */

/*global sails*/

module.exports = {
  attributes: {
    code: {
		type: 'string',
		unique: true,
		required: true
    },
    user: {
		model: 'user',
		required: true
    },
	// The IP that was used to request the reset code.
	ip: {
		type: 'string',
		ip: true,
		required: true
	},
	// This attributes defines if the token as been used or not. Null if unused.
	redeemDate: {
		type: 'datetime',
		defaultsTo: null
	},
	// Bool that invalidates the reset code. Set to true if a user request a new code.
	invalid: {
		type: 'boolean',
		defaultsTo: false
	},
	// Check if it has been X minutes since the code as been created
	isValid: function() {
		var now = new Date();
		now.setMinutes(now.getMinutes() - sails.config.passwordReset.validityPeriod); 

		return !this.redeemDate && this.createdAt >= now && !this.invalid;
    },
	toJSON: function() {
		var obj = this.toObject();
		return obj;
	}
  }
}