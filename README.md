# **Bluesky SCN Bot**

A Node.js script that checks the SAP Community Network (SCN) RSS feed every 5 minutes and posts new blog entries to your [Bluesky](https://bsky.app/) account. The bot includes metadata like the author and publication date, maintains a local list of posted entries to avoid duplicates, and respects Bluesky's rate limits.

## **Table of Contents**

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Script](#running-the-script)
  - [Running Locally](#running-locally)
  - [Running in Production](#running-in-production)
- [Updating the Script in Production](#updating-the-script-in-production)
- [Logging and Monitoring](#logging-and-monitoring)
- [License](#license)

---

## **Features**

- **Automated Posting**: Automatically fetches new blog posts from the SCN RSS feed and posts them to Bluesky.
- **Metadata Inclusion**: Includes blog title, author, and a link to the original post.
- **Rate Limiting**: Respects a rate limit of one post every 30 seconds.
- **Duplicate Prevention**: Maintains a local record of posted blog entries to avoid duplicates.
- **Secure Credential Management**: Uses `dotenv` to manage sensitive information securely.
- **Facets Handling**: Properly formats links and mentions according to Bluesky's rich text specifications.

---

## **Prerequisites**

- **Node.js**: Version 14 or higher (Node.js 18+ recommended for native `fetch` API support).
- **Bluesky Account**: A valid Bluesky username and password.
- **Git**: For cloning the repository and updating the script.

---

## **Installation**

1. **Clone the Repository**

   ```bash
   git clone https://github.com/marianfoo/bluesky-scn-bot.git
   cd bluesky-scn-bot
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

---

## **Configuration**

1. **Create a `.env` File**

   In the project root directory, create a file named `.env`:

   ```bash
   touch .env
   ```

2. **Add Your Bluesky Credentials**

   Open the `.env` file and add your Bluesky username and password:

   ```env
   BLUESKY_USERNAME=your_bluesky_username
   BLUESKY_PASSWORD=your_bluesky_password
   ```

   **Note**: Replace `your_bluesky_username` and `your_bluesky_password` with your actual Bluesky credentials.

3. **Secure the `.env` File**

   Ensure the `.env` file is not tracked by Git by adding it to `.gitignore`:

   ```bash
   echo '.env' >> .gitignore
   ```

---

## **Running the Script**

### **Running Locally**

1. **Start the Script**

   ```bash
   node bluesky_rss_bot.js
   ```

2. **Verify Output**

   The script should log messages indicating it has logged into Bluesky and is checking the RSS feed.

### **Running in Production**

For production environments, it's recommended to use a process manager like **PM2** to keep the script running continuously.

#### **1. Install PM2 Globally**

```bash
npm install -g pm2
```

#### **2. Start the Script with PM2**

```bash
pm2 start bluesky_rss_bot.js --name bluesky-scn-bot
```

#### **3. Configure PM2 to Run on Startup**

```bash
pm2 startup
```

Follow the instructions output by the command to enable PM2 to run on system startup.

#### **4. Save the PM2 Process List**

```bash
pm2 save
```

---

## **Updating the Script in Production**

To update the script on your production server from the GitHub repository, follow these steps:

### **1. Navigate to Your Project Directory**

```bash
cd /path/to/bluesky-scn-bot
```

### **2. Stop the Running Script**

```bash
pm2 stop bluesky-scn-bot
```

### **3. Pull the Latest Changes from GitHub**

```bash
git pull origin main
```

**Note**: Replace `main` with the appropriate branch name if necessary.

### **4. Install Updated Dependencies**

If any dependencies have changed, install them:

```bash
npm install
```

### **5. Restart the Script with PM2**

```bash
pm2 restart bluesky-scn-bot
```

### **6. Save the PM2 Process List**

```bash
pm2 save
```

### **Automating Updates (Optional)**

For regular updates, you can set up a cron job or a deployment script to automate this process.

---

## **Logging and Monitoring**

- **View Logs**

  ```bash
  pm2 logs bluesky-scn-bot
  ```

- **Stream Logs**

  ```bash
  pm2 logs
  ```

- **Log Rotation**

  Install the PM2 log rotate module:

  ```bash
  pm2 install pm2-logrotate
  ```

  Configure log rotation settings:

  ```bash
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 7
  ```

---

## **License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## **Additional Information**

- **Data Persistence**

  - The script uses `posted_ids.json` to keep track of posted blog entries.
  - Ensure this file is backed up if necessary.

- **Security Considerations**

  - Keep your `.env` file secure and never commit it to version control.
  - Regularly update dependencies to patch security vulnerabilities.

- **Error Handling**

  - The script includes basic error handling and will log errors without crashing.
  - Consider enhancing error handling as needed for your production environment.

- **Contributions**

  - Contributions are welcome! Please open issues or submit pull requests for improvements.

---

**If you have any questions or need further assistance, feel free to contact the repository maintainer.**

# **Contact**

- **Author**: marianfoo
- **Email**: [your-email@example.com](mailto:your-email@example.com)

---

# **Summary**

The **Bluesky SCN Bot** script automates the process of fetching new blog posts from the SAP Community Network and posting them to your Bluesky account. This README provides an overview of the script's functionality and detailed instructions on how to install, configure, run, and update the script, both locally and in a production environment.

By following the steps outlined above, you can ensure that your production server is running the latest version of the script and that it continues to operate smoothly.