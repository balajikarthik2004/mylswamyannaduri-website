import type { L } from "@/lib/i18n";

export type AwardCategory =
  | "government"
  | "academia"
  | "isro"
  | "professional"
  | "public";

export type Award = {
  title: string;
  by?: string;
  year?: string;
  category: AwardCategory;
  /** Marquee awards surfaced on the home page. */
  featured?: boolean;
};

export const awardCategories: { id: AwardCategory; label: L; note: L }[] = [
  {
    id: "government",
    label: { en: "Government", ta: "அரசு விருதுகள்" },
    note: { en: "Awards from government", ta: "அரசிடமிருந்து பெற்ற விருதுகள்" },
  },
  {
    id: "academia",
    label: { en: "Universities & Academia", ta: "பல்கலைக்கழகங்கள்" },
    note: {
      en: "Awards from universities and academia",
      ta: "பல்கலைக்கழகங்கள் மற்றும் கல்வி நிறுவனங்களிடமிருந்து",
    },
  },
  {
    id: "isro",
    label: { en: "ISRO", ta: "இஸ்ரோ" },
    note: { en: "Awards from ISRO", ta: "இஸ்ரோவிடமிருந்து பெற்ற விருதுகள்" },
  },
  {
    id: "professional",
    label: { en: "Professional Bodies", ta: "தொழில்முறை அமைப்புகள்" },
    note: {
      en: "National and international awards from professional bodies",
      ta: "தொழில்முறை அமைப்புகளிடமிருந்து தேசிய மற்றும் சர்வதேச விருதுகள்",
    },
  },
  {
    id: "public",
    label: { en: "Social & Public Forums", ta: "சமூக மற்றும் பொது அமைப்புகள்" },
    note: {
      en: "Awards from social and public forums",
      ta: "சமூக மற்றும் பொது அமைப்புகளிடமிருந்து",
    },
  },
];

