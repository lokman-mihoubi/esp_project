from .models import Historique,Event

def log_action(user, action):
    historique = Historique.objects.create(user=user, action=action)
    return historique  # <-- return it
