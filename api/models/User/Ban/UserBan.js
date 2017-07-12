/**
 * UserBan.js
 *
 * @description :: TODO
 */

// Permaban = year 80085

module.exports = {

	attributes: {
		// Banned user
		user: {
			model: 'user',
			via: 'bans',
			required: true
		},
		// The user (moderator) that created the ban
		moderator: {
			model: 'user',
			required: true
		},
		banType: {
			type: 'string',
			enum: ['full', 'chat', 'shadow'],
			required: true
		},
		comment: {
			type: 'text',
			required: true
		},
		endDate: {
			type: 'datetime',
			required: true
		},
		// A ban lift object tied to a ban will invalidate a ban
		lift: {
			model: 'userBanLift',
			via: 'userBan'
		},

		/**
		 * Check if the ban is still valid. A ban is invalid if :
		 * - The end date is in the past
		 * - If the lift attribute has a value 
		 */
		isValid: function() {
			var now = new Date();

			return this.endDate >= now && !this.lift;
		},

		toJSON: function() {
			var obj = this.toObject();
			return obj;
		}
	}
};