/**
 * ImageType.js
 *
 * @description :: TODO
 */

/*global CacheService*/
/*global ImageType*/

module.exports = {

    attributes: {
        title: {
            type: 'string',
            required: true
        },
        images: {
            collection: 'image',
            via: 'parentImage'
        },
        optimizations: {
            collection: 'ImageTypeOptimization',
            via: 'imageType'
        },
        toJSON: function() {
            var obj = this.toObject();
            return obj;
        }
    },

    /**
     * @callback getTypeCallback
     * @param {object} err - Error from many things.
     * @param {string} type - Type record if exist.
     */

    /**
     * Get image type : this implements caching because it's data that shouldn't really change much other than if we do new updates. Realtime update is not necessary.
     * 
     * @param {integer} id - The id of the type that we want to query.
     * @param {getTypeCallback} done - The callback that handles the response.
     */
    getType: function(id, done) {
        CacheService.memoryCache.wrap("imagetype-cache-" + id, function(cb) {
            ImageType.findOne({
                id: id
            }).exec(cb);
        }, {
            ttl: 300
        }, done);
    }
};