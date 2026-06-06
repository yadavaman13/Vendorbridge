# Vendorbridge

Vendorbridge is a full-stack procurement orchestration platform built with a React + Vite frontend and an Express + Drizzle backend. It supports vendor management, RFQs, quotations, purchase orders, invoices, approvals, and role-based access for managers and vendors.

## Project Overview

Vendorbridge is designed to help procurement teams manage vendor workflows from sourcing to payment. The application includes:

- Manager dashboard with procurement metrics and approvals
- Vendor onboarding and profile management
- RFQ and quotation management
- Purchase order and invoice tracking
- Activity logging and reports
- Authentication, role-based routing, and secure API access

## Architecture

The repository is split into two main folders:

- `client/` — React frontend built with Vite, React Router v7, Axios, and Sass.
- `server/` — Express backend with Drizzle ORM, PostgreSQL support, Redis caching, and mail integrations.

## Tech Stack

### Frontend

- React 19
- Vite
- React Router v7
- Axios
- Sass
- lucide-react icons

### Backend

- Node.js / Express 5
- Drizzle ORM
- PostgreSQL
- Redis
- dotenv
- bcryptjs
- jsonwebtoken
- node-mailjet / nodemailer
- pdfkit

## Repository Structure

```
Vendorbridge
├── .gitignore
├── client
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── src
│   │   ├── App.jsx
│   │   ├── app.routes.jsx
│   │   ├── features
│   │   │   ├── activity
│   │   │   │   └── pages
│   │   │   │       └── ActivityPage.jsx
│   │   │   ├── approvals
│   │   │   │   └── pages
│   │   │   │       └── ApprovalsPage.jsx
│   │   │   ├── auth
│   │   │   │   ├── auth.context.jsx
│   │   │   │   ├── components
│   │   │   │   │   ├── FormGroup.jsx
│   │   │   │   │   ├── LogoutButton.jsx
│   │   │   │   │   ├── PasswordMeter.jsx
│   │   │   │   │   └── ProtectedRoute.jsx
│   │   │   │   ├── hooks
│   │   │   │   │   ├── useAuth.js
│   │   │   │   │   └── useVerifyEmail.js
│   │   │   │   ├── pages
│   │   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   │   ├── Login.jsx
│   │   │   │   │   ├── Register.jsx
│   │   │   │   │   └── VerifyEmail.jsx
│   │   │   │   ├── services
│   │   │   │   │   └── auth.api.js
│   │   │   │   ├── styles
│   │   │   │   │   ├── _form-group.scss
│   │   │   │   │   ├── auth.scss
│   │   │   │   │   ├── password-meter.scss
│   │   │   │   │   └── verify-email.scss
│   │   │   │   ├── useAuth.js
│   │   │   │   └── utils
│   │   │   │       └── validation.utils.js
│   │   │   ├── dashboard
│   │   │   │   ├── hooks
│   │   │   │   │   └── useDashboard.js
│   │   │   │   ├── pages
│   │   │   │   │   └── DashboardPage.jsx
│   │   │   │   ├── services
│   │   │   │   │   └── dashboard.api.js
│   │   │   │   └── styles
│   │   │   │       └── dashboard.scss
│   │   │   ├── manager
│   │   │   │   ├── components
│   │   │   │   │   ├── ManagerStatCard.jsx
│   │   │   │   │   └── OfficerCard.jsx
│   │   │   │   ├── pages
│   │   │   │   │   └── ManagerDashboard.jsx
│   │   │   │   ├── services
│   │   │   │   │   └── manager.api.js
│   │   │   │   └── styles
│   │   │   │       └── manager-dashboard.scss
│   │   │   ├── purchase-order
│   │   │   │   ├── pages
│   │   │   │   │   ├── InvoicesPage.jsx
│   │   │   │   │   └── PurchaseOrderDashboard.jsx
│   │   │   │   └── styles
│   │   │   │       └── purchase-order.scss
│   │   │   ├── quotations
│   │   │   │   ├── hooks
│   │   │   │   │   └── useQuotations.js
│   │   │   │   ├── pages
│   │   │   │   │   └── QuotationsPage.jsx
│   │   │   │   ├── services
│   │   │   │   │   └── quotations.api.js
│   │   │   │   └── styles
│   │   │   │       └── quotations.scss
│   │   │   ├── reports
│   │   │   │   ├── hooks
│   │   │   │   │   └── useReports.js
│   │   │   │   ├── pages
│   │   │   │   │   └── ReportsPage.jsx
│   │   │   │   ├── services
│   │   │   │   │   └── reports.api.js
│   │   │   │   └── styles
│   │   │   │       └── reports.scss
│   │   │   ├── rfqs
│   │   │   │   └── pages
│   │   │   │       └── RFQsPage.jsx
│   │   │   ├── shared
│   │   │   │   ├── components
│   │   │   │   │   ├── AdminSidebar.jsx
│   │   │   │   │   ├── Alert.jsx
│   │   │   │   │   ├── EmptyState.jsx
│   │   │   │   │   ├── FormField.jsx
│   │   │   │   │   ├── index.js
│   │   │   │   │   ├── Layout.jsx
│   │   │   │   │   ├── Loader.jsx
│   │   │   │   │   ├── Modal.jsx
│   │   │   │   │   ├── RootLayout.jsx
│   │   │   │   │   ├── Sidebar.jsx
│   │   │   │   │   ├── Table.jsx
│   │   │   │   │   └── Toast.jsx
│   │   │   │   ├── pages
│   │   │   │   │   ├── ComingSoon.jsx
│   │   │   │   │   ├── DashboardNavbar.jsx
│   │   │   │   │   ├── DashboardSidebar.jsx
│   │   │   │   │   └── HomePage.jsx
│   │   │   │   ├── services
│   │   │   │   │   ├── api.js
│   │   │   │   │   └── categories.api.js
│   │   │   │   └── styles
│   │   │   │       ├── _buttons.scss
│   │   │   │       ├── _layout.scss
│   │   │   │       ├── _mixins.scss
│   │   │   │       ├── _pages.scss
│   │   │   │       ├── _variables.scss
│   │   │   │       ├── admin-sidebar.scss
│   │   │   │       ├── button.scss
│   │   │   │       ├── components.scss
│   │   │   │       ├── home-page.scss
│   │   │   │       ├── layout.scss
│   │   │   │       └── sidebar.scss
│   │   │   ├── users
│   │   │   │   ├── hooks
│   │   │   │   │   └── useUsers.js
│   │   │   │   ├── pages
│   │   │   │   │   └── UsersPage.jsx
│   │   │   │   ├── services
│   │   │   │   │   └── users.api.js
│   │   │   │   └── styles
│   │   │   │       └── users.scss
│   │   │   └── vendors
│   │   │       ├── hooks
│   │   │       │   ├── useVendorProfile.js
│   │   │       │   └── useVendors.js
│   │   │       ├── pages
│   │   │       │   ├── VendorProfilePage.jsx
│   │   │       │   └── VendorsPage.jsx
│   │   │       ├── services
│   │   │       │   └── vendors.api.js
│   │   │       └── styles
│   │   │           └── vendors.scss
│   │   ├── index.scss
│   │   └── main.jsx
│   └── vite.config.js
├── README.md
└── server
    ├── .env
    ├── .env.example
    ├── drizzle
    │   ├── 0002_reset_integer_schema.sql
    │   └── meta
    │       ├── _journal.json
    │       └── 0000_snapshot.json
    ├── drizzle.config.js
    ├── jsconfig.json
    ├── package-lock.json
    ├── package.json
    ├── server.js
    └── src
        ├── app.js
        ├── config
        │   ├── cache.js
        │   ├── database.js
        │   └── envConfig.js
        ├── controllers
        │   ├── activity-log.controller.js
        │   ├── approval.controller.js
        │   ├── auth.controller.js
        │   ├── categories.controller.js
        │   ├── invoice.controller.js
        │   ├── purchase-order.controller.js
        │   ├── quotation.controller.js
        │   ├── quotations.controller.js
        │   ├── rfqs.controller.js
        │   ├── users.controller.js
        │   └── vendors.controller.js
        ├── db
        │   ├── query
        │   │   ├── activity-log.query.js
        │   │   ├── approval.query.js
        │   │   ├── invoice.query.js
        │   │   ├── purchase-order.query.js
        │   │   ├── quotation.query.js
        │   │   ├── rfqs.query.js
        │   │   └── vendor.query.js
        │   └── schema
        │       ├── activityLogs.js
        │       ├── approvals.js
        │       ├── categories.js
        │       ├── enums.js
        │       ├── invoices.js
        │       ├── purchaseOrders.js
        │       ├── quotations.js
        │       ├── rfqs.js
        │       ├── schema.js
        │       ├── users.js
        │       └── vendors.js
        ├── middlewares
        │   ├── auth.middleware.js
        │   └── file.middleware.js
        ├── routes
        │   ├── activity-log.routes.js
        │   ├── approval.routes.js
        │   ├── auth.routes.js
        │   ├── categories.routes.js
        │   ├── invoice.routes.js
        │   ├── purchase-order.routes.js
        │   ├── quotation.routes.js
        │   ├── quotations.routes.js
        │   ├── rfqs.routes.js
        │   ├── users.routes.js
        │   └── vendors.routes.js
        ├── services
        │   ├── image.service.js
        │   ├── mail
        │   │   ├── gmail.mail.service.js
        │   │   ├── mail.service.js
        │   │   ├── mailjet.mail.service.js
        │   │   └── nodemailer.mail.service.js
        │   ├── pdf.service.js
        │   ├── quotations.service.js
        │   ├── rfqs.service.js
        │   ├── user.service.js
        │   └── vendors.service.js
        ├── utils
        │   ├── otp.utils.js
        │   └── response.utlis.js
        └── validators
            ├── auth.validators.js
            ├── categories.validators.js
            ├── quotations.validators.js
            ├── rfqs.validators.js
            └── users.validators.js
```
## Prerequisites

