# Database Migrations

This directory contains database migration scripts for incremental schema changes.

## Migration Naming Convention

Migrations should be named using the following pattern:
```
{number}_{description}.sql
```

Example: `001_add_phone_to_users.sql`

## Running Migrations

Migrations should be run in sequential order. Each migration should be idempotent (can be run multiple times safely).

### Using SQL Server Management Studio (SSMS)

1. Connect to your EQMS database
2. Open the migration script
3. Execute the script

### Using sqlcmd

```bash
sqlcmd -S your_server -d EQMS -i 001_add_phone_to_users.sql
```

## Migration List

| Number | Description | Date | Status |
|--------|-------------|------|--------|
| 001 | Add phone field to Users table | 2025-11-19 | ✓ Ready |

## Best Practices

1. Always check if the change already exists before applying
2. Include rollback scripts when possible
3. Test migrations on a development database first
4. Document the purpose of each migration
5. Keep migrations small and focused on a single change
