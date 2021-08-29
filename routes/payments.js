require("dotenv").config();
const express = require("express");
const Joi = require("joi");
const router = express.Router();
const axios = require("axios");
const getList = require("../getList");

router.get("/:id/payments", (req, res) => {
  const schema = {
    "x-auth-token": Joi.required(),
  };
  const xAuthToken = req.headers["x-auth-token"];
  const headers = { "x-auth-token": xAuthToken };

  const result = Joi.validate(headers, schema);
  if (result.error) {
    res.status(400).json({ message: "x-auth-token missing" });
  }

  const response = getList(xAuthToken, "p_Payments", req.params.id);

  return new Promise((resolve, reject) => {
    response
      .then((data) => {
        res.json({ payments: data })
          ? resolve(response.data)
          : reject(new Error("unable to get Customer Payments"));
      })
      .catch((error) => {
        reject({ message: error });
      });
  });
});

module.exports = router;
