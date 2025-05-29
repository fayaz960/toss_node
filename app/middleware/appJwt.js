const config = require("../config/constants.js");
const db = require("../models");
const User = db.user;
verifyAppToken = (req, res, next) => {
    let token = req.headers["x-access-token"];
    if (!token) {
        return res.status(config.HTTP_STATUS.FORBIDDEN.code).send({
            "status": config.HTTP_STATUS.FORBIDDEN,
            "response": {
                message: "No token provided!"
            }
        });
    }
    if (token !== "rdemotus@2022") {
        return res.status(config.HTTP_STATUS.NOT_AUTHENTICATED.code).send({
            "status": config.HTTP_STATUS.NOT_AUTHENTICATED,
            "response": {
                message: "Unauthorized!"
            }
        });
    } else {
        next();
    }
};

const appJwt = {
    verifyAppToken: verifyAppToken
};
module.exports = appJwt;