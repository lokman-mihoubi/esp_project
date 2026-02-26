from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer
from .models import Profile,Message1
from rest_framework.generics import UpdateAPIView
from .serializers import Message1Serializer,ProfileRoleUpdateSerializer
from .utils import log_action

from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Profile


class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        region = request.data.get('region', 'DRC')
        abrv_str = request.data.get('abrv_str')
        role = request.data.get('role', 'utilisateur')  # ✅ NEW

        if not username or not password:
            return Response(
                {'error': 'Username and password required'},
                status=400
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already taken'},
                status=400
            )

        # ✅ Validate role
        valid_roles = [choice[0] for choice in Profile.ROLE_CHOICES]
        if role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Allowed: {valid_roles}'},
                status=400
            )

        # Create user
        user = User.objects.create_user(
            username=username,
            password=password
        )

        # ✅ Permissions logic (OPTIONAL but recommended)
        can_view = False
        can_write = False
        can_see_historique = False

        if role in ['admin', 'dgn']:
            can_view = True
            can_write = True
            can_see_historique = True
        elif role == 'ministere':
            can_view = True
            can_see_historique = True

        # Create profile
        profile = Profile.objects.create(
            user=user,
            role=role,
            region=region,
            abrv_str=abrv_str,
            can_view=can_view,
            can_write=can_write,
            can_see_historique=can_see_historique
        )

        return Response(
            {
                'message': 'User created successfully',
                'username': user.username,
                'role': profile.role,
                'region': profile.region,
                'abrv_str': profile.abrv_str,
                'can_view': profile.can_view,
                'can_write': profile.can_write,
                'can_see_historique': profile.can_see_historique,
            },
            status=201
        )

# views.py - LoginView

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            profile = getattr(user, "profile", None)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': profile.role if profile else None,
                'username': user.username,
                'region': profile.region if profile else None,
                'abrv_str': profile.abrv_str if profile else None,
                'can_view': profile.can_view if profile else False,
                'can_write': profile.can_write if profile else False,
                'can_see_historique': profile.can_see_historique if profile else False,
            })

        return Response({'error': 'Invalid credentials'}, status=401)



class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=205)
        except Exception:
            return Response({"error": "Invalid token"}, status=400)


