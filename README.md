# SIPS Mobile Web

A Next.js-based web application for managing and tracking attendance, harvest records, and transportation data with dashboard analytics and real-time status monitoring.

## Project Overview

SIPS Mobile Web is a comprehensive attendance and operational management system built with modern web technologies. It provides:

- **Attendance Management**: Track daily attendance with multiple status categories (Hadir, Tepat Waktu, Telat, Pulang Awal, Alpha)
- **Harvest Tracking**: Monitor and manage harvest records with status filtering
- **Transportation Management**: Track pengangkutan (transportation) operations and metrics
- **Analytics Dashboard**: Real-time dashboards with charts, trends, and detailed analytics
- **User Authentication**: Secure login with role-based access control (Admin, Supervisor, Staff)
- **Dark/Light Theme**: Theme switching support for better user experience

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 14+ (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com)
- **UI Components**: React hooks, custom components
- **API Integration**: Server-side proxies with cookie-based authentication
- **Image Handling**: Next.js Image component with proxy support

## Project Structure

```
app/
├── (views)/              # Grouped routes using layout groups
│   ├── attendance/       # Attendance tracking page
│   ├── harvest/          # Harvest management page
│   ├── pengangkutan/     # Transportation management page
│   └── dashboard/        # Analytics dashboard
├── api/                  # API route handlers (server proxies)
│   ├── attendance/
│   ├── harvest/
│   ├── pengangkutan/
│   ├── auth/
│   └── ...
├── components/           # Reusable React components
│   ├── dashboard-chart.tsx   # Chart components (Pie, Bar, Line)
│   ├── drawer.tsx            # Navigation drawer
│   ├── navbar.tsx            # Top navigation
│   └── ...
├── hooks/                # Custom React hooks
│   ├── useTheme.ts       # Theme management
│   └── useThemeEffect.ts # Theme effect handler
├── utils/                # Utility functions
│   ├── authHelper.ts     # Authentication utilities
│   ├── datetime.ts       # Date/time helpers
│   ├── imageHelper.ts    # Image processing
│   ├── absensiProxy.ts   # Attendance proxy utilities
│   └── textManipulation.ts
└── layout.tsx, page.tsx, globals.css
```

## Getting Started

### Prerequisites

- Node.js 16+ or compatible runtime
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application will hot-reload as you make changes to files.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Linting & Code Quality

```bash
# Run ESLint to check code quality
npm run lint
```

## Key Features

### 1. Attendance Management

- Filter attendance records by date range, department, and status
- View attendance trends and statistics
- Mark attendance with multiple status types
- Real-time status updates

### 2. Harvest Tracking

- Log harvest records with images and details
- Filter by date, FCBA, and harvest status
- Track harvest output and metrics
- View harvest timeline and history

### 3. Transportation (Pengangkutan)

- Monitor transportation operations
- Track transportation records with image proof
- Filter by date and transportation number
- View JJG (total output) and metrics

### 4. Dashboard Analytics

- **Attendance Overview**: Daily, monthly, and yearly summaries
- **Status Breakdown**: Visual pie chart showing status distribution
- **Trend Analysis**: Line charts showing trends over time
- **Harvest & Transport Stats**: Real-time metrics and KPIs
- **Responsive Charts**: Interactive charts with DaisyUI components
- **Time-based Filtering**: Filter data by custom date range or predefined periods

### 5. Authentication & Security

- Login/Logout functionality with cookie-based sessions
- Role-based access (User Level, Department, Section)
- Force logout capability
- Change password functionality

### 6. Theme Support

- Dark/Light theme toggle
- Persistent theme preference
- DaisyUI theme integration

## API Endpoints

The application uses server-side proxies to communicate with the backend:

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `POST /api/auth/force-logout` - Force user logout
- `POST /api/change-password` - Change user password

### Data Operations

- `GET /api/attendance` - Fetch attendance records
- `GET /api/harvest` - Fetch harvest records
- `GET /api/pengangkutans` - Fetch transportation records
- `GET /api/karyawans` - Fetch employee list
- `GET /api/user/profile` - Get user profile

### Utilities

- `GET /api/image-proxy?url=...` - Proxy image requests

## Scoping & Authorization

The application uses cookie-based authorization with the following user scope fields:

- `user_Level`: User role/level (Supervisor, Staff, Admin)
- `user_Fcba`: Assigned FCBA/section identifier
- `user_Section`: Department or section assignment

All API calls automatically include these scope parameters from cookies.

## Configuration

### Environment Variables

Create a `.env.local` file in the project root (if needed):

```env
# Add any custom environment variables here
```

### Tailwind & DaisyUI

Tailwind CSS and DaisyUI are pre-configured in `tailwind.config.ts` and `postcss.config.mjs`.

## Deployment

### Vercel (Recommended)

```bash
# Push to Git repository
git push

# Deploy via Vercel Platform
# (see https://vercel.com/new)
```

### Docker

```bash
# Build Docker image
docker build -t sips-mobile-web .

# Run container
docker run -p 3000:3000 sips-mobile-web
```

### Other Platforms

See [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying) for detailed instructions.

## Development Tips

### Component Patterns

**Server Proxy Pattern** (app/api/\*/route.ts):

```typescript
// Fetch from upstream API with cookie-based auth
const response = await fetch(upstreamUrl, {
  headers: { Authorization: `Bearer ${authToken}` },
});
```

**Client Page Pattern** (app/(views)/\*/page.tsx):

```typescript
"use client";
// Use local /api/... endpoints to fetch data
// Data aggregation and state management on client
```

### Adding New Pages

1. Create a new folder under `app/(views)/`
2. Add `page.tsx` with `'use client'` directive
3. Create corresponding API proxy in `app/api/*/route.ts` if needed
4. Add navigation link in `app/components/drawer.tsx`
5. Import and use reusable components (navbar, footer, etc.)

### Adding New Charts

Use components from `app/components/dashboard-chart.tsx`:

- `SimplePieChart` - For composition/distribution
- `SimpleBarChart` - For comparisons
- `SimpleLineChart` - For trends over time

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Type Errors

```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### Theme Not Applying

- Ensure `ThemeProvider` wrapper is in layout
- Check DaisyUI theme configuration in `tailwind.config.ts`
- Clear browser cache and local storage

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run lint: `npm run lint`
4. Run build: `npm run build`
5. Commit and push: `git commit -m "..."` && `git push`
6. Create a Pull Request

## License

Proprietary - SIPS Project

## Support & Contact

For issues, questions, or feature requests, please contact the development team.

---

**Last Updated**: December 2025  
**Current Version**: 1.0.0
