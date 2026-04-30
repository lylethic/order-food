import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RubyKitchen Ordering API',
      version: '1.0.0',
      description: 'RubyKitchen Ordering API documentation',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development server' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and Authorization' },
      { name: 'Categories', description: 'Menu categories' },
      { name: 'Menu Items', description: 'Food and drink items' },
      { name: 'Roles', description: 'Role management — Admin only' },
      {
        name: 'Orders',
        description: 'Order management — Authentication required',
      },
      { name: 'Users', description: 'User management — Admin only' },
      { name: 'Health', description: 'Server health & metadata' },
      { name: 'Files', description: 'Static file upload / delete / replace' },
    ],
    components: {
      // ── JWT Security Scheme ──────────────────────────────────────────────────
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer {token}',
        },
      },

      schemas: {
        // ── Shared ────────────────────────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Something went wrong' },
          },
          required: ['error'],
        },

        // ── Auth ──────────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@gmail.com',
            },
            password: { type: 'string', minLength: 8, example: 'Aa@123123' },
            username: { type: 'string', minLength: 3, example: 'chef_rivera' },
            name: { type: 'string', example: 'Chef Rivera' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'EMPLOYEE', 'CHEF', 'CUSTOMER'],
              default: 'CUSTOMER',
              example: 'CHEF',
            },
          },
        },

        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@gmail.com',
            },
            password: { type: 'string', example: 'Aa@123123' },
          },
        },

        SafeUser: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1714291200000' },
            email: { type: 'string', example: 'chef@restaurant.com' },
            username: {
              type: 'string',
              nullable: true,
              example: 'chef_rivera',
            },
            name: { type: 'string', nullable: true, example: 'Chef Rivera' },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              description: 'JWT — Put in Header: Authorization: Bearer {token}',
            },
            user: { $ref: '#/components/schemas/SafeUser' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'EMPLOYEE', 'CHEF', 'CUSTOMER'],
              example: 'CHEF',
            },
          },
        },

        MeResponse: {
          allOf: [
            { $ref: '#/components/schemas/SafeUser' },
            {
              type: 'object',
              properties: {
                role: { type: 'string', example: 'CHEF' },
              },
            },
          ],
        },

        // ── Users ────────────────────────────────────────────────────────────
        UserCreateRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              example: 'nguyen_ai_linh',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'customer@gmail.com',
            },
            password: { type: 'string', minLength: 8, example: 'Aa@123123' },
            name: { type: 'string', nullable: true, example: 'Nguyen Ai Linh' },
            img: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.png',
            },
          },
        },

        UserUpdateRequest: {
          type: 'object',
          required: ['username'],
          properties: {
            username: { type: 'string', minLength: 3, example: 'chef_rivera' },
            name: { type: 'string', nullable: true, example: 'Chef Rivera' },
            img: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.png',
            },
            active: { type: 'boolean', example: true },
          },
        },

        User: {
          type: 'object',
          required: [
            'id',
            'username',
            'email',
            'created',
            'updated',
            'deleted',
            'active',
          ],
          properties: {
            id: { type: 'string', example: '1714291200000' },
            username: { type: 'string', example: 'chef_rivera' },
            email: {
              type: 'string',
              format: 'email',
              example: 'chef@restaurant.com',
            },
            name: { type: 'string', nullable: true, example: 'Chef Rivera' },
            img: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/avatar.png',
            },
            created: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-28T08:00:00.000Z',
            },
            updated: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-28T08:05:00.000Z',
            },
            create_by: {
              type: 'string',
              nullable: true,
              example: '1714291200000',
            },
            update_by: {
              type: 'string',
              nullable: true,
              example: '1714291200000',
            },
            deleted: { type: 'boolean', example: false },
            active: { type: 'boolean', example: true },
          },
        },

        UserPagination: {
          type: 'object',
          properties: {
            limit: { type: 'integer', example: 10 },
            nextCursor: {
              type: 'string',
              nullable: true,
              example: '1714291200000',
            },
            hasNextPage: { type: 'boolean', example: true },
          },
        },

        UserListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            pagination: { $ref: '#/components/schemas/UserPagination' },
          },
        },

        // ── Health ────────────────────────────────────────────────────────────
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-28T08:00:00.000Z',
            },
          },
        },

        Role: {
          type: 'object',
          required: ['id', 'name', 'created', 'updated', 'deleted', 'active'],
          properties: {
            id: { type: 'string', example: '3' },
            name: { type: 'string', example: 'Chef' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Kitchen management',
            },
            created: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-28T08:00:00.000Z',
            },
            updated: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-04-28T08:00:00.000Z',
            },
            created_by: { type: 'string', nullable: true, example: null },
            updated_by: { type: 'string', nullable: true, example: null },
            deleted: { type: 'boolean', example: false },
            active: { type: 'boolean', example: true },
          },
        },

        RolePagination: {
          type: 'object',
          properties: {
            limit: { type: 'integer', example: 10 },
            nextCursor: { type: 'string', nullable: true, example: '3' },
            hasNextPage: { type: 'boolean', example: false },
          },
        },

        RoleListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Role' },
            },
            limit: { type: 'integer', example: 10 },
            nextCursor: { type: 'string', nullable: true, example: '3' },
            hasNextPage: { type: 'boolean', example: false },
          },
        },

        CreateRoleRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Chef' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Kitchen management',
            },
          },
        },

        UpdateRoleRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Chef' },
            description: {
              type: 'string',
              nullable: true,
              example: 'Kitchen management',
            },
            active: { type: 'boolean', example: true },
          },
        },

        // ── Categories ────────────────────────────────────────────────────────
        Category: {
          type: 'object',
          required: [
            'id',
            'name',
            'created',
            'updated',
            'created_by',
            'updated_by',
            'deleted',
            'active',
          ],
          properties: {
            id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'Starters' },
            created: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-28T08:00:00.000Z',
            },
            updated: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-28T08:00:00.000Z',
            },
            created_by: { type: 'string', nullable: true, example: null },
            updated_by: { type: 'string', nullable: true, example: null },
            deleted: { type: 'boolean', example: false },
            active: { type: 'boolean', example: true },
          },
        },

        CategoryPagination: {
          type: 'object',
          properties: {
            limit: { type: 'integer', example: 10 },
            nextCursor: { type: 'string', nullable: true, example: '2' },
            hasNextPage: { type: 'boolean', example: false },
          },
        },

        CategoryListResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
            pagination: { $ref: '#/components/schemas/CategoryPagination' },
          },
        },

        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Starters' },
          },
        },

        UpdateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Beverages' },
          },
        },

        // ── Menu Items ────────────────────────────────────────────────────────
        MenuItem: {
          type: 'object',
          required: ['id', 'name', 'description', 'price', 'image', 'category'],
          properties: {
            id: { type: 'string', example: '1001' },
            name: { type: 'string', example: 'Crispy Calamari' },
            description: {
              type: 'string',
              example: 'Flash-fried calamari with garlic aioli.',
            },
            price: { type: 'number', format: 'float', example: 14.0 },
            image: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/calamari.jpg',
            },
            category: {
              type: 'string',
              enum: ['Starters', 'Mains', 'Desserts', 'Beverages', 'Specials'],
              example: 'Starters',
            },
            rating: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 4.8,
            },
            tag: {
              type: 'string',
              enum: ['Vegan', 'Chef Favorite', 'Spicy'],
              nullable: true,
              example: 'Vegan',
            },
          },
        },

        CreateMenuItemRequest: {
          type: 'object',
          required: [
            'category_id',
            'name',
            'description',
            'price',
            'image',
            'rating',
            'tag',
          ],
          properties: {
            category_id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'Crispy Calamari' },
            description: {
              type: 'string',
              example: 'Flash-fried calamari with garlic aioli.',
            },
            price: { type: 'number', format: 'float', example: 14.0 },
            image: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/calamari.jpg',
            },
            rating: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 4.8,
            },
            tag: { type: 'string', nullable: true, example: 'Vegan' },
          },
        },

        UpdateMenuItemRequest: {
          type: 'object',
          properties: {
            category_id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'Crispy Calamari' },
            description: {
              type: 'string',
              example: 'Flash-fried calamari with garlic aioli.',
            },
            price: { type: 'number', format: 'float', example: 14.0 },
            image: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/calamari.jpg',
            },
            rating: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 4.8,
            },
            tag: { type: 'string', nullable: true, example: 'Vegan' },
          },
        },

        // ── Orders ────────────────────────────────────────────────────────────
        OrderItem: {
          type: 'object',
          required: ['id', 'name', 'qty', 'price'],
          properties: {
            id: { type: 'string', example: '2001' },
            name: { type: 'string', example: 'Truffle Risotto' },
            qty: { type: 'integer', example: 2 },
            price: { type: 'number', format: 'float', example: 28.0 },
            modifications: {
              type: 'array',
              items: { type: 'string' },
              example: ['No garlic', 'Extra sauce'],
            },
          },
        },

        Order: {
          type: 'object',
          required: [
            'id',
            'ticketNumber',
            'table',
            'status',
            'total',
            'isPaid',
            'timestamp',
            'items',
          ],
          properties: {
            id: { type: 'string', example: '1714291200000' },
            ticketNumber: { type: 'string', example: 'RBK-84729' },
            table: { type: 'string', example: '12' },
            status: {
              type: 'string',
              enum: ['Received', 'Preparing', 'Cooking', 'Ready', 'Delivered'],
              example: 'Cooking',
            },
            total: { type: 'integer', example: 180000 },
            isPaid: { type: 'boolean', example: false },
            paymentMethod: {
              type: 'string',
              nullable: true,
              enum: ['Cash', 'Credit Card', 'E-Wallet', 'Bank Transfer'],
              example: 'Cash',
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-04-29T10:45:00.000Z',
            },
            timestamp: { type: 'string', example: '12:42 PM' },
            waitLevel: {
              type: 'string',
              enum: ['Low', 'Medium', 'High'],
              nullable: true,
              example: 'High',
            },
            waitTimeMinutes: { type: 'integer', nullable: true, example: 24 },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
          },
        },

        CreateOrderRequest: {
          type: 'object',
          required: ['tableNumber', 'items'],
          properties: {
            tableNumber: { type: 'string', example: '12' },
            items: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['menuItemId', 'qty'],
                properties: {
                  menuItemId: { type: 'string', example: '1001' },
                  qty: { type: 'integer', minimum: 1, example: 2 },
                  modifications: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Medium Rare'],
                  },
                },
              },
            },
          },
        },

        CreateOrderResponse: {
          type: 'object',
          required: ['id', 'ticketNumber', 'table', 'status', 'total'],
          properties: {
            id: { type: 'string', example: '1714291200000' },
            ticketNumber: { type: 'string', example: 'RBK-84729' },
            table: { type: 'string', example: '12' },
            status: { type: 'string', example: 'Received' },
            total: { type: 'integer', example: 180000 },
          },
        },

        UpdateStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['Received', 'Preparing', 'Cooking', 'Ready', 'Delivered'],
              example: 'Ready',
            },
          },
        },

        UpdateStatusResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1714291200000' },
            status: { type: 'string', example: 'Received' },
          },
        },

        MarkOrderPaidRequest: {
          type: 'object',
          required: ['paymentMethod'],
          properties: {
            paymentMethod: {
              type: 'string',
              enum: ['Cash', 'Credit Card', 'E-Wallet', 'Bank Transfer'],
              example: 'E-Wallet',
            },
          },
        },

        MarkOrderPaidResponse: {
          type: 'object',
          required: ['id', 'isPaid', 'paymentMethod', 'paidAt'],
          properties: {
            id: { type: 'string', example: '1714291200000' },
            isPaid: { type: 'boolean', example: true },
            paymentMethod: {
              type: 'string',
              enum: ['Cash', 'Credit Card', 'E-Wallet', 'Bank Transfer'],
              example: 'E-Wallet',
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-04-29T10:45:00.000Z',
            },
          },
        },
      },
    },
  },
  // swagger-jsdoc scans JSDoc @swagger comments in these files
  apis: ['./src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'RubyKitchen API Docs',
      swaggerOptions: {
        persistAuthorization: true, // remember the Bearer token across page reloads
        displayRequestDuration: true,
      },
    }),
  );

  // Raw OpenAPI JSON — import into Postman / Insomnia / code generators
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📄 Swagger UI  → http://localhost:3001/api/docs');
  console.log('📄 OpenAPI JSON → http://localhost:3001/api/docs.json');
}
