/**
 * ActivationEmailCode.js
 *
 * @description :: TODO
 */

module.exports = {
	
	attributes: {
		code: {
			type: 'string',
			unique: true,
			required: true
		},
		user: {
			model: 'user',
			unique: true,
			required: true
		},
		toJSON: function() {
			var obj = this.toObject();
			return obj;
		}
	}
	
}