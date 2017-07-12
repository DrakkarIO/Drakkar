/**
 * ActivationService.js
 *
 * @description :: TODO
 */

/*global ActivationEmailCode*/
/*global EmailService*/
/*global User*/


module.exports = {

    /**
     * @callback generateCodeCallback
     * @param {object} err - Error from crypto.randomBytes.
     * @param {string} Random Code.
     */

    /**
     * Generate a random code using the crypto module.
     * @param {int} byteCount - The number of bytes used to generate the random code. Null is the default value : 48
     * @param {generateCodeCallback} done - The callback that handles the response.
     */
    generateCode: function(byteCount, done) {
        if (!byteCount || byteCount < 1) byteCount = 48;

        require('crypto').randomBytes(byteCount, function(err, buffer) {
            if (err) return done(err);
            return done(null, buffer.toString('hex'));
        });
    },

    /**
     * @callback saveCodeCallback
     * @param {object} err - Error from Waterline model create.
     */

    /**
     * Add the code to the user.
     * @param {Object} user - The user used to save the code.
     * @param {string} code - Random Code.
     * @param {saveCodeCallback} done - The callback that handles the response.
     */
    saveCode: function(user, code, done) {
        if (!user || !code) {
            return done('Missing argument');
        }

        ActivationEmailCode.create({
            code: code,
            user: user.id
        }).exec(function(err, records) {
            if (err) return done(err);
            return done();
        });
    },

    /**
     * @callback sendCodeCallback
     * @param {object} err - Error from many things.
     */

    /**
     * Send the email confirmation email to the user.
     * @param {Object} user - The user that you want to send the code to.
     * @param {requestCodeCallback} done - The callback that handles the response.
     */
    sendCode: function(user, done) {
        User.findOne({
            id: user.id
        }).populate('validationCode').exec(function(err, user) {
            if (err) return done(err);

            EmailService.sendActivationEmail(user, function(err) {
                if (err) {
                    return done(err);
                }

                return done();
            });

            return done();
        });
    },

    /**
     * @callback requestCodeCallback
     * @param {object} err - Error from many things.
     */

    /**
     * Generate, save and send the code for a user.
     * 
     * If the user already have an activation code, we're using the same activation code instead of generating a new one.
     * 
     * @param {Object} user - The user used to save the code.
     * @param {requestCodeCallback} done - The callback that handles the response.
     */
    requestCode: function(user, done) {
        // Verify if the user already have a code
        ActivationEmailCode.count({
            user: user.id
        }).exec(function(error, nb) {
            // No code found for the user
            if (nb == 0) {
                // Generate the code for the user since he doesn't have one
                module.exports.generateCode(null, function(err, code) {
                    if (err) return done(err);

                    module.exports.saveCode(user, code, function(err) {
                        if (err) return done(err);

                        // Send the code to the user
                        module.exports.sendCode(user, function(err, user) {
                            if (err) return done(err);
                            return done();
                        });
                    });
                });
            }
            // Code already exist for user. Just resend the code 
            else {
                module.exports.sendCode(user, function(err, user) {
                    if (err) return done(err);
                    return done();
                });
            }
        });
    }
};