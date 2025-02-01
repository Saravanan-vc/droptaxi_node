const express = require('express');
const nodemailer = require('nodemailer');
const mailoptions = require("./mail/send_details");
require('dotenv').config();
const bodyParser = require('body-parser');
const host = express();
const router = express.Router();
const cros = require('cors');
const twilio = require('twilio');


host.use(bodyParser.json());
host.use(cros());

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);



router.post("/neworder", async (req, res) => {
    const { time, date, name, number, amount, services, from, to } = req.body;
    console.log(req.body);
    if (!time || !date || !name || !number || !amount || !services || !from || !to) {
        return res.status(400).json({ 'value': "missing fields" });
    }
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.TRANSPORT_HOST,
            port: process.env.HOST_PORT,
            secure: false,
            auth: {
                user: process.env.AUTH_USER,
                pass: process.env.AUTH_PASS,
            },
        });
        const options = mailoptions(time, date, name, number, amount, services, from, to)
        const emailPromise = new Promise((resolve, reject) => {
            transporter.sendMail(options, (error, info) => {
                if (error) {
                    console.log(`Error sending email: ${error}`);
                    reject(error);
                } else {
                    console.log(`Email sent successfully: ${info.response}`);
                    resolve(info.response);
                }
            });
        });
        const messagePromise = sendMessage(time, date, amount, from, to);

        await Promise.all([emailPromise, messagePromise]);

        res.status(200).json({ "success": "gud" });
    } catch (error) {
        res.status(400).json({ "success": "bad" });
    }

});

const sendMessage = (amount, time, date, from, to,) => {
    return new Promise((resolve, reject) => {
        client.messages.create({
            body: `Drop Taxi \nYour order was successfully booked \nFrom : ${from} \nTo : ${to} \nDate : ${date} \nTime : ${time} \nOrder Amount : ${amount}`,
            from: 'whatsapp:+14155238886',
            to: `whatsapp:+919790860187`,
        })
            .then(message => {
                console.log(`Message sent with SID: ${message.sid}`);
                resolve(message.sid); 
            })
            .catch(error => {
                console.error(`Error sending message: ${error.message}`);
                reject(error); 
            });
    });
}


host.use(router);

host.listen(8000, () => console.log('http://localhost:8000/neworder'));

