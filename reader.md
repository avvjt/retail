# Full Deployment and Setup Guide

This guide covers setting up, deploying, and maintaining your trading application. It includes environment variable configuration, PostgreSQL database initialization, and deployment instructions.

## 1. Prerequisites

Before setting up the app, make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or newer recommended)
- [PostgreSQL](https://www.postgresql.org/download/) (v14 or newer)
- Optionally, [Docker](https://www.docker.com/) if you want to deploy the app in a container

## 2. Environment Variables Configuration

The application requires various environment variables for database connections, third-party APIs (Gemini, Groq, Cloudinary), and authentication. 

Create a `.env` file in the root directory (you can copy the provided `.env.example`) and fill in the values:

```env
# AI APIs
GEMINI_API_KEY="your_gemini_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"

# Application URL (Use http://localhost:3000 for local development)
APP_URL="http://localhost:3000"

# PostgreSQL Database Connection
# Format: postgres://username:password@host:port/database_name
DATABASE_URL="postgres://user:password@localhost:5432/tradingdb"

# Authentication Security
# Generate a strong random string (e.g., using `openssl rand -hex 32`)
JWT_SECRET="your_strong_jwt_secret_here"

# Admin User Credentials (Created automatically if not present in the DB)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure_admin_password_here"

# Google Sign-In (Optional - for direct Google Auth bypass)
VITE_GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Cloudinary (Optional - for image/screenshot uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Angel One SmartAPI (Optional - for live market WebSocket connection)
ANGEL_ONE_CLIENT_ID="your_angel_one_client_id"
ANGEL_ONE_API_KEY="your_angel_one_api_key"
ANGEL_ONE_PASSWORD="your_angel_one_password"
ANGEL_ONE_TOTP_SECRET="your_angel_one_totp_secret"
```

## 3. Database Setup (PostgreSQL)

This application uses PostgreSQL for data persistence. You need to create the database and set up the schema.

### Step 1: Create the Database
Log into your PostgreSQL shell or use a tool like pgAdmin / DBeaver to create the database:
```sql
CREATE DATABASE tradingdb;
```

### Step 2: Run the Schema Script
We have provided a complete `schema.sql` file in the root of the project that contains all the required table definitions.

You can execute this script against your newly created database using `psql`:

```bash
psql -U your_postgres_user -d tradingdb -f schema.sql
```

Alternatively, open `schema.sql` in your database administration tool and run the entire script. It will create all tables required (users, paper trading, strategies, smart money signals, etc.).

> **Note:** The application also contains an automatic database initialization script (`server/dbInit.ts`) that will attempt to synchronize tables on startup if it can connect. However, running `schema.sql` ensures all tables and relations are correctly established up front.

## 4. Local Development

With the environment variables configured and the database initialized, you can run the application locally.

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This will start both the Express backend and the Vite frontend on `http://localhost:3000`.

## 5. Production Deployment

To deploy this application to a production environment (like Google Cloud Run, Heroku, or Render):

### Build the Application
Compile the frontend (Vite) and backend (Express/TypeScript):
```bash
npm run build
```
This produces optimized static frontend assets and a bundled server executable (`dist/server.cjs`).

### Start the Application
Run the bundled server file:
```bash
npm start
```

### Deployment Providers
- **Google Cloud Run:** 
  You can deploy this as a container. Make sure your Dockerfile runs `npm run build` and then `npm start`. Set the port to `3000`.
- **Render:**
  We have included a `render.yaml` configuration. Connect your GitHub repository to Render, and it will automatically provision the Node.js web service and a managed PostgreSQL instance according to the yaml specification.

### Production Environment Variables
Make sure to configure all environment variables (especially `DATABASE_URL` and `JWT_SECRET`) securely in your hosting provider's dashboard. Do not commit `.env` files with production secrets to version control.
