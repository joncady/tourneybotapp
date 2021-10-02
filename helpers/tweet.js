const { TwitterApi } = require("twitter-api-v2");

require('dotenv').config()

const tweet = async (accessToken, accessSecret, handle, station) => {
    const client = new TwitterApi({
        appKey: process.env.CONSUMER_KEY,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken,
        accessSecret
    });

    const rwClient = client.readWrite;

    let tweetText = `${handle}, it's time to play your match`
    if (station) {
        tweetText += `at station ${station}`;
    }
    const sentTweet = await rwClient.v1.tweet(tweetText);
    if (sentTweet) {
        console.log(`Tweet sent successfully: ${sentTweet.created_at}`);
    } else {
        console.log("Tweet failed to post.");
    }
}

module.exports = {
    tweet
}