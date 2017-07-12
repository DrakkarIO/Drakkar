/**
 * ImageTypeOptimization.js
 *
 * @description :: TODO
 */

module.exports = {

    attributes: {
        imageType: {
            model: 'imageType',
            via: 'optimizations',
            required: true
        },
        quality: {
            // Value from 100 to 0 - See JPEG Quality %
            type: 'decimal',
            required: true
        },
        width: {
            type: 'integer',
        },
        height: {
            type: 'integer',
        },
        toJSON: function() {
            var obj = this.toObject();
            return obj;
        }
    }
};
