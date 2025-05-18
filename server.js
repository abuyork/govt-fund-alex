import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client for migrations
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || "https://gykujxuuemhcxsqeejmj.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client for API endpoints
const supabaseClient = createClient(
  supabaseUrl,
  process.env.VITE_SUPABASE_ANON_PUBLIC_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5a3VqeHV1ZW1oY3hzcWVlam1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwODM2NjYsImV4cCI6MjA1OTY1OTY2Nn0.TnYPRUqdL8_O5yobK13HWWWpffM5tYcx4H2f9k0EeR8"
);

// Middleware to get authenticated user
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  try {
    // Get user from the token
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: "Invalid authentication token",
      });
    }

    // Add user data to the request
    req.user = data.user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
};

// Function to apply migrations from the migrations directory
async function applyMigrations() {
  if (!supabaseServiceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not found. Skipping migrations.");
    return;
  }

  try {
    console.log("Initializing Supabase admin client for migrations...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Read migration files
    const migrationsDir = path.join(__dirname, "supabase", "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`Migrations directory not found: ${migrationsDir}`);
      return;
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Apply in alphabetical order

    console.log(`Found ${migrationFiles.length} migration files`);

    // Apply each migration
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Applying migration: ${file}`);

      // Execute the SQL directly using pgSQL
      const { error } = await supabase.rpc("exec_sql", { sql });

      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        // Continue with other migrations
      } else {
        console.log(`Successfully applied migration: ${file}`);
      }
    }

    console.log("All migrations applied");
  } catch (error) {
    console.error("Error applying migrations:", error);
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    "https://gykujxuuemhcxsqeejmj.supabase.co",
    process.env.VITE_SERVER_DOMAIN || "https://kvzd.info",
    "https://accounts.kakao.com",
    "https://accounts.google.com",
    "https://nid.naver.com",
    "https://magical-biscuit-e54d29.netlify.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Toss Payment configuration

const tossSecretKey =
  process.env.VITE_TOSS_SECRET_KEY || "test_sk_oEjb0gm23Pb1Eb1vp01krpGwBJn5";
const tossClientKey =
  process.env.VITE_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
// const TOSS_API_CLIENT_KEY = process.env.TOSS_API_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
// const TOSS_API_SECRET_KEY = process.env.TOSS_API_SECRET_KEY || 'test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R';
const TOSS_API_URL = "https://api.tosspayments.com/v1";

// Enable compression for all responses
app.use(compression());

// Use Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Adjust CSP based on your needs
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

// Parse JSON body
app.use(express.json());

// Cache control for static assets
const staticOptions = {
  maxAge: "1d",
  etag: true,
  lastModified: true,
};

// Add test endpoint for direct API access
app.get("/api/bizinfo/test", async (req, res) => {
  try {
    console.log("Testing direct API access to Bizinfo");
    const apiKey = process.env.VITE_BIZINFO_API_KEY || "2jtmx7";
    const response = await fetch(
      `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?crtfcKey=${apiKey}&dataType=json&pageUnit=20&pageIndex=1`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.bizinfo.go.kr/",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `API responded with status ${response.status}: ${response.statusText}`
      );
      throw new Error(`API error: ${response.status}`);
    }

    const contentType = response.headers.get("Content-Type") || "";
    console.log(`Content-Type from API: ${contentType}`);

    const text = await response.text();
    console.log(
      `Response text (first 100 chars): ${text.substring(0, 100)}...`
    );

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: "Invalid JSON response from API",
        responseText: text.substring(0, 500),
        contentType,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Error testing Bizinfo API:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API proxy with performance enhancements
app.use(
  "/api/bizinfo/proxy",
  createProxyMiddleware({
    target: "https://www.bizinfo.go.kr",
    changeOrigin: true,
    pathRewrite: {
      "^/api/bizinfo/proxy": "/uss/rss/bizinfoApi.do",
    },
    onProxyReq: (proxyReq, req, res) => {
      // Mark start time for performance measurement
      req._startTime = Date.now();

      // Pass the API key from environment variable if not provided in the request
      const query = new URLSearchParams(req.query);
      if (!query.has("crtfcKey")) {
        query.append("crtfcKey", process.env.VITE_BIZINFO_API_KEY || "2jtmx7");
        proxyReq.path = `/uss/rss/bizinfoApi.do?${query.toString()}`;
      }

      // Add request timeout
      req.setTimeout(10000); // 10 second timeout for external API

      // Add headers to ensure proper response
      proxyReq.setHeader("Accept", "application/json");
      proxyReq.setHeader("User-Agent", "Mozilla/5.0");
      proxyReq.setHeader("Referer", "https://www.bizinfo.go.kr/");
      proxyReq.setHeader("Connection", "keep-alive");

      console.log(`Proxying request to: ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Check content type to ensure it's JSON
      const contentType = proxyRes.headers["content-type"] || "";
      console.log(`Proxy response status: ${proxyRes.statusCode}, Content-Type: ${contentType}`);

      // Log proxy response time
      const responseTime = Date.now() - req._startTime;
      console.log(`Received proxy response: ${proxyRes.statusCode} in ${responseTime}ms`);

      // Always attempt to convert text/html responses to JSON errors
      if (contentType.includes("text/html")) {
        console.log("Received HTML response, converting to JSON error");
        let body = "";

        // Collect the response body
        proxyRes.on("data", (chunk) => {
          body += chunk;
        });

        // When response ends, replace it with a proper JSON error
        proxyRes.on("end", () => {
          // Try direct API call as a fallback
          console.log("Trying direct API call as fallback...");
          const apiKey = process.env.VITE_BIZINFO_API_KEY || "2jtmx7";

          // Extract query parameters from the original request
          const queryParams = new URLSearchParams(req.query);
          if (!queryParams.has("crtfcKey")) {
            queryParams.append("crtfcKey", apiKey);
          }

          // Make direct API call
          fetch(`https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do?${queryParams.toString()}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "User-Agent": "Mozilla/5.0",
              Referer: "https://www.bizinfo.go.kr/",
            },
          })
            .then(directResponse => {
              if (!directResponse.ok) {
                throw new Error(`Direct API call failed with status ${directResponse.status}`);
              }
              return directResponse.text();
            })
            .then(text => {
              try {
                // Try to parse the text as JSON
                const jsonData = JSON.parse(text);

                // Success! Return the JSON data
                console.log("Direct API call succeeded, returning JSON response");

                // Clear any previous headers
                for (const header in res.getHeaders()) {
                  res.removeHeader(header);
                }

                // Set new headers
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Cache-Control", "public, max-age=300");

                res.statusCode = 200;
                res.end(JSON.stringify(jsonData));
              } catch (e) {
                // Failed to parse as JSON, return error
                console.error("Failed to parse direct API response as JSON:", e);
                sendErrorResponse();
              }
            })
            .catch(error => {
              console.error("Error making direct API call:", error);
              sendErrorResponse();
            });

          function sendErrorResponse() {
            // Clear any previous headers
            for (const header in res.getHeaders()) {
              res.removeHeader(header);
            }

            // Set new headers
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");

            // Return a proper JSON error response
            res.statusCode = 502; // Bad Gateway
            res.end(
              JSON.stringify({
                success: false,
                error: "API returned invalid content type. Expected JSON, got text/html; charset=UTF-8",
                message: "API 키가 올바른지 확인하거나, 서버 상태를 확인해 주세요.",
                apiUrl: "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"
              })
            );
          }
        });
        return;
      } else if (proxyRes.statusCode === 200 && contentType.includes("application/json")) {
        // Set cache control for successful JSON responses
        proxyRes.headers["cache-control"] = "public, max-age=300";
      }

      // Log warning if response time exceeds target
      if (responseTime > 300) {
        console.warn(`API response time exceeds target (300ms): ${responseTime}ms`);
      }
    },
    onError: (err, req, res) => {
      console.error("Proxy error:", err);
      res.status(502).json({
        success: false,
        error: "Failed to connect to Bizinfo API",
        message: err.message,
        apiUrl: "https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do"
      });
    },
  })
);

// Initialize Toss Payment
app.post("/api/payments/toss/request", async (req, res) => {
  try {
    const { amount, orderId, orderName, successUrl, failUrl, customerName } =
      req.body;

    // Validate required fields
    if (!amount || !orderId || !orderName || !successUrl || !failUrl) {
      return res.status(400).json({
        success: false,
        error: "필수 필드가 누락되었습니다.",
      });
    }

    // In a production environment, call Toss API to create a payment
    // For development, we're simulating the response

    // For actual Toss implementation, uncomment this:

    const response = await axios.post(
      `${TOSS_API_URL}/payments/key-in`,
      {
        amount,
        orderId,
        orderName,
        successUrl,
        failUrl,
        customerName: customerName || "Customer",
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        paymentURL: response.data.checkout.url,
      });
    } else {
      throw new Error("토스페이먼츠 API 요청 실패");
    }

    // Simulated response for development
    // const simulatedTossURL = `https://test-pay.toss.im/order/pay?paymentKey=simulatedPaymentKey&orderId=${orderId}&amount=${amount}`;

    // return res.status(200).json({
    //   success: true,
    //   paymentURL: simulatedTossURL,
    // });
  } catch (error) {
    console.error("Toss payment request error:", error);
    return res.status(500).json({
      success: false,
      error: "토스페이먼츠 결제 초기화 중 오류가 발생했습니다.",
    });
  }
});

// Verify Toss Payment
app.post("/api/payments/toss/verify", async (req, res) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    // Validate required fields
    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: "필수 필드가 누락되었습니다.",
      });
    }

    // In a production environment, call Toss API to verify the payment
    // For development, we're simulating the response

    // For actual Toss implementation, uncomment this:

    const response = await axios.post(
      `${TOSS_API_URL}/payments/${paymentKey}`,
      {
        orderId,
        amount,
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString(
            "base64"
          )}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200 && response.data.status === "DONE") {
      return res.status(200).json({
        success: true,
      });
    } else {
      throw new Error("토스페이먼츠 결제 확인 실패");
    }

    // Simulated response for development (90% success rate)
    // const simulatedSuccess = Math.random() > 0.1;

    // if (simulatedSuccess) {
    //   return res.status(200).json({
    //     success: true,
    //   });
    // } else {
    //   return res.status(400).json({
    //     success: false,
    //     error: "결제가 실패했습니다. 다시 시도해주세요.",
    //   });
    // }
  } catch (error) {
    console.error("Toss payment verification error:", error);
    return res.status(500).json({
      success: false,
      error: "토스페이먼츠 결제 확인 중 오류가 발생했습니다.",
    });
  }
});