- Node.js 18+ (Node 22 recommended)
- npm
- PostgreSQL
- Redis

## Setup Instructions

### 1. Backend

```bash
cd Vendorbridge/server
npm install
cp .env.example .env
```

Then update `.env` with your environment values:

- `SERVER_PORT`
- `SERVER_URL`
- `CLIENT_ORIGINS`
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_SENDER_EMAIL`
- `MJ_APIKEY_PUBLIC`
- `MJ_APIKEY_PRIVATE`
- `MJ_USER`
- `IMAGEKIT_PRIVATE_KEY`

### 2. Frontend

```bash
cd Vendorbridge/client
npm install
```

The frontend uses Vite proxy settings to forward `/api` requests to the backend at `http://localhost:3000`.

## Running the Application

Start the backend first:

```bash
cd Vendorbridge/server
npm run dev
```

Then start the frontend:

```bash
cd Vendorbridge/client
npm run dev
```

Open the app in your browser at:

```bash
http://localhost:5173
```

## Important Notes

- The backend must be running and properly configured before using the frontend.
- `502 Bad Gateway` errors in the browser typically mean the frontend cannot reach the backend.
- Authentication is handled through protected routes, so the app may redirect to login until the backend is available.

## Useful Scripts

### Frontend

- `npm run dev` — start Vite development server
- `npm run build` — build production assets
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

### Backend

- `npm run dev` — start backend with nodemon

## Troubleshooting

### Backend fails to start

- Check that `.env` exists and is filled correctly
- Verify PostgreSQL and Redis are running
- Confirm `npm install` completed successfully in `server/`

### Frontend shows `502 Bad Gateway`

- Confirm backend is running on `localhost:3000`
- Ensure Vite proxy in `client/vite.config.js` is configured
- Check browser network logs for requests to `/api`

## Recommended Tools

- React DevTools
- Postman or Insomnia for API testing
- PostgreSQL client for database validation

## Contribution

If you want to contribute, please follow these steps:

1. Fork the repository
2. Create a new feature branch
3. Run tests and linting
4. Submit a pull request with a clear description

---

## License

This project does not include a license in the current repository. Add a license file if you want to publish or share the code publicly.
