from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Foncier,Usage,Event,Step, Task, Document, Comment, Profile,Message,Message1
import json

class ProfileSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "role",
            "region",
            "abrv_str",
            "can_view",
            "can_write",
            "can_see_historique",
            "permissions",
        ]

    def get_permissions(self, obj):
        perms = []
        if obj.can_view:
            perms.append("view")
        if obj.can_write:
            perms.append("write")
        if obj.can_see_historique:
            perms.append("can_see_historique")
        return perms

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source="profile.role", read_only=True)
    region = serializers.CharField(source="profile.region", read_only=True)
    abrv_str = serializers.CharField(
        source="profile.abrv_str",
        allow_null=True,
        required=False,
        read_only=True,
    )
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "region",
            "abrv_str",   # ✅ now correctly mapped
            "permissions",
        ]

    def get_permissions(self, obj):
        profile = obj.profile

        perms = []
        if profile.can_view:
            perms.append("view")
        if profile.can_write:
            perms.append("write")
        if profile.can_see_historique:
            perms.append("can_see_historique")

        return perms

from django.contrib.auth import get_user_model
class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "receiver", "text", "timestamp"]

# class Message1Serializer(serializers.ModelSerializer):
#     sender = UserSerializer(read_only=True)
#     receiver = UserSerializer(read_only=True)

#     class Meta:
#         model = Message1
#         fields = ["id", "sender", "receiver", "content", "timestamp"]
class Message1Serializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    filename = serializers.SerializerMethodField()

    class Meta:
        model = Message1
        fields = ["id", "sender", "receiver", "content", "file", "filename", "timestamp"]

    def get_filename(self, obj):
        return obj.file.name.split('/')[-1] if obj.file else None


from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pandas as pd
import json

class UsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usage
        fields = ['id', 'parent_type', 'name']



import json
import pandas as pd
from rest_framework import serializers
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LinearRegression

from .models import Foncier, Usage

# --------------------------------------------------
# WILAYA ➜ REGION MAP
# --------------------------------------------------
WILAYA_TO_REGION = {

    # CENTRE
    "03": "DRC", "44": "DRC", "42": "DRC", "26": "DRC",
    "16": "DRC", "09": "DRC", "15": "DRC", "10": "DRC",
    "28": "DRC", "17": "DRC", "06": "DRC", "34": "DRC",
    "35": "DRC",

    # EST
    "19": "DRE", "18": "DRE", "05": "DRE", "40": "DRE",
    "12": "DRE", "04": "DRE", "41": "DRE", "24": "DRE",
    "36": "DRE", "23": "DRE", "21": "DRE", "43": "DRE",
    "25": "DRE",

    # OUEST
    "22": "DRO", "13": "DRO", "46": "DRO", "31": "DRO",
    "20": "DRO", "29": "DRO", "14": "DRO", "48": "DRO",
    "27": "DRO", "38": "DRO", "02": "DRO",

    # SUD
    "50": "DRGS", "54": "DRGS", "11": "DRGS", "56": "DRGS",

    # SUD EST
    "33": "DRSE", "30": "DRSE", "53": "DRSE", "58": "DRSE",
    "47": "DRSE", "51": "DRSE", "07": "DRSE", "57": "DRSE",
    "55": "DRSE", "39": "DRSE",

    # SUD OUEST
    "01": "DRSO", "49": "DRSO", "52": "DRSO", "37": "DRSO",
    "08": "DRSO", "45": "DRSO", "32": "DRSO",
}

import base64
import mimetypes

