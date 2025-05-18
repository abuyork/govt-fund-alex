# Project Analysis: government-saas

This document provides a detailed explanation of the `government-saas` codebase, outlining its architecture, key components, and how they interact.

## 1. Overview

The project is a web-based Software-as-a-Service (SaaS) platform, likely focused on providing information and tools related to government funding programs in Korea. It incorporates features such as user authentication, search functionalities for support programs, AI-powered business plan generation, subscription management, and payment processing.

**Core Technologies:**

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS
*   **Backend:** Node.js, Express.js
*   **Database & Auth:** Supabase (PostgreSQL, GoTrue for auth)
*   **External APIs:**
    *   Bizinfo (Korean government business support API)
    *   OpenAI API (for AI features)
    *   Toss Payments (for payment processing)
    *   Google, Kakao, Naver (for social authentication)

## 2. Project Structure

The workspace is organized as follows:

*   **`public/`**: Static assets served directly by the webserver.
*   **`src/`**: Frontend React/TypeScript application source code.
    *   `assets/`: Images, fonts, etc.
    *   `components/`: Reusable UI components (e.g., Header, Footer, Modals, Route Guards).
    *   `contexts/`: React Context API providers for global state management (Auth, Subscription, Government Support Data).
    *   `interfaces/`: TypeScript interface definitions (though `types/` is also used).
    *   `pages/`: Top-level components representing application views/routes (e.g., Landing, Dashboard, Admin, Login).
    *   `services/`: Modules for interacting with backend APIs, Supabase, and other external services.
    *   `types/`: TypeScript type definitions.
    *   `utils/`: Utility functions.
    *   `App.tsx`: Main application component, sets up routing and global providers.
    *   `main.tsx`: Application entry point, renders the React app.
    *   `index.css`: Global stylesheets.
*   **`server.js`**: Backend Express.js server application.
*   **`supabase/migrations/`**: SQL files for database schema migrations managed by the backend server at startup.
*   **Configuration Files:**
    *   `package.json`: Project metadata, dependencies, and npm scripts.
    *   `vite.config.ts`: Vite build and development server configuration (including proxies).
    *   `tailwind.config.js`, `postcss.config.js`: Tailwind CSS and PostCSS configuration.
    *   `tsconfig.json` (and variants): TypeScript compiler options.
    *   `.env`: Environment variables (not committed, but used by `dotenv`).
*   **Deployment & Scripts:**
    *   `deploy.sh`, `setup-ssl.sh`, `verify-ssl.sh`: Shell scripts for deployment and SSL certificate management.
    *   Various `.tar.gz` files: Likely deployment artifacts or backups.
*   **Documentation:**
    *   `README.md`: General project information.
    *   `ProjectInfo.md`: This document.
    *   `PERFORMANCE.md`, `ssl-changes-summary.md`, `ssl-setup-guide.md`: Specific documentation pieces.

## 3. Frontend Architecture (`src/`)

The frontend is a Single Page Application (SPA) built with React and TypeScript.

### 3.1. Initialization and Main Structure

*   **`main.tsx`**: Entry point. Renders the `<App />` component into the DOM.
*   **`App.tsx`**:
    *   Sets up client-side routing using `react-router-dom`.
    *   Wraps the application with global context providers:
        *   `AuthProvider`: Manages authentication state (user, session, loading) and provides auth functions (login, logout, signup, password reset) using Supabase.
        *   `SubscriptionProvider`: Manages user subscription plans, feature access control, and usage quotas. Fetches plan data from the Supabase `users` table.
        *   `GovSupportProvider`: Manages fetching, displaying, filtering, and bookmarking of government support programs. It also handles pagination and search history.
    *   Uses `react-hot-toast` for notifications.
    *   Lazy loads page components for performance.

### 3.2. Routing

*   Routes are defined in `App.tsx`.
*   Key pages include: `Landing`, `Pricing`, `Dashboard`, `Admin`, `SupportSearch`, `Login`, `Signup`, `ResetPassword`, `AuthCallback`, `PaymentSuccess`, `PaymentFail`, `PrivacyPolicy`, `TermsOfUse`.
*   **Protected Routes:**
    *   `ProtectedRoute`: Wraps routes like `/dashboard` requiring user authentication.
    *   `ProtectedAdminRoute`: Wraps `/admin` routes, requiring authenticated admin users. These components use `AuthContext` to check auth status and user roles/metadata.

### 3.3. State Management (Context API)

*   **`AuthContext.tsx` (`useAuth`)**:
    *   Integrates with `supabase.auth` for all authentication operations.
    *   Listens to `onAuthStateChange` to keep session and user state updated.
    *   Provides `session`, `user`, `loading` state and methods like `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`.
