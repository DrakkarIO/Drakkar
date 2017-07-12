/**
 * UtilityService.js
 *
 * @description :: Random utility functions that don't have a proper place to go to
 */

const fs = require('fs');

module.exports = {
    
    /**
     * Functions that returns an Alpha-Numeric random string with a defined length
     * 
     * @param {int} count - length of the random string.
     */ 
    generateRandom: function(count) {
        let _sym = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
        let str = '';

        for (let i = 0; i < count; i++) {
            str += _sym[parseInt(Math.random() * (_sym.length), 10)];
        }
        return str;
    },

    /**
     * Delete files from a file array coming from skipper. 
     * This function ignores any error and just try to delete every file.
     * 
     * @param {array} files - Array of file object from skipper.
     */ 
    deleteFiles: function(files) {
        for (let i = 0; i < files.length; i++) {
            if (files[i].fd != null) {
                fs.unlink(files[i].fd, function(err) {
                    if (err) {}
                });
            }
        }
    }
};