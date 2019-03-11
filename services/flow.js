const df = require('dialogflow');
const uuid = require('uuid/v1');
const projectId = process.env.PROJECT_ID;
const sessionId = uuid();

let sessionClient = null;
if (process.env.NODE === 'development') {
    sessionClient = new df.SessionsClient();
} else {
    credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    sessionClient = new df.SessionsClient(credentials);
}


const sessionPath = sessionClient.sessionPath(projectId, sessionId);

async function getQueryResult(query, contexts = null) {
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: 'en-US'
            }
        }
    }
    if (contexts) {
        request.queryParams = {contexts};
    }
    const responses = await sessionClient.detectIntent(request);
    return responses;
}

//This is where the dialog flow API function should be
//What am I doing here?
//I should be getting the user queries and getting responses from the dialogflow which includes the intents and contents of the intent

module.exports = {
    getQueryResult
};