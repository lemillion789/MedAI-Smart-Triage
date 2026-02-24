import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Patient, Study, ClinicalReport, MedicalHistory
from .serializers import PatientSerializer, StudySerializer, ClinicalReportSerializer, MedicalHistorySerializer
from .utils import generate_clinical_report_pdf
from .ai_processors import IntegratedAIProcessor
from rest_framework.permissions import AllowAny

class MedicalHistoryListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request, pk):
        history = MedicalHistory.objects.filter(patient_id=pk).order_by('-created_at')
        serializer = MedicalHistorySerializer(history, many=True)
        return Response(serializer.data)

class PatientListCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        patients = Patient.objects.all()
        
        # Filtering by DNI or Name if provided
        search_query = request.query_params.get('search', None)
        if search_query:
            from django.db.models import Q
            patients = patients.filter(
                Q(dni__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )
            
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudyUploadView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request):
        print(f"[{time.strftime('%H:%M:%S')}] 📥 Incoming POST request to /api/consultations/")
        # We handle 'patient_id' mapping inside the StudySerializer.create method now
        # to avoid request.data.copy() which causes pickle errors with files.
        serializer = StudySerializer(data=request.data)
        if serializer.is_valid():
            study = serializer.save()
            
            # --- START MULTI-STAGE AI LOGIC (Multi-Modal 2-Stage) ---
            processor = IntegratedAIProcessor()
            study = processor.process_consultation(study)
            
            # Note: We don't create ClinicalReport or PDF here anymore
            # because the triage is just starting. 
            # We only create the History entry for the initiation.
            
            MedicalHistory.objects.create(
                patient=study.patient,
                title=f"Triaje Iniciado - Estudio #{study.id}",
                description=(
                    f"Iniciando triaje inteligente.\n"
                    f"Hallazgos iniciales: {study.medgemma_result[:200]}..."
                )
            )
            # --- END MULTI-STAGE AI LOGIC ---

            return Response(StudySerializer(study).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudyDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request, pk):
        study = get_object_or_404(Study, pk=pk)
        serializer = StudySerializer(study)
        return Response(serializer.data)

class ReportCreateView(APIView):
    def get(self, request):
        reports = ClinicalReport.objects.all().order_by('-created_at')
        serializer = ClinicalReportSerializer(reports, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ClinicalReportSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save()
            
            # Update/Regenerate PDF with doctor's input
            generate_clinical_report_pdf(report)
            
            # Auto-create history entry for Clinical Report
            MedicalHistory.objects.create(
                patient=report.study.patient,
                title=f"Reporte Clínico Final - Estudio #{report.study.id}",
                description=f"Diagnóstico Final: {report.final_diagnosis}\nRecomendaciones: {report.recommendations}",
                attachments_url=report.report_pdf.url if hasattr(report.report_pdf, 'url') else None
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudyTriageView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def post(self, request, pk):
        print(f"[{time.strftime('%H:%M:%S')}] 📥 Incoming POST request to /api/studies/{pk}/triage/")
        study = get_object_or_404(Study, pk=pk)
        if study.triage_completed:
            return Response({"error": "Triage already completed."}, status=status.HTTP_400_BAD_REQUEST)
            
        user_answer = request.data.get('answer')
        if not user_answer:
            return Response({"error": "Answer is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        processor = IntegratedAIProcessor()
        study = processor.continue_triage(study, user_answer)
        
        if study.triage_completed:
            # Auto-create ClinicalReport and PDF once triage is done
            report, created = ClinicalReport.objects.get_or_create(
                study=study,
                defaults={
                    "final_diagnosis": "Pendiente de revisión médica.",
                    "recommendations": "Se recomienda correlación clínica con el reporte de triaje."
                }
            )
            generate_clinical_report_pdf(report)
            
            MedicalHistory.objects.create(
                patient=study.patient,
                title=f"Triaje Completado - Estudio #{study.id}",
                description=f"Conclusión de IA: {study.combined_ai_analysis[:200]}...",
                attachments_url=report.report_pdf.url if report.report_pdf else None
            )
            
        return Response(StudySerializer(study).data)

class DashboardStatsAPIView(APIView):
    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        
        # Stats counts
        stats = {
            "waiting": Study.objects.filter(status='PENDING').count(),
            "processing": Study.objects.filter(status='PROCESSING').count(),
            "completed_today": Study.objects.filter(status='COMPLETED', updated_at__date=today).count(),
            "errors": Study.objects.filter(status='FAILED').count(),
        }
        
        # Active cases (Recent studies that are pending or being processed)
        active_studies = Study.objects.filter(
            status__in=['PENDING', 'PROCESSING']
        ).order_by('-created_at')[:5]
        
        active_cases = StudySerializer(active_studies, many=True).data
        
        return Response({
            "stats": stats,
            "active_cases": active_cases
        })
