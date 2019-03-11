let botui = new BotUI('routes-bot');

const getUserResponse = async (icon = null, placeholder = null) => {
    return botui.action.text({
        action: {
            cssClass: 'humanTextInput',
            delay: 1000,
            icon,
            placeholder
        }
    });
};

function simpleRobotMessage(m) {
    return botui.message.bot({
        delay: 700,
        content: m
    });
}

async function getFlowResponse(response) {
    let serverResponse = await fetch('/api/dialogflow/reply?q=' + response);
    return serverResponse.json();
}

function conversationStart(reset = true) {
    let start = null;
    if (reset) {
        start = botui.message.add({
            content: 'Hello! What can I do for you today?'
        });
    } else {
        start = botui.message.add({
            content: 'What else can I do for you today?'
        });
    }
    start.then(conversationResponse);
}

function findDataFromCoord(latlng, dataset) {
    return dataset.find((data) => {
        return data.SurfaceLat === latlng.lat && data.SurfaceLong === latlng.lng;
    });
}

async function phoneSubmissionConversation(mapLinks, start = true) {
    let message = 'Would you like to send the directions to your phone?';
    if (!start) {
        message = 'How about I send it to your phone instead?'
    }
    await simpleRobotMessage(message);
    let res = await botui.action.button({
        action: [
            {
                text: 'Yes',
                value: true
            },
            {
                text: 'No',
                value: false
            }
        ]
    });
    if (res.value) {
        await simpleRobotMessage('Cool! What is your number?');
        let userResponse = await getUserResponse();
        await simpleRobotMessage('Sending directions to: ' + userResponse.value);
        await fetch('/api/sms', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({phone: userResponse.value, mapLinks})
        });
    } 
    conversationStart(false);
}

async function emailSubmissionConversation(mapLinks) {
    await simpleRobotMessage('Okay! What is your email address?');
    const res = await getUserResponse();
    await simpleRobotMessage('Sending directions to: ' + res.value);
    await fetch('/api/mail', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email: res.value, mapLinks})
    });
    phoneSubmissionConversation(mapLinks);
}


async function wrapUpAfterMap(mapLinks) {
    await simpleRobotMessage('Would you like to send these directions to your email?')
    let emailResponse = await botui.action.button({
        action: [
            {
                text: 'Yes',
                value: true
            },
            {
                text: 'No',
                value: false
            }
        ]
    });
    if (emailResponse.value) {
        await emailSubmissionConversation(mapLinks);
    } else {
        await phoneSubmissionConversation(mapLinks, emailResponse.value);
    }
}

async function createMapLinks(dResponse, data) {
    console.log('Test Dresponse');
    console.log(dResponse);
    
    let locations = dResponse.locations;
    let locationSequence = dResponse.locationSequence;
    
    let mapLinks = locationSequence.map((sequence, index) => {
        let next = index+1;
        if (next < locationSequence.length) {
            console.log('Sequence: ' + sequence + ' | ' + locationSequence[next] + ' | next: ' + next);
            return [sequence, locationSequence[next]];
        }
    })
    .filter(pair => pair && pair.length > 0)
    .map(async (pairs) => {
        console.log('Pair: ');
        console.log(pairs);
        let from = locations[pairs[0]];
        let to = locations[pairs[1]];
        
        let fromName = null;
        if (pairs[0] === 0) {
            fromName = from.street;
        } else {
            let foundFromData = findDataFromCoord(from.latLng, data);
            fromName = foundFromData.LeaseName + ' - ' + foundFromData.WellNum;
        }
        let foundToData = findDataFromCoord(to.latLng, data);
        let toName = foundToData.LeaseName + ' - ' + foundToData.WellNum;
        
        let url = `https://www.google.com/maps/dir/?api=1&origin=${from.latLng.lat + ',' + from.latLng.lng}\
        &destination=${to.latLng.lat + ',' + to.latLng.lng}&travelmode=driving`
        
        let shortenedUrlResponse = await fetch('https://api-ssl.bitly.com/v4/shorten', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 490d6afa51bc0f54cd363722d9c907165c32a8e9'
        },
        method: 'POST',
        body: JSON.stringify({
            domain: 'bit.ly',
            long_url: url
        })
    });
    
    let shortUrlJson = await shortenedUrlResponse.json();
    return {
        fromName,
        toName,
        url: shortUrlJson.link
    };
});

let resolved = await Promise.all(mapLinks);
console.log('MAPLINKS');
console.log(resolved);
return resolved;
}


async function getDataFromDB(queryData, address) {
    let latlng = await getGeocodeForInputAddress(address);
    let result = {queryData, 'start': latlng};
    let response = await fetch('/api/db/wells', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(result)
    });
    let responseData = await response.json();
    responseData.start = latlng;
    return responseData;
}

async function createMapArea(data) {
    console.log('QueryResults: ');
    console.log(data)
    await simpleRobotMessage('Here are your directions!');
    //Clear right area and add map to area
    clearRightArea();
    let mapDiv = document.createElement('div');
    mapDiv.setAttribute('id', 'map');
    let rightArea = document.querySelector('#right-area');
    rightArea.appendChild(mapDiv);
    
    //Init map and add directions/narrative
    let startPoint = [data.start.lat, data.start.lng];
    let map = initMap(startPoint, 'map', true);
    let furthest = data.queryResults[data.queryResults.length - 1];
    addDirections(startPoint.join(','), furthest, data.queryResults.slice(0, -1), map, data.queryResults);
}


