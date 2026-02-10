# users/urls.py
from django.urls import path
from .views import RegisterView, LoginView, LogoutView,UserRoleUpdateView
from .views import (
    RegisterView, LoginView, LogoutView,UserListView,UpdateUserPermissionsView,UserDeleteView,
    FoncierListCreateView, FoncierDetailView,
    StepCreateView, TaskCreateView, FoncierStepsView,StepDetailUpdateView,CurrentUserView,ChatUserListView,
    TaskDocumentUploadView,FoncierDeleteAllView,UsageListCreateView,TaskDocumentByteView,DocumentDownloadView,TaskCommentsView,FoncierStatisticsView,FoncierWilayaStatsView,EventListCreateView, FoncierAISummaryView,EventDeleteView,TaskUserRemoveView,UnreadMessageCountView,TaskDeleteView,ChatMessageListView,ChatUserListView, CurrentUserView, SendMessageView,CurrentUserView,EventUpdateView,Message1ListCreateView,TaskUpdateView,HistoriqueListCreateView
)
from .views import download_document


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("users/", UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/role/", UserRoleUpdateView.as_view(), name="user-role-update"),
    path("users/<int:pk>/permissions/", UpdateUserPermissionsView.as_view(), name="update-user-permissions"),

    path('fonciers/', FoncierListCreateView.as_view(), name='foncier-list-create'),
    path("/fonciers/<int:pk>/", FoncierListCreateUpdateView.as_view()),  # PATCH
    path('fonciers/<int:pk>/', FoncierDetailView.as_view(), name='foncier-detail'),

    # path('fonciers/<int:foncier_id>/steps/', StepCreateView.as_view(), name='step-create'),
    path('steps/<int:step_id>/tasks/', TaskCreateView.as_view(), name='task-create'),
    path('tasks/<int:task_id>/', TaskUpdateView.as_view(), name='task-update'),

    # ✅ New endpoint to get all steps + tasks of a foncier
    path('fonciers/<int:foncier_id>/steps/', FoncierStepsView.as_view(), name='foncier-steps'),

    path('fonciers/<int:foncier_id>/steps/', FoncierStepsView.as_view(), name='foncier-steps'),  # GET all steps
    path('fonciers/<int:foncier_id>/steps/create/', StepCreateView.as_view(), name='step-create'),  # POST create step
    path('steps/<int:pk>/', StepDetailUpdateView.as_view(), name='step-update'),

    path('tasks/<int:task_id>/documents/', TaskDocumentUploadView.as_view(), name='task-document-upload'),

    path('documents/<int:document_id>/bytes/', TaskDocumentByteView.as_view(), name='task-document-bytes'),
    path('tasks/<int:task_id>/comments/', TaskCommentsView.as_view(), name='task-comments'),
    # urls.py
    path('tasks/<int:task_id>/comments/<int:comment_id>/', TaskCommentsView.as_view(), name='task-comment-delete'),
    path('documents/<int:document_id>/download/', download_document, name='download_document'),

    path('fonciers/statistics/', FoncierStatisticsView.as_view(), name='foncier-statistics'),
    path('fonciers/wilaya-stats/', FoncierWilayaStatsView.as_view(), name='foncier-wilaya-stats'),
    path("users/<int:pk>/delete/", UserDeleteView.as_view(), name="user-delete"),  # ✅ DELETE
    path("tasks/<int:task_id>/remove-user/<int:user_id>/", TaskUserRemoveView.as_view(), name="task-remove-user"),
    path('tasks/<int:task_id>/delete/', TaskDeleteView.as_view(), name='task-delete'),

    path("chart/users/", ChatUserListView.as_view(), name="chat-users"),
    path("messages/<int:user_id>/", ChatMessageListView.as_view(), name="chat-messages"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("messages/send/", SendMessageView.as_view(), name="send-message"),
    path("ai-summary/", FoncierAISummaryView.as_view(), name="ai-summary"),

    #########################################""
    path("chat/users/", ChatUserListView.as_view(), name="chat_users"),
    path("messages1/<int:user_id>/", Message1ListCreateView.as_view(), name="message1-list"),
    path("messages/unread/", UnreadMessageCountView.as_view(), name="unread-messages"),
    path("user/V1/", CurrentUserView.as_view(), name="current-user"),
    path("events/", EventListCreateView.as_view(), name="event-list-create"),
    path("events/<int:pk>/delete/", EventDeleteView.as_view(), name="event-delete"),
    # urls.py
    path("events/<int:pk>/", EventUpdateView.as_view(), name="event-update"),
    path('historique/', HistoriqueListCreateView.as_view(), name='historique-list-create'),

    path('usages/', UsageListCreateView.as_view(), name='usages-list'),
    path("fonciers/delete-all/", FoncierDeleteAllView.as_view()),
    path(
        'documents/<int:document_id>/download/<str:file_type>/',
        DocumentDownloadView.as_view(),
        name='download_document'
    ),
]


    
