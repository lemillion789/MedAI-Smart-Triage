from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    dni = models.CharField(max_length=20, unique=True)
    birth_date = models.DateField()
    status = models.CharField(max_length=10, choices=[('ACTIVE', 'Active'), ('INACTIVE', 'Inactive')], default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))

    @property
    def last_visit(self):
        last_study = self.studies.order_by('-created_at').first()
        return last_study.created_at if last_study else None

    @property
    def consultations_count(self):
        return self.studies.count()

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Study(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending AI'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='studies')
    image = models.ImageField(upload_to='studies/images/')
    symptoms_audio = models.FileField(upload_to='studies/audio/', null=True, blank=True)
    
    # AI Results
    medgemma_result = models.TextField(null=True, blank=True)
    symptoms_text = models.TextField(null=True, blank=True) # From MedASR
    combined_ai_analysis = models.TextField(null=True, blank=True) # Final integrated response
    
    # Triage Conversation State
    triage_history = models.JSONField(null=True, blank=True)
    triage_completed = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Study {self.id} - {self.patient}"

class ClinicalReport(models.Model):
    study = models.OneToOneField(Study, on_delete=models.CASCADE, related_name='report')
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    doctor_audio = models.FileField(upload_to='reports/audio/', null=True, blank=True)
    final_diagnosis = models.TextField() # Transcription or manual entry
    recommendations = models.TextField(null=True, blank=True)
    report_pdf = models.FileField(upload_to='reports/pdfs/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report for {self.study}"

class MedicalHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_history')
    title = models.CharField(max_length=200)
    description = models.TextField()
    attachments_url = models.URLField(null=True, blank=True) # For PDFs or other links
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.patient}"
