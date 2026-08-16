/**
 * إعدادات وربط Firebase Firestore للوحة التحكم
 * مشروع: joussour-media
 */

const firebaseConfig = {
    apiKey: "AIzaSyAU7GIo2YMp9yFGg8ILVLolDBsMkavU_zc",
    authDomain: "joussour-media.firebaseapp.com",
    projectId: "joussour-media",
    storageBucket: "joussour-media.firebasestorage.app",
    messagingSenderId: "323981172266",
    appId: "1:323981172266:web:8ee6b2e298e5201dcaad53",
    measurementId: "G-BTFTSZXQXK"
};

// تهيئة Firebase والاتصال بـ Firestore
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log("✅ تم الاتصال بنجاح مع Firebase Firestore (joussour-media)!");
    }
} catch (e) {
    console.warn("تنبيه أثناء تهيئة Firebase:", e);
}
