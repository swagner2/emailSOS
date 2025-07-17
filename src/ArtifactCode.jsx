import React, { useState, useEffect, useRef } from 'react';
import './EmailDeliveryChecker.css';

const EmailDeliveryChecker = () => {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [domainResults, setDomainResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    listSize: '',
    openRate: '',
    clickRate: '',
    conversionRate: '',
    emailsPerMonth: '',
  });
  const [calculationResults, setCalculationResults] = useState(null);
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  const handleDomainCheck = async (e) => {
    e.preventDefault();
    if (!domain) {
      setError('Please enter a domain');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Log domain visit even without email
      await fetch('/api/log-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      
      const response = await fetch('/api/check-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check domain');
      }
      
      const data = await response.json();
      setDomainResults(data);
      setShowEmailForm(true);
      
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculateROI = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/calculate-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculatorData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate ROI');
      }
      
      const data = await response.json();
      setCalculationResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/submit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          domain,
          results: domainResults,
          calculatorData,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit email');
      }
      
      // Success - email submitted
      setShowEmailForm(false);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCalculatorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container">
      <header>
        <h1>
          <span className="icon">📧</span> Email Delivery Checker & ROI Calculator
        </h1>
        <p className="subtitle">
          Find out if your emails are reaching inboxes—and how much revenue you're losing because they don't.
        </p>
        <div className="header-cta">
          <p className="highlight">Over 3,200 domains checked this month—are your emails being ignored?</p>
        </div>
      </header>

      <section className="client-logos">
        <h2>Trusted by leading brands</h2>
        <div className="logo-container">
          <div className="logo">Logo 1</div>
          <div className="logo">Logo 2</div>
          <div className="logo">Logo 3</div>
          <div className="logo">Logo 4</div>
          <div className="logo">Logo 5</div>
        </div>
      </section>

      <section className="testimonial">
        <div className="testimonial-content">
          <blockquote>
            "This tool helped us identify critical deliverability issues we didn't know existed. Our open rates increased by 22% after implementing the fixes!"
          </blockquote>
          <cite>— CEO, Tumblerware</cite>
        </div>
      </section>

      <section className="video-section">
        <h2>See how it works</h2>
        <div className="video-container">
          <iframe 
            src="https://www.youtube.com/embed/your-video-id" 
            title="Email Deliverability Explained" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </section>

      <section className="domain-checker" ref={resultsRef}>
        <h2>Domain Analysis Results</h2>
        <p className="section-description">Enter your domain for an instant analysis</p>
        
        <form onSubmit={handleDomainCheck} className="domain-form">
          <input
            type="text"
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="domain-input"
          />
          <button type="submit" className="check-button" disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Check My Domain'}
          </button>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        
        {domainResults && (
          <div className="results-container">
            <h3>Domain Analysis Results</h3>
            
            <div className="result-item">
              <div className={`status-indicator ${domainResults.spf.status}`}></div>
              <p>{domainResults.spf.message}</p>
            </div>
            
            <div className="result-item">
              <div className={`status-indicator ${domainResults.dmarc.status}`}></div>
              <p>{domainResults.dmarc.message}</p>
            </div>
            
            <div className="result-item">
              <div className={`status-indicator ${domainResults.dkim.status}`}></div>
              <p>{domainResults.dkim.message}</p>
            </div>
            
            <div className="result-item">
              <div className={`status-indicator ${domainResults.mx.status}`}></div>
              <p>{domainResults.mx.message}</p>
            </div>
            
            <div className={`overall-status ${domainResults.overallStatus.status}`}>
              <div className="status-icon">
                {domainResults.overallStatus.status === 'good' ? '✅' : 
                 domainResults.overallStatus.status === 'warning' ? '⚠️' : '❌'}
              </div>
              <p>{domainResults.overallStatus.message}</p>
              <p className="next-step">Want to improve your deliverability even further?</p>
            </div>
          </div>
        )}
      </section>

      <section className="testimonials">
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <div className="testimonial-avatar"></div>
            <div className="testimonial-text">
              <p>Fixed issues we didn't even know we had. Huge improvement!</p>
              <p className="testimonial-author">Greg</p>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-avatar"></div>
            <div className="testimonial-text">
              <p>A must for any serious email marketers</p>
              <p className="testimonial-author">Dave</p>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-avatar"></div>
            <div className="testimonial-text">
              <p>Great tool & super simple to use</p>
              <p className="testimonial-author">Lauren</p>
            </div>
          </div>
        </div>
      </section>

      <section className="roi-calculator">
        <h2>
          <span className="icon">✅</span> Get Your Deliverability Fix-It Plan
        </h2>
        <p className="section-description">Identify exactly what's hurting your inbox placement</p>
        
        {showEmailForm ? (
          <div className="email-capture-overlay">
            <div className="email-form-container">
              <h3>What email should we send the results to?</h3>
              <form onSubmit={handleEmailSubmit} className="email-form">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                  required
                />
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Get My Deliverability Fix-It Plan'}
                </button>
              </form>
            </div>
            <div className="blurred-results"></div>
          </div>
        ) : (
          <form onSubmit={handleCalculateROI} className="calculator-form">
            <p className="calculator-intro">Brands like yours typically see 18–25% open rates—how do you stack up?</p>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="listSize">Email List Size</label>
                <input
                  type="number"
                  id="listSize"
                  name="listSize"
                  placeholder="100000"
                  value={calculatorData.listSize}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="openRate">Current Open Rate (%)</label>
                <input
                  type="number"
                  id="openRate"
                  name="openRate"
                  placeholder="20"
                  value={calculatorData.openRate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clickRate">Click-Through Rate (%)</label>
                <input
                  type="number"
                  id="clickRate"
                  name="clickRate"
                  placeholder="3"
                  value={calculatorData.clickRate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="conversionRate">Conversion Rate (%)</label>
                <input
                  type="number"
                  id="conversionRate"
                  name="conversionRate"
                  placeholder="2"
                  value={calculatorData.conversionRate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emailsPerMonth">Emails Sent Per Month</label>
                <input
                  type="number"
                  id="emailsPerMonth"
                  name="emailsPerMonth"
                  placeholder="4"
                  value={calculatorData.emailsPerMonth}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="aov">Average Order Value ($)</label>
                <input
                  type="number"
                  id="aov"
                  name="aov"
                  placeholder="75"
                  value={calculatorData.aov}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <button type="submit" className="calculate-button" disabled={isLoading}>
              {isLoading ? 'Calculating...' : 'Calculate Revenue Impact'}
            </button>
          </form>
        )}
        
        {calculationResults && (
          <div className="calculation-results">
            <h3 className="impact-heading">
              <span className="icon">🔺</span> Monthly Revenue Impact
            </h3>
            
            <div className="impact-amount">
              ${calculationResults.monthlyRevenueLoss.toLocaleString()}
            </div>
            
            <p className="impact-description">
              You're potentially losing this every month due to poor email deliverability.
            </p>
            
            <p className="annual-impact">
              Annual impact: ${calculationResults.annualRevenueLoss.toLocaleString()}
            </p>
            
            <button 
              className="fix-it-button"
              onClick={() => setShowEmailForm(true)}
            >
              Get My Deliverability Fix-It Plan
            </button>
          </div>
        )}
      </section>

      <footer>
        <div className="footer-content">
          <div className="footer-links">
            <a href="#" target="_blank" rel="noopener noreferrer">Website</a>
            <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://linktr.ee/yourprofile" target="_blank" rel="noopener noreferrer">Linktree</a>
            <a href="https://cal.com/stevenwagner/inboxsos" target="_blank" rel="noopener noreferrer">Book a Call</a>
          </div>
          <p className="copyright">© {new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default EmailDeliveryChecker;
