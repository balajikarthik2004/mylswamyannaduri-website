import type { L } from "@/lib/i18n";

export type Era = "education" | "isro" | "leadership" | "beyond";

export type TimelineEntry = {
  period: string;
  title: L;
  era: Era;
  /** Highlighted entries get a larger card and an accent rule. */
  major?: boolean;
};

export const eraLabels: Record<Era, L> = {
  education: { en: "Education", ta: "கல்வி" },
  isro: { en: "ISRO — Spacecraft & Missions", ta: "இஸ்ரோ — விண்கலம் & பயணங்கள்" },
  leadership: { en: "Leadership", ta: "தலைமைப் பொறுப்பு" },
  beyond: { en: "Beyond ISRO", ta: "இஸ்ரோவிற்குப் பிறகு" },
};

/** Chronicle taken from the official site, including its Tamil translations. */
export const timeline: TimelineEntry[] = [
  {
    period: "1976",
    era: "education",
    title: {
      en: "Completed schooling in his native village Kodhawady",
      ta: "பள்ளிப்படிப்பை சொந்த ஊர் கோதவாடியில் முடித்தார்.",
    },
  },
  {
    period: "1976 – 1980",
    era: "education",
    title: {
      en: "Completed UG degree from Government College of Technology, Coimbatore",
      ta: "கோயம்புத்தூரில் உள்ள அரசு தொழில்நுட்பக் கல்லூரியில் இளநிலை பட்டப்படிப்பை முடித்தார்.",
    },
  },
  {
    period: "1980 – 1982",
    era: "education",
    title: {
      en: "Completed PG degree from P.S.G College of Technology, Coimbatore",
      ta: "கோயம்புத்தூர் பூ. சா. கோ. தொழில்நுட்பக் கல்லூரியில் பொறியியலில் முதுநிலைப் பட்டம் பெற்றார்.",
    },
  },
  {
    period: "1982",
    era: "isro",
    major: true,
    title: { en: "Joined ISRO", ta: "இஸ்ரோவில் சேர்ந்தார்" },
  },
  {
    period: "1985 – 1988",
    era: "isro",
    title: {
      en: "Team leader, software satellite simulator",
      ta: "மென்பொருள் செயற்கைக்கோள் சிமுலேட்டரை உருவாக்குவதற்கான குழுத் தலைவராக பொறுப்பேற்றார்",
    },
  },
  {
    period: "1988 – 1992",
    era: "isro",
    title: {
      en: "Spacecraft operations manager, IRS-1A",
      ta: "விண்கல இயக்க மேலாளர், ஐஆர்எஸ்-1A",
    },
  },
  {
    period: "1992 – 1996",
    era: "isro",
    title: {
      en: "Spacecraft operations manager, INSAT-2A",
      ta: "விண்கல இயக்க மேலாளர், இன்சாட்-2A",
    },
  },
  {
    period: "1996 – 2001",
    era: "isro",
    title: { en: "Mission director, INSAT-2C", ta: "பணி இயக்குனர், இன்சாட்-2C" },
  },
  {
    period: "1997 – 1998",
    era: "isro",
    title: { en: "Mission director, INSAT-2D", ta: "பணி இயக்குனர், இன்சாட்-2D" },
  },
  {
    period: "1999 – 2012",
    era: "isro",
    title: { en: "Mission director, INSAT-2E", ta: "பணி இயக்குனர், இன்சாட்-2E" },
  },
  {
    period: "2000 – 2010",
    era: "isro",
    title: { en: "Mission director, INSAT-3B", ta: "பணி இயக்குனர், இன்சாட்-3B" },
  },
  {
    period: "2001 – 2002",
    era: "isro",
    title: { en: "Mission director, GSAT-1", ta: "பணி இயக்குனர், ஜிசாட்-1" },
  },
  {
    period: "2003 – 2011",
    era: "isro",
    title: { en: "Mission director, INSAT-3E", ta: "பணி இயக்குனர், இன்சாட்-3E" },
  },
  {
    period: "2003 – 2005",
    era: "isro",
    title: {
      en: "Associate project director, EDUSAT",
      ta: "இணை திட்ட இயக்குனர், எடுசாட்",
    },
  },
  {
    period: "2004 – 2009",
    era: "isro",
    major: true,
    title: {
      en: "Project director, Chandrayaan-1",
      ta: "திட்ட இயக்குனர், சந்திரயான்-1",
    },
  },
  {
    period: "2008 – 2013",
    era: "isro",
    major: true,
    title: {
      en: "Project director, Chandrayaan-2",
      ta: "திட்ட இயக்குனர், சந்திரயான்-2",
    },
  },
  {
    period: "2011 – 2015",
    era: "leadership",
    title: {
      en: "Programme director, IRS & SSS (Indian Remote Sensing & Small, Science and Student Satellites)",
      ta: "திட்ட இயக்குனர், ஐஆர்எஸ் & எஸ்எஸ்எஸ் (இந்திய ரிமோட் சென்சிங் & சிறிய, அறிவியல் மற்றும் மாணவர் செயற்கைக்கோள்கள்)",
    },
  },
  {
    period: "2015 – 2018",
    era: "leadership",
    major: true,
    title: {
      en: "Director, ISRO Satellite Centre, Bangalore",
      ta: "இயக்குனர், இஸ்ரோ செயற்கைக்கோள் மையம், பெங்களூரு",
    },
  },
  {
    period: "2019 – 2023",
    era: "beyond",
    title: {
      en: "Vice president, Tamil Nadu State Council for Science and Technology",
      ta: "தமிழ்நாடு மாநில அறிவியல் மற்றும் தொழில்நுட்ப கவுன்சிலில் துணைத் தலைவராகப் பொறுப்பேற்றார்",
    },
  },
  {
    period: "2019 – 2023",
    era: "beyond",
    title: {
      en: "Chairman, board of governors, National Research and Design Forum",
      ta: "தலைவர், கவர்னர் குழு, தேசிய ஆராய்ச்சி மற்றும் வடிவமைப்பு மன்றம்",
    },
  },
  {
    period: "2021 – 2024",
    era: "beyond",
    title: {
      en: "Principal Advisor, Tathya Earth, Mumbai",
      ta: "முதன்மை ஆலோசகர், தத்யா எர்த், மும்பை",
    },
  },
  {
    period: "2021 – 2024",
    era: "beyond",
    title: {
      en: "Senior Advisor, Gencrest India Pvt Ltd, Mumbai",
      ta: "மூத்த ஆலோசகர், ஜென்க்ரெஸ்ட் இந்தியா பி.லிமிடெட், மும்பை",
    },
  },
  {
    period: "2022 –",
    era: "beyond",
    title: {
      en: "Patron, Edutec4 Space, Dubai",
      ta: "ஆதரவாளர், எடுடெக்ஃபோர்ஸ்பேஸ், துபாய்",
    },
  },
  {
    period: "2022 –",
    era: "beyond",
    title: {
      en: "Senior Advisor, Space Zone India, Chennai",
      ta: "மூத்த ஆலோசகர், ஸ்பேஸ் ஸோன் இந்தியா, சென்னை",
    },
  },
  {
    period: "2023 –",
    era: "beyond",
    title: {
      en: "Member, American India Foundation Trust, New Delhi",
      ta: "உறுப்பினர், அமெரிக்க-இந்திய பௌண்டேசன் டிரஸ்ட், புது டில்லி",
    },
  },
  {
    period: "2023 –",
    era: "beyond",
    title: {
      en: "Director, Board of SSI Innovations Pvt Ltd, New Delhi",
      ta: "இயக்குனர், எஸ்.எஸ்.ஐ இன்னோவேசன்ஸ் பி.லிமிடெட், புது டில்லி",
    },
  },
  {
    period: "2023 –",
    era: "beyond",
    title: { en: "Director, SS Innovations International Inc, Florida USA" },
  },
  {
    period: "2023 – 2026",
    era: "beyond",
    title: { en: "Advisor, Dhaksha Unmanned Systems, Chennai" },
  },
  {
    period: "2024 –",
    era: "beyond",
    title: {
      en: "Executive President, Senior Citizens Support Forum, Chennai",
    },
  },
  {
    period: "2025 –",
    era: "beyond",
    title: { en: "Chairman, HONC Gas Pte Ltd, Singapore" },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: { en: "Member, Governing Council, GM University, Davangere" },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: {
      en: "Chairman, Sectoral Innovation Programs, Bangalore Bio-Innovation Centre",
    },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: { en: "Chief Scientist, Cosmochute, Ahmedabad, India" },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: { en: "Senior Advisor, XAGROTOR Pvt Ltd, Chennai, India" },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: {
      en: "Principal Advisor, Big Bang Boom Solutions (BBBS) Pvt Ltd, Chennai, India",
    },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: {
      en: "Independent Director, Board of Kaynes Technology India Limited",
    },
  },
  {
    period: "2026 –",
    era: "beyond",
    title: {
      en: "Chairman, School Curriculum Design Committee, Tamil Nadu",
    },
  },
];
