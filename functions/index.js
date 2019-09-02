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
            from: '"Al mejor postor" <info@almejorpostor.com>',
            to: to,
            subject: 'Correo de activación',
            html: '<b>Correo de activación</b>'
                + '<br/>'
                + '<span>Hola Sebastian, sigue el enlace para poder activar su cuenta:</span>'
                + '<br />'
                + '<a href="http://www.google.com.pe">http://www.google.com.pe</a>'
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
    admin.firestore().collection('usuarios').doc('fchicoma01@gmail.com').set({ 'nombres': "Fernando Luis Enrique" })
        .then(writeResult => {
            // write is complete here
            return response.send(JSON.stringify("Hola sebastian"));
        }).catch(error => {
            console.log(error);
        });
});

// Función que se ejecutará al crear a un usuario
exports.onCreateUsers = functions.firestore.document('usuarios/{identificador}')
    .onCreate((snap, context) => {
        const newUser = snap.data();
        const to = context.params.identificador;
        console.log('to:' + to);
        console.log('newUser:' + JSON.stringify(newUser));
        const mailOptions = {
            from: '"Al mejor postor" <info@almejorpostor.com>',
            to: to,
            subject: 'Correo de activación',
            html: '<b>Correo de activación</b>'
                + '<br/>'
                + '<span>Hola ' + newUser['nombres'] + ', sigue el enlace para poder activar su cuenta:</span>'
                + '<br />'
                + '<a href="http://www.google.com.pe">http://www.google.com.pe</a>'
        };
        console.log("preparando correo " + JSON.stringify(mailOptions));
        return transporter.sendMail(mailOptions).then((info) => {
            console.log("Correo enviado correctamente");
        }).catch(error => {
            console.log("Error al enviar correo");
        });
    });