from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response({'error': 'Tous les champs sont obligatoires.'}, status=400)

        if not user.check_password(current_password):
            return Response({'error': 'Mot de passe actuel incorrect.'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Mot de passe modifié avec succès.'})


# class UserRoleUpdateView(UpdateAPIView):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
#     lookup_field = "pk"

#     def update(self, request, *args, **kwargs):
#         kwargs['partial'] = True
#         return super().update(request, *args, **kwargs)

class UserRoleUpdateView(UpdateAPIView):
    serializer_class = ProfileRoleUpdateSerializer
    lookup_field = "user_id"

    def get_queryset(self):
        return Profile.objects.all()

        

class UserListView(APIView):
    # permission_classes = [IsAuthenticated]  

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)         
        
from rest_framework import status, permissions
class UpdateUserPermissionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # permissions sent from frontend
        permissions_data = request.data.get("permissions", [])
        profile = user.profile

        # Map checkboxes to booleans
        profile.can_view = "view" in permissions_data
        profile.can_write = "write" in permissions_data
        profile.can_see_historique = "can_see_historique" in permissions_data
        profile.save()
        print(f"can_view: {profile.can_view}")
        print(f"can_write: {profile.can_write}")
        print(f"can_see_historique: {profile.can_see_historique}")
        print("================================")

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

# ✅ Delete user
class UserDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response({"message": "User deleted successfully"}, status=200)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
 
        
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Foncier
from .serializers import FoncierSerializer
from django.shortcuts import get_object_or_404

# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import FoncierSerializer
from .models import Foncier
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .models import Foncier
from .serializers import FoncierSerializer
from .utils import log_action  # your logging function
# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Usage
from .serializers import UsageSerializer

class UsageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usages = Usage.objects.all()
        serializer = UsageSerializer(usages, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UsageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Foncier, Usage
from .serializers import FoncierSerializer


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

from .models import Foncier, Usage
from .serializers import FoncierSerializer

class FoncierListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        foncier_type = request.GET.get("type")
        qs = Foncier.objects.all()

        profile = getattr(request.user, "profile", None)
        if profile and profile.abrv_str and profile.abrv_str != "DG":
            qs = qs.filter(region=profile.abrv_str)

        if foncier_type:
            qs = qs.filter(type=foncier_type)

        serializer = FoncierSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Flatten data
        flat_data = {k: v[0] if isinstance(v, list) else v for k, v in request.data.items()}

        # Convert numeric fields
        if "surface" in flat_data:
            try:
                flat_data["surface"] = Decimal(str(flat_data["surface"])).quantize(
                    Decimal("0.000001"), rounding=ROUND_HALF_UP
                )
            except:
                flat_data["surface"] = None

        # Convert boolean fields
        for field in ["is_transmis", "is_completed", "is_published", "is_favorited",
                      "is_confirmed_by_duac", "is_confirmed_by_DCCF", "is_confirmed_by_Domaine"]:
            v = flat_data.get(field)
            flat_data[field] = str(v).lower() in ["true", "1", "oui", "yes"]

        # Convert date
        if flat_data.get("date_transmission"):
            try:
                flat_data["date_transmission"] = datetime.strptime(
                    flat_data["date_transmission"], "%Y-%m-%d"
                ).date()
                flat_data["is_transmis"] = True
            except:
                flat_data["date_transmission"] = None

        # Handle usage
        usage_value = flat_data.pop("usage", None)
        if usage_value:
            usage, _ = Usage.objects.get_or_create(name=usage_value)
            flat_data["usage"] = usage

        serializer = FoncierSerializer(data=flat_data)
        if serializer.is_valid():
            foncier = serializer.save()
            return Response(FoncierSerializer(foncier).data, status=201)
        return Response(serializer.errors, status=400)


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime

from .models import Foncier, Usage
from .serializers import FoncierSerializer

class FoncierListCreateUpdateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            foncier = Foncier.objects.get(pk=pk)
        except Foncier.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        flat_data = {k: v[0] if isinstance(v, list) else v for k, v in request.data.items()}

        # Convert numeric fields
        if "surface" in flat_data:
            try:
                flat_data["surface"] = Decimal(str(flat_data["surface"])).quantize(
                    Decimal("0.000001"), rounding=ROUND_HALF_UP
                )
            except:
                flat_data["surface"] = None

        # Convert boolean fields
        for field in ["is_transmis", "is_completed", "is_published", "is_favorited",
                      "is_confirmed_by_duac", "is_confirmed_by_DCCF", "is_confirmed_by_Domaine"]:
            v = flat_data.get(field)
            if v is not None:
                flat_data[field] = str(v).lower() in ["true", "1", "oui", "yes"]

        # Convert date
        if flat_data.get("date_transmission"):
            try:
                flat_data["date_transmission"] = datetime.strptime(
                    flat_data["date_transmission"], "%Y-%m-%d"
                ).date()
                flat_data["is_transmis"] = True
            except:
                flat_data["date_transmission"] = None

        # Handle usage
        usage_value = flat_data.pop("usage", None)
        if usage_value:
            usage, _ = Usage.objects.get_or_create(name=usage_value)
            flat_data["usage"] = usage

        serializer = FoncierSerializer(foncier, data=flat_data, partial=True)
        if serializer.is_valid():
            foncier = serializer.save()
            return Response(FoncierSerializer(foncier).data, status=200)
        return Response(serializer.errors, status=400)



import mimetypes
from django.http import HttpResponse, JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt

@method_decorator(xframe_options_exempt, name='dispatch')
class DocumentDownloadView(APIView):
    """
    Serve a Foncier file by type.
    URL: /auth/documents/<document_id>/download/<file_type>/
    """
    def get(self, request, document_id, file_type):  # <- type comes from path
        try:
            foncier = Foncier.objects.get(id=document_id)

            if file_type == 'duac' and foncier.duac_file:
                file_field = foncier.duac_file
            elif file_type == 'dccf' and foncier.dccf_file:
                file_field = foncier.dccf_file
            elif file_type == 'domaine' and foncier.domaine_file:
                file_field = foncier.domaine_file
            else:
                return JsonResponse({"error": f"File '{file_type}' not found"}, status=404)

            # Read the file
            with file_field.open("rb") as f:
                file_bytes = f.read()

            mime_type, _ = mimetypes.guess_type(file_field.name)
            if not mime_type:
                mime_type = "application/octet-stream"

            response = HttpResponse(file_bytes, content_type=mime_type)
            response['Content-Disposition'] = f'inline; filename="{file_field.name}"'
            return response

        except Foncier.DoesNotExist:
            return JsonResponse({"error": "Document not found"}, status=404)



class FoncierDeleteAllView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        foncier_type = request.GET.get("type")

        queryset = Foncier.objects.all()

        # Optional: delete by type (promotion / investissement)
        if foncier_type:
            queryset = queryset.filter(type=foncier_type)

        deleted_count = queryset.count()
        queryset.delete()

        return Response(
            {
                "message": "Fonciers supprimés avec succès",
                "deleted": deleted_count
            },
            status=status.HTTP_200_OK
        )



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Foncier
from .serializers import FoncierSerializer
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Foncier
import pandas as pd

# ✅ ML imports (REQUIRED)
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LinearRegression
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Foncier
import pandas as pd

# ✅ ML imports
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LinearRegression


class FoncierAISummaryView(APIView):

    def post(self, request):
        try:
            # ✅ Data from frontend
            fonciers = request.data.get("fonciers", [])

            if not fonciers:
                return Response(
                    {"summary": "Aucun foncier fourni.", "data": []},
                    status=200
                )

            # ✅ Load historical DB data
            historical_qs = (
                Foncier.objects
                .filter(surface__isnull=False)
                .values("type", "wilaya", "surface")
            )

            if not historical_qs.exists():
                return Response(
                    {"summary": "Pas assez de données historiques pour la prédiction."},
                    status=200
                )

            # ✅ Train ML model
            df_hist = pd.DataFrame(list(historical_qs))

            pipeline = Pipeline([
                (
                    "preprocessor",
                    ColumnTransformer(
                        [("cat", OneHotEncoder(handle_unknown="ignore"), ["type", "wilaya"])],
                        remainder="drop"
                    ),
                ),
                ("regressor", LinearRegression()),
            ])

            pipeline.fit(
                df_hist[["type", "wilaya"]],
                df_hist["surface"]
            )

            # ✅ Predict surfaces
            enriched = []

            for f in fonciers:
                df_new = pd.DataFrame([{
                    "type": f.get("type") or "Autre",
                    "wilaya": f.get("wilaya") or "Inconnue",
                }])

                predicted = pipeline.predict(df_new)[0]

                f["predicted_surface"] = round(float(predicted), 2)
                enriched.append(f)

            # ✅ DataFrame for summary
            df = pd.DataFrame(enriched)

            # ✅ Force numeric (IMPORTANT)
            df["surface"] = pd.to_numeric(
                df.get("surface"), errors="coerce"
            ).fillna(0)

            df["predicted_surface"] = pd.to_numeric(
                df.get("predicted_surface"), errors="coerce"
            ).fillna(0)

            # ✅ Summary
            summary = (
                f"Nombre de fonciers : {len(df)}\n"
                f"Surface réelle totale : {df['surface'].sum():.2f} m²\n"
                f"Surface prédite totale : {df['predicted_surface'].sum():.2f} m²"
            )

            return Response(
                {
                    "summary": summary,
                    "data": enriched
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

class FoncierDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAuthenticated] 
    def get_object(self, pk):
        return get_object_or_404(Foncier, pk=pk)

    def get(self, request, pk):
        foncier = self.get_object(pk)
        serializer = FoncierSerializer(foncier)
        return Response(serializer.data)

    def put(self, request, pk):
        foncier = self.get_object(pk)
        serializer = FoncierSerializer(foncier, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        foncier = self.get_object(pk)
        serializer = FoncierSerializer(foncier, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
            foncier = self.get_object(pk)
            log_action(request.user, f"Deleted Foncier: {foncier.code} (ID: {foncier.id})")
            foncier.delete()
            return Response({
                "status": "success",
                "message": f"Foncier '{foncier.code}' deleted successfully"
            }, status=status.HTTP_200_OK)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Step, Task
from .serializers import FoncierSerializer, StepSerializer, TaskSerializer


from django.db.models import Max  # Make sure this is imported

class StepCreateView(APIView):
    def post(self, request, foncier_id):
        foncier = get_object_or_404(Foncier, pk=foncier_id)

        latest_order = Step.objects.filter(foncier=foncier).aggregate(Max('order'))['order__max'] or 0
        request_data = request.data.copy()
        request_data['order'] = latest_order + 1

        serializer = StepSerializer(data=request_data)
        if serializer.is_valid():
            step = serializer.save(foncier=foncier)
            # Log
            log_action(request.user, f"Created Step: {step.title} in Foncier {foncier.code}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class TaskCreateView(APIView):
    def post(self, request, step_id):
        step = get_object_or_404(Step, pk=step_id)
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            task = serializer.save(step=step)
            # Log the action
            log_action(request.user, f"Created Task: {task.title} in Step {step.title}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDeleteView(APIView):
    def delete(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        task.delete()
        return Response({"detail": "Task deleted"}, status=status.HTTP_200_OK)

class TaskUpdateView(APIView):
    def patch(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            updated_task = serializer.save()
            log_action(request.user, f"Updated Task: {updated_task.title}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class FoncierStepsView(APIView):
    def get(self, request, foncier_id):
        foncier = get_object_or_404(Foncier, pk=foncier_id)
        steps = Step.objects.filter(foncier=foncier).order_by('order')
        serializer = StepSerializer(steps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
from rest_framework.generics import RetrieveUpdateAPIView    
class StepDetailUpdateView(RetrieveUpdateAPIView):
    queryset = Step.objects.all()
    serializer_class = StepSerializer


from .models import Document
from .serializers import DocumentSerializer
from rest_framework.parsers import MultiPartParser, FormParser    
class TaskDocumentUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        documents = Document.objects.filter(task=task)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

from django.http import FileResponse, Http404   
import subprocess
from django.http import FileResponse, Http404
from .models import Document
import tempfile
import os

class TaskDocumentByteView(APIView):
    def get(self, request, document_id):
        try:
            document = Document.objects.get(pk=document_id)
            file_path = document.file.path
            content_type = "application/pdf"

            # Check file extension
            ext = os.path.splitext(file_path)[1].lower()
            if ext in [".doc", ".docx", ".xls", ".xlsx"]:
                # Convert to PDF using LibreOffice
                with tempfile.NamedTemporaryFile(suffix=".pdf") as tmp_pdf:
                    subprocess.run([
                        "libreoffice",
                        "--headless",
                        "--convert-to", "pdf",
                        "--outdir", os.path.dirname(tmp_pdf.name),
                        file_path
                    ], check=True)
                    pdf_file_path = os.path.splitext(file_path)[0] + ".pdf"
                    return FileResponse(open(pdf_file_path, 'rb'), content_type=content_type)

            # If already PDF
            return FileResponse(document.file.open('rb'), content_type=content_type)
        except Document.DoesNotExist:
            raise Http404("Document not found")


# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Task, Comment
from .serializers import CommentSerializer
from django.shortcuts import get_object_or_404

class TaskCommentsView(APIView):
    def get(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        comments = task.comments.all().order_by('-created_at')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        data = request.data.copy()
        data['task'] = task.id
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, task_id, comment_id=None):
        task = get_object_or_404(Task, pk=task_id)

        if comment_id is None:
            return Response(
                {"detail": "comment_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = get_object_or_404(task.comments, pk=comment_id)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)    
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Task
import os

def download_document(request, document_id):
    try:
        document = Document.objects.get(id=document_id)
        file_path = document.file.path

        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
        else:
            raise Http404("File does not exist")
    except Document.DoesNotExist:
        raise Http404("Document not found")


# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count
from collections import defaultdict
import geopandas as gpd
import os
from .models import Foncier

# Wilaya dictionary
WILAYA_DICT = {
    "01": "Adrar", "02": "Chlef", "03": "Laghouat", "04": "Oum El Bouaghi",
    "05": "Batna", "06": "Béjaïa", "07": "Biskra", "08": "Béchar",
    "09": "Blida", "10": "Bouira", "11": "Tamanrasset", "12": "Tébessa",
    "13": "Tlemcen", "14": "Tiaret", "15": "Tizi Ouzou", "16": "Alger",
    "17": "Djelfa", "18": "Jijel", "19": "Sétif", "20": "Saïda",
    "21": "Skikda", "22": "Sidi Bel Abbès", "23": "Annaba", "24": "Guelma",
    "25": "Constantine", "26": "Médéa", "27": "Mostaganem", "28": "M’Sila",
    "29": "Mascara", "30": "Ouargla", "31": "Oran", "32": "El Bayadh",
    "33": "Illizi", "34": "Bordj Bou Arreridj", "35": "Boumerdès",
    "36": "El Tarf", "37": "Tindouf", "38": "Tissemsilt", "39": "El Oued",
    "40": "Khenchela", "41": "Souk Ahras", "42": "Tipaza", "43": "Mila",
    "44": "Aïn Defla", "45": "Naâma", "46": "Aïn Témouchent",
    "47": "Ghardaïa", "48": "Relizane", "49": "El M'Ghair", "50": "El Menia",
    "51": "Ouled Djellal", "52": "Bordj Baji Mokhtar", "53": "Béni Abbès",
    "54": "Timimoun", "55": "Touggourt", "56": "Djanet", "57": "In Salah",
    "58": "In Guezzam"
}

class FoncierStatisticsView(APIView):
    def get(self, request):
        wilaya_counter = defaultdict(int)
        viabilisation_counter = defaultdict(int)
        total_fonciers = Foncier.objects.count()
        type_stats = Foncier.objects.values("type").annotate(total=Count("id")).order_by("type")
        geojson_stats = []

        for foncier in Foncier.objects.all():
            if not foncier.geojson_file:
                continue

            file_path = foncier.geojson_file.path
            if not os.path.exists(file_path):
                geojson_stats.append({
                    "foncier_id": foncier.id,
                    "code": foncier.code,
                    "error": "File not found"
                })
                continue

            try:
                gdf = gpd.read_file(file_path)

                # Wilaya
                wilaya_col = next((col for col in gdf.columns if "wilaya" in col.strip().lower()), None)
                if wilaya_col:
                    for w in gdf[wilaya_col].dropna().astype(str):
                        w_clean = w.strip().upper()
                        matched_wilaya = next((v for k, v in WILAYA_DICT.items() if v.upper() == w_clean), w_clean.title())
                        wilaya_counter[matched_wilaya] += 1

                # Viabilisation
                viab_col = next((col for col in gdf.columns if "viabil" in col.strip().lower()), None)
                if viab_col:
                    for v in gdf[viab_col].dropna().astype(str):
                        viabilisation_counter[v.strip()] += 1

                geojson_stats.append({
                    "foncier_id": foncier.id,
                    "title": foncier.code,
                    "wilayas": gdf[wilaya_col].dropna().astype(str).tolist() if wilaya_col else [],
                    "viabilisation": gdf[viab_col].dropna().astype(str).tolist() if viab_col else []
                })

            except Exception as e:
                geojson_stats.append({
                    "foncier_id": foncier.id,
                    "title": foncier.code,
                    "error": str(e)
                })

        return Response({
            "total_fonciers": total_fonciers,
            "by_type": list(type_stats),
            "geojson": geojson_stats,
            "wilayas_distribution": dict(wilaya_counter),
            "viabilisation_distribution": dict(viabilisation_counter),
        })

class FoncierWilayaStatsView(APIView):
    def get(self, request):
        wilaya_stats = defaultdict(lambda: defaultdict(int))

        for foncier in Foncier.objects.all():
            wilaya_name = dict(Foncier.WILAYA_CHOICES).get(foncier.wilaya, "Unknown")
            wilaya_stats[wilaya_name]['total'] += 1
            wilaya_stats[wilaya_name][foncier.type] += 1

        wilaya_data = []
        for wilaya, counts in wilaya_stats.items():
            entry = {"wilaya": wilaya, "total": counts.pop('total', 0)}
            entry.update(counts)  # ⬅️ ici les types sont au "même niveau" que total
            wilaya_data.append(entry)

        return Response({
            "total_wilayas": len(wilaya_stats),
            "wilayas_distribution": wilaya_data
        })


class TaskUserRemoveView(APIView):
    def post(self, request, task_id, user_id):
        task = get_object_or_404(Task, pk=task_id)
        user = get_object_or_404(User, pk=user_id)

        if user in task.assigned_users.all():
            task.assigned_users.remove(user)
            assigned_users_info = [
                {"id": u.id, "username": u.username, "email": u.email}
                for u in task.assigned_users.all()
            ]
            return Response({"assigned_users_info": assigned_users_info}, status=status.HTTP_200_OK)

        return Response({"error": "User not assigned"}, status=status.HTTP_400_BAD_REQUEST)

from rest_framework import generics, permissions
from .models import Message
from .serializers import UserSerializer, MessageSerializer


# 🔹 Get list of other users to chat with
class ChatUserListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)

# 🔹 Get messages between authenticated user and another user
class ChatMessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        other_user_id = self.kwargs["user_id"]
        return Message.objects.filter(
            sender__in=[user.id, other_user_id],
            receiver__in=[user.id, other_user_id]
        ).order_by("timestamp")

# 🔹 Get current authenticated user
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# 🔹 Send message via REST
class SendMessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get("receiver_id")
        text = request.data.get("text")

        if not receiver_id or not text:
            return Response({"error": "receiver_id and text required"}, status=400)

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({"error": "Receiver not found"}, status=404)

        message = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            text=text
        )
        return Response(MessageSerializer(message).data)


        #######"""####################################################""

# class Message1ListCreateView(generics.ListCreateAPIView):
#     serializer_class = Message1Serializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         receiver_id = self.kwargs.get("user_id")
#         qs = Message1.objects.filter(
#             sender__id__in=[user.id, receiver_id],
#             receiver__id__in=[user.id, receiver_id]
#         ).order_by("timestamp")

#         # Mark messages received by current user as read
#         qs.filter(receiver=user, is_read=False).update(is_read=True)
#         return qs

#     def perform_create(self, serializer):
#         receiver = User.objects.get(id=self.kwargs.get("user_id"))
#         serializer.save(sender=self.request.user, receiver=receiver)

class Message1ListCreateView(generics.ListCreateAPIView):
    serializer_class = Message1Serializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        receiver_id = self.kwargs.get("user_id")
        qs = Message1.objects.filter(
            sender__id__in=[user.id, receiver_id],
            receiver__id__in=[user.id, receiver_id]
        ).order_by("timestamp")

        qs.filter(receiver=user, is_read=False).update(is_read=True)
        return qs

    def perform_create(self, serializer):
        receiver = User.objects.get(id=self.kwargs.get("user_id"))
        serializer.save(
            sender=self.request.user,
            receiver=receiver,
            file=self.request.FILES.get("file")  # ✅ Save uploaded file!
        )

class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChatUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        users = User.objects.exclude(id=current_user.id)
        data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
            for user in users
        ]
        return Response(data)   

class UnreadMessageCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Count unread messages grouped by sender
        from django.db.models import Count

        unread_by_user = (
            Message1.objects.filter(receiver=user, is_read=False)
            .values("sender__id", "sender__username")
            .annotate(count=Count("id"))
        )

        total_unread = Message1.objects.filter(receiver=user, is_read=False).count()

        return Response({
            "by_user": list(unread_by_user),
            "total": total_unread
        })

from rest_framework import generics, permissions
from .models import Event
from .serializers import EventSerializer

class EventListCreateView(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        # serializer.save(created_by=self.request.user)
        event = serializer.save(created_by=self.request.user)
        historique_entry = log_action(self.request.user, f"Created Event: {event.title}")
        print("✅ Log saved:", historique_entry)



class EventUpdateView(generics.UpdateAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)

    def perform_update(self, serializer):
        event = serializer.save()
        log_action(self.request.user, f"Updated Event: {event.title}")

class EventDeleteView(generics.DestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)

    def perform_destroy(self, instance):
        log_action(self.request.user, f"Deleted Event: {instance.title}")
        instance.delete()


from rest_framework import generics, permissions
from .models import Historique
from .serializers import HistoriqueSerializer
    
class HistoriqueListCreateView(generics.ListCreateAPIView):
    serializer_class = HistoriqueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # If user has permission → return all historical actions
        if user.profile.can_see_historique is True:
            return Historique.objects.all().order_by('-date')

        # Otherwise → return only their own
        return Historique.objects.filter(user=user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)





from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Space,Etape
from .serializers import SpaceSerializer,EtapeSerializer

class SpaceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != "Tous":
            spaces = Space.objects.filter(status=status_filter)
        else:
            spaces = Space.objects.all()
        serializer = SpaceSerializer(spaces, many=True)
        return Response(serializer.data)

    def post(self, request):
        title = request.data.get('title')
        description = request.data.get('description', '')
        participant_codes = request.data.get('participants', [])

        if not title or not participant_codes:
            return Response({'error': 'Title and participants required'}, status=400)

        initiator_code = request.user.username  # assuming username is code like 'ANFU'

        # Include initiator automatically in participants
        if initiator_code not in participant_codes:
            participant_codes.append(initiator_code)

        space = Space.objects.create(
            title=title,
            description=description,
            initiator=request.user,
            participants=participant_codes  # assign list directly
        )

        serializer = SpaceSerializer(space)
        return Response(serializer.data, status=201)



class EtapeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, space_id):
        text = request.data.get('text')
        if not text:
            return Response({'error': 'Text required'}, status=400)

        try:
            space = Space.objects.get(id=space_id)
        except Space.DoesNotExist:
            return Response({'error': 'Space not found'}, status=404)

        if request.user.username not in space.participants and request.user != space.initiator:
            return Response({'error': 'Not authorized'}, status=403)

        etape = Etape.objects.create(space=space, author=request.user, text=text)
        serializer = EtapeSerializer(etape)
        return Response(serializer.data, status=201)



class SpaceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, space_id):
        try:
            return Space.objects.get(id=space_id)
        except Space.DoesNotExist:
            return None

    def get(self, request, space_id):
        space = self.get_object(space_id)
        if not space:
            return Response({'error': 'Space not found'}, status=404)
        serializer = SpaceSerializer(space)
        return Response(serializer.data)

    def delete(self, request, space_id):
        space = self.get_object(space_id)
        if not space:
            return Response({'error': 'Space not found'}, status=404)

        # Optional: Only initiator can delete
        if request.user != space.initiator:
            return Response({'error': 'Not authorized'}, status=403)

        space.delete()
        return Response({'success': 'Space deleted'}, status=204)




from rest_framework import generics, filters
from .models import Thematique, Comm,File
from .serializers import ThematiqueSerializer, CommSerializer,FileSerializer

# List and create thematiques
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Thematique
from .serializers import ThematiqueSerializer

# ----------------------------------------
# List & Create
# ----------------------------------------
class ThematiqueListCreateView(generics.ListCreateAPIView):
    serializer_class = ThematiqueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        espace = self.request.query_params.get('espace')
        if espace:
            return Thematique.objects.filter(espace=espace)
        return Thematique.objects.all()


# ----------------------------------------
# Retrieve & Update
# ----------------------------------------
class ThematiqueRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Thematique.objects.all()
    serializer_class = ThematiqueSerializer
    permission_classes = [IsAuthenticated]


# ----------------------------------------
# Delete
# ----------------------------------------
class ThematiqueDeleteView(generics.DestroyAPIView):
    queryset = Thematique.objects.all()
    serializer_class = ThematiqueSerializer
    permission_classes = [IsAuthenticated]



class CommListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommSerializer

    def get_queryset(self):
        thematique_id = self.kwargs.get('thematique_id')
        return Comm.objects.filter(
            thematique_id=thematique_id
        ).order_by('created_at')

    def perform_create(self, serializer):
        serializer.save(
            thematique_id=self.kwargs.get('thematique_id'),
            user=self.request.user   # ✅ WHO added the comment
        )



from rest_framework import generics, parsers
from rest_framework.permissions import IsAuthenticated


class FileListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FileSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        thematique_id = self.kwargs.get('thematique_id')
        uploaded_by = self.request.query_params.get('uploaded_by')
        qs = File.objects.filter(thematique_id=thematique_id)
        if uploaded_by:
            qs = qs.filter(uploaded_by=uploaded_by)
        return qs

    def perform_create(self, serializer):
        thematique_id = self.kwargs.get('thematique_id')
        uploaded_by = self.request.data.get('uploaded_by')
        serializer.save(thematique_id=thematique_id, uploaded_by=uploaded_by)
