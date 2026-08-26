import type { L } from "@/lib/i18n";

export type GalleryCategory =
  | "albums"
  | "isro"
  | "leaders"
  | "students"
  | "school"
  | "family"
  | "abroad"
  | "books";

export type Photo = {
  src: string;
  category: GalleryCategory;
  caption: L;
  /** Wide album spreads are laid out differently from portrait snapshots. */
  wide?: boolean;
};

export const galleryCategories: { id: GalleryCategory; label: L }[] = [
  { id: "albums", label: { en: "Album spreads", ta: "ஆல்பம் பக்கங்கள்" } },
  { id: "isro", label: { en: "At ISRO", ta: "இஸ்ரோவில்" } },
  { id: "leaders", label: { en: "Public functions", ta: "பொது நிகழ்ச்சிகள்" } },
  { id: "students", label: { en: "With students", ta: "மாணவர்களுடன்" } },
  { id: "school", label: { en: "School & college", ta: "பள்ளி & கல்லூரி" } },
  { id: "family", label: { en: "With family", ta: "குடும்பத்துடன்" } },
  { id: "abroad", label: { en: "Abroad", ta: "வெளிநாட்டில்" } },
  { id: "books", label: { en: "Books", ta: "நூல்கள்" } },
];

const albumNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 18, 19, 20, 21, 22, 23, 29];

export const photos: Photo[] = [
  ...albumNumbers.map<Photo>((n) => ({
    src: `/img/albums/a${n}.jpg`,
    category: "albums",
    wide: true,
    caption: { en: `Album spread ${n}`, ta: `ஆல்பம் பக்கம் ${n}` },
  })),

  {
    src: "/img/isro/launchpad.jpg",
    category: "isro",
    caption: { en: "At the launchpad, SDSC SHAR", ta: "ஏவுதளத்தில், SDSC SHAR" },
  },
  {
    src: "/img/isro/isro1.jpg",
    category: "isro",
    caption: { en: "At ISRO", ta: "இஸ்ரோவில்" },
  },
  {
    src: "/img/isro/isro2.jpg",
    category: "isro",
    caption: { en: "At ISRO", ta: "இஸ்ரோவில்" },
  },
  {
    src: "/img/isro/isro3.jpg",
    category: "isro",
    caption: { en: "At ISRO", ta: "இஸ்ரோவில்" },
  },
  {
    src: "/img/isro/paddyfield.jpg",
    category: "isro",
    caption: {
      en: "In the paddy field — where it began",
      ta: "நெல் வயலில் — எங்கு தொடங்கியது",
    },
  },

  {
    src: "/img/functions/thiruvalluvar.jpg",
    category: "leaders",
    caption: { en: "At a public function", ta: "பொது நிகழ்ச்சியில்" },
  },
  {
    src: "/img/functions/fn22.jpg",
    category: "leaders",
    caption: { en: "At a public function", ta: "பொது நிகழ்ச்சியில்" },
  },

  ...["s1", "s2", "s3", "s5"].map<Photo>((f) => ({
    src: `/img/students/${f}.jpg`,
    category: "students",
    caption: { en: "With students", ta: "மாணவர்களுடன்" },
  })),

  {
    src: "/img/school/school.jpg",
    category: "school",
    caption: { en: "School photograph", ta: "பள்ளிப் புகைப்படம்" },
  },
  {
    src: "/img/school/gct-coimbatore.jpg",
    category: "school",
    caption: {
      en: "College at GCT, Coimbatore",
      ta: "அரசு தொழில்நுட்பக் கல்லூரி, கோயம்புத்தூர்",
    },
  },
  {
    src: "/img/school/joining-isro-1982.jpg",
    category: "school",
    caption: { en: "While joining ISRO, 1982", ta: "இஸ்ரோவில் சேர்ந்தபோது, 1982" },
  },
  {
    src: "/img/school/mani-babu.jpg",
    category: "school",
    caption: { en: "With Mani and Babu", ta: "மணி மற்றும் பாபுவுடன்" },
  },

  ...["f1", "f2", "f3", "f4"].map<Photo>((f) => ({
    src: `/img/family/${f}.jpg`,
    category: "family",
    caption: { en: "With family", ta: "குடும்பத்துடன்" },
  })),

  {
    src: "/img/abroad/hongkong.jpg",
    category: "abroad",
    caption: { en: "At Hong Kong University", ta: "ஹாங்காங் பல்கலைக்கழகத்தில்" },
  },
  {
    src: "/img/abroad/iv1.jpg",
    category: "abroad",
    caption: { en: "International visit", ta: "சர்வதேசப் பயணம்" },
  },

  {
    src: "/img/books/kaiyaruke-nila.jpg",
    category: "books",
    caption: { en: "Kaiyaruke Nila", ta: "கையருகே நிலா" },
  },
  {
    src: "/img/books/mangalyaan.jpg",
    category: "books",
    caption: { en: "Siragai Virikkum Mangalyaan", ta: "சிறகை விரிக்கும் மங்கள்யான்" },
  },
  {
    src: "/img/books/valarum-ariviyal.jpg",
    category: "books",
    caption: { en: "Valarum Ariviyal", ta: "வளரும் அறிவியல்" },
  },
  {
    src: "/img/books/kalanjiyam.jpg",
    category: "books",
    caption: { en: "Ariviyal Kalanjiyam", ta: "அறிவியல் களஞ்சியம்" },
  },
];

/** Talks and features from his official YouTube channel. */
export const videos = [
  "pzK5x9yppEw",
  "_bUxngUoYHA",
  "3D4wzl15tko",
  "L4Ghbw8HAGE",
  "BHmXYFcRUfc",
  "FCkQ5y7UM3s",
  "JOuEkV_BHLQ",
  "ZIgCUfFAWNo",
  "GofpnECChME",
];
