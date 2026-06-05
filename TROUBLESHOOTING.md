# Troubleshooting Instagram OAuth with Node.js

Common errors encountered when implementing Instagram OAuth 2.0 and the Instagram Graph API with Node.js. Error strings are copied verbatim so you can search for them directly.

---

### Error: `Invalid Request: Request parameters are invalid: Invalid platform app`

**Cause:** One of three things:
- You are using the **Facebook App ID** instead of the **Instagram App ID**. These are different values inside the same Meta app.
- The **redirect URI** in your authorization URL does not exactly match the one registered in Meta Developer Console (including trailing slashes, `http` vs `https`).
- The Meta app type is not set to **Consumer**.

**Fix:**
1. Go to Meta Developer Console → Your App → **Instagram** → **API setup with Instagram login**.
2. Copy the **Instagram App ID** and **Instagram App Secret** (not the Facebook App ID at the top of the Basic Settings page).
3. Confirm your app type: **App Settings → Basic → App Type → Consumer**.
4. Confirm redirect URI matches exactly in both your `.env` and the Meta Dashboard registered URIs field.

---

### Error: `Application does not have permission for this action` (code 10)

**Cause:** The scope you requested (`instagram_business_manage_insights`, `instagram_business_content_publish`, etc.) has not been approved via Meta App Review.

**Fix:**
- In development mode, only the app admin account and explicitly added Instagram Testers can grant these scopes.
- For all users: submit **App Review** → Permissions and Features → request the required permission → provide a screencast and use-case description.
- While waiting for review, fetch metrics individually — `reach` is available without review, but `total_interactions`, `profile_views`, `saves` require approval.

---

### Error: `The callback URL or verify token couldn't be validated`

**Cause:** You accidentally entered your OAuth redirect URI into the **Webhooks** section (Step 3 on the Instagram API setup page), not the OAuth redirect URI field.

**Fix:**
- Ignore the Webhooks section entirely for OAuth testing.
- Scroll to **Step 4: Set up Instagram business login** → click **Set up** → enter your redirect URI there.
- Webhooks require a publicly reachable HTTPS endpoint that responds to a GET verification challenge. Not needed for basic OAuth.

---

### Error: `Error saving redirect URIs. Verify your redirect URIs and try again.`

**Cause:** Meta does not accept `localhost` as a valid redirect URI for Instagram business login.

**Fix:**
- Use [ngrok](https://ngrok.com) to expose your local server:
  ```bash
  ngrok http 4000
  ```
- Use the generated `https://xxxx.ngrok-free.app` URL as your redirect URI in both `.env` and Meta Dashboard.
- Update `.env`:
  ```
  REDIRECT_URI=https://xxxx.ngrok-free.app/auth/instagram/callback
  ```
- Restart your server after updating `.env`.

---

### Error: `metric[1] must be one of the following values: reach, follower_count, website_clicks, profile_views...`

**Cause:** You are requesting deprecated or renamed metrics. `impressions` was removed from account-level insights. The valid metric list changed in 2024–2025.

**Fix:** Use only currently supported metrics:
```
reach, profile_views, total_interactions, likes, comments, shares, saves,
follows_and_unfollows, profile_links_taps, accounts_engaged
```

Replace `impressions` with `total_interactions` for account-level engagement tracking.

---

### Error: `Unsupported get request. Object with ID 'xxx' does not exist, cannot be loaded due to missing permissions, or does not support this operation` (code 100, subcode 33)

**Cause:** You are fetching the user profile using `/{user_id}` with the user ID returned by the token exchange. The new Instagram API requires `/me` instead.

**Fix:**
```js
// Wrong
axios.get(`https://graph.instagram.com/v21.0/${user_id}?fields=id,username&access_token=${token}`)

// Correct
axios.get(`https://graph.instagram.com/v21.0/me?fields=id,username,account_type&access_token=${token}`)
```

---

### Error: `authentication failed: Your ngrok-agent version "x.x.x" is too old`

**Cause:** The ngrok version installed via `npm`/`pnpm` is a deprecated third-party wrapper, not the real ngrok binary. The real ngrok requires agent version 3.20.0+.

**Fix:**
```powershell
# Windows — via winget
winget install ngrok.ngrok

# Then authenticate
ngrok config add-authtoken <your_token_from_dashboard.ngrok.com>
ngrok http 4000
```
Do **not** install ngrok via `npm install -g ngrok` — that package is unmaintained.

---

### Error: `Insufficient Developer Role: Insufficient developer role`

**Cause:** The Instagram account trying to authorize is not added as a tester on the Meta app, and the app is still in Development mode.

**Fix:**
1. Meta Dashboard → **App Roles** → **Roles** → **Instagram Testers** → **Add Instagram Testers** → enter IG username.
2. The user must accept the invite: Instagram app → **Settings** → **Apps and Websites** → **Tester Invites** → **Accept**.
3. Alternatively, publish the app (requires privacy policy URL, app icon, category, and Meta App Review for restricted permissions).
