from django.urls import path
from .views import ExportDownloadView

urlpatterns = [
    path("<uuid:pk>/", ExportDownloadView.as_view(), name="export-download"),
]