export const awards: Award[] = [
  // ── Government ───────────────────────────────────────────────
  {
    title: "Padma Shri",
    by: "Government of India",
    year: "2016",
    category: "government",
    featured: true,
  },
  {
    title: "Rajyotsava Prashasti",
    by: "Government of Karnataka",
    year: "2008",
    category: "government",
  },
  {
    title:
      "Citation, cash prize of ₹25 lakhs and a scholarship instituted in his name for government school students to pursue higher studies",
    by: "Government of Tamil Nadu",
    year: "2023",
    category: "government",
    featured: true,
  },

  // ── Universities & academia ──────────────────────────────────
  {
    title: "Doctor of Science, DSc (Honoris Causa)",
    by: "MGR University, Chennai",
    year: "2008",
    category: "academia",
  },
  {
    title: "Doctor of Science, DSc (Honoris Causa)",
    by: "Anna University, Chennai",
    year: "2009",
    category: "academia",
    featured: true,
  },
  {
    title: "Doctor of Science, DSc (Honoris Causa)",
    by: "University of Madras, Chennai",
    year: "2009",
    category: "academia",
  },
  {
    title: "Doctor of Science, DSc (Honoris Causa)",
    by: "Pondicherry University",
    year: "2009",
    category: "academia",
  },
  {
    title: "Eminent Scientist Award",
    by: "76th Indian Science Congress — Madurai Kamaraj University Endowment",
    category: "academia",
  },
  {
    title: "Distinguished Alumni Award",
    by: "PSG College of Technology",
    year: "2009",
    category: "academia",
  },
  {
    title: "Sir CV Raman Award",
    by: "Periyar University, Salem",
    year: "2010",
    category: "academia",
  },
  {
    title: "Jewel of GCT",
    by: "Government College of Technology, Coimbatore — GCT Alumni",
    category: "academia",
  },
  {
    title: "Personality of the Year",
    by: "St. John's International School, Chennai",
    category: "academia",
  },
  {
    title: "Hikal Chemcon Distinguished Speaker Award",
    by: "63rd Annual Session of Indian Institute of Chemical Engineers, Annamalai University",
    year: "2010",
    category: "academia",
  },
  {
    title: "National Science and Technology Award",
    by: "Sathyabama University, Chennai",
    year: "2011",
    category: "academia",
  },
  {
    title: "Distinguished Scientist Award, Diamond Jubilee Award",
    by: "KC College, Mumbai",
    category: "academia",
  },
  {
    title: "Drona Award",
    by: "PARK Group of Institutions' Golden Jubilee",
    year: "2023",
    category: "academia",
  },
  {
    title: "Proud of Nation Award",
    by: "Mohammed Sathak Group of Institutions' Golden Jubilee",
    year: "2023",
    category: "academia",
  },
  {
    title: "Lifetime Achievement Award in the field of Space Science",
    by: "Weekend Leader online portal and Ethiraj College, Chennai",
    year: "2024",
    category: "academia",
  },

  // ── ISRO ─────────────────────────────────────────────────────
  {
    title:
      "Hariom Ashram Prerit Vikram Sarabhai Research Award, for outstanding contributions to systems analysis and space systems management",
    by: "ISRO",
    year: "2004",
    category: "isro",
    featured: true,
  },
  {
    title: "Citation for contribution to INSAT systems mission management",
    by: "ISRO",
    year: "2003",
    category: "isro",
  },
  {
    title: "Team Excellence Award, for contribution to the Indian Space Programme",
    by: "ISRO",
    year: "2007",
    category: "isro",
  },
  { title: "ISRO Merit Award", by: "ISRO", year: "2009", category: "isro" },
  {
    title: "Team Excellence Award, as team leader of the Chandrayaan-1 team",
    by: "ISRO",
    year: "2010",
    category: "isro",
    featured: true,
  },
  {
    title: "ISRO Outstanding Achievement Award",
    by: "ISRO",
    year: "2014",
    category: "isro",
  },

  // ── Professional bodies ──────────────────────────────────────
  {
    title: "Laurels for Team Achievement — Chandrayaan-1",
    by: "International Academy of Astronautics, Beijing, China",
    year: "2013",
    category: "professional",
    featured: true,
  },
  {
    title: "Certificate of Appreciation",
    by: "Boeing Asian-American Professional Association, Houston, USA",
    category: "professional",
  },
  {
    title: "Space Systems Award",
    by: "American Institute of Aeronautics and Astronautics, USA",
    year: "2009",
    category: "professional",
    featured: true,
  },
  {
    title:
      "National Aeronautical Award, in recognition of his contributions in the field of satellites and spacecraft",
    by: "Aeronautical Society of India",
    year: "2008",
    category: "professional",
  },
  {
    title: "Fellow",
    by: "International Academy of Astronautics",
    category: "professional",
  },
  {
    title: "Fellow (FIE)",
    by: "Institution of Engineers, India",
    category: "professional",
  },
  {
    title: "Fellow (IETE)",
    by: "Institution of Electronics and Telecommunication Engineering, India",
    category: "professional",
  },
  {
    title: "Fellow",
    by: "Indian Society for Remote Sensing (ISRS)",
    category: "professional",
  },
  {
    title: "Fellow",
    by: "Society for Shock Wave Research, Dept. of Aerospace Engineering, Indian Institute of Science, Bangalore",
    category: "professional",
  },
  {
    title: "Fellow",
    by: "Chennai Science Academy (formerly Tamil Nadu Science Academy)",
    category: "professional",
  },
  {
    title: "NIQR Bajaj Award for Outstanding Quality Man",
    year: "2009",
    category: "professional",
  },
  {
    title: "H K Firodia Award for Science and Technology",
    year: "2009",
    category: "professional",
  },
  {
    title:
      "IEI-IEEE Engineering Excellence Award, for contributions and leadership in space technology in service of humanity",
    year: "2016",
    category: "professional",
  },
  {
    title: "BHASKARA Award, for outstanding scientific leadership",
    year: "2016",
    category: "professional",
  },
  {
    title:
      "SIES Sri Chandrasekharendra Saraswati National Eminence Award for Science and Technology",
    by: "South Indian Education Society",
    year: "2009",
    category: "professional",
  },
  {
    title: "Lifetime Contribution Award",
    by: "AISYWC-18",
    category: "professional",
  },
  {
    title: "Listed in the TNIE-Uninor Achiever of the Year",
    year: "2009",
    category: "professional",
  },
  {
    title: "Listed in the Dinamalar-Uninor Achiever of the Year",
    year: "2009",
    category: "professional",
  },
  {
    title: "Pearl Ratna",
    by: "Pearl Education Foundation",
    year: "2020",
    category: "professional",
  },
  {
    title:
      "Best Conference Paper in Innovations and Entrepreneurship, Annual International Conference — with US$500 cash prize and award plaque",
    by: "Industry Studies Association, USA",
    year: "2021",
    category: "professional",
  },
  {
    title: "Dr APJ Abdul Kalam Memorial Science and Technology Achievement Award",
    by: "Indian Science Forum, Oman, at National University for Science and Technology, Oman",
    year: "2023",
    category: "professional",
  },
  {
    title: "Iconic Personality of Space Technology",
    by: "5th Edition of Iconic Brands, Mumbai",
    year: "2023",
    category: "professional",
  },
  {
    title:
      "Lifetime Achievement Award, in recognition of pioneering contributions to space exploration and research",
    by: "University of California Los Angeles (UCLA)",
    year: "2024",
    category: "professional",
    featured: true,
  },
  {
    title:
      "Award of Commendation for outstanding contributions to the field of space science and technology",
    by: "Franklin Township Council, Somerset County, State of New Jersey",
    year: "2024",
    category: "professional",
  },

  // ── Social & public forums ───────────────────────────────────
  {
    title: "Vivekananda Award for Human Excellence",
    by: "Ramakrishna Mission",
    category: "public",
  },
  {
    title: "Kongu Achiever Award",
    by: "NIA Trust, Pollachi",
    year: "2009",
    category: "public",
  },
  {
    title: "Best Tamil Scientist Award, Makkal Viruthu",
    by: "Makkal TV",
    year: "2009",
    category: "public",
  },
  {
    title: "Amara Bharathi National Eminence Award for Science and Technology",
    year: "2010",
    category: "public",
  },
  {
    title: "Karmaveerar Kamaraj Award",
    by: "Chennai Mahajana Sabha",
    year: "2010",
    category: "public",
  },
  {
    title: "Dr Rajah Sir Muthiah Chettiar Birthday Commemoration Award",
    year: "2012",
    category: "public",
  },
  {
    title: "Listed among 100 Global Thinkers, and topped the innovators list",
    year: "2014",
    category: "public",
    featured: true,
  },
  {
    title: "Lifetime Achievement Award",
    by: "SRV Schools, Trichy",
    year: "2015",
    category: "public",
  },
  {
    title: "Tamilan Award for Science and Technology",
    by: "Puthiya Thalaimurai TV",
    year: "2016",
    category: "public",
  },
  {
    title: "Global Indian for Science",
    by: "ICICI and Times Group",
    year: "2017",
    category: "public",
  },
  {
    title: "Life Time Achievement Award in the field of science and technology",
    by: "Union Bank of India",
    category: "public",
  },
  { title: "C. Pa. Adithanar Literary Award", year: "2013", category: "public" },
  {
    title: "Poorna Chandra Award",
    by: "Rotary Club, Coimbatore",
    category: "public",
  },
  {
    title: "Tamil Ma-mani Award",
    by: "Tirupur Tamil Sangam",
    category: "public",
  },
  {
    title: "Tamil Achiever Award",
    by: "Bharathi Tamil Sangam, Kolkata",
    year: "2011",
    category: "public",
  },
  { title: "Example to Youth Award", category: "public" },
  {
    title: "Kalingarayar Award",
    by: "Kongu Charitable Trust, Tamil Nadu",
    year: "2016",
    category: "public",
  },
  {
    title: "Citizen Extraordinary Award",
    by: "Rotary Club Bangalore",
    year: "2014",
    category: "public",
  },
  {
    title: "Lifetime Achievement — Muthamizh Award",
    by: "Muthamizh Peravai",
    year: "2018",
    category: "public",
  },
  {
    title: "“Mars Man”",
    by: "Front Liners, Kuwait",
    year: "2018",
    category: "public",
  },
  {
    title: "Lifetime Achievement Award",
    by: "Rotary International Pollachi",
    year: "2019",
    category: "public",
  },
  {
    title: "Life Time Achievement Award",
    by: "Govt Higher Secondary School Alumni, Velandampalayam, Tamil Nadu",
    year: "2019",
    category: "public",
  },
  {
    title: "Mahatma Gandhi Award",
    by: "Gandhi World Foundation",
    year: "2019",
    category: "public",
  },
  {
    title: "Lifetime Achievement Award",
    by: "Muscat Tamil Sangam",
    year: "2019",
    category: "public",
  },
  {
    title: "Sri Adhi Sankara Award",
    by: "Shri Adhi Sankara Peravai",
    year: "2019",
    category: "public",
  },
  { title: "Sony YAY Award", year: "2020", category: "public" },
  {
    title: "Senthamiz Award",
    by: "Gandhi World Peace Foundation",
    year: "2021",
    category: "public",
  },
  {
    title: "Manavai Mustafa Memorial Award for Science",
    year: "2021",
    category: "public",
  },
  {
    title:
      "Outstanding Personality Award, for his significant contribution to India's space research and to ISRO",
    by: "Shree Hariharaputra Bhajan Samaj, Mumbai",
    year: "2024",
    category: "public",
  },
  {
    title: "Pride of Tamil Nadu — Icon of Scientific Excellence",
    by: "Galatta Media",
    year: "2025",
    category: "public",
    featured: true,
  },
];

export const featuredAwards = awards.filter((a) => a.featured);
