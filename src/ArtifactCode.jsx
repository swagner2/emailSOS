// Email Delivery Checker & ROI Calculator

import React, { useState, useEffect } from 'react';

const App = () => {
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [showROI, setShowROI] = useState(false);
  const [listSize, setListSize] = useState('');
  const [aov, setAov] = useState('');
  const [openRate, setOpenRate] = useState('');
  const [ctr, setCtr] = useState('');
  const [roiData, setRoiData] = useState(null);

  const fetchEmailInfrastructure = async () => {
    // Placeholder for Google DNS API integration
    const mockData = {
      spf: 'Valid SPF record',
      dkim: 'Valid DKIM record',
      dmarc: 'Valid DMARC policy',
      mx: '2 MX Records Found',
      issues: false,
    };
    setInfrastructureData(mockData);
  };

  const calculateROI = () => {
    const opens = (parseFloat(openRate) / 100) * listSize;
    const clicks = (parseFloat(ctr) / 100) * opens;
    const conversions = (clicks * 0.1).toFixed(0);
    const revenue = (conversions * parseFloat(aov)).toFixed(0);
    const lostRevenue = (revenue * 0.2).toFixed(0);
    setRoiData({ conversions, revenue, lostRevenue });
    setShowROI(true);
  };

  const submitForm = async () => {
    setSubmitted(true);
    await fetchEmailInfrastructure();
    // Send to Google Sheets and Klaviyo
    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ domain, email, listSize, aov, openRate, ctr }),
    });
    // Send to Klaviyo list
    await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Klaviyo-API-Key Mzfpkb',
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: {
            email,
            consent: 'explicit',
            list_id: 'TCapS8',
          },
        },
      }),
    });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>📧 Email Delivery Checker & ROI Calculator</h1>
      <p style={{ textAlign: 'center' }}>Over 3,200 domains checked this month—are your emails being ignored?</p>

      {/* Client Logos */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 30 }}>
        <img src="/logo1.png" alt="Client 1" height="40" />
        <img src="/logo2.png" alt="Client 2" height="40" />
        <img src="/logo3.png" alt="Client 3" height="40" />
      </div>

      {/* Domain Checker */}
      <div>
        <input type="text" placeholder="Enter your domain" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ padding: 10, width: '60%' }} />
        <button onClick={fetchEmailInfrastructure} style={{ marginLeft: 10, padding: '10px 20px' }}>Check My Domain</button>
      </div>

      {infrastructureData && !submitted && (
        <div style={{ marginTop: 20 }}>
          <p><strong>SPF:</strong> {infrastructureData.spf}</p>
          <p><strong>DKIM:</strong> {infrastructureData.dkim}</p>
          <p><strong>DMARC:</strong> {infrastructureData.dmarc}</p>
          <p><strong>MX:</strong> {infrastructureData.mx}</p>
        </div>
      )}

      {!submitted && domain && (
        <div style={{ marginTop: 30, background: '#f0f0f0', padding: 20 }}>
          <p style={{ fontWeight: 'bold' }}>What email should we send the results to?</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, width: '60%' }} />
          <button onClick={submitForm} style={{ marginLeft: 10, padding: '10px 20px' }}>Send Results</button>
        </div>
      )}

      {submitted && (
        <div style={{ marginTop: 40 }}>
          <h2>📈 Get Your Deliverability Fix-It Plan</h2>
          <p>“Brands like yours typically see 18–25% open rates—how do you stack up?”</p>
          <input type="number" placeholder="List Size" value={listSize} onChange={(e) => setListSize(e.target.value)} style={{ padding: 10, marginRight: 10 }} />
          <input type="number" placeholder="Avg Order Value" value={aov} onChange={(e) => setAov(e.target.value)} style={{ padding: 10, marginRight: 10 }} />
          <input type="number" placeholder="Open Rate %" value={openRate} onChange={(e) => setOpenRate(e.target.value)} style={{ padding: 10, marginRight: 10 }} />
          <input type="number" placeholder="Click Through Rate %" value={ctr} onChange={(e) => setCtr(e.target.value)} style={{ padding: 10, marginRight: 10 }} />
          <button onClick={calculateROI} style={{ padding: '10px 20px' }}>Calculate ROI</button>

          {showROI && roiData && (
            <div style={{ marginTop: 30, background: '#fff0f0', padding: 20 }}>
              <h3>💸 Potential Revenue Lost: ${roiData.lostRevenue}</h3>
              <p>Estimated Conversions: {roiData.conversions}</p>
              <p>Estimated Revenue: ${roiData.revenue}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA Section */}
      <div style={{ marginTop: 40, background: '#e0ffe0', padding: 20 }}>
        <button onClick={() => window.open('https://cal.com/stevenwagner/inboxsos', '_blank')} style={{ padding: '10px 30px' }}>
          Hire Us to Fix It
        </button>
        <button onClick={() => window.open('https://www.klaviyo.com/list/U42FCU', '_blank')} style={{ padding: '10px 30px', marginLeft: 20 }}>
          ✅ Get My Deliverability Fix-It Plan
        </button>
      </div>

      {/* Testimonial */}
      <div style={{ marginTop: 40, padding: 20, background: '#f8f8f8' }}>
        <blockquote>
          “We had no idea we were leaving this much money on the table. Fixing our email setup with this tool brought in over $1M in additional revenue.” — CEO, Tumblerware
        </blockquote>
      </div>

      {/* VSL */}
      <div style={{ marginTop: 40 }}>
        <iframe width="100%" height="315" src="https://www.youtube.com/embed/YOUR_VIDEO_ID" title="VSL" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 60, padding: 20, textAlign: 'center', borderTop: '1px solid #ccc' }}>
        <a href="https://stevenwagner.com" target="_blank">Website</a> | <a href="https://linkedin.com/in/stevenwagner" target="_blank">LinkedIn</a> | <a href="https://linktr.ee/stevenwagner" target="_blank">Linktree</a>
      </footer>
    </div>
  );
};

export default App;
