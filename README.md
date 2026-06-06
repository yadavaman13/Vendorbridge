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
Vendorbridge/
  README.md
  client/
    package.json
    vite.config.js
    src/
      App.jsx
      main.jsx
      app.routes.jsx
      features/
        auth/
        dashboard/
        manager/
        vendors/
        quotations/
        purchase-order/
        approvals/
        activity/
        reports/
        shared/
  server/
    package.json
    server.js
    src/
      app.js
      config/
      controllers/
      db/
      middlewares/
      routes/
      services/
      utils/
      validators/
    .env.example
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

##  Recommended Tools

- React DevTools
- Postman or Insomnia for API testing
- PostgreSQL client for database validation

##  Contribution

If you want to contribute, please follow these steps:

1. Fork the repository
2. Create a new feature branch
3. Run tests and linting
4. Submit a pull request with a clear description

---

##  License

This project does not include a license in the current repository. Add a license file if you want to publish or share the code publicly.
