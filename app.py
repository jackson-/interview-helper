from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import anthropic
import os
from dotenv import load_dotenv
import threading
import queue
import time

# Load environment variables in development
if os.path.exists('.env'):
    load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Store feedback results
feedback_store = {}

def generate_feedback_async(position, question, answer, request_id):
    try:
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1000,
            temperature=0.7,
            system="You are an expert interview coach providing concise, actionable feedback. Focus on: 1. Brief overall assessment (2-3 sentences) 2. Key strengths (bullet points) 3. Main areas for improvement (bullet points) 4. Short model answer example if needed",
            messages=[{
                "role": "user",
                "content": f"Position: {position}\nQuestion: {question}\nCandidate's Answer: {answer}\n\nProvide focused feedback on this interview response."
            }]
        )
        feedback_store[request_id] = {
            'status': 'complete',
            'feedback': message.content[0].text
        }
    except Exception as e:
        feedback_store[request_id] = {
            'status': 'error',
            'error': str(e)
        }

@app.route('/api/start-feedback', methods=['POST'])
def start_feedback():
    try:
        data = request.json
        position = data.get('position', '')
        question = data.get('question', '')
        answer = data.get('answer', '')
        
        if not all([position, question, answer]):
            return jsonify({'error': 'Missing required information'}), 400

        # Generate unique request ID
        request_id = str(time.time())
        
        # Store initial status
        feedback_store[request_id] = {'status': 'processing'}
        
        # Start async processing
        thread = threading.Thread(
            target=generate_feedback_async,
            args=(position, question, answer, request_id)
        )
        thread.start()
        
        return jsonify({
            'request_id': request_id,
            'status': 'processing'
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-feedback/<request_id>', methods=['GET'])
def check_feedback(request_id):
    result = feedback_store.get(request_id, {'status': 'not_found'})
    
    # Clean up completed requests older than 5 minutes
    current_time = time.time()
    for rid in list(feedback_store.keys()):
        if current_time - float(rid) > 300:  # 5 minutes
            del feedback_store[rid]
    
    return jsonify(result)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/get-question', methods=['POST'])
def get_question():
    try:
        data = request.json
        position = data.get('position', '')
        
        if not position:
            return jsonify({'error': 'No position provided'}), 400

        # Generate interview question using Claude
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=150,
            temperature=1.0,
            system="You are an expert technical interviewer. Generate a challenging but relevant interview question for the specified position. Only return the question itself, nothing else.",
            messages=[
                {
                    "role": "user",
                    "content": f"Generate a relevant interview question for a {position} position."
                }
            ]
        )
        
        question = message.content[0].text
        return jsonify({'question': question})
    
    except Exception as e:
        print("ERROR: ", e)
        return jsonify({'error': str(e)}), 500 