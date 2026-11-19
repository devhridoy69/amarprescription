// Standard Medical and Dietary Advice
export const COMMON_ADVICE = [
  { bn: 'পর্যাপ্ত পরিমাণে বিশুদ্ধ পানি পান করুন (প্রতিদিন ২-৩ লিটার)', en: 'Drink adequate pure drinking water (2-3 L daily)' },
  { bn: 'তৈলাক্ত, ভাজাপোড়া ও অতিরিক্ত মসলাযুক্ত খাবার সম্পূর্ণ পরিহার করুন', en: 'Avoid oily, spicy and deep-fried fast food' },
  { bn: 'ভরা পেটে ওষুধ সেবন করবেন', en: 'Take medications with or after meals' },
  { bn: 'অ্যান্টিবায়োটিকের সম্পূর্ণ কোর্স নির্দিষ্ট সময়ে শেষ করবেন, মাঝপথে বন্ধ করবেন না', en: 'Complete full course of antibiotics as directed' },
  { bn: 'ধুলোবালি ও ঠান্ডা বাতাস এড়িয়ে চলুন এবং বাইরে বের হলে মাস্ক ব্যবহার করুন', en: 'Avoid dust and cold exposure; wear mask outdoors' },
  { bn: 'কুসুম গরম পানিতে লবণ দিয়ে কুলকুচি ও গড়গড়া করবেন দিনে ৩-৪ বার', en: 'Gargle with lukewarm salt water 3-4 times daily' },
  { bn: 'প্রতিদিন নিয়ম করে সকালে অথবা বিকেলে অন্তত ৩০ মিনিট দ্রুত হাঁটুন', en: 'Walk briskly for at least 30 minutes daily' },
  { bn: 'খাবারে বাড়তি কাঁচা লবণ ও অতিরিক্ত চিনি বর্জন করুন', en: 'Strictly avoid extra raw salt and refined sugars' },
  { bn: 'ধূমপান, তামাক ও জর্দা সম্পূর্ণভাবে বর্জন করুন', en: 'Strictly avoid smoking, tobacco and jorda' },
  { bn: 'পর্যাপ্ত বিশ্রাম নিন এবং প্রতিদিন অন্তত ৭-৮ ঘণ্টা নিয়মিত ঘুমান', en: 'Take adequate rest and maintain 7-8 hours sleep' },
  { bn: 'ভারী কোনো জিনিস তুলবেন না ও সামনে ঝুঁকে কাজ করবেন না', en: 'Do not lift heavy weights or bend forward' },
  { bn: 'নরম বিছানা পরিহার করুন এবং শক্ত সমান বিছানায় ঘুমাবেন', en: 'Sleep on a firm, flat mattress; avoid soft beds' },
  { bn: 'শাকসবজি, ফলমূল ও আঁশযুক্ত খাবার বেশি করে খাবেন', en: 'Eat plenty of green vegetables and dietary fibers' },
  { bn: 'ওষুধ চলাকালীন রক্তচাপ ( Blood Pressure ) ও রক্তের শর্করা ( Blood Suger ) নিয়মিত মাপবেন', en: 'Monitor blood pressure and blood sugar regularly' },
  { bn: 'রোগের কোনো অস্বাভাবিক লক্ষণ বা অবনতি হলে দ্রুত চিকিৎসকের শরণাপন্ন হবেন', en: 'Contact doctor or hospital immediately if symptoms worsen' },
  { bn: 'রিপোর্ট সহ নির্দিষ্ট তারিখে অবশ্যই ফলো-আপে আসবেন', en: 'Follow-up on scheduled date along with test reports' }
];

export const FOLLOW_UP_PRESETS = [
  { label: '৩ দিন পর', days: 3 },
  { label: '৫ দিন পর', days: 5 },
  { label: '৭ দিন পর (১ সপ্তাহ)', days: 7 },
  { label: '১০ দিন পর', days: 10 },
  { label: '১৪ দিন পর (২ সপ্তাহ)', days: 14 },
  { label: '১ মাস পর', days: 30 },
  { label: '৩ মাস পর', days: 90 },
  { label: 'রিপোর্ট নিয়ে', days: null, customText: 'সকল টেস্ট রিপোর্ট পাওয়ার পর' },
  { label: 'প্রয়োজনে', days: null, customText: 'যেকোনো প্রয়োজনে বা অসুবিধা হলে' }
];
