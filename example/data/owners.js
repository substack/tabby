module.exports = function (db) {
    return function (params) {
        return db.createReadStream({ start: 'owner-', end: 'owner-~' })
    };
};
