# Backend Project - MEDgemma

This is the main backend of the project, developed using Django and Django REST Framework. It contains the core application logic, database management, and the API endpoints.

## Prerequisites

- Python 3.10 or higher

## Instructions to Run the Project Locally

Follow these steps to run the backend server in your local environment:

1. **Create a virtual environment (recommended):**
   Open a terminal at the root of this project and run:
   ```bash
   python -m venv .venv
   ```

2. **Activate the virtual environment:**
   - On **Windows**:
     ```bash
     .venv\Scripts\activate
     ```
   - On **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   Once the virtual environment is activated, install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables (.env):**
   Make sure to create a `.env` file in the same directory as the `manage.py` file if there are necessary variables. *(Note: do not commit actual keys to the repository)*.

5. **Migrations:**
   *Note: The current SQLite database (with all its data) is committed to the repository by default. You only need to run this command if you add new models.* 
   ```bash
   python manage.py migrate
   ```

6. **Run the Development Server:**
   Finally, start the server with:
   ```bash
   python manage.py runserver
   ```
   The server will be available by default at: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## Important Notes on the Repository

At the request of the developers, this repository has been configured in the `.gitignore` file to temporarily **INCLUDE** the following items in version control:
- Local database (`db.sqlite3`)
- Uploaded files (`media/`)
- Studies and Images (`studies/`)
- Generated reports (`reports/`)

This means that when you clone the repository or get the latest version, you will already have all the data and files (images, audio, PDFs) ready to run without additional configuration.
