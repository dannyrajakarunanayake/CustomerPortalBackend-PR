require("dotenv").config();
const express = require("express");
const moment = require("moment");

const crypto = require("crypto");
const Joi = require("joi");
const router = express.Router();
const axios = require("axios");
const getRecord = require("../getRecord");
const getList = require("../getList");
const { diffieHellman } = require("crypto");
const queryString = require("querystring");
const { join } = require("path");

router.get("/:id", (req, res) => {
    const schema = {
        "x-auth-token": Joi.required(),
    };
    const xAuthToken = req.headers["x-auth-token"];
    const headers = { "x-auth-token": xAuthToken };
    const customerId = req.params.id;

    const result = Joi.validate(headers, schema);
    if (result.error) {
        res.send(400).send({ message: "x-auth-token is missing" });
    }
    const customerData = getRecord(xAuthToken, "cu_Customer", customerId);
    const customerNextPayment = getCustomerNextPayment(xAuthToken, customerId);
    const payments = getList(xAuthToken, "p_Payments", customerId);

    Promise.all([customerData, customerNextPayment, payments])
        .then((result) => {
            res.json({
                customer: prepareCustomerData(result[0]),
                nextPaymentAmount: prepareCustomerNextPaymentData(result[1]),
                overduePayment: prepareOverduePayment(result[2]),
            });
        })
        .catch((err) => res.json({ error: err.message }));
});

router.put("/:id", (req, res) => {
    const schema = {
        password: Joi.string().required(),
        street: Joi.string().required(),
        state: Joi.string().required(),
        surburb: Joi.string().required(),
        postCode: Joi.string().required(),
        confirmPassword: Joi.string().required(),
    };

    const headerSchema = {
        "x-auth-token": Joi.string().min(3).required(),
    };

    const xAuthToken = req.headers["x-auth-token"];
    const headers = { "x-auth-token": xAuthToken };
    const customerId = req.params.id;

    const bodyValidate = Joi.validate(req.body, schema);
    if (bodyValidate.error) {
        res.status(400).send({ message: "Invalid form data" });
        return;
    }

    const result = Joi.validate(headers, headerSchema);
    if (result.error) {
        res.status(400).send({ message: "x-auth-token is missing" });
        return;
    }

    const password = crypto
        .createHash("md5")
        .update(req.body.password)
        .digest("hex");

    const profile = {
        password_c: password,
        password_display_c: req.body.password,
    };

    console.log(req.body);

    const passwordData = CustomerProfileDetails(xAuthToken, customerId, profile);

    Promise.all([passwordData])
        .then((result) => {
            res.status(200).json({ status: "success" });
        })
        .catch((err) => res.json({ error: err.message }));
});

const CustomerProfileDetails = (authToken, customerId, profile) => {
    return new Promise((resolve, reject) => {
        const url = `${process.env.url}/put/`;

        const parameters = {
            auth_token: authToken,
            module_name: "cu_Customer",
            user_ip_address: "172.18.0.11",
            last_activity: "0",
            scope: "all",
            id: customerId,
            record_arguments: profile,
        };

        axios
            .post(url, parameters, {
                headers: { "Content-Type": "application/json" },
            })
            .then((response) => {
                !response.data.record_response["error"] ?
                    resolve(response.data.record_response) :
                    reject(new Error(response.data.record_response["error"]));
            })
            .catch((err) => {
                reject({ message: err });
            });
    });
};

