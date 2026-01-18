from django.contrib import admin
from . models import Foncier,Profile,Task,Message,Document,Comment

# Register your models here.
admin.site.register(Foncier)
admin.site.register(Profile)
admin.site.register(Task)
admin.site.register(Message)
admin.site.register(Document)
admin.site.register(Comment)



