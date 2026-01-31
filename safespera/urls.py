"""
URL configuration for safespera project.

This file is the single authoritative urls.py (no i18n_patterns).
All app routes are declared here (kept from previous version).
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Auth views
from django.contrib.auth import views as auth_views

# Application views
from safe import views

# For clarity: expose specific views if needed (optional)
# from safe.views import index, learn, drills, games, leaderboard, emergency, profile, chat, escape_room
# You can keep using views.<name> below.

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core pages
    path('', views.index, name='index'),
    path('learn/', views.learn, name='learn'),
    path('drills/', views.drills, name='drills'),
    path('games/', views.games, name='games'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    path('emergency/', views.emergency, name='emergency'),
    path('chat/', views.chat, name='chat'),
    path('profile/', views.profile, name='profile'),

    # Games & escape room
    path("games/escape-room/", views.escape_room, name="escape_room"),
    path("games/Flood_SafetyG", views.Flood_Safety, name="Flood_SafetyG"),
    path("games/earth", views.earth, name="earth"),

    # Learn modules
    path("learn/fire_sefty", views.fire_sefty_modules, name="fire_sefty_modules"),
    path("learn/Earthquake_Safety", views.Earthquake_Safety, name="Earthquake_Safety"),
    path("learn/Fire-Safety", views.FireSafety, name="FireSafety"),
    path("learn/Cyclone_Safety", views.Cyclone_Safety, name="Cyclone_Safety"),
    path("learn/Firstaid", views.Firstaid, name="Firstaid"),
    path('learn/flood/', views.Flood_SafetyL, name='flood'),
    path('learn/tsunami/', views.Tsunami_Safety, name='Tsunami_Safety'),
    path('learn/tornado/', views.Tornado_Safety, name='Tornado_Safety'),
    path('learn/heatwave/', views.HeatWave_Safety, name='HeatWave_Safety'),
    path('learn/firstaid/', views.FirstAid_Safety, name='FirstAid_Safety'),
    path('learn/winterstorm/', views.WinterStorms_Safety, name='WinterStorms_Safety'),
    path('learn/emergency_com/', views.Emergency_Communication, name='emergency_com'),
    # Drills & simulations
    path('drills/simulation/', views.drills_simulation, name='drills_simulation'),
    path('drills/simulation/', views.drill_simulation, name='drill_simulation'),  # note: duplicate path in original - keeps both names on same path
    path('drills/flood/', views.flood_simulation, name='flood_simulation'),
    path('drills/wildfire/', views.wildfire_simulation, name='wildfire_simulation'),
    path('drills/cyclone/', views.cyclone_simulation, name='cyclone_simulation'),
    path('drills/landslide/', views.landslide_simulation, name='landslide_simulation'),
    
    # VR & Map
    path('vr/', views.vr_videos, name='vr_videos'),
    path('map/', views.full_map, name='map'),

    # Weather & APIs
    path("weather/", views.weather, name="weather"),
    path("api/zones/", views.zones_api, name="zones_api"),

    # Auth
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Password reset flow
    path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),

    # # AR hub (marker & markerless)
    # path('ar/', views.ar_hub, name='ar_hub'),

    # Protect Home, Farm & Livelihood
    path('protect/', views.protect_index, name='protect'),
    path('protect/farmers/', views.protect_farmers, name='protect_farmers'),
    path('protect/households/', views.protect_households, name='protect_households'),
    path('protect/community/', views.protect_community, name='protect_community'),
    path('protect/schools/', views.protect_schools, name='protect_schools'),
    
]

# Serve static files during development only
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
