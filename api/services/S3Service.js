/**
 * S3Service.js
 *
 * @description :: S3 upload service
 */


/*global sails*/

let S3 = require('aws-sdk').S3(sails.config.s3.credentials);

module.exports = {
    // Export the s3 initialized attribute so we can manually use it outside of this module.
    s3: S3,

    /**
     * Upload a file to S3
     * 
     * @docs :: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
     * @property {Object} upload             - The upload object
     * @property {string} upload.Key         - The file name (e.g. "profile/123/12345_12345.jpg")
     * @property {buffer} upload.Body        - The buffer to be written
     * @property {string} upload.ContentType - MIME type
     * @property {string} [upload.ACL]       - ACL (e.g. 'public-read')
     */
    upload: function(options, cb) {
        // Prevent this function from working if S3 isn't enabled
        if (!sails.config.s3.enabled) return cb(new Error('S3 is not enabled - Abording'));
        
        // Set default ACL if not set
        if (!options.ACL) options.ACL = sails.config.s3.credentials.s3params.ACL;

        S3.putObject(options, (err, data) => {
            if (err) {
                return cb(err);
            }

            return cb();
        });

    },
};