class FoncierSerializer(serializers.ModelSerializer):
    geojson_data = serializers.SerializerMethodField()
    predicted_surface = serializers.SerializerMethodField()
    progress_label = serializers.SerializerMethodField()

    usage = UsageSerializer(read_only=True)
    usage_id = serializers.PrimaryKeyRelatedField(
        queryset=Usage.objects.all(),
        source="usage",
        write_only=True,
        required=False
    )

    class Meta:
        model = Foncier
        fields = "__all__"
        read_only_fields = ['id']
    
       # URLs des fichiers pour prévisualisation
    duac_file_bytes = serializers.SerializerMethodField()
    dccf_file_bytes = serializers.SerializerMethodField()
    domaine_file_bytes = serializers.SerializerMethodField()
    
    


   

    def _file_to_base64(self, file):
        if not file:
            return None

        mime_type, _ = mimetypes.guess_type(file.name)
        if not mime_type:
            mime_type = "application/pdf"

        with file.open("rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
            data_url = f"data:{mime_type};base64,{encoded}"

            # 🔍 DEBUG: print the first 100 characters to avoid huge logs
            print(f"🧪 FILE BYTES PREVIEW ({file.name}): {data_url[:100]}...")

            return data_url



    def get_duac_file_bytes(self, obj):
        return self._file_to_base64(obj.duac_file)

    def get_dccf_file_bytes(self, obj):
        return self._file_to_base64(obj.dccf_file)

    def get_domaine_file_bytes(self, obj):
        return self._file_to_base64(obj.domaine_file)

    
    

    def get_duac_file_bytes(self, obj):
        data = self._file_to_base64(obj.duac_file)
        print("🧪 DUAC BYTES PREVIEW:", data[:100] if data else None)
        return data


    def get_dccf_file_bytes(self, obj):
        return self._file_to_base64(obj.dccf_file)

    def get_domaine_file_bytes(self, obj):
        return self._file_to_base64(obj.domaine_file)



    # --------------------------------------------------
    # 🔥 FORCE REGION FROM WILAYA (GUARANTEED)
    # --------------------------------------------------
    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        # Region from profile
        profile = getattr(user, "profile", None)
        if profile and profile.abrv_str:
            validated_data["region"] = profile.abrv_str

        # Region from wilaya (override if needed)
        wilaya = validated_data.get("wilaya")
        if wilaya:
            validated_data["region"] = WILAYA_TO_REGION.get(str(wilaya).zfill(2), "DG")

        return super().create(validated_data)


    def update(self, instance, validated_data):
        wilaya = validated_data.get("wilaya", instance.wilaya)
        if wilaya:
            validated_data["region"] = WILAYA_TO_REGION.get(str(wilaya).zfill(2), "DG")
        return super().update(instance, validated_data)
    
    def validate(self, data):
        # Prevent checkboxes without files
        if data.get('is_confirmed_by_duac') and not data.get('duac_file'):
            data['is_confirmed_by_duac'] = False
        if data.get('is_confirmed_by_DCCF') and not data.get('dccf_file'):
            data['is_confirmed_by_DCCF'] = False
        if data.get('is_confirmed_by_Domaine') and not data.get('domaine_file'):
            data['is_confirmed_by_Domaine'] = False
        return data

    # --------------------------------------------------
    # EXTRA FIELDS
    # --------------------------------------------------
    def get_geojson_data(self, obj):
        if obj.geojson_file:
            try:
                return json.loads(obj.geojson_file.read())
            except Exception:
                return None
        return None

    def get_progress_label(self, obj):
        if obj.progress_status == "EN_COURS":
            return "En cours"
        if obj.progress_status == "TERMINE":
            return "Terminé"
        if obj.progress_viabilisation is not None:
            return f"{obj.progress_viabilisation}%"
        return None

    def get_predicted_surface(self, obj):
        try:
            historical = self.context.get("historical_fonciers", [])
            if not historical:
                return None

            df_hist = pd.DataFrame(historical)
            pipeline = Pipeline([
                ("preprocessor", ColumnTransformer(
                    [("cat", OneHotEncoder(handle_unknown="ignore"), ["type", "wilaya"])]
                )),
                ("regressor", LinearRegression())
            ])
            pipeline.fit(df_hist[["type", "wilaya"]], df_hist["surface"])

            df_new = pd.DataFrame([{
                "type": obj.type,
                "wilaya": obj.wilaya
            }])

            return round(pipeline.predict(df_new)[0], 2)
        except Exception:
            return None


class TaskSerializer(serializers.ModelSerializer):
    assigned_users = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False
    )
    assigned_users_info = UserSerializer(
        many=True, read_only=True, source="assigned_users"
    )

    class Meta:
        model = Task
        fields = [
            "id", "title", "is_done", "priority",
            "assigned_users", "assigned_users_info",
            "documents", "step",
        ]
        extra_kwargs = {
            "step": {"required": False},
            "is_done": {"required": False, "default": False},
            "priority": {"required": False},
            "documents": {"required": False},
        }

class StepSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Step
        fields = "__all__"
        extra_kwargs = {"foncier": {"required": False}}


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = "__all__"
        extra_kwargs = {"task": {"required": False}}


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'date', 'color','region', 'created_by']
        read_only_fields = ['created_by']

# class EventSerializer(serializers.ModelSerializer):
#     region_display = serializers.CharField(source="get_region_display", read_only=True)
#     is_owner = serializers.SerializerMethodField()

#     class Meta:
#         model = Event
#         fields = [
#             'id', 'title', 'date', 'color',
#             'region', 'region_display',
#             'created_by', 'is_owner'
#         ]
#         read_only_fields = ['created_by']

#     def get_is_owner(self, obj):
#         return obj.created_by == self.context['request'].user
from rest_framework import serializers
from .models import Historique

class HistoriqueSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    date = serializers.DateTimeField(read_only=True)
    class Meta:
        model = Historique
        fields = ['id', 'action', 'date', 'user']





from rest_framework import serializers
from .models import Space, Etape
from django.contrib.auth.models import User

class EtapeSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = Etape
        fields = ['id', 'author', 'text', 'date']

    def get_date(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")

class SpaceSerializer(serializers.ModelSerializer):
    initiator = serializers.CharField(source='initiator.username', read_only=True)
    # Now participants are returned as stored codes
    participants = serializers.ListField(child=serializers.CharField(), read_only=True)
    etapes = EtapeSerializer(many=True, read_only=True)
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = Space
        fields = ['id', 'title', 'description', 'initiator', 'participants', 'status', 'created_at', 'etapes']

    def get_created_at(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M")


from rest_framework import serializers
from .models import Thematique, Comm,File

class ThematiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thematique
        fields = ['id', 'name', 'espace']

# class CommSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Comm
#         fields = ['id', 'thematique', 'text', 'created_at']
#         read_only_fields = ['thematique', 'created_at']



class CommSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Comm
        fields = [
            'id',
            'thematique',
            'user',
            'username',   # 👈 displayed in frontend
            'text',
            'created_at'
        ]
        read_only_fields = ['thematique', 'user', 'created_at']

class FileSerializer(serializers.ModelSerializer):
    file_name = serializers.SerializerMethodField()
    bytes = serializers.SerializerMethodField()  # new field

    class Meta:
        model = File
        fields = ['id', 'thematique', 'uploaded_by', 'file', 'file_name', 'uploaded_at', 'bytes']
        read_only_fields = ['thematique', 'uploaded_by', 'uploaded_at']

    def get_file_name(self, obj):
        return obj.file.name.split('/')[-1]

    def get_bytes(self, obj):
        if obj.file and obj.file.name:
            obj.file.open('rb')
            data = obj.file.read()
            obj.file.close()
            return list(data)  # send as list of integers
        return []