// Payment API endpoints
app.post("/api/payments/process", async (req, res) => {
  try {
    const { userId, planType, paymentMethod, paymentDetails, amount } =
      req.body;

    // Validate required fields
    if (!userId || !planType || !paymentMethod || !amount) {
      return res.status(400).json({
        success: false,
        error: "필수 필드가 누락되었습니다.",
      });
    }

    // In a real implementation, process the payment with a payment gateway
    // This is a simplified version
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for simulation

    if (paymentSuccess) {
      // Generate a random payment ID
      const paymentId = `pay_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}`;

      // In a real implementation, this would be handled by the payment service
      const status = paymentMethod === "bank" ? "pending" : "completed";

      return res.status(200).json({
        success: true,
        paymentId,
        status,
        message:
          status === "pending"
            ? "결제가 접수되었습니다. 입금 확인 후 서비스가 활성화됩니다."
            : "결제가 완료되었습니다.",
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
      });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다.",
    });
  }
});

// Auth API endpoints
app.get("/api/auth/session", (req, res) => {
  // This endpoint would typically validate a session token
  // For now, we'll just respond with a success message
  return res.status(200).json({
    success: true,
    message: "Session validated",
  });
});

// Auth callback handler
app.get("/auth/callback", (req, res) => {
  // Handle OAuth callback
  // The client-side React app will handle this through the AuthCallback component
  // Just make sure this URL is correctly routed to the React app
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Get user subscription
app.get("/api/subscriptions/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, fetch from the database
    // This is a simplified version
    const subscription = {
      id: `sub_${Date.now()}`,
      userId,
      planType:
        Math.random() > 0.7
          ? "premium"
          : Math.random() > 0.5
            ? "standard"
            : "free",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      isActive: true,
      autoRenew: true,
      paymentId: `pay_${Date.now() - 30 * 24 * 60 * 60 * 1000}`,
    };

    return res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다.",
    });
  }
});

