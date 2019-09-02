const URL_WEB = 'https://angular-crud-firebase-9d4e9.firebaseapp.com';

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

// Función que se ejecutará al crear a un usuario, enviará el correo de activación
exports.onCreateUsers = functions.firestore.document('usuarios/{identificador}').onCreate((snap, context) => {
    const to = context.params.identificador;

    const newUser = snap.data();
    const token = newUser['token'];

    const mailOptions = {
        from: '"Al mejor postor" <info@almejorpostor.com>',
        to: to,
        subject: 'Correo de activación',
        html: '<b>Correo de activación</b>'
            + '<br/>'
            + '<span>Hola ' + newUser['nombres'] + ', sigue el enlace para poder activar su cuenta:</span>'
            + '<br />'
            + '<a href="https://us-central1-angular-crud-firebase-9d4e9.cloudfunctions.net/verifyAccount?token=' + token + '">'
            + 'https://us-central1-angular-crud-firebase-9d4e9.cloudfunctions.net/verifyAccount?token=' + token + '</a>'
    };

    console.log("preparando correo " + JSON.stringify(mailOptions));

    return transporter.sendMail(mailOptions).then((info) => {
        console.log("Correo enviado correctamente");
        return true;
    }).catch(error => {
        console.log("Error al enviar correo");
    });
});

//Servicio para verificar la cuenta del usuario
exports.verifyAccount = functions.https.onRequest((request, response) => {
    const token = request.query.token;

    let usuarios = admin.firestore().collection("usuarios");

    // Create a query against the collection.
    let query = usuarios.where("token", "==", token);

    return query.get().then(value => {
        if (!value.empty) {
            const user = value.docs[0].data();

            if (user.estado === 'OK') {
                response.redirect(URL_WEB + '/expired-link')
            }

            const encryptedEmail = Buffer.from(user.email).toString('base64');
            // Reverse(assuming the content you're decoding is a utf8 string):
            // console.log(Buffer.from(b64Encoded, 'base64').toString());

            updateUsers(user);

            response.redirect(URL_WEB + '/login?verifiedAccount=true&token=' + encryptedEmail);
        }

        response.redirect(URL_WEB + '/expired-link')

        return true;

    }).catch(error => {
        console.log(JSON.stringify(error));
    });
});

async function updateUsers(user) {
    await admin.auth().updateUser(user.uid, { emailVerified: true });
    await admin.firestore().collection("usuarios").doc(user.email).update({ 'estado': 'OK' });
}

exports.hello = functions.https.onRequest((request, response) => {
    admin.firestore().collection('usuarios').doc('fchicoma01@gmail.com').set({
        'nombres': "Fernando Luis Enrique",
        'email': 'fchicoma01@gmail.com',
        'estado': 'PE'
    }).then(writeResult => {
        // write is complete here
        response.redirect('http://localhost:5000/login');
        return true;
    }).catch(error => {
        console.log(error);
    });
});
