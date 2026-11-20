/**
 * Вторая волна контента: площадки и фестивали для стран и городов,
 * которые в первой волне были представлены только описанием.
 * Правила те же: нет уверенности — поле пустое и помечено «уточняется».
 */
import type { City, Festival, Venue, Coordinates } from "@/lib/types";
import { t, sec, wiki } from "./helpers";

const cityPt = (lat: number, lng: number): Coordinates => ({ lat, lng, precision: "city" });
const near = (lat: number, lng: number): Coordinates => ({ lat, lng, precision: "approximate" });
const addr = (lat: number, lng: number): Coordinates => ({ lat, lng, precision: "address" });
const base = { verification: "unverified" as const, checkedAt: null, genres: [] as string[] };

export const citiesWave2: City[] = [
  { ...base, slug: "copenhagen", country: "denmark", capital: false, name: t("Копенгаген", "Copenhagen"), aliases: ["copenhagen", "københavn", "kobenhavn"], coords: cityPt(55.6761, 12.5683),
    summary: t("Столица Дании и город уличного фестиваля Distortion; в 2020-х — один из центров быстрой хард-техно-сцены.", "Danish capital and home of the Distortion street festival."),
    genres: ["techno", "hard-techno"], sources: [wiki("Copenhagen")] },
  { ...base, slug: "plock", country: "poland", capital: false, name: t("Плоцк", "Płock"), aliases: ["plock", "płock"], coords: cityPt(52.5468, 19.7064),
    summary: t("Город на Висле, где на речном пляже проходит фестиваль Audioriver.", "Vistula city hosting Audioriver on its river beach."), sources: [wiki("Płock")] },
  { ...base, slug: "offenbach", country: "germany", capital: false, name: t("Оффенбах-на-Майне", "Offenbach am Main"), aliases: ["offenbach"], coords: cityPt(50.1055, 8.7623),
    summary: t("Город по соседству с Франкфуртом, где на берегу Майна работает клуб Robert Johnson.", "Next to Frankfurt; home of the Robert Johnson club."), sources: [wiki("Offenbach_am_Main")] },
  { ...base, slug: "itajai", country: "brazil", capital: false, name: t("Итажаи", "Itajaí"), aliases: ["itajai", "itajaí", "praia brava"], coords: cityPt(-26.9101, -48.6705),
    summary: t("Город на побережье штата Санта-Катарина; на пляже Прайя-Брава находится Warung Beach Club.", "Santa Catarina coastal city; Warung Beach Club is at Praia Brava."), sources: [wiki("Itajaí")] },
  { ...base, slug: "jakarta", country: "indonesia", capital: false, name: t("Джакарта", "Jakarta"), aliases: ["jakarta", "джакарта"], coords: cityPt(-6.2088, 106.8456),
    summary: t("Столица Индонезии, где с 2008 года проводился Djakarta Warehouse Project.", "Indonesia's capital, where Djakarta Warehouse Project began in 2008."), sources: [wiki("Jakarta")] },
];

const v = (x: Omit<Venue, "checkedAt" | "residents" | "capacity" | "website" | "legendary" | "kind" | "verification"> & Partial<Venue>): Venue => ({
  checkedAt: null, residents: [], capacity: null, website: null, legendary: false, kind: "club",
  verification: x.status === "historical" || x.status === "closed" ? "historical" : "unverified", ...x,
});

