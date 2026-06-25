require('dotenv').config();
 // Load environment variables from .env file


const config = {
     env: process.env.NODE_ENV, // the enviroment we are working with 
     port: process.env.PORT || 5001,
     client: {
          domain: process.env.FRONTEND_DOMAIN
     },
     db: {
          url: process.env.DATABASE_URL
     },

     security: {
          jwtSecret: process.env.SECRET_KEY,
          jwtExpiration: process.env.JWT_EXPIRATION || '15m', // default to 1 hour if not set
     },

     cors: {
          origin: process.env.CORS_ORIGIN || '*', // Allow all origins by default
     },

     sentry: {
          dsn: process.env.SENTRY_DSN || '', // Sentry DSN for error tracking
     },
     cloudinary: {
          cloudName: process.env.CLOUDINARY_CLOUD_NAME,
          apiKey: process.env.CLOUDINARY_API_KEY,
          apiSecret: process.env.CLOUDINARY_API_SECRET
     },
     nodemailer: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || '587',
          secure: process.env.SMTP_PORT === 465,
          auth: {
               user: process.env.SMTP_USER,
               pass: process.env.SMTP_PASS
          }
     }
}

if (!config.db.url) {
     throw new Error('CRITICAL: DATABASE_URL is missing in the environment variables.');
}

if (!config.security.jwtSecret) {
     throw new Error('CRITICAL: SECRET_KEY is missing in the environment variables.');
}

module.exports = config;