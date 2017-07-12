/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  models: {
    connection: 'localDiskDb',
    migrate: 'alter'
  },

  /**
   * This configuration is for the Redis Shared Cache between all the App instances
   * 
   * @docs :: https://github.com/dial-once/node-cache-manager-redis
   */
  redisCache: {
    host: '127.0.0.1',
    port: 6379,
    db: 0, 
    ttl: 600 // Default ttl for keys
  },
  
  passwordReset: {
    validityPeriod: 30 // In minutes
  },
  
  email: {
    // @doc: https://nodemailer.com/smtp/
    smtp: {
      host: '127.0.0.1',
      port: 587,
      auth: {
        user: 'user',
        pass: 'password'
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
      }
    },
    // Email address from which the messages should be sent from.
    address: 'no-reply@exemple.com'
  },
  
  image: {
    // Root URL for the images (e.g. 'http://exemple.com/images/')
    URL: 'https://cnd.exemple.com/',
    // Path where the image should be written (Make sure that the folders exists)
    datapath: '/home/user/images/'
  },
  
  s3: {
    enabled: false,
    // @docs :: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
    credentials: {
      accessKeyId: 'accesskeyid',
      secretAccessKey: 'secretaccesskey',
      Bucket: 'default',
      region: 'default',
      endpoint: 'https://exemple.com',
      s3params: {
        ACL: 'public-read'
      }
    }
  }
};
