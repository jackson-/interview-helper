# Interview Helper

A real-time interview assistance application that listens to interview questions and provides AI-generated answers using Claude 3.7.

## Features

- Real-time speech recognition for interview questions
- AI-powered answer generation using Claude 3.7
- Modern, clean user interface
- Natural response timing (3-5 seconds)

## Prerequisites

- Python 3.7+
- Anthropic API key
- Modern web browser with speech recognition support (Chrome recommended)

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Running the Application

1. Activate the virtual environment if not already activated
2. Run the Flask application:
   ```bash
   python app.py
   ```
3. Open your web browser and navigate to `http://localhost:5000`
4. Click "Start Listening" to begin
5. Speak interview questions naturally
6. The application will generate and display answers within 3-5 seconds

## Usage Tips

- Use Chrome browser for best speech recognition support
- Ensure your microphone is properly connected and selected
- Speak clearly and naturally
- Wait for the answer to appear before asking the next question
- The application has a 5-second cooldown between questions to prevent duplicate processing

## Note

This application is for practice purposes only. Using it during actual interviews may be considered unethical or against interview policies. 