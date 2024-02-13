const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const {CalculatorEntry} = require("../../schemas");

router.use(bodyParser.json());

const CANDLE_DATA = [
    {
        prop: "buffer",
        type: "number",
    },
    {
        prop: "fragrancePercent",
        type: "number",
        min: 0,
    },
    {
        prop: "containers",
        type: "object",
        minlength: 1,
    },
    {
        prop: "waxes",
        type: "object",
        minlength: 1,
    },
    {
        prop: "fragrances",
        type: "object",
        minlength: 1,
    },
];

const verifyData = (data,rules) => {
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
    });

    if (errors.length === 0) {
        let totalSize = 0;
        data.containers.forEach((container,i) => {
            if (!container?.id || container.id.length === 0) {
                errors.push(`Container ${i} is missing an ID`);
            }
            if (!container?.name || container.name.length === 0) {
                errors.push(`Container ${i} is missing a name`);
            }
            if (typeof(container.size) !== "number" || container.size <= 0) {
                errors.push(`Container ${i} is missing a valid container size`);
            }
            if (typeof(container.quantity) !== "number" || container.quantity < 1) {
                errors.push(`Container ${i} is missing a valid quantity`);
            }
            totalSize += container.size * container.quantity;
        });
        if (totalSize <= 0) {
            errors.push("Total container sizes must be greater than 0");
        }
        let checkUnique = data.containers.find(x => data.containers.find(y => x.id !== y.id && x.name === y.name));
        if (checkUnique) {
            errors.push(`All container names must be unique. Found more than one container with the name '${checkUnique.name}'`);
        }
        let totalWaxPercent = 0;
        data.waxes.forEach((wax,i) => {
            if (!wax?.id || wax.id.length === 0) {
                errors.push(`Wax ${i} is missing an ID`);
            }
            if (!wax?.name || wax.name.length === 0) {
                errors.push(`Wax ${i} is missing a name`);
            }
            if (typeof(wax.percent) !== "number") {
                errors.push(`Wax ${i} is missing a valid percent number`);
            } else {
                totalWaxPercent += wax.percent;
            }
        })
        if (totalWaxPercent !== 100) {
            errors.push("Total wax percentage is not 100. Got: " + totalWaxPercent);
        }
        checkUnique = data.waxes.find(x => data.waxes.find(y => x.id !== y.id && x.name === y.name));
        if (checkUnique) {
            errors.push(`All wax names must be unique. Found more than one wax with the name '${checkUnique.name}'`);
        }
        let totalFragrancePercent = 0;
        data.fragrances.forEach((fragrance,i) => {
            if (!fragrance?.id || fragrance.id.length === 0) {
                errors.push(`Fragrance ${i} is missing an ID`);
            }
            if (!fragrance?.name || fragrance.name.length === 0) {
                errors.push(`Fragrance ${i} is missing a name`);
            }
            if (typeof(fragrance.percent) !== "number") {
                errors.push(`Fragrance ${i} is missing a valid percent number`);
            } else {
                totalFragrancePercent += fragrance.percent;
            }
        })
        if (totalFragrancePercent !== 100) {
            errors.push("Total fragrance percentage is not 100. Got: " + totalFragrancePercent);
        }
        checkUnique = data.fragrances.find(x => data.fragrances.find(y => x.id !== y.id && x.name === y.name));
        if (checkUnique) {
            errors.push(`All fragrance names must be unique. Found more than one fragrance with the name '${checkUnique.name}'`);
        }
    }

    if (errors.length > 0) {
        throw errors.join("\n");
    } else {
        return true;
    }
}

router.post("/candle/:id", async (req, res) => {
    try {
        verifyData(req.body, CANDLE_DATA);
    } catch(err) {
        return res.json({ok: false, error: "Validation error(s): " + err});
    }

    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        if (!entry) {
            return res.json({ok: false, error: "Calculator entry not found!"});
        }
        entry.buffer = req.body.buffer;
        entry.fragrancePercent = req.body.fragrancePercent;

        let newContainers = [];
        entry.containers = entry.containers.filter(x => req.body.containers.find(y => String(x._id) === y.id));
        req.body.containers.forEach(cont => {
            const existingContainer = entry.containers.find(x => String(x._id) === cont.id);
            if (existingContainer) {
                existingContainer.name = cont.name;
                existingContainer.size = cont.size;
                existingContainer.quantity = cont.quantity;
            } else {
                newContainers.push({id: cont.id, name: cont.name});
                entry.containers.push({
                    name: cont.name,
                    size: cont.size,
                    quantity: cont.quantity,
                });
            }
        });
        
        let newWaxes = [];
        entry.waxes = entry.waxes.filter(x => req.body.waxes.find(y => String(x._id) === y.id));
        req.body.waxes.forEach(wax => {
            const existingWax = entry.waxes.find(x => String(x._id) === wax.id);
            if (existingWax) {
                existingWax.name = wax.name;
                existingWax.percent = wax.percent;
            } else {
                newWaxes.push({id: wax.id, name: wax.name});
                entry.waxes.push({
                    name: wax.name,
                    percent: wax.percent,
                })
            }
        });
        
        let newFragrances = [];
        entry.fragrances = entry.fragrances.filter(x => req.body.fragrances.find(y => String(x._id) === y.id));
        req.body.fragrances.forEach(frag => {
            const existingFragrance = entry.fragrances.find(x => String(x._id) === frag.id);
            if (existingFragrance) {
                existingFragrance.name = frag.name;
                existingFragrance.percent = frag.percent;
            } else {
                newFragrances.push({id: frag.id, name: frag.name});
                entry.fragrances.push({
                    name: frag.name,
                    percent: frag.percent,
                })
            }
        });

        await entry.save();

        let changedIds = [];

        newContainers.forEach(newItem => {
            changedIds.push({
                old: newItem.id,
                new: entry.containers.find(x => x.name === newItem.name)._id,
            });
        });

        newWaxes.forEach(newItem => {
            changedIds.push({
                old: newItem.id,
                new: entry.waxes.find(x => x.name === newItem.name)._id,
            });
        });

        newFragrances.forEach(newItem => {
            changedIds.push({
                old: newItem.id,
                new: entry.fragrances.find(x => x.name === newItem.name)._id,
            });
        });
        
        res.json({ok: true, data: entry, changedIds});
    } catch(err) {
        console.error(err);
        res.json({ok: false, error: "An unknown error occurred!"});
    }
});

module.exports = router;