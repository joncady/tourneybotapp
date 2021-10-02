const { TwitterApi } = require('twitter-api-v2');
const { checkOrAddCredsForTwitter, checkCredsForTwitter } = require('./helpers/dynamodb')

const express = require('express')
const session = require('express-session')

const { queryValidEvent } = require('./helpers/smashgg');
const { startJobWithPhaseId } = require('./scheduler/schedule');

require('dotenv').config()

const app = express()

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.json());

app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false
}))

let keys = {

}

const port = 3000

app.get('/', async (req, res) => {
    let accountId = req.session.accountId;
    if (accountId) {
        let accountInfo = await checkCredsForTwitter(accountId);
        console.log(accountInfo);
    }

    const client = new TwitterApi({ appKey: process.env.CONSUMER_KEY, appSecret: process.env.CONSUMER_SECRET });
    const authLink = await client.generateAuthLink("http://localhost:3000/callback", { linkMode: 'authorize' });
    req.session.oauth_token_secret = authLink.oauth_token_secret;
    req.session.oauth_token = authLink.oauth_token

    res.render('pages/index', {
        authUrl: authLink.url
    });

})

app.get("/tourneyPage", (req, res) => {
    res.render("pages/tourney")
});

app.get('/callback', async (req, res) => {

    console.log(req.url)
    // Exact tokens from query string
    const { oauth_token, oauth_verifier } = req.query;
    // Get the saved oauth_token_secret from session
    const { oauth_token_secret } = req.session;

    console.log(oauth_token, oauth_verifier, oauth_token_secret)
    console.log(req.session.oauth_token === oauth_token);

    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
        return res.status(400).send('You denied the app or your session expired!');
    }

    // Obtain the persistent tokens
    // Create a client from temporary tokens
    const client = new TwitterApi({
        appKey: process.env.CONSUMER_KEY,
        appSecret: process.env.CONSUMER_SECRET,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
    });

    console.log("Made client")

    client.login(oauth_verifier)
        .then(async ({ client: loggedClient, accessToken, accessSecret }) => {
            // loggedClient is an authentificated client in behalf of some user
            // Store accessToken & accessSecret somewhere
            // req.session.id = user.accountId;
            // req.session.accessSecret = accessSecret;
            let user = await loggedClient.currentUser();
            req.session.twitterName = user.name;
            req.session.accountId = user.id;
            keys[user.id] = {
                accessToken,
                accessSecret
            }
            console.log("token: ", accessToken)
            console.log("secret: ", accessSecret)
            // try {
            // let data = await checkOrAddCredsForTwitter(user.id);
            // } catch (err) {
            //     console.log(data)
            // }
            // console.log(data)
            res.redirect("/tourneyPage")
        })
        .catch(() => res.status(403).send('Invalid verifier or access tokens!'));
})

app.post("/subscribeToTourney", (req, res) => {
    let phases = req.body;
    // call dynamo / set up subscription
})

app.get("/startJob", async (req, res) => {
    let phaseId = req.query.phaseId;
    await startJobWithPhaseId(phaseId);
    res.status(200).json({ status: "success" })
})

app.get("/registerTourney", async (req, res) => {
    let { tourneyId, eventId } = req.query;

    if (!tourneyId || !eventId) {
        res.status(400).json({ error: "Missing tourneyId or eventId" })
    }

    // call smashgg to check whether id is valid
    let phases = await queryValidEvent(tourneyId, eventId);

    res.status(200).json({ status: "success", phases })
})

app.listen(port, () => {
    console.log(`TourneyBot listening at http://localhost:${port}`)
})