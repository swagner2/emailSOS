// /api/add-to-klaviyo endpoint
app.post('/api/add-to-klaviyo', async (req, res) => {
  const { email, properties } = req.body;
  
  try {
    // Create/update profile
    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-06-15'
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: { email, properties }
        }
      })
    });

    const profile = await profileResponse.json();
    
    // Add to list
    await fetch(`https://a.klaviyo.com/api/lists/${process.env.KLAVIYO_LIST_ID}/relationships/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
        'revision': '2024-06-15'
      },
      body: JSON.stringify({
        data: [{ type: 'profile', id: profile.data.id }]
      })
    });

    res.json({ success: true, profileId: profile.data.id });
  } catch (error) {
    console.error('Klaviyo error:', error);
    res.status(500).json({ error: 'Failed to add to Klaviyo' });
  }
});
