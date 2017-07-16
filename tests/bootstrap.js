var sails = require('sails');
var sailsMemory = require('sails-memory');

before(function(done) {

    // Increase the Mocha timeout so that Sails has enough time to lift.
    this.timeout(5000);

    sails.lift({
        host: '::ffff:127.0.0.1',
        port: 4243,
        log: {
            level: 'debug'
        },
        hooks: {
         grunt: false
        },
        adapters: {
            'sails-memory': sailsMemory
        },
        connections: {
            default: {
                adapter: 'sails-memory'
            }
        },
        models: {
            connection: 'default'
        }
    }, function(err) {
        if (err) return done(err);
        // here you can load fixtures, etc.
        
        done(err, sails);
    });
});

after(function(done) {
    // here you can clear fixtures, etc.
    sails.lower(done);
});
