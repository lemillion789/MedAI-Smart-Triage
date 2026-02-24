from django.apps import AppConfig
import os

class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        # Pre-load AI models to avoid latency on first request
        # Note: In Windows, the reloader might trigger this twice. 
        # We check for RUN_MAIN to avoid redundant loading.
        if os.environ.get('RUN_MAIN') == 'true' or not os.environ.get('DJANGO_SETTINGS_MODULE'):
            if os.environ.get('MOCK_AI') == 'True':
                print("Iniciando en MOCK MODE: Saltando carga de modelos IA pesados.")
                return
                
            try:
                from .ai_processors import MedGemma15Processor, MedASRProcessor
                print("Pre-loading AI models...")
                MedGemma15Processor()._get_pipeline()
                MedASRProcessor()._get_pipeline()
            except Exception as e:
                print(f"Warning: AI model pre-loading failed: {e}")