*   **`SubscriptionContext.tsx` (`useSubscription`)**:
    *   Determines the user's `currentPlan` (e.g., 'free', 'pro') by fetching `plan_type` from the Supabase `users` table.
    *   Manages `remainingUsage` for features like AI business plans and specialized templates.
    *   Provides `canUseFeature()` to check if a feature is available for the current plan.
    *   Note: The frontend plans ('free', 'pro') seem simpler than the backend-defined plans ('free', 'standard', 'premium'), suggesting a potential mapping or simplification.
*   **`GovSupportContext.tsx` (`useGovSupport`)**:
    *   Manages state for government support programs: `programs` (list), `isLoading`, `error`, `filters`, `page`, `pageSize`, `totalItems`.
    *   Handles searching via `searchSupportPrograms` service (which calls the backend proxy).
    *   Manages `bookmarkedIds` (loaded initially, possibly from local storage by `getBookmarkedProgramIds` in the service, and synced with backend via `toggleBookmarkApi`).
    *   Adds searches to history via `addSearchToHistory` service.

### 3.4. Components (`src/components/`)

A collection of reusable UI elements:

*   **Layout:** `Header.tsx`, `Footer.tsx`.
*   **Route Guards:** `ProtectedRoute.tsx`, `ProtectedAdminRoute.tsx`, `AdminProtectionWrapper.tsx`.
*   **Feature-Specific:** `BookmarkedPrograms.tsx`, `SearchModal.tsx`, `SearchResults.tsx`, `SocialLogin.tsx`.
*   **Grouped Components:**
    *   `account/`: User account management.
    *   `admin/`: Admin interface elements.
    *   `business-plan/`: AI business plan generation UI.
    *   `subscription/`: Subscription display and management.

### 3.5. Services (`src/services/`)

Modules abstracting backend communication and business logic:

*   **`supabase.ts`**: Initializes and exports the Supabase client.
*   **`api.ts`**: Likely configures a global Axios instance for HTTP requests to the Express backend.
*   **`authService.ts` (Implied, or integrated within `AuthContext`) / Social Auth Services:**
    *   `googleAuth.ts`, `kakaoAuth.ts`, `naverAuth.ts`: Handle OAuth flows with Supabase.
*   **`governmentSupportService.ts`**:
    *   `searchSupportPrograms()`: Fetches data from the backend proxy (Bizinfo API).
    *   `toggleBookmark()`, `getBookmarkedProgramIds()`: Manages program bookmarks.
*   **`paymentService.ts`**:
    *   Interacts with backend payment endpoints (`/api/payments/toss/*`, `/api/payments/process`).
    *   Fetches subscription plans (`/api/plans`).
    *   Manages subscription lifecycle calls (`/api/subscriptions/*`).
*   **`openai.ts`**: Communicates with the OpenAI API for AI features.
*   **`searchHistoryService.ts`**: Interacts with `/api/search-history` backend endpoints.
*   **`templateService.ts`**: Manages document templates (likely for DOCX/PDF generation using libraries like `docx`, `jspdf`). Has associated test files (`runTemplateTests.js`, `templateTest.js`).
*   **Notification Services:** `kakaoNotificationService.ts`, `userNotificationService.ts`.
*   **`statisticsService.ts`**: Fetches/processes data for admin statistics.

## 4. Backend Architecture (`server.js`)

The backend is built with Node.js and Express.js.

### 4.1. Server Setup

*   Uses `dotenv` for environment variables.
*   Initializes Supabase clients: one with service role key for admin tasks (migrations), and one with anon key for regular API interactions.
*   **Middleware:**
    *   `cors`: Configured for specific origins (Supabase, production domain, OAuth providers, Netlify).
    *   `compression`: Compresses responses.
    *   `helmet`: Adds security headers (CSP currently disabled, needs review).
    *   `express.json()`: Parses JSON request bodies.
    *   Custom middleware for request timing and performance logging.

### 4.2. Key Functionalities

*   **Database Migrations:**
    *   `applyMigrations()` function runs at startup.
    *   Reads `.sql` files from `supabase/migrations/` and executes them against the Supabase database using `supabase.rpc("exec_sql", { sql })`. This implies a custom Supabase function `exec_sql` is defined to execute arbitrary SQL.
*   **Authentication Middleware (`authMiddleware`)**:
    *   Extracts JWT from `Authorization` header.
    *   Verifies the token using `supabaseClient.auth.getUser(token)`.
    *   Attaches `req.user` if valid.
*   **API Proxy (`/api/bizinfo/proxy`)**:
    *   Proxies requests to `https://www.bizinfo.go.kr` using `http-proxy-middleware`.
    *   Injects `crtfcKey` (API key) from environment variables.
    *   Handles path rewriting.
    *   Includes error handling and attempts to convert HTML error responses from the API into JSON.
    *   Sets cache control headers for successful JSON responses.
