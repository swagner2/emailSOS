/* EmailDeliveryChecker.css */
:root {
  --primary: #4f46e5;
  --primary-light: #818cf8;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  line-height: 1.5;
  color: var(--gray-800);
  background: #f9fafb;
}

.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

header {
  background: linear-gradient(135deg, #0f2b5a 0%, #4f46e5 100%);
  color: white;
  padding: 3rem 1rem;
  text-align: center;
}

h1 {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.25rem;
  max-width: 800px;
  margin: 0 auto 1rem;
}

.highlight {
  font-weight: 600;
  font-size: 1.125rem;
  margin-top: 1.5rem;
}

section {
  padding: 3rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

.section-description {
  text-align: center;
  margin-bottom: 2rem;
}

.domain-form {
  display: flex;
  max-width: 600px;
  margin: 0 auto 2rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.domain-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--gray-300);
  font-size: 1rem;
  min-width: 250px;
}

.check-button, .calculate-button, .submit-button, .fix-it-button {
  background-color: var(--primary);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.check-button:hover, .calculate-button:hover, .submit-button:hover, .fix-it-button:hover {
  background-color: var(--primary-light);
}

.error-message {
  color: var(--danger);
  text-align: center;
  margin-bottom: 1rem;
}

.results-container {
  background-color: #f0fdf4;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #d1fae5;
}

.result-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  border-left: 4px solid var(--success);
  padding-left: 1rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 1rem;
}

.status-indicator.valid {
  background-color: var(--success);
}

.status-indicator.missing {
  background-color: var(--danger);
}

.status-indicator.warning {
  background-color: var(--warning);
}

.overall-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
