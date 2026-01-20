"""
URL configuration for safespera project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from safe import views
from django.urls import path, include
from safe import views as safe_views

from safe.views import index, learn, drills, games, leaderboard, emergency, profile, chat,escape_room,Flood_Safety,earth ,fire_sefty_modules ,Earthquake_Safety ,FireSafety ,Cyclone_Safety ,Firstaid, signup_view, login_view, logout_view
from django.contrib.auth import views as auth_views
from safe import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('learn/', learn, name='learn'),
    path('drills/', drills, name='drills'),
    path('games/', games, name='games'),
    path('leaderboard/', leaderboard, name='leaderboard'),
    path('emergency/', emergency, name='emergency'),
    path('chat/', chat, name='chat'),
    path('profile/', views.profile, name='profile'),
    path("games/escape-room/", escape_room, name="escape_room"),
    # path('games/', games, name='games'),
    path("games/Flood_SafetyG", Flood_Safety, name="Flood_SafetyG"),
    path("games/earth", earth, name="earth"),
    path("learn/fire_sefty", fire_sefty_modules, name="fire_sefty_modules"),
    path("learn/Earthquake_Safety", Earthquake_Safety, name="Earthquake_Safety"),
    path("learn/Fire-Safety", FireSafety, name="FireSafety"),
    path("learn/Cyclone_Safety", Cyclone_Safety, name="Cyclone_Safety"),
    path("learn/Firstaid", Firstaid, name="Firstaid"),
    path('signup/', signup_view, name='signup'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('password_reset/', auth_views.PasswordResetView.as_view(), name='password_reset'),
    path('password_reset/done/', auth_views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    path("weather/", views.weather, name="weather"),
    path('map/', views.full_map, name='map'),
    path('reset/done/', auth_views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
      # ... existing routes ...
    path('drills/simulation/', views.drills_simulation, name='drills_simulation'),
 

    path("api/zones/", views.zones_api, name="zones_api"),
    path('drills/simulation/', views.drill_simulation, name='drill_simulation'),
    path('drills/flood/', views.flood_simulation, name='flood_simulation'),
    path('drills/wildfire/', views.wildfire_simulation, name='wildfire_simulation'),
    path('drills/cyclone/', views.cyclone_simulation, name='cyclone_simulation'),
    path('vr/', views.vr_videos, name='vr_videos'),
    path('drills/landslide/', views.landslide_simulation, name='landslide_simulation'),
    
    path('learn/flood/', views.Flood_SafetyL, name='flood'),
    
   
   
    path('learn/Cyclone_Safety/', views.Cyclone_Safety, name='Cyclone_Safety'),
    path('learn/tsunami/', views.Tsunami_Safety, name='Tsunami_Safety'),
    path('learn/tornado/', views.Tornado_Safety, name='Tornado_Safety'),
    path('learn/heatwave/', views.HeatWave_Safety, name='HeatWave_Safety'),
    path('learn/firstaid/', views.FirstAid_Safety, name='FirstAid_Safety'),
     path(
        'learn/winterstorm/',
        views.WinterStorms_Safety,
        name='WinterStorms_Safety'
    ),

]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
