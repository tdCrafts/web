const CalculatorEntry = require("./CalculatorEntry");

const CandleBatch = require("./CandleBatch");

const User = require("./User");

class Schemas {
    CalculatorEntry = CalculatorEntry;

    CandleBatch = CandleBatch;
    
    User = User;
}

module.exports = new Schemas();
