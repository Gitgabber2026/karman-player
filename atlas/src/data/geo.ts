import type { Continent, Country } from "@/lib/types";
import { t, sec, wiki } from "./helpers";

const base = { verification: "unverified" as const, checkedAt: null };

export const continents: Continent[] = [
  {
    ...base,
    slug: "europe",
    name: t("Европа", "Europe"),
    summary: t(
      "Континент, где электронная музыка родилась как академический эксперимент и превратилась в массовую клубную культуру: от студий Парижа и Кёльна до техно-Берлина, рейвов Великобритании и клубов Ибицы.",
      "Where electronic music grew from academic experiment into mass club culture — from the studios of Paris and Cologne to Berlin techno, UK raves and Ibiza clubs."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "Европейская линия начинается с радиостудий середины XX века — GRM в Париже и студии WDR в Кёльне. В 1970-х Kraftwerk из Дюссельдорфа и продюсер Джорджо Мородер в Мюнхене задали язык синтезаторной поп-музыки, а в конце 1980-х американские house и techno попали на британскую рейв-сцену и затем — в объединённый Берлин."
      ),
      sec(
        "Географическое значение",
        "Плотная сеть городов, дешёвые перелёты и фестивальный сезон с апреля по сентябрь делают Европу крупнейшим рынком клубной и фестивальной электроники. Здесь же сосредоточены многие лейблы, производители звука и медиа о клубной культуре."
      ),
    ],
    sources: [wiki("Electronic_dance_music")],
    center: [12, 50],
    zoom: 3.3,
  },
  {
    ...base,
    slug: "north-america",
    name: t("Северная Америка", "North America"),
    summary: t(
      "Родина диско-клубов Нью-Йорка, house из Чикаго и techno из Детройта — и одновременно рынок, где в 2010-х случился бум EDM-фестивалей.",
      "Home of New York disco clubs, Chicago house and Detroit techno — and the market of the 2010s EDM festival boom."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "Нью-йоркские лофт-вечеринки и клубы 1970-х (The Loft, Paradise Garage) сформировали саму модель ночного клуба с диджеем в центре. В Чикаго из диско выросло house, в Детройте трио Belleville Three создало techno. Обе формы получили признание сначала в Европе и лишь затем — дома."
      ),
    ],
    sources: [wiki("House_music"), wiki("Detroit_techno")],
    center: [-95, 40],
    zoom: 3,
  },
  {
    ...base,
    slug: "south-america",
    name: t("Южная Америка", "South America"),
    summary: t(
      "Быстрорастущая сцена с собственными столицами — Сан-Паулу и Буэнос-Айресом, крупными клубами, прогрессив-хаусной традицией Аргентины и бразильским драм-н-бейсом.",
      "A fast-growing scene with its own capitals — São Paulo and Buenos Aires — and strong progressive house and drum & bass traditions."
    ),
    sources: [wiki("Electronic_dance_music")],
    center: [-60, -20],
    zoom: 2.8,
  },
  {
    ...base,
    slug: "asia",
    name: t("Азия", "Asia"),
    summary: t(
      "От токийских клубов и японской электроники 1970–80-х (Yellow Magic Orchestra) до гоа-транса в Индии и новых сцен Сеула, Бангкока и Бали.",
      "From Tokyo clubs and Japanese electronics of the 1970s–80s to Goa trance in India and new scenes in Seoul, Bangkok and Bali."
    ),
    sources: [wiki("Goa_trance"), wiki("Yellow_Magic_Orchestra")],
    center: [100, 25],
    zoom: 2.6,
  },
  {
    ...base,
    slug: "africa",
    name: t("Африка", "Africa"),
    summary: t(
      "Южноафриканские house-традиции, gqom и amapiano, а также сцены Каира, Найроби, Лагоса и Марокко формируют одну из самых влиятельных новых географий клубной музыки.",
      "South African house, gqom and amapiano, plus scenes in Cairo, Nairobi, Lagos and Morocco, form one of the most influential new geographies of club music."
    ),
    sources: [wiki("Amapiano"), wiki("Gqom")],
    center: [20, 2],
    zoom: 2.6,
  },
  {
    ...base,
    slug: "oceania",
    name: t("Океания", "Oceania"),
    summary: t(
      "Австралия и Новая Зеландия: клубная культура Мельбурна и Сиднея, фестивальный сезон на южное лето и заметный вклад в мировую инди-электронику.",
      "Australia and New Zealand: club culture in Melbourne and Sydney, a summer festival season and a notable contribution to global indie-electronic music."
    ),
    sources: [wiki("Music_of_Australia")],
    center: [145, -30],
    zoom: 3,
  },
];

