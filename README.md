# Government Support Program Search & AI Business Plan Generator

This application allows users to search for Korean government support programs, filter by region and support category, and bookmark programs of interest. It also provides AI-powered business plan generation to help businesses apply for government funding. The platform offers an intuitive interface for businesses and individuals to discover relevant government funding opportunities and create professional application documents.

![Government Support Program Search](https://via.placeholder.com/800x400?text=Government+Support+Program+Search)

## Features

- **Search Functionality**: Search by keyword to find relevant government support programs
- **Advanced Filtering**: Filter results by region (e.g., 서울, 부산, 인천) and support category (e.g., 자금, 기술, 창업)
- **Bookmark System**: Save interesting programs for later reference
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Data**: Synchronizes with the official Bizinfo API for up-to-date information
- **Pagination**: Navigate through large sets of search results efficiently
- **AI Business Plan Generation**: Create customized business plans for government funding applications
- **Multiple Templates**: Different templates for various business types (basic startup, early-stage, social enterprise, etc.)
- **Authentication**: Login via email, Google, Kakao, and Naver
- **User Dashboard**: Track saved programs and generated documents
- **Subscription Plans**: Premium features for paid users

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **State Management**: React Context API
- **Routing**: React Router
- **UI Components**: Custom components with Lucide React icons
- **API Integration**: REST API with fetch
- **Build Tool**: Vite
- **Server**: Express.js
- **Database**: Supabase
- **Authentication**: Supabase Auth, OAuth (Google, Kakao, Naver)
- **AI Integration**: OpenAI API
- **Deployment**: PM2, Nginx

## Setup

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- Bizinfo API key - [Get your API key here](https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi)
- Supabase account and project
- OpenAI API key
- OAuth credentials for Google, Kakao, and Naver (if using social login)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/govt-fund-ai.git
   cd govt-fund-ai
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables
   ```env
   # API Keys
   VITE_BIZINFO_API_KEY=your_bizinfo_api_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key
   
   # Supabase 
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OAuth (if using)
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_KAKAO_CLIENT_ID=your_kakao_client_id
   VITE_NAVER_CLIENT_ID=your_naver_client_id
   
   # Optional
   VITE_API_URL=http://localhost:3000/api
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173) to view the application

## Development Server and API

The project uses a dual-server approach:
- Vite development server for frontend hot reloading
- Express server for API endpoints and production serving

To run both together during development:
```bash
# Terminal 1 - Run Vite dev server
npm run dev

# Terminal 2 - Run Express API server
node server.js
```

## Production Deployment

### Building for Production

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

### Using PM2 for Production

```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the application with PM2
pm2 start ecosystem.config.js

# To view logs
pm2 logs

# To restart the application
pm2 restart govt-fund-ai
```

### SSL Setup

The project includes scripts for SSL setup:

```bash
# Set up SSL certificates
./setup-ssl.sh

# Verify SSL configuration
./verify-ssl.sh
```

For detailed SSL setup instructions, see `ssl-setup-guide.md`.

## Project Structure

```
govt-fund-ai/
├── public/                  # Static files
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── SearchModal.tsx  # Search dialog with filters
│   │   ├── SearchResults.tsx # Results display component
│   │   └── BookmarkedPrograms.tsx # Bookmarks display component
│   │   └── ... (other components)
│   ├── contexts/            # React context providers
│   │   ├── GovSupportContext.tsx # State management for search and bookmarks
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── pages/               # Application pages
│   │   ├── SupportSearch.tsx # Main search page component
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── Admin.tsx        # Admin panel
│   │   └── ... (other pages)
│   ├── services/            # API and external service integrations
│   │   ├── api.ts           # Base API configuration
│   │   ├── governmentSupportService.ts # Bizinfo API integration
│   │   ├── templateService.ts # Template service for business plans
│   │   ├── openai.ts        # OpenAI integration
│   │   ├── supabase.ts      # Supabase client setup
│   │   └── ... (other services)
│   │   └── templates/       # Business plan templates
│   │       ├── basicStartupTemplate.ts
│   │       ├── earlyStartupTemplate.ts
│   │       ├── socialEnterpriseTemplate.ts
│   │       └── startupSuccessTemplate.ts
│   ├── types/               # TypeScript types and interfaces
│   │   └── governmentSupport.ts # Types for government support data
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main application component with routing
│   └── main.tsx             # Application entry point
├── server.js                # Express server for API and production
├── deploy.sh                # Deployment script
├── setup-ssl.sh             # SSL setup script
├── ecosystem.config.js      # PM2 configuration
├── .env.example             # Example environment variables
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies and scripts
└── README.md                # Project documentation
```

## API Integration

### Bizinfo API

This application integrates with the [Bizinfo API](https://www.bizinfo.go.kr/web/lay1/program/S1T175C174/apiDetail.do?id=bizinfoApi) to fetch government support program data.

#### API Endpoints Used

- `https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do` - Main endpoint for retrieving support program information

#### Request Parameters

| Parameter | Description |
|-----------|-------------|
| crtfcKey | API authentication key |
| dataType | Response format (json or rss) |
| pageUnit | Number of items per page |
| pageIndex | Page number |
| searchKrwd | Keyword search term |
| searchLclasId | Support category ID (e.g., 01 for Financial, 06 for Startup) |
| hashtags | Region filters (e.g., 서울, 부산) |

### OpenAI Integration

The application uses OpenAI API for generating business plans:

- Endpoint: `api/generate-plan`
- Method: POST
- Body: `{template: string, companyInfo: object}`
- Response: Generated business plan text

## Authentication

The application uses Supabase Authentication with multiple providers:

- Email/Password
- Google OAuth
- Kakao OAuth
- Naver OAuth

Authentication flow is handled in `src/services/supabase.ts` and the auth-related components.

## Business Plan Templates

Four main templates are available:

1. **Basic Startup Template**: General purpose for most businesses
2. **Early Startup Template**: For pre-revenue or early-stage startups
3. **Social Enterprise Template**: For social impact businesses
4. **Startup Success Template**: For established startups seeking growth funding

Templates can be tested using the provided test scripts:
```bash
npm run test-templates     # Test all templates
npm run test-basic         # Test basic template
npm run test-early         # Test early-stage template
npm run test-social        # Test social enterprise template
npm run test-success       # Test success-focused template
```

## Database Structure

The Supabase database includes the following main tables:

- `users`: User account information
- `profiles`: Extended user profile information
- `bookmarks`: Saved government programs
- `documents`: Generated business plans and documents
- `subscriptions`: User subscription information
- `search_history`: User search history

## Common Issues and Troubleshooting

### API Connection Issues

If you're experiencing issues with the Bizinfo API:

1. Verify your API key is correct in the `.env` file
2. Check that the API endpoint is accessible from your location
3. Review server logs for more detailed error information
4. The API returns HTML instead of JSON if the key is invalid or expired

### OpenAI Integration

If OpenAI integration isn't working:

1. Check your API key and usage limits
2. Verify template prompt formatting in the template files
3. Check network requests for any error responses

## Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code follows the existing style and includes appropriate tests.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Acknowledgements

- [Bizinfo Korea](https://www.bizinfo.go.kr) for providing the API
- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/) 

## Kakao Notification Testing

The application includes scripts for testing Kakao notification delivery:

### Testing Kakao Notifications

Use the following commands to test Kakao notification functionality:

```bash
# Send a test notification to the default user
./scripts/send-kakao.sh

# Send a test notification to a specific user (by UUID)
./scripts/send-kakao.sh ff965fd2-2467-493c-a0d4-ea45afed6f98

# Direct testing with hardcoded values
npm run send-kakao-direct

# Testing with Supabase integration
npm run send-kakao -- ff965fd2-2467-493c-a0d4-ea45afed6f98
```

These scripts help verify that the Kakao notification system is working correctly. They send a test message to a user's KakaoTalk account if they have linked it with the platform.

The test notification scripts are located in the `scripts/` directory:
- `send-kakao.sh` - Main shell script wrapper
- `send-kakao-direct.js` - Direct approach with hardcoded values
- `send-kakao-complete.js` - Supabase integration approach
- `send-kakao-test.js` - Original testing script

### Requirements for Kakao Notification Testing

- User must have linked their KakaoTalk account
- User must have a valid Kakao token stored in `user_notification_settings` table
- Kakao token must not be expired 