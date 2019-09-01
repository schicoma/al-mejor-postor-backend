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

exports.sendMail = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const to = 'sebastianchicoma97@gmail.com';

        const mailOptions = {
            from: '"Sebastian :D" <sebastianchicoma97@gmail.com>',
            to: to,
            subject: 'Hola pepón',
            html: '<b>GITHUB INTEGRATION WITH TRAVIS</b>'
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

    admin.firestore().collection('usuarios').add({ 'schicomax': { 'nombre': "SEBASTIAN CHICOMA" } })
        .then(writeResult => {
            // write is complete here
            return response.send(JSON.stringify("Hola sebastian"));

        }).catch(() => {});

});

// Función que se ejecutará al crear a un usuario
exports.onCreateUsers = functions.firestore.document('usuarios/{identificador}')
    .onWrite((change, context) => {
        // If we set `/users/marie` to {name: "Marie"} then
        // context.params.userId == "marie"
        // ... and ...
        // change.after.data() == {name: "Marie"}
        console.log("viendo cambios para nuevo usuario: " + context.params.identificador);
        console.log(JSON.stringify(change.after.data()));
    });
