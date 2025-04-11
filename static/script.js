document.addEventListener('DOMContentLoaded', () => {
    const consentBanner = document.getElementById('consent-banner');
    const optionsModal = document.getElementById('options-modal');
    const consentButton = document.getElementById('consent');
    const doNotConsentButton = document.getElementById('doNotConsent');
    const manageOptionsButton = document.getElementById('manageOptions');
    const savePreferencesButton = document.getElementById('savePreferences');
    
    // Show consent banner if no preference is saved
    if (!localStorage.getItem('cookieConsent')) {
        consentBanner.style.display = 'block';
    }
    
    // Handle consent
    consentButton.addEventListener('click', () => {
        setConsent({
            essential: true,
            analytics: true,
            advertising: true
        });
        consentBanner.style.display = 'none';
    });
    
    // Handle do not consent
    doNotConsentButton.addEventListener('click', () => {
        setConsent({
            essential: true,
            analytics: false,
            advertising: false
        });
        consentBanner.style.display = 'none';
    });
    
    // Handle manage options
    manageOptionsButton.addEventListener('click', () => {
        optionsModal.style.display = 'block';
        // Load saved preferences
        const preferences = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
        document.getElementById('analytics').checked = preferences.analytics || false;
        document.getElementById('advertising').checked = preferences.advertising || false;
    });
    
    // Handle save preferences
    savePreferencesButton.addEventListener('click', () => {
        const preferences = {
            essential: true,
            analytics: document.getElementById('analytics').checked,
            advertising: document.getElementById('advertising').checked
        };
        setConsent(preferences);
        optionsModal.style.display = 'none';
        consentBanner.style.display = 'none';
    });
    
    // Close modal when clicking outside
    optionsModal.addEventListener('click', (e) => {
        if (e.target === optionsModal) {
            optionsModal.style.display = 'none';
        }
    });
    
    function setConsent(preferences) {
        localStorage.setItem('cookieConsent', JSON.stringify(preferences));
        
        // Enable/disable Google Analytics based on preferences
        if (preferences.analytics) {
            // Enable analytics
        }
        
        // Enable/disable ads based on preferences
        if (preferences.advertising) {
            // Enable ads
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    }
    
    // Check consent before loading ads
    function checkConsentBeforeLoadingAds() {
        const preferences = JSON.parse(localStorage.getItem('cookieConsent') || '{}');
        return preferences.advertising === true;
    }
    
    // Modify your existing ad loading code to check consent
    const lazyAds = document.querySelectorAll('[data-lazy-ad]');
    const lazyAdObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && checkConsentBeforeLoadingAds()) {
                const adContainer = entry.target;
                const adInsElement = document.createElement('ins');
                adInsElement.className = 'adsbygoogle';
                adInsElement.style.display = 'block';
                adInsElement.dataset.adClient = 'pub-9333248385214452';
                adInsElement.dataset.adSlot = 'YOUR-AD-SLOT';
                adInsElement.dataset.adFormat = 'auto';
                adInsElement.dataset.fullWidthResponsive = 'true';
                
                adContainer.appendChild(adInsElement);
                (adsbygoogle = window.adsbygoogle || []).push({});
                
                lazyAdObserver.unobserve(entry.target);
            }
        });
    });

    lazyAds.forEach(ad => lazyAdObserver.observe(ad));

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
        try {
            console.log("Sending for feedback:", {
                position: currentPosition,
                question: currentQuestion.textContent,
                answer: answer
            });
            
            statusText.textContent = 'Getting feedback...';
            feedback.innerHTML = '<p>Analyzing your answer...</p>';
            
            const response = await fetch('https://interview-helper-three.vercel.app/api/get-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    position: currentPosition,
                    question: currentQuestion.textContent,
                    answer: answer
                }),
                timeout: 60000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            feedback.innerHTML = marked.parse(data.feedback);
            statusText.textContent = 'Feedback ready';
            
        } catch (error) {
            console.error('Error:', error);
            feedback.innerHTML = `
                <div class="error-message">
                    <p>Sorry, there was an error getting feedback. This might be because:</p>
                    <ul>
                        <li>The response took too long (server timeout)</li>
                        <li>There was a network error</li>
                        <li>The server encountered an error</li>
                    </ul>
                    <p>Please try again. If the problem persists, try a shorter answer or refresh the page.</p>
                </div>
            `;
            statusText.textContent = 'Error getting feedback';
        }
    }
}); 