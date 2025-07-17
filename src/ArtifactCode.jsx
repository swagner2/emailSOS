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

  const logToGoogleSheets = async (data) => {
    try {
      // Google Apps Script Web App URL (replace with your actual URL)
      const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzvN7mOucgh41Q06Qi09UuTxjIp8FtIjuZQTaCcJrFq9-mW8Ps7rFsVG5-s6aD2DudI/exec';
      
      // Method 1: Google Apps Script (Recommended)
      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('Google Sheets response:', result);
        
        if (result.success) {
          console.log('Data successfully logged to Google Sheets');
          return { success: true, method: 'apps_script' };
        } else {
          throw new Error(result.error || 'Apps Script failed');
        }
        
      } catch (appsScriptError) {
        console.log('Apps Script method failed:', appsScriptError);
        
        // Method 2: Try direct Google Sheets API as fallback
        const SHEET_ID = '1txSIvvKuQj6bxKkoYqxBPadip9iPTam2G4yLvJRYTRM';
        const API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your actual API key
        
        if (API_KEY && API_KEY !== 'YOUR_GOOGLE_API_KEY') {
          try {
            const range = 'Sheet1!A:S'; // Adjust range as needed
            const valueInputOption = 'RAW';
            
            const values = [[
              data.timestamp || new Date().toISOString(),
              data.domain || '',
              data.email || '',
              data.company || '',
              data.spf_status || '',
              data.dkim_status || '',
              data.dmarc_status || '',
              data.mx_status || '',
              data.domain_issues_count || 0,
              data.list_size || '',
              data.avg_order_value || '',
              data.open_rate || '',
              data.click_rate || '',
              data.conversion_rate || '',
              data.emails_per_month || '',
              data.monthly_revenue_loss || '',
              data.annual_revenue_loss || '',
              data.list_type || '',
              data.source || ''
            ]];
            
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=${valueInputOption}&key=${API_KEY}`;
            
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                values: values
              })
            });
            
            if (response.ok) {
              console.log('Data logged to Google Sheets via API');
              return { success: true, method: 'direct_api' };
            } else {
              const errorText = await response.text();
              throw new Error(`Google Sheets API failed: ${response.status} - ${errorText}`);
            }
          } catch (apiError) {
            console.error('Google Sheets API failed:', apiError);
            throw apiError;
          }
        } else {
          throw new Error('No API key configured and Apps Script failed');
        }
      }
      
    } catch (error) {
      console.error('Failed to log to Google Sheets:', error);
      
      // Fallback: Log to console for manual entry
      console.log('🔴 MANUAL GOOGLE SHEETS ENTRY NEEDED:');
      console.log('Copy this data to your Google Sheet:');
      console.table([{
        Timestamp: data.timestamp || new Date().toISOString(),
        Domain: data.domain || '',
        Email: data.email || '',
        Company: data.company || '',
        'SPF Status': data.spf_status || '',
        'DKIM Status': data.dkim_status || '',
        'DMARC Status': data.dmarc_status || '',
        'MX Status': data.mx_status || '',
        'Domain Issues Count': data.domain_issues_count || 0,
        'List Size': data.list_size || '',
        'Avg Order Value': data.avg_order_value || '',
        'Open Rate': data.open_rate || '',
        'Click Rate': data.click_rate || '',
        'Conversion Rate': data.conversion_rate || '',
        'Emails Per Month': data.emails_per_month || '',
        'Monthly Revenue Loss': data.monthly_revenue_loss || '',
        'Annual Revenue Loss': data.annual_revenue_loss || '',
        'List Type': data.list_type || '',
        'Source': data.source || ''
      }]);
      
      return { success: false, error: error.message };
    }
  };

  const checkDNSRecords = async (domain) => {
    const results = [];
    
    try {
      // Check SPF record
      const spfResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=TXT`);
      const spfData = await spfResponse.json();
      
      const spfRecord = spfData.Answer?.find(record => 
        record.data.replace(/"/g, '').includes('v=spf1')
      );
      
      results.push({
        name: 'SPF Record',
        status: spfRecord ? 'pass' : 'fail',
        message: spfRecord ? 
          `Valid SPF record found: ${spfRecord.data.replace(/"/g, '').substring(0, 100)}${spfRecord.data.length > 100 ? '...' : ''}` : 
          'No SPF record found - emails may be marked as spam',
        impact: 'SPF helps prevent email spoofing and improves deliverability',
        record: spfRecord?.data || null
      });

      // Check DMARC record
      const dmarcResponse = await fetch(`https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`);
      const dmarcData = await dmarcResponse.json();
      
      const dmarcRecord = dmarcData.Answer?.find(record => 
        record.data.replace(/"/g, '').includes('v=DMARC1')
      );
      
      results.push({
        name: 'DMARC Record',
        status: dmarcRecord ? 'pass' : 'fail',
        message: dmarcRecord ? 
          `DMARC policy found: ${dmarcRecord.data.replace(/"/g, '').substring(0, 100)}${dmarcRecord.data.length > 100 ? '...' : ''}` : 
          'No DMARC record found - domain vulnerable to spoofing',
        impact: 'DMARC provides email authentication and protects your brand',
        record: dmarcRecord?.data || null
      });

      // Check DKIM record (try common selectors)
      const commonSelectors = ['google', 'k1', 'default', 'selector1', 'mail', 'dkim', 's1', 's2'];
      let dkimFound = false;
      let dkimRecord = null;
      let dkimSelector = null;

      for (const selector of commonSelectors) {
        try {
          const dkimResponse = await fetch(`https://dns.google/resolve?name=${selector}._domainkey.${domain}&type=TXT`);
          const dkimData = await dkimResponse.json();
          
          const record = dkimData.Answer?.find(record => {
            const data = record.data.replace(/"/g, '');
            return data.includes('v=DKIM1') || data.includes('k=rsa') || data.includes('k=ed25519') || data.includes('p=');
          });
          
          if (record) {
            dkimFound = true;
            dkimRecord = record.data;
            dkimSelector = selector;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      results.push({
        name: 'DKIM Record',
        status: dkimFound ? 'pass' : 'fail',
        message: dkimFound ? 
          `DKIM record found at ${dkimSelector}._domainkey.${domain}` : 
          'No DKIM record found (checked common selectors) - emails may lack authentication',
        impact: 'DKIM authenticates your emails and builds sender reputation',
        record: dkimRecord
      });

      // Check MX record
      const mxResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
      const mxData = await mxResponse.json();
      
      const mxRecords = mxData.Answer || [];
      results.push({
        name: 'MX Record',
        status: mxRecords.length > 0 ? 'pass' : 'fail',
        message: mxRecords.length > 0 ? 
          `${mxRecords.length} MX record(s) found: ${mxRecords[0]?.data || 'Valid mail server'}` : 
          'No MX records found - cannot receive emails',
        impact: 'MX records route your incoming emails properly',
        record: mxRecords[0]?.data || null
      });

      return results;
      
    } catch (error) {
      console.error('DNS check failed:', error);
      throw new Error('Unable to check DNS records. Please check your internet connection and try again.');
    }
  };

  const checkDomain = async () => {
    if (!formData.domain.trim()) {
      alert('Please enter a domain name');
      return;
    }

    // Clean domain input
    const cleanDomain = formData.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    setIsLoading(true);
    setDomainResults('');
    setDomainIssues([]);

    try {
      const results = await checkDNSRecords(cleanDomain);
      
      // Track issues for impact calculation
      const issues = results
        .filter(result => result.status === 'fail')
        .map(result => result.name);
      
      setDomainIssues(issues);
      displayDomainResults(results);
      setDomainCheckComplete(true);
      
      // Log domain check to Google Sheets immediately (without email)
      const domainData = {
        timestamp: new Date().toISOString(),
        domain: cleanDomain,
        email: '', // No email yet
        company: '',
        spf_status: issues.includes('SPF Record') ? 'FAIL' : 'PASS',
        dkim_status: issues.includes('DKIM Record') ? 'FAIL' : 'PASS',
        dmarc_status: issues.includes('DMARC Record') ? 'FAIL' : 'PASS',
        mx_status: issues.includes('MX Record') ? 'FAIL' : 'PASS',
        domain_issues_count: issues.length,
        list_size: '',
        avg_order_value: '',
        open_rate: '',
        click_rate: '',
        conversion_rate: '',
        emails_per_month: '',
        monthly_revenue_loss: '',
        annual_revenue_loss: '',
        list_type: 'domain_check_only',
        source: 'Email Delivery Checker - Domain Check'
      };
      
      // Log to Google Sheets for retargeting
      logToGoogleSheets(domainData).catch(console.error);
      
    } catch (error) {
      console.error('Domain check failed:', error);
      alert(error.message || 'Failed to check domain. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  const calculateMonthlyLoss = (data = calculationData) => {
    if (!data.listSize) return 0;
    
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
    
    // Log calculator usage to Google Sheets (even without email)
    const monthlyLoss = calculateMonthlyLoss(data);
    const calculatorData = {
      timestamp: new Date().toISOString(),
      domain: formData.domain || '',
      email: '', // No email yet
      company: '',
      spf_status: domainResults && domainIssues.includes('SPF Record') ? 'FAIL' : domainResults ? 'PASS' : '',
      dkim_status: domainResults && domainIssues.includes('DKIM Record') ? 'FAIL' : domainResults ? 'PASS' : '',
      dmarc_status: domainResults && domainIssues.includes('DMARC Record') ? 'FAIL' : domainResults ? 'PASS' : '',
      mx_status: domainResults && domainIssues.includes('MX Record') ? 'FAIL' : domainResults ? 'PASS' : '',
      domain_issues_count: domainIssues.length,
      list_size: data.listSize,
      avg_order_value: data.avgOrderValue,
      open_rate: data.openRate,
      click_rate: data.clickRate,
      conversion_rate: data.conversionRate,
      emails_per_month: data.emailsPerMonth,
      monthly_revenue_loss: Math.round(monthlyLoss),
      annual_revenue_loss: Math.round(monthlyLoss * 12),
      list_type: 'calculator_only',
      source: 'Email Delivery Checker - Calculator Usage'
    };
    
    // Log to Google Sheets for retargeting
    logToGoogleSheets(calculatorData).catch(console.error);
    
    // Show blurred results first
    displayBlurredResults(data);
    
    // If email is provided, show full results and add to Klaviyo
    if (formData.userEmail) {
      displayImpactResults(data);
      setCalculationComplete(true);
      addToKlaviyo(formData.userEmail, formData.companyName, 'calculator').catch(console.error);
    }
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

  const addToKlaviyo = async (email, company, listType = 'calculator') => {
    const KLAVIYO_PUBLIC_KEY = 'Mzfpkb';
    
    // Different lists for different actions
    const listUrls = {
      calculator: 'https://www.klaviyo.com/list/TCapS8',  // Revenue calculator results
      guide: 'https://www.klaviyo.com/list/U42FCU'        // Fix-it guide requests
    };
    
    const listIds = {
      calculator: 'TCapS8',
      guide: 'U42FCU'
    };
    
    const klaviyoSignupUrl = listUrls[listType];
    const listId = listIds[listType];
    
    // Prepare Google Sheets data
    const monthlyLoss = calculationData.listSize ? calculateMonthlyLoss() : 0;
    const sheetsData = {
      timestamp: new Date().toISOString(),
      domain: formData.domain || '',
      email: email,
      company: company || '',
      spf_status: domainResults ? (domainIssues.includes('SPF Record') ? 'FAIL' : 'PASS') : '',
      dkim_status: domainResults ? (domainIssues.includes('DKIM Record') ? 'FAIL' : 'PASS') : '',
      dmarc_status: domainResults ? (domainIssues.includes('DMARC Record') ? 'FAIL' : 'PASS') : '',
      mx_status: domainResults ? (domainIssues.includes('MX Record') ? 'FAIL' : 'PASS') : '',
      domain_issues_count: domainIssues.length,
      list_size: calculationData.listSize || '',
      avg_order_value: calculationData.avgOrderValue || '',
      open_rate: calculationData.openRate || '',
      click_rate: calculationData.clickRate || '',
      conversion_rate: calculationData.conversionRate || '',
      emails_per_month: calculationData.emailsPerMonth || '',
      monthly_revenue_loss: monthlyLoss ? Math.round(monthlyLoss) : '',
      annual_revenue_loss: monthlyLoss ? Math.round(monthlyLoss * 12) : '',
      list_type: listType,
      source: `Email Delivery Checker - ${listType}`
    };
    
    // Log to Google Sheets
    logToGoogleSheets(sheetsData).catch(console.error);
    
    try {
      // Prepare the profile data for Klaviyo
      const profileData = {
        email: email,
        properties: {
          first_name: company ? company.split(' ')[0] : '',
          company: company || '',
          source: listType === 'calculator' ? 'Email Delivery Checker - Calculator' : 'Email Delivery Checker - Guide Request',
          domain_issues: domainIssues.join(', ') || 'None detected',
          domain_issues_count: domainIssues.length,
          timestamp: new Date().toISOString(),
          list_type: listType
        }
      };

      // Add calculation data if available
      if (calculationData.listSize) {
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
          await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
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

          console.log(`Successfully added to Klaviyo ${listType} list via API`);
          return { success: true, method: 'api', listType };
        }
      } catch (apiError) {
        console.log('API method failed, trying list signup URL:', apiError);
      }

      // Method 2: Use list signup URL with form submission
      const formData = new FormData();
      formData.append('email', email);
      
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
        
        console.log(`Successfully submitted to Klaviyo ${listType} list signup`);
        return { success: true, method: 'list_signup', listType };
        
      } catch (listError) {
        console.log('List signup failed, trying iframe method:', listError);
      }

      // Method 3: Hidden iframe method (most reliable for cross-origin)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.name = `klaviyo-signup-${listType}`;
      document.body.appendChild(iframe);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = klaviyoSignupUrl;
      form.target = `klaviyo-signup-${listType}`;

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

      console.log(`Successfully submitted via iframe method to ${listType} list`);
      return { success: true, method: 'iframe', listType };

    } catch (error) {
      console.error(`All Klaviyo methods failed for ${listType} list:`, error);
      
      // Final fallback - log for manual processing
      const leadData = {
        email,
        company: company || '',
        source: `Email Delivery Checker - ${listType}`,
        domain_issues: domainIssues.join(', ') || 'None detected',
        domain_issues_count: domainIssues.length,
        timestamp: new Date().toISOString(),
        list_type: listType,
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

      console.log(`MANUAL PROCESSING NEEDED - Klaviyo ${listType} lead data:`, leadData);
      
      throw new Error(`All Klaviyo integration methods failed for ${listType} list`);
    }
  };

  const handleEmailSubmit = () => {
    if (!formData.userEmail) {
      alert('Please enter your email address');
      return;
    }

    // Show full results and add to calculator list
    displayImpactResults(calculationData);
    setCalculationComplete(true);
    addToKlaviyo(formData.userEmail, formData.companyName, 'calculator').catch(console.error);
  };

  const sendGuide = async () => {
    if (!formData.userEmail) {
      alert('Please enter your email address');
      return;
    }

    if (!domainCheckComplete && !calculationComplete) {
      alert('Please run the domain check or calculator first');
      return;
    }

    try {
      // Add to guide request list
      await addToKlaviyo(formData.userEmail, formData.companyName, 'guide');
      
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
    const email = formData.userEmail;
    const company = formData.companyName;
    
    let urgencyMessage = '';
    if (domainIssues.length > 0 && calculationComplete) {
      const monthlyLoss = calculateMonthlyLoss();
      urgencyMessage = `⚠️ Urgent: Based on your data, you're losing approximately ${monthlyLoss.toLocaleString()}/month in revenue. Every day you wait costs you money!`;
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
      summary += `<p><strong>💰 Monthly Revenue Impact:</strong> ${monthlyLoss.toLocaleString()}</p>`;
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
                placeholder="yourdomain.com"
                className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter just the domain name without "www" or "https://"
              </p>
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
                <p>Checking DNS records for {formData.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}...</p>
                <p className="text-sm text-gray-500">This may take a few seconds</p>
              </div>
            )}
            
            {domainResults}
          </div>

          {/* Email Capture Section */}
          <div className="mb-10 p-8 bg-gray-50 rounded-xl border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">📧 Get Your Custom Fix-It Guide</h2>
            <p className="mb-5 text-gray-600">
              {calculationComplete ? 
                "Want a detailed step-by-step guide to fix these issues?" : 
                "Complete the domain check or calculator above to receive a detailed report with step-by-step instructions."
              }
            </p>
            
            {!calculationComplete && (
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Your Email Address:</label>
                <input
                  type="email"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  placeholder="you@yourdomain.com"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg text-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {(domainCheckComplete || calculationComplete) && (
                <button
                  onClick={sendGuide}
                  disabled={!formData.userEmail}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    formData.userEmail
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  📨 Send Me the Fix-It Guide
                </button>
              )}
              
              {/* Show consultation button after any check is complete OR always show it */}
              <button
                onClick={() => window.open('https://cal.com/stevenwagner/inboxsos', '_blank')}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all"
              >
                🚀 Schedule Free Consultation
              </button>
            </div>
            
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
