/**
 * UserController.js
 *
 * @description :: Server-side logic for managing activations
 */

/*global sails*/
/*global User*/
/*global ActivationEmailCode*/
/*global UtilityService*/

module.exports = {
	 _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
	
	/**
     * Confirm the user's email address.
     * 
     * @param {Object} req - The Request object
     * @param {Object} res - The Response object
     */
	confirmEmail: function(req, res) {
        if (!req.param('code') || !req.param('username')) return res.status(400).send({message: 'Missing a parameter. Pfff'});
		
		User.findOne({ username: req.param('username') }).populate('validationCode').exec(function(err, user) {
			if (err) return res.serverError(err);
			if (!user) return res.status(400).send({message: 'Could not find ' + req.param('username') + '. Let\'s hope it wasn\'t your only friend.'});
			if (user.emailConfirmed) return res.status(400).send({message: 'The email address has already been confirmed.'});
			
			if (!user.validationCode[0] || user.validationCode[0].code != req.param('code')) return res.status(400).send({message: 'The code is not valid.'});
			
			if (user.validationCode[0].code == req.param('code')) {
				user.emailConfirmed = true;
				user.save(function(err) {
					if (err) {
						return res.serverError(err);
					}
				});
				
				ActivationEmailCode.destroy({id: user.validationCode[0].id}).exec(function(err) {
					if (err) {
						return res.serverError(err);
					}
				});
				
				return res.status(200).send({message: 'The email address has been confirmed. Thank you.'});
			}
			
			// How did the code get there ? TODO: Should try catch to prevent crashes
			return res.serverError('How did the code get there ?');
		});
    },
    
        
     /**
     * Change the user Avatar. This is the upload endpoint.
     * TODO: Rebuild this function for better error handling with file deletion 
     * 
     * @param {Object} req - The Request object
     *                  => file - The file should contain the Avatar
     * @param {Object} res - The Response object
     */
    uploadAvatar: function(req, res) {
        if (!req.user) return res.status(500).send({message: 'User is not defined'});
                    
        req.file('avatar').upload({
            // don't allow the total upload size to exceed ~1MB
            maxBytes: 1000000
        }, function whenDone(err, uploadedFiles) {
            if (err) {
                UtilityService.deleteFiles(uploadedFiles);
                return res.send(500, err);
            }

            // If no files were uploaded, respond with an error.
            if (uploadedFiles.length === 0) {
                return res.badRequest('No file was uploaded');
            }
            // If there were more than one file uploaded, it's not valid
            if (uploadedFiles.length > 1) {
                UtilityService.deleteFiles(uploadedFiles);
                return res.badRequest('You can only upload one file');
            }
                        
            let image = uploadedFiles[0];
            
            // Deny if the image isn't JPEG
            if (!image.type.includes('jpeg') && !image.type.includes('jpg')) {
                UtilityService.deleteFiles(uploadedFiles);
                return res.badRequest('This file is not a png or a jpeg');
            }
            
            let img = {};
            img.owner = req.user.id;
            img.originalName = image.filename;
            img.fileSize = image.size;
            img.extension = image.type;
            img.path = image.fd;
            img.type = 1;
            
            ImageUploadService.profilePicture(img, function(err, dbImage) {
                if (err) {
                    UtilityService.deleteFiles(uploadedFiles);
                    return res.serverError(err);
                }
                
                //Update the user with it's new profile picture
                User.findOne({id: req.user.id}).exec(function(err, user) {
                    if (err) {
                        UtilityService.deleteFiles(uploadedFiles);
                        return res.serverError(err);
                    }
                    
                    user.profileImage = dbImage.id;
                    
                    user.save(function(err) {
                        if (err) {
                            UtilityService.deleteFiles(uploadedFiles);
                            return res.serverError(err);
                        }                        
                        
                        UtilityService.deleteFiles(uploadedFiles);
                        return res.ok(dbImage);
                    });
                });
            });
        });
    },
    
    /**
     * Change the password of the current user.
     * 
     * @param {Object} req - The Request object
     * @param {Object} res - The Response object
     */
    changePassword: function(req, res) {
        let user = req.user;
        let currentPassword = req.param('currentPwd');
        let newPassword = req.param('newPwd');
        
        // Check if a parameter is missing
        if (!currentPassword || !newPassword) return res.badRequest('Missing a parameter');
        
        // Check if the new and current password match
        if (currentPassword === newPassword) return res.badRequest('The current password and new password that you entered matches.');
        
        // Check if the user is connected
        if (!user) return res.forbidden();
        
        // Check if the currentPassword is valid
        user.isValidPassword(currentPassword, function(err, isValid) {
            if (err) return res.serverError(err);
            
            // The current password matches
            if (isValid) {
                User.changePassword(user, newPassword, function(err) {
                    if (err) return res.serverError(err);
                    
                    return res.ok({message: 'The password has been successfully changed.'});
                });
            }
            // The current password doesn't match
            else {
                return res.forbidden({message: 'The current password doesn\'t match with the one provided.'});
            }
        });
    }
};

