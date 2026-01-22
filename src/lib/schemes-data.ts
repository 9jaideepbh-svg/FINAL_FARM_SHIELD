export interface GovernmentScheme {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'income-support' | 'insurance' | 'credit' | 'irrigation' | 'marketing' | 'organic';
  benefits: string[];
  eligibility: {
    criteria: string[];
    checkQuestions: {
      id: string;
      question: string;
      required: boolean;
    }[];
  };
  applicationLink: string;
  helplineNumber: string;
  deadline?: string;
  budgetAllocation?: string;
  beneficiaries?: string;
  launchYear: number;
  ministry: string;
  isActive: boolean;
}

export const governmentSchemes: GovernmentScheme[] = [
  {
    id: "pm-kisan",
    name: "Pradhan Mantri Kisan Samman Nidhi",
    shortName: "PM-KISAN",
    description: "Direct income support of ₹6,000 per year to farmer families, paid in three equal installments of ₹2,000 each.",
    category: "income-support",
    benefits: [
      "₹6,000 annual income support",
      "Three installments of ₹2,000 each",
      "Direct bank transfer (DBT)",
      "No collateral required"
    ],
    eligibility: {
      criteria: [
        "Must be a small or marginal farmer family",
        "Combined landholding up to 2 hectares",
        "Must have Aadhaar card linked to bank account",
        "Not a government employee or income tax payer"
      ],
      checkQuestions: [
        { id: "land_owner", question: "Do you own agricultural land?", required: true },
        { id: "land_size", question: "Is your total landholding 2 hectares or less?", required: true },
        { id: "aadhaar", question: "Do you have an Aadhaar card linked to your bank account?", required: true },
        { id: "not_govt", question: "Are you NOT a government employee or pensioner?", required: true },
        { id: "not_taxpayer", question: "Are you NOT an income tax payer?", required: true }
      ]
    },
    applicationLink: "https://pmkisan.gov.in/",
    helplineNumber: "011-24300606",
    budgetAllocation: "₹60,000 Crore (2023-24)",
    beneficiaries: "11+ Crore farmers",
    launchYear: 2019,
    ministry: "Ministry of Agriculture & Farmers Welfare",
    isActive: true
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana",
    shortName: "PMFBY",
    description: "Comprehensive crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests & diseases.",
    category: "insurance",
    benefits: [
      "Coverage for all food & oilseed crops",
      "Low premium: 2% for Kharif, 1.5% for Rabi crops",
      "Full insured amount settlement",
      "Use of technology for quick claim settlement"
    ],
    eligibility: {
      criteria: [
        "All farmers including sharecroppers and tenant farmers",
        "Must enroll before sowing season deadline",
        "Land records required for loan farmers",
        "Voluntary for non-loanee farmers"
      ],
      checkQuestions: [
        { id: "cultivating", question: "Are you currently cultivating agricultural land?", required: true },
        { id: "land_records", question: "Do you have valid land records or tenancy agreement?", required: true },
        { id: "bank_account", question: "Do you have a bank account for premium payment?", required: true }
      ]
    },
    applicationLink: "https://pmfby.gov.in/",
    helplineNumber: "1800-180-1551",
    deadline: "Kharif: July 31, Rabi: December 31",
    budgetAllocation: "₹15,500 Crore (2023-24)",
    beneficiaries: "5.5+ Crore farmers",
    launchYear: 2016,
    ministry: "Ministry of Agriculture & Farmers Welfare",
    isActive: true
  },
  {
    id: "kcc",
    name: "Kisan Credit Card Scheme",
    shortName: "KCC",
    description: "Provides farmers with timely access to credit for their agricultural needs including cultivation, post-harvest expenses, and consumption requirements.",
    category: "credit",
    benefits: [
      "Interest subvention up to 2%",
      "Effective interest rate as low as 4% on timely repayment",
      "Credit limit up to ₹3 lakh",
      "Flexible repayment options",
      "Personal accident insurance coverage"
    ],
    eligibility: {
      criteria: [
        "Owner cultivators or tenant farmers",
        "Oral lessees and share croppers",
        "Self-help groups or joint liability groups",
        "Fisheries and animal husbandry farmers also eligible"
      ],
      checkQuestions: [
        { id: "farmer_type", question: "Are you a farmer, fisherman, or involved in animal husbandry?", required: true },
        { id: "age", question: "Are you between 18-75 years of age?", required: true },
        { id: "kyc", question: "Do you have valid KYC documents (Aadhaar, PAN, etc.)?", required: true }
      ]
    },
    applicationLink: "https://www.pmkisan.gov.in/KCC.aspx",
    helplineNumber: "1800-180-1551",
    budgetAllocation: "₹20 Lakh Crore (Target)",
    beneficiaries: "7+ Crore farmers",
    launchYear: 1998,
    ministry: "Ministry of Finance & Ministry of Agriculture",
    isActive: true
  },
  {
    id: "pmksy",
    name: "Pradhan Mantri Krishi Sinchayee Yojana",
    shortName: "PMKSY",
    description: "Aims to extend irrigation coverage, improve water use efficiency, and ensure sustainable water conservation practices.",
    category: "irrigation",
    benefits: [
      "Subsidy on micro-irrigation systems",
      "Up to 55% subsidy for small farmers",
      "Drip and sprinkler irrigation support",
      "Water harvesting structures"
    ],
    eligibility: {
      criteria: [
        "All categories of farmers",
        "Priority to small and marginal farmers",
        "Land should be suitable for irrigation",
        "Aadhaar linked bank account required"
      ],
      checkQuestions: [
        { id: "land_irrigable", question: "Is your land suitable for irrigation?", required: true },
        { id: "water_source", question: "Do you have access to a water source?", required: true },
        { id: "documents", question: "Do you have land ownership/tenancy documents?", required: true }
      ]
    },
    applicationLink: "https://pmksy.gov.in/",
    helplineNumber: "011-23381092",
    budgetAllocation: "₹93,068 Crore (Total allocation)",
    launchYear: 2015,
    ministry: "Ministry of Agriculture & Farmers Welfare",
    isActive: true
  },
  {
    id: "enam",
    name: "Electronic National Agriculture Market",
    shortName: "e-NAM",
    description: "Pan-India electronic trading portal networking existing APMC mandis to create a unified national market for agricultural commodities.",
    category: "marketing",
    benefits: [
      "Better price discovery for farmers",
      "Transparent bidding process",
      "Direct payment to bank accounts",
      "Reduced intermediaries"
    ],
    eligibility: {
      criteria: [
        "All farmers with agricultural produce",
        "Must register on e-NAM portal",
        "Bank account for receiving payments",
        "Quality certification of produce (optional)"
      ],
      checkQuestions: [
        { id: "produce", question: "Do you have agricultural produce to sell?", required: true },
        { id: "mobile", question: "Do you have a mobile phone for registration?", required: true },
        { id: "bank", question: "Do you have a bank account for receiving payments?", required: true }
      ]
    },
    applicationLink: "https://enam.gov.in/",
    helplineNumber: "1800-270-0224",
    beneficiaries: "1.75+ Crore farmers",
    launchYear: 2016,
    ministry: "Ministry of Agriculture & Farmers Welfare",
    isActive: true
  },
  {
    id: "pkvy",
    name: "Paramparagat Krishi Vikas Yojana",
    shortName: "PKVY",
    description: "Promotes organic farming through adoption of organic village by cluster approach and Participatory Guarantee System (PGS) certification.",
    category: "organic",
    benefits: [
      "₹50,000 per hectare for 3 years",
      "Free PGS certification",
      "Training and capacity building",
      "Market linkage support"
    ],
    eligibility: {
      criteria: [
        "Farmers willing to adopt organic farming",
        "Minimum cluster of 20 hectares",
        "Commitment for 3-year organic conversion",
        "Group formation required"
      ],
      checkQuestions: [
        { id: "organic_interest", question: "Are you interested in organic farming?", required: true },
        { id: "land_available", question: "Do you have at least 1 hectare of land?", required: true },
        { id: "commitment", question: "Can you commit to organic practices for 3 years?", required: true }
      ]
    },
    applicationLink: "https://pgsindia-ncof.gov.in/",
    helplineNumber: "011-24305213",
    budgetAllocation: "₹1,197 Crore",
    launchYear: 2015,
    ministry: "Ministry of Agriculture & Farmers Welfare",
    isActive: true
  }
];

export const schemeCategories = [
  { id: 'all', label: 'All Schemes', icon: 'grid' },
  { id: 'income-support', label: 'Income Support', icon: 'wallet' },
  { id: 'insurance', label: 'Crop Insurance', icon: 'shield' },
  { id: 'credit', label: 'Credit & Loans', icon: 'credit-card' },
  { id: 'irrigation', label: 'Irrigation', icon: 'droplets' },
  { id: 'marketing', label: 'Marketing', icon: 'store' },
  { id: 'organic', label: 'Organic Farming', icon: 'leaf' },
] as const;

export type SchemeCategory = typeof schemeCategories[number]['id'];
