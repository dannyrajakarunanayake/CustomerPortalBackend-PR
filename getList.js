require("dotenv").config();
const axios = require("axios");
const url = `${process.env.url}/list/`;

const getList = (authToken, moduleName, id) => {
  return new Promise((resolve, reject) => {
    const parameters = {
      auth_token: authToken,
      module_name: moduleName,
      scope: "all",
      user_ip_address: "172.18.0.11",
      last_activity: "0",
      max_num: null,
      offset: 0,
      order_by: null,
      id: id,
    };
    axios
      .post(url, parameters, {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        !response.data["API-Error"]
          ? resolve(response.data.record_response.records)
          : reject(new Error(response.data["API-Error"]));
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports = getList;
