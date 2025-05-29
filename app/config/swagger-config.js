const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation For TOSS Academy.',
      version: '1.0.0',
      description: 'These are the API documentation for the mobile app side.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'apiKey',
        name:"x-access-token",
        in:'header'
        },
      },
    },
  },
  apis: ['./app/**/*.js'],
};

module.exports = swaggerJsdoc(options);
