const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp(functions.config().firebase);

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sebastianchicoma97@gmail.com',
        pass: 'Distortion2020'
    }
});

const runtimeOpts = {
    timeoutSeconds: 300
}

exports.myStorageFunction = functions
    .runWith(runtimeOpts)
    .storage
    .object()
    .onFinalize((object) => {
        // do some complicated things that take a lot of memory and time
    });

exports.sendMail = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const to = 'fchicoma01@gmail.com';

        const mailOptions = {
            from: '"Sebastian :D" <sebastianchicoma97@gmail.com>',
            to: to,
            subject: 'Hola pepón',
            html: '<b>aAHHHHHHHHHHHHHHH,.... piito</b>'
        };

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return response.send(error.toString());
            }

            return response.send(JSON.stringify(info));
        });

    });
});

exports.hello = functions.https.onRequest((request, response) => {
    return response.send(JSON.stringify("Hola sebastian"));
});

// Función que se ejecutará al crear a un usuario
exports.onCreateUsers = functions.firestore.document('usuarios/{identificador}')
    .onWrite((change, context) => {
        // If we set `/users/marie` to {name: "Marie"} then
        // context.params.userId == "marie"
        // ... and ...
        // change.after.data() == {name: "Marie"}

        console.log(context.params);
        console.log(change.after.data());
    });

exports.onCreateUsersTmp = functions.firestore.document('oKsfN4aPheWK42VpikPa/{identificador}')
    .onWrite((change, context) => {
        // If we set `/users/marie` to {name: "Marie"} then
        // context.params.userId == "marie"
        // ... and ...
        // change.after.data() == {name: "Marie"}

        console.log(context.params);
        console.log(change.after.data());
    });