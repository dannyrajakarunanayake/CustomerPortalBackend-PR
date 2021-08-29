require("dotenv").config();
const Joi = require("joi");
const axios = require("axios");
const express = require("express");
const router = express.Router();
const app = express();

router.post("/", (req, res) => {
    const schema = {
        "x-auth-token": Joi.required(),
    };

    const xAuthToken = req.headers["x-auth-token"];
    const headers = { "x-auth-token": xAuthToken };
    const customerId = req.params.id;
    const planId = req.params.planId;
    const paymentId = req.params.paymentId;
    const type = req.params.type;

    const result = Joi.validate(headers, schema);

    if (result.error) {
        res.status(400).json({ message: "x-auth-token is missing" });
    }

    const response = makePayment(xAuthToken, req);
});

const makePayment = (authToken, req) => {
    const url = `${process.env.url}/Payment/`;
    return new Promise((resolve, reject) => {
        const parameters = {
            auth_token: authToken,
            customer_id: req.body.customerId,
            scope: "all",
            user_ip_address: "172.18.0.11",
            last_activity: "0",
            type: req.body.type,
            plan_id: req.body.planId,
            payment_id: req.body.paymentId,
            amount: req.body.amount,
        };

        axios
            .post(url, parameters, {
                headers: { "Content-Type": "application/json" },
            })

        .then((response) => {
            response.data["response_code"] === "Successful" ?
                resolve(response.data) :
                reject(new Error(response.data.message));
        })

        .catch((error) => {
            reject(error);
        });
    });
};

module.exports = router;