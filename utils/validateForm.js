/**
 * Validates a form submission
 * @param {object} data 
 * @param {object} rules 
 */
module.exports = function(data, rules) {
    const errors = [];

    rules.forEach(rule => {
        const value = data[rule.prop];
        if (!value || value.length === 0) {
            if (rule.required) {
                return errors.push(`${rule.prettyProp} is required`);
            }
        } else {
            if (rule.hasOwnProperty("minlength") && value.length < rule.minlength) {
                return errors.push(`${rule.prettyProp} requires at least ${rule.minlength} characters`);
            }

            if (rule.hasOwnProperty("maxlength") && value.length > rule.maxlength) {
                return errors.push(`${rule.prettyProp} must have no more than ${rule.maxlength} characters`);
            }

            if (rule.hasOwnProperty("regex") && !value.match(rule.regex)) {
                return errors.push(rule.regexMessage);
            }
        }
    });

    return errors;
}
