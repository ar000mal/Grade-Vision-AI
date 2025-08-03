#models.py
import google.generativeai as genai
import os
from dotenv import load_dotenv
from PIL import Image, ImageEnhance
import re
import io
import json
import traceback
import math

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

generation_config = {
    'temperature': 0.4,
    'top_p': 1,
    'top_k': 32,
    'max_output_tokens': 4096,
}

safety_settings = [
    {
        'category': 'HARM_CATEGORY_HARASSMENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
        'category': 'HARM_CATEGORY_HATE_SPEECH',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
        'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
        'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
        'threshold': 'BLOCK_MEDIUM_AND_ABOVE',
    },
]

model = genai.GenerativeModel(
    model_name='gemini-1.5-flash-latest',
    generation_config=generation_config,
    safety_settings=safety_settings,
)

def extract_all_text_from_image(image_path, is_question=False):
    image = preprocess_image(image_path)
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    image_parts = [{'mime_type': 'image/png', 'data': img_byte_arr}]

    if is_question:
        prompt_parts = [
            """You are an expert at extracting all content from images of question papers. I will provide you with an image, and your task is to extract every single word, number, symbol, and any diagrams present in the image. For diagrams, provide a concise text description. Do not attempt to interpret or heavily structure the text; simply extract it as is, preserving the order as much as possible. Capture all text, including question text, labels on graphs or diagrams, and any other written content.

            Here is the image:
            """,
            image_parts[0],
        ]
    else:
        prompt_parts = [
            """You are an expert at extracting all content from images of answer sheets, including detailed descriptions of diagrams. I will provide you with an image, and your task is to extract every single word, number, and symbol present in the image.

            If there are diagrams, provide a detailed natural language description of the diagram. Focus on describing the diagram's key components, their attributes, and the relationships between them.

            For database architecture diagrams, include details about entities, tables, columns/fields, primary and foreign keys, relationships (one-to-one, one-to-many, many-to-many), and any visual elements indicating data flow or system interaction. For other types of diagrams, focus on clearly identifying the elements and their connections or relationships.

            For example, if it's a database architecture diagram, describe things like: 'There is a diagram illustrating the database architecture. It contains entities like 'Customers', 'Orders', and 'Products'. The 'Customers' entity has attributes such as 'CustomerID' (primary key), 'Name', and 'Address'. The 'Orders' entity has 'OrderID' (primary key), 'CustomerID' (foreign key referencing 'Customers'), and 'OrderDate'. There is a one-to-many relationship between 'Customers' and 'Orders', often visually represented by a line with specific markers at the ends.'

            Do not stop extracting after describing a diagram; continue to extract any text that follows. Do not attempt to interpret or heavily structure the text; simply extract it as is, preserving the order as much as possible. Capture all text, including answer text, question numbers (if present), and any other written content.

            Here is the image:
            """,
            image_parts[0],
        ]

    response = model.generate_content(prompt_parts)
    return response.text

def preprocess_image(image_path):
    image = Image.open(image_path)
    image = image.convert('L')
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    return image

def extract_text_from_files(file_paths, app, is_question=False):
    combined_text = []
    file_type = 'questions' if is_question else 'answers'
    output_filename = f'combined_raw_extracted_{file_type}.txt'

    for path in file_paths:
        if path.lower().endswith(('.png', '.jpg', '.jpeg')):
            extracted_text = extract_all_text_from_image(path, is_question=is_question)
            cleaned_text = clean_extracted_text(extracted_text)
            combined_text.append(cleaned_text)
        else:
            combined_text.append('Unsupported file format')

    combined_data = '\n\n'.join(combined_text)
    output_file_path = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
    with open(output_file_path, 'w', encoding='utf-8') as f:
        f.write(combined_data)

    return output_file_path

def clean_extracted_text(text):
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if line and not re.fullmatch(r'^[•●▪◦‣⁚∙⊙⋅❖]+$', line):
            line = line.replace('```', '')
            line = ' '.join(line.split())
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

