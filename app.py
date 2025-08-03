from flask import Flask, render_template, request, jsonify, send_from_directory
import models
import utils
import os
import re
import json

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Remember to change this to a strong secret key

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Route for the new landing page
@app.route('/')
def landing():
    return render_template('landing.html')

# Route for the uploads page (previously '/index')
@app.route('/uploads')
def uploads_page():
    return render_template('uploads.html')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload', methods=['POST'])
def upload():
    question_files = request.files.getlist('question_papers')
    answer_files = request.files.getlist('answer_sheets')
    reference_files = request.files.getlist('references')
    grading_difficulty = request.form.get('grading_difficulty')

    if not any(question_files) and not any(answer_files):
        return jsonify({'error': 'Please select at least one question paper or answer sheet file.'}), 400

    question_paths = []
    answer_paths = []
    reference_paths = []

    for i, question_file in enumerate(question_files):
        if question_file and question_file.filename != '':
            question_filename = utils.save_file(question_file, app.config['UPLOAD_FOLDER'], prefix=f'question_{i+1}')
            question_paths.append(question_filename)

    for i, answer_file in enumerate(answer_files):
        if answer_file and answer_file.filename != '':
            answer_filename = utils.save_file(answer_file, app.config['UPLOAD_FOLDER'], prefix=f'answer_{i+1}')
            answer_paths.append(answer_filename)

    for i, reference_file in enumerate(reference_files):
        if reference_file and reference_file.filename != '':
            reference_filename = utils.save_file(reference_file, app.config['UPLOAD_FOLDER'], prefix=f'reference_{i+1}')
            reference_paths.append(reference_filename)

    # Store grading difficulty and reference paths in session or a temporary variable
    # Adjust this part as needed based on your preferred method
    temp_data = {
        'grading_difficulty': grading_difficulty,
        'reference_paths': reference_paths
    }

    return jsonify({'question_paths': question_paths, 'answer_paths': answer_paths, 'temp_data': temp_data})

@app.route('/grade')
def grade():
    question_paths = request.args.getlist('question_paths')
    answer_paths = request.args.getlist('answer_paths')
    temp_data = request.args.get('temp_data')
    
    grading_difficulty = None
    reference_paths_full = []

    if temp_data:
        try:
            temp_data_json = json.loads(temp_data)
            grading_difficulty = temp_data_json.get('grading_difficulty')
            reference_paths = temp_data_json.get('reference_paths', [])
            reference_paths_full = [os.path.join(app.config['UPLOAD_FOLDER'], path).replace('\\', '/') for path in reference_paths]
        except json.JSONDecodeError as e:
            print(f"Error decoding temp_data JSON: {e}")

    question_paths_full = [os.path.join(app.config['UPLOAD_FOLDER'], path).replace('\\', '/') for path in question_paths]
    answer_paths_full = [os.path.join(app.config['UPLOAD_FOLDER'], path).replace('\\', '/') for path in answer_paths]

    try:
        extracted_questions_path = models.extract_text_from_files(question_paths_full, app, is_question=True)
        extracted_answers_path = models.extract_text_from_files(answer_paths_full, app, is_question=False)

        # Pass grading difficulty and reference paths to your grading function
        graded_results = models.get_grades(extracted_questions_path, extracted_answers_path, grading_difficulty, reference_paths_full)

        if (
            graded_results is None
            or not graded_results
            or 'results' not in graded_results
            or 'total_marks' not in graded_results
            or 'obtained_marks' not in graded_results
        ):
            return jsonify({'error': 'Error processing grading results or no results returned.'}), 500

        return render_template(
            'results.html',
            results=graded_results['results'],
            total_marks=graded_results['total_marks'],
            obtained_marks=graded_results['obtained_marks'],
        )
    except Exception as e:
        print(f"Error in /grade route: {e}")
        return jsonify({'error': 'An error occurred while processing your request.'}), 500

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({'error': 'An internal error occurred. Please try again later.'}), 500

if __name__ == '__main__':
    app.run(debug=True)