require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");


const auth = require("./routes/auth");
const customer = require("./routes/customer");
const payments = require("./routes/payments");
const payment = require("./routes/payment");
const plans = require("./routes/plans");

// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();

// async function main() {
//   const users = await prisma.users.findMany();
//   console.log(users);
// }
// main();

app.use(cors());

app.use(express.json());
app.use("/api/v1/authentication", auth);
app.use("/api/v1/customers", customer);
app.use("/api/v1/customers", payments);
app.use("/api/v1/makePayment", payment);
app.use("/api/v1/plans", plans);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`listening on port ${port}...`));