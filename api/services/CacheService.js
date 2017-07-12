/**
 * CacheService
 *
 * @description :: Includes the function for the caches.
 */
 
/*global sails*/
 
let cacheManager = require('cache-manager');
let redisStore = require('cache-manager-redis'); 

let redisConfObj = sails.config.redisCache;
redisConfObj.store = redisStore;

let redisCache = cacheManager.caching(redisConfObj);

// This Memory Cache module is using - https://github.com/isaacs/node-lru-cache
let memoryCache = cacheManager.caching({
    store: 'memory',
    max: 100, // Max number of key before it the oldest key gets deleted.
    ttl: 60
});

// listen for redis connection error event
redisCache.store.events.on('redisError', function(error) {
	sails.log.error(error);
});

module.exports = {
    
    redisCache: redisCache,

    memoryCache: memoryCache,
    
};