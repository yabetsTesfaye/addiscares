const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Load environment variables
require('dotenv').config();

// API info
const apiTitle = process.env.API_TITLE || 'AddisCare API';
const apiVersion = process.env.API_VERSION || '1.0.0';
const apiDescription = process.env.API_DESCRIPTION || 'API documentation for AddisCare application';
const apiContactName = process.env.API_CONTACT_NAME || 'AddisCare Support';
const apiContactEmail = process.env.API_CONTACT_EMAIL || 'support@addiscare.com';
const apiServerUrl = process.env.API_SERVER_URL || 'http://localhost:3001';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: apiTitle,
      version: apiVersion,
      description: apiDescription,
      contact: {
        name: apiContactName,
        email: apiContactEmail,
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `${apiServerUrl}/api`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication and registration' },
      { name: 'Reports', description: 'Report management' },
      { name: 'Users', description: 'User management' },
      { name: 'Notifications', description: 'Notification management' },
      { name: 'Statistics', description: 'System statistics and analytics' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { 
              type: 'string', 
              enum: ['reporter', 'government', 'admin'],
              default: 'reporter'
            },
            status: { 
              type: 'string',
              enum: ['pending', 'active', 'suspended'],
              default: 'pending'
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Report: {
          type: 'object',
          required: ['title', 'description', 'location', 'category'],
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            category: { 
              type: 'string',
              enum: ['road', 'public_service', 'environment', 'other']
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'resolved', 'escalated'],
              default: 'pending'
            },
            reporter: { $ref: '#/components/schemas/User' },
            assignedTo: { $ref: '#/components/schemas/User' },
            images: {
              type: 'array',
              items: { type: 'string', format: 'binary' }
            },
            comments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Comment' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            recipient: { $ref: '#/components/schemas/User' },
            sender: { $ref: '#/components/schemas/User' },
            type: {
              type: 'string',
              enum: ['status_update', 'new_comment', 'report_assigned', 'user_registered', 'system']
            },
            isRead: { type: 'boolean', default: false },
            relatedReport: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            errors: { type: 'object' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'No token, authorization denied'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have required permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Access denied. Insufficient permissions.'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                message: 'Validation failed',
                errors: {
                  field: 'Field validation message'
                }
              }
            }
          }
        }
      }
    },
    security: [
      { bearerAuth: [] }
    ]
  },
  apis: [
    path.join(__dirname, 'routes/docs/components.docs.js'),
    path.join(__dirname, 'routes/docs/auth.docs.js'),
    path.join(__dirname, 'routes/docs/reports.docs.js'),
    path.join(__dirname, 'routes/docs/users.docs.js'),
    path.join(__dirname, 'routes/docs/notifications.docs.js'),
    path.join(__dirname, 'routes/docs/statistics.docs.js'),
  ],
};

// Generate Swagger specification
const specs = swaggerJsdoc(options);

/**
 * Setup Swagger UI
 * @param {Object} app - Express app instance
 */
const setupSwagger = (app) => {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: 'AddisCare API Documentation',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; }
      .swagger-ui .info .description { font-size: 16px; }
      .swagger-ui .opblock-tag { font-size: 16px; }
    `,
    customfavIcon: '/favicon.ico',
  };

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

module.exports = { setupSwagger, specs, swaggerUi };
