import { getMessaging } from "./firebaseAdmin";

export const sendNotification = async (deviceIds: string[], content: string) => {
    const message = {
        notification: {
            title: 'Thông báo',
            body: content
        },
        android: {
            notification: {
                sound: 'default',
            },
        },
        tokens: deviceIds
    }
    try {
        const res = await getMessaging().sendMulticast(message);
        console.log(`Successful Notifications: ${res.successCount}`);
        console.log(`Unsuccessful Notifications: ${res.failureCount}`);
    } catch (error) {
        console.error(error);
    }
}