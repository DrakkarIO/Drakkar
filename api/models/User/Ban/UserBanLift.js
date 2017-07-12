/**
 * UserBanLift.js
 *
 * @description :: TODO
 */

module.exports = {
	
	attributes: {
		// The user (moderator) that created the lift
		mod: {
			model: 'user',
			required: true
		},
		comment: {
			type: 'text',
			required: true
		},
		userBan: {
			model: 'userBan',
			unique: true
		},
		toJSON: function() {
			var obj = this.toObject();
			return obj;
		}
	}
	
}