// Required modules
require('dotenv').config();
const { BskyAgent, RichText } = require('@atproto/api');
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// For Node.js versions prior to 18.x, install and uncomment the following line
// const fetch = require('node-fetch');

// Configuration from environment variables
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME;
const BLUESKY_PASSWORD = process.env.BLUESKY_PASSWORD;

// Array of RSS feed URLs
const RSS_FEED_URLS = [
  'https://community.sap.com/khhcw49343/rss/board?board.id=technology-blog-sap',
  'https://your-second-rss-feed-url.com/rss', // Replace with your second RSS feed URL
];

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
    let postedIds = {};
    if (fs.existsSync(POSTED_IDS_FILE)) {
      const data = fs.readFileSync(POSTED_IDS_FILE, 'utf8');
      postedIds = JSON.parse(data);
      // If postedIds is an array (from the old format), convert it to an object
      if (Array.isArray(postedIds)) {
        const tempPostedIds = {};
        for (const id of postedIds) {
          tempPostedIds[id] = null;
        }
        postedIds = tempPostedIds;
      }
    } else {
      fs.writeFileSync(POSTED_IDS_FILE, JSON.stringify(postedIds, null, 2));
    }

    // Initialize XML parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    let lastPostTime = 0;

    // Function to check the RSS feeds
    const checkFeeds = async () => {
      try {
        console.log('Checking RSS feeds...');

        // Iterate over each RSS feed URL
        for (const feedUrl of RSS_FEED_URLS) {
          console.log(`Processing feed: ${feedUrl}`);

          // Fetch the RSS feed
          const response = await fetch(feedUrl);
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
            // Create a unique key combining feed URL and item ID to avoid conflicts
            const uniqueId = `${feedUrl}::${id}`;

            // Skip if already posted
            if (postedIds.hasOwnProperty(uniqueId)) {
              continue;
            }

            // Enforce rate limit
            const now = Date.now();
            const timeSinceLastPost = now - lastPostTime;
            if (timeSinceLastPost < RATE_LIMIT_INTERVAL) {
              const waitTime = RATE_LIMIT_INTERVAL - timeSinceLastPost;
              console.log(
                `Rate limit in effect. Waiting ${waitTime / 1000} seconds...`
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }

            // Create post content with metadata
            const author =
              item['dc:creator'] || item['creator'] || 'Unknown Author';

            // Prepare the post content without pubDate
            const postText = `📰 New Blog Post: "${item.title}"\n👤 Author: ${author}\n🔗 Read more: ${item.link}`;

            // Create a RichText instance
            const rt = new RichText({ text: postText });

            // Detect facets (links, mentions, hashtags)
            await rt.detectFacets(agent);

            // Check if the content exceeds the limit
            const { charactersRemaining } = rt;
            if (charactersRemaining < 0) {
              // Truncate the text and re-detect facets
              rt.setText(
                rt.text.slice(0, rt.text.length + charactersRemaining - 1) + '…'
              );
              await rt.detectFacets(agent);
              console.log('Post content was too long and has been truncated.');
            }

            // Post to Bluesky
            const postResponse = await agent.post({
              text: rt.text,
              facets: rt.facets,
              createdAt: new Date().toISOString(),
            });

            console.log(`Posted to Bluesky: "${item.title}"`);

            // Update last post time and posted IDs
            lastPostTime = Date.now();

            // Save the Bluesky post ID (URI)
            const blueskyPostId = postResponse.uri;

            // Update postedIds with the mapping
            postedIds[uniqueId] = blueskyPostId;
            fs.writeFileSync(
              POSTED_IDS_FILE,
              JSON.stringify(postedIds, null, 2)
            );
          }
        }
      } catch (error) {
        console.error('Error checking feeds:', error);
      }
    };

    // Initial feed check
    await checkFeeds();

    // Schedule the feed check every 5 minutes
    setInterval(checkFeeds, CHECK_INTERVAL);
  } catch (error) {
    console.error('Error initializing the script:', error);
  }
})();
