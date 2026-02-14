export interface CropItem {
  id: string;
  name: string;
  hindi: string;
  category: CropCategory;
  emoji: string;
}

export type CropCategory = "all" | "vegetables" | "fruits" | "grains" | "pulses" | "cash_crops";

export const cropCategories: { id: CropCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "grains", label: "Grains" },
  { id: "pulses", label: "Pulses" },
  { id: "cash_crops", label: "Cash Crops" },
];

export const crops: CropItem[] = [
  // Vegetables
  { id: "tomato", name: "Tomato", hindi: "टमाटर", category: "vegetables", emoji: "🍅" },
  { id: "onion", name: "Onion", hindi: "प्याज", category: "vegetables", emoji: "🧅" },
  { id: "potato", name: "Potato", hindi: "आलू", category: "vegetables", emoji: "🥔" },
  { id: "cabbage", name: "Cabbage", hindi: "पत्तागोभी", category: "vegetables", emoji: "🥬" },
  { id: "cauliflower", name: "Cauliflower", hindi: "फूलगोभी", category: "vegetables", emoji: "🥦" },
  { id: "brinjal", name: "Brinjal", hindi: "बैंगन", category: "vegetables", emoji: "🍆" },
  { id: "okra", name: "Okra (Lady Finger)", hindi: "भिंडी", category: "vegetables", emoji: "🌿" },
  { id: "carrot", name: "Carrot", hindi: "गाजर", category: "vegetables", emoji: "🥕" },
  { id: "beans", name: "Green Beans", hindi: "फलियाँ", category: "vegetables", emoji: "🫘" },
  { id: "capsicum", name: "Capsicum", hindi: "शिमला मिर्च", category: "vegetables", emoji: "🫑" },
  { id: "cucumber", name: "Cucumber", hindi: "खीरा", category: "vegetables", emoji: "🥒" },
  { id: "pumpkin", name: "Pumpkin", hindi: "कद्दू", category: "vegetables", emoji: "🎃" },
  { id: "spinach", name: "Spinach", hindi: "पालक", category: "vegetables", emoji: "🥬" },
  { id: "green_chili", name: "Green Chili", hindi: "हरी मिर्च", category: "vegetables", emoji: "🌶️" },
  { id: "bitter_gourd", name: "Bitter Gourd", hindi: "करेला", category: "vegetables", emoji: "🥒" },
  { id: "bottle_gourd", name: "Bottle Gourd", hindi: "लौकी", category: "vegetables", emoji: "🍐" },
  { id: "ridge_gourd", name: "Ridge Gourd", hindi: "तोरई", category: "vegetables", emoji: "🥒" },
  { id: "radish", name: "Radish", hindi: "मूली", category: "vegetables", emoji: "🥕" },
  { id: "drumstick", name: "Drumstick", hindi: "सहजन", category: "vegetables", emoji: "🌿" },
  { id: "garlic", name: "Garlic", hindi: "लहसुन", category: "vegetables", emoji: "🧄" },
  { id: "ginger", name: "Ginger", hindi: "अदरक", category: "vegetables", emoji: "🫚" },
  // Fruits
  { id: "mango", name: "Mango", hindi: "आम", category: "fruits", emoji: "🥭" },
  { id: "banana", name: "Banana", hindi: "केला", category: "fruits", emoji: "🍌" },
  { id: "apple", name: "Apple", hindi: "सेब", category: "fruits", emoji: "🍎" },
  { id: "grapes", name: "Grapes", hindi: "अंगूर", category: "fruits", emoji: "🍇" },
  { id: "pomegranate", name: "Pomegranate", hindi: "अनार", category: "fruits", emoji: "🫐" },
  { id: "orange", name: "Orange", hindi: "संतरा", category: "fruits", emoji: "🍊" },
  { id: "papaya", name: "Papaya", hindi: "पपीता", category: "fruits", emoji: "🍈" },
  { id: "watermelon", name: "Watermelon", hindi: "तरबूज", category: "fruits", emoji: "🍉" },
  { id: "guava", name: "Guava", hindi: "अमरूद", category: "fruits", emoji: "🍐" },
  { id: "coconut", name: "Coconut", hindi: "नारियल", category: "fruits", emoji: "🥥" },
  { id: "lemon", name: "Lemon", hindi: "नींबू", category: "fruits", emoji: "🍋" },
  { id: "pineapple", name: "Pineapple", hindi: "अनानास", category: "fruits", emoji: "🍍" },
  // Grains
  { id: "rice", name: "Rice (Paddy)", hindi: "धान/चावल", category: "grains", emoji: "🌾" },
  { id: "wheat", name: "Wheat", hindi: "गेहूँ", category: "grains", emoji: "🌾" },
  { id: "maize", name: "Maize (Corn)", hindi: "मक्का", category: "grains", emoji: "🌽" },
  { id: "bajra", name: "Bajra (Pearl Millet)", hindi: "बाजरा", category: "grains", emoji: "🌾" },
  { id: "jowar", name: "Jowar (Sorghum)", hindi: "ज्वार", category: "grains", emoji: "🌾" },
  { id: "ragi", name: "Ragi (Finger Millet)", hindi: "रागी", category: "grains", emoji: "🌾" },
  // Pulses
  { id: "chickpea", name: "Chickpea (Chana)", hindi: "चना", category: "pulses", emoji: "🫘" },
  { id: "lentil", name: "Lentil (Masoor)", hindi: "मसूर", category: "pulses", emoji: "🫘" },
  { id: "pigeon_pea", name: "Pigeon Pea (Tur/Arhar)", hindi: "तूर/अरहर", category: "pulses", emoji: "🫘" },
  { id: "green_gram", name: "Green Gram (Moong)", hindi: "मूँग", category: "pulses", emoji: "🫘" },
  { id: "black_gram", name: "Black Gram (Urad)", hindi: "उड़द", category: "pulses", emoji: "🫘" },
  { id: "kidney_bean", name: "Kidney Bean (Rajma)", hindi: "राजमा", category: "pulses", emoji: "🫘" },
  // Cash Crops
  { id: "cotton", name: "Cotton", hindi: "कपास", category: "cash_crops", emoji: "🌿" },
  { id: "sugarcane", name: "Sugarcane", hindi: "गन्ना", category: "cash_crops", emoji: "🎋" },
  { id: "soybean", name: "Soybean", hindi: "सोयाबीन", category: "cash_crops", emoji: "🌿" },
  { id: "groundnut", name: "Groundnut", hindi: "मूँगफली", category: "cash_crops", emoji: "🥜" },
  { id: "sunflower", name: "Sunflower", hindi: "सूरजमुखी", category: "cash_crops", emoji: "🌻" },
  { id: "mustard", name: "Mustard", hindi: "सरसों", category: "cash_crops", emoji: "🌿" },
  { id: "turmeric", name: "Turmeric", hindi: "हल्दी", category: "cash_crops", emoji: "🟡" },
  { id: "tea", name: "Tea", hindi: "चाय", category: "cash_crops", emoji: "🍵" },
  { id: "coffee", name: "Coffee", hindi: "कॉफ़ी", category: "cash_crops", emoji: "☕" },
  { id: "jute", name: "Jute", hindi: "जूट", category: "cash_crops", emoji: "🌿" },
];

