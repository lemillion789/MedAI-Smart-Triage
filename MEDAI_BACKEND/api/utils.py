import os
import re
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.units import inch

def generate_clinical_report_pdf(clinical_report):
    """Generates a professional medical report in PDF format."""
    study = clinical_report.study
    patient = study.patient
    
    # PDF File Path
    pdf_filename = f"report_{clinical_report.id}_{study.id}.pdf"
    relative_path = os.path.join('reports', 'pdfs', pdf_filename)
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    doc = SimpleDocTemplate(full_path, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=22,
        spaceAfter=20,
        textColor=colors.HexColor("#2C3E50"),
        alignment=1 # Center
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor("#2980B9"),
        borderPadding=5,
        thickness=1
    )
    
    body_style = styles['Normal']
    body_style.fontSize = 11
    body_style.leading = 14

    story = []

    # Title
    story.append(Paragraph("CLINICAL DIAGNOSTIC REPORT", title_style))
    story.append(Spacer(1, 12))

    # Patient Info Table
    info_data = [
        [Paragraph(f"<b>Patient:</b> {patient.first_name} {patient.last_name}", body_style), 
         Paragraph(f"<b>ID:</b> {patient.dni}", body_style)],
        [Paragraph(f"<b>Age:</b> {patient.age} years", body_style), 
         Paragraph(f"<b>Date:</b> {clinical_report.created_at.strftime('%m/%d/%Y')}", body_style)]
    ]
    
    t = Table(info_data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.whitesmoke),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # Integrated Analysis Section
    if study.triage_completed:
        story.append(Paragraph("TRIAGE REPORT (SOAP)", section_style))
        analysis = study.combined_ai_analysis or "Analysis pending."
        
        # Robust Markdown-ish to HTML conversion for ReportLab
        # Remove only potential problematic non-Latin1 characters (emojis) 
        # while keeping Spanish accents.
        analysis = re.sub(r'[^\x00-\x7f\x80-\xff]', '', analysis)
        
        # Format compacted list items and stars from the AI
        analysis = re.sub(r'(?<!\n)\s*(\d+\.\s)', r'\n\n\1', analysis)
        analysis = re.sub(r'(?<!\n)\s*(\*\s)', r'\n\n\1', analysis)
        analysis = re.sub(r'(?<!\n)\s*(\(Note:)', r'\n\n\1', analysis)
        
        # Convert headers and bold
        analysis = analysis.replace('\n', '<br/>')
        # Simple regex for headers # or ##
        analysis = re.sub(r'(#+)\s*(.*?)(<br/>|$)', r'<b>\2</b>\3', analysis)
        # Simple regex for **bold**
        analysis = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', analysis)
        # Handle lines starting with *
        analysis = re.sub(r'^\*\s*', r'• ', analysis, flags=re.MULTILINE)
        
        story.append(Paragraph(analysis, body_style))
    else:
        story.append(Paragraph("RADIOLOGICAL FINDINGS (MedGemma AI)", section_style))
        findings = study.medgemma_result or "No findings reported."
        findings = findings.replace('\n', '<br/>').replace(' - ', '• ')
        story.append(Paragraph(findings, body_style))
        story.append(Spacer(1, 15))

        if study.symptoms_text:
            story.append(Paragraph("REPORTED SYMPTOMS (Medical Transcription)", section_style))
            story.append(Paragraph(study.symptoms_text, body_style))
            story.append(Spacer(1, 15))

        story.append(Paragraph("ANALYSIS AND DIAGNOSTIC IMPRESSION", section_style))
        analysis = study.combined_ai_analysis or "Triage in progress..."
        story.append(Paragraph(analysis, body_style))

    story.append(Spacer(1, 25))

    # Doctor Final Conclusion
    story.append(Paragraph("FINAL MEDICAL CONCLUSION", section_style))
    story.append(Paragraph(clinical_report.final_diagnosis or "Subject to medical review.", body_style))
    if clinical_report.recommendations:
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>Recommendations:</b> {clinical_report.recommendations}", body_style))

    # Build PDF
    doc.build(story)
    
    # Save path to report model
    clinical_report.report_pdf = relative_path
    clinical_report.save()
    
    return full_path
    
