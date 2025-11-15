# E-QMS - Quality Management System

ISO 9001:2015 compliant Quality Management System built with TypeScript, Node.js, React, and MSSQL.

## Features

### Core Modules
- **Document Management**: Version control, approval workflows, document lifecycle management
- **Audit Management**: Internal/external audit planning, execution, and reporting
- **NCR (Non-Conformance Reports)**: Track and manage non-conformances with severity levels
- **CAPA (Corrective and Preventive Actions)**: Manage corrective and preventive actions
- **Equipment Management**: Equipment tracking with QR code access, calibration scheduling
- **Training Management**: Employee training tracking, certification management
- **Risk Management**: Risk assessment and mitigation strategies
- **Supplier Quality**: Supplier evaluation and quality monitoring
- **KPI Dashboards**: Real-time quality metrics and performance indicators

### Security & Access Control
- JWT-based authentication
- Role-based access control (Admin, Manager, Auditor, User, Viewer)
- Secure API endpoints with input validation
- Password hashing with bcrypt

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Microsoft SQL Server (MSSQL)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcrypt
- **Validation**: express-validator
- **QR Codes**: qrcode library

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Data Fetching**: Axios, TanStack Query
- **Charts**: Recharts
- **QR Scanning**: react-qr-scanner

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Microsoft SQL Server (2016 or higher)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rcolomer-cos/E-QMS.git
   cd E-QMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database connection:
   ```
   DB_SERVER=localhost
   DB_NAME=eqms
   DB_USER=sa
   DB_PASSWORD=YourStrongPassword123
   DB_PORT=1433
   JWT_SECRET=your-secret-key-change-in-production
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npm run build
   node dist/scripts/initDatabase.js
   ```

5. **Start the development servers**
   
   In one terminal (backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   In another terminal (frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Health Check: http://localhost:3000/health

## Project Structure

```
E-QMS/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── scripts/         # Utility scripts
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helper functions
│   │   └── index.ts         # Application entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── styles/          # CSS files
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main App component
│   │   └── main.tsx         # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile (authenticated)

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document (authenticated)
- `GET /api/documents/:id` - Get document by ID
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document (admin only)
- `POST /api/documents/:id/version` - Create new version

### Audits
- `GET /api/audits` - List audits
- `POST /api/audits` - Create audit (admin/manager/auditor)
- `GET /api/audits/:id` - Get audit by ID
- `PUT /api/audits/:id` - Update audit
- `DELETE /api/audits/:id` - Delete audit (admin only)

### Equipment
- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Create equipment (admin/manager)
- `GET /api/equipment/:id` - Get equipment by ID
- `GET /api/equipment/qr/:qrCode` - Get equipment by QR code
- `GET /api/equipment/calibration-due` - List calibration due equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment (admin only)

## User Roles

- **Admin**: Full system access, user management
- **Manager**: Manage quality processes, approve documents
- **Auditor**: Conduct audits, create NCRs
- **User**: Create and edit documents, view reports
- **Viewer**: Read-only access to system

## Database Schema

The system uses the following main tables:
- **Users**: User accounts and authentication
- **Documents**: Document management with version control
- **Audits**: Audit records and findings
- **NCRs**: Non-conformance reports
- **CAPAs**: Corrective and preventive actions
- **Equipment**: Equipment tracking and calibration
- **Trainings**: Training sessions
- **TrainingAttendees**: Training attendance records

## Development

### Backend Development
```bash
cd backend
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm test          # Run tests
```

### Frontend Development
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Production Deployment

1. **Build the applications**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   ```

3. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

4. **Serve the frontend** (using a static file server like nginx or serve)
   ```bash
   cd frontend
   npx serve -s dist
   ```

## Security Considerations

- Change default JWT secret in production
- Use strong passwords for database access
- Enable SSL/TLS for database connections
- Implement rate limiting for API endpoints
- Regular security audits and updates
- Implement backup and disaster recovery procedures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.