// Cancel subscription
app.post("/api/subscriptions/:subscriptionId/cancel", (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "사용자 ID가 필요합니다.",
      });
    }

    // In a real implementation, update the database
    // This is a simplified version

    return res.status(200).json({
      success: true,
      message: "구독이 취소되었습니다.",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다.",
    });
  }
});

// Get available plans
app.get("/api/plans", (req, res) => {
  try {
    const plans = {
      free: {
        name: "무료 플랜",
        price: 0,
        features: [
          "기본 지원사업 검색",
          "알림 서비스 1년 무료",
          "AI 사업계획서 1회 무료 생성",
          "기본 템플릿 무료 이용",
        ],
      },
      standard: {
        name: "스탠다드 플랜",
        price: 9900,
        features: [
          "고급 지원사업 검색 및 필터링",
          "알림 서비스 무제한",
          "AI 사업계획서 무제한 생성",
          "특화 템플릿 3개 무료 이용",
          "사업계획서 PDF/DOCX 변환",
        ],
      },
      premium: {
        name: "프리미엄 플랜",
        price: 29900,
        features: [
          "스탠다드 모든 기능 포함",
          "AI 사업계획서 무제한 생성",
          "모든 특화 템플릿 무료 이용",
          "전문가 1:1 컨설팅 (월 1회)",
          "우선 지원 및 맞춤 분석",
        ],
      },
    };

    return res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return res.status(500).json({
      success: false,
      error: "서버 오류가 발생했습니다.",
    });
  }
});

