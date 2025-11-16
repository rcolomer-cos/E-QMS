# E-QMS Quick Start Guide

## Prerequisites
- Node.js v18+ and npm v9+
- Microsoft SQL Server 2016+
- Git

## Quick Setup (Development)

### 1. Clone and Install
```bash
git clone https://github.com/rcolomer-cos/E-QMS.git
cd E-QMS
npm install
```

### 2. Configure Database
1. Create a new database in SQL Server:
```sql
CREATE DATABASE eqms;
```

2. Copy the environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your database credentials:
```
DB_SERVER=localhost
DB_NAME=eqms
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_PORT=1433
JWT_SECRET=your-secret-key-change-this
```

### 3. Initialize Database
```bash
cd backend
npm install
npm run build
node dist/scripts/initDatabase.js
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will start on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on http://localhost:5173

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### 6. Create Your First Admin User

After initializing the database, create an admin user by running the provided SQL script:

```bash
# In SQL Server Management Studio (SSMS) or Azure Data Studio:
# Open and execute: backend/database/13_insert_admin_user.sql
```

**Default Admin Credentials:**
- Email: `admin@eqms.local`
- Password: `Admin@123`

⚠️ **Important:** Change the default password immediately after first login. The system will enforce this.

**Alternative (Manual Creation):**
If you prefer to create your own admin user with a custom password, you can use the SQL script as a template and modify the email and bcrypt-hashed password
  }'
```

### 7. Login

Use the credentials:
- **Username:** admin
- **Password:** Admin123!

## Available Features

Once logged in, you can access:

1. **Dashboard** - View KPIs and system overview
2. **Documents** - Manage quality documents
3. **Audits** - Schedule and track audits
4. **NCR** - Non-conformance reports
5. **CAPA** - Corrective and preventive actions
6. **Equipment** - Equipment management with QR codes
7. **Training** - Training session management

## API Endpoints

The API is available at `http://localhost:3000/api`

### Health Check
```bash
curl http://localhost:3000/health
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123!"}'
```

### List Documents (requires authentication)
```bash
curl http://localhost:3000/api/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues

### Database Connection Failed
- Check SQL Server is running
- Verify credentials in `.env`
- Check firewall allows connections on port 1433
- Ensure TCP/IP is enabled in SQL Server Configuration

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change `server.port` in `frontend/vite.config.ts`

### CORS Errors
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check CORS configuration in `backend/src/index.ts`

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with your web server
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
3. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical details

## Need Help?

- Check logs in console output
- Review error messages
- Consult the documentation files
- Check database connectivity

## Security Note

⚠️ **Important:** Change the default `JWT_SECRET` in production!

The example credentials and secrets in this guide are for development only. Always use strong, unique credentials in production environments.
