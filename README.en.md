# 🍽️ Ordering Food Management System

A comprehensive restaurant management and ordering platform built with **React + TypeScript + Vite** (Frontend) and **Node.js + Express + Prisma** (Backend), supporting 4 main roles with dedicated features.

---

## 📋 Project Overview

The project provides a complete platform for managing restaurant operations:

- **Customers**: Browse menu, place orders, track orders in real-time
- **Waitstaff**: Confirm deliveries, manage payments
- **Chefs**: Track order tickets, update cooking progress
- **Administrators**: Manage menu, categories, users, roles

---

## 🎯 4 Main Interfaces

### 1. **👨‍💼 Customer - Customer Interface**

Customers can browse the menu, add dishes to cart, place orders, and track their order status in real-time.

#### Browse Menu

![Customer Menu](public/customer_menu.png)
_Customers browse the menu by category and search_

#### Shopping Cart & Place Order

![Customer Cart Order](public/customer_cart_order.png)
_Manage shopping cart, enter table number, and place order_

#### Track Order Status

![Customer Order Status](public/customer_order.png)
_Track order progress in real-time from order received to delivery_

---

### 2. **👨‍🍳 Chef - Chef Dashboard**

Chefs can view order tickets, manage cooking order, and update order status.

#### Chef Dashboard

![Chef Orders](public/chef_order_received.png)
_List of cooking tickets, sorted by priority and time_

**Features:**

- ✅ View pending orders
- ✅ Update status (Order Received → Preparing → Cooking → Ready)
- ✅ Display detailed dish information
- ✅ Track wait time

---

### 3. **🚚 Employee - Waitstaff Interface**

Waitstaff manage order delivery, collect payments, and update payment status.

#### Delivery Station

![Employee Waiter](public/employee_waiter.png)
_List of ready-to-serve orders and payment management_

**Features:**

- ✅ View list of ready orders
- ✅ Confirm delivery to customers
- ✅ Collect payment and manage payment methods
- ✅ Track unpaid orders

---

### 4. **⚙️ Admin - Administration Interface**

Administrators have full control to manage the system: menu, categories, users, and permissions.

#### Manage Categories

![Admin Categories](public/admin_cate.png)
_Create, edit, delete menu categories_

#### Manage Menu Items

![Admin Menu Items](public/admin_monAn.png)
_Manage all menu items: add/edit/delete dishes, upload images, update prices_

![Admin Menu Items](public/admin_QR_generate.png)
_Manage QR table codes_

#### Manage Users & Roles

![Admin Users](public/admin_user.png)
_Manage employee accounts, assign roles (Admin/Chef/Employee)_

**Features:**

- ✅ CRUD product categories
- ✅ CRUD menu items (name, price, images, description, tags)
- ✅ Manage product images (upload, delete, set primary)
- ✅ CRUD users
- ✅ Assign/remove roles from users
- ✅ Enable/disable accounts

---

## 🛠️ Technology Stack

### **Frontend**

- ⚛️ **React 18** + **TypeScript**
- ⚡ **Vite** - High-performance build tool
- 🎨 **Tailwind CSS** - Responsive styling
- 🎬 **Framer Motion** - Animations
- 🌐 **React Router v7** - Navigation
- 🌍 **Multi-language** - Vietnamese & English support

### **Backend**

- 🟢 **Node.js** + **Express.js**
- 🗄️ **Prisma ORM** - Database management
- 🐘 **PostgreSQL** (Supabase)
- 🔐 **JWT Authentication** - Secure authentication
- 📚 **Swagger/OpenAPI** - API documentation
- ✅ **Zod** - Schema validation

---

## 🚀 Getting Started

### **Install Dependencies**

```bash
# Backend
cd backend
pnpm install

# Frontend
cd frontend
pnpm install
```

### **Configure Database**

```bash
# Navigate to backend
cd backend

# Create migration from schema
pnpm prisma migrate dev --name init

# Generate Prisma Client
pnpm prisma generate
```

### **Run Application**

```bash
# Terminal 1: Backend (http://localhost:3001)
cd backend
pnpm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd frontend
pnpm run dev
```

---

## 📱 User Workflows

### **Customer Workflow**

1. 🔐 Login/Register
2. 📖 Browse menu
3. 🛒 Add items to cart
4. 📝 Enter table number and place order
5. 👀 Track cooking progress (real-time)
6. 🎉 Receive order

### **Chef Workflow**

1. 📋 View new order tickets
2. ✍️ Update status: Order Received → Preparing → Cooking → Ready
3. 👀 Customers see real-time updates

### **Waitstaff Workflow**

1. 📦 View list of ready orders
2. ✓ Deliver to customer
3. 💰 Collect payment + select payment method
4. ✅ Confirm payment

### **Admin Workflow**

1. ⚙️ Manage categories & menu
2. 👥 Manage employee accounts
3. 🔑 Assign roles & permissions
4. 📊 Monitor system activity

---

## 📂 Project Structure

```
ordering_food/
├── backend/
│   ├── src/
│   │   ├── controllers/        # API route handlers
│   │   ├── services/           # Business logic
│   │   ├── providers/          # Data access layer (Prisma)
│   │   ├── middleware/         # Auth, RBAC
│   │   ├── schemas/            # Zod validation
│   │   └── utils/              # Helpers
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── src/server.ts           # Main app file
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── layouts/            # Layout wrappers (Admin/Staff/Customer)
│   │   ├── components/         # Reusable components
│   │   ├── context/            # Auth & Lang contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API client
│   │   ├── types.ts            # TypeScript types
│   │   └── router/             # React Router config
│   └── public/                 # Static assets & screenshots
│
└── README.md                   # This file
```

---

## 🔐 Authentication & Authorization

### **Roles & Permissions**

| Role         | Permissions                                      |
| ------------ | ------------------------------------------------ |
| **Customer** | Browse menu, place orders, track status          |
| **Chef**     | View tickets, update cooking status              |
| **Employee** | Confirm delivery, manage payments                |
| **Admin**    | Manage everything (CRUD categories, menu, users) |

### **Authentication**

- JWT Token stored in `localStorage`
- Auto-refresh token on expiry
- Redirect to login when unauthenticated

---

## 🌟 Key Features

✅ **Real-time Updates** - SSE (Server-Sent Events) for order status  
✅ **Multi-language** - Vietnamese & English  
✅ **Responsive Design** - Mobile-first UI  
✅ **Image Upload** - Upload menu images with optimization  
✅ **Search & Filter** - Search dishes by name/category  
✅ **Role-based Access** - Permission control  
✅ **Payment Methods** - Support multiple payment options

---

## 📝 API Documentation

Swagger API docs available at: `http://localhost:3001/api/docs`

Main endpoints:

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `GET /api/v1/menuItems` - Get menu
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Order details
- Admin routes: `/api/v1/categories`, `/api/v1/users`, `/api/v1/roles`

---

## 🤝 Contributing

To contribute:

1. Fork the project
2. Create feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Contact

If you have questions or suggestions, please open an issue or contact via email.

---

**Thank you for using Ordering Food Management System!** 🎉
