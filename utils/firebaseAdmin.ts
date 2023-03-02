import admin from 'firebase-admin';
const serviceAccount = require('../smartgarbaging-firebase-adminsdk-xphc4-4f922fee21.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const getMessaging = () => {
    try {
        return admin.messaging();
    } catch (err) {
        throw err;
    }
};

export {
    getMessaging,
};