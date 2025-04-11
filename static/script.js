document.addEventListener('DOMContentLoaded', () => {
    const startPracticeButton = document.getElementById('startPractice');
    const nextQuestionButton = document.getElementById('nextQuestion');
    const recordButton = document.getElementById('recordButton');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const currentQuestion = document.getElementById('currentQuestion');
    const userAnswer = document.getElementById('userAnswer');
    const feedback = document.getElementById('feedback');
    
    let recognition = null;
    let isRecording = false;
    let currentPosition = '';
    let fullTranscript = '';
    let lastInterimTranscript = '';
    
    // Add a premium features check
    const isPremiumUser = false; // Set this based on user's subscription status
    
    function checkPremiumAccess() {
        if (!isPremiumUser) {
            return `
                <div class="premium-overlay">
                    <h3>Premium Feature</h3>
                    <p>Get detailed feedback and model answers with our premium plan</p>
                    <button onclick="showSubscriptionModal()">Upgrade Now</button>
                </div>
            `;
        }
        return '';
    }
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            isRecording = true;
            statusIndicator.classList.add('active');
            statusText.textContent = 'Recording your answer...';
            recordButton.textContent = 'Stop Recording';
            fullTranscript = '';
            lastInterimTranscript = '';
            userAnswer.textContent = '';
        };
        
        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            }
        };
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            const currentResults = Array.from(event.results).slice(-1);
            
            for (const result of currentResults) {
                const transcript = result[0].transcript.trim();
                
                if (result.isFinal) {
                    if (!fullTranscript.includes(transcript)) {
                        finalTranscript += transcript + ' ';
                        fullTranscript += finalTranscript;
                    }
                } else {
                    interimTranscript = transcript;
                }
            }

            userAnswer.textContent = fullTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            statusText.textContent = 'Error: ' + event.error;
        };
    }
    
    // Start Practice Session
    startPracticeButton.addEventListener('click', () => {
        currentPosition = document.getElementById('position').value.trim();
        if (!currentPosition) {
            alert('Please enter the position you\'re interviewing for');
            return;
        }
        
        // Hide setup form and show practice section
        document.querySelector('.setup-form').style.display = 'none';
        document.querySelector('.practice-section').style.display = 'block';
        
        // Get first question
        getNextQuestion();
    });
    
    // Get Next Question
    nextQuestionButton.addEventListener('click', getNextQuestion);
    
    // Record Answer
    recordButton.addEventListener('click', () => {
        if (!isRecording) {
            fullTranscript = '';
            lastInterimTranscript = '';
            userAnswer.textContent = '';
            feedback.innerHTML = '';
            recognition.start();
        } else {
            isRecording = false;
            recognition.stop();
            statusIndicator.classList.remove('active');
            statusText.textContent = 'Processing your answer...';
            recordButton.textContent = 'Record Answer';
            
            const cleanTranscript = fullTranscript.trim();
            if (cleanTranscript) {
                getFeedback(cleanTranscript);
            }
        }
    });
    
    async function getNextQuestion() {
        try {
            currentQuestion.textContent = 'Loading question...';
            userAnswer.textContent = '';
            feedback.textContent = '';
            
            const response = await fetch('/api/get-question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ position: currentPosition }),
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            currentQuestion.textContent = data.question;
            statusText.textContent = 'Click Record to answer the question';
            
        } catch (error) {
            console.error('Error:', error);
            currentQuestion.textContent = 'Error loading question. Please try again.';
        }
    }
    
    async function getFeedback(answer) {
        if (!isPremiumUser) {
            // Show basic feedback only
            feedback.innerHTML = `
                <div class="basic-feedback">
                    <p>Basic Feedback Available</p>
                    ${checkPremiumAccess()}
                </div>
            `;
            return;
        }
        try {
            console.log("Sending for feedback:", {
                position: currentPosition,
                question: currentQuestion.textContent,
                answer: answer
            });
            
            statusText.textContent = 'Getting feedback...';
            feedback.innerHTML = '<p>Analyzing your answer...</p>';
            
            const response = await fetch('/api/get-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: currentPosition,
                    question: currentQuestion.textContent,
                    answer: answer
                }),
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            feedback.innerHTML = marked.parse(data.feedback);
            statusText.textContent = 'Ready for next question';
            
        } catch (error) {
            console.error('Error:', error);
            feedback.innerHTML = '<p class="error">Error getting feedback. Please try again.</p>';
            statusText.textContent = 'Error getting feedback';
        }
    }
}); 