# Deploying TechLens Platform to Render

This guide walks you step-by-step through deploying both the **Node.js/Express Backend** and the **React Vite Frontend** to [Render](https://render.com).

---

## Step 1: Initialize Git Repository (IMPORTANT)

> [!CAUTION]
> Do **not** run `git push` from your root user folder (`C:\Users\vishw`). You must initialize Git strictly inside this project directory.

Open PowerShell or Terminal in this project directory:

```powershell
# 1. Ensure you are in the project folder:
cd "c:\Users\vishw\Downloads\nnn\nnn v3\nnn v3"

# 2. Initialize a fresh Git repository for this project:
git init -b main

# 3. Add all project files (node_modules and local .env are already ignored in .gitignore):
git add .

# 4. Create your first commit:
git commit -m "feat: prepare project for Render deployment"

# 5. Create a new repository on GitHub (e.g., https://github.com/your-username/techlens-marketplace)
# Link your local repo to GitHub and push:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## Step 2: Set Up MongoDB Atlas (Free Cloud Database)

Render does not host free MongoDB databases. You need a free cloud database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas):

1. **Sign Up / Log In** to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create a Free Cluster** (Select M0 Free tier, AWS / Google Cloud, nearest region).
3. **Database Access**:
   * Create a Database User (e.g. `techlens_admin`) with a secure password. Keep this password handy.
4. **Network Access**:
   * Click **Network Access** $\rightarrow$ **Add IP Address**.
   * Select **Allow Access From Anywhere** (`0.0.0.0/0`). *(This is required because Render uses dynamic IP addresses)*.
5. **Get Connection String**:
   * Click **Database** $\rightarrow$ **Connect** $\rightarrow$ **Drivers** (Node.js).
   * Copy the connection string:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/techlens?retryWrites=true&w=majority
     ```
   * Replace `<username>` and `<password>` with the credentials you created.

---

## Step 3: Deploy with Render Blueprint (Recommended - 1 Click)

Because this repository contains [`render.yaml`](./render.yaml), Render can automatically configure both services for you:

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** (top right) $\rightarrow$ **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml` and display both services:
   * **`techlens-api`** (Backend Web Service)
   * **`techlens-web`** (Frontend Static Site)
5. Fill in the required environment variable:
   * **`MONGODB_URI`**: Paste your MongoDB Atlas connection string from Step 2.
6. Click **Apply**.
7. Render will automatically build and deploy both services!

---

## Step 4 (Alternative): Manual Deployment Setup

If you prefer to configure the services manually on Render instead of using Blueprints:

### A. Deploy Backend Web Service
1. In Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repo.
3. Configure settings:
   * **Name**: `techlens-api`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Health Check Path**: `/api/health`
4. Add **Environment Variables**:
   * `NODE_ENV`: `production`
   * `PORT`: `5000`
   * `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   * `JWT_SECRET`: `<Generate a 32+ character random string>`
   * `JWT_EXPIRES_IN`: `7d`
   * `CLIENT_URL`: `https://techlens-web.onrender.com` *(Update once frontend URL is created)*
5. Click **Create Web Service**.

### B. Deploy Frontend Static Site
1. In Render Dashboard, click **New +** $\rightarrow$ **Static Site**.
2. Connect your GitHub repo.
3. Configure settings:
   * **Name**: `techlens-web`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm install && npm run build`
   * **Publish Directory**: `dist`
4. Add **Environment Variables**:
   * `VITE_API_URL`: `https://techlens-api.onrender.com/api` *(Use your actual backend URL)*
5. Configure **Redirects / Rewrites** (under settings):
   * **Type**: `Rewrite`
   * **Source**: `/*`
   * **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## Step 5: Seed Database with Initial Data

Once your backend connects to MongoDB Atlas, seed default categories, admin account, and sample products:

Run this command locally on your computer with your Atlas connection string:

```powershell
# In the project root, run seed pointing to your Atlas database:
$env:MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/techlens?retryWrites=true&w=majority"
npm run seed -w backend
```

Once completed, your database will be populated with initial products, admin user credentials, and categories.

---

## Troubleshooting & Tips

* **Free Tier Cold Starts**:
  Render free web services spin down after 15 minutes of inactivity. When you open the website after inactivity, the first API request may take 30–50 seconds while the backend wakes up. This is standard behavior on Render's free tier.
* **CORS Errors**:
  Ensure the backend's `CLIENT_URL` environment variable matches your frontend URL (e.g. `https://techlens-web.onrender.com`).
* **Page Refresh 404s**:
  If refreshing a route like `/products` shows a 404, verify that the **Rewrite rule** (`/*` $\rightarrow$ `/index.html`) is active in your Render Static Site settings.
