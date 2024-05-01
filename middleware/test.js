const getTimestamp = (req, res, next) => {
    req.timestamp = Date.now();
    next();
};
// create a post request to get name and email

const nameEmail = (req, res, next) => {
    req.name = req.body.name;
    req.email = req.body.email;
    next();
};


module.exports = {getTimestamp,nameEmail};