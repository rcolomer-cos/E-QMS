# E-QMS Deployment Guide

## Prerequisites

- Node.js v18+ and npm v9+
- Microsoft SQL Server 2016+
- SSL certificates (for production)
- Reverse proxy (nginx or similar)

## Database Setup

1. **Create the database**
   ```sql
   CREATE DATABASE eqms;
   ```

2. **Create a dedicated user**
   ```sql
   CREATE LOGIN eqms_user WITH PASSWORD = 'StrongPassword123!';
   CREATE USER eqms_user FOR LOGIN eqms_user;
   USE eqms;
   GRANT SELECT, INSERT, UPDATE, DELETE TO eqms_user;
   ```

3. **Initialize tables**
   ```bash
   cd backend
   npm run build
   node dist/scripts/initDatabase.js
   ```

## Backend Deployment

1. **Environment Configuration**
   Create `.env` file with production values:
   ```
   NODE_ENV=production
   PORT=3000
   DB_SERVER=your-db-server
   DB_NAME=eqms
   DB_USER=eqms_user
   DB_PASSWORD=StrongPassword123!
   JWT_SECRET=your-super-secret-jwt-key-change-this
   FRONTEND_URL=https://your-domain.com
   ```

2. **Build the application**
   ```bash
   cd backend
   npm install --production
   npm run build
   ```

3. **Start with PM2 (recommended)**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name eqms-backend
   pm2 save
   pm2 startup
   ```

## Frontend Deployment

1. **Build for production**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Serve with nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /path/to/E-QMS/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## SSL Configuration

```bash
# Using Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs eqms-backend
   ```

2. **Database Health**
   - Monitor connection pool
   - Check query performance
   - Set up automated backups

## Backup Strategy

1. **Database Backups**
   ```sql
   BACKUP DATABASE eqms TO DISK = '/path/to/backup/eqms.bak';
   ```

2. **Automated Backup Script**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup-script.sh
   ```

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Implement logging and monitoring
- [ ] Set up intrusion detection

## Scaling

For high-traffic deployments:

1. **Load Balancing**: Use multiple backend instances behind a load balancer
2. **Database Replication**: Set up MSSQL replication for read replicas
3. **Caching**: Implement Redis for session storage and caching
4. **CDN**: Use CDN for frontend assets

## Troubleshooting

### Backend won't start
- Check database connection
- Verify environment variables
- Check port availability
- Review logs: `pm2 logs`

### Frontend build fails
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify dependencies

### Database connection issues
- Check firewall rules
- Verify SQL Server is running
- Test connection with SSMS
- Check user permissions

## Maintenance

### Regular Tasks
- Monitor disk space
- Review application logs
- Update dependencies
- Test backup restoration
- Review security logs
- Performance optimization

### Updates
```bash
# Backend
cd backend
npm update
npm run build
pm2 restart eqms-backend

# Frontend
cd frontend
npm update
npm run build
# Deploy new build
```
