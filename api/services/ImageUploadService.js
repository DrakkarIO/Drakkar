/**
 * ImageUploadService
 *
 * @description :: Includes all the functions to upload an image
 */
 
 /*global S3Service*/
 /*global ImageType*/
 /*global sails*/
 /*global ImageType*/
 /*global Image*/
 /*global ImageUploadService*/
 
const async = require("async");
const fs = require("fs");
const sharp = require("sharp");

module.exports = {
    
    
    /**
     * 
     */
    profilePicture: function(image, cb) {
        ImageType.findOne({
            id: image.type
        }).populate('optimizations').exec(function(err, type) {
            if (err) return cb(err);
            if (!type) return cb({
                message: 'type returned null'
            });
            if (type.optimizations.length == 0) return cb({
                message: 'The optimization array is empty'
            });

            // Buffer of the original image
            const imgBuffer = fs.readFileSync(image.path);
            let optimizations = type.optimizations;

            let maxOptimizationWidth = 0;
            let maxOptimizationHeight = 0;
            let maxOptimizationIndex = null;

            // We're taking into account that ALL optimization profiles are the same ratio WIDTH:HEIGHT
            for (let i = 0; i < optimizations.length; i++) {
                if (optimizations[i].width > maxOptimizationWidth && optimizations[i].height > maxOptimizationHeight) {
                    maxOptimizationWidth = optimizations[i].width;
                    maxOptimizationHeight = optimizations[i].height;
                    maxOptimizationIndex = i;
                }
            }

            // Get details about the image
            sharp(imgBuffer)
                .metadata()
                .then(function(metadata) {
                    let parentImage = {};

                    parentImage.owner = image.owner;
                    parentImage.originalName = image.originalName;
                    parentImage.type = image.type;
                    parentImage.extension = metadata.format;

                    // generate name partially randomly
                    ImageType.getType(parentImage.type, function(err, type) {
                        if (err) return cb(err);

                        parentImage.name = type.title + '/' + parentImage.owner + '/' + ImageUploadService.generateRandomString();

                        if (metadata.width >= maxOptimizationWidth || metadata.height >= maxOptimizationHeight) {
                            // Checking wether to keep the height or width for the resize
                            // DON'T FORGET : parentImage.width or parentImage.height will be empty
                            if (metadata.width > metadata.height) {
                                parentImage.width = maxOptimizationWidth;
                            }
                            else {
                                parentImage.height = maxOptimizationHeight;
                            }

                            // Remove the optimization profile since we're creating it as a parent
                            if (maxOptimizationIndex) {
                                optimizations.splice(maxOptimizationIndex, 1);
                            }
                        }
                        else {
                            parentImage.width = metadata.width;
                            parentImage.height = metadata.height;
                        }

                        sharp(imgBuffer)
                            .resize(parentImage.width, parentImage.height)
                            .toBuffer(function(err, data, info) {
                                if (err) return cb(err);

                                // Finish populating the parentImage object
                                parentImage.width = info.width;
                                parentImage.height = info.height;
                                parentImage.size = info.size;

                                // upload image to Static storage
                                ImageUploadService.uploadToS3(image.extension, parentImage.name + '.' + parentImage.extension, data, function(err) {
                                    if (err) return cb(err);

                                    // Add image to database
                                    Image.create(parentImage).exec(function(err, parentDBImage) {
                                        // Return if there's an error as we don't want to create the childrens if the parent fails
                                        if (err) return cb(err);
                                        // Not returing because we're done for the parent, the other images will be done in the background
                                        cb(null, parentDBImage);

                                        //------- Step 2, this part is async since we will aleady have called the CB so we reply faster to the client -----//
                                        async.each(optimizations, function(optimization, cb) {
                                            // If the optimization job is bigger or equal to the base image, don't run it
                                            if (metadata.width <= optimization.width || metadata.height <= optimization.height) return cb();

                                            let width = null;
                                            let height = null;

                                            if (metadata.width > metadata.height) {
                                                width = optimization.width;
                                            }
                                            else {
                                                height = optimization.height;
                                            }

                                            sharp(imgBuffer)
                                                .resize(width, height)
                                                .toBuffer(function(err, data, info) {
                                                    if (err) return cb(err);

                                                    let childImage = {};

                                                    childImage.owner = image.owner;
                                                    childImage.type = image.type;
                                                    childImage.size = info.size;
                                                    childImage.width = info.width;
                                                    childImage.height = info.height;
                                                    childImage.extension = info.format;
                                                    childImage.parentImage = parentDBImage.id;

                                                    childImage.name = parentDBImage.name + '_' + childImage.width + 'x' + childImage.height;
                                                    
                                                    module.exports.uploadFile({
                                                        data: data,
                                                        contentType: image.extension,
                                                        name: childImage.name,
                                                        extension: childImage.extension
                                                    }, function(err) {
                                                        if (err) return cb(err);
                                                        
                                                        Image.create(childImage).exec(function(err, image) {
                                                            return cb(err);
                                                        });
                                                    });
                                                });
                                        }, function(err) {
                                            if (err) {
                                                sails.log.error(err);
                                            }
                                        });
                                    });
                                });
                            });
                    });
                });
        });
    },

    /**
     * Upload an image to the datastore (S3 or Local)
     * 
     * @property {object} image             - The image to upload
     * @property {buffer} image.data        - The image data buffer
     * @property {string} image.contentType - The image MIME type
     * @property {string} image.name        - The image path name (without extension)
     * @property {string} image.extension   - The image extension (e.g. 'jpg')
     * 
     * @property {callback} cb              - Callback
     */
    uploadFile: function(image, cb) {
        // Upload to S3
        if (sails.config.s3.enabled) {
            S3Service.upload({
                Key: image.name + '.' + image.extension,
                Body: image.data,
                ContentType: image.contentType
            }, function(err) {
                return cb(err);
            });
        }
        // Upload to a local directory
        else {
            fs.writeFile(sails.config.image.datapath, image.data, function(err) {
                if (err) return cb(err);
            });
        }
    },


    /**
     * Generate a random string for the file name.
     * 
     * Recipe: 15 Random Numbers + underscore + timestamp
     */ 
    generateRandomString: function() {
        let count = 15;
        let _sym = '1234567890';
        let str = '';
    
        for (let i = 0; i < count; i++) {
            str += _sym[parseInt(Math.random() * (_sym.length), 10)];
        }

        return str + '_' + new Date().getTime();
    }
};