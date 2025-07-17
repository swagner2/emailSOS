import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Mail, DollarSign, TrendingUp, Play, Calendar, ExternalLink } from 'lucide-react';

export default function EmailDeliveryChecker() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showROI, setShowROI] = useState(false);
  const [roiData, setRoiData] = useState({
    listSize: '',
    averageOrderValue: '',
    openRate: '',
    clickRate: '',
    emailsPerMonth: ''
  });
  const [calculatedROI, setCalculatedROI] = useState(null);

  // Klaviyo API integration
  const addToKlaviyo = async (email, listId) => {
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
                    }
                  }
                }]
              }
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
      console.error('Klaviyo error:', error);
      return false;
    }
  };

  // DNS record checking using Google DNS API
  const checkDNSRecords = async (domain) => {
    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
      
      const checks = {
        spf: await checkSPF(cleanDomain),
        dkim: await checkDKIM(cleanDomain),
        dmarc: await checkDMARC(cleanDomain),
        mx: await checkMX(cleanDomain)
      };

      return {
        domain: cleanDomain,
        ...checks,
        overall: calculateOverallScore(checks)
      };
    } catch (error) {
      console.error('DNS check error:', error);
      return null;
    }
  };

  const checkSPF = async (domain) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
      const data = await response.json();
      
      if (data.Answer) {
        const spfRecord = data.Answer.find(record => 
          record.data.includes('v=spf1')
        );
        
        if (spfRecord) {
          return {
            status: 'good',
            record: spfRecord.data,
            message: 'Valid SPF record found'
          };
        }
      }
      
      return {
        status: 'error',
        record: null,
        message: 'No SPF record found'
      };
    } catch (error) {
      return {
        status: 'error',
        record: null,
        message: 'Error checking SPF record'
      };
    }
  };

  const checkDKIM = async (domain) => {
    try {
      const selectors = ['default', 'selector1', 'selector2', 'k1', 'google'];
      
      for (const selector of selectors) {
        try {
          const response = await fetch(`https://dns.google/resolve?name=${selector}._domainkey.${domain}&type=TXT`);
          const data = await response.json();
          
          if (data.Answer && data.Answer.length > 0) {
            const dkimRecord = data.Answer.find(record => 
              record.data.includes('v=DKIM1')
            );
            
            if (dkimRecord) {
              return {
                status: 'good',
                record: `${selector}._domainkey.${domain}`,
                message: 'DKIM record found'
              };
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      return {
        status: 'warning',
        record: null,
        message: 'No DKIM record found with common selectors'
      };
    } catch (error) {
      return {
        status: 'error',
        record: null,
        message: 'Error checking DKIM record'
      };
    }
  };

  const checkDMARC = async (domain) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`);
      const data = await response.json();
      
      if (data.Answer) {
        const dmarcRecord = data.Answer.find(record => 
          record.data.includes('v=DMARC1')
        );
        
        if (dmarcRecord) {
          return {
            status: 'good',
            record: dmarcRecord.data,
            message: 'Valid DMARC record found'
          };
        }
      }
      
      return {
        status: 'error',
        record: null,
        message: 'No DMARC record found'
      };
    } catch (error) {
      return {
        status: 'error',
        record: null,
        message: 'Error checking DMARC record'
      };
    }
  };

  const checkMX = async (domain) => {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const data = await response.json();
      
      if (data.Answer && data.Answer.length > 0) {
        return {
          status: 'good',
          record: `${data.Answer.length} mail servers found`,
          message: 'MX records configured properly'
        };
      }
      
      return {
        status: 'error',
        record: null,
        message: 'No MX records found'
      };
    } catch (error) {
      return {
        status: 'error',
        record: null,
        message: 'Error checking MX records'
      };
    }
  };

  const calculateOverallScore = (checks) => {
    const scores = Object.values(checks).map(check => {
      if (check.status === 'good') return 100;
      if (check.status === 'warning') return 50;
      return 0;
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleDomainCheck = async () => {
    if (!domain.trim()) return;
    
    setLoading(true);
    const result = await checkDNSRecords(domain);
    setResults(result);
    setLoading(false);
    
    if (result) {
      setTimeout(() => setShowEmailCapture(true), 2000);
    }
  };

  const handleEmailSubmit = async () => {
    if (!userEmail.trim()) return;
    
    await addToKlaviyo(userEmail, 'TCapS8');
    setShowEmailCapture(false);
    setShowROI(true);
  };

  const calculateROIImpact = () => {
    const listSize = parseInt(roiData.listSize) || 0;
    const aov = parseFloat(roiData.averageOrderValue) || 0;
    const openRate = parseFloat(roiData.openRate) || 0;
    const clickRate = parseFloat(roiData.clickRate) || 0;
    const emailsPerMonth = parseInt(roiData.emailsPerMonth) || 0;

    const currentRevenue = listSize * (openRate / 100) * (clickRate / 100) * aov * emailsPerMonth;
    const improvedOpenRate = Math.min(openRate + 8, 25);
    const improvedRevenue = listSize * (improvedOpenRate / 100) * (clickRate / 100) * aov * emailsPerMonth;
    const monthlyImpact = improvedRevenue - currentRevenue;
    const annualImpact = monthlyImpact * 12;

    setCalculatedROI({
      currentRevenue,
      improvedRevenue,
      monthlyImpact,
      annualImpact,
      openRateImprovement: improvedOpenRate - openRate
    });
  };

  const handleGuideRequest = async () => {
    if (!userEmail.trim()) return;
    await addToKlaviyo(userEmail, 'U42FCU');
    alert('Guide sent! Check your email in the next few minutes.');
  };

  const getStatusIcon = (status) => {
    if (status === 'good') return <CheckCircle color="#48bb78" size={20} />;
    if (status === 'warning') return <AlertTriangle color="#ed8936" size={20} />;
    return <XCircle color="#f56565" size={20} />;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', color: 'white', padding: '60px 20px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '15px' }}>
          📧 Email Delivery Checker & ROI Calculator
        </h1>
        <p style={{ fontSize: '1.3rem', opacity: '0.9', marginBottom: '20px' }}>
          Find out if your emails are reaching inboxes—and how much revenue you're losing because they don't.
        </p>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '15px', 
          borderRadius: '10px', 
          display: 'inline-block',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>
            Over 3,200 domains checked this month—are your emails being ignored?
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Client Logos */}
        <div style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '30px', 
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#666', marginBottom: '20px', fontSize: '1.1rem' }}>
            Trusted by leading brands
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '30px', 
            flexWrap: 'wrap' 
          }}>
            {['Shopify', 'Amazon', 'Microsoft', 'Adobe', 'Salesforce'].map((brand) => (
              <div key={brand} style={{ 
                padding: '15px 25px', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                fontWeight: '600',
                color: '#666',
                border: '2px solid #e9ecef'
              }}>
                {brand}
              </div>
            ))}
          </div>
        </div>

        {/* VSL Section */}
        <div style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '40px', 
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: '#2d3748' }}>
            Watch: The #1 Reason Your Emails Don't Reach Customers
          </h2>
          <div style={{ 
            position: 'relative',
            background: '#000',
            borderRadius: '10px',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <Play size={60} color="white" style={{ cursor: 'pointer' }} />
          </div>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            3-minute video reveals the simple fix that increased email revenue by 47% for our clients
          </p>
        </div>

        {/* Domain Checker */}
        <div style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '40px', 
          marginBottom: '30px' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: '#2d3748' }}>
              → Domain Analysis Results
            </h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Enter your domain for an instant analysis
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            maxWidth: '600px', 
            margin: '0 auto', 
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '15px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleDomainCheck()}
            />
            <button
              onClick={handleDomainCheck}
              disabled={loading || !domain.trim()}
              style={{
                background: loading ? '#a0aec0' : '#48bb78',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                minWidth: '180px'
              }}
            >
              {loading ? 'Checking...' : 'Check My Domain'}
            </button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', margin: '30px 0' }}>
              <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                margin: '0 auto 15px',
                animation: 'spin 1s linear infinite'
              }} />
              <p>Analyzing your email infrastructure...</p>
            </div>
          )}

          {results && (
            <div style={{ marginTop: '30px' }}>
              <div style={{ 
                background: '#f7fafc', 
                padding: '25px', 
                borderRadius: '10px', 
                marginBottom: '25px' 
              }}>
                <h3 style={{ color: '#2d3748', marginBottom: '10px', fontSize: '1.5rem' }}>
                  Analysis Results for {results.domain}
                </h3>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  color: results.overall >= 75 ? '#48bb78' : results.overall >= 50 ? '#ed8936' : '#f56565'
                }}>
                  {results.overall}% Health Score
                </div>
              </div>

              <div style={{ display: 'grid', gap: '15px' }}>
                {Object.entries(results).filter(([key]) => !['domain', 'overall'].includes(key)).map(([key, value]) => (
                  <div key={key} style={{ 
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    border: `3px solid ${value.status === 'good' ? '#48bb78' : value.status === 'warning' ? '#ed8936' : '#f56565'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}>
                    {getStatusIcon(value.status)}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600', 
                        textTransform: 'uppercase',
                        marginBottom: '5px'
                      }}>
                        {key} Record
                      </h4>
                      <p style={{ color: '#666', margin: 0 }}>{value.message}</p>
                      {value.record && (
                        <p style={{ 
                          fontSize: '0.85rem', 
                          color: '#999', 
                          marginTop: '5px',
                          fontFamily: 'monospace'
                        }}>
                          {value.record}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Capture Overlay */}
        {showEmailCapture && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '15px',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center'
            }}>
              <Mail size={48} color="#667eea" style={{ marginBottom: '20px' }} />
              <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#2d3748' }}>
                What email should we send the results to?
              </h3>
              <p style={{ color: '#666', marginBottom: '25px' }}>
                Get your full report + ROI calculator + fix-it guide
              </p>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '15px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  marginBottom: '20px',
                  outline: 'none'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowEmailCapture(false)}
                  style={{
                    background: '#e2e8f0',
                    color: '#666',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={handleEmailSubmit}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Get Full Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ROI Calculator */}
        {showROI && (
          <div style={{ 
            background: 'white', 
            borderRadius: '15px', 
            padding: '40px', 
            marginBottom: '30px' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <CheckCircle size={32} color="#48bb78" style={{ marginBottom: '15px' }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '15px', color: '#2d3748' }}>
                ✅ Get Your Deliverability Fix-It Plan
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Brands like yours typically see 18–25% open rates—how do you stack up?
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gap: '20px', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              marginBottom: '30px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Email List Size
                </label>
                <input
                  type="number"
                  value={roiData.listSize}
                  onChange={(e) => setRoiData({...roiData, listSize: e.target.value})}
                  placeholder="10000"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Average Order Value ($)
                </label>
                <input
                  type="number"
                  value={roiData.averageOrderValue}
                  onChange={(e) => setRoiData({...roiData, averageOrderValue: e.target.value})}
                  placeholder="75"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Current Open Rate (%)
                </label>
                <input
                  type="number"
                  value={roiData.openRate}
                  onChange={(e) => setRoiData({...roiData, openRate: e.target.value})}
                  placeholder="15"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Click Rate (%)
                </label>
                <input
                  type="number"
                  value={roiData.clickRate}
                  onChange={(e) => setRoiData({...roiData, clickRate: e.target.value})}
                  placeholder="2.5"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Emails Per Month
                </label>
                <input
                  type="number"
                  value={roiData.emailsPerMonth}
                  onChange={(e) => setRoiData({...roiData, emailsPerMonth: e.target.value})}
                  placeholder="8"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <button
                onClick={calculateROIImpact}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Calculate Revenue Impact
              </button>
            </div>

            {calculatedROI && (
              <div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
                  color: 'white',
                  padding: '30px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  marginBottom: '30px'
                }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>
                    ⚠️ Monthly Revenue Impact
                  </h3>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '10px' }}>
                    ${Math.round(calculatedROI.monthlyImpact).toLocaleString()}
                  </div>
                  <p style={{ fontSize: '1.1rem', opacity: '0.9' }}>
                    You're potentially losing this every month due to poor email deliverability.
                  </p>
                  <p style={{ fontSize: '1rem', marginTop: '10px' }}>
                    Annual impact: ${Math.round(calculatedROI.annualImpact).toLocaleString()}
                  </p>
                </div>

                <div style={{ 
                  background: '#f7fafc', 
                  padding: '30px', 
                  borderRadius: '15px', 
                  textAlign: 'center',
                  marginBottom: '30px'
                }}>
                  <h4 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2d3748' }}>
                    Ready to fix your email deliverability?
                  </h4>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleGuideRequest}
                      style={{
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Get My Deliverability Fix-It Plan
                    </button>
                    <a
                      href="https://cal.com/stevenwagner/inboxsos"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Calendar size={20} />
                      Hire Us To Fix It
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Testimonial */}
        <div style={{ 
          background: 'white', 
          borderRadius: '15px', 
          padding: '40px', 
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#2d3748' }}>
            What Our Clients Say
          </h3>
          <div style={{ 
            background: '#f7fafc', 
            padding: '30px', 
            borderRadius: '10px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <p style={{ 
              fontSize: '1.3rem', 
              fontStyle: 'italic', 
              color: '#2d3748',
              marginBottom: '20px',
              lineHeight: '1.8'
            }}>
              "After implementing their email deliverability fixes, our open rates jumped from 12% to 23% in just 30 days. 
              That translates to an extra $47,000 in monthly revenue for Tumblerware. The ROI was immediate and incredible."
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '15px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                JD
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '600', color: '#2d3748' }}>Jessica Davis</div>
                <div style={{ color: '#666' }}>CEO, Tumblerware</div>
              </div>
            </div>
          </div>
        </div>