// API endpoint to get search history
app.get("/api/search-history", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "20");
    const offset = parseInt(req.query.offset || "0");

    // Call the RPC function to get search history
    const { data, error } = await supabaseClient
      .rpc("get_search_history", {
        limit_count: limit,
        offset_count: offset,
      })
      .auth(req.headers.authorization);

    if (error) {
      console.error("Error getting search history:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve search history",
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Search history API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// API endpoint to add search to history
app.post("/api/search-history", authMiddleware, async (req, res) => {
  try {
    const { keyword, filters } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: "Keyword is required",
      });
    }

    // Call the RPC function to add search history
    const { data, error } = await supabaseClient
      .rpc("add_search_history", {
        keyword,
        filters: JSON.stringify(filters || {}),
      })
      .auth(req.headers.authorization);

    if (error) {
      console.error("Error adding search history:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to add search history",
      });
    }

    return res.json({
      success: true,
      id: data,
    });
  } catch (error) {
    console.error("Add search history API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// API endpoint to delete search history entry
app.delete("/api/search-history/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    // Call the RPC function to delete search history entry
    const { data, error } = await supabaseClient
      .rpc("delete_search_history_entry", {
        entry_id: id,
      })
      .auth(req.headers.authorization);

    if (error) {
      console.error("Error deleting search history entry:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete search history entry",
      });
    }

    return res.json({
      success: true,
      deleted: data,
    });
  } catch (error) {
    console.error("Delete search history API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// API endpoint to delete all search history for the current user
app.delete("/api/search-history", authMiddleware, async (req, res) => {
  try {
    // Call the RPC function to delete all search history
    const { error } = await supabaseClient
      .rpc("delete_all_search_history")
      .auth(req.headers.authorization);

    if (error) {
      console.error("Error deleting all search history:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete all search history",
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete all search history API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Record request start time
app.use((req, res, next) => {
  req._startTime = Date.now();
  next();
});

// Serve static files with caching
app.use(express.static(path.join(__dirname, "dist"), staticOptions));

// Make sure the auth callback route is handled by the front-end app
app.get(
  [
    "/login",
    "/signup",
    "/reset-password",
    "/auth/callback",
    "/dashboard",
    "/dashboard/:section",
    "/admin",
    "/admin/:section",
  ],
  (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  }
);

// Add client-side routing support for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Performance monitoring middleware
app.use((req, res, next) => {
  const responseTime = Date.now() - req._startTime;
  console.log(
    `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms`
  );

  // Log slow responses
  if (responseTime > 500) {
    console.warn(
      `Slow response: ${req.method} ${req.originalUrl} - ${responseTime}ms`
    );
  }

  next();
});

// Start the server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT} (0.0.0.0)`);

  // Apply migrations at startup
  await applyMigrations();
});
