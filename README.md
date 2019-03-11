# NeshChatBot

Chatbot that gives barebones navigation to a user.
User needs to ask, "Give me directions to a well."
Then put in the Lease Name and Well Num and the bot will spit out a map with instructions.



## Setup
* Requires for you to have a Google Cloud Platform account with billing enabled
* ngrok is required for Twilio to work. Please tunnel the project using something like "ngrok http 3000"
* I have included the credentials and environment variables in this case to be able to run locally without a hitch.
* To run the project locally:
    * export NODE_ENV=development
    * run "npm startWatch"

### Prerequisites

```
node 10.15.2
```