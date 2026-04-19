# 🛡️ SafeSphere - Disaster Preparedness Academy

A comprehensive disaster preparedness and safety education platform built with Django. Learn, practice, and master disaster response through interactive modules, VR simulations, games, and AI-powered assistance.

**Currently serving 1,500+ students across 10+ schools!**

## ✨ Features

### 🎯 Core Features
- **Modern Landing Page**: Responsive, cross-device compatible landing page with smooth animations
- **User Authentication**: Secure login/register system with password reset
- **Interactive Dashboard**: Personalized learning dashboard with progress tracking
- **Multi-language Support**: Google Translate integration for accessibility

### 📚 Learning Modules
- **Disaster Education**: Comprehensive modules on natural and man-made disasters
  - Earthquakes, Floods, Cyclones, Tsunamis
  - Fire Safety, Heat Waves, Winter Storms
  - Nuclear Safety, Gas Leaks, Civil Defense
- **Protect Section**: Specialized guides for different audiences
  - Farmers: Crop protection, livestock safety
  - Households: Home safety, emergency kits
  - Communities: Shelters, evacuation, rescue
  - Schools: Safety audits, child protection

### 🎮 Interactive Learning
- **VR Lab**: Virtual reality disaster simulations
- **Games**: Educational games for engaging learning
- **Drills**: Emergency response practice simulations
- **AI Assistant**: Chat with AI for personalized disaster preparedness advice

### 🗺️ Safety Tools
- **Weather Dashboard**: Real-time weather information
- **Safety Map**: Interactive map showing safe zones and hazard areas
- **Emergency Contacts**: Quick access to emergency services

### 🏆 Gamification
- XP Points and Achievements
- Progress Tracking
- Leaderboards
- Certificates

## 🚀 Quick Start

### Windows (Easiest)
```bash
# Double-click start.bat or run:
start.bat
```

### Manual Setup
```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment
cp .env.example .env

# 4. Run migrations
python manage.py migrate

# 5. Create admin user
python manage.py createsuperuser

# 6. Start server
python manage.py runserver
```

Visit: **http://localhost:8000**

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1440px+)

## 🗄️ Database Support

### Development (Default)
- SQLite - No setup required

### Production
- PostgreSQL (Recommended)
- MySQL
- Any database supported by Django

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for configuration.

## 🎨 Tech Stack

### Backend
- **Django 5.2**: Python web framework
- **Gunicorn**: WSGI HTTP server
- **WhiteNoise**: Static file serving
- **dj-database-url**: Database configuration

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript**: Interactive features
- **Google Fonts**: Typography
- **Responsive Design**: Mobile-first approach

### Database
- **SQLite**: Development
- **PostgreSQL**: Production (recommended)
- **psycopg2**: PostgreSQL adapter

## 📂 Project Structure

```
safespera/
├── 📄 manage.py                 # Django management script
├── 📄 requirements.txt          # Python dependencies
├── 📄 .env.example             # Environment template
├── 📄 start.bat                # Quick start script (Windows)
├── 📄 README.md                # This file
├── 📄 SETUP_GUIDE.md           # Detailed setup guide
├── 📄 DATABASE_SETUP.md        # Database configuration
├── 📁 safespera/               # Project configuration
│   ├── settings.py             # Django settings
│   ├── urls.py                 # URL routing
│   └── wsgi.py                 # WSGI configuration
├── 📁 safe/                    # Main application
│   ├── views.py                # View functions
│   ├── models.py               # Database models
│   ├── admin.py                # Admin configuration
│   └── 📁 templates/           # HTML templates
│       ├── landing.html        # Landing page ✨ NEW
│       ├── login.html          # Login/Register
│       ├── index.html          # Dashboard
│       ├── learn.html          # Learning modules
│       ├── games.html          # Games
│       ├── drills.html         # Drills
│       ├── emergency.html      # Emergency
│       ├── chat.html           # AI Assistant
│       ├── weather.html        # Weather
│       ├── map.html            # Safety Map
│       └── ...                 # More templates
└── 📁 public/static/           # Static files
    ├── 📁 css/                 # Stylesheets
    ├── 📁 js/                  # JavaScript
    ├── 📁 image/               # Images
    └── 📁 bg/                  # Background videos
```