async function processFormSubmission(queryData, address) {
    await simpleRobotMessage('Thanks, I\'ll get right on it!')
    let dbData = await getDataFromDB(queryData, address);
    await createMapArea(dbData);
    
    // //Init map and add directions/narrative
    let startPoint = [dbData.start.lat, dbData.start.lng];
    let furthest = dbData.queryResults[dbData.queryResults.length - 1];
    
    //Can't use these waypoints above because need whole dataset for waypoint details
    let waypoints = dbData.queryResults.slice(0, -1).map((waypoint) => {
        return [waypoint.SurfaceLat, waypoint.SurfaceLong].join(',');
    });
    let dirResponse = await fetch('http://www.mapquestapi.com/directions/v2/route?key=Pqi6Z7PceCYcLTwUmqRxpOLT68Aypwl7&json=' + JSON.stringify({
        locations: [startPoint.join(','), ...waypoints, furthest.SurfaceLat + ',' + furthest.SurfaceLong],
        options: {
            shapeFormat: 'cmp6',
            timeType: 1,
            useTraffice: true,
            enhancedNarrative: true,
            conditionsAheadDistance: 200,
            generalize: 0
        }
    }));
    let dirData = await dirResponse.json();
    let mapLinks = await createMapLinks(dirData.route, dbData.queryResults);
    wrapUpAfterMap(mapLinks);
}

function createRightAreaDiv() {
    if (document.querySelector('#right-area')) {
        return;
    }
    let div = document.createElement('div');
    div.setAttribute('id', 'right-area');
    document.querySelector('#content-area').appendChild(div);
}

function removeRightArea() {
    let rightArea = document.querySelector('#right-area');
    if (rightArea) {
        rightArea.parentNode.removeChild(rightArea);
    }
}

function clearRightArea() {
    let rightArea = document.querySelector('#right-area');
    if (rightArea && rightArea.firstChild) {
        rightArea.removeChild(rightArea.childNodes[0]);
    }
}

//Passed user address on as param
//Get all valid inputs and send to process
function onSubmit(address) {
    let toQueryFor = [];
    let rows = document.querySelectorAll('.well-form-child');
    rows.forEach((childNodes) => {
        let input = childNodes.querySelectorAll('input');
        let leaseNameInput = input[0].value;
        let wellNumInput = input[1].value;
        if (wellNumInput && leaseNameInput) {
            toQueryFor.push({'leaseName': leaseNameInput, 'wellNum': wellNumInput});
        }
    });
    console.log(toQueryFor);
    clearRightArea();
    processFormSubmission(toQueryFor, address);
}

//Form creation
function createInputTexts(quantity, address) {
    let wellFormContainer = document.createElement('div');
    wellFormContainer.setAttribute('id', 'well-form-container');
    let q = quantity;
    
    
    let wellForm = document.createElement('div');
    wellForm.setAttribute('id', 'well-form');
    
    let labelDiv = document.createElement('div');
    labelDiv.setAttribute('class', 'well-form-label-div');
    labelDiv.innerHTML = '<label for=\"leasename\">Lease Name</label><label for=\"wellnum\">Well Num</label>';
    wellForm.appendChild(labelDiv);
    
    while (q > 0) {
        let child = document.createElement('div');
        child.setAttribute('class', 'well-form-child');
        child.innerHTML = '<input type=\"text\" name=\"leasename\" placeholder=\"Lease Name\"><input type=\"text\" name=\"wellnum\" placeholder=\"Well Num\">';
        wellForm.appendChild(child)
        q--;
    }
    let buttonContainer = document.createElement('div');
    buttonContainer.setAttribute('class', 'buttonContainer');
    let button = document.createElement('button');
    button.innerHTML = 'Submit';
    button.setAttribute('class', 'submitButton');
    button.setAttribute('onclick', 'onSubmit(\'' + address +'\')');
    buttonContainer.appendChild(button);
    wellForm.appendChild(buttonContainer);
    
    wellFormContainer.appendChild(wellForm);
    
    return wellFormContainer;
}

//Create the forms area | delete old forms first before appending
function createRightArea(f = true, quantity = 0, address) {
    createRightAreaDiv();
    let forms = createInputTexts(quantity, address);
    let rightArea = document.getElementById('right-area')
    clearRightArea();
    rightArea.appendChild(forms);
}

async function hanldeAddressForLeaseNumIntent(quantity, fulfillmentText) {
    await simpleRobotMessage('Please give us an address as a starting point');
    const userResponse = await getUserResponse();
    await simpleRobotMessage('Got it thanks!');
    await botui.message.add({
        loading:true
    }).then((index) => {
        createRightArea(true, quantity, userResponse.value);
        botui.message.update(index, {
            loading: false,
            content: fulfillmentText
        });
    })
    await conversationResponse();
}

async function processLeaseNumIntent(data) {
    await simpleRobotMessage(data.fulfillmentText)
    const userResponse = await getUserResponse();
    data = await getFlowResponse(userResponse.value);
    console.log(data);
    if (data.intentName) {
        if (data.intentName.toUpperCase().includes('FALLBACK')) {
            return processLeaseNumIntent(data);
        } else if (data.intentName.toUpperCase() === 'RESET') {
            return conversationStart(false);
        } else {
            let quantity = parseInt(data.parameters.find(obj => {
            if (obj['number']) {
                return true;
            }
            return false;
            })['number']);
            hanldeAddressForLeaseNumIntent(quantity, data.fulfillmentText);
        }
    } else {
        await simpleRobotMessage('Let\'s start over!');
        return conversationStart(false);
    }
}

async function conversationResponse(data = null) {
    let userResponse = await getUserResponse();
    let flowResponse = await getFlowResponse(userResponse.value);
    if (flowResponse.intentName && flowResponse.intentName.includes('getData.LeaseWellNum')) {
        return processLeaseNumIntent(flowResponse);
    } else if (flowResponse.intentName && flowResponse.intentName === 'reset') {
        return conversationStart(false);
    }else {
        return conversationResponse();
    }
}


conversationStart();