*   **Toss Payments Integration:**
    *   `/api/payments/toss/request`: Creates a payment request with the Toss API (`/payments/key-in`).
    *   `/api/payments/toss/verify`: Verifies a payment with the Toss API (`/payments/:paymentKey`).
*   **Generic Payment & Subscription API (Partially Simulated):**
    *   `/api/payments/process`: Simulated payment processing.
    *   `/api/plans`: Returns predefined subscription plan details (Free, Standard, Premium).
    *   `/api/subscriptions/:userId` (GET): Simulated fetching of user subscription.
    *   `/api/subscriptions/:subscriptionId/cancel` (POST): Simulated subscription cancellation.
*   **Search History API (using Supabase RPC & `authMiddleware`):**
    *   `/api/search-history` (GET): Calls Supabase RPC `get_search_history` to fetch user's history.
    *   `/api/search-history` (POST): Calls Supabase RPC `add_search_history` to save a search.
    *   `/api/search-history/:id` (DELETE): Calls Supabase RPC `delete_search_history_entry`.
    *   `/api/search-history` (DELETE all): Calls Supabase RPC `delete_all_search_history`.
*   **Static File Serving:**
    *   Serves the built React app from the `dist/` directory using `express.static`.
    *   Includes a catch-all route `app.get("*", ...)` to serve `index.html` for client-side routing in the SPA.

## 5. Data Flow and Interaction

1.  **Initial Load:** User accesses the site -> Express serves `index.html` & React app assets -> React app initializes, contexts load (auth checks session).
2.  **Authentication:** User logs in/signs up -> `AuthContext` interacts with Supabase Auth -> Session established -> Protected routes become accessible.
3.  **Support Program Search:** User searches on frontend -> `GovSupportContext` calls `governmentSupportService` -> Service calls backend `/api/bizinfo/proxy` -> Backend proxies to Bizinfo API -> Results flow back to frontend. Bookmarks are managed client-side with potential backend sync. Search terms are saved via `/api/search-history`.
4.  **Subscription & Payment:** User views `/pricing` (plans from `/api/plans`) -> Selects plan -> `paymentService` calls `/api/payments/toss/request` -> User redirected to Toss -> Returns to `/payment/success|fail` -> Backend `/api/payments/toss/verify` confirms -> User's plan in Supabase `users` table is updated (mechanism not fully detailed but implied). `SubscriptionContext` reflects the new plan.
5.  **AI Feature (e.g., Business Plan):** User interacts with UI -> `openai.ts` service sends request to OpenAI API -> Results displayed. Access gated by `SubscriptionContext`.

## 6. External Services Integration

*   **Supabase:** Central for user authentication, database (users, plans, search history, etc.), and potentially other BaaS features. Database schema is managed via SQL migrations run by the backend.
*   **Bizinfo API:** Source of government support program data, accessed via a backend proxy for security and control.
*   **OpenAI API:** Powers AI-driven features like business plan generation.
*   **Toss Payments:** Handles real-money transactions.
*   **Social Providers (Google, Kakao, Naver):** Integrated with Supabase Auth for social login options.
*   **Kakao (Notifications):** Potentially used for sending notifications to users.

## 7. Deployment and Operations

*   The presence of `deploy.sh`, `setup-ssl.sh`, and various `.tar.gz` artifacts suggests a scripted, possibly manual, deployment process.
*   SSL configuration is a significant part of the setup.
*   The backend listens on `0.0.0.0`, making it accessible on all network interfaces of the server.

## 8. Potential Areas for Improvement / Further Investigation

*   **CSP in `server.js`:** The Content Security Policy in Helmet is currently disabled (`contentSecurityPolicy: false`). This should be configured properly for enhanced security.
*   **Error Handling:** Robustness of error handling across services and components.
*   **Plan Discrepancy:** Clarify the relationship between frontend plan types ('free', 'pro' in `SubscriptionContext`) and backend plan types ('free', 'standard', 'premium' in `/api/plans`). Ensure consistency or deliberate mapping.
*   **Bookmark Persistence:** Confirm if `governmentSupportService.toggleBookmarkApi` provides full backend persistence for bookmarks, as `getBookmarkedProgramIds` seems client-side.
*   **Database Schema:** Review SQL migration files in `supabase/migrations/` for a detailed understanding of the database structure.
*   **Admin Functionality:** Explore the components and services related to the `/admin` section for a complete picture of administrative capabilities.
*   **Template Engine:** Understand how `templateService.ts` and libraries like `docx`/`jspdf` are practically used for document generation.
*   **Testing:** While some test files for `templateService` exist, overall test coverage (unit, integration, e2e) is not clear from this analysis.

This analysis provides a foundational understanding of the `government-saas` project.
