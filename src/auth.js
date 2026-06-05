const express = require("express");
const axios = require("axios");
const router = express.Router();

const { IG_APP_ID, IG_APP_SECRET, REDIRECT_URI, FRONTEND_URL } = process.env;

/**
 * Step 1: Redirect user to Instagram authorization page.
 * Scopes:
 *   - instagram_business_basic       → profile, followers, media
 *   - instagram_business_manage_insights → reach, impressions (requires App Review)
 *
 * GET /auth/instagram
 */
router.get("/instagram", (req, res) => {
  const url =
    `https://www.instagram.com/oauth/authorize` +
    `?client_id=${IG_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=instagram_business_basic,instagram_business_manage_insights` +
    `&response_type=code` +
    `&enable_fb_login=0` +
    `&force_authentication=1`;

  res.json({ url });
});

/**
 * Step 2: Instagram redirects back here with ?code=...
 * Exchange the code for a short-lived access token, then fetch the user profile.
 *
 * GET /auth/instagram/callback
 */
router.get("/instagram/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "No authorization code received" });

  try {
    // Exchange code for access token
    const params = new URLSearchParams();
    params.append("client_id", IG_APP_ID);
    params.append("client_secret", IG_APP_SECRET);
    params.append("grant_type", "authorization_code");
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code", code);

    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      params
    );

    const { access_token } = tokenRes.data;

    // Fetch basic profile to confirm token works
    const profileRes = await axios.get(
      `https://graph.instagram.com/v21.0/me?fields=id,username,account_type&access_token=${access_token}`
    );

    // Redirect to frontend with token + user info
    res.redirect(
      `${FRONTEND_URL}/callback?token=${access_token}&user=${encodeURIComponent(
        JSON.stringify(profileRes.data)
      )}`
    );
  } catch (err) {
    const error = encodeURIComponent(
      JSON.stringify(err.response?.data || err.message)
    );
    res.redirect(`${FRONTEND_URL}/callback?error=${error}`);
  }
});

module.exports = router;
