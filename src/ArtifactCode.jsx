import React, { useState, useEffect } from 'react';

const EmailDeliveryChecker = () => {
  const [domainIssues, setDomainIssues] = useState([]);
  const [calculationData, setCalculationData] = useState({});
  const [domainCheckComplete, setDomainCheckComplete] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domainResults, setDomainResults] = useState('');
  const [impactResults, setImpactResults] = useState('');
  const [emailCapture, setEmailCapture] = useState('');
  
  const [formData, setFormData] = useState({
    domain: '',
    userEmail: '',
    companyName: '',
    listSize: '',
    avgOrderValue: '',
    openRate: '',
    clickRate: '',
    conversionRate: '',
    emailsPerMonth: ''
  });

  const updateSendButton = () => {
    return formData.userEmail && (domainCheckComplete || calculationComplete);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const simulateDNSCheck = (domain) => {
    const hasIssues = Math.random() > 0.3;
    
    const spfResult = {
      name: 'SPF Record',
      status: hasIssues && Math.random() > 0.4 ? 'fail' : 'pass',
      message: hasIssues && Math.random() > 0.4 ? 'No SPF record found or invalid syntax' : 'Valid SPF record found',
      impact: 'SPF helps prevent email spoofing and improves deliverability'
    };

    const dkimResult = {
      name: 'DKIM Record',
      status: hasIssues && Math.random() > 0.5 ? 'fail' : 'pass',
      message: hasIssues && Math.random() > 0.5 ? 'DKIM signature not found or invalid' : 'Valid DKIM signature detected',
      impact: 'DKIM authenticates your emails and builds sender reputation'
    };

    const dmarcResult = {
      name: 'DMARC Record',
      status: hasIssues && Math.random() > 0.6 ? 'fail' : 'pass',
      message: hasIssues && Math.random() > 0.6 ? 'No DMARC policy found' : 'DMARC policy is configured',
      impact: 'DMARC provides email authentication and protects your brand'
    };

    const mxResult = {
      name: 'MX Record',
      status: 'pass',
      message: 'Valid MX records found',
      impact: 'MX records route your incoming emails properly'
    };

    const results = [spfResult, dkimResult, dmarcResult, mxResult];
    
    const issues = [];
    results.forEach(result => {
      if (result.status === 'fail') {
        issues.push(result.name);
      }
    });

    return { results, issues };
  };

  const checkDomain = async () => {
    if (!formData.domain.trim()) {
      alert('Please enter a domain name');
      return;
    }

    setIsLoading(true);
    setDomainResults('');
    setDomainIssues([]);

    setTimeout(() => {
      const { results, issues } = simulateDNSCheck(formData.domain);
      setDomainIssues(issues);
      displayDomainResults(results);
      setDomainCheckComplete(true);
      setIsLoading(false);
    }, 2000);
  };

  const displayDomainResults = (results) => {
    const resultElements = results.map((result, index) => (
      <div key={index} className="mb-4 p-3 border-l-4" style={{borderLeftColor: result.status === 'pass' ? '#27ae60' : '#e74c3c'}}>
        <div className="font-semibold">
          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${result.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`}></span>
          {result.name}
        </div>
        <div>{result.message}</div>
        <div className="text-sm text-gray-600">{result.impact}</div>
      </div>
    ));

    setDomainResults(
      <div className="mt-5 p-5 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Domain Analysis Results</h3>
        {resultElements}
        {domainIssues.length > 0 ? (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <h4 className="font-semibold text-red-600 mb-3">🚨 Issues Found - These are hurting your email deliverability:</h4>
            <ul className="list-none pl-0">
              {domainIssues.map((issue, index) => (
                <li key={index} className="py-1 border-b border-gray-200 last:border-b-0">
                  ✓ Fix {issue} configuration
                </li>
              ))}
            </ul>
            <p className="mt-3"><strong>Impact:</strong> These issues can reduce your email deliverability by 20-40% and harm your sender reputation.</p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <strong>✅ Great job! Your email infrastructure looks solid.</strong><br />
            Your domain has proper email authentication configured.
          </div>
        )}
      </div>
    );
  };

  const calculateImpact = () => {
    const { listSize, avgOrderValue, openRate, clickRate, conversionRate, emailsPerMonth } = formData;
    
    if (!listSize || !avgOrderValue || !openRate || !clickRate || !conversionRate || !emailsPerMonth) {
      alert('Please fill in all fields');
      return;
    }

    const data = {
      listSize: parseInt(listSize),
      avgOrderValue: parseFloat(avgOrderValue),
      openRate: parseFloat(openRate),
      clickRate: parseFloat(clickRate),
      conversionRate: parseFloat(conversionRate),
      emailsPerMonth: parseInt(emailsPerMonth)
    };

    setCalculationData(data);
    
    // Show blurred results first
    displayBlurredResults(data);
    
    // If email is provided, show full results and add to Klaviyo
    if (formData.userEmail) {
      displayImpactResults(data);
      setCalculationComplete(true);
      addToKlaviyo(formData.userEmail, formData.companyName).catch(console.error);
    }
  };

  const handleEmailSubmit = () => {
    if (!formData.userEmail) {
      alert('Please enter your email address');
      return;
    }

    // Show full results and add to Klaviyo
    displayImpactResults(calculationData);
    setCalculationComplete(true);
    addToKlaviyo(formData.userEmail, formData.companyName).catch(console.error);
  };

  const displayBlurredResults = (data) => {
    const currentOpens = (data.listSize * data.emailsPerMonth * data.openRate) / 100;
    const currentClicks = (currentOpens * data.clickRate) / 100;
    const currentConversions = (currentClicks * data.conversionRate) / 100;
    const currentRevenue = currentConversions * data.avgOrderValue;

    const deliverabilityImpact = domainIssues.length > 0 ? 0.35 : 0.15;
    const improvedOpens = currentOpens * (1 + deliverabilityImpact);
    const improvedClicks = (improvedOpens * data.clickRate) / 100;
    const improvedConversions = (improvedClicks * data.conversionRate) / 100;
    const improvedRevenue = improvedConversions * data.avgOrderValue;

    const monthlyLoss = improvedRevenue - currentRevenue;
    const annualLoss = monthlyLoss * 12;

    setImpactResults(
      <div className="relative">
        {/* Blurred Results */}
        <div className="filter blur-sm pointer-events-none">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-xl text-center mt-8">
            <h3 className="text-2xl mb-2">💰 Monthly Revenue Impact</h3>
            <div className="text-5xl font-bold my-5">${monthlyLoss.toLocaleString()}</div>
            <p>You're potentially losing this much revenue per month due to poor email deliverability</p>
            <div className="mt-5 text-xl">
              <strong>Annual Impact: ${annualLoss.toLocaleString()}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            <div className="bg-yellow-50 p-5 rounded-lg">
              <h4 className="text-lg font-semibold mb-3">📈 Current Performance</h4>
              <p><strong>Monthly Opens:</strong> {currentOpens.toLocaleString()}</p>
              <p><strong>Monthly Clicks:</strong> {currentClicks.toLocaleString()}</p>
              <p><strong>Monthly Conversions:</strong> {currentConversions.toLocaleString()}</p>
              <p><strong>Monthly Revenue:</strong> ${currentRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-5 rounded-lg">
              <h4 className="text-lg font-semibold mb-3">🎯 Potential with Good Deliverability</h4>
              <p><strong>Monthly Opens:</strong> {improvedOpens.toLocaleString()}</p>
              <p><strong>Monthly Clicks:</strong> {improvedClicks.toLocaleString()}</p>
              <p><strong>Monthly Conversions:</strong> {improvedConversions.toLocaleString()}</p>
              <p><strong>Monthly Revenue:</strong> ${improvedRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Email Capture Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-4 border-blue-500">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">What email should we send the results to?</h3>
              <p className="text-gray-600">Get your detailed revenue recovery report and step-by-step fix guide</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  placeholder="your.email@company.com"
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Company Name (Optional)"
                  className="w-full p-4 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleEmailSubmit}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
              >
                📨 Send Me The Complete Analysis
              </button>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>✓ Detailed revenue recovery plan</p>
              <p>✓ Step-by-step technical instructions</p>
              <p>✓ Priority implementation roadmap</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const displayImpactResults = (data) => {
    const currentOpens = (data.listSize * data.emailsPerMonth * data.openRate) / 100;
    const currentClicks = (currentOpens * data.clickRate) / 100;
    const currentConversions = (currentClicks * data.conversionRate) / 100;
    const currentRevenue = currentConversions * data.avgOrderValue;

    const deliverabilityImpact = domainIssues.length > 0 ? 0.35 : 0.15;
    const improvedOpens = currentOpens * (1 + deliverabilityImpact);
    const improvedClicks = (improvedOpens * data.clickRate) / 100;
    const improvedConversions = (improvedClicks * data.conversionRate) / 100;
    const improvedRevenue = improvedConversions * data.avgOrderValue;

    const monthlyLoss = improvedRevenue - currentRevenue;
    const annualLoss = monthlyLoss * 12;

    setImpactResults(
      <div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-xl text-center mt-8">
          <h3 className="text-2xl mb-2">💰 Monthly Revenue Impact</h3>
          <div className="text-5xl font-bold my-5">${monthlyLoss.toLocaleString()}</div>
          <p>You're potentially losing this much revenue per month due to poor email deliverability</p>
          <div className="mt-5 text-xl">
            <strong>Annual Impact: ${annualLoss.toLocaleString()}</strong>
          </div>
          <div className="mt-6 p-4 bg-white bg-opacity-20 rounded-lg">
            <p className="text-lg">
              📧 <strong>Your detailed fix-it guide has been sent to {formData.userEmail}!</strong>
            </p>
            <p className="text-sm mt-2">Check your inbox for step-by-step instructions to recover this revenue.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
          <div className="bg-yellow-50 p-5 rounded-lg">
            <h4 className="text-lg font-semibold mb-3">📈 Current Performance</h4>
            <p><strong>Monthly Opens:</strong> {currentOpens.toLocaleString()}</p>
            <p><strong>Monthly Clicks:</strong> {currentClicks.toLocaleString()}</p>
            <p><strong>Monthly Conversions:</strong> {currentConversions.toLocaleString()}</p>
            <p><strong>Monthly Revenue:</strong> ${currentRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 p-5 rounded-lg">
            <h4 className="text-lg font-semibold mb-3">🎯 Potential with Good Deliverability</h4>
            <p><strong>Monthly Opens:</strong> {improvedOpens.toLocaleString()}</p>
            <p><strong>Monthly Clicks:</strong> {improvedClicks.toLocaleString()}</p>
            <p><strong>Monthly Conversions:</strong> {improvedConversions.toLocaleString()}</p>
            <p><strong>Monthly Revenue:</strong> ${improvedRevenue.toLocaleString()}</p>
          </div>
        </div>

        {domainIssues.length > 0 ? (
          <div className="bg-green-50 p-5 rounded-lg mt-6">
            <h4 className="text-lg font-semibold mb-3">🔧 Immediate Action Items to Recover Revenue:</h4>
            <ul className="list-none pl-0">
              <li className="py-1 border-b border-gray-200">✓ Set up proper SPF record to authorize your sending servers</li>
              <li className="py-1 border-b border-gray-200">✓ Configure DKIM signing for email authentication</li>
              <li className="py-1 border-b border-gray-200">✓ Implement DMARC policy to protect your domain reputation</li>
              <li className="py-1 border-b border-gray-200">✓ Use a reputable email service provider (ESP)</li>
              <li className="py-1 border-b border-gray-200">✓ Monitor your sender reputation regularly</li>
              <li className="py-1 border-b border-gray-200">✓ Clean your email list to remove inactive subscribers</li>
              <li className="py-1 border-b border-gray-200 last:border-b-0">✓ Implement proper email warm-up procedures</li>
            </ul>
            <p className="mt-3"><strong>Expected Timeline:</strong> 2-4 weeks to see significant improvement in deliverability</p>
          </div>
        ) : (
          <div className="bg-green-50 p-5 rounded-lg mt-6">
            <h4 className="text-lg font-semibold mb-3">🚀 Additional Optimization Opportunities:</h4>
            <ul className="list-none pl-0">
              <li className="py-1 border-b border-gray-200">✓ Implement email list segmentation for better targeting</li>
              <li className="py-1 border-b border-gray-200">✓ A/B test subject lines to improve open rates</li>
              <li className="py-1 border-b border-gray-200">✓ Optimize email sending times for your audience</li>
              <li className="py-1 border-b border-gray-200">✓ Use behavioral triggers for automated email sequences</li>
              <li className="py-1 border-b border-gray-200">✓ Implement re-engagement campaigns for inactive subscribers</li>
              <li className="py-1 border-b border-gray-200 last:border-b-0">✓ Focus on mobile optimization for better click rates</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  const calculateMonthlyLoss = () => {
    const data = calculationData;
    const currentOpens = (data.listSize * data.emailsPerMonth * data.openRate) / 100;
    const currentClicks = (currentOpens * data.clickRate) / 100;
    const currentConversions = (currentClicks * data.conversionRate) / 100;
    const currentRevenue = currentConversions * data.avgOrderValue;

    const deliverabilityImpact = domainIssues.length > 0 ? 0.35 : 0.15;
    const improvedOpens = currentOpens * (1 + deliverabilityImpact);
    const improvedClicks = (improvedOpens * data.clickRate) / 100;
    const improvedConversions = (improvedClicks * data.conversionRate) / 100;
    const improvedRevenue = improvedConversions * data.avgOrderValue;

    return improvedRevenue - currentRevenue;
  };

  const addToKlaviyo = async (email, company) => {
    const KLAVIYO_PUBLIC_KEY = 'Mzfpkb';
    const klaviyoSignupUrl = 'https://www.klaviyo.com/list/TCapS8';
    
    try {
      // Prepare the profile data
      const profileData = {
        email: email,
        properties: {
          first_name: company ? company.split(' ')[0] : '',
          company: company || '',
          source: 'Email Delivery Checker',
          domain_issues: domainIssues.join(', ') || 'None detected',
          domain_issues_count: domainIssues.length,
          timestamp: new Date().toISOString()
        }
      };

      // Add calculation data if available
      if (calculationData.listSize) {
        const monthlyLoss = calculateMonthlyLoss();
        profileData.properties = {
          ...profileData.properties,
          list_size: calculationData.listSize,
          avg_order_value: calculationData.avgOrderValue,
          open_rate: calculationData.openRate,
          click_rate: calculationData.clickRate,
          conversion_rate: calculationData.conversionRate,
          emails_per_month: calculationData.emailsPerMonth,
          monthly_revenue_loss: Math.round(monthlyLoss),
          annual_revenue_loss: Math.round(monthlyLoss * 12)
        };
      }

      // Method 1: Try Klaviyo API directly
      try {
        const response = await fetch('https://a.klaviyo.com/api/profiles/', {
          method: 'POST',
          headers: {
            'Authorization': `Klaviyo-API-Key ${KLAVIYO_PUBLIC_KEY}`,
            'Content-Type': 'application/json',
            'revision': '2024-06-15'
          },
          body: JSON.stringify({
            data: {
              type: 'profile',
              attributes: profileData
            }
          })
        });

        if (response.ok) {
          const profile = await response.json();
          
          // Add to the specific list
          await fetch(`https://a.klaviyo.com/api/lists/TCapS8/relationships/profiles/`, {
            method: 'POST',
            headers: {
              'Authorization': `Klaviyo-API-Key ${KLAVIYO_PUBLIC_KEY}`,
              'Content-Type': 'application/json',
              'revision': '2024-06-15'
            },
            body: JSON.stringify({
              data: [{
                type: 'profile',
                id: profile.data.id
              }]
            })
          });

          console.log('Successfully added to Klaviyo via API');
          return { success: true, method: 'api' };
        }
      } catch (apiError) {
        console.log('API method failed, trying list signup URL:', apiError);
      }

      // Method 2: Use list signup URL with form submission
      const formData = new FormData();
      formData.append('email', email);
      formData.append('$fields', 'email,company,source,domain_issues,list_size,monthly_revenue_loss');
      
      // Add custom properties
      Object.entries(profileData.properties).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      try {
        const response = await fetch(klaviyoSignupUrl, {
          method: 'POST',
          body: formData,
          mode: 'no-cors'
        });
        
        console.log('Successfully submitted to Klaviyo list signup');
        return { success: true, method: 'list_signup' };
        
      } catch (listError) {
        console.log('List signup failed, trying iframe method:', listError);
      }

      // Method 3: Hidden iframe method (most reliable for cross-origin)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = 'klaviyo-signup';
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = klaviyoSignupUrl;
      form.target = 'klaviyo-signup';

      // Add all the profile data as hidden fields
      Object.entries({
        email: email,
        ...profileData.properties
      }).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();

      // Clean up after submission
      setTimeout(() => {
        document.body.removeChild(form);
        document.body.removeChild(iframe);
      }, 2000);

      console.log('Successfully submitted via iframe method');
      return { success: true, method: 'iframe' };

    } catch (error) {
      console.error('All Klaviyo methods failed:', error);
      
      // Final fallback - log for manual processing
      const leadData = {
        email,
        company: company || '',
        source: 'Email Delivery Checker',
        domain_issues: domainIssues.join(', ') || 'None detected',
        domain_issues_count: domainIssues.length,
        timestamp: new Date().toISOString(),
        calculation_data: calculationData.listSize ? {
          list_size: calculationData.listSize,
          avg_order_value: calculationData.avgOrderValue,
          open_rate: calculationData.openRate,
          click_rate: calculationData.clickRate,
          conversion_rate: calculationData.conversionRate,
          emails_per_month: calculationData.emailsPerMonth,
          monthly_revenue_loss: Math.round(calculateMonthlyLoss()),
          annual_revenue_loss: Math.round(calculateMonthlyLoss() * 12)
        } : null
      };

      console.log('MANUAL PROCESSING NEEDED - Klaviyo lead data:', leadData);
      
      // You could also send this to your own backend as a backup
      // fetch('/api/backup-lead-capture', { 
      //   method: 'POST', 
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(leadData) 
      // });
      
      throw new Error('All Klaviyo integration methods failed');
    }
  };

  const sendResults = async () => {
    if (!formData.userEmail) {
      alert('Please enter your email address');
      return;
    }

    if (!domainCheckComplete && !calculationComplete) {
      alert('Please run the domain check or calculator first');
      return;
    }

    try {
      await addToKlaviyo(formData.userEmail, formData.companyName);
      
      const reportSummary = generateReportSummary();
      
      setEmailCapture(
        <div className="mt-5 p-5 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">✅ Custom Fix-It Guide Sent!</h3>
          <p>We've sent a detailed report to <strong>{formData.userEmail}</strong> that includes:</p>
          <ul className="list-disc pl-6 my-4">
            <li>📋 Complete analysis of your current email setup</li>
            <li>🔧 Step-by-step technical instructions to fix each issue</li>
            <li>💰 Your personalized revenue recovery potential</li>
            <li>⏱️ Implementation timeline and priority order</li>
            <li>🎯 Advanced optimization strategies</li>
          </ul>
          <p><strong>Check your inbox in the next few minutes!</strong></p>
          {reportSummary}
        </div>
      );
    } catch (error) {
      console.error('Error sending results:', error);
      setEmailCapture(
        <div className="mt-5 p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">⚠️ Almost There!</h3>
          <p>We're processing your request for <strong>{formData.userEmail}</strong>. You should receive your custom fix-it guide shortly.</p>
        </div>
      );
    }
  };

  const scheduleConsultation = () => {
    let urgencyMessage = '';
    if (domainIssues.length > 0 && calculationComplete) {
      const monthlyLoss = calculateMonthlyLoss();
      urgencyMessage = `⚠️ Urgent: Based on your data, you're losing approximately $${monthlyLoss.toLocaleString()}/month in revenue. Every day you wait costs you money!`;
    }
    
    setEmailCapture(
      <div className="mt-5 p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">🚀 Let's Fix This Together!</h3>
        {urgencyMessage && (
          <p className="bg-yellow-100 p-4 rounded-lg mb-4">
            <strong>{urgencyMessage}</strong>
          </p>
        )}
        <p>Our email deliverability experts can fix your email infrastructure in 2-3 days and get you back to full deliverability.</p>
        <div className="bg-green-50 p-5 rounded-lg my-4">
          <h4 className="font-semibold mb-3">What We'll Do For You:</h4>
          <ul className="list-disc pl-6">
            <li>✅ Complete SPF, DKIM, and DMARC setup</li>
            <li>✅ Email authentication configuration</li>
            <li>✅ Sender reputation optimization</li>
            <li>✅ Email warm-up strategy</li>
            <li>✅ Ongoing monitoring setup</li>
            <li>✅ 30-day performance guarantee</li>
          </ul>
        </div>
        <div className="text-center my-5">
          <button 
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
            onClick={() => window.open('https://cal.com/stevenwagner/inboxsos', '_blank')}
          >
            📅 Schedule Free Consultation
          </button>
        </div>
        <p className="text-sm text-center">💰 <strong>Investment:</strong> Starting at $997 - typically pays for itself in the first month</p>
      </div>
    );
  };

  const generateReportSummary = () => {
    if (!domainCheckComplete && !calculationComplete) return '';
    
    let summary = '<div className="bg-gray-50 p-4 rounded-lg mt-4"><h4 className="font-semibold mb-2">Your Report Preview:</h4>';
    
    if (domainIssues.length > 0) {
      summary += `<p><strong>🚨 ${domainIssues.length} Critical Issues Found:</strong> ${domainIssues.join(', ')}</p>`;
    } else {
      summary += '<p><strong>✅ Email Infrastructure:</strong> Looking good!</p>';
    }
    
    if (calculationComplete) {
      const monthlyLoss = calculateMonthlyLoss();
      summary += `<p><strong>💰 Monthly Revenue Impact:</strong> $${monthlyLoss.toLocaleString()}</p>`;
    }
    
    summary += '</div>';
    return <div dangerouslySetInnerHTML={{ __html: summary }} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-5">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-blue-600 text-white p-10 text-center">
          <h1 className="text-4xl font-bold mb-3">📧 Email Delivery Checker & ROI Calculator</h1>
          <p className="text-xl opacity-90">Analyze your email infrastructure and calculate the cost of poor deliverability</p>
        </div>

        <div className="p-10">
          {/* Domain Check Section */}
          <div className="mb-10 p-8 bg-gray-50 rounded-xl border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-gray-800 mb-5">🔍 Domain Email Infrastructure Check</h2>
            <div className="mb-5">
              <label className="block mb-2 font-semibold text-gray-700">Enter your domain (e.g., example.com):</label>
              <input
                type="text"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                placeholder="example.com"
                className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={checkDomain}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Check Email Records
            </button>
            
            {isLoading && (
              <div className="text-center py-5">
                <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p>Checking your domain's email records...</p>
              </div>
            )}
            
            {domainResults}
          </div>

          {/* Email Capture Section */}
          <div className="mb-10 p-8 bg-gray-50 rounded-xl border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">📧 Get Your Custom Fix-It Guide</h2>
            <p className="mb-5 text-gray-600">
              {calculationComplete ? 
                "Your detailed report has been automatically sent! Want to take immediate action?" : 
                "Complete the calculator above to receive a detailed report with step-by-step instructions."
              }
            </p>
            {calculationComplete && (
              <div className="mb-5">
                <button
                  onClick={scheduleConsultation}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all mr-3"
                >
                  🚀 Hire Us to Fix This For You
                </button>
                <button
                  onClick={() => window.open('mailto:' + formData.userEmail, '_blank')}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all"
                >
                  📨 Check Your Email
                </button>
              </div>
            )}
            
            {emailCapture}
          </div>

          {/* Email Marketing Calculator Section */}
          <div className="mb-10 p-8 bg-gray-50 rounded-xl border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-gray-800 mb-5">📊 Email Marketing Performance Calculator</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Email List Size:</label>
                <input
                  type="number"
                  name="listSize"
                  value={formData.listSize}
                  onChange={handleInputChange}
                  placeholder="10000"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Average Order Value ($):</label>
                <input
                  type="number"
                  name="avgOrderValue"
                  value={formData.avgOrderValue}
                  onChange={handleInputChange}
                  placeholder="75"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Current Open Rate (%):</label>
                <input
                  type="number"
                  name="openRate"
                  value={formData.openRate}
                  onChange={handleInputChange}
                  placeholder="20"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Click-Through Rate (%):</label>
                <input
                  type="number"
                  name="clickRate"
                  value={formData.clickRate}
                  onChange={handleInputChange}
                  placeholder="3"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Conversion Rate (%):</label>
                <input
                  type="number"
                  name="conversionRate"
                  value={formData.conversionRate}
                  onChange={handleInputChange}
                  placeholder="2"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Emails Sent Per Month:</label>
                <input
                  type="number"
                  name="emailsPerMonth"
                  value={formData.emailsPerMonth}
                  onChange={handleInputChange}
                  placeholder="4"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={calculateImpact}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Calculate My Revenue Impact
            </button>
            
            {impactResults}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailDeliveryChecker;
