const Activity = require("./Activity");

const CalculatorEntry = require("./CalculatorEntry");

const CandleBatch = require("./CandleBatch");

const User = require("./User");

class Schemas {
    Activity = Activity;

    CalculatorEntry = CalculatorEntry;

    CandleBatch = CandleBatch;
    
    User = User;
}

module.exports = new Schemas();
