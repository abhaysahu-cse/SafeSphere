from django.shortcuts import render,redirect
from django.http import HttpResponse
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.shortcuts import render
from django.http import JsonResponse
from django.shortcuts import render

# Create your views here.
# def index(request):
#     return render(request, "index.html")

def learn(request):
    return render(request, "learn.html")

def drills(request):
    return render(request, "drills.html")

def games(request):
    return render(request, "games.html")

def leaderboard(request):
    return render(request, "leaderboard.html")

def emergency(request):
    return render(request, "emergency.html")

def profile(request):
    return render(request, "profile.html")

def chat(request):

    return render(request, "chat.html")

def escape_room(request):
    return render(request, "games/escape_room.html")


def  Flood_Safety(request):
    return render(request, "games/Flood_SafetyG.html")

def  earth(request):
    return render(request, "games/earth.html")

def  fire_sefty_modules(request):
    return render(request, "learn/fire_sefty.html")

def  Earthquake_Safety(request):
    return render(request, "learn/Earthquake_Safety.html")


def  FireSafety(request):
    return render(request, "learn/Fire-Safety.html")

def  Cyclone_Safety(request):
    return render(request, "learn/Cyclone_Safety.html")



def  Firstaid (request):
    return render(request, "learn/Firstaid.html")

def Emergency_Communication(request):
    return render(request, "learn/emergency_com.html")

def WinterStorms_Safety(request):
    return render(request, "learn/winterstorm.html")

def HeatWave_Safety(request):
    return render (request, "learn/heatwave.html")

def Tornado_Safety(request):
    return render(request, "learn/tornado.html")

def landslide_Safety(request):
    return render(request, "learn/landslide_sefty.html")

def tsunami_safety(request):
    return render(request, "learn/tsunami_safety.html")



def chatbot(request):
    return render(request, 'chat.html')

def signup_view(request):
    if request.method == "POST":
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        # 1. Manually check if username exists
        if User.objects.filter(username=username).exists():
            return render(request, 'login.html', {
                'signup_error': 'Username already taken', 
                'is_signup': True
            })
        
        try:
            # 2. Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            # 3. Login and redirect
            login(request, user)
            return redirect('index')
        except IntegrityError:
            return render(request, 'login.html', {
                'signup_error': 'Database error. Try a different username.',
                'is_signup': True
            })
    
    # Agar GET request hai (pehli baar page khula), toh signup side dikhao
    return render(request, 'login.html', {'is_signup': False})




def login_view(request):
    if request.method == "POST":
        username = request.POST['username']
        password = request.POST['password']

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user:
            login(request, user)
            return redirect('index')
        else:
            return render(request, 'login.html', {'error': 'Invalid credentials' , 'is_signup': False})

    return render(request, 'login.html')

@login_required(login_url='login')
def index(request):
    return render(request, 'index.html')


def logout_view(request):
    logout(request)
    return redirect('login')


def password_reset_request(request):
    if request.method == "POST":
        username = request.POST.get('username')
        new_password = request.POST.get('new_password')
        try:
            user = User.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            return redirect('login')
        except User.DoesNotExist:
            return render(request, 'password_reset.html', {'error': 'User not found'})
    return render(request, 'password_reset.html')
def weather(request):
    return render(request, "weather.html")

def full_map(request):
    return render(request, "map.html")

def drills_simulation(request):
    return render(request, 'drills_simulation.html')
def drill_simulation(request):
    # render the simulation template
    return render(request, 'drills_simulation.html')

def flood_simulation(request):
    return render(request, 'drills_simulation.html')

def wildfire_simulation(request):
    return render(request, 'wildfire_simulation.html')

def cyclone_simulation(request):
    return render(request, 'cyclone_simulation.html')

def landslide_simulation(request):
    return render(request, 'landslide_simulation.html')

def vr_videos(request):
    return render(request, 'vr.html')


def Flood_SafetyL(request):
    return render(request, "learn/flood.html")

