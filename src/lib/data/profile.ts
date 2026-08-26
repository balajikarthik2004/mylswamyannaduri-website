import type { L } from "@/lib/i18n";

export const profile = {
  name: { en: "Mylswamy Annadurai", ta: "மயில்சாமி அண்ணாதுரை" } as L,
  honorific: { en: "Dr.", ta: "முனைவர்" } as L,
  fullName: {
    en: "Dr. Mylswamy Annadurai",
    ta: "முனைவர் மயில்சாமி அண்ணாதுரை",
  } as L,
  epithet: { en: "Moon Man of India", ta: "இந்தியாவின் நிலவு மனிதர்" } as L,
  role: {
    en: "Former ISRO Scientist",
    ta: "முன்னாள் இஸ்ரோ விஞ்ஞானி",
  } as L,
  tagline: {
    en: "Padma Shri · Project Director, Chandrayaan-1 · Programme Director, Mangalyaan",
    ta: "பத்மஸ்ரீ · திட்ட இயக்குனர், சந்திரயான்-1 · திட்ட இயக்குனர், மங்கள்யான்",
  } as L,
  born: {
    en: "Born 2 July 1958 · Kodhawady, Coimbatore, Tamil Nadu",
    ta: "பிறப்பு: 2 ஜூலை 1958 · கோதவாடி, கோயம்புத்தூர், தமிழ்நாடு",
  } as L,
  /** Verbatim from mylswamyannadurai.in */
  bio: [
    {
      en: "Padma Shri awardee Dr. Mylswamy Annadurai, popularly known as Moon Man of India, (born July 2, 1958, Kodhawady, Tamil Nadu, India), is an Indian aerospace engineer who held a number of posts with the Indian Space Research Organisation (ISRO), including the directorship (2015–18) of the U R Rao Satellite Centre (formerly the ISRO Satellite Centre).",
      ta: "பத்மஸ்ரீ விருது பெற்ற முனைவர் மயில்சாமி அண்ணாதுரை, இந்தியாவின் நிலவு மனிதர் என்று அழைக்கப்படுபவர் (பிறப்பு ஜூலை 2, 1958, கோதவாடி, தமிழ்நாடு), இந்திய விண்வெளி ஆராய்ச்சி நிறுவனத்தில் (இஸ்ரோ) பல பொறுப்புகளை வகித்த ஒரு இந்திய விண்வெளிப் பொறியாளர் ஆவார். 2015–18 காலகட்டத்தில் யு. ஆர். ராவ் செயற்கைக்கோள் மையத்தின் இயக்குநராகப் பணியாற்றினார்.",
    },
    {
      en: "Following his early education in his native village, Annadurai in 1980 earned a bachelor's degree in engineering from the Government College of Engineering in Coimbatore, Tamil Nadu. In 1982 he received a master's degree from the PSG College of Technology in Coimbatore and obtained his PhD from Anna University.",
      ta: "தனது சொந்த ஊரில் ஆரம்பக் கல்வியை முடித்த பிறகு, அண்ணாதுரை 1980 இல் கோயம்புத்தூர் அரசு தொழில்நுட்பக் கல்லூரியில் பொறியியல் இளநிலைப் பட்டம் பெற்றார். 1982 இல் கோயம்புத்தூர் பி.எஸ்.ஜி. தொழில்நுட்பக் கல்லூரியில் முதுநிலைப் பட்டமும், அண்ணா பல்கலைக்கழகத்தில் முனைவர் பட்டமும் பெற்றார்.",
    },
    {
      en: "He has been also awarded honorary doctorates from several universities and is the recipient of numerous awards. Post superannuation from ISRO, Dr. Annadurai is advising and guiding a few innovative startups and charities.",
      ta: "பல பல்கலைக்கழகங்களிடமிருந்து கௌரவ முனைவர் பட்டங்களும், எண்ணற்ற விருதுகளும் பெற்றுள்ளார். இஸ்ரோவிலிருந்து ஓய்வு பெற்ற பிறகு, முனைவர் அண்ணாதுரை பல புத்தாக்க தொடக்க நிறுவனங்களுக்கும் அறக்கட்டளைகளுக்கும் ஆலோசனை வழங்கி வழிநடத்தி வருகிறார்.",
    },
  ] satisfies L[],
  quote: {
    en: "A farmer's son from Kodhawady who taught a nation to reach for the Moon — and then for Mars, on the very first attempt.",
    ta: "கோதவாடியைச் சேர்ந்த ஒரு விவசாயியின் மகன், ஒரு தேசத்திற்கு நிலவை எட்டிப்பிடிக்கக் கற்றுக் கொடுத்தார் — பின்னர் முதல் முயற்சியிலேயே செவ்வாயையும்.",
  } as L,
} as const;

export const stats: {
  value: number;
  suffix: string;
  label: L;
  detail: L;
}[] = [
  {
    value: 36,
    suffix: "",
    label: { en: "Years at ISRO", ta: "இஸ்ரோவில் ஆண்டுகள்" },
    detail: { en: "1982 — 2018", ta: "1982 — 2018" },
  },
  {
    value: 60,
    suffix: "+",
    label: { en: "Satellites contributed to", ta: "பங்களித்த செயற்கைக்கோள்கள்" },
    detail: {
      en: "INSAT · IRS · GSAT · EDUSAT",
      ta: "இன்சாட் · ஐஆர்எஸ் · ஜிசாட் · எடுசாட்",
    },
  },
  {
    value: 3000,
    suffix: "+",
    label: { en: "Scientists & engineers led", ta: "வழிநடத்திய விஞ்ஞானிகள்" },
    detail: {
      en: "As Director, ISRO Satellite Centre",
      ta: "இயக்குனர், இஸ்ரோ செயற்கைக்கோள் மையம்",
    },
  },
  {
    value: 100,
    suffix: "+",
    label: { en: "Awards & honours", ta: "விருதுகள் மற்றும் கௌரவங்கள்" },
    detail: {
      en: "National & international",
      ta: "தேசிய மற்றும் சர்வதேச",
    },
  },
];

/** Mission-scale numbers used in the missions section. */
export const missionStats: { value: L; label: L }[] = [
  {
    value: { en: "1st", ta: "முதல்" },
    label: {
      en: "Nation to find water on the Moon",
      ta: "நிலவில் நீரைக் கண்டறிந்த முதல் தேசம்",
    },
  },
  {
    value: { en: "$74M", ta: "$74M" },
    label: {
      en: "Cost of Mangalyaan — the most cost-effective Mars mission ever flown",
      ta: "மங்கள்யானின் செலவு — இதுவரை அனுப்பப்பட்ட மிகச் சிக்கனமான செவ்வாய்ப் பயணம்",
    },
  },
  {
    value: { en: "30", ta: "30" },
    label: {
      en: "Satellites built & launched during his directorship (2015–18)",
      ta: "அவரது இயக்குநர் காலத்தில் ஏவப்பட்ட செயற்கைக்கோள்கள் (2015–18)",
    },
  },
];

export const socials = [
  { label: "YouTube", href: "https://www.youtube.com/channel/UCDrESOXbOTKVozBj3hU354g/videos" },
  { label: "X", href: "https://twitter.com/m_annadurai" },
  { label: "Facebook", href: "https://www.facebook.com/mylswamy.annadurai" },
  { label: "Instagram", href: "https://www.instagram.com/mylswamy_annadurai/?hl=en" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/dr-mylswamy-annadurai-05641a1/" },
] as const;