def structure_extracted_text(raw_text_file_path):
    with open(raw_text_file_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    prompt = f"""You are an expert at analyzing unstructured text from exam papers to identify questions and their corresponding answers. I will provide you with a block of text extracted from an image of an exam paper. Your task is to:

    1. **Identify Questions:** Locate each question within the text. Look for question numbers, marks allocated, and the question text itself.
    2. **Identify Answers:** Locate the student's answer corresponding to each question. Answers might be located immediately after the question or in a nearby section of the text.
    3. **Structure the Data:** Organize the extracted information into a JSON format. Note that diagrams in answer sections will be represented by natural language text descriptions.

    **Input Text:**
    {raw_text}

    **Expected JSON Output Format:**
    ```json
    {{
        "questions_and_answers": [
            {{
                "question_number": "<question number>",
                "allocated_marks": "<marks allocated>",
                "question_text": "<complete question text>",
                "answer_text": "<complete answer text, including detailed natural language descriptions of diagrams>"
            }},
            // ... more questions and answers
        ]
    }}
    ```

    **Important Instructions:**
    * Extract the complete text for both questions and answers.
    * Be as accurate as possible in identifying question numbers and allocated marks.
    * If an exact association between a piece of text and a question/answer is unclear, make your best educated guess.
    * The JSON output should be valid and contain double quotes for keys and string values.
    * Do not include any text outside the JSON structure.
    """

    response = model.generate_content(prompt)
    return response.text

def get_grades(extracted_questions, extracted_answers, grading_difficulty=None, reference_paths=None):
    try:
        with open(extracted_questions, 'r', encoding='utf-8') as f:
            combined_questions = f.read()
        with open(extracted_answers, 'r', encoding='utf-8') as f:
            combined_answers = f.read()

        parsed_questions = parse_questions(combined_questions)

        reference_text = "No reference material provided. Grade based on general domain knowledge and question context."
        if reference_paths:
            reference_text = ""
            for ref_path in reference_paths:
                if ref_path.lower().endswith(('.png', '.jpg', '.jpeg')):
                    ref_text = extract_all_text_from_image(ref_path)
                    reference_text += clean_extracted_text(ref_text) + "\n"

        prompt = f"""
        You are an automated expert exam grading assistant. Grade these answers with extreme stringency and attention to detail.

        **Question Paper:**
        {combined_questions}

        **Student Answers:**
        {combined_answers}

        **Reference Context:**
        {reference_text}

        Critical Instructions:
        1. Grade according to the strictest academic standards
        2. Be extremely stringent with partial marks - only award marks for completely correct components
        3. Deduct marks for any minor technical inaccuracies
        4. For optional sections, identify all attempted answers
        5. For unanswered questions or blank responses, mark as 'unanswered' and assign 0 marks
        6. Start with a low base score and add marks only for demonstrably correct elements

        Generate your response in this JSON structure:
        {{
            "results": [
                {{
                    "question_number": "question number",
                    "question_text": "question text",
                    "allocated_marks": marks for this question,
                    "answer": "student's answer",
                    "acquired_marks": marks obtained,
                    "original_grade": "percentage grade",
                    "feedback": "detailed grading justification",
                    "is_optional": boolean indicating if this is from an optional section,
                    "is_answered": boolean indicating if question was attempted
                }}
            ],
            "total_marks": total possible marks,
            "obtained_marks": total marks obtained
        }}
        """

        response = model.generate_content(prompt)
        graded_results = parse_grading_response(response.text)

        if graded_results and 'results' in graded_results:
            optional_sets = {}
            for result in graded_results['results']:
                if result.get('is_optional'):
                    section_key = None
                    for q_data in parsed_questions:
                        if isinstance(q_data, dict) and q_data.get('is_optional_set'):
                            for q in q_data['questions']:
                                if q['question_number'] == result['question_number']:
                                    section_key = f"optional_set_{id(q_data)}"
                                    break
                            if section_key:
                                break
                    
                    if section_key:
                        if section_key not in optional_sets:
                            optional_sets[section_key] = []
                        optional_sets[section_key].append(result)

            # Added Default Value Here
            if grading_difficulty is None:
                grading_difficulty = 'normal'  # Set default difficulty to 'normal' or your preference

            difficulty_modifiers = {
                'liberal': {
                    'base_multiplier': 1.70,
                    'rounding': 'up'
                },
                'normal': {
                    'base_multiplier': 0.9,
                    'rounding': 'nearest'
                },
                'hard': {
                    'base_multiplier': 0.65,
                    'rounding': 'down'
                }
            }
            
            modifier = difficulty_modifiers[grading_difficulty]
            print(f"DEBUG - Using modifier: {modifier}")  # Add this line
            
            def adjust_score(score, allocated_marks, modifier):
                print(f"\nDEBUG: Starting score adjustment")
                print(f"Initial score: {score}")
                print(f"Allocated marks: {allocated_marks}")
                print(f"Base multiplier: {modifier['base_multiplier']}")
    
                adjusted = score * modifier['base_multiplier']
                print(f"After multiplication: {adjusted}")

                if modifier['rounding'] == 'up':
                    adjusted = math.ceil(adjusted * 2) / 2
                elif modifier['rounding'] == 'down':
                    adjusted = math.floor(adjusted * 2) / 2
                else:
                    adjusted = round(adjusted * 2) / 2
                print(f"After rounding: {adjusted}")

                if adjusted > allocated_marks:
                    adjusted = allocated_marks
                    print(f"Capped at allocated marks: {adjusted}")

                final = max(adjusted, 0)
                print(f"Final score: {final}")
    
                return final  # Ensure score isn't negative  # Ensure score isn't negative
            
            for result in graded_results['results']:
                original_marks = result['acquired_marks']
                result['acquired_marks'] = adjust_score(
                    original_marks,
                    result['allocated_marks'],
                    modifier
                )
                
                result['original_grade'] = f"{(result['acquired_marks'] / result['allocated_marks']) * 100:.1f}%"

            for results_in_set in optional_sets.values():
                if results_in_set:
                    highest_scoring = max(results_in_set, key=lambda x: x.get('acquired_marks', 0))
                    for result in results_in_set:
                        result['contributes_to_total'] = (result == highest_scoring)
            
            total_marks = 0
            obtained_marks = 0
            
            for result in graded_results['results']:
                if not result.get('is_optional'):
                    total_marks += result.get('allocated_marks', 0)
                    obtained_marks += result.get('acquired_marks', 0)
            
            for section_results in optional_sets.values():
                 if section_results:
                    total_marks += section_results[0].get('allocated_marks', 0)
                    obtained_marks += max(r.get('acquired_marks', 0) for r in section_results)
            
            graded_results['total_marks'] = total_marks
            graded_results['obtained_marks'] = round(obtained_marks * 2) / 2
            
        return graded_results
        
    except Exception as e:
        print(f"An error occurred in get_grades: {e}")
        traceback.print_exc()
        return None

def parse_questions(combined_questions):
    questions = []
    lines = combined_questions.strip().split('\n')
    is_optional_section = False
    current_optional_set = None
    current_section_marks = None

    print("Debug - Starting question parsing")
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        print(f"Debug - Processing line {i}: {line}")
        marks_match = re.search(r'Each Question carries (\d+(?:\.\d+)?)\s*marks', line, re.IGNORECASE)
        if marks_match:
            current_section_marks = float(marks_match.group(1))
            print(f"Debug - Found section marks: {current_section_marks}")
            continue

        optional_match = re.search(r'(?:PART\s+[A-D]|Answer\s+Any\s+\d+\s+Questions?)', line, re.IGNORECASE)
        if optional_match:
            print(f"Debug - Found optional section: {line}")
            is_optional_section = True
            if current_optional_set and current_optional_set.get('questions'):
                questions.append(current_optional_set)
            current_optional_set = {'is_optional_set': True, 'questions': []}
            continue

        question_match = re.match(r'(\d+)\.\s*(.*?)(?:\s*\(CO:|$)', line)
        if question_match:
            question_number = question_match.group(1)
            question_text = question_match.group(2).strip()
            allocated_marks = current_section_marks
            
            question_info = {
                'question_number': question_number,
                'question_text': question_text,
                'allocated_marks': allocated_marks
            }
            
            print(f"Debug - Found question {question_number} with marks {allocated_marks}")
            
            if is_optional_section and current_optional_set is not None:
                current_optional_set['questions'].append(question_info)
                print(f"Debug - Added to optional set, now has {len(current_optional_set['questions'])} questions")
            else:
                questions.append(question_info)
            continue
        
        if is_optional_section and current_optional_set and current_optional_set['questions']:
            current_optional_set['questions'][-1]['question_text'] += ' ' + line
        elif questions and not is_optional_section and isinstance(questions[-1], dict):
            questions[-1]['question_text'] += ' ' + line

    if current_optional_set and current_optional_set.get('questions'):
        questions.append(current_optional_set)

    print("\nDebug - Final parsed structure:")
    print(json.dumps(questions, indent=2))
    
    return questions

def parse_grading_response(json_string):
    json_string = re.sub(r'^.*?({.*}).*?$', r'\1', json_string, flags=re.DOTALL)
    json_string = json_string.replace('`', '')

    try:
        data = json.loads(json_string)
        return data
    except json.JSONDecodeError as e:
        print(f'Initial JSON decoding error: {e}')
        traceback.print_exc()
        try:
            missing_commas = re.finditer(r'(?<=")(?=[\{\[])', json_string)
            json_string = ''.join(
                c if i not in [m.start() for m in missing_commas] else ',' + c
                for i, c in enumerate(json_string)
            )
            data = json.loads(json_string)
            return data
        except json.JSONDecodeError as e:
            print(f'JSON decoding error after adding commas: {e}')
            traceback.print_exc()
        try:
            json_string = re.sub(
                r'(?<!\\)"(?=[^"]*"(?:[^"]*"[^"]*")*[^"]*$)',
                r'\\"',
                json_string,
            )
            data = json.loads(json_string)
            return data
        except json.JSONDecodeError as e:
            print(f'JSON decoding error after escaping quotes: {e}')
            traceback.print_exc()
            try:
                json_string = re.sub(
                    r'(?<!\\)"(?=[^"]*"(?:[^"]*"[^"]*")*[^"]*$)',
                    r'\\"',
                    json_string,
                )
                data = json.loads(json_string)
                return data
            except json.JSONDecodeError as e:
                print(
                    f'JSON decoding error after more aggressive escaping: {e}'
                )
                traceback.print_exc()
                try:
                    json_string = re.sub(r',\s*([\]}])', r'\1', json_string)
                    data = json.loads(json_string)
                    return data
                except json.JSONDecodeError as e:
                    print(
                        f'JSON decoding error after removing trailing commas: {e}'
                    )
                    traceback.print_exc()
                    try:
                        json_string = json_string.replace("'", '"')
                        data = json.loads(json_string)
                        return data
                    except json.JSONDecodeError as e:
                        print(
                            f'JSON decoding error after replacing single quotes: {e}'
                        )
                        traceback.print_exc()
    print(f'Failed to parse JSON after multiple attempts.')
    print(f'Original JSON string: {json_string}')
    return None