export const indianCities = [
  "Mumbai, Maharashtra", "Delhi, Delhi", "Bangalore, Karnataka", "Hyderabad, Telangana",
  "Ahmedabad, Gujarat", "Chennai, Tamil Nadu", "Kolkata, West Bengal", "Pune, Maharashtra",
  "Jaipur, Rajasthan", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh", "Nagpur, Maharashtra",
  "Indore, Madhya Pradesh", "Thane, Maharashtra", "Bhopal, Madhya Pradesh", "Visakhapatnam, Andhra Pradesh",
  "Patna, Bihar", "Vadodara, Gujarat", "Ghaziabad, Uttar Pradesh", "Ludhiana, Punjab",
  "Agra, Uttar Pradesh", "Nashik, Maharashtra", "Ranchi, Jharkhand", "Meerut, Uttar Pradesh",
  "Rajkot, Gujarat", "Varanasi, Uttar Pradesh", "Srinagar, Jammu & Kashmir", "Aurangabad, Maharashtra",
  "Dhanbad, Jharkhand", "Amritsar, Punjab", "Allahabad, Uttar Pradesh", "Gwalior, Madhya Pradesh",
  "Jabalpur, Madhya Pradesh", "Coimbatore, Tamil Nadu", "Vijayawada, Andhra Pradesh",
  "Jodhpur, Rajasthan", "Madurai, Tamil Nadu", "Raipur, Chhattisgarh", "Kota, Rajasthan",
  "Chandigarh, Chandigarh", "Guwahati, Assam", "Solapur, Maharashtra", "Hubli, Karnataka",
  "Mysore, Karnataka", "Tiruchirappalli, Tamil Nadu", "Bareilly, Uttar Pradesh",
  "Belgaum, Karnataka", "Mangalore, Karnataka", "Kolhapur, Maharashtra", "Sangli, Maharashtra",
];
