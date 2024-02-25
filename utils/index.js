const validateForm = require("./validateForm");
const validateJson = require("./validateJson");

class Utils {
    validateForm = validateForm;
    validateJson = validateJson;
}

const utils = new Utils();
global.utils = utils;

module.exports = utils;
