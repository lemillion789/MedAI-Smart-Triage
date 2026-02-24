import os
import re
import time
import torch
try:
    import librosa
except ImportError:
    librosa = None
import warnings
import logging
from PIL import Image
from transformers import pipeline, BitsAndBytesConfig, AutoProcessor
from transformers import logging as transformers_logging

# Silence verbose AI warnings and logs
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)
transformers_logging.set_verbosity_error()
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class MedGemma15Processor:
    """
    Singleton processor for MedGemma 1.5.
    Handles image analysis and integrated clinical reporting.
    """
    _instance = None
    _pipe = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MedGemma15Processor, cls).__new__(cls)
        return cls._instance

    def _get_pipeline(self):
        if os.environ.get("MOCK_AI") == "True":
            return "MOCK_MODE"
            
        if self._pipe is None:
            hf_token = os.environ.get("HF_TOKEN")
            if not hf_token:
                raise ValueError("HF_TOKEN environment variable not set. Please set it for Hugging Face access.")

            # 4-bit quantization for VRAM efficiency
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_use_double_quant=True
            )

            print("Loading MedGemma 1.5 model...")
            self._pipe = pipeline(
                "image-text-to-text",
                model="google/medgemma-1.5-4b-it",
                model_kwargs={
                    "quantization_config": bnb_config,
                    "low_cpu_mem_usage": True
                },
                device_map="auto",
                token=hf_token
            )
            print(f"MedGemma 1.5 loaded.")
        return self._pipe

    def analyze_image(self, image_file_path):
        """Stage 1: Generate technical findings following notebook format."""
        prompt = (
            "Describe this medical image. \n"
            "You must strictly follow this output format:\n"
            "1. Provide your detailed anatomical observations starting with [OBSERVATIONS].\n"
            "2. You MUST include a section titled exactly '[IRREGULARITIES]' followed by a explanation of the irregularities in the image.\n"
            "3. At the very end of your response, you MUST include a section titled exactly '[PATHOLOGIES]' followed by a comma-separated list of the top 1 to 3 possible diseases or conditions.\n"
            "Example:\n"
            "[OBSERVATIONS] The image is a lateral view of a human left femur\n"
            "[IRREGULARITIES] The lesion exhibits irregular borders and uneven coloration\n"
            "[PATHOLOGIES] Pneumonia, Lung Mass, Tuberculosis\n"
            "Note: Provide the response in English."
        )
        return self._query_model(prompt, image_path=image_file_path, persona="expert")

    def extract_symptoms(self, raw_transcript):
        """Extracts medical symptoms from raw ASR text and formats them as a list."""
        if not raw_transcript or len(raw_transcript) < 5:
            return raw_transcript if raw_transcript else "No symptoms reported."
            
        prompt = (
            f"TEXT: {raw_transcript}\n\n"
            "TASK: Extract the medical symptoms mentioned in the text above cleanly.\n"
            "RULES:\n"
            "1. DO NOT include intros or explanations.\n"
            "2. Return a single descriptive text string."
        )
        return self._query_model(prompt, persona="expert")

    def run_triage_step(self, history):
        """Executes a single step of the triage conversation."""
        # Use a large token limit for the chat steps
        output = self._query_model(None, history=history, max_tokens=1500)
        return output

    def generate_final_soap_report(self, initial_symptoms, findings, triage_history):
        """Stage 3: Generate the final SOAP report after triage completion."""
        # Extract findings parts
        obs_text = "See findings."
        irreg_text = findings
        path_text = "N/A"
        
        if "[OBSERVATIONS]" in findings and "[IRREGULARITIES]" in findings and "[PATHOLOGIES]" in findings:
            part1 = findings.split("[IRREGULARITIES]")
            obs_text = part1[0].replace("[OBSERVATIONS]", "").strip()
            part2 = part1[1].split("[PATHOLOGIES]")
            irreg_text = part2[0].strip()
            path_text = part2[1].strip()

        # Find the final diagnosis in triage history
        final_diagnosis = "Pendiente."
        for msg in reversed(triage_history):
            if msg['role'] == 'assistant':
                text_content = "".join(item.get('text', '') for item in msg['content'])
                if '[DIAGNOSIS]' in text_content:
                    final_diagnosis = text_content.split('[DIAGNOSIS]')[-1].strip()
                    break

        report_md = f"""# 🏥 Automated Clinical Triage Report (SOAP)

---

## 🗣️ [S] Subjective
**Reason for consultation and history:**
> *"{initial_symptoms}"*

## 📸 [O] Objective
**Image Observations:**
{obs_text}

**Specific Irregularities:**
{irreg_text}

## 🧠 [A] Assessment
{final_diagnosis}

## 📋 [P] Plan
* **Action Required:** Immediate referral for in-person clinical validation by a specialist.
* **Note:** This is an AI-generated pre-diagnosis that requires mandatory validation by a human doctor.
"""
        return report_md

    def _clean_integrated_report(self, raw_text):
        """Surgically cleans only the integrated report, removing AI plans/thought blocks."""
        # 1. Recovery: Mandatory start at first header
        if "##" in raw_text:
             raw_text = raw_text[raw_text.find("##"):].strip()

        # 2. Rule-Stripper: Remove lines that look like AI planning items or rules
        lines = raw_text.split('\n')
        cleaned_lines = []
        for line in lines:
            # Skip lines that are just numbers followed by instructions (AI echoing rules)
            if re.match(r'^\d+[\.\)]\s*(Formal|Integrate|Start|Follow|No internal|Only|Summary|Explain)', line, re.IGNORECASE):
                continue
            # Skip common "echo" markers from the prompt rules
            if any(marker in line for marker in ["FORBIDDEN", "OBLIGATORIO", "REGLAS CRÍTICAS", "EJEMPLO"]):
                continue
            cleaned_lines.append(line)
        
        cleaned_text = "\n".join(cleaned_lines).strip()
        
        # 3. Final polish
        cleaned_text = re.sub(r'^(thought|reasoning|plan).*?\n', '', cleaned_text, flags=re.IGNORECASE)
        return cleaned_text

    def _clean_ai_output(self, raw_text):
        """Restoring exact notebook logic: use rfind to get the final decision."""
        # This matches the Notebook's logic exactly
        pos_diag = raw_text.rfind("[DIAGNOSIS]")
        pos_ask = raw_text.rfind("[ASK]")
        
        if pos_diag > pos_ask:
            return raw_text[pos_diag:].strip()
        elif pos_ask > pos_diag:
            return raw_text[pos_ask:].strip()
        else:
            return raw_text.strip()

    def _query_model(self, text, image_path=None, history=None, persona="default", max_tokens=800):
        pipe = self._get_pipeline()
        if pipe == "MOCK_MODE":
            return f"[MOCK] Response for: {text[:50] if text else 'History'}"
            
        messages = []
        
        if history:
            messages = history
        else:
            content = []
            if image_path:
                img = Image.open(image_path)
                content.append({"type": "image", "image": img})
            
            if persona == "expert":
                system_instruction = "You are a medical expert with vast experience in clinical and imaging diagnosis. Respond in English."
            else:
                system_instruction = "Respond directly in English."
                
            content.append({"type": "text", "text": f"{system_instruction}\n\n{text}"})
            messages = [{"role": "user", "content": content}]

        with torch.inference_mode():
            output = pipe(
                text=messages,
                max_new_tokens=max_tokens,
                do_sample=False,
                pad_token_id=1,
                repetition_penalty=1.15
            )
        
        raw_text = output[0]["generated_text"][-1]["content"].strip()
        raw_text = self._clean_ai_output(raw_text)
        print(f"AI OUTPUT: {raw_text[:100]}...")
        return raw_text

    def _extract_medical_sections(self, text):
        """Surgically extracts ## headers and their content, discarding everything else."""
        # Find all ## sections. Uses a lookahead to handle sections without newlines between them.
        sections = re.findall(r'(##\s+[A-ZÁÉÍÓÚÑ -]+.*?(?=##|\Z))', text, re.DOTALL | re.IGNORECASE)
        valid_sections = []
        
        # Keywords that indicate the model is just echoing the prompt instructions
        noise_keywords = [
            "Summarize the relationship", "State the medical conclusion", "List the recommended next steps",
            "(Escribe aquí", "Target Format:", "Plan:", "I will", "I need", "**Plan", "translate"
        ]
        
        for s in sections:
            header_match = re.search(r'##\s+[A-ZÁÉÍÓÚÑ -]+', s, re.IGNORECASE)
            if not header_match:
                continue
            
            header = header_match.group(0).strip()
            content = s[header_match.end():].strip()
            
            # Surgically remove any noise keywords from the BEGINNING of the content
            # (where they are usually echoed as instructions)
            for nk in noise_keywords:
                # Remove common leading punctuation after echoes like ":", "**", etc.
                content = re.sub(rf'^[*:\s-]*{re.escape(nk)}[*:\s-]*', '', content, flags=re.IGNORECASE)
            
            # Strip any remaining instruction-like placeholder text
            content = re.sub(r'^\s*\(.*?\)\s*', '', content)
            
            if content and len(content) > 5:
                valid_sections.append(f"{header}\n{content.strip()}")
        
        if valid_sections:
            return "\n\n".join(valid_sections)
        return text

    def _deduplicate_sentences(self, text):
        """Removes redundant sentences or keywords that are semantically very similar."""
        if not text:
            return ""
        
        # Clean up any existing bullet prefixes to avoid "- - -"
        text = re.sub(r'^[ \-*·•]+', '', text, flags=re.MULTILINE)
        
        # Split by typical sentence enders OR common delimiters used by this model (*, -, \n, |)
        parts = re.split(r'(?<=[.!?]) +|[\n\r\*\|]+', text)
        unique_parts = []
        seen_normalized = set()

        for p in parts:
            p = p.strip()
            if not p:
                continue
            
            # Remove "FINDINGS:" or "IMPRESSION:" prefix if model repeats it inside the section
            p = re.sub(r'^(FINDINGS|IMPRESSION|DIAGNOSIS|RESULTADOS|HALLAZGOS):', '', p, flags=re.IGNORECASE).strip()
            
            # Normalize for comparison: lowercase, remove punctuation/bullets
            norm = re.sub(r'[^a-zA-Z0-9]', '', p.lower())
            
            # Avoid too short junk but allow common medical short terms (e.g. "CHF")
            if not norm or len(norm) < 3:
                continue
                
            if norm not in seen_normalized:
                seen_normalized.add(norm)
                unique_parts.append(p)

        # Optimization: Limit to top 15 findings to prevent runaway loops
        unique_parts = unique_parts[:15]

        # Re-format as a clean list for clarity
        return "\n".join([" - " + s for s in unique_parts]).strip()

