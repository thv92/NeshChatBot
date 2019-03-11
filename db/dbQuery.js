const db = require('./FBAdmin').db;




async function getOnWellNumAndLeaseName(queryData) {
    let wellsRef = db.collection('wells');
    let queries = queryData.map((data) => {
        return wellsRef.where('LeaseName', '==', data.leaseName.toUpperCase())
                       .where('WellNum', '==', data.wellNum.toUpperCase())
                       .get();
    });
    let queryResults = [];
    let resolved = await Promise.all(queries);
    resolved.forEach(result => {
        result.forEach( (doc) => {
            queryResults.push(doc.data());
        });
    });
    return queryResults;
}


module.exports = {
    getOnWellNumAndLeaseName
};