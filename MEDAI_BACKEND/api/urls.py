from django.urls import path
from .views import (
    PatientListCreateView, 
    StudyUploadView, 
    StudyDetailView, 
    ReportCreateView,
    MedicalHistoryListView,
    MedicalHistoryListView,
    DashboardStatsAPIView,
    StudyTriageView
)

urlpatterns = [
    path('dashboard/stats/', DashboardStatsAPIView.as_view(), name='dashboard-stats'),
    path('patients/', PatientListCreateView.as_view(), name='patient-list'),
    path('patients/<int:pk>/history/', MedicalHistoryListView.as_view(), name='patient-history'),
    path('consultations/', StudyUploadView.as_view(), name='study-upload'),
    path('studies/<int:pk>/', StudyDetailView.as_view(), name='study-detail'),
    path('reports/', ReportCreateView.as_view(), name='report-create'),
    path('studies/<int:pk>/triage/', StudyTriageView.as_view(), name='study-triage'),
]
