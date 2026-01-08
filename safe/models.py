from django.db import models

# Create your models here.
from django.db import models
class student(models.Model):
    name = models.CharField(max_length=100)
    student_id =models.IntegerField(primary_key=True)
    email =models.EmailField(unique=True)
    score =models.FloatField()


def __str__(self) ->str:
    return self.name