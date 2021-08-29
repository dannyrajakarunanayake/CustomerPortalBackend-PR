require("dotenv").config();
const express = require("express");
const Joi = require("joi");
const axios = require("axios");
const crypto = require("crypto");
const queryString = require("querystring");
const app = express();
const router = express.Router();

router.post("/", (req, res) => {
    const url = `${process.env.url}/auth/`;
    const schema = {
        username: Joi.string().min(3).required(),
        password: Joi.string().min(3).required(),
    };

    const result = Joi.validate(req.body, schema);

    if (result.error) {
        res.status(400).json({ message: result.error.details[0].message });
        return;
    }

    const formData = {
        username: req.body.username,
        password: crypto.createHash("md5").update(req.body.password).digest("hex"),
        portal_user_type: "Customer",
        user_ip_address: "172.18.0.11",
        last_activity: "0",
    };
    console.log(formData);

    axios
        .post(url, queryString.stringify(formData))
        .then((response) => {
            console.log(response);
            !response.data["API-Error"] ?
                res.json({
                    authToken: response.data["auth-token"],
                    customerId: response.data["entity_id"],
                }) :
                res.status(400).json({
                    message: "Invalid Username or Password. please try again ",
                });
        })
        .catch((err) => {
            res.json({ message: err });
        });
});

module.exports = router;