/**
 * EmailService
 *
 * @description :: Includes all the functions to send emails
 */

/*global sails*/

'use strict';
const nodemailer = require('nodemailer');
let EmailTemplates = require('swig-email-templates');

// General transport 
let transporter = nodemailer.createTransport(sails.config.email.smtp);

// General templates
let templates = new EmailTemplates({
	root: process.cwd() + '/api/templates/'
});

module.exports = {
	/**
	 * @callback sendActivationEmailCallback
	 * @param {object} err - Error message.
	 */

	/**
	 * Sends an Activation email to the specified user.
	 * The user MUST have a validationCode, else the code will exit with an error.
	 *
	 * @param {Object} user - The specific user that we want to send the activation email to.
	 * @param {sendActivationEmailCallback} done - The callback that handles the response.
	 */
	sendActivationEmail: function(user, done) {
		///------- Validation --------///
		if (!user) return done('The user parameter is empty.');
		// Check if the user has a validation code.
		if (!user.validationCode[0] || !user.validationCode[0].code) return done('The user doesn\'t have a validation code.');

		// Parameters for the swig template
		let context = {
			username: user.username,
			confirmurl: sails.config.rootPath + '/activate-account?key=' + user.validationCode[0].code + '&username=' + user.username //TODO: CONFIG PARAMETER BRO
		};

		templates.render('confirmEmail.html', context, function(err, html, text, subject) {
            if (err) return done(err);
            
			let mailOptions = {
				from: sails.config.email.address,
				to: user.email,
				subject: 'Please confirm your email address',
				text: text,
				html: html
			};

			// send mail with defined transport object
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					return done(error);
				}

				// Write the send information to the console for diagnostic
				sails.log.info('Email Confirmation Message %s for %s sent: %s', info.messageId, user.username, info.response);
				return done();
			});
		});
	},

	/**
	 * @callback sendPasswordResetCallback
	 * @param {object} err - Error message.
	 */

	/**
	 * Sends an password reset email to the specified user.
	 * The user MUST have a valid passwordResetCode, else the code will exit with an error.
	 *
	 * @param {Object} user - The specific user that we want to send the password reset email to.
	 * @param {sendPasswordResetCallback} done - The callback that handles the response.
	 */
	sendPasswordReset: function(user, done) {
		///------- Validation --------///
		if (!user) return done('The user parameter is empty.');
		// Checl if the user has a password reset code.
		if (!user.resetPasswordCode) return done('The user object doesn\'t have the passwordResetCode populated.');
		
		let code = user.resetPasswordCode.find(function(code) {return code.isValid()});
		
		// Parameters for the swig template
		let context = {
			username: user.username,
			//reseturl: 'http://198.50.173.88:1337/api/user/resetpassword?code=' + code.code //TODO: CONFIG PARAMETER BRO // MOVED TO FRONTEND
			reseturl: sails.config.rootPath + '/reset-password?code=' + code.code
		};
		
		templates.render('passwordReset.html', context, function(err, html, text, subject) {
		    if (err) return done(err);
		    
			let mailOptions = {
				from: sails.config.email.address,
				to: user.email,
				subject: 'Reset your FloatPlane Club password',
				text: text,
				html: html
			};

			// send mail with defined transport object
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					return done(error);
				}

				// Write the send information to the console for diagnostic
				sails.log.info('Password Reset Message %s for %s sent: %s', info.messageId, user.username, info.response);
				return done();
			});
		});
	}
};