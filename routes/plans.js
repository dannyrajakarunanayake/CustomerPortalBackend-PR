require("dotenv").config();
const moment = require("moment");
const Joi = require("joi");
const axios = require("axios");
const express = require("express");
const router = express.Router();
const app = express();
const getRecord = require("../getRecord");
const getList = require("../getList");

router.get("/:id", (req, res) => {
    const schema = {
        "x-auth-token": Joi.required(),
    };

    const xAuthToken = req.headers["x-auth-token"];
    const headers = { "x-auth-token": xAuthToken };
    const customerId = req.params.id;

    const result = Joi.validate(headers, schema);
    if (result.error) {
        res.status(400).json({ message: "x-auth-token is missing" });
    }

    const plan = getRecord(xAuthToken, "pp_PaymentPlans", req.params.id);

    plan
        .then((data) => {
            res.json({
                plan: preparePlanData(data),
            });
        })

    .catch((err) => {
        res.status(400).json({ message: "Unable to retrieve plans data" });
    });
});

const preparePlanData = (data) => {
    return {
        id: data.id,
        planName: data.name,
        storeName: data.ms_merchantstore_pp_paymentplans_1_name,
        payRemain: data.est_repayments_remaining_c,
        paidAmount: parseFloat(data.loan_repayments_to_date).toFixed(2),
        remainingBalance: parseFloat(data.balance_total_outstanding).toFixed(2),
        planStatus: data.status.toLowerCase(),

        approvalDate: moment(data.application_decision_date).format("YYYY-MM-DD"),
        planDateAdded: moment(data.date_entered).format("YYYY-MM-DD "),
        activationDate: data.origination_date,
        saleAmount: parseFloat(data.sale_amount).toFixed(2),
        deposit: parseFloat(data.deposit_paid).toFixed(2),
        loanAmount: parseFloat(data.loan_amount).toFixed(2),
        establishmentFee: parseFloat(data.establishment_fee).toFixed(2),
        totalCreditProvided: parseFloat(data.total_credit_amount_c).toFixed(2),
        estRepaymentRemaining: parseFloat(data.est_repayments_remaining_c).toFixed(
            2
        ),
        planTerm: data.terms,
        RepaymentFrequency: data.repayment_frequency,
        numberOfRepayments: data.number_of_repayments,
        repaymentAmount: parseFloat(data.calculated_repayment_amount_c).toFixed(2),
        paymentsRemaining: data.est_repayments_remaining_c,
        finalRepaymentDate: data.final_merch_settlement_date,
        nextRepaymentDate: data.next_repayment,
    };
};

router.get("/", (req, res) => {
    const schema = {
        "x-auth-token": Joi.required(),
    };

    const xAuthToken = req.headers["x-auth-token"];
    const headers = { "x-auth-token": xAuthToken };
    const customerId = req.params.id;

    const result = Joi.validate(headers, schema);
    if (result.error) {
        res.status(400).json({ message: "x-auth-token is missing" });
    }

    const plans = getList(xAuthToken, "pp_PaymentPlans", req.params.id);

    plans
        .then((data) => {
            res.json({
                plans: preparePlansData(data),
            });
        })
        .catch((err) => {
            res.status(400).json({ message: "Unable to retrieve plans data" });
        });
});

const preparePlansData = (data) => {
    let planData = [];
    const schedulePlanData = data.map((plan) => {
        planData.push({
            ID: plan.id,
            planName: {
                name: plan.name,
                ref: plan.ms_merchantstore_pp_paymentplans_1_name,
            },
            statusCust: plan.status.toLowerCase(),
            payRemain: plan.est_repayments_remaining_c,
            balanceRemaining: plan.balance_total_outstanding,
            paidLoanAmount: plan.loan_repayments_to_date,
            buttonUrl: "Yes",
        });
    });

    return planData;
};

module.exports = router;