export const venuesWave2: Venue[] = [
  v({ slug: "robert-johnson", name: t("Robert Johnson"), aliases: ["robert johnson", "rj offenbach"], city: "offenbach",
    address: "Nordring 131, 63067 Offenbach am Main", coords: near(50.1076, 8.7547), openedYear: 1999, closedYear: null, status: "active", legendary: true,
    summary: t("Небольшой клуб на берегу Майна, открытый в 1999 году. Известен звуком, видом на реку и связью с франкфуртской house- и техно-сценой; при клубе работает лейбл Live at Robert Johnson.", "A small riverside club opened in 1999, known for its sound and its label."),
    genres: ["house", "techno"], sources: [wiki("Robert_Johnson_(club)")] }),
  v({ slug: "de-school", name: t("De School"), aliases: ["de school", "school amsterdam"], city: "amsterdam",
    address: "Dr. Jan van Breemenstraat 1, Amsterdam", coords: near(52.3746, 4.8317), openedYear: 2016, closedYear: 2024, status: "closed",
    summary: t("Клуб и культурный центр в бывшем здании технической школы в Амстердам-Вест с круглосуточной лицензией. Закрылся в начале 2024 года.", "Club in a former technical school with a 24-hour licence; closed in early 2024."),
    genres: ["techno", "house"], sources: [wiki("De_School")] }),
  v({ slug: "plastic-people", name: t("Plastic People"), aliases: ["plastic people"], city: "london",
    address: "147–149 Curtain Road, Shoreditch, London", coords: near(51.5263, -0.0806), openedYear: null, closedYear: 2015, status: "closed", legendary: true,
    summary: t("Маленький клуб в Шордиче с эталонной звуковой системой. Здесь проходили вечеринки FWD>>, сыгравшие ключевую роль в рождении дабстепа. Закрылся в 2015 году; год открытия уточняется.", "Small Shoreditch club; home of FWD>>, crucial to dubstep. Closed in 2015."),
    genres: ["dubstep", "uk-garage", "house"], sources: [wiki("Plastic_People_(club)")] }),
  v({ slug: "music-box-chicago", name: t("The Music Box"), aliases: ["music box", "music box chicago"], city: "chicago",
    address: "326 N Michigan Ave, Chicago", coords: near(41.8879, -87.6246), openedYear: 1983, closedYear: 1987, status: "historical", legendary: true,
    summary: t("Клуб, где резидентом был Ron Hardy — диджей, чьи сырые и громкие сеты наряду с сетами Frankie Knuckles сформировали ранний chicago house и acid house.", "Ron Hardy's club, a crucible of early Chicago house and acid house."),
    genres: ["chicago-house", "acid-house"], residentNames: ["Ron Hardy"], sources: [wiki("Music_Box_(club)")] }),
  v({ slug: "studio-54", name: t("Studio 54"), aliases: ["studio 54"], city: "new-york",
    address: "254 W 54th St, New York", coords: addr(40.7646, -73.9831), openedYear: 1977, closedYear: 1986, status: "historical", legendary: true,
    summary: t("Самый знаменитый диско-клуб конца 1970-х в бывшем театре на Манхэттене, символ гламурной стороны диско-эпохи. Первоначальные владельцы потеряли клуб в 1980 году; клуб работал под другим управлением до 1986 года.", "The most famous disco club of the late 1970s, in a former Manhattan theatre."),
    genres: ["disco"], sources: [wiki("Studio_54")] }),
  v({ slug: "output-brooklyn", name: t("Output"), aliases: ["output", "output brooklyn"], city: "new-york",
    address: "74 Wythe Ave, Brooklyn, NY", coords: near(40.7222, -73.9579), openedYear: 2013, closedYear: 2019, status: "closed",
    summary: t("Клуб в Уильямсбурге с запретом на фотосъёмку на танцполе и упором на звук; закрылся в начале 2019 года.", "Williamsburg club with a no-photo policy; closed in early 2019."),
    genres: ["techno", "house"], sources: [wiki("Output_(nightclub)")] }),
  v({ slug: "stereo-montreal", name: t("Stereo"), aliases: ["stereo montreal", "stéréo"], city: "montreal",
    address: "858 Rue Sainte-Catherine Est, Montréal", coords: near(45.5171, -73.5607), openedYear: 1998, closedYear: null, status: "active",
    summary: t("Монреальский after-hours клуб, известный звуковой системой и сетами до полудня. Сведения о текущей программе уточняются.", "Montreal after-hours club known for its sound system."),
    genres: ["house", "techno"], sources: [wiki("Stereo_(nightclub)")] }),
  v({ slug: "warung-beach-club", name: t("Warung Beach Club"), aliases: ["warung", "warung beach club"], city: "itajai",
    address: "Praia Brava, Itajaí, SC", coords: near(-26.9567, -48.623), openedYear: 2002, closedYear: null, status: "active", kind: "open-air", legendary: true,
    summary: t("Клуб на пляже Прайя-Брава, открытый в 2002 году, с главным залом в духе балийского храма, обращённым к морю. Один из самых известных клубов Южной Америки.", "Beach club opened in 2002 with a Balinese-temple-style main room facing the sea."),
    genres: ["house", "progressive-house", "techno"], sources: [wiki("Warung_Beach_Club")] }),
];

