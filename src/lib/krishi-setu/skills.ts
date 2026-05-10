import { Language } from "./i18n";

export interface Skill {
  id: string;
  en: string;
  hi: string;
  kn: string;
}

export const skills: Skill[] = [
  {
    id: "irrigation",
    en: "Irrigation & Water Management",
    hi: "सिंचाई और जल प्रबंधन",
    kn: "ನೀರಾವರಿ ಮತ್ತು ಜಲ ನಿರ್ವಹಣೆ"
  },
  {
    id: "sowing",
    en: "Sowing & Transplanting",
    hi: "बुवाई और रोपाई",
    kn: "ಬಿತ್ತನೆ ಮತ್ತು ನಾಟಿ ಮಾಡುವುದು"
  },
  {
    id: "harvesting",
    en: "Harvesting (Crops)",
    hi: "फसल की कटाई",
    kn: "ಬೆಳೆ ಕಟಾವು"
  },
  {
    id: "pesticide",
    en: "Pesticide & Fertilizer Application",
    hi: "कीटनाशक और उर्वरक अनुप्रयोग",
    kn: "ಕೀಟನಾಶಕ ಮತ್ತು ರಸಗೊಬ್ಬರ ಅನ್ವಯಿಕೆ"
  },
  {
    id: "machinery",
    en: "Tractor / Farm Machinery Operation",
    hi: "ट्रैक्टर / कृषि मशीनरी संचालन",
    kn: "ಟ್ರಾಕ್ಟರ್ / ಕೃಷಿ ಯಂತ್ರೋಪಕರಣಗಳ ಕಾರ್ಯಾಚರಣೆ"
  },
  {
    id: "ploughing",
    en: "Land Preparation & Ploughing",
    hi: "भूमि की तैयारी और जुताई",
    kn: "ಭೂಮಿ ಸಿದ್ಧತೆ ಮತ್ತು ಉಳುಮೆ"
  },
  {
    id: "weeding",
    en: "Weeding",
    hi: "निराई-गुड़ाई",
    kn: "ಕಳೆ ಕೀಳುವಿಕೆ"
  },
  {
    id: "greenhouse",
    en: "Greenhouse / Polyhouse Work",
    hi: "ग्रीनहाउस / पॉलीहाउस कार्य",
    kn: "ಹಸಿರುಮನೆ / ಪಾಲಿಹೌಸ್ ಕೆಲಸ"
  },
  {
    id: "horticulture",
    en: "Horticulture (Fruits & Vegetables)",
    hi: "बागवानी",
    kn: "ತೋಟಗಾರಿಕೆ"
  },
  {
    id: "sericulture",
    en: "Sericulture (Silk / Mulberry)",
    hi: "रेशम उत्पादन",
    kn: "ರೇಷ್ಮೆ ಕೃಷಿ"
  },
  {
    id: "poultry",
    en: "Poultry & Animal Husbandry",
    hi: "मुर्गी पालन और पशुपालन",
    kn: "ಕೋಳಿ ಮತ್ತು ಪಶುಸಂಗೋಪನೆ"
  },
  {
    id: "post_harvest",
    en: "Post-Harvest & Storage",
    hi: "कटाई के बाद और भंडारण",
    kn: "ಕಟಾವಿನ ನಂತರ ಮತ್ತು ಸಂಗ್ರಹಣೆ"
  },
  {
    id: "general_labor",
    en: "General Farm Labor",
    hi: "सामान्य कृषि श्रम",
    kn: "ಸಾಮಾನ್ಯ ಕೃಷಿ ಕಾರ್ಮಿಕರು"
  }
];

export const getSkillLabel = (skillId: string, lang: Language) => {
  const skill = skills.find(s => s.id === skillId);
  return skill ? skill[lang] : skillId;
};
