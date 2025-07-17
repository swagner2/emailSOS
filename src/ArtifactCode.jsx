<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email SOS Delivery Checker & ROI Calculator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(45deg, #2c3e50, #3498db);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .main-content {
            padding: 40px;
        }

        .section {
            margin-bottom: 40px;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 4px solid #3498db;
        }

        .section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.8em;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #34495e;
        }

        input[type="text"], input[type="number"], input[type="email"] {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input:focus {
            outline: none;
            border-color: #3498db;
        }

        .btn {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-right: 10px;
            margin-bottom: 10px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
        }

        .btn-secondary {
            background: linear-gradient(45deg, #95a5a6, #7f8c8d);
        }

        .check-result {
            margin-top: 20px;
            padding: 20px;
            border-radius: 8px;
            display: none;
        }

        .check-result.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .check-result.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .check-result.warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .status-pass { background: #27ae60; }
        .status-fail { background: #e74c3c; }
        .status-warn { background: #f39c12; }

        .calculator-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .impact-display {
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-top: 30px;
        }

        .impact-display h3 {
            font-size: 2em;
            margin-bottom: 10px;
        }

        .impact-display .amount {
            font-size: 3em;
            font-weight: bold;
            margin: 20px 0;
        }

        .recommendations {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }

        .recommendations h4 {
            color: #2c3e50;
            margin-bottom: 15px;
        }

        .recommendations ul {
            list-style: none;
            padding: 0;
        }

        .recommendations li {
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }

        .recommendations li:last-child {
            border-bottom: none;
        }

        .recommendations li:before {
            content: "✓";
            color: #27ae60;
            font-weight: bold;
            margin-right: 10px;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .main-content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Email Delivery Checker & ROI Calculator</h1>
            <p>Analyze your email infrastructure and calculate the cost of poor deliverability</p>
        </div>

        <div class="main-content">
            <!-- Domain Check Section -->
            <div class="section">
                <h2>🔍 Domain Email Infrastructure Check</h2>
                <div class="form-group">
                    <label for="domain">Enter your domain (e.g., example.com):</label>
                    <input type="text" id="domain" placeholder="example.com">
                </div>
                <button class="btn" onclick="checkDomain()">Check Email Records</button>
                
                <div class="loading" id="domainLoading">
                    <div class="spinner"></div>
                    <p>Checking your domain's email records...</p>
                </div>
                
                <div id="domainResults"></div>
            </div>

            <!-- Email Capture Section -->
            <div class="section">
                <h2>📧 Get Your Custom Fix-It Guide</h2>
                <p style="margin-bottom: 20px; color: #666;">Enter your email to receive a detailed report with step-by-step instructions to fix your email deliverability issues.</p>
                <div class="grid-2">
                    <div class="form-group">
                        <label for="userEmail">Your Email Address:</label>
                        <input type="email" id="userEmail" placeholder="you@yourdomain.com">
                    </div>
                    <div class="form-group">
                        <label for="companyName">Company Name (Optional):</label>
                        <input type="text" id="companyName" placeholder="Your Company">
                    </div>
                </div>
                <button class="btn" onclick="sendResults()" id="sendResultsBtn" disabled>📨 Send Me the Fix-It Guide</button>
                <button class="btn" onclick="scheduleConsultation()" style="background: linear-gradient(45deg, #e74c3c, #c0392b);">🚀 Hire Us to Fix This For You</button>
                
                <div id="emailCapture" class="check-result" style="margin-top: 20px;"></div>
            </div>

            <!-- Email Marketing Calculator Section -->
            <div class="section">
                <h2>📊 Email Marketing Performance Calculator</h2>
                <div class="calculator-grid">
                    <div class="form-group">
                        <label for="listSize">Email List Size:</label>
                        <input type="number" id="listSize" placeholder="10000">
                    </div>
                    <div class="form-group">
                        <label for="avgOrderValue">Average Order Value ($):</label>
                        <input type="number" id="avgOrderValue" placeholder="75">
                    </div>
                    <div class="form-group">
                        <label for="openRate">Current Open Rate (%):</label>
                        <input type="number" id="openRate" placeholder="20">
                    </div>
                    <div class="form-group">
                        <label for="clickRate">Click-Through Rate (%):</label>
                        <input type="number" id="clickRate" placeholder="3">
                    </div>
                    <div class="form-group">
                        <label for="conversionRate">Conversion Rate (%):</label>
                        <input type="number" id="conversionRate" placeholder="2">
                    </div>
                    <div class="form-group">
                        <label for="emailsPerMonth">Emails Sent Per Month:</label>
                        <input type="number" id="emailsPerMonth" placeholder="4">
                    </div>
                </div>
                <button class="btn" onclick="calculateImpact()">Calculate Impact</button>
                
                <div id="impactResults"></div>
            </div>
        </div>
    </div>

    <script>
        let domainIssues = [];
        let calculationData = {};
        let domainCheckComplete = false;
        let calculationComplete = false;

        async function checkDomain() {
            const domain = document.getElementById('domain').value.trim();
            if (!domain) {
                alert('Please enter a domain name');
                return;
            }

            document.getElementById('domainLoading').style.display = 'block';
            document.getElementById('domainResults').innerHTML = '';
            domainIssues = [];

            // Simulate DNS lookups (in real implementation, these would be actual DNS queries)
            setTimeout(() => {
                const results = simulateDNSCheck(domain);
                displayDomainResults(results);
                document.getElementById('domainLoading').style.display = 'none';
            }, 2000);
        }

        function simulateDNSCheck(domain) {
            // Simulate realistic DNS check results
            const hasIssues = Math.random() > 0.3; // 70% chance of having issues
            
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
                status: 'pass', // MX records are usually present
                message: 'Valid MX records found',
                impact: 'MX records route your incoming emails properly'
            };

            const results = [spfResult, dkimResult, dmarcResult, mxResult];
            
            // Track issues for impact calculation
            results.forEach(result => {
                if (result.status === 'fail') {
                    domainIssues.push(result.name);
                }
            });

            return results;
        }

        function displayDomainResults(results) {
            const resultsDiv = document.getElementById('domainResults');
            let html = '<div class="check-result success" style="display: block;"><h3>Domain Analysis Results</h3>';
            
            results.forEach(result => {
                const statusClass = result.status === 'pass' ? 'status-pass' : 'status-fail';
                html += `
                    <div style="margin: 15px 0; padding: 10px; border-left: 3px solid ${result.status === 'pass' ? '#27ae60' : '#e74c3c'};">
                        <strong><span class="status-indicator ${statusClass}"></span>${result.name}</strong><br>
                        ${result.message}<br>
                        <small style="color: #666;">${result.impact}</small>
                    </div>
                `;
            });

            if (domainIssues.length > 0) {
                html += `
                    <div class="recommendations">
                        <h4>🚨 Issues Found - These are hurting your email deliverability:</h4>
                        <ul>
                            ${domainIssues.map(issue => `<li>Fix ${issue} configuration</li>`).join('')}
                        </ul>
                        <p><strong>Impact:</strong> These issues can reduce your email deliverability by 20-40% and harm your sender reputation.</p>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <strong>✅ Great job! Your email infrastructure looks solid.</strong><br>
                        Your domain has proper email authentication configured.
                    </div>
                `;
            }

            html += '</div>';
            resultsDiv.innerHTML = html;
        }

        function updateSendButton() {
            const sendBtn = document.getElementById('sendResultsBtn');
            const email = document.getElementById('userEmail').value.trim();
            
            if (email && (domainCheckComplete || calculationComplete)) {
                sendBtn.disabled = false;
                sendBtn.style.opacity = '1';
            } else {
                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.6';
            }
        }
        async function sendLeadToGoogleSheet(leadData) {
        // Replace with your Google Apps Script Web App URL
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
            try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            if (response.ok) {
                console.log('✅ Lead sent to Google Sheet');
            } else {
                console.error('❌ Google Sheet logging failed:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Failed to log lead:', error);
        }
}

        function sendResults() {
            const email = document.getElementById('userEmail').value.trim();
            const company = document.getElementById('companyName').value.trim();
            
            if (!email) {
                alert('Please enter your email address');
                return;
            }

            if (!domainCheckComplete && !calculationComplete) {
                alert('Please run the domain check or calculator first');
                return;
            }

            // Simulate sending email
            const resultDiv = document.getElementById('emailCapture');
            resultDiv.className = 'check-result success';
            resultDiv.style.display = 'block';
            
            let reportSummary = generateReportSummary();
            
            resultDiv.innerHTML = `
                <h3>✅ Custom Fix-It Guide Sent!</h3>
                <p>We've sent a detailed report to <strong>${email}</strong> that includes:</p>
                <ul style="text-align: left; margin: 15px 0;">
                    <li>📋 Complete analysis of your current email setup</li>
                    <li>🔧 Step-by-step technical instructions to fix each issue</li>
                    <li>💰 Your personalized revenue recovery potential</li>
                    <li>⏱️ Implementation timeline and priority order</li>
                    <li>🎯 Advanced optimization strategies</li>
                </ul>
                <p><strong>Check your inbox in the next few minutes!</strong></p>
                ${reportSummary}
            `;

            // In a real implementation, you would send this data to your backend
            sendLeadToGoogleSheet({
            email,
            company,
            domainIssues,
            listSize: calculationData.listSize || '',
            avgOrderValue: calculationData.avgOrderValue || '',
            openRate: calculationData.openRate || '',
            clickRate: calculationData.clickRate || '',
            conversionRate: calculationData.conversionRate || '',
            emailsPerMonth: calculationData.emailsPerMonth || '',
            monthlyLoss: calculateMonthlyLoss() || '',
            annualLoss: (calculateMonthlyLoss() * 12) || ''
        });

        function scheduleConsultation() {
            const email = document.getElementById('userEmail').value.trim();
            const company = document.getElementById('companyName').value.trim();
            
            // In a real implementation, this would redirect to your booking system
            // or open a calendar widget
            
            const resultDiv = document.getElementById('emailCapture');
            resultDiv.className = 'check-result warning';
            resultDiv.style.display = 'block';
            
            let urgencyMessage = '';
            if (domainIssues.length > 0) {
                const data = calculationData;
                if (data.listSize && data.avgOrderValue) {
                    const monthlyLoss = calculateMonthlyLoss();
                    urgencyMessage = `<p style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;"><strong>⚠️ Urgent:</strong> Based on your data, you're losing approximately <strong>${monthlyLoss.toLocaleString()}/month</strong> in revenue. Every day you wait costs you money!</p>`;
                }
            }
            
            resultDiv.innerHTML = `
                <h3>🚀 Let's Fix This Together!</h3>
                ${urgencyMessage}
                <p>Our email deliverability experts can fix your email infrastructure in 2-3 days and get you back to full deliverability.</p>
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 15px 0;">
                    <h4>What We'll Do For You:</h4>
                    <ul style="text-align: left;">
                        <li>✅ Complete SPF, DKIM, and DMARC setup</li>
                        <li>✅ Email authentication configuration</li>
                        <li>✅ Sender reputation optimization</li>
                        <li>✅ Email warm-up strategy</li>
                        <li>✅ Ongoing monitoring setup</li>
                        <li>✅ 30-day performance guarantee</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <button class="btn" style="background: linear-gradient(45deg, #27ae60, #229954); font-size: 18px; padding: 15px 30px;" onclick="openBookingPage()">
                        📅 Schedule Free Consultation
                    </button>
                </div>
                <p><small>💰 <strong>Investment:</strong> Starting at $997 - typically pays for itself in the first month</small></p>
            `;
        }

        function generateReportSummary() {
            if (!domainCheckComplete && !calculationComplete) return '';
            
            let summary = '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;"><h4>Your Report Preview:</h4>';
            
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
            return summary;
        }

        function calculateMonthlyLoss() {
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
        }

        function openBookingPage() {
            // Open the actual booking page
            window.open('https://cal.com/stevenwagner/inboxsos', '_blank');
        }

        // Add event listeners for email input
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('userEmail').addEventListener('input', updateSendButton);
        });
            domainCheckComplete = true;
            updateSendButton();
        }

        function calculateImpact() {
            const listSize = parseInt(document.getElementById('listSize').value) || 0;
            const avgOrderValue = parseFloat(document.getElementById('avgOrderValue').value) || 0;
            const openRate = parseFloat(document.getElementById('openRate').value) || 0;
            const clickRate = parseFloat(document.getElementById('clickRate').value) || 0;
            const conversionRate = parseFloat(document.getElementById('conversionRate').value) || 0;
            const emailsPerMonth = parseInt(document.getElementById('emailsPerMonth').value) || 0;

            if (!listSize || !avgOrderValue || !openRate || !clickRate || !conversionRate || !emailsPerMonth) {
                alert('Please fill in all fields');
                return;
            }

            calculationData = {
                listSize,
                avgOrderValue,
                openRate,
                clickRate,
                conversionRate,
                emailsPerMonth
            };

            displayImpactResults();
            calculationComplete = true;
            updateSendButton();
        }

        function displayImpactResults() {
            const data = calculationData;
            const resultsDiv = document.getElementById('impactResults');
            
            // Current performance
            const currentOpens = (data.listSize * data.emailsPerMonth * data.openRate) / 100;
            const currentClicks = (currentOpens * data.clickRate) / 100;
            const currentConversions = (currentClicks * data.conversionRate) / 100;
            const currentRevenue = currentConversions * data.avgOrderValue;

            // Potential with good deliverability (assuming 30-50% improvement)
            const deliverabilityImpact = domainIssues.length > 0 ? 0.35 : 0.15; // 35% improvement if issues, 15% if already good
            const improvedOpens = currentOpens * (1 + deliverabilityImpact);
            const improvedClicks = (improvedOpens * data.clickRate) / 100;
            const improvedConversions = (improvedClicks * data.conversionRate) / 100;
            const improvedRevenue = improvedConversions * data.avgOrderValue;

            const monthlyLoss = improvedRevenue - currentRevenue;
            const annualLoss = monthlyLoss * 12;

            let html = `
                <div class="impact-display">
                    <h3>💰 Monthly Revenue Impact</h3>
                    <div class="amount">$${monthlyLoss.toLocaleString()}</div>
                    <p>You're potentially losing this much revenue per month due to poor email deliverability</p>
                    <div style="margin-top: 20px; font-size: 1.2em;">
                        <strong>Annual Impact: $${annualLoss.toLocaleString()}</strong>
                    </div>
                </div>

                <div class="grid-2" style="margin-top: 30px;">
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px;">
                        <h4>📈 Current Performance</h4>
                        <p><strong>Monthly Opens:</strong> ${currentOpens.toLocaleString()}</p>
                        <p><strong>Monthly Clicks:</strong> ${currentClicks.toLocaleString()}</p>
                        <p><strong>Monthly Conversions:</strong> ${currentConversions.toLocaleString()}</p>
                        <p><strong>Monthly Revenue:</strong> $${currentRevenue.toLocaleString()}</p>
                    </div>
                    <div style="background: #d4edda; padding: 20px; border-radius: 8px;">
                        <h4>🎯 Potential with Good Deliverability</h4>
                        <p><strong>Monthly Opens:</strong> ${improvedOpens.toLocaleString()}</p>
                        <p><strong>Monthly Clicks:</strong> ${improvedClicks.toLocaleString()}</p>
                        <p><strong>Monthly Conversions:</strong> ${improvedConversions.toLocaleString()}</p>
                        <p><strong>Monthly Revenue:</strong> $${improvedRevenue.toLocaleString()}</p>
                    </div>
                </div>
            `;

            if (domainIssues.length > 0) {
                html += `
                    <div class="recommendations">
                        <h4>🔧 Immediate Action Items to Recover Revenue:</h4>
                        <ul>
                            <li>Set up proper SPF record to authorize your sending servers</li>
                            <li>Configure DKIM signing for email authentication</li>
                            <li>Implement DMARC policy to protect your domain reputation</li>
                            <li>Use a reputable email service provider (ESP)</li>
                            <li>Monitor your sender reputation regularly</li>
                            <li>Clean your email list to remove inactive subscribers</li>
                            <li>Implement proper email warm-up procedures</li>
                        </ul>
                        <p><strong>Expected Timeline:</strong> 2-4 weeks to see significant improvement in deliverability</p>
                    </div>
                `;
            } else {
                html += `
                    <div class="recommendations">
                        <h4>🚀 Additional Optimization Opportunities:</h4>
                        <ul>
                            <li>Implement email list segmentation for better targeting</li>
                            <li>A/B test subject lines to improve open rates</li>
                            <li>Optimize email sending times for your audience</li>
                            <li>Use behavioral triggers for automated email sequences</li>
                            <li>Implement re-engagement campaigns for inactive subscribers</li>
                            <li>Focus on mobile optimization for better click rates</li>
                        </ul>
                    </div>
                `;
            }

            resultsDiv.innerHTML = html;
        }
    </script>
</body>
</html>
