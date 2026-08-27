import type { L } from "@/lib/i18n";

export type Mission = {
  id: string;
  name: L;
  sub: L;
  role: L;
  years: string;
  body: "moon" | "mars" | "earth";
  blurb: L;
  facts: { k: L; v: L }[];
  image?: string;
};

export const missions: Mission[] = [
  {
    id: "chandrayaan-1",
    name: { en: "Chandrayaan-1", ta: "சந்திரயான்-1" },
    sub: { en: "India's first mission to the Moon", ta: "இந்தியாவின் முதல் நிலவுப் பயணம்" },
    role: { en: "Project Director", ta: "திட்ட இயக்குனர்" },
    years: "2004 – 2009",
    body: "moon",
    blurb: {
      en: "He led the team that designed and developed a lunar orbiter and impactor carrying instrumentation from ISRO, NASA, ESA and Bulgaria to map the Moon's chemistry, mineralogy, resources and topography. Launched 22 October 2008, it entered lunar orbit on 8 November 2008 — and went on to confirm the presence of water molecules on the Moon.",
      ta: "இஸ்ரோ, நாசா, ஈஎஸ்ஏ மற்றும் பல்கேரியாவின் கருவிகளைச் சுமந்து சென்ற நிலவு சுற்றுவட்டப் பயணி மற்றும் மோதுகலனை வடிவமைத்து உருவாக்கிய குழுவை அவர் வழிநடத்தினார். 22 அக்டோபர் 2008 அன்று ஏவப்பட்டு, 8 நவம்பர் 2008 அன்று நிலவின் சுற்றுப்பாதையை அடைந்தது — நிலவில் நீர் மூலக்கூறுகள் இருப்பதை உறுதிப்படுத்தியது.",
    },
    facts: [
      { k: { en: "Launched", ta: "ஏவப்பட்டது" }, v: { en: "22 Oct 2008" } },
      { k: { en: "Lunar orbit", ta: "நிலவு சுற்றுப்பாதை" }, v: { en: "8 Nov 2008" } },
      {
        k: { en: "Landmark", ta: "மைல்கல்" },
        v: { en: "Discovery of water on the Moon", ta: "நிலவில் நீர் கண்டுபிடிப்பு" },
      },
      {
        k: { en: "Partners", ta: "கூட்டாளிகள்" },
        v: { en: "NASA · ESA · Bulgaria" },
      },
    ],
    image: "/img/isro/launchpad.jpg",
  },
  {
    id: "mangalyaan",
    name: { en: "Mangalyaan", ta: "மங்கள்யான்" },
    sub: {
      en: "Mars Orbiter Mission — first attempt, first success",
      ta: "செவ்வாய் சுற்றுவட்டப் பயணம் — முதல் முயற்சி, முதல் வெற்றி",
    },
    role: { en: "Programme Director", ta: "திட்ட இயக்குனர்" },
    years: "2013 – 2014",
    body: "mars",
    blurb: {
      en: "India became the first nation in the world to reach Mars orbit on its maiden attempt, and the first in Asia to reach Mars at all. Launched 5 November 2013, the orbiter travelled some 670 million kilometres over 300 days and arrived on 24 September 2014 — at roughly $74 million, the most cost-effective mission ever sent to the planet by any country.",
      ta: "முதல் முயற்சியிலேயே செவ்வாய் சுற்றுப்பாதையை அடைந்த உலகின் முதல் நாடாகவும், செவ்வாயை அடைந்த ஆசியாவின் முதல் நாடாகவும் இந்தியா ஆனது. 5 நவம்பர் 2013 அன்று ஏவப்பட்டு, 300 நாட்களில் சுமார் 67 கோடி கிலோமீட்டர் பயணித்து 24 செப்டம்பர் 2014 அன்று சென்றடைந்தது — சுமார் 74 மில்லியன் டாலர் செலவில், எந்த நாடும் செவ்வாய்க்கு அனுப்பிய மிகச் சிக்கனமான பயணம்.",
    },
    facts: [
      { k: { en: "Launched", ta: "ஏவப்பட்டது" }, v: { en: "5 Nov 2013" } },
      { k: { en: "Mars orbit", ta: "செவ்வாய் சுற்றுப்பாதை" }, v: { en: "24 Sep 2014" } },
      { k: { en: "Distance", ta: "தூரம்" }, v: { en: "~670 million km" } },
      { k: { en: "Cost", ta: "செலவு" }, v: { en: "~$74 million" } },
    ],
    image: "/img/isro/isro1.jpg",
  },
  {
    id: "chandrayaan-2",
    name: { en: "Chandrayaan-2", ta: "சந்திரயான்-2" },
    sub: {
      en: "The follow-up lunar mission",
      ta: "அடுத்தகட்ட நிலவுப் பயணம்",
    },
    role: { en: "Project Director", ta: "திட்ட இயக்குனர்" },
    years: "2008 – 2013",
    body: "moon",
    blurb: {
      en: "As project director he shaped the architecture of India's second lunar mission — an orbiter, lander and rover intended to carry the Chandrayaan programme from remote sensing all the way down to the lunar surface.",
      ta: "திட்ட இயக்குனராக, இந்தியாவின் இரண்டாவது நிலவுப் பயணத்தின் கட்டமைப்பை அவர் வடிவமைத்தார் — சந்திரயான் திட்டத்தை தொலையுணர்விலிருந்து நிலவின் மேற்பரப்பு வரை கொண்டு செல்லும் நோக்கில் ஒரு சுற்றுவட்டப் பயணி, தரையிறங்கி மற்றும் ஊர்தி.",
    },
    facts: [
      { k: { en: "Role", ta: "பொறுப்பு" }, v: { en: "Project Director", ta: "திட்ட இயக்குனர்" } },
      { k: { en: "Scope", ta: "நோக்கம்" }, v: { en: "Orbiter · Lander · Rover" } },
    ],
    image: "/img/isro/isro3.jpg",
  },
  {
    id: "insat-irs",
    name: { en: "INSAT · IRS · GSAT", ta: "இன்சாட் · ஐஆர்எஸ் · ஜிசாட்" },
    sub: {
      en: "Three decades of India's working satellites",
      ta: "இந்தியாவின் செயல்பாட்டு செயற்கைக்கோள்களின் மூன்று தசாப்தங்கள்",
    },
    role: { en: "Mission & Programme Director", ta: "பணி மற்றும் திட்ட இயக்குனர்" },
    years: "1988 – 2015",
    body: "earth",
    blurb: {
      en: "Long before the Moon, there were the satellites that quietly run a country. He was spacecraft operations manager for IRS-1A and INSAT-2A, mission director for INSAT-2C, 2D, 2E, 3B, 3E and GSAT-1, associate project director for EDUSAT, and programme director for the Indian Remote Sensing and Small, Science and Student Satellites — contributing to more than 60 Indian satellites in all.",
      ta: "நிலவுக்கு நீண்ட காலத்திற்கு முன்பே, ஒரு நாட்டை அமைதியாக இயக்கும் செயற்கைக்கோள்கள் இருந்தன. ஐஆர்எஸ்-1A மற்றும் இன்சாட்-2A விண்கல இயக்க மேலாளராகவும், இன்சாட்-2C, 2D, 2E, 3B, 3E மற்றும் ஜிசாட்-1 பணி இயக்குனராகவும், எடுசாட் இணை திட்ட இயக்குனராகவும், ஐஆர்எஸ் மற்றும் எஸ்எஸ்எஸ் திட்ட இயக்குனராகவும் பணியாற்றி — மொத்தம் 60க்கும் மேற்பட்ட இந்திய செயற்கைக்கோள்களுக்குப் பங்களித்தார்.",
    },
    facts: [
      { k: { en: "Satellites", ta: "செயற்கைக்கோள்கள்" }, v: { en: "60+" } },
      { k: { en: "Span", ta: "காலம்" }, v: { en: "1988 – 2015" } },
    ],
    image: "/img/isro/isro2.jpg",
  },
];

