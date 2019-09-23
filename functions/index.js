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

exports.closeSaleByProductId = functions.https.onRequest((request, response) => {
    let uid = request.query.productUid;

    console.log("TERMINAR SUBASTAS MENORES DE " + uid);

    return admin.firestore().collection("productos").doc(uid).get().then(value => {

        cerrarSubasta(value);

        response.send("Se cerró la subasta de " + uid);
        return true;
    });

});

exports.closeSale = functions.https.onRequest((request, response) => {
    let productos = admin.firestore().collection("productos");

    console.log("TERMINAR SUBASTAS MENORES DE " + (new Date()));

    // Create a query against the collection.
    let query = productos.where("fechaFin", "<", new Date()).where("estado", "==", 'C');


    return query.get().then(values => {
        values.forEach((value, index) => {

            cerrarSubasta(value);

        });

        response.send("Se cerraron " + values.length + " subastas");
        return true;
    });

});

async function cerrarSubasta(producto) {

    let usuarioGanadorRef = admin.firestore().collection('ofertas')
        .where('producto.uid', '==', producto.data().uid)
        .orderBy('fecha', 'desc')
        .limit(1);

    let usuarioGanadorSync = await usuarioGanadorRef.get();
    let usuarioGanadorUid;

    usuarioGanadorSync.forEach(result => {
        usuarioGanadorUid = result.data().usuario.uid;
    });

    if (!usuarioGanadorUid) {
        usuarioGanadorUid = 'UNKNOWN';
    }

    await admin.firestore().collection("productos").doc(producto.data().uid).update({
        estado: 'S',
        usuarioGanador: {
            uid: usuarioGanadorUid
        }
    });

    if (usuarioGanadorUid !== 'UNKNOWN') {
        console.log("GANADOR -> " + producto.data().usuario.uid);
        let usuarioOwnerRef = admin.firestore().collection('usuarios')
            .where('uid', '==', producto.data().usuario.uid)
            .limit(1);

        let usuarioOwnerSync = await usuarioOwnerRef.get();
        let usuarioOwnerEmail;

        usuarioOwnerSync.forEach(result => {
            usuarioOwnerEmail = result.data().email;
        });


        let usuarioGanadorEmail;

        let usuarioSync = await admin.firestore().collection('usuarios')
            .where('uid', '==', usuarioGanadorUid)
            .limit(1).get();

        usuarioSync.forEach(result => {
            usuarioGanadorEmail = result.data().email;
        });

        console.log("Envando correo a " + usuarioGanadorEmail);
        enviarCorreoAGanador(usuarioGanadorEmail, producto.data().uid);
        console.log("Envando correo a " + usuarioOwnerEmail);
        enviarCorreoAlOwnerDelProducto(usuarioOwnerEmail, producto.data().uid);
    }

}

async function enviarCorreoAlOwnerDelProducto(emailOwnerDelProducto, productoUid) {
    const to = emailOwnerDelProducto;

    const mailOptions = {
        from: '"Al mejor postor" <info@almejorpostor.com>',
        to: to,
        subject: 'LA SUBASTA HA FINALIZADO',
        html: '<b>La subasta ha finalizado</b>'
            + '<br/>'
            + '<span>Hola, la subasta de su producto ofertado a finalizado.</span>'
            + '<br />'
            + '<span>Vaya al siguiente enlace para conocer los datos del ganador: </span>'
            + '<br />'
            + '<a href="' + URL_WEB + '/product-detail/' + productoUid + '">'
            + URL_WEB + '/product-detail/' + productoUid + '</a>'
    };

    console.log("preparando correo " + JSON.stringify(mailOptions));

    transporter.sendMail(mailOptions).then((info) => {
        console.log("Correo enviado correctamente a owner");
        return true;
    }).catch(error => {
        console.log("Error al enviar correo");
    });
}

async function enviarCorreoAGanador(emailUsuarioGanador, productoUid) {
    const to = emailUsuarioGanador;

    const mailOptions = {
        from: '"Al mejor postor" <info@almejorpostor.com>',
        to: to,
        subject: 'LA SUBASTA HA FINALIZADO',
        html: '<b>La subasta ha finalizado</b>'
            + '<br/>'
            + '<span>Hola, la subasta del producto donde usted participó ha terminado.</span>'
            + '<br />'
            + '<span>Vaya al siguiente enlace para contactar y conocer los datos del dueño del producto: </span>'
            + '<br />'
            + '<a href="' + URL_WEB + '/product-detail/' + productoUid + '">'
            + URL_WEB + '/product-detail/' + productoUid + '</a>'
    };

    console.log("preparando correo " + JSON.stringify(mailOptions));

    transporter.sendMail(mailOptions).then((info) => {
        console.log("Correo enviado correctamente a ganador");
        return true;
    }).catch(error => {
        console.log("Error al enviar correo");
    });
}

//Servicio para verificar la cuenta del usuario
exports.updateNameProducts = functions.https.onRequest((request, response) => {

    //let doc = request.query.doc;

    return admin.firestore().collection("productos")//.doc(doc)
        .get().then(values => {
            values.forEach((value, index) => {
                var name = value.data().nombre;
                var doc = value.id;

                var keywords = createKeywords(name);

                updateProduct(doc, keywords);
            });

            response.send("ok :) ");
            return true;
        }).catch(error => {
            console.log(JSON.stringify(error));

            return true;
        });
});

async function updateProduct(doc, keywords) {
    await admin.firestore().collection("productos").doc(doc).update({
        'keywords': keywords,
        "uid": doc,
        "estado": "C",
        usuarioGanador: {
            uid: '-'
        }
    });
}

function createKeywords(name) {
    let merged = new Set();

    let words = name.toUpperCase().split(' ');
    let words_length = name.split(' ').length;

    for (let i = 0; i < words_length; i++) {
        let buildName = '';

        words.forEach((w, index) => {
            if (index >= i) {
                buildName = buildName.concat(w + ' ');
            }
        });

        merged = new Set([...merged, ...generateArrayFromString(buildName)]);

    }

    return [...merged];

}

function generateArrayFromString(name) {
    let arrName = [];
    let curName = '';
    name.split('').forEach((letter) => {
        curName += letter;
        if (curName.length >= 3) {
            arrName.push(curName.trim());
        }
    });
    return arrName;
}

