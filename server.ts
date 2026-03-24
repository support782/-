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

    app.use(express.json());
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
      email TEXT UNIQUE,
      password TEXT,
      displayName TEXT,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
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
        paymentMerchantId: '',
        lateFeeRate: 10,
        sandboxMode: true,
        autoSmsReminders: false,
        reminderDays: 3
      };
      await db.run("INSERT INTO settings (id, data) VALUES (?, ?)", ['global', JSON.stringify(defaultSettings)]);
      console.log("Default settings initialized.");
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

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, displayName } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Check if this is the first user
      const userCount = await db.get("SELECT COUNT(*) as count FROM users");
      const role = (userCount.count === 0 || email === "support@mail.euddok.com") ? "super_admin" : "member";

      const result = await db.run(
        "INSERT INTO users (email, password, displayName, role) VALUES (?, ?, ?, ?)",
        [email, hashedPassword, displayName, role]
      );
      
      const user = { id: result.lastID, email, displayName, role };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: "7d" });

      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
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
      const users = await db.all("SELECT id, email, displayName, role, status, createdAt FROM users ORDER BY createdAt DESC");
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
    const { name, phone, nid, address, branchId, nomineeName, nomineeRelation } = req.body;
    try {
      const memberId = `MEM-${Math.floor(10000 + Math.random() * 90000)}`;
      const result = await db.run(
        "INSERT INTO members (memberId, name, phone, nid, address, branchId, nomineeName, nomineeRelation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [memberId, name, phone, nid, address, branchId, nomineeName, nomineeRelation]
      );
      res.json({ id: result.lastID, memberId, name, phone, nid, address, branchId, nomineeName, nomineeRelation });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Phone or NID already exists" });
      }
      res.status(500).json({ error: "Failed to create member" });
    }
  });

  app.put("/api/members/:id", authenticateToken, async (req, res) => {
    const { name, phone, nid, address, branchId, status, nomineeName, nomineeRelation } = req.body;
    try {
      await db.run(
        "UPDATE members SET name = ?, phone = ?, nid = ?, address = ?, branchId = ?, status = ?, nomineeName = ?, nomineeRelation = ? WHERE id = ?",
        [name, phone, nid, address, branchId, status || 'active', nomineeName, nomineeRelation, req.params.id]
      );
      res.json({ id: req.params.id, name, phone, nid, address, branchId, status, nomineeName, nomineeRelation });
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
  app.get("/api/loans", authenticateToken, async (req, res) => {
    try {
      const loans = await db.all("SELECT * FROM loans ORDER BY createdAt DESC");
      res.json({ loans });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch loans" });
    }
  });

  app.post("/api/loans", authenticateToken, async (req, res) => {
    const { memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO loans (memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId]
      );
      res.json({ id: result.lastID, memberId, amount, serviceCharge, totalPayable, installmentType, installments, branchId });
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

      await db.run("UPDATE loans SET status = ? WHERE id = ?", [status, req.params.id]);
      
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

  // Savings Routes
  app.get("/api/savings", authenticateToken, async (req, res) => {
    try {
      const accounts = await db.all("SELECT * FROM savings_accounts ORDER BY createdAt DESC");
      res.json({ accounts });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch savings accounts" });
    }
  });

  app.post("/api/savings", authenticateToken, async (req, res) => {
    const { memberId, type, initialDeposit, branchId } = req.body;
    try {
      const result = await db.run(
        "INSERT INTO savings_accounts (memberId, type, balance) VALUES (?, ?, ?)",
        [memberId, type, initialDeposit || 0]
      );
      
      if (initialDeposit > 0) {
        await db.run(
          "INSERT INTO transactions (memberId, type, amount, method, savingsAccountId, branchId, fieldOfficerId) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [memberId, 'deposit', initialDeposit, 'cash', result.lastID, branchId, (req as any).user.id]
        );
      }
      
      res.json({ id: result.lastID, memberId, type, balance: initialDeposit || 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to create savings account" });
    }
  });

  // Transaction Routes
  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const transactions = await db.all("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100");
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
            } catch (smsError) {
              console.error("Failed to send completion SMS:", smsError);
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
