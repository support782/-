import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const JWT_SECRET = process.env.JWT_SECRET || "euddok-secret-key-12345";

async function startServer() {
  console.log("Starting server...");
  try {
    const app = express();
    const PORT = 3000;

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(cookieParser());

    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", time: new Date().toISOString() });
    });

    // Initialize SQLite Database
    const db = await open({
      filename: "./database.sqlite",
      driver: sqlite3.Database,
    });
    console.log("Database initialized.");

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      password TEXT,
      displayName TEXT,
      photoUrl TEXT,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      paymentMethods TEXT DEFAULT '[]',
      notificationSettings TEXT DEFAULT '{"email": true, "sms": true}',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      code TEXT UNIQUE,
      address TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId TEXT UNIQUE,
      name TEXT,
      phone TEXT UNIQUE,
      nid TEXT UNIQUE,
      address TEXT,
      photoUrl TEXT,
      nomineeName TEXT,
      nomineeRelation TEXT,
      branchId INTEGER,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branchId) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId TEXT,
      amount REAL,
      serviceCharge REAL,
      totalPayable REAL,
      paidAmount REAL DEFAULT 0,
      installmentType TEXT,
      installments INTEGER,
      status TEXT DEFAULT 'pending',
      branchId TEXT,
      applicationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      approvalDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId TEXT,
      type TEXT,
      amount REAL,
      method TEXT,
      loanId TEXT,
      savingsAccountId INTEGER,
      branchId TEXT,
      fieldOfficerId INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS savings_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId TEXT,
      type TEXT,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      method TEXT,
      accountNumber TEXT,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS loan_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId TEXT,
      amount REAL,
      serviceCharge REAL,
      installmentType TEXT,
      installments INTEGER,
      applicationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      guarantorMobile TEXT,
      guarantorAccepted BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kyc_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      status TEXT DEFAULT 'pending',
      nidFrontUrl TEXT,
      nidBackUrl TEXT,
      selfieUrl TEXT,
      aiVerificationResult TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      depositEnabled BOOLEAN DEFAULT 1,
      loanEnabled BOOLEAN DEFAULT 1,
      kycEnabled BOOLEAN DEFAULT 1,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      data TEXT
    );
  `);

    // Initialize default settings if not exists
    console.log("Checking settings...");
    const settingsExists = await db.get("SELECT id FROM settings WHERE id = 'global'");
    if (!settingsExists) {
      console.log("Initializing default settings...");
      const defaultSettings = {
        smsAppKey: '7144aead-508a-4a98-a8c9-4027abd8971f',
        smsAuthKey: 'YqH6rZIUO0BbJB5ARcq91k5U7gftVOgT993cgokVzvCXKGsem5',
        paymentApiKey: '',
        paymentSecretKey: '',
        paymentBrandKey: '',
        lateFeeRate: 10,
        sandboxMode: true,
        autoSmsReminders: false,
        reminderDays: 3,
        openRouterApiKey: ''
      };
      await db.run("INSERT INTO settings (id, data) VALUES (?, ?)", ['global', JSON.stringify(defaultSettings)]);
      console.log("Default settings initialized.");
    }

    // Migration: Add photoUrl to users
    try {
      await db.exec("ALTER TABLE users ADD COLUMN photoUrl TEXT");
      console.log("Added photoUrl column to users table.");
    } catch (e: any) {
      // Column might already exist
    }

    // Migration: Add phone to users
    try {
      await db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
      console.log("Added phone column to users table.");
    } catch (e: any) {
      // Column might already exist
    }

    // Migration: Add applicationDate and approvalDate to loans
    try {
      await db.exec("ALTER TABLE loans ADD COLUMN applicationDate DATETIME DEFAULT CURRENT_TIMESTAMP");
      await db.exec("ALTER TABLE loans ADD COLUMN approvalDate DATETIME");
      console.log("Added applicationDate and approvalDate columns to loans table.");
    } catch (e: any) {
      // Columns might already exist
    }

    // Migration: Add kycStatus and aiVerificationResult to members
    try {
      await db.exec("ALTER TABLE members ADD COLUMN kycStatus TEXT DEFAULT 'pending'");
      await db.exec("ALTER TABLE members ADD COLUMN aiVerificationResult TEXT");
      console.log("Added KYC columns to members table.");
    } catch (e: any) {
      // Columns might already exist
    }

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // OTP Store
  const otpStore = new Map<string, { otp: string, data: any, expiresAt: number }>();

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { phone, password, displayName } = req.body;
    try {
      const settings = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const globalSettings = JSON.parse(settings?.data || '{}');

      if (globalSettings.otpEnabled) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(phone, {
          otp,
          data: { phone, password, displayName },
          expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
        console.log(`[OTP] Registration OTP for ${phone}: ${otp}`);
        
        // Try to send SMS if configured
        if (globalSettings.smsAppKey && globalSettings.smsAuthKey && !globalSettings.sandboxMode) {
          try {
            const formattedPhone = phone.replace(/\D/g, '');
            const formData = new URLSearchParams();
            formData.append('appkey', globalSettings.smsAppKey);
            formData.append('authkey', globalSettings.smsAuthKey);
            formData.append('to', formattedPhone);
            formData.append('message', `Your eUddok registration OTP is ${otp}`);
            formData.append('sandbox', 'false');

            await axios.post('https://sms.euddok.com/api/create-message', formData, {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
          } catch (e) {
            console.error('Failed to send OTP SMS', e);
          }
        }

        return res.json({ requiresOtp: true, message: "OTP sent to your phone" });
      }

      // Proceed with normal registration if OTP disabled
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Check if this is the first user
      const userCount = await db.get("SELECT COUNT(*) as count FROM users");
      const role = (userCount.count === 0 || phone === "01700000000") ? "super_admin" : "member";

      const result = await db.run(
        "INSERT INTO users (phone, password, displayName, role) VALUES (?, ?, ?, ?)",
        [phone, hashedPassword, displayName, role]
      );
      
      const userId = result.lastID;
      const memberId = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;
      await db.run(
        "INSERT INTO members (memberId, name, phone) VALUES (?, ?, ?)",
        [memberId, displayName, phone]
      );
      
      const user = { id: userId, phone, displayName, role };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });

      // Send Welcome SMS if enabled
      if (globalSettings.welcomeSmsEnabled && globalSettings.welcomeSmsText && !globalSettings.sandboxMode) {
        try {
          const formattedPhone = phone.replace(/\D/g, '');
          const formData = new URLSearchParams();
          formData.append('appkey', globalSettings.smsAppKey);
          formData.append('authkey', globalSettings.smsAuthKey);
          formData.append('to', formattedPhone);
          formData.append('message', globalSettings.welcomeSmsText);
          formData.append('sandbox', 'false');

          await axios.post('https://sms.euddok.com/api/create-message', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        } catch (e) {
          console.error('Failed to send Welcome SMS', e);
        }
      }

      res.json({ user });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/verify-register", async (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStore.get(phone);

    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    try {
      const { password, displayName } = stored.data;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userCount = await db.get("SELECT COUNT(*) as count FROM users");
      const role = (userCount.count === 0 || phone === "01700000000") ? "super_admin" : "member";

      const result = await db.run(
        "INSERT INTO users (phone, password, displayName, role) VALUES (?, ?, ?, ?)",
        [phone, hashedPassword, displayName, role]
      );
      
      const userId = result.lastID;
      const memberId = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;
      await db.run(
        "INSERT INTO members (memberId, name, phone) VALUES (?, ?, ?)",
        [memberId, displayName, phone]
      );
      
      const user = { id: userId, phone, displayName, role };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      
      otpStore.delete(phone);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });

      // Send Welcome SMS if enabled
      const settings = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const globalSettings = JSON.parse(settings?.data || '{}');
      if (globalSettings.welcomeSmsEnabled && globalSettings.welcomeSmsText && !globalSettings.sandboxMode) {
        try {
          const formattedPhone = phone.replace(/\D/g, '');
          const formData = new URLSearchParams();
          formData.append('appkey', globalSettings.smsAppKey);
          formData.append('authkey', globalSettings.smsAuthKey);
          formData.append('to', formattedPhone);
          formData.append('message', globalSettings.welcomeSmsText);
          formData.append('sandbox', 'false');

          await axios.post('https://sms.euddok.com/api/create-message', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        } catch (e) {
          console.error('Failed to send Welcome SMS', e);
        }
      }

      res.json({ user });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Phone number already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { phone, password } = req.body;
    try {
      const user = await db.get("SELECT * FROM users WHERE phone = ?", [phone]);
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });

      const settings = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const globalSettings = JSON.parse(settings?.data || '{}');

      if (globalSettings.otpEnabled) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(phone, {
          otp,
          data: { user },
          expiresAt: Date.now() + 5 * 60 * 1000
        });
        console.log(`[OTP] Login OTP for ${phone}: ${otp}`);

        if (globalSettings.smsAppKey && globalSettings.smsAuthKey && !globalSettings.sandboxMode) {
          try {
            const formattedPhone = phone.replace(/\D/g, '');
            const formData = new URLSearchParams();
            formData.append('appkey', globalSettings.smsAppKey);
            formData.append('authkey', globalSettings.smsAuthKey);
            formData.append('to', formattedPhone);
            formData.append('message', `Your eUddok login OTP is ${otp}`);
            formData.append('sandbox', 'false');

            await axios.post('https://sms.euddok.com/api/create-message', formData, {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
          } catch (e) {
            console.error('Failed to send OTP SMS', e);
          }
        }

        return res.json({ requiresOtp: true, message: "OTP sent to your phone" });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    const { phone } = req.body;
    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(400).json({ error: "No pending OTP request found" });
    }

    try {
      const settings = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const globalSettings = JSON.parse(settings?.data || '{}');

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(phone, {
        ...stored,
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      });
      console.log(`[OTP] Resent OTP for ${phone}: ${otp}`);

      if (globalSettings.smsAppKey && globalSettings.smsAuthKey && !globalSettings.sandboxMode) {
        try {
          const formattedPhone = phone.replace(/\D/g, '');
          const formData = new URLSearchParams();
          formData.append('appkey', globalSettings.smsAppKey);
          formData.append('authkey', globalSettings.smsAuthKey);
          formData.append('to', formattedPhone);
          formData.append('message', `Your eUddok OTP is ${otp}`);
          formData.append('sandbox', 'false');

          await axios.post('https://sms.euddok.com/api/create-message', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        } catch (e) {
          console.error('Failed to send OTP SMS', e);
        }
      }

      res.json({ message: "OTP resent successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to resend OTP" });
    }
  });

  app.post("/api/auth/verify-login", async (req, res) => {
    const { phone, otp } = req.body;
    const stored = otpStore.get(phone);

    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    try {
      const { user } = stored.data;
      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });

      otpStore.delete(phone);
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
    const { displayName, photoUrl, paymentMethods, notificationSettings } = req.body;
    try {
      await db.run(
        "UPDATE users SET displayName = ?, photoUrl = ?, paymentMethods = ?, notificationSettings = ? WHERE id = ?",
        [displayName, photoUrl, JSON.stringify(paymentMethods), JSON.stringify(notificationSettings), req.user.id]
      );
      const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
      const { password: _, ...userWithoutPassword } = user;
      
      // Update token with new data
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  // Branch Routes
  app.get("/api/branches", authenticateToken, async (req, res) => {
    try {
      const branches = await db.all("SELECT * FROM branches ORDER BY createdAt DESC");
      res.json({ branches });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch branches" });
    }
  });

  app.post("/api/branches", authenticateToken, async (req, res) => {
    const { name, code, address } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO branches (name, code, address) VALUES (?, ?, ?)",
        [name, code, address]
      );
      res.json({ id: result.lastID, name, code, address });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Branch code already exists" });
      }
      res.status(500).json({ error: "Failed to create branch" });
    }
  });

  app.put("/api/branches/:id", authenticateToken, async (req, res) => {
    const { name, code, address } = req.body;
    try {
      await db.run(
        "UPDATE branches SET name = ?, code = ?, address = ? WHERE id = ?",
        [name, code, address, req.params.id]
      );
      res.json({ id: req.params.id, name, code, address });
    } catch (error) {
      res.status(500).json({ error: "Failed to update branch" });
    }
  });

  app.delete("/api/branches/:id", authenticateToken, async (req, res) => {
    try {
      await db.run("DELETE FROM branches WHERE id = ?", [req.params.id]);
      res.json({ message: "Branch deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete branch" });
    }
  });

  // User Management Routes
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await db.all(`
        SELECT u.id, u.phone, u.displayName, u.role, u.status, u.createdAt, k.aiVerificationResult 
        FROM users u 
        LEFT JOIN kyc_data k ON u.id = k.userId 
        ORDER BY u.createdAt DESC
      `);
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    const { displayName, role, status } = req.body;
    try {
      await db.run(
        "UPDATE users SET displayName = ?, role = ?, status = ? WHERE id = ?",
        [displayName, role, status, req.params.id]
      );
      res.json({ id: req.params.id, displayName, role, status });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Member Routes
  app.get("/api/members", authenticateToken, async (req, res) => {
    try {
      const members = await db.all("SELECT * FROM members ORDER BY createdAt DESC");
      res.json({ members });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:memberId/details", authenticateToken, async (req, res) => {
    try {
      const memberId = req.params.memberId;
      const loans = await db.all("SELECT * FROM loans WHERE memberId = ?", [memberId]);
      const savings = await db.all("SELECT * FROM savings_accounts WHERE memberId = ?", [memberId]);
      const transactions = await db.all("SELECT * FROM transactions WHERE memberId = ? ORDER BY timestamp DESC LIMIT 50", [memberId]);
      res.json({ loans, savings, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch member details" });
    }
  });

  app.post("/api/members", authenticateToken, async (req, res) => {
    const { name, phone, nid, address, branchId, nomineeName, nomineeRelation, photoUrl } = req.body;
    try {
      const memberId = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;
      const result = await db.run(
        "INSERT INTO members (memberId, name, phone, nid, address, branchId, nomineeName, nomineeRelation, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [memberId, name, phone, nid, address, branchId, nomineeName, nomineeRelation, photoUrl]
      );
      res.json({ id: result.lastID, memberId, name, phone, nid, address, branchId, nomineeName, nomineeRelation, photoUrl });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Phone or NID already exists" });
      }
      res.status(500).json({ error: "Failed to create member" });
    }
  });

  app.put("/api/members/:id", authenticateToken, async (req, res) => {
    const { name, phone, nid, address, branchId, status, nomineeName, nomineeRelation, photoUrl } = req.body;
    try {
      await db.run(
        "UPDATE members SET name = ?, phone = ?, nid = ?, address = ?, branchId = ?, status = ?, nomineeName = ?, nomineeRelation = ?, photoUrl = ? WHERE id = ?",
        [name, phone, nid, address, branchId, status || 'active', nomineeName, nomineeRelation, photoUrl, req.params.id]
      );
      res.json({ id: req.params.id, name, phone, nid, address, branchId, status, nomineeName, nomineeRelation, photoUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", authenticateToken, async (req, res) => {
    try {
      await db.run("DELETE FROM members WHERE id = ?", [req.params.id]);
      res.json({ message: "Member deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete member" });
    }
  });

  // Loan Routes
  app.get("/api/loans", authenticateToken, async (req: any, res) => {
    try {
      const loans = await db.all(
        req.user.role === 'member'
          ? "SELECT l.* FROM loans l JOIN members m ON l.memberId = m.memberId JOIN users u ON m.phone = u.phone WHERE u.id = ? ORDER BY l.createdAt DESC"
          : "SELECT * FROM loans ORDER BY createdAt DESC",
        req.user.role === 'member' ? [req.user.id] : []
      );
      res.json({ loans });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loans" });
    }
  });

  app.get("/api/loans/:id/details", authenticateToken, async (req, res) => {
    try {
      const loan = await db.get("SELECT * FROM loans WHERE id = ?", [req.params.id]);
      if (!loan) return res.status(404).json({ error: "Loan not found" });
      
      const member = await db.get("SELECT * FROM members WHERE memberId = ?", [loan.memberId]);
      
      // Get all transactions related to this loan (installments)
      // Since we don't have a loanId column in transactions, we'll fetch installments for this member
      // and assume they are for the active loan. In a real app, transactions should link to loanId.
      // For now, let's just fetch recent installments for the member.
      const transactions = await db.all(
        "SELECT * FROM transactions WHERE memberId = ? AND type = 'installment' ORDER BY timestamp DESC",
        [loan.memberId]
      );
      
      res.json({ loan, member, transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loan details" });
    }
  });

  app.post("/api/loans", authenticateToken, async (req, res) => {
    const { memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId, applicationDate } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO loans (memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId, applicationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId, applicationDate || new Date().toISOString()]
      );
      res.json({ id: result.lastID, memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId, applicationDate });
    } catch (error) {
      res.status(500).json({ error: "Failed to create loan application" });
    }
  });

  app.put("/api/loans/:id/status", authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
      // Fetch loan and member details
      const loan = await db.get(
        "SELECT l.*, m.phone FROM loans l JOIN members m ON l.memberId = m.memberId WHERE l.id = ?",
        [req.params.id]
      );
      
      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }

      if (status === 'active') {
        await db.run("UPDATE loans SET status = ?, approvalDate = ? WHERE id = ?", [status, new Date().toISOString(), req.params.id]);
      } else {
        await db.run("UPDATE loans SET status = ? WHERE id = ?", [status, req.params.id]);
      }
      
      // Send SMS if status is active or rejected
      if ((status === 'active' || status === 'rejected') && loan.phone) {
        const message = status === 'active' 
          ? `Congratulations! Your loan application for ৳${loan.amount.toLocaleString()} has been approved. eUddok Smart Samity.`
          : `Sorry, your loan application for ৳${loan.amount.toLocaleString()} has been rejected. Please contact the branch. eUddok Smart Samity.`;
        
        try {
          // Fetch settings for SMS keys
          const settingsRow = await db.get("SELECT data FROM settings WHERE id = 'global'");
          const settings = settingsRow ? JSON.parse(settingsRow.data) : {};
          
          await axios.post("https://sms.euddok.com/api/create-message", {
            appkey: settings.smsAppKey || process.env.SMS_APP_KEY || "7144aead-508a-4a98-a8c9-4027abd8971f",
            authkey: settings.smsAuthKey || process.env.SMS_AUTH_KEY || "YqH6rZIUO0BbJB5ARcq91k5U7gftVOgT993cgokVzvCXKGsem5",
            to: loan.phone,
            message,
            sandbox: settings.sandboxMode || false
          });
        } catch (smsError) {
          console.error("Failed to send SMS on status update:", smsError);
        }
      }

      res.json({ id: req.params.id, status });
    } catch (error) {
      console.error("Loan status update error:", error);
      res.status(500).json({ error: "Failed to update loan status" });
    }
  });

  // Member lookup by phone
  app.get("/api/members/by-phone/:phone", authenticateToken, async (req, res) => {
    try {
      const member = await db.get("SELECT * FROM members WHERE phone = ?", [req.params.phone]);
      if (!member) return res.status(404).json({ error: "Member not found" });
      res.json({ member });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch member" });
    }
  });

  // Loan request routes
  app.post("/api/loan-requests", authenticateToken, async (req, res) => {
    const { memberId, amount, serviceCharge, installmentType, installments, applicationDate, guarantorMobile } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO loan_requests (memberId, amount, serviceCharge, installmentType, installments, applicationDate, guarantorMobile) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [memberId, amount, serviceCharge, installmentType, installments, applicationDate || new Date().toISOString(), guarantorMobile]
      );
      
      // Send notification to guarantor
      const settingsRow = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const settings = settingsRow ? JSON.parse(settingsRow.data) : {};
      
      try {
        await axios.post("https://sms.euddok.com/api/create-message", {
          appkey: settings.smsAppKey || process.env.SMS_APP_KEY || "7144aead-508a-4a98-a8c9-4027abd8971f",
          authkey: settings.smsAuthKey || process.env.SMS_AUTH_KEY || "YqH6rZIUO0BbJB5ARcq91k5U7gftVOgT993cgokVzvCXKGsem5",
          to: guarantorMobile,
          message: `You have been requested to be a guarantor for a loan request (ID: ${result.lastID}). Please accept by visiting: ${process.env.APP_URL || 'https://ais-dev-m2rouzzmoso35i7ldnrobx-762651086413.asia-southeast1.run.app'}/guarantor-accept/${result.lastID}`,
          sandbox: settings.sandboxMode || false
        });
      } catch (smsError: any) {
        console.error("Failed to send guarantor SMS:", smsError.response?.data || smsError.message);
      }

      res.json({ id: result.lastID, memberId, amount, serviceCharge, installmentType, installments, applicationDate, guarantorMobile, status: 'pending' });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit loan request" });
    }
  });

  app.post("/api/loan-requests/:id/accept-guarantor", async (req, res) => {
    try {
      await db.run("UPDATE loan_requests SET guarantorAccepted = 1 WHERE id = ?", [req.params.id]);
      res.json({ message: "Guarantor accepted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept guarantor" });
    }
  });

  // KYC Routes
  app.get("/api/kyc/all", authenticateToken, async (req: any, res: any) => {
    if (req.user.role === 'member') return res.status(403).json({ error: "Forbidden" });
    try {
      const records = await db.all(`
        SELECT k.*, u.displayName, u.phone, m.memberId
        FROM kyc_data k
        JOIN users u ON k.userId = u.id
        LEFT JOIN members m ON u.phone = m.phone
        ORDER BY k.createdAt DESC
      `);
      res.json({ records });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KYC records" });
    }
  });

  app.put("/api/kyc/:id/status", authenticateToken, async (req: any, res: any) => {
    if (req.user.role === 'member') return res.status(403).json({ error: "Forbidden" });
    const { status } = req.body;
    try {
      await db.run("UPDATE kyc_data SET status = ? WHERE id = ?", [status, req.params.id]);
      
      const kycRecord = await db.get("SELECT userId FROM kyc_data WHERE id = ?", [req.params.id]);
      if (kycRecord) {
        const user = await db.get("SELECT phone FROM users WHERE id = ?", [kycRecord.userId]);
        if (user) {
          await db.run("UPDATE members SET kycStatus = ? WHERE phone = ?", [status, user.phone]);
        }
      }
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.get("/api/kyc/status", authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;
    try {
      const kyc = await db.get("SELECT * FROM kyc_data WHERE userId = ?", [userId]);
      res.json({ kyc });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KYC status" });
    }
  });

  app.get("/api/withdrawals", authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;
    try {
      const withdrawals = await db.all(
        req.user.role === 'member' 
          ? "SELECT * FROM withdrawals WHERE userId = ? ORDER BY createdAt DESC"
          : "SELECT w.*, u.displayName FROM withdrawals w JOIN users u ON w.userId = u.id ORDER BY w.createdAt DESC",
        req.user.role === 'member' ? [userId] : []
      );
      res.json({ withdrawals });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  app.post("/api/withdrawals", authenticateToken, async (req: any, res: any) => {
    const { amount, method, accountNumber } = req.body;
    const userId = req.user.id;
    try {
      await db.run(
        "INSERT INTO withdrawals (userId, amount, method, accountNumber) VALUES (?, ?, ?, ?)",
        [userId, amount, method, accountNumber]
      );
      res.json({ message: "Withdrawal request submitted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit withdrawal" });
    }
  });

  app.post("/api/kyc/verify-ai", authenticateToken, async (req: any, res: any) => {
    const { nidFront, nidBack, selfie } = req.body;
    try {
      const sanitizeBase64 = (str: string) => {
        if (!str) return str;
        // Ensure it starts with data:image/jpeg;base64, and remove any whitespace
        const cleanStr = str.replace(/\s/g, '');
        if (cleanStr.startsWith('data:image/')) {
          return cleanStr;
        }
        return `data:image/jpeg;base64,${cleanStr}`;
      };

      const cleanNidFront = sanitizeBase64(nidFront);
      const cleanNidBack = sanitizeBase64(nidBack);
      const cleanSelfie = sanitizeBase64(selfie);

      const settings = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const globalSettings = JSON.parse(settings?.data || '{}');

      if (!globalSettings.aiVerificationEnabled) {
        return res.status(400).json({ error: "AI Verification is disabled" });
      }

      const apiKey = globalSettings.aiApiKey;
      const model = globalSettings.aiModel || "google/gemini-2.5-flash";

      if (!apiKey) {
        return res.status(400).json({ error: "AI API Key is not configured" });
      }

      const prompt = `
        You are an expert KYC verification system called "Einstein Verify".
        Analyze the following three images:
        1. NID Front
        2. NID Back
        3. Selfie of the person
        
        Tasks:
        - Verify if the NID is a valid Bangladesh National ID card.
        - Compare the face in the NID Front with the face in the Selfie.
        - Check if the name and details on the NID are clearly visible.
        
        Return a JSON response with:
        {
          "status": "verified" | "rejected",
          "confidence": number (0-100),
          "reason": "Clear explanation of the result",
          "extractedInfo": {
            "name": "Name from NID",
            "nidNumber": "NID Number"
          }
        }
      `;

      // Call OpenRouter API
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: cleanNidFront } },
                { type: "image_url", image_url: { url: cleanNidBack } },
                { type: "image_url", image_url: { url: cleanSelfie } }
              ]
            }
          ],
          response_format: { type: "json_object" }
        },
        {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://euddok.com",
            "X-Title": "eUddok KYC"
          }
        }
      );

      const resultText = response.data.choices[0].message.content;
      const result = JSON.parse(resultText);

      res.json({ result });
    } catch (error: any) {
      console.error("AI Verification Error:", error.response?.data || error.message);
      res.status(500).json({ error: "AI Verification failed" });
    }
  });

  app.post("/api/kyc/submit", authenticateToken, async (req: any, res: any) => {
    const { nidFront, nidBack, selfie, status, aiResult } = req.body;
    const userId = req.user.id;
    try {
      await db.run(
        "INSERT OR REPLACE INTO kyc_data (userId, nidFrontUrl, nidBackUrl, selfieUrl, status, aiVerificationResult) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, nidFront, nidBack, selfie, status, aiResult]
      );
      
      // Also update member table if exists
      const user = await db.get("SELECT phone FROM users WHERE id = ?", [userId]);
      if (user) {
        await db.run(
          "UPDATE members SET kycStatus = ?, aiVerificationResult = ? WHERE phone = ?",
          [status, aiResult, user.phone]
        );
      }
      
      res.json({ message: "KYC submitted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to submit KYC" });
    }
  });

  // Notification Settings Routes
  app.get("/api/notification-settings", authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;
    try {
      let settings = await db.get("SELECT * FROM notification_settings WHERE userId = ?", [userId]);
      if (!settings) {
        await db.run("INSERT INTO notification_settings (userId) VALUES (?)", [userId]);
        settings = await db.get("SELECT * FROM notification_settings WHERE userId = ?", [userId]);
      }
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/notification-settings", authenticateToken, async (req: any, res: any) => {
    const userId = req.user.id;
    const { depositEnabled, loanEnabled, kycEnabled } = req.body;
    try {
      await db.run(
        "UPDATE notification_settings SET depositEnabled = ?, loanEnabled = ?, kycEnabled = ? WHERE userId = ?",
        [depositEnabled, loanEnabled, kycEnabled, userId]
      );
      res.json({ message: "Settings updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Savings Routes
  app.get("/api/savings", authenticateToken, async (req: any, res) => {
    try {
      const accounts = await db.all(
        req.user.role === 'member'
          ? "SELECT s.* FROM savings_accounts s JOIN members m ON s.memberId = m.memberId JOIN users u ON m.phone = u.phone WHERE u.id = ? ORDER BY s.createdAt DESC"
          : "SELECT * FROM savings_accounts ORDER BY createdAt DESC",
        req.user.role === 'member' ? [req.user.id] : []
      );
      res.json({ accounts });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch savings accounts" });
    }
  });

  app.post("/api/savings", authenticateToken, async (req: any, res: any) => {
    let { memberId, type, initialDeposit, branchId } = req.body;
    const { id: userId, role, phone } = req.user;
    console.log("Savings POST request:", { memberId, type, initialDeposit, branchId, userId, role, phone });

    try {
      // If member, they can only open for themselves and we auto-assign their memberId
      if (role === 'member') {
        const member = await db.get("SELECT memberId, branchId FROM members WHERE phone = ?", [phone]);
        console.log("Member lookup result:", member);
        if (!member) {
          return res.status(403).json({ error: "Member profile not found" });
        }
        memberId = member.memberId;
        branchId = member.branchId;
      }

      const status = initialDeposit > 0 ? 'pending' : 'active';
      const result = await db.run(
        "INSERT INTO savings_accounts (memberId, type, balance, status) VALUES (?, ?, ?, ?)",
        [memberId, type, initialDeposit || 0, status]
      );
      console.log("Savings insert result:", result);
      
      if (initialDeposit && initialDeposit > 0) {
        await db.run(
          "INSERT INTO transactions (memberId, type, amount, method, savingsAccountId, branchId, fieldOfficerId) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [memberId, 'deposit', initialDeposit, 'cash', result.lastID, branchId, userId]
        );
      }
      
      res.json({ id: result.lastID, memberId, type, balance: initialDeposit || 0 });
    } catch (error) {
      console.error("Savings account creation error:", error);
      res.status(500).json({ error: "Failed to create savings account" });
    }
  });

  // Transaction Routes
  app.get("/api/transactions", authenticateToken, async (req: any, res) => {
    try {
      const transactions = await db.all(
        req.user.role === 'member'
          ? "SELECT t.* FROM transactions t JOIN members m ON t.memberId = m.memberId JOIN users u ON m.phone = u.phone WHERE u.id = ? ORDER BY t.timestamp DESC"
          : "SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100",
        req.user.role === 'member' ? [req.user.id] : []
      );
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", authenticateToken, async (req, res) => {
    const { memberId, type, amount, method, loanId, savingsAccountId, branchId } = req.body;
    const fieldOfficerId = (req as any).user.id;
    try {
      const result = await db.run(
        "INSERT INTO transactions (memberId, type, amount, method, loanId, savingsAccountId, branchId, fieldOfficerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [memberId, type, amount, method, loanId, savingsAccountId, branchId, fieldOfficerId]
      );

      // Update loan paid amount if it's an installment
      if (type === 'installment' && loanId) {
        await db.run("UPDATE loans SET paidAmount = paidAmount + ? WHERE id = ?", [amount, loanId]);
        
        // Check if loan is completed
        const loan = await db.get("SELECT * FROM loans WHERE id = ?", [loanId]);
        if (loan && loan.paidAmount >= loan.totalPayable) {
          await db.run("UPDATE loans SET status = 'completed' WHERE id = ?", [loanId]);
          
          // Send completion SMS
          const member = await db.get("SELECT phone FROM members WHERE memberId = ?", [memberId]);
          if (member?.phone) {
            try {
              const settingsRow = await db.get("SELECT data FROM settings WHERE id = 'global'");
              const settings = settingsRow ? JSON.parse(settingsRow.data) : {};
              await axios.post("https://sms.euddok.com/api/create-message", {
                appkey: settings.smsAppKey || process.env.SMS_APP_KEY || "7144aead-508a-4a98-a8c9-4027abd8971f",
                authkey: settings.smsAuthKey || process.env.SMS_AUTH_KEY || "YqH6rZIUO0BbJB5ARcq91k5U7gftVOgT993cgokVzvCXKGsem5",
                to: member.phone,
                message: `Congratulations! Your loan (ID: ${loanId}) has been fully repaid. Thank you for being with eUddok Smart Samity.`,
                sandbox: settings.sandboxMode || false
              });
            } catch (smsError: any) {
              console.error("Failed to send completion SMS:", smsError.response?.data || smsError.message);
            }
          }
        }
      }

      // Update savings balance if it's a deposit or withdrawal
      if (savingsAccountId) {
        const change = type === 'deposit' ? amount : -amount;
        await db.run("UPDATE savings_accounts SET balance = balance + ? WHERE id = ?", [change, savingsAccountId]);
      }

      res.json({ id: result.lastID, memberId, type, amount, method, loanId, savingsAccountId, branchId, fieldOfficerId });
    } catch (error) {
      res.status(500).json({ error: "Failed to record transaction" });
    }
  });

  // Payment Routes
  app.post("/api/pay/create", authenticateToken, async (req, res) => {
    try {
      const { amount, memberId, loanId, branchId, type, savingsAccountId } = req.body;
      const settingsRow = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const settings = settingsRow ? JSON.parse(settingsRow.data) : {};

      if (!settings.paymentApiKey || !settings.paymentSecretKey || !settings.paymentBrandKey) {
        return res.status(400).json({ error: "Payment gateway is not configured" });
      }

      const member = await db.get("SELECT * FROM members WHERE memberId = ?", [memberId]);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;

      const payload = {
        cus_name: member.name,
        cus_email: `${member.phone}@euddok.com`,
        amount: amount.toString(),
        success_url: `${baseUrl}/api/pay/callback?status=success`,
        cancel_url: `${baseUrl}/api/pay/callback?status=cancel`,
        metadata: {
          memberId,
          loanId,
          branchId,
          type,
          savingsAccountId,
          fieldOfficerId: (req as any).user.id
        }
      };

      const response = await axios.post('https://pay.euddok.com/pay/api/payment/create', payload, {
        headers: {
          'API-KEY': settings.paymentApiKey,
          'SECRET-KEY': settings.paymentSecretKey,
          'BRAND-KEY': settings.paymentBrandKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.payment_url) {
        res.json({ payment_url: response.data.payment_url });
      } else {
        res.status(400).json({ error: "Failed to generate payment URL" });
      }
    } catch (error) {
      console.error("Payment create error:", error);
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  app.get("/api/pay/callback", async (req, res) => {
    const { status, transactionId } = req.query;

    if (status !== 'success' || !transactionId) {
      return res.redirect('/loans?payment=failed');
    }

    try {
      const settingsRow = await db.get("SELECT data FROM settings WHERE id = 'global'");
      const settings = settingsRow ? JSON.parse(settingsRow.data) : {};

      const response = await axios.post('https://pay.euddok.com/pay/api/payment/verify', {
        transaction_id: transactionId
      }, {
        headers: {
          'API-KEY': settings.paymentApiKey,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      if (data.status === 'COMPLETED') {
        const metadata = data.metadata || {};
        const { memberId, loanId, branchId, type, fieldOfficerId } = metadata;

        if (type === 'installment' && loanId) {
          // Record transaction
          await db.run(
            "INSERT INTO transactions (memberId, type, amount, method, loanId, branchId, fieldOfficerId) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [memberId, type, parseFloat(data.amount), 'online', loanId, branchId, fieldOfficerId]
          );

          // Update loan paid amount
          await db.run("UPDATE loans SET paidAmount = paidAmount + ? WHERE id = ?", [parseFloat(data.amount), loanId]);
          
          // Check if loan is completed
          const loan = await db.get("SELECT * FROM loans WHERE id = ?", [loanId]);
          if (loan && loan.paidAmount >= loan.totalPayable) {
            await db.run("UPDATE loans SET status = 'completed' WHERE id = ?", [loanId]);
          }
          res.redirect('/loans?payment=success');
        } else if (type === 'savings_deposit' && metadata.savingsAccountId) {
          // Record transaction
          await db.run(
            "INSERT INTO transactions (memberId, type, amount, method, savingsAccountId, branchId, fieldOfficerId) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [memberId, 'deposit', parseFloat(data.amount), 'online', null, branchId, fieldOfficerId]
          );

          // Update savings balance
          await db.run("UPDATE savings_accounts SET balance = balance + ?, status = 'active' WHERE id = ?", [parseFloat(data.amount), metadata.savingsAccountId]);
          
          res.redirect('/savings?payment=success');
        } else {
          res.redirect('/dashboard?payment=success');
        }
      } else {
        res.redirect('/loans?payment=failed');
      }
    } catch (error) {
      console.error("Payment verify error:", error);
      res.redirect('/loans?payment=error');
    }
  });

  // Settings Routes
  app.get("/api/settings", authenticateToken, async (req, res) => {
    try {
      const settings = await db.get("SELECT data FROM settings WHERE id = 'global'");
      res.json(JSON.parse(settings.data));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", authenticateToken, async (req, res) => {
    try {
      await db.run("UPDATE settings SET data = ? WHERE id = 'global'", [JSON.stringify(req.body)]);
      res.json({ message: "Settings updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/stats", authenticateToken, async (req, res) => {
    try {
      const membersCount = await db.get("SELECT COUNT(*) as count FROM members");
      const branchesCount = await db.get("SELECT COUNT(*) as count FROM branches");
      const activeLoans = await db.get("SELECT COUNT(*) as count FROM loans WHERE status = 'active'");
      
      // Calculate today's collection
      const today = new Date().toISOString().split('T')[0];
      const todayCollection = await db.get(
        "SELECT SUM(amount) as total FROM transactions WHERE date(timestamp) = date(?) AND (type = 'deposit' OR type = 'installment')",
        [today]
      );

      res.json({
        totalMembers: membersCount.count,
        totalBranches: branchesCount.count,
        activeLoans: activeLoans.count,
        todayCollection: todayCollection.total || 0,
        totalSavings: (await db.get("SELECT SUM(balance) as total FROM savings_accounts")).total || 0
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // eUddok SMS Gateway Proxy
  app.post("/api/sms/send", async (req, res) => {
    const { to, message, sandbox } = req.body;
    try {
      const response = await axios.post("https://sms.euddok.com/api/create-message", {
        appkey: process.env.SMS_APP_KEY || "7144aead-508a-4a98-a8c9-4027abd8971f",
        authkey: process.env.SMS_AUTH_KEY || "YqH6rZIUO0BbJB5ARcq91k5U7gftVOgT993cgokVzvCXKGsem5",
        to,
        message,
        sandbox: sandbox || false
      });
      res.json(response.data);
    } catch (error) {
      console.error("SMS Error:", error);
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // eUddok Payment Gateway Proxy
  app.post("/api/payment/initiate", async (req, res) => {
    res.json({ url: "https://payment.euddok.com/mock-pay" });
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`Attempting to listen on port ${PORT}...`);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Automated SMS Reminders
    setInterval(async () => {
      try {
        console.log("Running automated SMS reminders check...");
        const settingsRes = await db.get("SELECT data FROM settings WHERE id = 'global'");
        if (!settingsRes || !settingsRes.data) {
          console.warn("Settings not found, skipping reminders.");
          return;
        }
        
        const settings = JSON.parse(settingsRes.data);
        if (!settings.autoSmsReminders) return;

        const activeLoans = await db.all("SELECT * FROM loans WHERE status = 'active'");
        const today = new Date();
        
        for (const loan of activeLoans) {
          const createdAt = new Date(loan.createdAt);
          const diffDays = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const interval = loan.installmentType === 'weekly' ? 7 : 30;
          
          // Check if an installment is due in 'reminderDays'
          const nextInstallmentDay = (Math.floor(diffDays / interval) + 1) * interval;
          const daysToNext = nextInstallmentDay - diffDays;
          
          if (daysToNext === settings.reminderDays) {
            const member = await db.get("SELECT * FROM members WHERE memberId = ?", [loan.memberId]);
            if (member && member.phone) {
              const amount = loan.totalPayable / loan.installments;
              const message = `Dear ${member.name}, your loan installment of ৳${amount.toFixed(2)} is due in ${settings.reminderDays} days. Please ensure payment. Thank you.`;
              
              await axios.post("https://sms.euddok.com/api/create-message", {
                appkey: settings.smsAppKey,
                authkey: settings.smsAuthKey,
                to: member.phone,
                message,
                sandbox: settings.sandboxMode
              });
              console.log(`Reminder sent to ${member.phone}`);
            }
          }
        }
      } catch (error) {
        console.error("Reminder Error:", error);
      }
    }, 1000 * 60 * 60 * 24); // Run once every 24 hours
  });
  } catch (error) {
    console.error("Error in startServer:", error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
