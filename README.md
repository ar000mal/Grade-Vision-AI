# 📚 Grade Vision AI

An AI-powered web application that automatically grades handwritten or printed answer sheets by extracting content from scanned images, matching it against question papers, and assigning scores with detailed feedback using Google Generative AI (Gemini).

---

## 🚀 Features

- 📄 Upload scanned **question papers** and **answer sheets**.
- 🔍 Uses AI to extract text and diagrams from images.
- 🧠 Grades answers based on strict academic standards.
- 📊 Outputs structured marksheets with feedback and scoring.
- 🎛️ Supports grading difficulty levels (liberal, normal, hard).
- 🌐 Clean web interface built using Flask + HTML/CSS/JS.

---

## 🛠️ Technologies Used

| Layer       | Technology |
|-------------|------------|
| Backend     | Python, Flask, Werkzeug |
| Frontend    | HTML, CSS, JavaScript |
| AI/ML       | Google Generative AI (Gemini), Prompt Engineering |
| Image Processing | Pillow (PIL) |
| Utilities   | python-dotenv (for environment management) |

---

## 📂 Project Structure

ExamGraderFinal/
├── app.py # Flask app entry point
├── models.py # AI logic for text extraction and grading
├── utils.py # File handling and upload logic
├── static/
│ ├── css/ # Stylesheets for UI
│ └── js/ # JavaScript for UI interactions
├── templates/ # HTML templates (not included in zip)
├── requirements.txt # Python dependencies
├── .env # API keys and environment variables



---

## ⚙️ Setup Instructions

#### 1. Clone the Repo

git clone https://github.com/yourusername/grade-vision-ai.git
cd grade-vision-ai/ExamGraderFinal
#### 2. Install Dependencies
bash
Copy code
pip install -r requirements.txt
#### 3. Configure Environment
Create a .env file with your Google Generative AI API key:

ini
Copy code
GOOGLE_API_KEY=your_api_key_here
UPLOAD_FOLDER=uploads
#### 4. Run the App
bash
Copy code
python app.py
Open your browser at http://127.0.0.1:5000/

### 🧪 How It Works
Upload scanned images of the question paper and the answer sheet.

The system extracts raw text from both images using Gemini.

Questions and answers are structured into JSON format.

The AI grades the answers based on content, correctness, and diagrams.

Graded marks, feedback, and optional section logic are processed and displayed.

### 📌 Example Use Case
Teachers, institutions, or auto-evaluation systems can use Grade Vision AI to speed up exam evaluations by uploading handwritten sheets and receiving structured and accurate grading reports.

### 🧠 Future Enhancements<br>
Add support for multiple answer scripts at once
Include optical mark recognition (OMR) for MCQs
Export grading reports as PDF
Admin dashboard for managing uploaded sheets

### 🤝 Contributors
<p>Aromal Prasad <br>
Arjun Satheesh <br>
Maharaja Hari Arjun <br>
Alfin Muhammed <br></p>

📄 License
<i>This project is licensed under the MIT License.</i>



