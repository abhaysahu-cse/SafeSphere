# Database Setup Guide

## Local Development (SQLite - Default)

By default, the project uses SQLite for local development. No additional setup required!

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Production Database (PostgreSQL/MySQL)

### Step 1: Install Database

**PostgreSQL (Recommended):**
```bash
# Windows (using Chocolatey)
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

**MySQL (Alternative):**
```bash
# Windows (using Chocolatey)
choco install mysql

# Or download from: https://dev.mysql.com/downloads/installer/
```

### Step 2: Create Database

**PostgreSQL:**
```sql
CREATE DATABASE safesphere_db;
CREATE USER safesphere_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE safesphere_db TO safesphere_user;
```

**MySQL:**
```sql
CREATE DATABASE safesphere_db;
CREATE USER 'safesphere_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON safesphere_db.* TO 'safesphere_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 3: Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
USE_REMOTE_DB=1
DATABASE_URL=postgresql://safesphere_user:your_password@localhost:5432/safesphere_db
```

For MySQL:
```env
DATABASE_URL=mysql://safesphere_user:your_password@localhost:3306/safesphere_db
```

### Step 4: Run Migrations

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Cloud Database (Heroku, Railway, Render, etc.)

Most cloud platforms provide a `DATABASE_URL` environment variable automatically.

1. Set `USE_REMOTE_DB=1` in your platform's environment variables
2. The `DATABASE_URL` is usually auto-configured
3. Run migrations: `python manage.py migrate`

## Switching Between Databases

**To use SQLite (local dev):**
```env
USE_REMOTE_DB=0
```

**To use PostgreSQL/MySQL:**
```env
USE_REMOTE_DB=1
DATABASE_URL=your_database_url_here
```

## Troubleshooting

### Connection Refused
- Check if database server is running
- Verify host, port, username, and password
- Check firewall settings

### Authentication Failed
- Verify username and password in DATABASE_URL
- Check database user permissions

### Database Does Not Exist
- Create the database first using SQL commands above
- Ensure database name matches in DATABASE_URL

## Security Notes

- Never commit `.env` file to version control
- Use strong passwords for production
- Restrict database access to application server only
- Enable SSL for production database connections
