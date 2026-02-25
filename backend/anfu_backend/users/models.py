from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

User = settings.AUTH_USER_MODEL
# models.py
from django.contrib.auth.models import User
from django.db import models
from django.contrib.postgres.fields import ArrayField

class Profile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('utilisateur', 'Utilisateur'),
        ('ministere', 'Ministère'),     
        ('anfu', 'Anfu'),                  # ✅ NEW
        ('dgl', 'DGL'),                  # ✅ NEW
        ('dgua', 'Dgua'),                  # ✅ NEW
        ('dgv', 'DGV'),                  # ✅ NEW
        ('dgaat', 'DGAAT'),
        ('dgcmr', 'DGCMR'),                  # ✅ NEW
                         
    )

    REGION_CHOICES = (
    ('DRC', 'Centre'),
    ('DRE', 'Est'),
    ('DRO', 'Ouest'),
    ('DRSE', 'Sud-Est'),
    ('DRSO', 'Sud-Ouest'),
    ('DRGS', 'Grand Sud'),
    ('DG', 'Direction Générale'),
)


    ABRV_CHOICES = (
        ('DG', 'DG'),
        ('DGA', 'DGA'),
        ('DAF', 'DAF'),
        ('DFC', 'DFC'),
        ('DRHM', 'DRHM'),
        ('SRH', 'SRH'),
        ('SCPT', 'SCPT'),
        ('SMGX', 'SMGX'),
        ('SINF', 'SINF'),
        ('DP', 'DP'),
        ('DP-PROSP', 'DP-PROSP'),
        ('DP-MOB', 'DP-MOB'),
        ('SPROSP', 'SPROSP'),
        ('SSIG', 'SSIG'),
        ('SJUR', 'SJUR'),
        ('SPFON', 'SPFON'),
        ('DGF', 'DGF'),
        ('DGF-MO', 'DGF-MO'),
        ('DFUR', 'DFUR'),
        ('DGF-PF', 'DGF-PF'),
        ('SEREA', 'SEREA'),
        ('SMAR', 'SMAR'),
        ('SCOM', 'SCOM'),
        ('SINV', 'SINV'),
        ('DRC', 'DRC'),
        ('DRO', 'DRO'),
        ('DRE', 'DRE'),
        ('DRGS', 'DRGS'),
        ('DRSO', 'DRSO'),
        ('DRSE', 'DRSE'),
        ('DPC', 'DPC'),
        ('SPROSPC', 'SPROSPC'),
        ('SSIGC', 'SSIGC'),
        ('DPMC', 'DPMC'),
        ('SJURC', 'SJURC'),
        ('SPFONC', 'SPFONC'),
        ('DMOC', 'DMOC'),
        ('SEREAC', 'SEREAC'),
        ('SMARC', 'SMARC'),
        ('DPO', 'DPO'),
        ('SPROSPO', 'SPROSPO'),
        ('SSIGO', 'SSIGO'),
        ('DPMO', 'DPMO'),
        ('SJURO', 'SJURO'),
        ('SPFONO', 'SPFONO'),
        ('DMOO', 'DMOO'),
        ('SEREAO', 'SEREAO'),
        ('SMARO', 'SMARO'),
        ('DPE', 'DPE'),
        ('SPROSPE', 'SPROSPE'),
        ('SSIGE', 'SSIGE'),
        ('DPME', 'DPME'),
        ('SJURE', 'SJURE'),
        ('SPFONE', 'SPFONE'),
        ('DMOE', 'DMOE'),
        ('SEREAAE', 'SEREAAE'),
        ('SMARE', 'SMARE'),
        ('DPGS', 'DPGS'),
        ('SPROSPGS', 'SPROSPGS'),
        ('SSIGGS', 'SSIGGS'),
        ('DPMGS', 'DPMGS'),
        ('SJURGS', 'SJURGS'),
        ('SPFONGS', 'SPFONGS'),
        ('DMOGS', 'DMOGS'),
        ('SEREAGS', 'SEREAGS'),
        ('SMARGS', 'SMARGS'),
        ('DPSO', 'DPSO'),
        ('SPROSPSO', 'SPROSPSO'),
        ('SSIGSO', 'SSIGSO'),
        ('DPMSO', 'DPMSO'),
        ('SJURSO', 'SJURSO'),
        ('SPFONSO', 'SPFONSO'),
        ('DMOSO', 'DMOSO'),
        ('SEREASO', 'SEREASO'),
        ('SMARSO', 'SMARSO'),
        ('DPSE', 'DPSE'),
        ('SPROSPSE', 'SPROSPSE'),
        ('SSIGSE', 'SSIGSE'),
        ('DPMSE', 'DPMSE'),
        ('SJURSE', 'SJURSE'),
        ('SPFONSE', 'SPFONSE'),
        ('DMOSE', 'DMOSE'),
        ('SEREAE', 'SEREAE'),
        ('SMARSE', 'SMARSE'),
        ('SF', 'SF'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='utilisateur')
    region = models.CharField(max_length=20, choices=REGION_CHOICES, default='centre')

    # ✅ NEW FIELD
    abrv_str = models.CharField(
        max_length=20,
        choices=ABRV_CHOICES,
        null=True,
        blank=True
    )

    can_view = models.BooleanField(default=False)
    can_write = models.BooleanField(default=False)
    can_see_historique = models.BooleanField(default=False)

# models.py
class Usage(models.Model):
    parent_type = models.CharField(max_length=50)  # promotion/investissement
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.parent_type} - {self.name}"

