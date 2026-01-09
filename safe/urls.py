from django.urls import path
from . import views

urlpatterns = [
    # ... other paths ...
    path('drills/simulation/', views.drill_simulation, name='drill_simulation'),
]
