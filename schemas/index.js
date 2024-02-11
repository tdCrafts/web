const CalculatorEntry = require("./CalculatorEntry");

const User = require("./User");

class Schemas {
    CalculatorEntry = CalculatorEntry;
    
    User = User;
}

module.exports = new Schemas();
