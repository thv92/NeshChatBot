const db = require('../db/FBAdmin').db;
const path = require('path');
const csvtojson = require('csvtojson/v2');
const csvFilePath = path.join(__dirname, '..', 'data', 'ProjectData.csv');

function insertInitialDataRDB() {
    csvtojson().fromFile(csvFilePath)
    .then((json) => {
        const ref = db.ref('/');
        let wellsRef = ref.child('wells');
        json.forEach((dataObj) => {
            wellsRef.push().set(dataObj)
            .then((k) => {
                console.log('Pushed: ' + k);
            })
        });
    });
}

function deleteAllRDB() {
    const ref = db.ref('/');
    ref.remove();
}


function insertInitialDataFS() {
    csvtojson()
    .fromFile(csvFilePath)
    .then((json) => {
        const ref = db.collection('wells');
        json.forEach(dataObj => {
            // ref.add(dataObj)
            ref.add({
                'UWI': dataObj['UWI'],
                'CurrentOperatorName': dataObj['Current Operator Name'],
                'CurrentOperatorCity': dataObj['Current Operator City'],
                'LeaseName': dataObj['Lease Name'],
                'WellNum': dataObj['Well Num'],
                'FieldName': dataObj['Field Name'],
                'Country' : dataObj['Country Name'],
                'State' : dataObj['State Name'],
                'County' : dataObj['County Name'],
                'SurfaceLat': parseFloat(dataObj['Surface Latitude']),
                'SurfaceLong': parseFloat(dataObj['Surface Longitude'])
            })
            .then(ref => {
                console.log('Added document with ID: ', ref.id);
            });
        });
    });
}


module.exports = {
    insertInitialDataRDB,
    deleteAllRDB,
    insertInitialDataFS
};