// Required modules
require('dotenv').config();
const { BskyAgent } = require('@atproto/api');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// For Node.js versions prior to 18.x, you need to install node-fetch
// Uncomment the following line if you're using Node.js < 18
// const fetch = require('node-fetch');

// Configuration from environment variables
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;
const RSS_FEED_URL = 'https://community.sap.com/khhcw49343/rss/board?board.id=technology-blog-sap';
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const RATE_LIMIT_INTERVAL = 30 * 1000; // 1 post per 30 seconds
const POSTED_IDS_FILE = path.join(__dirname, 'posted_ids.json');

// Initialize the Bluesky agent
const agent = new BskyAgent({
  service: 'https://bsky.social',
});

// Main function
(async () => {
  try {
    // Login to Bluesky
    await agent.login({
      identifier: BLUESKY_USERNAME,
      password: BLUESKY_PASSWORD,
    });
    console.log('Logged into Bluesky successfully.');

    // Load or initialize the list of posted IDs
    let postedIds = [];
    if (fs.existsSync(POSTED_IDS_FILE)) {
      postedIds = JSON.parse(fs.readFileSync(POSTED_IDS_FILE, 'utf8'));
    } else {
      fs.writeFileSync(POSTED_IDS_FILE, JSON.stringify(postedIds, null, 2));
    }

    // Initialize XML parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    let lastPostTime = 0;

    // Function to check the RSS feed
    const checkFeed = async () => {
      try {
        console.log('Checking RSS feed...');

        // Fetch the RSS feed
        const response = await fetch(RSS_FEED_URL);
        const xmlData = await response.text();

        // Parse the XML
        const jsonObj = parser.parse(xmlData);

        // Extract items from the feed
        const items = jsonObj.rss.channel.item;

        // Ensure items is an array
        const feedItems = Array.isArray(items) ? items : [items];

        // Process items from oldest to newest
        for (const item of feedItems.reverse()) {
          const id = item.guid || item.link;

          // Skip if already posted
          if (postedIds.includes(id)) {
            continue;
          }

          // Enforce rate limit
          const now = Date.now();
          const timeSinceLastPost = now - lastPostTime;
          if (timeSinceLastPost < RATE_LIMIT_INTERVAL) {
            const waitTime = RATE_LIMIT_INTERVAL - timeSinceLastPost;
            console.log(`Rate limit in effect. Waiting ${waitTime / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }

          // Create post content with metadata
          const author = item['dc:creator'] || item['creator'] || 'Unknown Author';
        //   const pubDate = item.pubDate ? new Date(item.pubDate).toLocaleString() : 'Unknown Date';
          const postContent = `📰 New Blog Post: "${item.title}"\n👤 Author: ${author}\n🔗 Read more: ${item.link}`;

          // Post to Bluesky
          await agent.post({
            text: postContent,
            createdAt: new Date().toISOString(),
          });

          console.log(`Posted to Bluesky: "${item.title}"`);

          // Update last post time and posted IDs
          lastPostTime = Date.now();
          postedIds.push(id);
          fs.writeFileSync(POSTED_IDS_FILE, JSON.stringify(postedIds, null, 2));
        }
      } catch (error) {
        console.error('Error checking feed:', error);
      }
    };

    // Initial feed check
    await checkFeed();

    // Schedule the feed check every 5 minutes
    setInterval(checkFeed, CHECK_INTERVAL);
  } catch (error) {
    console.error('Error initializing the script:', error);
  }
})();