def Fire_Safety(request):
    return render(request, "learn/fire.html")

# def Cyclone_Safety(request):
#     return render(request, "learn/cyclone.html")

def Tsunami_Safety(request):
    return render(request, "learn/tsunami.html")

def Tornado_Safety(request):
    return render(request, "learn/tornado.html")

def HeatWave_Safety(request):
    return render(request, "learn/heatwave.html")


def air_pollution_safety(request):
    return render(request, "learn/air_pollution.html")

def FirstAid_Safety(request):
    return render(request, "learn/firstaid.html")
def WinterStorms_Safety(request):
    return render(request, "learn/winterstorm.html")

def war_civil_defence(request):
    return render(request, "learn/war_civil_defence.html")

def Gas_Leak_Safety(request):
    return render(request, "learn/gas_leak.html")

def major_transport_accident(request):
    return render(request, "learn/major_transport_accident.html")


def thunderstorm(request):
    return render(request, "learn/thunderstorm.html")

def dam_reservoir_failure(request):
    return render(request, "learn/dam_reservoir_failure.html")

def learn_nuclear(request):
    return render(request, "learn/nuclear.html")


# def ar_hub(request):
#     return render(request, "ar/index.html")



def protect_index(request):
    """
    Role selection page: Protect Home, Farm & Livelihood
    """
    return render(request, "protect/index.html")

def protect_farmers(request):
    return render(request, "protect/farmers.html")

def protect_households(request):
    return render(request, "protect/households.html")

def protect_community(request):
    return render(request, "protect/community.html")

def protect_schools(request):
    return render(request, "protect/schools.html")

# safe/views.py  -- add these functions near protect_* views
def farmers_index(request):
    # keeps a friendly index (if you already have protect_farmers pointing to same template skip this)
    return render(request, "protect/farmers.html")

def farmers_flood(request):
    return render(request, "protect/farmers/flood.html")

def farmers_cyclone(request):
    return render(request, "protect/farmers/cyclone.html")

def farmers_heatwave(request):
    return render(request, "protect/farmers/heatwave.html")

def farmers_drought(request):
    return render(request, "protect/farmers/drought.html")


# Modules


def households_flood(request):
    return render(request, 'protect/households/flood.html')

def households_cyclone(request):
    return render(request, 'protect/households/cyclone.html')

def households_heatwave(request):
    return render(request, 'protect/households/heatwave.html')

def households_fire(request):
    return render(request, 'protect/households/fire.html')

def households_earthquake(request):
    return render(request, 'protect/households/earthquake.html')

# ============================
# COMMUNITY MODULES
# ============================


def community_shelters(request):
    return render(request, 'protect/community/shelters.html')


def community_evacuation(request):
    return render(request, 'protect/community/evacuation.html')


def community_grain_banks(request):
    return render(request, 'protect/community/grain_banks.html')


def community_rescue(request):
    return render(request, 'protect/community/rescue.html')


def community_wash(request):
    return render(request, 'protect/community/wash.html')


def community_drills(request):
    return render(request, 'protect/community/drills.html')

# Individual module pages Schools
def schools_audit(request):
    return render(request, 'protect/schools/audit.html')

def schools_evacuation(request):
    return render(request, 'protect/schools/evacuation.html')

def schools_supplies(request):
    return render(request, 'protect/schools/supplies.html')

def schools_child_protection(request):
    return render(request, 'protect/schools/child_protection.html')

def schools_convert_shelter(request):
    return render(request, 'protect/schools/convert_shelter.html')

def schools_drills(request):
    return render(request, 'protect/schools/drills.html')

def zones_api(request):
    data = [
        {"lat": 23.27, "lng": 77.43, "level": "high", "msg": "Flood-prone area"},
        {"lat": 23.24, "lng": 77.39, "level": "medium", "msg": "Traffic congestion"},
        {"lat": 23.22, "lng": 77.41, "level": "safe", "msg": "Relief shelter"},
    ]
    return JsonResponse(data, safe=False)