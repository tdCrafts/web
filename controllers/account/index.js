const express = require("express");
const router = express.Router();

const {User} = require("../../schemas");

const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({extended: false}));

const CREATE_RULES = [
    {
        prop: "firstName",
        prettyProp: "First Name",
        required: true,
    },
    {
        prop: "lastName",
        prettyProp: "Last Name",
        required: true,
    },
    {
        prop: "email",
        prettyProp: "Email",
        required: true,
        regex: /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/,
        regexMessage: "Provided email is not valid",
    },
    {
        prop: "password",
        prettyProp: "Password",
        required: true,
        minlength: 7,
    },
    {
        prop: "confirmPassword",
        prettyProp: "Confirm Password",
        required: true,
        minlength: 7,
    },
];

const validate = (data, rules = CREATE_RULES) => {
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

    if (data.password && data.confirmPassword &&
        data.password !== data.confirmPassword) {
        errors.push("Password confirmation does not match!");
    }

    if (errors.length === 0) {
        return true;
    } else {
        throw errors;
    }
}

router.get("/", (req, res) => {
    const user = req?.session?.user;
    if (!user) {
        return res.redirect("/account/login");
    }
    res.render("pages/account/edit", {user})
})

router.get("/login", (req, res) => {
    const user = req?.session?.user;
    if (user) {
        return res.redirect("/account");
    }
    res.render("pages/account/login");
});

router.get("/create", (req, res) => {
    const user = req?.session?.user;
    if (user) {
        return res.redirect("/account");
    }
    res.render("pages/account/create");
});

router.get("/logout", (req, res) => {
    if (req.session) {
        req.session.user = null;
        req.session.loggedIn = false;
    }
    req.flash("info", "You have successfully been logged out.")
    res.redirect("/account/login");
});

router.post("/login", async (req, res) => {
    if (!req.body.email || !req.body.password) {
        req.flash("Missing email or password");
        return res.redirect("/account/login");
    }

    const user = await User.findOne({email: req.body.email});
    if (user) {
        user.comparePassword(req.body.password).then(async matches => {
            if (matches) {
                req.session.user = user;
                req.session.loggedIn = true;
                res.redirect("/");
            } else {
                req.flash("error", "Invalid email or password");
                return res.redirect("/account/login");
            }
        }, err => {
            req.flash("error", "Invalid email or password");
            return res.redirect("/account/login");
        });
    } else {
        req.flash("error", "Invalid email or password");
        return res.redirect("/account/login");
    }
});

router.post("/create", async (req, res) => {
    try {
        validate(req.body, CREATE_RULES);

        if (!req.session.id) {
            throw "No session ID provided! Ensure you have cookies enabled and try refreshing the page.";
        }

        const existingUser = await User.findOne({email: req.body.email});
        if (existingUser) {
            throw "A user with this email already exists!";
        }
    } catch(err) {
        req.flash("error", err.join ? err.join("<br>") : String(err));
        if (req.body.firstName) {
            req.flash("firstName", req.body.firstName);
        }
        if (req.body.lastName) {
            req.flash("lastName", req.body.lastName);
        }
        if (req.body.email) {
            req.flash("email", req.body.email);
        }
        return res.redirect("/account/create");
    }

    try {
        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
        });

        req.session.user = user;
        req.session.loggedIn = true;
    
        res.redirect("/");
    } catch(err) {
        console.error(err);
        req.flash("error", "An unknown error occurred! Please report this!");
        return res.redirect("/account/create");
    }
});

module.exports = router;
