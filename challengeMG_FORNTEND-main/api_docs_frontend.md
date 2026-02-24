# API Documentation (Frontend Ready)

## 1. Pacientes
**`GET /api/patients/`**
- **Respuesta (List):**
```json
[{ "id": 1, "first_name": "Juan", "last_name": "Perez", "dni": "12345678", "age": 30 }]
```

**`POST /api/patients/`**
- **Payload:**
```json
{ "first_name": "Ana", "last_name": "Gomez", "dni": "87654321", "birth_date": "1995-05-20" }
```

---

## 2. Estudios (Análisis AI)
**`POST /api/studies/`**
- **Payload (Multipart/form-data):**
  - `patient`: ID del paciente (int)
  - `image`: Archivo de imagen (RX)
  - `symptoms_audio`: (Opcional) Archivo de audio con síntomas
- **Respuesta (Inmediata - AI Procesada):**
```json
{
  "id": 10,
  "status": "COMPLETED",
  "combined_ai_analysis": "Análisis integrado: Sospecha de...",
  "medgemma_result": "Hallazgos en imagen...",
  "symptoms_text": "Transcripción de audio..."
}
```

**`GET /api/studies/<id>/`**
- **Respuesta:**
```json
{
  "id": 10,
  "patient": 1,
  "patient_details": {
    "first_name": "Juan",
    "last_name": "Perez",
    "dni": "12345678"
  },
  "status": "COMPLETED",
  "image": "http://.../img.jpg",
  "symptoms_audio": "http://.../audio.mp3",
  "medgemma_result": "Opacidad detectada...",
  "symptoms_text": "Tos y fiebre...",
  "combined_ai_analysis": "Análisis integrado...",
  "created_at": "2024-02-14T..."
}
```

---

## 3. Reportes Clínicos
**`POST /api/reports/`**
- **Payload:**
```json
{
  "study": 10,
  "doctor": 1,
  "final_diagnosis": "Neumonía confirmada",
  "recommendations": "Reposo y antibióticos"
}
```

---

## 4. Historia Clínica (Línea de tiempo)
**`GET /api/patients/<id>/history/`**
- **Respuesta (Lista de atenciones):**
```json
[
  {
    "id": 1,
    "title": "Resultados de IA para Estudio #10",
    "description": "Se completó el análisis de MedGemma...",
    "attachments_url": "http://.../file.pdf",
    "created_at": "2024-02-14T..."
  }
]
```
> [!NOTE]
> Este endpoint devuelve cronológicamente todas las interacciones con el paciente (análisis de IA, reportes médicos, diagnósticos finales, etc.).

---

## Tipos de Datos (Status)
- **Study Status:** `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- **Patient Status:** `ACTIVE`, `INACTIVE`