export const books: { title: L; note: L; image?: string }[] = [
  {
    title: { en: "Kaiyaruke Nila", ta: "கையருகே நிலா" },
    note: {
      en: "Winner, C. Pa. Adithanar Literary Award, 2013",
      ta: "சி. ப. ஆதித்தனார் இலக்கிய விருது, 2013",
    },
    image: "/img/books/kaiyaruke-nila.jpg",
  },
  {
    title: { en: "Siragai Virikkum Mangalyaan", ta: "சிறகை விரிக்கும் மங்கள்யான்" },
    note: {
      en: "Translated into Kannada",
      ta: "கன்னடத்தில் மொழிபெயர்க்கப்பட்டது",
    },
    image: "/img/books/mangalyaan.jpg",
  },
  {
    title: { en: "Valarum Ariviyal", ta: "வளரும் அறிவியல்" },
    note: {
      en: "Winner, Manavai Mustafa Memorial Science Award, 2021",
      ta: "மனவை முஸ்தபா நினைவு அறிவியல் விருது, 2021",
    },
    image: "/img/books/valarum-ariviyal.jpg",
  },
  {
    title: { en: "Ariviyal Kalanjiyam", ta: "அறிவியல் களஞ்சியம்" },
    note: { en: "Science encyclopaedia in Tamil", ta: "தமிழில் அறிவியல் கலைக்களஞ்சியம்" },
    image: "/img/books/kalanjiyam.jpg",
  },
  { title: { en: "Vinnum Mannum", ta: "விண்ணும் மண்ணும்" }, note: { en: "On sky and soil", ta: "விண்ணையும் மண்ணையும் பற்றி" } },
  { title: { en: "India-75", ta: "இந்தியா-75" }, note: { en: "On seventy-five years of India", ta: "இந்தியாவின் எழுபத்தைந்து ஆண்டுகள்" } },
  { title: { en: "Periyarum Ariviyalum", ta: "பெரியாரும் அறிவியலும்" }, note: { en: "Periyar and science", ta: "பெரியாரும் அறிவியலும்" } },
  { title: { en: "Ariviyalum Maanudamum", ta: "அறிவியலும் மானுடமும்" }, note: { en: "Science and humanity", ta: "அறிவியலும் மனிதகுலமும்" } },
];