class MedASRProcessor:
    """
    Singleton processor for MedASR.
    Handles high-accuracy medical audio transcription.
    """
    _instance = None
    _asr_pipeline = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MedASRProcessor, cls).__new__(cls)
        return cls._instance

    def _get_pipeline(self):
        if os.environ.get("MOCK_AI") == "True":
            return "MOCK_MODE"
            
        if self._asr_pipeline is None:
            device = 0 if torch.cuda.is_available() else -1
            print("Loading MedASR model...")
            self._asr_pipeline = pipeline(
                "automatic-speech-recognition",
                model="google/medasr",
                device=device,
            )
            print("MedASR loaded.")
        return self._asr_pipeline

    def _normalize_output(self, text):
        """Standard normalization from user notebook."""
        if not text:
            return ""
        text = text.lower()
        text = text.replace('</s>', '')
        # Remove special tokens like <epsilon> if they persist
        text = text.replace("<epsilon>", "")
        # Allow Spanish characters: a-z, 0-9, spaces, apostrophes, and accents/ñ
        text = re.sub(r"[^ a-z0-9'áéíóúñ]", ' ', text)
        return " ".join(text.split()).strip()

    def transcribe(self, audio_file):
        pipe = self._get_pipeline()
        if pipe == "MOCK_MODE":
            return "[MOCK TRANSCRIPTION] The patient presents mild symptoms of cough and fatigue."
            
        if not librosa:
            return "Error: librosa is not installed on the server."
            
        try:
            # If it's a FieldFile or similar, get the path. If it's already a path, use it.
            path = audio_file.path if hasattr(audio_file, 'path') else audio_file
            
            # Load the audio. librosa.load can take a path string or a file-like object.
            # We use sr=16000 as required by MedASR.
            audio, sr = librosa.load(path, sr=16000)
            # Match the parameters from the user's successful notebook call
            result = pipe(
                {"raw": audio, "sampling_rate": sr}, 
                chunk_length_s=20, 
                stride_length_s=2
            )
            raw_text = result.get("text", "")
            print(f"DEBUG: MedASR raw text: {raw_text}")
            clean_text = self._normalize_output(raw_text)
            print(f"DEBUG: MedASR clean text: {clean_text}")
            return clean_text
        except Exception as e:
            return f"Error during transcription: {str(e)}"

