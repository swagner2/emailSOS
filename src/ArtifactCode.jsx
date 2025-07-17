import React, { useState, useEffect, useRef } from 'react';
// Remove this import: import './EmailDeliveryChecker.css';

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

  // Define all styles inline as JavaScript objects
  const styles = {
    container: {
      fontFamily: 'Inter, sans-serif',
      lineHeight: 1.5,
      color: '#1f2937',
      background: '#f9fafb',
      width: '100%',
      margin: '0 auto',
    },
    header: {
      background: 'linear-gradient(135deg, #0f2b5a 0%, #4f46e5 100%)',
      color: 'white',
      padding: '3rem 1rem',
      textAlign: 'center',
    },
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      marginBottom: '1rem',
    },
    subtitle: {
      fontSize: '1.25rem',
      maxWidth: '800px',
      margin: '0 auto 1rem',
    },
    highlight: {
      fontWeight: 600,
      fontSize: '1.125rem',
      marginTop: '1.5rem',
    },
    section: {
      padding: '3rem 1rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      marginBottom: '1.5rem',
      textAlign: 'center',
    },
    sectionDescription: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    domainForm: {
      display: 'flex',
      maxWidth: '600px',
      margin: '0 auto 2rem',
      gap: '0.5rem',
      flexWrap: 'wrap',
    },
    domainInput: {
      flex: '1',
      padding: '0.75rem 1rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      minWidth: '250px',
    },
    checkButton: {
      backgroundColor: '#4f46e5',
      color: 'white',
      fontWeight: 600,
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    errorMessage: {
      color: '#ef4444',
      textAlign: 'center',
      marginBottom: '1rem',
    },
    resultsContainer: {
      backgroundColor: '#f0fdf4',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      maxWidth: '800px',
      margin: '0 auto',
      border: '1px solid #d1fae5',
    },
    resultItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1rem',
      borderLeft: '4px solid #10b981',
      paddingLeft: '1rem',
    },
    statusIndicator: (status) => ({
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      marginRight: '1rem',
      backgroundColor: 
        status === 'valid' ? '#10b981' : 
        status === 'warning' ? '#f59e0b' : 
        '#ef4444',
    }),
    overallStatus: (status) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: '2rem',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      backgroundColor: 
        status === 'good' ? 'rgba(16, 185, 129, 0.1)' : 
        status === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
        'rgba(239, 68, 68, 0.1)',
    }),
    statusIcon: {
      fontSize: '2rem',
      marginBottom: '0.5rem',
    },
    nextStep: {
      marginTop: '1rem',
      fontWeight: 500,
    },
    testimonialGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2rem',
      justifyContent: 'center',
      margin: '2rem 0',
    },
    testimonialCard: {
      display: 'flex',
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      width: '300px',
    },
    testimonialAvatar: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#e5e7eb',
      marginRight: '1rem',
    },
    testimonialText: {
      flex: 1,
    },
    testimonialAuthor: {
      fontWeight: 600,
      marginTop: '0.5rem',
    },
    calculatorForm: {
      maxWidth: '800px',
      margin: '0 auto',
    },
    calculatorIntro: {
      textAlign: 'center',
      marginBottom: '2rem',
      fontWeight: 500,
    },
    formRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1.5rem',
      marginBottom: '1.5rem',
    },
    formGroup: {
      flex: '1',
      minWidth: '250px',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
    },
    calculateButton: {
      backgroundColor: '#4f46e5',
      color: 'white',
      fontWeight: 600,
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'block',
      margin: '2rem auto 0',
    },
    calculationResults: {
      maxWidth: '800px',
      margin: '2rem auto 0',
      padding: '2rem',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    impactHeading: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: '1.5rem',
      color: '#ef4444',
    },
    impactAmount: {
      fontSize: '3rem',
      fontWeight: 700,
      color: '#ef4444',
      marginBottom: '1rem',
    },
    impactDescription: {
      marginBottom: '1rem',
    },
    annualImpact: {
      fontWeight: 600,
      marginBottom: '2rem',
    },
    fixItButton: {
      backgroundColor: '#10b981',
      color: 'white',
      fontWeight: 600,
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    emailCaptureOverlay: {
      position: 'relative',
    },
    emailFormContainer: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 10,
      position: 'relative',
    },
    emailForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    emailInput: {
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
    },
    submitButton: {
      backgroundColor: '#10b981',
      color: 'white',
      fontWeight: 600,
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    blurredResults: {
      filter: 'blur(5px)',
      pointerEvents: 'none',
      userSelect: 'none',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 5,
    },
    footer: {
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '3rem 1rem',
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center',
    },
    footerLinks: {
      display: 'flex',
      justifyContent: 'center',
      gap: '2rem',
      flexWrap: 'wrap',
      marginBottom: '1.5rem',
    },
    footerLink: {
      color: 'white',
      textDecoration: 'none',
    },
    copyright: {
      color: '#9ca3af',
    },
    logoContainer: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '2rem',
      margin: '2rem 0',
    },
    logo: {
      width: '120px',
      height: '60px',
      backgroundColor: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '0.25rem',
    },
    clientLogos: {
      padding: '2rem 1rem',
      backgroundColor: 'white',
    },
    videoSection: {
      padding: '3rem 1rem',
    },
    videoContainer: {
      maxWidth: '800px',
      margin: '0 auto',
      aspectRatio: '16/9',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '0.5rem',
    },
    iframe: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      border: 'none',
    },
  };

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
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.h1}>
          <span>📧</span> Email Delivery Checker & ROI Calculator
        </h1>
        <p style={styles.subtitle}>
          Find out if your emails are reaching inboxes—and how much revenue you're losing because they don't.
        </p>
        <div>
          <p style={styles.highlight}>Over 3,200 domains checked this month—are your emails being ignored?</p>
        </div>
      </header>

      <section style={{...styles.section, ...styles.clientLogos}}>
