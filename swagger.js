const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Doctor and Patient API",
      version: "1.0.0",
      description: "Documentation for managing doctors and patients.",
    },
    servers: [
      {
        url: "http://localhost:5003",
      },
    ],
  },
  apis: ["./routes/*.js"], // Points to route files with Swagger comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
