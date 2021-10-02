const AWS = require("aws-sdk");

const documentClient = new AWS.DynamoDB.DocumentClient({ region: "us-west-2" });

const checkOrAddCredsForTwitter = async (userId, accessToken, accessSecret) => {
    
    const params = {
        TableName : "twitterAuth",
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": userId
        }
    };
    
    let data = await documentClient.query(params).promise();
    console.log(data);
}

const checkCredsForTwitter = async (userId) => {
    const params = {
        TableName : "twitterAuth",
        KeyConditionExpression: "#id = :userId",
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ProjectionExpression: "id, name", 
        ExpressionAttributeValues: {
            ":userId": `${userId}`
        }
    };
    
    try {
    let data = await documentClient.query(params).promise();
    console.log(data);
    } catch (err) {
        console.log(err)
    }
}

const addEventToWatchTable = () => {


}

module.exports = {
    checkOrAddCredsForTwitter,
    checkCredsForTwitter
}