class Foncier(models.Model):
    TYPE_CHOICES = [
        ('promotion', 'Promotion immobilière'),
        ('investissement', 'Investissement'),
        ('logement', 'Logements & équipements'),
        ('favoris', 'Favoris'),
    ]

    WILAYA_CHOICES = [
        
        ('01', 'Adrar'), ('02', 'Chlef'), ('03', 'Laghouat'), ('04', 'Oum El Bouaghi'),
        ('05', 'Batna'), ('06', 'Béjaïa'), ('07', 'Biskra'), ('08', 'Béchar'),
        ('09', 'Blida'), ('10', 'Bouira'), ('11', 'Tamanrasset'), ('12', 'Tébessa'),
        ('13', 'Tlemcen'), ('14', 'Tiaret'), ('15', 'Tizi Ouzou'), ('16', 'Alger'),
        ('17', 'Djelfa'), ('18', 'Jijel'), ('19', 'Sétif'), ('20', 'Saïda'),
        ('21', 'Skikda'), ('22', 'Sidi Bel Abbès'), ('23', 'Annaba'), ('24', 'Guelma'),
        ('25', 'Constantine'), ('26', 'Médéa'), ('27', 'Mostaganem'), ('28', 'M’Sila'),
        ('29', 'Mascara'), ('30', 'Ouargla'), ('31', 'Oran'), ('32', 'El Bayadh'),
        ('33', 'Illizi'), ('34', 'Bordj Bou Arreridj'), ('35', 'Boumerdès'), ('36', 'El Tarf'),
        ('37', 'Tindouf'), ('38', 'Tissemsilt'), ('39', 'El Oued'), ('40', 'Khenchela'),
        ('41', 'Souk Ahras'), ('42', 'Tipaza'), ('43', 'Mila'), ('44', 'Aïn Defla'),
        ('45', 'Naama'), ('46', 'Aïn Témouchent'), ('47', 'Ghardaïa'), ('48', 'Relizane'),
        ('49', 'Timimoun'), ('50', 'Bordj Badji Mokhtar'), ('51', 'Ouled Djellal'),
        ('52', 'Béni Abbès'), ('53', 'In Salah'), ('54', 'In Guezzam'), ('55', 'Touggourt'),
        ('56', 'Djanet'), ('57', 'El M’Ghair'), ('58', 'El Menia'),
    ]
    TYPE1_CHOICES = [
        ('lgmts', 'Logements'),
        ('equip', 'Equipements'),
        ('aapi', 'AAPI'),
        ('promotion', 'Promotion'),
        ('investissement', 'Investissement'),  # ✅ Added as you requested
        ('autre', 'Autre'),  # Optional
    ]

    REGION_CHOICES = [
        ('DRC', 'Direction Régionale Centre'),
        ('DRE', 'Direction Régionale Est'),
        ('DRO', 'Direction Régionale Ouest'),
        ('DRGS', 'Direction Régionale Sud'),
        ('DRSE', 'Direction Régionale Sud-Est'),
        ('DRSO', 'Direction Régionale Sud-Ouest'),
        ('DG', 'Direction Générale'),
    ]
    MODE_CHOICES = [
        ('lecture', 'Lecture seule'),
        ('ecriture', 'Lecture & écriture'),
    ]

    code = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Exemple: ALG0001_25")
    commune = models.CharField(max_length=50, blank=True, null=True, help_text="Code de la commune (ex: 1001)")
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField(blank=True)
    coordinates = models.CharField(max_length=100, blank=True)
    coordinates_dms = models.CharField(max_length=100, blank=True)
    geojson_file = models.FileField(upload_to='geojson/', blank=True, null=True)
    wilaya = models.CharField(max_length=50, choices=WILAYA_CHOICES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    usage = models.ForeignKey(Usage,on_delete=models.SET_NULL,null=True,blank=True)

    # ✅ New field here
    progress_viabilisation = models.IntegerField(blank=True, null=True,
        help_text="Pourcentage de viabilisation (0-100%)")
    progress_status = models.CharField(
        max_length=20,
        choices=[
            ("EN_COURS", "En cours"),
            ("TERMINE", "Terminé"),
        ],
        blank=True,
        null=True
    )
    mode = models.CharField(
        max_length=10,
        choices=MODE_CHOICES,
        default='lecture',
        help_text="Mode d'accès au foncier (lecture / écriture)"
    )
    # ✅ NEW FIELDS
    surface = models.DecimalField(max_digits=20, decimal_places=10, blank=True, null=True,
                                  help_text="Surface en m²")

    is_transmis = models.BooleanField(default=False, help_text="Foncier transmis ?")
    date_transmission = models.DateField(blank=True, null=True, help_text="Date de transmission")

    is_completed = models.BooleanField(default=False, help_text="Foncier complété ?")    
    is_published = models.BooleanField(default=False, help_text="Foncier publié ?")
    is_favorited = models.BooleanField(default=False, help_text="Foncier favorited ?")
    POS = models.CharField(max_length=50, blank=True, null=True, help_text="POS")
    Ref_Cadastre_Section = models.CharField(max_length=50, blank=True, null=True, help_text="Référence section cadastrale")
    Ref_Cadastre_Ilot = models.CharField(max_length=50, blank=True, null=True, help_text="Référence ilot cadastral")
    region = models.CharField(max_length=5,choices=REGION_CHOICES,blank=True,null=True    
    )
        
        
        # ---------------- CONFIRMATION FILES ----------------
    def duac_upload_to(instance, filename):
        return f"duac_files/{instance.code}_{filename}"

    def dccf_upload_to(instance, filename):
        return f"dccf_files/{instance.code}_{filename}"

    def domaine_upload_to(instance, filename):
        return f"domaine_files/{instance.code}_{filename}"

    duac_file = models.FileField(upload_to=duac_upload_to, blank=True, null=True)
    dccf_file = models.FileField(upload_to=dccf_upload_to, blank=True, null=True)
    domaine_file = models.FileField(upload_to=domaine_upload_to, blank=True, null=True)
    
    
    # ✅ NEW CONFIRMATION FIELDS (nullable)
    is_confirmed_by_duac = models.BooleanField(
        blank=True,
        null=True,
        help_text="Confirmé par la DUAC ?"
    )

    is_confirmed_by_DCCF = models.BooleanField(
        blank=True,
        null=True,
        help_text="Confirmé par la DCCF ?"
    )

    is_confirmed_by_Domaine = models.BooleanField(
        blank=True,
        null=True,
        help_text="Confirmé par le Domaine ?"
    )

    # ---------------- CLEAN METHOD ----------------
    def clean(self):
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png']

        files = {
            'duac_file': self.duac_file,
            'dccf_file': self.dccf_file,
            'domaine_file': self.domaine_file
        }

        for field_name, file in files.items():
            if file:
                ext = file.name.split('.')[-1].lower()
                if ext not in allowed_extensions:
                    raise ValidationError({field_name: f"Fichier invalide pour {field_name}: .{ext}. Autorisé: {allowed_extensions}"})

        # Prevent checkbox without file
        if self.is_confirmed_by_duac and not self.duac_file:
            self.is_confirmed_by_duac = False
        if self.is_confirmed_by_DCCF and not self.dccf_file:
            self.is_confirmed_by_DCCF = False
        if self.is_confirmed_by_Domaine and not self.domaine_file:
            self.is_confirmed_by_Domaine = False
            
    def __str__(self):
        return f"{self.code or 'NO_CODE'} - {self.commune}"





# in models.py
class Step(models.Model):
    foncier = models.ForeignKey(Foncier, on_delete=models.CASCADE, related_name='steps')
    title = models.CharField(max_length=100)  # ⬅️ changed from name to title
    order = models.PositiveIntegerField()
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.order}. {self.title}"