class IntegratedAIProcessor:
    """Coordinates the 2-stage multi-modal workflow."""
    def __init__(self):
        self.medgemma = MedGemma15Processor()
        self.medasr = MedASRProcessor()

    def process_consultation(self, study):
        print(f"\n--- [AI START] Processing Study #{study.id} ---")
        # Stage 1: Acquisition (Pure transcription and findings)
        if study.image:
            print(f"[{time.strftime('%H:%M:%S')}] 📸 Stage 1.1: Analyzing Medical Image (MedGemma)...")
            study.medgemma_result = self.medgemma.analyze_image(study.image.path)
            print(f"[{time.strftime('%H:%M:%S')}] ✅ Image Analysis Done.")
        
        raw_transcript = ""
        if study.symptoms_audio:
            print(f"[{time.strftime('%H:%M:%S')}] 🎙️ Stage 1.2: Transcribing Patient Audio (MedASR)...")
            try:
                # Pass the path string directly to avoid pickling issues with open files
                audio_path = study.symptoms_audio.path
                print(f"DEBUG: Processing audio from path: {audio_path}")
                raw_transcript = self.medasr.transcribe(audio_path)
            except ValueError:
                # Fallback if file not saved to disk yet
                print("DEBUG: Processing audio from FieldFile (not yet on disk)")
                raw_transcript = self.medasr.transcribe(study.symptoms_audio)
        
        if raw_transcript:
            print(f"[{time.strftime('%H:%M:%S')}] ✨ Stage 1.3: Extracting Medical Symptoms from Transcript...")
            study.symptoms_text = self.medgemma.extract_symptoms(raw_transcript)
        else:
            study.symptoms_text = "No symptoms reported via audio."

        print(f"[{time.strftime('%H:%M:%S')}] 🤖 Stage 2: Initializing Triage Conversation...")
        TRIAGE_SYSTEM_PROMPT = """You are an automated clinical triage assistant. Your role is to act as a structured intermediary between the patient and the human doctor.
Your goal is to ask precise questions to narrow down symptoms and generate a short differential pre-diagnosis that will later be reviewed by the doctor.

STRICT OPERATING RULES:
1. EVALUATION: You will receive the patient's symptoms, objective image irregularities, and a list of 'Suggested Pathologies' from a radiologist AI. Your primary task is to ask targeted questions to differentiate, rule in, or rule out these specific pathologies.
2. FORMAT RESTRICTION: Every question MUST be strictly multiple-choice, with a maximum of 5 options (letters A, B, C, D, E).
3. THE LAST OPTION: The last letter of your options MUST ALWAYS be: "None of the above".
4. QUESTION LIMIT: You must never exceed a maximum of 7 questions throughout the triage.
5. ACTION TAGS:
   - To ask, use EXACTLY: [ASK]
   - To give the result, use EXACTLY: [DIAGNOSIS]

STRICT FORMAT FOR ASKING:
[ASK] [Write your clinical question here]?
A) [Specific option 1]
B) [Specific option 2]
C) [Specific option 3]
D) [Specific option 4]
E) None of the above

STRICT FORMAT FOR THE PRE-DIAGNOSIS:
[DIAGNOSIS]
* Ranked Pre-diagnosis: 
  1. [Most Probable Illness] - [Brief reason why it's the top match based on symptoms/imaging]
  2. [Less Probable Illness] - [Brief reason why it's less likely]
  3. [Least Probable Illness] - [Brief reason why it's the least likely or what symptom is missing]
  (Note: Adjust numbering based on the number of suspected conditions provided by the radiologist).
* Clinical summary (Symptoms + Imaging): [Brief summary cross-referencing what the patient said and what the imaging showed]
* Suggested urgency level: [Low / Medium / High]
* Note: This is an AI-generated pre-diagnosis that requires mandatory validation by a human doctor.
"""
        findings = study.medgemma_result or ""
        obs_text = ""
        irreg_text = ""
        path_text = ""

        try:
            if "[OBSERVATIONS]" in findings and "[IRREGULARITIES]" in findings and "[PATHOLOGIES]" in findings:
                part1 = findings.split("[IRREGULARITIES]")
                obs_text = part1[0].replace("[OBSERVATIONS]", "").strip()
                part2 = part1[1].split("[PATHOLOGIES]")
                irreg_text = part2[0].strip()
                path_text = part2[1].strip()
            else:
                obs_text = "See raw findings."
                irreg_text = findings
                path_text = "No structured pathologies provided."
        except Exception as e:
            obs_text = "Parsing error."
            irreg_text = findings
            path_text = "Error extracting pathologies."

        initial_message = f"""
--- INITIAL PATIENT DATA ---

1. REPORTED SYMPTOMS (Subjective):
{study.symptoms_text}

2. GENERAL IMAGE OBSERVATIONS:
{obs_text}

3. SPECIFIC IMAGE IRREGULARITIES:
{irreg_text}

4. RADIOLOGIST'S SUGGESTED PATHOLOGIES:
{path_text}
------------------------------------
Please act as the triage doctor. Analyze this cross-referenced data and begin the triage to differentiate the suggested pathologies.
"""
        study.triage_history = [
            {"role": "user", "content": [{"type": "text", "text": TRIAGE_SYSTEM_PROMPT}]},
            {"role": "assistant", "content": [{"type": "text", "text": "Understood. I am ready to evaluate the patient."}]},
            {"role": "user", "content": [{"type": "text", "text": initial_message}]}
        ]
        
        # Get first question
        print(f"[{time.strftime('%H:%M:%S')}] ❓ Generating first triage question...")
        first_q = self.medgemma.run_triage_step(study.triage_history)
        study.triage_history.append({"role": "assistant", "content": [{"type": "text", "text": first_q}]})
        
        if "[DIAGNOSIS]" in first_q:
            print(f"[{time.strftime('%H:%M:%S')}] 🏁 Triage finished on first step. Generating final SOAP report...")
            study.triage_completed = True
            study.status = 'COMPLETED'
            study.combined_ai_analysis = self.medgemma.generate_final_soap_report(
                study.symptoms_text,
                study.medgemma_result,
                study.triage_history
            )
        else:
            study.combined_ai_analysis = first_q # Current output for the user
            study.status = 'PROCESSING'
        
        study.save()
        print(f"[{time.strftime('%H:%M:%S')}] --- [AI READY] Response generated. ---")
        return study

    def continue_triage(self, study, user_answer):
        """Processes the user's answer and gets the next step from the triage bot."""
        # Combine user answer with system instruction if limit reached to avoid consecutive 'user' roles
        content_text = f"The patient chose option: {user_answer}"
        
        q_count = 0
        for msg in study.triage_history:
            if msg['role'] == 'assistant':
                msg_content = msg.get('content', [])
                if isinstance(msg_content, list):
                    text_content = "".join(item.get('text', '') for item in msg_content if isinstance(item, dict))
                else:
                    text_content = str(msg_content)
                if '[ASK]' in text_content:
                    q_count += 1
        
        if q_count >= 7:
            content_text += "\n\n[SYSTEM INSTRUCTION]: You have reached the question limit. Issue EXACTLY the final [DIAGNOSIS] format right now based on the information you have. DO NOT ask more questions."


        study.triage_history.append({"role": "user", "content": [{"type": "text", "text": content_text}]})

        print(f"[{time.strftime('%H:%M:%S')}] 🤖 Processing triage answer and generating next step...")
        next_step = self.medgemma.run_triage_step(study.triage_history)
        # Ensure next_step is wrapped if it's not already
        study.triage_history.append({"role": "assistant", "content": [{"type": "text", "text": next_step}]})
        
        if "[DIAGNOSIS]" in next_step:
            print(f"[{time.strftime('%H:%M:%S')}] 🏁 Triage finished. Generating final SOAP report...")
            study.triage_completed = True
            study.status = 'COMPLETED'
            # Final synthesis
            study.combined_ai_analysis = self.medgemma.generate_final_soap_report(
                study.symptoms_text,
                study.medgemma_result,
                study.triage_history
            )
            print(f"[{time.strftime('%H:%M:%S')}] ✅ SOAP Report Generated.")
        else:
            study.combined_ai_analysis = next_step # Still asking
            print(f"[{time.strftime('%H:%M:%S')}] ❓ Next question ready.")
            
        study.save()
        return study
