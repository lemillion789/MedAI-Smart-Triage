from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, Study, ClinicalReport, MedicalHistory

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class PatientSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    last_visit = serializers.ReadOnlyField()
    consultations_count = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = '__all__'

class StudySerializer(serializers.ModelSerializer):
    patient_details = PatientSerializer(source='patient', read_only=True)
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    audio = serializers.FileField(write_only=True, required=False)
    
    class Meta:
        model = Study
        fields = '__all__'

    def validate(self, data):
        # Resolve patient from patient_id if necessary
        p_id = data.pop('patient_id', None)
        if p_id and not data.get('patient'):
            try:
                data['patient'] = Patient.objects.get(id=p_id)
            except Patient.DoesNotExist:
                raise serializers.ValidationError({"patient": "Patient not found."})
        
        if not data.get('patient'):
            raise serializers.ValidationError({"patient": "This field is required."})

        # Map 'audio' to 'symptoms_audio'
        passed_audio = data.pop('audio', None)
        if passed_audio and not data.get('symptoms_audio'):
            data['symptoms_audio'] = passed_audio
            
        return data

class ClinicalReportSerializer(serializers.ModelSerializer):
    doctor_details = UserSerializer(source='doctor', read_only=True)
    study_details = StudySerializer(source='study', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ClinicalReport
        fields = ['id', 'study', 'doctor', 'doctor_details', 'study_details', 'final_diagnosis', 'recommendations', 'report_pdf', 'pdf_url', 'created_at', 'updated_at']

    def get_pdf_url(self, obj):
        if obj.report_pdf:
            return obj.report_pdf.url
        return None

class MedicalHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalHistory
        fields = '__all__'
