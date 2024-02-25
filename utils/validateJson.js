/**
 * Validates a json submission
 * @param {object} data 
 * @param {object} rules 
 */
module.exports = function(data, rules) {
    let errors = [];

    rules.forEach(reqData => {
        if (!data.hasOwnProperty(reqData.prop)) {
            return errors.push("Missing required property " + reqData.prop);
        }

        if (reqData?.type) {
            if (typeof(data[reqData.prop]) !== reqData.type) {
                return errors.push(`Required property ${reqData.prop} does not have type of ${reqData.type}`);
            }
        }

        if (reqData.hasOwnProperty("min")) {
            if (data[reqData.prop] < reqData.min) {
                return errors.push(`Required property ${reqData.prop} is below the minimum value of ${reqData.min}`);
            }
        }

        if (reqData.hasOwnProperty("max")) {
            if (data[reqData.prop] > reqData.max) {
                return errors.push(`Required property ${reqData.prop} is above the maximum value of ${reqData.max}`);
            }
        }

        if (reqData.hasOwnProperty("minlength")) {
            if (data[reqData.prop].length < reqData.minlength) {
                return errors.push(`Required property ${reqData.prop} is below the minimum length of ${reqData.minlength}`);
            }
        }

        if (reqData.hasOwnProperty("maxlength")) {
            if (data[reqData.prop].length > reqData.maxlength) {
                return errors.push(`Required property ${reqData.prop} is above the maximum length of ${reqData.maxlength}`);
            }
        }

        if (reqData.hasOwnProperty("matches")) {
            if (!reqData.matches.includes(data[reqData.prop])) {
                return errors.push(`Required property ${reqData.prop} must match one of (${reqData.matches.join(", ")})`);
            }
        }
    });

    return errors;
}