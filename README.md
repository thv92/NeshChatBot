# NeshChatBot

Chatbot that gives barebones navigation to a user.
User needs to ask, "Give me directions to a well."
Then put in the Lease Name and Well Num and the bot will spit out a map with instructions.

Deployed on heroku: https://nesh-routes-bot.herokuapp.com/

## Setup
* Requires for you to have a Google Cloud Platform account with billing enabled
* ngrok is required for Twilio to work. Please tunnel the project using something like "ngrok http 3000"
* I have included the credentials and environment variables in this case to be able to run locally without a hitch.
* To run the project locally:
    * export NODE_ENV=development
    * run "npm startWatch"
* Twilio trial version requires that you verify a number in order to send a text message to it, so please let me know the number you'd like to send the text message to


## DialogFlow Setup
1. Dialogflow Setup
2. Create an account on Dialogflow
3. Create a new Dialogflow agent
4. Restore the NeshRoutesDialog.zip ZIP file in the root of this repo
5. Go to your agent's settings and then the Export and Import tab
6. Click the Restore from ZIP button
7. Select the NeshRoutesDialog.zip ZIP file in the root of this repo
8. Type RESTORE and and click the Restore button

## Environment Variables Required
* FIREBASE_APPLICATIONS_CREDENTIALS (JSON keyfile from GCP | Need to enable FireBase API and generate a keyfile on FireBase Console| store in root)
* FIREBASE_DB_URL (URL of your FireBase DB)
* GOOGLE_APPLICATION_CREDENTIALS (Also JSON keyfile from GCP, generate in GCP console)
* PROJECT_ID (DialogFlow's project id)
* NODE_ENV (export as 'development' before running project)
* SENDGRID_API_KEY
* TWILIO_AUTH_TOKEN
* TWILIO_SID
* TWILIO_NUMBER



### Prerequisites

```
node 10.15.2
```

### APIs Used
* FireStore
* DialogFlow
* Twilio
* SendGrid