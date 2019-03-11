const admin = require('firebase-admin');
const path = require('path');

let serviceAccount = null;
if (process.env.NODE_ENV === 'development') {
    serviceAccount = require(path.join(__dirname, '..', process.env.FIREBASE_APPLICATION_CREDENTIALS));
} else {
    serviceAccount = require(process.env.FIREBASE_APPLICATION_CREDENTIALS);
}

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.FIREBASE_DB_URL
// });


// const db = admin.database();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = {
    db
};





