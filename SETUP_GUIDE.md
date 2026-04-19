# SafeSphere - Complete Setup Guide

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Step 1: Clone and Navigate
```bash
cd safespera-old/safespera
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (default settings work for local development)
```

### Step 5: Database Setup
```bash
# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

### Step 6: Run Development Server
```bash
python manage.py runserver
```

Visit: http://localhost:8000

## 📱 Features

### Landing Page
- Modern, responsive design
- Cross-device compatible
- Direct links to login/register

### Dashboard
- User authentication required
- Personalized learning experience
- Progress tracking

### Key Sections
- **Learn**: Educational modules on disaster preparedness
- **Protect**: Home, Farm & Livelihood protection guides
- **Games**: Interactive learning games
- **Drills**: Emergency simulation drills
- **VR Lab**: Virtual reality training
- **Emergency**: Quick access to emergency resources
- **AI Assistant**: Chat with AI for disaster preparedness advice
- **Weather**: Real-time weather information
- **Safety Map**: Interactive safety zone mapping

## 🗄️ Database Configuration

### Local Development (Default - SQLite)
No additional setup required! The project uses SQLite by default.

### Production Database (PostgreSQL/MySQL)
See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

Quick setup:
1. Install PostgreSQL or MySQL
2. Create database and user
3. Update `.env`:
   ```env
   USE_REMOTE_DB=1
   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
   ```
4. Run migrations: `python manage.py migrate`

## 🌐 Deployment

### Environment Variables for Production
```env
DJANGO_SECRET_KEY=your-production-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
USE_REMOTE_DB=1
DATABASE_URL=your-production-database-url
```

### Static Files
```bash
python manage.py collectstatic --noinput
```

### WSGI Server (Gunicorn)
```bash
gunicorn safespera.wsgi:application --bind 0.0.0.0:8000
```

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop enhancement
- Cross-browser compatibility

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode

### Performance
- Lazy loading
- Image optimization
- Minified assets
- CDN-ready

## 🔐 Security

### Best Practices Implemented
- CSRF protection
- SQL injection prevention
- XSS protection
- Secure password hashing
- Environment variable configuration
- HTTPS ready

### Security Checklist for Production
- [ ] Change SECRET_KEY
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Use HTTPS
- [ ] Enable database SSL
- [ ] Set up firewall rules
- [ ] Regular security updates

## 📂 Project Structure
```
safespera/
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
├── db.sqlite3 (local only)
├── safespera/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── safe/
│   ├── views.py
│   ├── models.py
│   ├── templates/
│   │   ├── landing.html (NEW)
│   │   ├── login.html
│   │   ├── index.html
│   │   └── ...
│   └── ...
└── public/
    └── static/
        ├── css/
        ├── js/
        ├── image/
        └── bg/
```

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### Static Files Not Loading
```bash
python manage.py collectstatic --noinput
```

### Database Errors
```bash
# Reset database (WARNING: Deletes all data)
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Module Not Found
```bash
pip install -r requirements.txt
```

## 📞 Support

For issues or questions:
1. Check this guide
2. Review [DATABASE_SETUP.md](DATABASE_SETUP.md)
3. Check Django documentation
4. Review error logs

## 🎯 Next Steps After Setup

1. **Admin Panel**: Visit http://localhost:8000/admin
2. **Landing Page**: Visit http://localhost:8000
3. **Create Account**: Click "Start Learning" or "Sign In"
4. **Explore Dashboard**: Access all features after login
5. **Customize Content**: Add your own modules via admin panel

## 📝 Development Notes

### Adding New Features
1. Create views in `safe/views.py`
2. Add URLs in `safespera/urls.py`
3. Create templates in `safe/templates/`
4. Add static files in `public/static/`

### Database Changes
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Superuser
```bash
python manage.py createsuperuser
```

## 🚀 Production Deployment Platforms

### Recommended Platforms
- **Railway**: Easy deployment, free tier available
- **Render**: Simple setup, PostgreSQL included
- **Heroku**: Classic platform, good documentation
- **PythonAnywhere**: Python-focused hosting
- **DigitalOcean**: Full control, App Platform available

### Deployment Checklist
- [ ] Set all environment variables
- [ ] Configure production database
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Run collectstatic
- [ ] Set up domain/SSL
- [ ] Test all features
- [ ] Monitor logs

---

**Ready to present at your hackathon! 🎉**
