import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// English Translations
const en = {
    translation: {
        welcome: 'Welcome to Bookfleet',
        selectLanguage: 'Select Language',
        login: 'Login',
        enterMobile: 'Enter Mobile Number',
        otpVerification: 'OTP Verification',
        sendOtp: 'Send OTP',
        verify: 'Verify',
        home: 'Home',
        bookings: 'Bookings',
        profile: 'Profile',
        pickup: 'Pickup Location',
        drop: 'Drop Location',
        bike: 'Bike',
        tataAce: 'Tata Ace',
        pickupVan: 'Pickup Van',
        miniTruck: 'Mini Truck',
        estimate: 'Fare Estimate',
        bookNow: 'Book Now',
        cash: 'Cash',
        upi: 'UPI',
    },
};

// Odia Translations (Romanized placeholders for now, can perform actual script later)
const or = {
    translation: {
        welcome: 'Bookfleet ku Swagata',
        selectLanguage: 'Bhasha Chayan Karantu',
        login: 'Login',
        enterMobile: 'Mobile Number Dia',
        otpVerification: 'OTP Junch',
        sendOtp: 'OTP Pathantu',
        verify: 'Jach Karantu',
        home: 'Ghara',
        bookings: 'Booking Gudika',
        profile: 'Profile',
        pickup: 'Uthaiba Jagah',
        drop: 'Pakeiba Jagah',
        bike: 'Bike',
        tataAce: 'Tata Ace',
        pickupVan: 'Pickup Van',
        miniTruck: 'Mini Truck',
        estimate: 'Bhada Anuman',
        bookNow: 'Bartaman Book Karantu',
        cash: 'Nagad',
        upi: 'UPI',
    },
};

const MODULE_ID = 'language_persistence';

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const savedLanguage = await AsyncStorage.getItem(MODULE_ID);
            const language = savedLanguage || 'en';
            callback(language);
        } catch (error) {
            console.log('Error reading language', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem(MODULE_ID, language);
        } catch (error) {
            console.log('Error caching language', error);
        }
    },
};

i18n
    .use(initReactI18next)
    .use(languageDetector as any) // Cast due to type definition mismatch in some versions
    .init({
        resources: {
            en,
            or,
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
