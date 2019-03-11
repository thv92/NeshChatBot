const express = require('express');
const dbQuery = require('../db/dbQuery');
const geolib = require('geolib');
const utils = require('../services/utils');
let df = require('../services/flow');
let router = express.Router();


/* GET dialogflow response. */
router.get('/dialogflow/reply', (req, res,) => {
    df.getQueryResult(req.query.q).then((responses) => {
        console.log('Responses:')
        console.log(responses);
        console.log('Intent: ');
        console.log(responses[0].queryResult.intent);
        console.log('OutputContexts: ');
        console.log(responses[0].queryResult.outputContexts);
        console.log('Parameters: ');
        console.log(responses[0].queryResult.parameters);
        //Check request body to see if there is data
        let response = responses[0];
        // let followUp = false;
        // if (response.queryResult.outputContexts.length > 0) {
        //     followUp = true;
        // }
        
        let parameters = [];
        if (response.queryResult.parameters.fields) {
            let fields = response.queryResult.parameters.fields;
            for (let key in fields) {
                let value = fields[key];
                if (value[value.kind]) {
                    parameters.push({[key] : value[value.kind]});
                }
            }
        }
        res.json({
            intentName: response.queryResult.intent.displayName,
            fulfillmentText: response.queryResult.fulfillmentText,
            // followUp,
            parameters
            // contexts: response.queryResult.outputContexts
        });
    });
});


router.post('/db/wells', async (req, res) => {
    console.log('REQUEST');
    console.log(req.body);
    let bodyData = req.body
    let start = utils.getLatLngObj(bodyData.start.lat, bodyData.start.lng);
    let queryResults = await dbQuery.getOnWellNumAndLeaseName(bodyData.queryData);
    //Sort from shortest to longest distance from starting point
    queryResults.sort((a, b) => {
        let aDist = geolib.getDistance(
            start,
            utils.getLatLngObj(a.SurfaceLat, a.SurfaceLong),
            1,
            3
        );
        let bDist = geolib.getDistance(
            start,
            utils.getLatLngObj(b.SurfaceLat, b.SurfaceLong),
            1,
            3
        );
        return aDist > bDist;
    });
    console.log('RETURNING DATA: ');
    console.log(queryResults);
    res.json({queryResults});
});


router.post('/mail', (req, res) => {
    let bodyData = req.body;
    if (bodyData) {
        let messages = bodyData.mapLinks.map((links) => {
            return `Directions from <strong>${links.fromName}</strong> to <strong>${links.toName}</strong>:<br/>${links.url}`
        }).join('<br/><br/>');
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: bodyData.email,
            from: 'NeshRoutes@info.com',
            subject: 'Map Directions from Nesh Routes',
            html: messages
        };

        console.log('Sent email to: ' + bodyData.email);
        console.log('Messages: ' + messages);

        sgMail.send(msg);
    }
    res.sendStatus(200);
});

router.post('/sms', (req, res) => {
    let bodyData = req.body;
    if (bodyData) {
        let phoneNumber = bodyData.phone;
        let messages = bodyData.mapLinks.map((links) => {
            return `-Directions from ${links.fromName} to ${links.toName}:\n${links.url}`
        }).join('\n');
        const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('PHone: ' + phoneNumber);
        client.messages.create({
            body: messages,
            from: process.env.TWILIO_NUMBER,
            to: phoneNumber
        }).then(() => {
            console.log('Successfully sent directions to: ' + phoneNumber);
        });
    }
    res.sendStatus(200);
});


module.exports = router;

