# Free Deployment Guide (Render.com - 0$ / No Domain Needed)

This guide walks you through deploying your Expense Tracker to **[Render.com](https://render.com)** for free.

---

## 1. Push to a Private GitHub Repository

1. Initialize git and push this folder to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial private expense tracker"
   ```
2. Create a new repository on [GitHub](https://github.com/new) and make sure to select **Private** so your code is secure.
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Deploy on Render (Free Web Service)

1. Go to **[render.com](https://render.com)** and sign in with your GitHub account.
2. Click **New +** in the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your private repo.
4. Configure the service:
   - **Name:** Choose a name (e.g. `apex-finance-tracker` or your company name)
   - **Region:** Choose the region closest to you (e.g., Singapore / Frankfurt / Oregon)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm run render-build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Instance Type:** Select **Free**
5. Click **Deploy Web Service** at the bottom.

Render will automatically install dependencies, build your frontend, and start your private server.

---

## 3. Access Your App Online

Once deployed (usually takes ~2 minutes), Render will give you a free, secure link:
```
https://your-chosen-name.onrender.com
```

- **No Domain Needed:** Render provides the `onrender.com` subdomain for free.
- **Free SSL (HTTPS):** All traffic is encrypted out-of-the-box.
- **Privacy Protected:** Anyone who visits that link will only see the **Sign In** screen.

---

## 4. First-Time Sign In & Team Setup

1. Open your link in your browser.
2. Sign in with the default admin account:
   - **Email:** `admin@company.com`
   - **Password:** `admin123`
3. Click the **Team** button in the top navigation bar:
   - Add your 1–2 authorized team members (Name, Email, Password).
   - They can immediately log in from their own computers or phones without needing any access to code or servers!

---

## 5. Password Management & Recovery

### Changing Password (When Logged In)
1. Click the **"Team"** button in the top navigation bar.
2. Switch to the **"Change My Password"** tab.
3. Enter your current password, type your new password, and click **Save**.

### If Admin Forgets Password (When Locked Out)
You have two emergency recovery options:

#### Option A: In the Website UI (No Code / Terminal Needed)
1. On the **Sign In** screen, click **"Forgot password?"**.
2. Enter:
   - Your email (`admin@company.com`)
   - Your **Master Recovery Key**: `apex-recovery-key-2026` *(changeable in Render Environment Variables as `RECOVERY_KEY`)*
   - Your new password
3. Click **Reset & Save Password** — you can immediately log in with your new password!

#### Option B: Via Render Web Shell (Terminal)
1. In your Render Dashboard, click on your service and go to the **Shell** tab.
2. Type:
   ```bash
   npm run reset-admin MyNewPassword123
   ```
3. Your password is reset instantly.
