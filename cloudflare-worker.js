// Cloudflare Worker: Relay for Google Sheets and Klaviyo
// Deploy with: wrangler publish

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // --- Google Sheets Integration ---
    let sheetsResult = null;
    try {
      const sheetsRes = await fetch('https://script.google.com/macros/s/AKfycbyRTCsheo6-ssx-7Ylu263nep5p6zDGMR1c-wtS5qIeY-uLnS2itilZOK2k0qTW2sJ_/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      sheetsResult = await sheetsRes.json();
    } catch (e) {
      sheetsResult = { error: e.message };
    }

    // --- Klaviyo Integration ---
    let klaviyoResult = null;
    if (data.email && data.klaviyoListId) {
      try {
        const klaviyoRes = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
          method: 'POST',
          headers: {
            'Authorization': 'Klaviyo-API-Key Mzfpkb',
            'Content-Type': 'application/json',
            'revision': '2024-10-15',
          },
          body: JSON.stringify({
            data: {
              type: 'profile-subscription-bulk-create-job',
              attributes: {
                profiles: {
                  data: [{
                    type: 'profile',
                    attributes: {
                      email: data.email,
                      subscriptions: {
                        email: { marketing: { consent: 'SUBSCRIBED' } }
                      },
                      properties: {
                        source: data.source || 'roi-tool',
                        domain_checked: data.domain,
                        timestamp: new Date().toISOString(),
                      },
                    },
                  }],
                },
                historical_import: false,
              },
              relationships: {
                list: { data: { type: 'list', id: data.klaviyoListId } },
              },
            },
          }),
        });
        klaviyoResult = await klaviyoRes.json();
      } catch (e) {
        klaviyoResult = { error: e.message };
      }
    }

    return new Response(JSON.stringify({
      sheetsResult,
      klaviyoResult,
      ok: (!sheetsResult?.error && (!data.email || !klaviyoResult?.error)),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};