# models.py
class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Basse'),
        ('medium', 'Moyenne'),
        ('high', 'Élevée'),
    ]

    step = models.ForeignKey(Step, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    is_done = models.BooleanField(default=False)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    assigned_users = models.ManyToManyField(User, related_name="tasks", blank=True)

    def __str__(self):
        return self.title


# models.py

class Document(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name



class Comment(models.Model):
    task = models.ForeignKey(
        'Task',  # replace 'Task' with your actual model if different
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.content[:30]}..."  # show first 30 chars

 
       



class Message(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} -> {self.receiver}: {self.text[:20]}"

class Message1(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages_v2"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_messages_v2"
    )
    content = models.TextField(blank=True)  # allow blank when file only
    file = models.FileField(upload_to="chatfiles/", null=True, blank=True)  # ✅ NEW
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"[V2] {self.sender.username} → {self.receiver.username}: {self.content[:20]}"



class Event(models.Model):
    REGIONS = [
        ("ouest", "Ouest"),
        ("centre", "Centre"),
        ("est", "Est"),
        ("sud_est", "Sud-Est"),
        ("sud_ouest", "Sud-Ouest"),
        ("grand_sud", "Grand Sud"),
    ]

    title = models.CharField(max_length=255)
    date = models.DateField()
    color = models.CharField(max_length=20, default="#1C5844")
    region = models.CharField(max_length=20, choices=REGIONS, default="centre")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.date} - {self.get_region_display()}"
        
class Historique(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.action[:30]}"





from django.db import models
from django.contrib.auth.models import User

class Space(models.Model):
    STATUS_CHOICES = (
        ('Ouvert', 'Ouvert'),
        ('En cours', 'En cours'),
        ('Clos', 'Clos'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    initiator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='initiated_spaces')
    participants = ArrayField(models.CharField(max_length=50), default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Ouvert')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class Etape(models.Model):
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='etapes')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Etape {self.id} by {self.author.username if self.author else 'Unknown'}"


from django.db import models

ESPACES_CHOICES = [
    ('DGL', 'Direction Générale du Logement'),
    ('DGV', 'Direction Générale de la Ville'),
    ('DGUA', 'Direction Générale de l’Urbanisme'),
    ('DGCMR', 'Direction Générale du Cadastre'),
    ('DGAAT', 'Direction Générale du '),
    ('COMMUN', 'Espace Commun Inter-Institutions'),
]

class Thematique(models.Model):
    name = models.CharField(max_length=255)
    espace = models.CharField(max_length=10, choices=ESPACES_CHOICES)

    def __str__(self):
        return f"{self.espace} - {self.name}"


class Comm(models.Model):
    thematique = models.ForeignKey(Thematique, on_delete=models.CASCADE, related_name='comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,        # 👈 TEMP
        blank=True        # 👈 TEMP
    )
    def __str__(self):
        return f"{self.user.username}: {self.text[:20]}"


from django.db import models
import os
import time


def file_upload_path(instance, filename):
    """
    Save files in: uploads/<ESPACE>/
    Example: uploads/ANFU/1708600000_plan.pdf
    """
    base, ext = os.path.splitext(filename)
    timestamp = int(time.time())
    return f"uploads/{instance.uploaded_by}/{timestamp}_{base}{ext}"


class File(models.Model):
    thematique = models.ForeignKey(
        Thematique,
        on_delete=models.CASCADE,
        related_name='files'
    )
    uploaded_by = models.CharField(max_length=20)  # ANFU, DGL, DGV, ...
    file = models.FileField(upload_to=file_upload_path)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.uploaded_by} - {os.path.basename(self.file.name)}"