const f = (x: Omit<Festival, "checkedAt" | "verification" | "status" | "endedYear" | "attendance" | "notableArtists" | "website" | "venueName" | "usualDurationDays"> & Partial<Festival>): Festival => ({
  checkedAt: null, verification: "unverified", status: "active", endedYear: null, attendance: null, notableArtists: [], website: null, venueName: null, usualDurationDays: null, ...x,
});

export const festivalsWave2: Festival[] = [
  f({ slug: "distortion", name: t("Distortion"), aliases: ["distortion", "cph distortion"], city: "copenhagen", coords: cityPt(55.6761, 12.5683),
    foundedYear: 1998, type: "city", genres: ["techno", "house"], usualMonths: [6], usualDurationDays: 5,
    summary: t("Уличный фестиваль, который с 1998 года в начале лета превращает районы Копенгагена в танцполы, а в финале переходит на закрытую площадку.", "Street festival turning Copenhagen neighbourhoods into dance floors since 1998."),
    sources: [wiki("Distortion_(festival)")] }),
  f({ slug: "audioriver", name: t("Audioriver"), aliases: ["audioriver", "audio river"], city: "plock", venueName: "Пляж на Висле", coords: cityPt(52.5468, 19.7064),
    foundedYear: 2006, type: "boutique", genres: ["techno", "drum-and-bass", "house"], usualMonths: [7], usualDurationDays: 3,
    summary: t("Фестиваль электронной музыки на речном пляже Вислы в Плоцке, проводящийся с 2006 года, — один из главных в Польше.", "Electronic festival on the Vistula river beach in Płock since 2006."),
    sources: [wiki("Audioriver")] }),
  f({ slug: "amsterdam-dance-event", name: t("Amsterdam Dance Event"), aliases: ["ade", "amsterdam dance event"], city: "amsterdam", coords: cityPt(52.3676, 4.9041),
    foundedYear: 1996, type: "city", genres: ["techno", "house", "trance"], usualMonths: [10], usualDurationDays: 5,
    summary: t("Конференция и городской фестиваль, который каждый октябрь с 1996 года объединяет сотни площадок Амстердама: дневная индустриальная программа и ночные вечеринки клубов и лейблов.", "Conference and city-wide festival held every October since 1996."),
    concept: t("Весь город как фестиваль: конференция днём, сотни вечеринок ночью."),
    sources: [wiki("Amsterdam_Dance_Event")] }),
  f({ slug: "ultra-europe", name: t("Ultra Europe"), aliases: ["ultra europe", "ultra split"], city: "split", venueName: "Стадион Полюд", coords: near(43.5199, 16.4316),
    foundedYear: 2013, type: "mega", genres: ["big-room", "progressive-house", "techno"], usualMonths: [7], usualDurationDays: 3,
    summary: t("Европейский выпуск бренда Ultra, с 2013 года проходящий в Сплите на стадионе «Полюд», с продолжением на островах Хорватии.", "Ultra's European edition, held at Split's Poljud stadium since 2013."),
    sources: [wiki("Ultra_Europe")] }),
  f({ slug: "sunburn", name: t("Sunburn Festival"), aliases: ["sunburn", "sunburn goa"], city: "goa", coords: cityPt(15.2993, 74.124),
    foundedYear: 2007, type: "mega", genres: ["big-room", "progressive-house", "psytrance"], usualMonths: [12], usualDurationDays: 3,
    summary: t("Крупнейший фестиваль электронной музыки Индии, впервые прошедший в Гоа в 2007 году; в разные годы проводился и в Пуне. Текущее место проведения уточняется.", "India's largest electronic festival, first held in Goa in 2007."),
    sources: [wiki("Sunburn_Festival")] }),
  f({ slug: "djakarta-warehouse-project", name: t("Djakarta Warehouse Project"), aliases: ["dwp", "djakarta warehouse project"], city: "jakarta", coords: cityPt(-6.2088, 106.8456),
    foundedYear: 2008, type: "mega", genres: ["big-room", "house"], usualMonths: [12], usualDurationDays: 2,
    summary: t("Фестиваль, начавшийся в 2008 году в Джакарте и ставший одним из крупнейших в Юго-Восточной Азии; позднее проводился и на Бали. Текущее место проведения уточняется.", "Started in Jakarta in 2008; later also held in Bali."),
    sources: [wiki("Djakarta_Warehouse_Project")] }),
];
