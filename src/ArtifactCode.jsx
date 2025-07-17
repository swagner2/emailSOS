import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, AlertCircle, Calculator, Download, Users, TrendingUp, Shield, Eye, EyeOff, Play, Star, ExternalLink } from 'lucide-react';

const EmailDeliveryChecker = () => {
  const [domain, setDomain] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [listSize, setListSize] = useState('');
  const [avgOrderValue, setAvgOrderValue] = useState('');
  const [openRate, setOpenRate] = useState('');
  const [clickRate, setClickRate] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [showGuideCapture, setShowGuideCapture] = useState(false);
  const [roiResults, setRoiResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Klaviyo API integration
  const addToKlaviyoList = async (email, listId, source = 'roi-tool') => {
    try {
      const response = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
        method: 'POST',
        headers: {
          'Authorization': 'Klaviyo-API-Key Mzfpkb',
          'Content-Type': 'application/json',
          'revision': '2024-10-15'
        },
        body: JSON.stringify({
          data: {
            type: 'profile-subscription-bulk-create-job',
            attributes: {
              profiles: {
                data: [{
                  type: 'profile',
                  attributes: {
                    email: email,
                    subscriptions: {
                      email: {
                        marketing: {
                          consent: 'SUBSCRIBED'
                        }
                      }
                    },
                    properties: {
                      source: source,
                      domain_checked: domain,
                      timestamp: new Date().toISOString()
                    }
                  }
                }]
              },
              historical_import: false
            },
            relationships: {
              list: {
                data: {
                  type: 'list',
                  id: listId
                }
              }
            }
          }
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Klaviyo API error:', error);
      return false;
    }
  };

  // Google Sheets integration
  const saveToGoogleSheets = async (data) => {
    try {
      // This would need your Google Apps Script URL or Google Sheets API integration
      console.log('Saving to Google Sheets:', data);
      // Implementation depends on your Google Sheets setup
    } catch (error) {
      console.error('Google Sheets error:', error);
    }
  };

  // DNS Record Checking using Google DNS API
  const checkDNSRecords = async (domain) => {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    try {
      const dnsQueries = [
        { name: `_dmarc.${cleanDomain}`, type: 'TXT', recordType: 'DMARC' },
        { name: cleanDomain, type: 'TXT', recordType: 'SPF' },
        { name: `default._domainkey.${cleanDomain}`, type: 'TXT', recordType: 'DKIM' }
      ];

      const results = await Promise.all(
        dnsQueries.map(async (query) => {
          try {
            const response = await fetch(
              `https://dns.google/resolve?name=${query.name}&type=${query.type}`,
              { headers: { 'Accept': 'application/json' } }
            );
            const data = await response.json();
            return { ...query, data, success: true };
          } catch (error) {
            return { ...query, error: true, success: false };
          }
        })
      );

      return analyzeDNSResults(results, cleanDomain);
    } catch (error) {
      console.error('DNS check error:', error);
      return null;
    }
  };

  const analyzeDNSResults = (dnsResults, domain) => {
    const analysis = {
      domain,
      dmarc: { status: 'fail', record: null, issues: [], score: 0 },
      spf: { status: 'fail', record: null, issues: [], score: 0 },
      dkim: { status: 'fail', record: null, issues: [], score: 0 },
      overallScore: 0,
      hasIssues: true
    };

    dnsResults.forEach(result => {
      if (result.recordType === 'DMARC') {
        if (result.data?.Answer?.length > 0) {
          const record = result.data.Answer[0].data;
          analysis.dmarc.record = record;
          
          if (record.includes('v=DMARC1')) {
            analysis.dmarc.status = 'pass';
            analysis.dmarc.score = 30;
            
            if (record.includes('p=reject') || record.includes('p=quarantine')) {
              analysis.dmarc.score = 35;
            }
          } else {
            analysis.dmarc.issues.push('Invalid DMARC record format');
          }
        } else {
          analysis.dmarc.issues.push('No DMARC record found');
        }
      }

      if (result.recordType === 'SPF') {
        if (result.data?.Answer?.length > 0) {
          const records = result.data.Answer.filter(r => r.data.includes('v=spf1'));
          if (records.length > 0) {
            analysis.spf.record = records[0].data;
            analysis.spf.status = 'pass';
            analysis.spf.score = 35;
            
            if (records.length > 1) {
              analysis.spf.issues.push('Multiple SPF records found');
              analysis.spf.score = 20;
            }
          }
        } else {
          analysis.spf.issues.push('No SPF record found');
        }
      }

      if (result.recordType === 'DKIM') {
        if (result.data?.Answer?.length > 0) {
          analysis.dkim.record = result.data.Answer[0].data;
          analysis.dkim.status = 'pass';
          analysis.dkim.score = 35;
        } else {
          analysis.dkim.issues.push('DKIM record not found or not properly configured');
        }
      }
    });

    analysis.overallScore = analysis.dmarc.score + analysis.spf.score + analysis.dkim.score;
    analysis.hasIssues = analysis.overallScore < 85;

    return analysis;
  };

  const calculateROI = () => {
    const currentRevenue = (listSize * (openRate / 100) * (clickRate / 100) * avgOrderValue) * 12;
    const optimizedOpenRate = Math.max(22, openRate); // Benchmark 22%
    const optimizedRevenue = (listSize * (optimizedOpenRate / 100) * (clickRate / 100) * avgOrderValue) * 12;
    const potentialGain = optimizedRevenue - currentRevenue;
    
    const roiData = {
      currentRevenue: currentRevenue,
      optimizedRevenue: optimizedRevenue,
      potentialGain: potentialGain,
      currentOpenRate: openRate,
      benchmarkOpenRate: optimizedOpenRate,
      improvementNeeded: optimizedOpenRate > openRate
    };

    setRoiResults(roiData);
    return roiData;
  };

  const handleDomainCheck = async (e) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setCurrentStep(2);

    // Save domain even if user doesn't complete the process
    await saveToGoogleSheets({
      domain,
      timestamp: new Date().toISOString(),
      completed: false
    });

    const dnsResults = await checkDNSRecords(domain);
    setResults(dnsResults);
    setLoading(false);
    
    if (dnsResults?.hasIssues) {
      setShowEmailCapture(true);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!userEmail) return;

    setEmailSubmitted(true);
    setShowEmailCapture(false);
    setCurrentStep(3);

    // Add to Klaviyo ROI tool list
    await addToKlaviyoList(userEmail, 'TCapS8', 'roi-tool');

    // Save complete data to Google Sheets
    await saveToGoogleSheets({
      domain,
      email: userEmail,
      results: results,
      timestamp: new Date().toISOString(),
      completed: true,
      step: 'email-captured'
    });
  };

  const handleGuideRequest = async (e) => {
    e.preventDefault();
    if (!guideEmail) return;

    // Add to Klaviyo guide list
    await addToKlaviyoList(guideEmail, 'U42FCU', 'guide-request');
    
    setShowGuideCapture(false);
    alert('✅ Your Deliverability Fix-It Plan will be sent to your email shortly!');
  };

  const handleROICalculation = async (e) => {
    e.preventDefault();
    const roiData = calculateROI();
    setCurrentStep(4);

    // Save ROI calculation to Google Sheets
    await saveToGoogleSheets({
      domain,
      email: userEmail,
      roiData,
      listSize,
      avgOrderValue,
      openRate,
      clickRate,
      timestamp: new Date().toISOString(),
      step: 'roi-calculated'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusIcon = (status) => {
    if (status === 'pass') return <CheckCircle style={{ color: '#10B981' }} size={20} />;
    return <XCircle style={{ color: '#EF4444' }} size={20} />;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          lineHeight: '1.2'
        }}>
          Over 3,200 domains checked this month—are your emails being ignored?
        </h1>
        <p style={{
          fontSize: '1.2rem',
          opacity: 0.9,
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Check your email deliverability and calculate the revenue impact in seconds
        </p>
      </div>

      {/* Client Logos Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '40px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Trusted by leading brands</p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          flexWrap: 'wrap'
        }}>
          {['TechCorp', 'InnovateLab', 'GrowthCo', 'ScaleUp', 'NextGen'].map(logo => (
            <div key={logo} style={{
              padding: '10px 20px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              color: '#4b5563',
              fontWeight: '600'
            }}>
              {logo}
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial */}
      <div style={{
        backgroundColor: '#fef7f0',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            {[1,2,3,4,5].map(star => (
              <Star key={star} size={20} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
            ))}
          </div>
          <blockquote style={{
            fontSize: '1.1rem',
            fontStyle: 'italic',
            color: '#374151',
            marginBottom: '20px'
          }}>
            "After fixing our email deliverability issues, we saw a 47% increase in email revenue within 30 days. The ROI was immediate and substantial."
          </blockquote>
          <cite style={{
            color: '#6b7280',
            fontWeight: '600'
          }}>
            — Sarah Johnson, CEO at Tumblerware
          </cite>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px'
      }}>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px',
          gap: '20px'
        }}>
          {[
            { step: 1, label: 'Check Domain' },
            { step: 2, label: 'View Results' },
            { step: 3, label: 'Enter Email' },
            { step: 4, label: 'Calculate ROI' }
          ].map(({ step, label }) => (
            <div key={step} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: currentStep >= step ? '#667eea' : '#e5e7eb',
                color: currentStep >= step ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {step}
              </div>
              <span style={{
                color: currentStep >= step ? '#667eea' : '#6b7280',
                fontWeight: '500',
                fontSize: '14px'
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Domain Input */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '30px',
            color: '#1f2937'
          }}>
            Check Your Email Deliverability
          </h2>
          
          <form onSubmit={handleDomainCheck} style={{
            display: 'flex',
            gap: '15px',
            maxWidth: '600px',
            margin: '0 auto',
            flexDirection: window.innerWidth < 640 ? 'column' : 'row'
          }}>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter your domain (e.g., example.com)"
              style={{
                flex: 1,
                padding: '15px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#667eea',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? 'Checking...' : 'Check Now'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {results && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '40px',
            position: 'relative'
          }}>
            
            {/* Blur overlay when email capture is needed */}
            {showEmailCapture && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '40px',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                  maxWidth: '500px',
                  width: '90%'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#1f2937'
                  }}>
                    What email should we send the results to?
                  </h3>
                  <form onSubmit={handleEmailSubmit}>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter your email address"
                      style={{
                        width: '100%',
                        padding: '15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        marginBottom: '20px',
                        outline: 'none'
                      }}
                      required
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '15px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Get Full Results + ROI Calculator
                    </button>
                  </form>
                </div>
              </div>
            )}

            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '30px',
              color: '#1f2937'
            }}>
              Email Infrastructure Report for {results.domain}
            </h3>

            {/* Overall Score */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: getScoreColor(results.overallScore),
                marginBottom: '10px'
              }}>
                {results.overallScore}/100
              </div>
              <p style={{
                color: '#6b7280',
                fontSize: '1.1rem'
              }}>
                Overall Deliverability Score
              </p>
            </div>

            {/* Individual Checks */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {['dmarc', 'spf', 'dkim'].map(check => (
                <div key={check} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      textTransform: 'uppercase'
                    }}>
                      {check}
                    </h4>
                    {getStatusIcon(results[check].status)}
                  </div>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    marginBottom: '10px'
                  }}>
                    Score: {results[check].score}/35
                  </p>
                  {results[check].issues.length > 0 && (
                    <div>
                      {results[check].issues.map((issue, idx) => (
                        <p key={idx} style={{
                          color: '#ef4444',
                          fontSize: '14px',
                          marginBottom: '5px'
                        }}>
                          • {issue}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROI Calculator */}
        {emailSubmitted && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            marginBottom: '40px'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '20px',
              color: '#1f2937'
            }}>
              Revenue Impact Calculator
            </h3>
            <p style={{
              textAlign: 'center',
              color: '#6b7280',
              marginBottom: '30px',
              fontSize: '1.1rem'
            }}>
              Brands like yours typically see 18–25% open rates—how do you stack up?
            </p>

            <form onSubmit={handleROICalculation} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Email List Size
                </label>
                <input
                  type="number"
                  value={listSize}
                  onChange={(e) => setListSize(e.target.value)}
                  placeholder="10000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Average Order Value ($)
                </label>
                <input
                  type="number"
                  value={avgOrderValue}
                  onChange={(e) => setAvgOrderValue(e.target.value)}
                  placeholder="75"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Current Open Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={openRate}
                  onChange={(e) => setOpenRate(e.target.value)}
                  placeholder="15.5"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Click-Through Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={clickRate}
                  onChange={(e) => setClickRate(e.target.value)}
                  placeholder="2.5"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Calculator size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Calculate Revenue Impact
                </button>
              </div>
            </form>

            {/* ROI Results */}
            {roiResults && (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '30px',
                marginTop: '30px'
              }}>
                <h4 style={{
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  marginBottom: '20px',
                  color: '#065f46'
                }}>
                  Your Revenue Impact Analysis
                </h4>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      color: '#dc2626'
                    }}>
                      {formatCurrency(roiResults.currentRevenue)}
                    </div>
                    <p style={{ color: '#6b7280' }}>Current Annual Revenue</p>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      color: '#059669'
                    }}>
                      {formatCurrency(roiResults.optimizedRevenue)}
                    </div>
                    <p style={{ color: '#6b7280' }}>Potential Annual Revenue</p>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.8rem',
                      fontWeight: 'bold',
                      color: '#7c3aed'
                    }}>
                      {formatCurrency(roiResults.potentialGain)}
                    </div>
                    <p style={{ color: '#6b7280' }}>Annual Revenue Gain</p>
                  </div>
                </div>

                {roiResults.improvementNeeded && (
                  <div style={{
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    padding: '15px',
                    marginTop: '15px'
                  }}>
                    <p style={{
                      color: '#92400e',
                      fontWeight: '600',
                      marginBottom: '5px'
                    }}>
                      💡 Opportunity Identified:
                    </p>
                    <p style={{ color: '#92400e' }}>
                      By improving your open rate from {roiResults.currentOpenRate}% to {roiResults.benchmarkOpenRate}%, 
                      you could generate an additional {formatCurrency(roiResults.potentialGain)} annually.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VSL Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: '#1f2937'
          }}>
            Watch: How We Fixed 47% Revenue Drop in 30 Days
          </h3>
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '60px 20px',
            marginBottom: '20px'
          }}>
            <Play size={64} style={{ color: '#667eea', marginBottom: '15px' }} />
            <p style={{ color: '#6b7280' }}>Video placeholder - Add your VSL embed here</p>
          </div>
        </div>

        {/* Action Buttons */}
        {roiResults && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {/* Guide CTA */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <h4 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                marginBottom: '15px',
                color: '#1f2937'
              }}>
                Get Your Fix-It Plan
              </h4>
              <p style={{
                color: '#6b7280',
                marginBottom: '20px'
              }}>
                Get our step-by-step guide to fix your email deliverability issues
              </p>
              <button
                onClick={() => setShowGuideCapture(true)}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ✅ Get My Deliverability Fix-It Plan
              </button>
            </div>

            {/* Calendar CTA */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <h4 style={{
                fontSize: '1.3rem',
                fontWeight: 'bold',
                marginBottom: '15px',
                color: '#1f2937'
              }}>
                Let Us Fix It For You
              </h4>
              <p style={{
                color: '#6b7280',
                marginBottom: '20px'
              }}>
                Book a call with our team to get your deliverability fixed professionally
              </p>
              <a
                href="https://cal.com/stevenwagner/inboxsos"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#667eea',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '15px 25px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  width: '100%'
                }}
              >
                🚀 Hire Us to Fix It
              </a>
            </div>
          </div>
        )}

        {/* Guide Email Capture Modal */}
        {showGuideCapture && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                color: '#1f2937'
              }}>
                Get Your Free Deliverability Fix-It Plan
              </h3>
              <form onSubmit={handleGuideRequest}>
                <input
                  type="email"
                  value={guideEmail}
                  onChange={(e) => setGuideEmail(e.target.value)}
                  placeholder="Enter your email address"
                  style={{
                    width: '100%',
                    padding: '15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    marginBottom: '20px',
                    outline: 'none'
                  }}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowGuideCapture(false)}
                    style={{
                      flex: 1,
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '15px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Send Me The Guide
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h4 style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            Connect With Us
          </h4>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              <ExternalLink size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Website
            </a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              <ExternalLink size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              LinkedIn
            </a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              <ExternalLink size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Linktree
            </a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>
              <ExternalLink size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
              Other
            </a>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            © 2025 Email Deliverability Solutions. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EmailDeliveryChecker;
