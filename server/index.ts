import dotenv from "dotenv";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeIndustryTags } from "./init-industry-tags";
import { spawn } from "child_process";

// Load environment variables
dotenv.config();

// Function to start Telegram bot service
function startTelegramBotService() {
  try {
    log('[TELEGRAM-BOT] Starting Telegram bot service...');
    
    const botProcess = spawn('node', ['services/telegram-bot/simple-server.js'], {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: {
        ...process.env,
        TELEGRAM_BOT_PORT: '3001',
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    botProcess.stdout?.on('data', (data) => {
      log(`[TELEGRAM-BOT] ${data.toString().trim()}`);
    });

    botProcess.stderr?.on('data', (data) => {
      log(`[TELEGRAM-BOT] ERROR: ${data.toString().trim()}`);
    });

    botProcess.on('close', (code) => {
      log(`[TELEGRAM-BOT] Service stopped with code ${code}`);
    });

    botProcess.on('error', (error) => {
      log(`[TELEGRAM-BOT] Failed to start: ${error.message}`);
    });

    log('[TELEGRAM-BOT] Service started on port 3001');
  } catch (error) {
    log(`[TELEGRAM-BOT] Failed to start service: ${error.message}`);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize industry tags
  await initializeIndustryTags();
  
  // Start Telegram bot service
  startTelegramBotService();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
