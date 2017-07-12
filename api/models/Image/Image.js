/**
 * Image.js
 *
 * @description :: TODO
 */

const async = require("async");

/*global CacheService*/
/*global Image*/
/*global sails*/

module.exports = {

    attributes: {
        owner: {
            model: 'user'
        },
        originalName: {
            type: 'string'
        },
        tempPath: {
            type: 'string'
        },
        // name shouldn't include the extension
        name: {
            type: 'string',
            required: true,
            unique: true
        },
        type: {
            model: 'imageType',
            via: 'images',
            required: true
        },
        // Pixels
        width: {
            type: 'integer',
            required: true
        },
        // Pixels
        height: {
            type: 'integer',
            required: true
        },
        // in bytes
        size: {
            type: 'integer',
            required: true
        },
        extension: {
            type: 'string',
            required: true
        },
        // An image can have multiple children
        childImages: {
            collection: 'image',
            via: 'parentImage'
        },
        // An image can only have one parent image
        parentImage: {
            model: 'image',
            via: 'childImages'
        },
        toJSON: function() {
            var obj = this.toObject();
            return obj;
        },

        /**
         * This function returns an object that is "public safe". It also populates the childImages to have the full chain
         */
        toPublicJSON: function(cb) {
            let id = this.id;

            var obj = {};

            obj.width = this.width;
            obj.height = this.height;
            obj.path = this.geturl();

            if (!this.parentImage) {
                CacheService.redisCache.get("image-childImages-cache-" + id, function(err, result) {
                    if (err) {
                        return cb(err, obj);
                    }

                    if (result) {
                        obj.childImages = result;
                        return cb(null, obj);
                    }

                    Image.findOne({
                        id: id
                    }).populate('childImages').exec(function(err, dbImg) {
                        if (err) {
                            return cb(err, obj);
                        }
                        if (!dbImg) return obj;

                        obj.childImages = [];

                        async.each(dbImg.childImages, function(childImage, cb) {
                            childImage.toPublicJSON(function(err, image) {
                                if (err) {
                                    sails.log.error(err);
                                }

                                obj.childImages.push(image);
                                return cb();
                            });
                        }, function(err) {
                            CacheService.redisCache.set("image-childImages-cache-" + id, obj.childImages);
                            return cb(err, obj);
                        });
                    });
                });
            }
            else {
                return cb(null, obj);
            }
        },

        /**
         * Get the name of the image with the extension
         * 
         * return {string} Fullname 
         */
        getFullName: function() {
            return this.name + '.' + this.extension;
        },

        /**
         * Get the public URL of the image
         * 
         * return {string} URL 
         */
        geturl: function() {
            return sails.config.image.URL + this.getFullName();
        }
    },

    /**
     * Get a random default profile avatar
     * 
     * return {cb} Callback 
     *      Callback(err, images);
     *      {object} err - Error 
     *      {array} images - An array of Image DB object
     */
    getDefaultProfileAvatar: function(done) {
        Image.find({
            name: {
                'like': 'profile_images/default/%'
            },
            parentImage: null
        }).exec(function(err, images) {
            if (err) {
                sails.log.error(err);
                return done(err);
            }
            if (Array.isArray(images) && images.length > 0) {
                let image = images[Math.floor(Math.random() * images.length)];

                return done(null, image);
            }

            return done({
                message: 'Default Image Array is empty'
            });
        });
    }
};
