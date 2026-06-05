const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE = "https://graph.instagram.com/v21.0";

/**
 * GET /instagram/profile
 * Returns profile info including followers_count and media_count.
 * Requires: instagram_business_basic scope
 */
router.get("/profile", async (req, res) => {
  const { token } = req.query;
  try {
    const r = await axios.get(
      `${BASE}/me?fields=id,username,account_type,followers_count,media_count,profile_picture_url&access_token=${token}`
    );
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

/**
 * GET /instagram/media
 * Returns last 12 posts with engagement data.
 * Requires: instagram_business_basic scope
 */
router.get("/media", async (req, res) => {
  const { token } = req.query;
  try {
    const r = await axios.get(
      `${BASE}/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url&limit=12&access_token=${token}`
    );
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

/**
 * GET /instagram/media/:mediaId
 * Returns full detail for a single post.
 * Requires: instagram_business_basic scope
 */
router.get("/media/:mediaId", async (req, res) => {
  const { token } = req.query;
  const { mediaId } = req.params;
  try {
    const r = await axios.get(
      `${BASE}/${mediaId}?fields=id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url,permalink&access_token=${token}`
    );
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

/**
 * GET /instagram/media/:mediaId/insights
 * Returns reach, saved, and shares (REELS only) for a single post.
 * Requires: instagram_business_manage_insights scope + App Review approval
 */
router.get("/media/:mediaId/insights", async (req, res) => {
  const { token } = req.query;
  const { mediaId } = req.params;
  try {
    // Check media type first — metrics differ by type
    const media = await axios.get(
      `${BASE}/${mediaId}?fields=media_type,media_product_type&access_token=${token}`
    );

    let metrics = ["reach", "saved"];
    if (media.data.media_product_type === "REELS") {
      metrics.push("shares");
    }

    const r = await axios.get(
      `${BASE}/${mediaId}/insights?metric=${metrics.join(",")}&access_token=${token}`
    );
    res.json(r.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

/**
 * GET /instagram/account-insights
 * Returns 30-day account-level reach (daily breakdown).
 * Requires: instagram_business_manage_insights scope + App Review approval
 *
 * Available metrics (as of 2025):
 *   reach, profile_views, total_interactions,
 *   likes, comments, shares, saves, follows_and_unfollows
 */
router.get("/account-insights", async (req, res) => {
  const { token } = req.query;
  const since = Math.floor(Date.now() / 1000) - 2592000; // 30 days ago
  const until = Math.floor(Date.now() / 1000);

  // Fetch each metric independently — one blocked metric won't kill all others
  const fetchMetric = async (metric) => {
    try {
      const r = await axios.get(
        `${BASE}/me/insights?metric=${metric}&period=day&since=${since}&until=${until}&access_token=${token}`
      );
      return r.data.data?.[0] || null;
    } catch {
      return null;
    }
  };

  const metrics = [
    "reach",
    "profile_views",
    "total_interactions",
    "likes",
    "comments",
    "shares",
    "saves",
  ];

  const results = await Promise.all(metrics.map(fetchMetric));
  res.json({ data: results.filter(Boolean) });
});

module.exports = router;
