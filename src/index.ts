import axios from "axios";
import express from "express";
import readlineSync from "readline-sync";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Setup basic variables
const app = express();
app.use(express.json());

const argv = yargs(hideBin(process.argv))
  .option("name", {
    alias: "n",
    type: "string",
    description: "Your name (Alice or Bob)",
    demandOption: true,
  })
  .option("myPort", {
    alias: "p",
    type: "number",
    description: "Your local port number",
    demandOption: true,
  })
  .option("peerURL", {
    alias: "u",
    type: "string",
    description: "The peer's URL (e.g., http://localhost:3002)",
    demandOption: true,
  })
  .parseSync();

const myName = argv.name;
const myPort = argv.myPort;
const peerURL = argv.peerURL;

let BALANCE = 0;

const viewBalance = () => {
  console.log(`Your current balance is: ${BALANCE}`);
};

// Function to send money
const sendMoney = async (amount: number) => {
  try {
    console.log(`Sending $${amount} to your peer...`);
    const response = await axios.post(`http://${peerURL}/receive`, {
      amount,
      sender: myName,
    });
    console.log(`Successfully sent $${amount} to your peer.`);
    BALANCE -= amount;
    viewBalance();
  } catch (error: any) {
    console.error("Error sending money:", error);
  }
};

// Receive money from peer
app.post("/receive", (req, res) => {
  const { amount, sender } = req.body;
  console.log(`${sender} sent you $${amount}.`);
  BALANCE += amount;
  viewBalance();
  res.status(200).send("Money received successfully.");
});

app.get("/", (req, res) => res.send(`${myName} is running on port ${myPort}.`));

// Start the server
app.listen(myPort, () => {
  console.log(`${myName} is running on port ${myPort}.`);
  console.log(`Your peer is at http://${peerURL}`);

  // Start interactive prompt
  startPrompt();
});

// CLI for user interaction
const startPrompt = () => {
  const payRegex = /^pay\s+(\d+(\.\d+)?)$/i;

  while (true) {
    const action = readlineSync
      .question(
        'Enter "pay <amount>" to send money, "balance" to view your balance, or "exit" to quit: '
      )
      .trim();

    const payMatch = action.match(payRegex);
    if (payMatch) {
      const amount = parseFloat(payMatch[1]);
      if (amount > 0) {
        sendMoney(amount);
      } else {
        console.log("Invalid amount. Please enter a positive number.");
      }
    } else if (action === "balance") {
      viewBalance();
    } else if (action === "exit") {
      console.log("Goodbye!");
      process.exit(0);
    } else {
      console.log(
        'Invalid command. Please enter "pay <amount>", "balance", or "exit".'
      );
    }
  }
};
