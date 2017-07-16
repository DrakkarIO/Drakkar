/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 */
 
/*global sails*/
/*global User*/
/*global ActivationService*/
 
var passport = require('passport');

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    login: function(req, res) {
        passport.authenticate('local', function(err, user, info) {
            // An error occured
            if (err) {
                return res.serverError(err);
            }
            // User is not authenticated
            if (!user) {
                return res.status(401).send({
                    message: info.message
                });
            }
            // Log in the user
            req.logIn(user, function(err) {
                if (err) return res.send(err);
                return res.send({
                    message: info.message,
                    user: user
                });
            });
        })(req, res);
    },

	/**
	 * Logout a user authenticated with Passport
	 *
	 * @param {Object} req - Request object from the Express module
	 * @param {Object} res - Response object from the Express module
	 */
    logout: function(req, res) {
        if (req.user) req.logout();
        res.redirect('/');
    },
	
	/**
	 * Signup a user with the local Passport
	 *
	 * @param {Object} req - Request object from the Express module
	 * @param {Object} res - Response object from the Express module
	 */
    signup: function(req, res) {
        const errorHandler = function(err) {
            // Check if it's a validation error
            if (err.code && err.code === 'E_VALIDATION') {
                if (err.invalidAttributes) {
                    let validationError = {
                        code: 'ERR_VALIDATION',
                        message: sails.__({
                            phrase: "One or more fields have failed the validation process.",
                            locale: sails.config.i18n.getLocal()
                        })
                    };
                    
                    if (err.Errors) validationError.invalidAttributes = err.Errors;
                    
                    // if nothing matched the specific error messages
                    return res.json(400, validationError);
                }
            }
            
            return res.json(500, err);
        };
        
        if (!sails.config.registration.enabled) return res.json(403, {
            message: sails.__({
                phrase: "You cannot register at the moment.",
                locale: sails.config.i18n.getLocal()
            })
        });
        
        User.create({
            username: req.param('username'),
            email: req.param('email'),
            password: req.param('password')
        }).exec(function (err, newUser) {
			if (err) { return errorHandler(err); }
			
			// Request the email confirmation code. This sends it to the user. We're not checking if this succeeds before sending the OK response. 
			ActivationService.requestCode(newUser, function(err) {
				if (err) console.log(err);
			});
			
			return res.json(201, {message: 'Account created successfully - An attempt to send a confirmation email as been made.'});
		});
    }
};

