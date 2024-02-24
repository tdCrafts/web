const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const { Activity, CalculatorEntry, CandleBatch } = require("../../schemas");

router.use((req, res, next) => {
    if (req?.session?.user?._id) {
        next();
    } else {
        res.json({ok: false, error: "You are not logged in!"});
    }
});

router.use(bodyParser.json());

const BATCH_RULES = [
    {
        prop: "entry",
        type: "string",
    },
    {
        prop: "clone",
        type: "boolean",
    },
    {
        prop: "fragranceNames",
        type: "object",
    },
    {
        prop: "visibility",
        type: "string",
        matches: ["readonly","private"],
    }
]

const verifyData = (data, rules) => {
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
}

router.post("/candle", async (req, res) => {
    try {
        verifyData(req.body, BATCH_RULES);
        if (req.body.date) {
            req.body.date = new Date(req.body.date);
            if (!req.body.date instanceof Date || isNaN(req.body.date)) {
                throw "Date is not a valid!";
            }
        } else {
            req.body.date = new Date();
        }
    } catch(error) {
        return res.json({ok: false, error});
    }

    try {
        let entry = await CalculatorEntry.findById(req.body.entry);

        if (!entry) {
            return res.json({ok: false, error: "Calculator entry not found!"});
        }

        if (!entry.isOwner(req.session.user._id)) {
            return res.json({ok: false, error: "You do not own this calculator entry!"});
        }

        if (req.body.fragranceNames.length > entry.fragrances.length) {
            return res.json({ok: false, error: "More given fragrance names than there are fragrances!"});
        }

        const existingBatchesWithCalculation = await CandleBatch.find({calculation: entry});
        if (existingBatchesWithCalculation.length > 0) {
            return res.json({ok: false, error: "This calculation must be cloned since it is used for another calculation."});
        }

        let fragranceNames = null;

        if (req.body.clone) {
            entry = await entry.cloneEntry();
        }
        
        let fragrancesChanged = false;
        req.body.fragranceNames.forEach((fragranceName,i) => {
            if (entry.fragrances[i].name.toLowerCase() !== fragranceName.toLowerCase()) {
                entry.fragrances[i].name = fragranceName;
                fragrancesChanged = true;
            }
        });
        if (fragrancesChanged) {
            await entry.save();
        }

        const batch = await CandleBatch.create({
            owner: req.session.user._id,
            fragranceNames,
            calculation: entry,
            privacy: req.body.visibility,
            date: req.body.date,
        });

        res.json({ok: true, data: batch});

        Activity.create({
            user: req.session.user._id,
            action: "create",
            
        });
    } catch(err) {
        res.json({ok: false, error: "An unknown error occurred!"})
    }
});

module.exports = router;