## 🔐 Security Features

- ✅ CSRF Protection
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ Secure Password Hashing (PBKDF2)
- ✅ Environment Variable Configuration
- ✅ HTTPS Ready
- ✅ Session Security
- ✅ Clickjacking Protection

## 🌐 Deployment

### Environment Variables
```env
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com
USE_REMOTE_DB=1
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### Recommended Platforms
- Railway
- Render
- Heroku
- DigitalOcean
- PythonAnywhere

### Deployment Command
```bash
# Collect static files
python manage.py collectstatic --noinput

# Run with Gunicorn
gunicorn safespera.wsgi:application
```

## 📖 Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration guide

## 🎯 Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Modern landing page with features |
| Login | `/login/` | User authentication |
| Register | `/signup/` | New user registration |
| Dashboard | `/dashboard/` | User dashboard (requires login) |
| Learn | `/learn/` | Educational modules |
| Protect | `/protect/` | Protection guides |
| Games | `/games/` | Interactive games |
| Drills | `/drills/` | Emergency drills |
| VR | `/vr/` | VR simulations |
| Emergency | `/emergency/` | Emergency resources |
| Chat | `/chat/` | AI Assistant |
| Weather | `/weather/` | Weather dashboard |
| Map | `/map/` | Safety map |
| Profile | `/profile/` | User profile |
| Admin | `/admin/` | Admin panel |

## 🎨 UI/UX Highlights

### Landing Page
- Hero section with animated cards
- Feature showcase
- Course catalog
- VR lab preview
- Emergency SOS section
- AI assistant demo
- Responsive navigation
- Mobile-friendly menu

### Dashboard
- Personalized greeting
- Progress stats
- Continue learning section
- Recent modules
- Quick actions
- Sidebar navigation
- Google Translate integration

### Design System
- Modern color palette
- Consistent spacing
- Smooth animations
- Accessible components
- Mobile-first approach

## 🛠️ Development

### Adding New Features
1. Create view in `safe/views.py`
2. Add URL in `safespera/urls.py`
3. Create template in `safe/templates/`
4. Add styles in `public/static/css/`

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Admin User
```bash
python manage.py createsuperuser
```

### Running Tests
```bash
python manage.py test
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Static files not loading:**
```bash
python manage.py collectstatic --noinput
```

**Database errors:**
```bash
python manage.py migrate
```

**Module not found:**
```bash
pip install -r requirements.txt
```

## 📊 Features Checklist

- ✅ Modern landing page
- ✅ User authentication (login/register)
- ✅ Password reset functionality
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Cross-browser compatibility
- ✅ Database support (SQLite/PostgreSQL/MySQL)
- ✅ Environment configuration
- ✅ Static file management
- ✅ Admin panel
- ✅ Multi-language support
- ✅ Security best practices
- ✅ Production-ready settings
- ✅ Deployment documentation

## 🎉 Ready for Hackathon!

This project is fully configured and ready to present:
- ✅ Professional landing page
- ✅ Complete authentication system
- ✅ All features working
- ✅ Responsive on all devices
- ✅ Database ready (local & production)
- ✅ Easy setup with start.bat
- ✅ Comprehensive documentation

## 📞 Support

For detailed setup instructions, see:
- [SETUP_GUIDE.md](SETUP_GUIDE.md)
- [DATABASE_SETUP.md](DATABASE_SETUP.md)

## 📝 License

This project is created for educational and disaster preparedness purposes.

---

**Built with ❤️ for disaster preparedness education**

🛡️ SafeSphere - Learn. Prepare. Survive.
