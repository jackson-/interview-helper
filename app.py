from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import anthropic
import os
from dotenv import load_dotenv

# Load environment variables in development
if os.path.exists('.env'):
    load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Anthropic client
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

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

@app.route('/api/get-feedback', methods=['POST'])
def get_feedback():
    try:
        data = request.json
        position = data.get('position', '')
        question = data.get('question', '')
        answer = data.get('answer', '')
        
        if not all([position, question, answer]):
            return jsonify({'error': 'Missing required information'}), 400

        # Generate feedback using Claude
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1000,
            system="""You are an expert interview coach. Analyze the candidate's answer and provide detailed, constructive feedback.
Your feedback should include:
1. Overall assessment of the answer
2. Specific strengths demonstrated
3. Areas for improvement
4. A model answer that demonstrates how to better answer the question (if the candidate's answer needs improvement)
   - The model answer should be written in natural, conversational language as if someone was speaking it in an interview
   - Do NOT include any code snippets in the model answer
   - Focus on clear explanation and technical concepts
5. If relevant, include a separate "Code Examples" section after the model answer to show specific implementations
6. Key points that should have been covered (if any were missed)

Format your response in markdown with clear sections. If the answer was excellent, praise the specific elements that made it strong.
If improvements are needed, be constructive and provide specific examples of how to better structure or enhance the response.

Remember: The model answer should sound natural and conversational, like a confident candidate speaking in an interview.""",
            messages=[
                {
                    "role": "user",
                    "content": f"""Position: {position}
Question: {question}
Candidate's Answer: {answer}

Provide comprehensive feedback including a natural, spoken model answer if the candidate's response needs improvement."""
                }
            ]
        )
        
        feedback = message.content[0].text
        return jsonify({'feedback': feedback})
    
    except Exception as e:
        print("ERROR: ", e)
        return jsonify({'error': str(e)}), 500 