const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const {Activity, CalculatorEntry} = require("../../schemas");

const {validateJson} = require("../../utils/");

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
    {
        prop: "unit",
        type: "string",
        matches: ["oz", "g"],
    }
];

const verifyData = (data, rules) => {
    let errors = validateJson(data, rules);

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

router.post("/candle/", async (req, res) => {
    try {
        verifyData(req.body, CANDLE_DATA);
    } catch(err) {
        return res.json({ok: false, error: "Validation error(s): " + err});
    }

    const entryData = {
        buffer: req.body.buffer,
        fragrancePercent: req.body.fragrancePercent,
        unit: req.body.unit,
        containers: req.body.containers.map(x => {
            return {
                name: x.name,
                size: x.size,
                quantity: x.quantity,
            }
        }),
        waxes: req.body.waxes.map(x => {
            return {
                name: x.name,
                percent: x.percent,
            }
        }),
        fragrances: req.body.fragrances.map(x => {
            return {
                name: x.name,
                percent: x.percent,
            }
        }),
    };

    try {
        if (req?.session?.user?._id) {
            entryData.owner = req.session.user._id;
            entryData.privacy = "readonly";
        }
        const entry = await CalculatorEntry.create(entryData);
        if (!entry) {
            return res.json({ok: false, error: "Calculator entry not created!"});
        }
        res.json({ok: true, data: entry});

        if (req?.session?.user?._id) {
            Activity.create({user: req.session.user._id, candleEntry: entry, action: "create"}).catch(console.error);
        }
    } catch(err) {
        console.error(err);
        res.json({ok: false, error: "An unknown error occurred"});
    }
});

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

        if (entry.isOwned && entry.privacy !== "public" && !entry.isOwner(req?.session?.user?._id)) {
            return res.json({ok: false, error: "You must be the owner of this entry to modify it."});
        }
        
        entry.buffer = req.body.buffer;
        entry.fragrancePercent = req.body.fragrancePercent;
        entry.unit = req.body.unit;

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

        if (req?.session?.user?._id) {
            Activity.create({user: req.session.user._id, candleEntry: entry, action: "edit"}).catch(console.error);
        }

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

const VALID_PRIVACY_VALUES = [
    "public", "readonly", "private",
]
router.put("/candle/:id", async (req, res) => {
    try {
        const entry = await CalculatorEntry.findById(req.params.id).populate("owner");
        if (!entry.isOwner(req.session?.user?._id)) {
            return res.json({ok: false, error: "You do not own this calculator entry and may not update it!"});
        }
        if (req.body.hasOwnProperty("privacy") &&
            VALID_PRIVACY_VALUES.includes(req.body.privacy)) {
            entry.privacy = req.body.privacy;
        }
        await entry.save();
        res.json({ok: true});

        if (req?.session?.user?._id) {
            Activity.create({user: req.session.user._id, candleEntry: entry, action: "edit"}).catch(console.error);
        }
    } catch(err) {
        console.error(err);
        res.json({ok: false, error: "An unknown error occurred!"});
    }
});

router.delete("/candle/:id", async (req, res) => {
    try {
        const entry = await CalculatorEntry.findById(req.params.id).populate("owner");
        if (!entry.isOwner(req.session?.user?._id)) {
            return res.json({ok: false, error: "You do not own this calculator entry and may not delete it!"});
        }
        await entry.deleteOne();
        res.json({ok: true});

        if (req?.session?.user?._id) {
            Activity.create({user: req.session.user._id, candleEntry: entry, action: "delete"}).catch(console.error);
        }
    } catch(err) {
        console.error(err);
        res.json({ok: false, error: "An unknown error occurred!"});
    }
});

router.post("/candle/:id/clone", async (req, res) => {
    if (!req?.session?.user) {
        res.json({ok: false, error: "You must be logged in to do this!"});
    }

    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        if (!entry) {
            return res.json({ok: false, error: "Calculator entry not found!"})
        }

        if (entry.privacy === "private" && !entry.isOwner(req?.session?.user?._id)) {
            return res.json({ok: false, error: "You don't have access to this entry!"})
        }

        const newEntry = await entry.cloneEntry(req.session.user._id);
        res.json({ok: true, data: newEntry});

        Activity.create({user: req.session.user._id, candleEntry: entry, action: "create"}).catch(console.error);
    } catch(err) {
        console.error(err);
        res.json({ok: false, error: "An unknown error occurred!"});
    }
});

module.exports = router;
