# MEDgemma Challenge Project

This repository contains the complete architecture for the **MEDgemma Challenge** project, divided into two main components: the backend and the frontend.

## Project Description

This project is a medical platform that integrates Artificial Intelligence to assist in the analysis of clinical cases. Its main features, based on its architecture, include:
- **Patient Management:** Registration and tracking of chronological medical history.
- **AI Analysis (MedGemma & MedASR):** Allows uploading and processing medical studies ranging from radiological images (X-Rays) to dermatological photographs and other types of medical images. It uses **MedGemma** to evaluate the images and **MedASR** to transcribe audios with the patient's symptoms, issuing a combined clinical analysis.
- **Diagnostic Interaction:** Includes an interactive chat interface where the patient describes their symptoms and the AI dynamically generates diagnostic alternatives and gathers more information.
- **Clinical Reports:** Facilitates doctors in creating final reports with diagnoses and recommendations based on the results of the interactive studies.

The project is structured into two parts, each hosted in its own subdirectory with its specific configuration and dependencies:

### 1. [MEDAI_BACKEND](./MEDAI_BACKEND)
Corresponds to the backend layer, developed with **Django** and **Django REST Framework**. 
- It handles the central logic of the application and database management (SQLite).
- It exposes the REST API endpoints for external consumption and manages files generated or uploaded by the platform.
- For instructions on how to start the local virtual environment, you can consult its main base in the [Backend README](./MEDAI_BACKEND/README.md).

### 2. [challengeMG_FORNTEND-main](./challengeMG_FORNTEND-main)
Corresponds to the frontend layer (client interface), developed using modern tools such as **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.
- It provides the visual interface with which users interact, connecting to the backend APIs.
- For instructions on package installation (`pnpm` or `npm`) and starting the server in development mode, go to its [Frontend README](./challengeMG_FORNTEND-main/README.md).

---

## How to run the project (Summary)

To run the full project flow in your local environment, you need to keep both parts running at the same time:

**Step 1: Start Backend Server**
- In a terminal, navigate to the `/MEDAI_BACKEND` folder.
- Start the virtual environment, install the `requirements.txt` file, and run `python manage.py runserver`.

**Step 2: Start Frontend Interface**
- In another new terminal, navigate to the `/challengeMG_FORNTEND-main` folder.
- Install the dependencies and run `npm run dev` (or `pnpm dev`).
- Open the localhost shown by Vite in the web browser.
"# MedAI-Smart-Triage" 