type CountryInput = Omit<Country, "verification" | "checkedAt" | "sources"> & { sources?: Country["sources"] };
const c = (x: CountryInput): Country => ({ ...base, sources: x.sources ?? [], ...x });

export const countries: Country[] = [
  // ——— Европа ———
  c({
    slug: "germany",
    iso2: "DE",
    isoNumeric: "276",
    continent: "europe",
    name: t("Германия", "Germany"),
    summary: t(
      "Страна Kraftwerk и берлинского техно. Электронная традиция Германии тянется от кёльнской студии WDR через краут-рок и Дюссельдорф к клубам Берлина, Франкфурта и Мангейма.",
      "Home of Kraftwerk and Berlin techno, from the WDR studio in Cologne through krautrock and Düsseldorf to the clubs of Berlin and Frankfurt."
    ),
    sections: [
      sec(
        "История электронной сцены",
        "В 1951 году в Кёльне при радиостанции WDR открылась одна из первых в мире студий электронной музыки, где работал Карлхайнц Штокхаузен. В 1970 году в Дюссельдорфе образовалась группа Kraftwerk. В 1980-х Франкфурт стал центром EBM и раннего транса, а после падения Берлинской стены пустующие здания Восточного Берлина дали пространство новым клубам — Tresor, E-Werk, позже Ostgut и Berghain."
      ),
      sec(
        "Культурное признание",
        "В 2024 году техно-культура Берлина была включена в общегерманский реестр нематериального культурного наследия ЮНЕСКО."
      ),
    ],
    genres: ["berlin-techno", "minimal-techno", "trance", "electro", "ambient"],
    center: [10.4, 51.1],
    zoom: 5,
    sources: [wiki("Music_of_Germany"), wiki("Berlin_techno")],
  }),
  c({
    slug: "netherlands",
    iso2: "NL",
    isoNumeric: "528",
    continent: "europe",
    name: t("Нидерланды", "Netherlands"),
    summary: t(
      "Небольшая страна с огромной фестивальной индустрией: Амстердам, Роттердам, Amsterdam Dance Event, родина gabber и хардстайла, транс-звёзды мирового уровня.",
      "A small country with a huge festival industry: Amsterdam, Rotterdam, Amsterdam Dance Event, the birthplace of gabber and hardstyle."
    ),
    sections: [
      sec(
        "Музыкальная специфика",
        "В начале 1990-х Роттердам дал миру gabber — сверхбыстрый хардкор, а в 2000-х нидерландская сцена развила hardstyle. Параллельно страна стала центром транса (Armin van Buuren, Tiësto) и фестивальной индустрии: Mysteryland, Awakenings, Dekmantel, DGTL, Defqon.1. Ежегодная конференция и фестиваль Amsterdam Dance Event проходит в октябре."
      ),
    ],
    genres: ["gabber", "hardstyle", "uplifting-trance", "techno"],
    center: [5.3, 52.2],
    zoom: 6.4,
    sources: [wiki("Amsterdam_Dance_Event"), wiki("Gabber")],
  }),
  c({
    slug: "united-kingdom",
    iso2: "GB",
    isoNumeric: "826",
    continent: "europe",
    name: t("Великобритания", "United Kingdom"),
    summary: t(
      "Страна рейвов, пиратских радиостанций и бесконечной смены жанров: acid house, jungle, drum & bass, UK garage, dubstep, grime и UK bass.",
      "The land of raves, pirate radio and constant genre invention: acid house, jungle, drum & bass, UK garage, dubstep and UK bass."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "Лето 1988 года вошло в историю как «второе лето любви»: acid house из Чикаго, клубы Shoom и The Haçienda и нелегальные рейвы на складах и полях. В 1994 году закон Criminal Justice and Public Order Act ограничил рейвы под «повторяющиеся ритмы», что подтолкнуло культуру в лицензированные клубы — fabric, Ministry of Sound."
      ),
      sec(
        "Музыкальная специфика",
        "Британская сцена известна гибридами брейкбита и баса: из хардкор-рейва выросли jungle и drum & bass, из гаража — 2-step, затем dubstep и grime. Важную роль сыграли пиратские радиостанции и магазины пластинок."
      ),
    ],
    genres: ["acid-house", "jungle", "drum-and-bass", "uk-garage", "dubstep", "uk-bass"],
    center: [-2.5, 54],
    zoom: 5,
    sources: [wiki("Second_Summer_of_Love"), wiki("Criminal_Justice_and_Public_Order_Act_1994")],
  }),
  c({
    slug: "france",
    iso2: "FR",
    isoNumeric: "250",
    continent: "europe",
    name: t("Франция", "France"),
    summary: t(
      "Родина musique concrète и French touch: от студии Пьера Шеффера до Daft Punk, Laurent Garnier и парижских клубов.",
      "Birthplace of musique concrète and French touch: from Pierre Schaeffer's studio to Daft Punk and Laurent Garnier."
    ),
    sections: [
      sec(
        "История",
        "В 1948 году Пьер Шеффер в Париже представил первые «этюды шумов» — так появилась musique concrète. В 1990-х Франция дала миру French touch — фильтрованный, сэмплированный house Daft Punk, Cassius, Étienne de Crécy и других."
      ),
    ],
    genres: ["french-house", "electronica", "techno"],
    center: [2.4, 46.6],
    zoom: 5,
    sources: [wiki("Musique_concrète"), wiki("French_house")],
  }),
  c({
    slug: "spain",
    iso2: "ES",
    isoNumeric: "724",
    continent: "europe",
    name: t("Испания", "Spain"),
    summary: t(
      "Ибица — мировая столица клубного туризма, Барселона — дом Sónar. Испанская сцена связывает средиземноморскую курортную культуру с авангардной электроникой.",
      "Ibiza is the world capital of club tourism, Barcelona the home of Sónar."
    ),
    sections: [
      sec(
        "Балеарская традиция",
        "В 1970-х на Ибице открылись Pacha и Amnesia. В 1987 году британские диджеи, побывавшие на острове, привезли домой эклектичный «балеарский» подход к сетам, ставший одним из толчков к британскому acid house-взрыву. В 1980-х в Валенсии существовала собственная клубная сцена Ruta del Bakalao."
      ),
    ],
    genres: ["balearic", "tech-house", "house", "techno"],
    center: [-3.7, 40.2],
    zoom: 5,
    sources: [wiki("Ibiza"), wiki("Balearic_beat")],
  }),
  c({
    slug: "italy",
    iso2: "IT",
    isoNumeric: "380",
    continent: "europe",
    name: t("Италия", "Italy"),
    summary: t(
      "Италия подарила миру italo disco, итальянский хаус-пиано конца 1980-х и продюсера Джорджо Мородера (родом из Южного Тироля). Сегодня — Kappa FuturFestival в Турине и сильная техно-сцена.",
      "Italy gave the world italo disco, piano-led Italo house and producer Giorgio Moroder; today it hosts Kappa FuturFestival in Turin."
    ),
    genres: ["italo-disco", "disco", "techno"],
    center: [12.5, 42.8],
    zoom: 5,
    sources: [wiki("Italo_disco")],
  }),
  c({
    slug: "belgium",
    iso2: "BE",
    isoNumeric: "056",
    continent: "europe",
    name: t("Бельгия", "Belgium"),
    summary: t(
      "New beat, EBM, R&S Records и Tomorrowland: Бельгия — одна из самых влиятельных малых стран электронной музыки, а сегодня — родина Charlotte de Witte и Amelie Lens.",
      "New beat, EBM, R&S Records and Tomorrowland — and the home of Charlotte de Witte and Amelie Lens."
    ),
    sections: [
      sec(
        "Музыкальная специфика",
        "В 1980-х Бельгия выработала собственные жанры — EBM (Front 242) и new beat. Лейбл R&S Records из Гента издавал ранние записи Aphex Twin и Joey Beltram. Брюссельский клуб Fuse работает с 1994 года, а Tomorrowland в Боме с 2005 года стал одним из крупнейших фестивалей мира."
      ),
    ],
    genres: ["techno", "ebm", "hard-techno"],
    center: [4.5, 50.6],
    zoom: 7,
    sources: [wiki("New_beat"), wiki("R%26S_Records")],
  }),
  c({
    slug: "sweden",
    iso2: "SE",
    isoNumeric: "752",
    continent: "europe",
    name: t("Швеция", "Sweden"),
    summary: t(
      "Стокгольм — дом Drumcode и шведского техно 1990-х, а также крупных продюсеров прогрессив-хауса и EDM: Eric Prydz, Swedish House Mafia, Avicii.",
      "Stockholm is the home of Drumcode and 1990s Swedish techno, and of Eric Prydz, Swedish House Mafia and Avicii."
    ),
    genres: ["techno", "progressive-house"],
    center: [16, 62],
    zoom: 4.3,
    sources: [wiki("Drumcode_Records")],
  }),
  c({
    slug: "denmark",
    iso2: "DK",
    isoNumeric: "208",
    continent: "europe",
    name: t("Дания", "Denmark"),
    summary: t("Копенгаген в последние годы известен быстрой хард-техно и транс-ориентированной сценой и клубами в бывших промышленных зданиях.", "Copenhagen has a fast-moving hard techno scene in former industrial spaces."),
    genres: ["hard-techno", "techno"],
    center: [10, 56],
    zoom: 6,
    sources: [wiki("Music_of_Denmark")],
  }),
  c({
    slug: "poland",
    iso2: "PL",
    isoNumeric: "616",
    continent: "europe",
    name: t("Польша", "Poland"),
    summary: t("Варшава и Краков развивают заметную техно-сцену; одна из старейших площадок — фестиваль Audioriver в Плоцке.", "Warsaw and Kraków have notable techno scenes; Audioriver in Płock is a long-running festival."),
    genres: ["techno"],
    center: [19.4, 52],
    zoom: 5.5,
    sources: [wiki("Music_of_Poland")],
  }),
  c({
    slug: "czechia",
    iso2: "CZ",
    isoNumeric: "203",
    continent: "europe",
    name: t("Чехия", "Czechia"),
    summary: t("Чешская сцена известна фри-тековой традицией 1990-х (CzechTek) и клубами Праги.", "Known for the 1990s free-tekno tradition (CzechTek) and Prague clubs."),
    genres: ["techno", "acid-techno"],
    center: [15.4, 49.8],
    zoom: 6.3,
    sources: [wiki("CzechTek")],
  }),
  c({
    slug: "croatia",
    iso2: "HR",
    isoNumeric: "191",
    continent: "europe",
    name: t("Хорватия", "Croatia"),
    summary: t(
      "Адриатическое побережье Хорватии в 2010-х стало площадкой бутиковых фестивалей с британскими корнями — Dimensions, Outlook, Hideout — и Ultra Europe в Сплите. Загреб развивает собственную клубную сцену.",
      "Croatia's coast became home to UK-rooted boutique festivals in the 2010s, plus Ultra Europe in Split."
    ),
    genres: ["techno", "house", "uk-bass"],
    center: [16.4, 45.1],
    zoom: 6,
    sources: [wiki("Dimensions_Festival")],
  }),
  c({
    slug: "serbia",
    iso2: "RS",
    isoNumeric: "688",
    continent: "europe",
    name: t("Сербия", "Serbia"),
    summary: t(
      "Белград славится ночной жизнью и техно-сценой, а Нови-Сад — фестивалем EXIT, который вырос из студенческого протестного движения 2000 года.",
      "Belgrade is famous for its nightlife and techno; Novi Sad for EXIT, born from the 2000 student protest movement."
    ),
    genres: ["techno"],
    center: [20.9, 44.1],
    zoom: 6.3,
    sources: [wiki("Exit_(festival)")],
  }),
  c({
    slug: "portugal",
    iso2: "PT",
    isoNumeric: "620",
    continent: "europe",
    name: t("Португалия", "Portugal"),
    summary: t(
      "Лиссабон с клубом Lux Frágil, сцена afro-португальских ритмов (лейбл Príncipe) и Boom Festival — один из старейших трансформационных фестивалей Европы.",
      "Lisbon's Lux Frágil, Afro-Portuguese club sounds (Príncipe label) and Boom Festival."
    ),
    genres: ["psytrance", "house", "afro-house"],
    center: [-8.2, 39.6],
    zoom: 6,
    sources: [wiki("Boom_Festival")],
  }),
  c({
    slug: "romania",
    iso2: "RO",
    isoNumeric: "642",
    continent: "europe",
    name: t("Румыния", "Romania"),
    summary: t(
      "Румыния известна своим минималистичным «rominimal» — микро-хаусом с длинными сетами — и фестивалями Sunwaves и Untold.",
      "Known for 'rominimal' micro-house and the festivals Sunwaves and Untold."
    ),
    genres: ["minimal-techno", "minimal-house"],
    center: [25, 45.9],
    zoom: 6,
    sources: [wiki("Untold_Festival")],
  }),
  c({
    slug: "georgia",
    iso2: "GE",
    isoNumeric: "268",
    continent: "europe",
    name: t("Грузия", "Georgia"),
    summary: t(
      "Тбилиси в 2010-х стал одним из центров техно-культуры: клубы Bassiani и KHIDI связали танцпол с гражданским активизмом.",
      "In the 2010s Tbilisi became a techno hub; Bassiani and KHIDI tied the dance floor to civic activism."
    ),
    genres: ["techno", "hard-techno"],
    center: [43.5, 42.2],
    zoom: 6.5,
    sources: [wiki("Bassiani")],
  }),
  c({
    slug: "hungary",
    iso2: "HU",
    isoNumeric: "348",
    continent: "europe",
    name: t("Венгрия", "Hungary"),
    summary: t("Будапешт и фестиваль O.Z.O.R.A. — одна из крупнейших точек мировой психоделической транс-сцены.", "Budapest and O.Z.O.R.A., a key psytrance gathering."),
    genres: ["psytrance"],
    center: [19.3, 47.2],
    zoom: 6.5,
    sources: [wiki("Ozora_Festival")],
  }),
  c({
    slug: "ireland",
    iso2: "IE",
    isoNumeric: "372",
    continent: "europe",
    name: t("Ирландия", "Ireland"),
    summary: t("Дублинская клубная сцена и Ричард Д. Джеймс (Aphex Twin), родившийся в Лимерике.", "Dublin club scene; Aphex Twin was born in Limerick."),
    genres: ["techno", "idm"],
    center: [-8, 53.3],
    zoom: 6,
    sources: [wiki("Aphex_Twin")],
  }),
  c({
    slug: "bosnia-and-herzegovina",
    iso2: "BA",
    isoNumeric: "070",
    continent: "europe",
    name: t("Босния и Герцеговина", "Bosnia and Herzegovina"),
    summary: t("Место рождения диджея и продюсера Solomun (Травник), выросшего в Гамбурге.", "Birthplace of Solomun (Travnik), who grew up in Hamburg."),
    genres: [],
    center: [17.8, 44.2],
    zoom: 6.5,
    sources: [wiki("Solomun")],
  }),
  c({
    slug: "russia",
    iso2: "RU",
    isoNumeric: "643",
    continent: "europe",
    name: t("Россия", "Russia"),
    summary: t(
      "Здесь в 1920 году Лев Термен изобрёл терменвокс; в 1990-х Петербург и Москва прошли через собственную рейв-революцию (Gagarin Party, 1991).",
      "Leon Theremin invented the theremin here in 1920; St Petersburg and Moscow had their own rave revolution in the 1990s."
    ),
    genres: ["techno", "ambient"],
    center: [37.6, 55.7],
    zoom: 3.5,
    sources: [wiki("Theremin")],
  }),
  // ——— Северная Америка ———
  c({
    slug: "united-states",
    iso2: "US",
    isoNumeric: "840",
    continent: "north-america",
    name: t("США", "United States"),
    summary: t(
      "Нью-Йорк, Чикаго и Детройт — три точки рождения современной клубной музыки: диско и garage, house, techno. Позже — Майами с Winter Music Conference и Ultra, Лас-Вегас с EDC.",
      "New York, Chicago and Detroit — three birthplaces of modern club music; later Miami and Las Vegas."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "Клубная культура США выросла в чёрных и квир-сообществах крупных городов. После «Ночи уничтожения диско» в Чикаго (1979) мейнстрим отвернулся от танцевальной музыки, но в клубах Warehouse и Music Box из неё родился house, а в Детройте — techno. Массовый коммерческий взлёт пришёл лишь в 2010-х с EDM."
      ),
    ],
    genres: ["chicago-house", "detroit-techno", "disco", "electro"],
    center: [-98, 39],
    zoom: 3.4,
    sources: [wiki("Disco_Demolition_Night"), wiki("House_music")],
  }),
  c({
    slug: "canada",
    iso2: "CA",
    isoNumeric: "124",
    continent: "north-america",
    name: t("Канада", "Canada"),
    summary: t(
      "Монреаль и фестиваль MUTEK, Виндзор — город через реку от Детройта, где Richie Hawtin и John Acquaviva основали Plus 8.",
      "Montreal and MUTEK; Windsor, across the river from Detroit, where Plus 8 was founded."
    ),
    genres: ["minimal-techno", "experimental"],
    center: [-96, 56],
    zoom: 3,
    sources: [wiki("Mutek"), wiki("Plus_8")],
  }),
  c({
    slug: "mexico",
    iso2: "MX",
    isoNumeric: "484",
    continent: "north-america",
    name: t("Мексика", "Mexico"),
    summary: t("Мехико и Тулум — точки притяжения для house и techno; Плайя-дель-Кармен много лет принимала BPM Festival.", "Mexico City and Tulum draw house and techno crowds; Playa del Carmen hosted The BPM Festival."),
    genres: ["tech-house", "organic-house"],
    center: [-102, 23.6],
    zoom: 4.3,
    sources: [wiki("The_BPM_Festival")],
  }),
  // ——— Южная Америка ———
  c({
    slug: "brazil",
    iso2: "BR",
    isoNumeric: "076",
    continent: "south-america",
    name: t("Бразилия", "Brazil"),
    summary: t(
      "Сан-Паулу — крупнейший электронный мегаполис Южной Америки; Бразилия известна также драм-н-бейсом (DJ Marky), психоделическим трансом и клубом D-Edge.",
      "São Paulo is South America's electronic megacity; Brazil is also known for drum & bass and psytrance."
    ),
    genres: ["drum-and-bass", "psytrance", "techno"],
    center: [-51.9, -14.2],
    zoom: 3.5,
    sources: [wiki("Music_of_Brazil")],
  }),
  c({
    slug: "argentina",
    iso2: "AR",
    isoNumeric: "032",
    continent: "south-america",
    name: t("Аргентина", "Argentina"),
    summary: t(
      "Буэнос-Айрес — один из главных городов мирового прогрессив-хауса: многолетняя публика Sasha, John Digweed, Hernán Cattáneo.",
      "Buenos Aires is a global stronghold of progressive house."
    ),
    genres: ["progressive-house", "melodic-house"],
    center: [-64, -36],
    zoom: 3.6,
    sources: [wiki("Hernán_Cattáneo")],
  }),
  c({
    slug: "colombia",
    iso2: "CO",
    isoNumeric: "170",
    continent: "south-america",
    name: t("Колумбия", "Colombia"),
    summary: t("Богота и Медельин развивают сильные techno- и house-сцены.", "Bogotá and Medellín have strong techno and house scenes."),
    genres: ["techno", "house"],
    center: [-74.3, 4.6],
    zoom: 5,
    sources: [wiki("Music_of_Colombia")],
  }),
  c({
    slug: "chile",
    iso2: "CL",
    isoNumeric: "152",
    continent: "south-america",
    name: t("Чили", "Chile"),
    summary: t("Чили связана с минимал-сценой: здесь выросли Ricardo Villalobos и Luciano, сделавшие карьеру в Европе.", "Chile is linked to minimal: Ricardo Villalobos and Luciano grew up here."),
    genres: ["minimal-techno", "minimal-house"],
    center: [-71.5, -35.7],
    zoom: 3.8,
    sources: [wiki("Ricardo_Villalobos")],
  }),
  c({
    slug: "peru",
    iso2: "PE",
    isoNumeric: "604",
    continent: "south-america",
    name: t("Перу", "Peru"),
    summary: t("Лима — растущий центр андеграундной электроники, соединяющей клубные форматы с андскими традициями.", "Lima is a growing hub mixing club forms with Andean traditions."),
    genres: ["house", "techno"],
    center: [-75, -9.2],
    zoom: 4.6,
    sources: [wiki("Music_of_Peru")],
  }),
  // ——— Азия ———
  c({
    slug: "japan",
    iso2: "JP",
    isoNumeric: "392",
    continent: "asia",
    name: t("Япония", "Japan"),
    summary: t(
      "Roland, Yellow Magic Orchestra и токийские клубы: Япония — одновременно производитель ключевых инструментов электронной музыки и одна из самых преданных клубных аудиторий.",
      "Roland, Yellow Magic Orchestra and Tokyo clubs: Japan makes the key instruments and has one of the most devoted club audiences."
    ),
    sections: [
      sec(
        "Инструменты",
        "Японская Roland выпустила драм-машину TR-808 (1980), басовый синтезатор TB-303 (1981) и драм-машину TR-909 (1983). Эти машины стали звуковой основой hip-hop, electro, house, acid house и techno."
      ),
    ],
    genres: ["techno", "house", "ambient"],
    center: [138, 37],
    zoom: 4.5,
    sources: [wiki("Roland_TR-808"), wiki("Roland_TB-303")],
  }),
  c({
    slug: "south-korea",
    iso2: "KR",
    isoNumeric: "410",
    continent: "asia",
    name: t("Южная Корея", "South Korea"),
    summary: t("Сеул с районами Итэвон и Хондэ — центр корейской клубной сцены; родом из Кореи Peggy Gou.", "Seoul is the centre of Korean club culture; Peggy Gou was born in Korea."),
    genres: ["house", "techno"],
    center: [127.8, 36.3],
    zoom: 6,
    sources: [wiki("Peggy_Gou")],
  }),
  c({
    slug: "thailand",
    iso2: "TH",
    isoNumeric: "764",
    continent: "asia",
    name: t("Таиланд", "Thailand"),
    summary: t("Острова Пханган с Full Moon Party и клубы Бангкока.", "Koh Phangan's Full Moon Party and Bangkok clubs."),
    genres: ["psytrance", "house"],
    center: [101, 15],
    zoom: 5,
    sources: [wiki("Full_Moon_Party")],
  }),
  c({
    slug: "india",
    iso2: "IN",
    isoNumeric: "356",
    continent: "asia",
    name: t("Индия", "India"),
    summary: t(
      "Пляжи Гоа в конце 1980-х — начале 1990-х стали колыбелью гоа-транса; сегодня электроника развивается в Мумбаи, Бангалоре и Дели.",
      "Goa's beaches were the cradle of Goa trance; today Mumbai, Bangalore and Delhi have growing scenes."
    ),
    genres: ["goa-trance", "psytrance"],
    center: [79, 22],
    zoom: 4,
    sources: [wiki("Goa_trance")],
  }),
  c({
    slug: "indonesia",
    iso2: "ID",
    isoNumeric: "360",
    continent: "asia",
    name: t("Индонезия", "Indonesia"),
    summary: t("Бали и Джакарта: пляжные клубы и крупные фестивали; в Джакарте с 2008 года проходит Djakarta Warehouse Project.", "Bali beach clubs and Jakarta's Djakarta Warehouse Project."),
    genres: ["house"],
    center: [118, -2.5],
    zoom: 4,
    sources: [wiki("Djakarta_Warehouse_Project")],
  }),
  c({
    slug: "china",
    iso2: "CN",
    isoNumeric: "156",
    continent: "asia",
    name: t("Китай", "China"),
    summary: t("Шанхай, Пекин и Чэнду формируют быстро развивающуюся андеграундную клубную сцену.", "Shanghai, Beijing and Chengdu have fast-developing underground scenes."),
    genres: ["techno"],
    center: [104, 35],
    zoom: 3.6,
    sources: [wiki("Music_of_China")],
  }),
  // ——— Африка ———
  c({
    slug: "south-africa",
    iso2: "ZA",
    isoNumeric: "710",
    continent: "africa",
    name: t("ЮАР", "South Africa"),
    summary: t(
      "Одна из крупнейших house-наций мира: kwaito, deep house, gqom из Дурбана и amapiano из пригородов Йоханнесбурга и Претории; Black Coffee — самый известный представитель сцены.",
      "One of the world's great house nations: kwaito, deep house, gqom and amapiano."
    ),
    genres: ["afro-house", "deep-house", "amapiano", "gqom"],
    center: [24.7, -29],
    zoom: 4.6,
    sources: [wiki("Amapiano"), wiki("Kwaito")],
  }),
  c({
    slug: "morocco",
    iso2: "MA",
    isoNumeric: "504",
    continent: "africa",
    name: t("Марокко", "Morocco"),
    summary: t("Марракеш и Танжер — точки пересечения электроники и гнауа; в Марракеше проходит фестиваль Oasis.", "Marrakech and Tangier connect electronic music with gnawa."),
    genres: ["organic-house"],
    center: [-6.5, 31.8],
    zoom: 5,
    sources: [wiki("Music_of_Morocco")],
  }),
  c({
    slug: "egypt",
    iso2: "EG",
    isoNumeric: "818",
    continent: "africa",
    name: t("Египет", "Egypt"),
    summary: t("Каир — центр махраганата и экспериментальной электроники, а побережье Красного моря принимает танцевальные события.", "Cairo is a centre of mahraganat and experimental electronics."),
    genres: ["experimental"],
    center: [30.8, 26.8],
    zoom: 5,
    sources: [wiki("Mahraganat")],
  }),
  c({
    slug: "kenya",
    iso2: "KE",
    isoNumeric: "404",
    continent: "africa",
    name: t("Кения", "Kenya"),
    summary: t("Найроби — растущая клубная и экспериментальная сцена Восточной Африки.", "Nairobi has a growing club scene linked to the East African experimental circuit."),
    genres: ["experimental", "afro-house"],
    center: [37.9, 0.2],
    zoom: 5.5,
    sources: [wiki("Music_of_Kenya")],
  }),
  c({
    slug: "nigeria",
    iso2: "NG",
    isoNumeric: "566",
    continent: "africa",
    name: t("Нигерия", "Nigeria"),
    summary: t("Лагос — центр афробитс, всё теснее связанного с клубной электроникой и amapiano.", "Lagos, the centre of Afrobeats, increasingly linked to club electronics."),
    genres: ["afro-house", "amapiano"],
    center: [8.7, 9.1],
    zoom: 5.3,
    sources: [wiki("Afrobeats")],
  }),
  // ——— Океания ———
  c({
    slug: "australia",
    iso2: "AU",
    isoNumeric: "036",
    continent: "oceania",
    name: t("Австралия", "Australia"),
    summary: t(
      "Мельбурн и Сидней — центры австралийской клубной культуры; летний сезон с декабря по март — время фестивалей. В Мельбурне живёт Carl Cox.",
      "Melbourne and Sydney lead Australian club culture; Carl Cox lives in Melbourne."
    ),
    genres: ["house", "techno", "drum-and-bass"],
    center: [134, -25.5],
    zoom: 3.6,
    sources: [wiki("Music_of_Australia")],
  }),
  c({
    slug: "new-zealand",
    iso2: "NZ",
    isoNumeric: "554",
    continent: "oceania",
    name: t("Новая Зеландия", "New Zealand"),
    summary: t("Окленд и Веллингтон; сильные традиции drum & bass и dub.", "Auckland and Wellington; strong drum & bass and dub traditions."),
    genres: ["drum-and-bass"],
    center: [172.5, -41],
    zoom: 4.8,
    sources: [wiki("Music_of_New_Zealand")],
  }),
];