const prepareCustomerData = (response) => {
    return {
        firstName: response["first_name"],
        customerNumber: response["customer_number"],
        email: response["email1"],
        dateOfBirth: response["date_of_birth"],
        id: response["id"],
        employerPhoneNumber: response["employer_phone"],
        employmentType: response["employment_type"],
        fullName: response["full_name"],
        lastName: response["last-name"],
        licenceExpiry: response["drivers_licence_expiry_date_c"],
        licenceNumber: response["driver_licence_number"],
        licenceState: response["drivers_licence_state_c"],
        employerName: response["employer"],
        country: response["primary_address_country"],
        confirmEmail: response["email1"],
        availableCredit: parseFloat(response["available_credit_c"]).toFixed(2),
        approvalLimit: parseFloat(response["approved_limit_c"]).toFixed(2),
        accountKeepingFee: parseFloat(response["account_keeping_fee"]).toFixed(2),
        formatDateOfBirthFormat: response["date_of_birth"],
        middleName: response["middle_name_c"],
        newPassword: response["password_c"],
        nextPaymentAmount: parseFloat(
            response["actual_next_payment_amount_c"]
        ).toFixed(2),
        nextPaymentDate: response["next_payment_date_c"],
        numberOfActivePlans: response["current_payment_plans_c"],
        otherIdExpiry: response["other_id_expiry_c"],
        otherIncome: parseFloat(response["other_income_weekly_c"]).toFixed(2),
        overDuePaymentAmount: parseFloat(
            response["missed_payments_amount_c"]
        ).toFixed(2),
        passportNumber: response["passport_number"],
        passwordStatus: response["password_status_c"],
        paymentCollectedSugarC: response["payments_collected_by_sugar_c"],
        paymentFrequency: response["payment_frequency_c"],
        paymentProcessingFee: parseFloat(
            response["payment_processing_fee"]
        ).toFixed(2),
        phoneMobile: response["phone_mobile"],
        postCode: response["primary_address_postalcode"],
        repaymentAmount: parseFloat(
            response["repayment_amount_per_payment_c"]
        ).toFixed(2),
        residentialStatus: response["residential_status_c"],
        state: response["primary_address_state"],
        street: response["primary_address_street"],
        surburb: response["primary_address_city"],
        timeInJob: response["years_with_employer_c"],
        totalBalanceAmount: parseFloat(response["outstanding_all_plans_c"]).toFixed(
            2
        ),
        title: response["salutation"],
        totalIncome: parseFloat(response["weekly_after_tax_pay_c"]).toFixed(2),
        totalNumberOfPlans: response["current_payment_plans_c"],
        totalOverDuePayments: response["missed_payments_c"],
    };
};

const prepareOverduePayment = (payments) => {
    const scheduleOverduePayment = payments.filter(
        (payment) =>
        payment.purpose === "Scheduled Loan Repayment" &&
        (payment.payment_status === "Unsuccessful" ||
            payment.payment_status === "Failure"),
        (payment) =>
        (payment.purpose === "Scheduled Loan Repayment" &&
            payment.payment_status === "Unsuccessful" &&
            payment.batch_exported === "false") ||
        payment.attempt_count >= 0
    );

    let overduePayment = [];
    scheduleOverduePayment.map((payment) => {
        overduePayment.push({
            id: payment.id,
            amount: parseFloat(payment.amount).toFixed(2),
            name: payment.name,
            purpose: payment.purpose,
            lastAttempt: payment.last_attempt,
            reasonForFailure: payment.payment_status,
            daysOverdue: moment
                .duration(new Date() - new Date(payment.last_attempt))
                .days(),
        });
    });

    return overduePayment;
};

const prepareCustomerNextPaymentData = (response) => {
    return {
        nextDate: response.next_date,
        nextPayment: response.next_payment,
    };
};

const getCustomerNextPayment = (authToken, customerId) => {
    return new Promise((resolve, reject) => {
        const url = `${process.env.url}/Customer_Next_Payment/`;

        const parameters = {
            auth_token: authToken,
            user_ip_address: "172.18.0.11",
            last_activity: "0",
            customer_id: customerId,
        };

        axios
            .post(url, parameters, {
                headers: { "Content-Type": "application/json" },
            })
            .then((response) => {
                response.data["status"] === "success" ?
                    resolve(response.data) :
                    reject(new Error("Unable to get customer next payment"));
            })
            .catch((err) => {
                reject({ message: err });
            });
    });
};





module.exports = router;