# 📊 Company Expense Tracker

A simple, private, and secure expense management dashboard built for tracking company costs (salaries, subscriptions, tools, banking rails, receipts, etc.).

---

## ⚡ Quick Start (For Non-Technical Users)

If you are setting this up for the first time on your computer, follow these **4 simple steps**:

---

### Step 1: Install Required Free Software (One-time only)

You only need **two free tools** installed on your computer:

1. **Node.js (Required):**
   - Download the **LTS (Recommended)** version from: 👉 **[https://nodejs.org](https://nodejs.org)**
   - Run the installer, keep clicking **"Next"**, and finish installation.
2. **Git (Required):**
   - Download from: 👉 **[https://git-scm.com/downloads](https://git-scm.com/downloads)**
   - Run the installer and accept standard default settings.

---

### Step 2: Clone the Project from GitHub

1. Open **Command Prompt** (on Windows: press `Win + R`, type `cmd`, press Enter) or **Terminal** (on Mac).
2. Choose where you want to save the project (e.g. your Desktop) and run:
   ```bash
   cd Desktop
   ```
3. Download the code by pasting this command (replace with your actual GitHub repo link):
   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   ```
4. Enter the downloaded folder:
   ```bash
   cd Tracker
   ```

---

### Step 3: Install Everything (One-time only)

Inside the `Tracker` folder in your terminal, run this **single command**:

```bash
npm run setup
```

⏳ *Wait 1–2 minutes while it automatically downloads everything needed.*

---

### Step 4: Start the App! 🚀

Whenever you want to use the tracker, simply run:

```bash
npm run dev
```

*(On Windows, you can also just **double-click the `start.bat` file** in the folder!)*

Your browser will automatically open to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🔑 Your Login Credentials

When the app opens in your browser, sign in with the initial admin account:

- **Email:** `admin@company.com`
- **Password:** `admin123`

*(You can change your password anytime by clicking the **"Team"** button in the top right → **"Change My Password"** tab).*

---

## 💡 How to Use the App

### 1. Adding an Expense
- Click the **"+ Add Expense"** button in the top right.
- Fill in:
  - **Expense Title** (e.g. *AWS Hosting*, *GSuite Licenses*)
  - **Pay To (Person / Payee Name)**: Write who you paid (e.g. *Rahul Sharma*).
  - **Category**: Select category or choose **"Other"** to type your own.
  - **Amount**: Enter amount in ₹ (INR).
  - **Payment Method**: Choose UPI, NEFT, RTGS, Credit Card, etc.
  - **Receipt Upload**: Drag & drop any PDF or photo of your invoice.
- Click **"Save Expense"**.

### 2. Viewing & Downloading Receipts
- Click on any receipt thumbnail or the **"View Receipt"** icon in the table to view the full bill in an interactive popup (with zoom & download buttons).

### 3. Adding 1–2 Team Members (Authorized Access)
- Click the **"Team"** button in the top navigation bar.
- Type their **Full Name**, **Email**, and **Password**.
- Click **"Add Person"**.
- They can now sign in using their own credentials from their device!

### 4. Overdue Reminders
- If any expense stays in **"Pending Review"** for 5+ days, a yellow reminder banner will alert you at the top.
- Click **"Update"** on the reminder to change its status to **Paid** or **Approved**.
- You can also view all pending reminders anytime by clicking the 🔔 **bell icon** in the top right.

---

## 🛑 How to Stop & Start the App Daily

- **To Stop the App:**
  Go to the terminal window running the app and press `Ctrl + C` (or just close the terminal window).

- **To Start it Tomorrow:**
  1. Open terminal in the `Tracker` folder.
  2. Run:
     ```bash
     npm run dev
     ```
     *(Or simply double-click `start.bat` on Windows!)*
  3. Open **[http://localhost:3000](http://localhost:3000)**.
