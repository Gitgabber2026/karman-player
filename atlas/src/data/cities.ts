import type { City } from "@/lib/types";
import { t, sec, wiki } from "./helpers";

type CityInput = Omit<City, "verification" | "checkedAt" | "capital" | "genres"> & { capital?: boolean; genres?: string[] };
const city = (x: CityInput): City => ({
  verification: "unverified",
  checkedAt: null,
  capital: false,
  genres: [],
  ...x,
});
const pt = (lat: number, lng: number) => ({ lat, lng, precision: "city" as const });

export const cities: City[] = [
  city({
    slug: "berlin",
    country: "germany",
    capital: true,
    name: t("Берлин", "Berlin"),
    aliases: ["berlin", "берлин"],
    coords: pt(52.52, 13.405),
    summary: t(
      "Город, где после падения стены техно стало языком объединения. Пустующие электростанции, бункеры и подвалы Востока превратились в клубы, а длинные уик-энды без закрытия — в часть городской идентичности.",
      "The city where techno became the language of reunification, turning empty power stations, bunkers and basements into clubs."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "В ноябре 1989 года пала Берлинская стена; летом того же года по Курфюрстендамму прошёл первый Love Parade — около 150 участников. В 1991 году в хранилище бывшего универмага Wertheim на Лейпцигер-штрассе открылся Tresor, установивший прямую связь с Детройтом: здесь регулярно выступали Jeff Mills, Juan Atkins, Blake Baxter. Отсутствие ясного режима собственности на здания Востока и свобода времени закрытия сделали город лабораторией клубной культуры."
      ),
      sec(
        "Уникальный вклад",
        "Берлин сформировал модель клуба как длительного, почти ритуального пространства: вечеринки с вечера субботы до утра понедельника, строгий фейсконтроль и запрет на фотосъёмку, которые защищают приватность танцпола. Ostgut (1998–2003) и выросший из него Berghain (с 2004) стали ориентиром для андеграундных клубов по всему миру."
      ),
      sec(
        "Звучание",
        "«Берлинским» обычно называют аскетичное, гипнотическое, тяжёлое по басу техно с акцентом на долгих сетах — от даб-техно Basic Channel до индустриального звучания резидентов Berghain."
      ),
    ],
    facts: [
      t("В 2024 году техно-культура Берлина внесена в национальный реестр нематериального культурного наследия Германии."),
      t("Love Parade проходил в Берлине с 1989 по 2003 год и в 2006 году; в 2007–2010 годах — в городах Рурской области (выпуск 2009 года был отменён)."),
    ],
    genres: ["berlin-techno", "minimal-techno", "dub-techno", "techno"],
    sources: [wiki("Berlin"), wiki("Love_Parade"), wiki("Tresor")],
  }),
  city({
    slug: "amsterdam",
    country: "netherlands",
    capital: true,
    name: t("Амстердам", "Amsterdam"),
    aliases: ["amsterdam", "амстердам", "adam"],
    coords: pt(52.3676, 4.9041),
    summary: t(
      "Столица фестивальной индустрии и место ежегодного Amsterdam Dance Event. Здесь соседствуют исторические площадки 1960-х и ночные клубы с круглосуточными лицензиями.",
      "Capital of the festival industry and host of Amsterdam Dance Event, with 1960s venues and 24-hour-licensed clubs side by side."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "Paradiso (1968) и Melkweg (1970) выросли из контркультуры как молодёжные центры в бывших церкви и молочной фабрике. С 1996 года в октябре проходит Amsterdam Dance Event — конференция и фестиваль, который превращает город в сотни площадок одновременно. Амстердам одним из первых развил институт «ночного мэра» и стал выдавать отдельным клубам круглосуточные лицензии."
      ),
      sec(
        "Уникальный вклад",
        "Амстердам соединил андеграунд и индустрию: здесь работают крупнейшие агентства и лейблы, в том числе Armada Music, а летом город окружён фестивалями — Dekmantel, DGTL, Awakenings, Loveland."
      ),
    ],
    facts: [t("Amsterdam Dance Event проводится ежегодно в октябре с 1996 года.")],
    genres: ["techno", "house", "uplifting-trance"],
    sources: [wiki("Amsterdam"), wiki("Amsterdam_Dance_Event"), wiki("Night_mayor")],
  }),
  city({
    slug: "ibiza",
    country: "spain",
    capital: true,
    name: t("Ибица", "Ibiza"),
    aliases: ["ibiza", "eivissa", "ибица", "ибиса", "ivisa"],
    coords: pt(38.9067, 1.4206),
    summary: t(
      "Остров Балеарского архипелага, ставший мировой столицей клубного туризма: суперклубы, закаты в Сант-Антони, резиденции звёздных диджеев с мая по октябрь.",
      "The Balearic island that became the world capital of club tourism, with superclubs and summer-long DJ residencies."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "В 1960–70-х Ибица привлекала хиппи и богему; в 1973 году открылся Pacha, в 1976 — Amnesia. В 1980-х резидент Amnesia Альфредо Фиорито сводил поп, итальянский диско, хаус и инди в балеарский стиль. Летом 1987 года Пол Окенфолд, Дэнни Рэмплинг, Ники Холлоуэй и Джонни Уокер, побывав в Amnesia, привезли этот опыт в Лондон."
      ),
      sec(
        "Уникальный вклад",
        "Ибица превратила диджейскую резиденцию в бренд: многолетние вечеринки вроде Cocoon в Amnesia, Circoloco в DC-10 или Music Is Revolution Карла Кокса в Space определяли летний сезон. Остров также стал синонимом «балеарского» звучания — расслабленного, солнечного, эклектичного."
      ),
    ],
    genres: ["balearic", "tech-house", "house", "techno"],
    sources: [wiki("Ibiza"), wiki("Alfredo_Fiorito"), wiki("Balearic_beat")],
  }),
  city({
    slug: "london",
    country: "united-kingdom",
    capital: true,
    name: t("Лондон", "London"),
    aliases: ["london", "лондон"],
    coords: pt(51.5074, -0.1278),
    summary: t(
      "Город, где родились jungle, UK garage, dubstep и grime, а клубы fabric и Ministry of Sound задали стандарт звука и программирования.",
      "Birthplace of jungle, UK garage, dubstep and grime; fabric and Ministry of Sound set standards for sound and programming."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "В конце 1987 года Дэнни Рэмплинг открыл вечеринку Shoom, Пол Окенфолд — Spectrum; лето 1988-го стало «вторым летом любви». На пиратских радиостанциях начала 1990-х зародились jungle и drum & bass, а к концу десятилетия — UK garage. В начале 2000-х в южном Лондоне (Кройдон, магазин Big Apple Records, вечеринки FWD>> в клубе Plastic People) сформировался dubstep."
      ),
      sec(
        "Уникальный вклад",
        "Лондон — фабрика жанров: каждое поколение превращает локальные басовые эксперименты в мировое явление. Здесь работают мейджоры, радио BBC Radio 1 и онлайн-платформа Boiler Room (запущена в Лондоне в 2010 году)."
      ),
    ],
    facts: [t("Ministry of Sound открылся в 1991 году в бывшем автобусном гараже в районе Элефант-энд-Касл.")],
    genres: ["jungle", "drum-and-bass", "uk-garage", "dubstep", "acid-house"],
    sources: [wiki("London"), wiki("Shoom"), wiki("Dubstep"), wiki("Boiler_Room_(music_broadcaster)")],
  }),
  city({
    slug: "detroit",
    country: "united-states",
    capital: true,
    name: t("Детройт", "Detroit"),
    aliases: ["detroit", "детройт", "motor city"],
    coords: pt(42.3314, -83.0458),
    summary: t(
      "Родина techno. Постиндустриальный Детройт 1980-х, город автозаводов и Motown, вдохновил Хуана Аткинса, Деррика Мэя и Кевина Сондерсона на футуристическую электронику.",
      "The birthplace of techno, where Juan Atkins, Derrick May and Kevin Saunderson turned post-industrial Detroit into futurist music."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "Трое школьных друзей из пригорода Бельвиль — Juan Atkins, Derrick May и Kevin Saunderson — слушали Kraftwerk, Parliament-Funkadelic и итальянский диско через радиошоу The Electrifying Mojo. В начале 1980-х Аткинс с проектами Cybotron и Model 500 заложил основы жанра. В 1988 году британский лейбл 10 Records выпустил компиляцию «Techno! The New Dance Sound of Detroit», давшую жанру название."
      ),
      sec(
        "Уникальный вклад",
        "Детройт дал techno его философию — афрофутуризм, независимость (лейблы Metroplex, Transmat, KMS, Underground Resistance) и представление о машине как о соавторе. Ежегодно на День памяти в Hart Plaza проходит фестиваль Movement."
      ),
    ],
    facts: [t("Клуб Music Institute (1988–1989) на Бродвей-стрит считается ключевой площадкой раннего детройтского techno.")],
    genres: ["detroit-techno", "electro", "techno"],
    sources: [wiki("Detroit_techno"), wiki("Belleville_Three"), wiki("The_Electrifying_Mojo")],
  }),
  city({
    slug: "chicago",
    country: "united-states",
    capital: true,
    name: t("Чикаго", "Chicago"),
    aliases: ["chicago", "чикаго"],
    coords: pt(41.8781, -87.6298),
    summary: t(
      "Здесь из диско и драм-машин родилось house. Клуб The Warehouse и его резидент Frankie Knuckles дали жанру имя, а Phuture — acid house.",
      "House music was born here from disco and drum machines; The Warehouse and Frankie Knuckles gave the genre its name."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "С 1977 года в клубе The Warehouse играл нью-йоркский диджей Frankie Knuckles: он удлинял диско-треки, накладывал ритм драм-машины и создавал непрерывный поток для преимущественно чёрной гей-публики. Музыку из этого клуба в магазинах называли «house». В 1984 году Jesse Saunders выпустил «On and On», в 1987-м Phuture записали «Acid Tracks» на Roland TB-303. Радио WBMX и команда Hot Mix 5 разнесли звук по городу."
      ),
      sec(
        "Уникальный вклад",
        "Чикаго создал не только жанр, но и инфраструктуру: лейблы Trax Records и DJ International издавали треки, которые в 1986–1987 годах попали в британские чарты. Клуб Smartbar работает с 1982 года."
      ),
    ],
    facts: [t("Улица у бывшего здания The Warehouse носит почётное имя Frankie Knuckles Way.")],
    genres: ["chicago-house", "acid-house", "deep-house"],
    sources: [wiki("Chicago_house"), wiki("The_Warehouse_(nightclub)"), wiki("Frankie_Knuckles")],
  }),
  city({
    slug: "new-york",
    country: "united-states",
    capital: true,
    name: t("Нью-Йорк", "New York"),
    aliases: ["new york", "nyc", "нью-йорк", "ny"],
    coords: pt(40.7128, -74.006),
    summary: t(
      "Город, где диджей впервые стал главным героем ночи: The Loft Дэвида Манкузо, Paradise Garage Ларри Левана, Studio 54 и сегодняшний Nowadays.",
      "The city where the DJ first became the hero of the night: The Loft, Paradise Garage, Studio 54 and today's Nowadays."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "В 1970 году Дэвид Манкузо начал вечеринки The Loft — по приглашениям, с акцентом на качество звука. С 1977 по 1987 год в Paradise Garage на Кинг-стрит играл Larry Levan; от названия клуба происходит жанровое понятие garage. В Бронксе в те же годы из диско и фанка родился хип-хоп, а позже — electro."
      ),
      sec(
        "Уникальный вклад",
        "Нью-Йорк дал клубной культуре саму идею танцпола как сообщества, звуковые системы уровня аудиофилов и традицию длинных диджейских сетов."
      ),
    ],
    genres: ["disco", "garage-house", "deep-house", "electro"],
    sources: [wiki("Paradise_Garage"), wiki("The_Loft_(New_York_City)"), wiki("Larry_Levan")],
  }),
  city({
    slug: "miami",
    country: "united-states",
    capital: true,
    name: t("Майами", "Miami"),
    aliases: ["miami", "майами", "майями"],
    coords: pt(25.7617, -80.1918),
    summary: t(
      "Каждый март Майами становится индустриальной столицей электроники: Winter Music Conference (с 1985 года), Miami Music Week и Ultra Music Festival в Bayfront Park.",
      "Every March Miami becomes the industry capital of electronic music: WMC, Miami Music Week and Ultra."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "Майами задал формат «музыкальной недели», где в городе одновременно проходят конференции, вечеринки лейблов и фестиваль. Club Space в Даунтауне известен утренними и дневными сетами на террасе. Майами также был центром Miami bass — басового электро-хип-хопа 1980-х."
      ),
    ],
    genres: ["tech-house", "trance", "electro"],
    sources: [wiki("Winter_Music_Conference"), wiki("Ultra_Music_Festival"), wiki("Miami_bass")],
  }),
  city({
    slug: "barcelona",
    country: "spain",
    capital: true,
    name: t("Барселона", "Barcelona"),
    aliases: ["barcelona", "барселона", "bcn"],
    coords: pt(41.3874, 2.1686),
    summary: t(
      "Город Sónar — фестиваля «продвинутой музыки и новых медиа», который с 1994 года соединяет клубную ночь с дневной программой искусства и технологий.",
      "Home of Sónar, which since 1994 has paired club nights with daytime art and technology programmes."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "Sónar разделён на дневную часть (концерты, конференция Sónar+D) и ночную — с крупными сценами. Модель «фестиваль + технологическая конференция» повторили многие города. Летом Барселона — также точка пересадки на балеарский сезон."
      ),
    ],
    genres: ["electronica", "techno", "idm"],
    sources: [wiki("Sónar")],
  }),
  city({
    slug: "paris",
    country: "france",
    capital: true,
    name: t("Париж", "Paris"),
    aliases: ["paris", "париж"],
    coords: pt(48.8566, 2.3522),
    summary: t(
      "От первых экспериментов musique concrète в студии Пьера Шеффера до French touch и Daft Punk — Париж связывает академическую электронику с танцполом.",
      "From Pierre Schaeffer's musique concrète to French touch and Daft Punk."
    ),
    sections: [
      sec(
        "Исторический контекст",
        "В 1948 году Пьер Шеффер на французском радио создал «Этюд с железными дорогами»; позже возникла GRM (Groupe de Recherches Musicales). С 1977 года работал IRCAM Пьера Булеза. В конце 1980-х Rex Club на бульваре Пуассоньер стал домом парижского house и techno, где резидентом был Laurent Garnier."
      ),
      sec(
        "Уникальный вклад",
        "Французский house 1990-х (Daft Punk, Cassius, Motorbass, Bob Sinclar) превратил фильтрованный диско-сэмпл в мировой поп-звук. Сегодня Париж известен вечеринками в нестандартных пространствах и возвращением рейвов на окраины."
      ),
    ],
    genres: ["french-house", "techno", "experimental"],
    sources: [wiki("Pierre_Schaeffer"), wiki("Groupe_de_Recherches_Musicales"), wiki("French_house")],
  }),
  city({
    slug: "brussels",
    country: "belgium",
    capital: true,
    name: t("Брюссель", "Brussels"),
    aliases: ["brussels", "bruxelles", "brussel", "брюссель"],
    coords: pt(50.8503, 4.3517),
    summary: t(
      "Город new beat и EBM 1980-х и клуба Fuse — одного из старейших действующих техно-клубов Европы (с 1994 года).",
      "City of 1980s new beat and EBM and of Fuse, one of Europe's oldest running techno clubs."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "Бельгия конца 1980-х — это new beat: замедленный EBM и синти-поп, который рождался в клубах вокруг Брюсселя и Антверпена. Fuse в районе Мароль сохраняет непрерывность техно-традиции, а вокруг города расположены крупнейшие фестивали страны, включая Tomorrowland."
      ),
    ],
    genres: ["techno", "ebm"],
    sources: [wiki("Fuse_(club)"), wiki("New_beat")],
  }),
  city({
    slug: "tokyo",
    country: "japan",
    capital: true,
    name: t("Токио", "Tokyo"),
    aliases: ["tokyo", "токио", "東京"],
    coords: pt(35.6762, 139.6503),
    summary: t(
      "Город Yellow Magic Orchestra, клубов Сибуи и Аоямы, магазинов пластинок и звука уровня аудиофилов — в том числе знаменитых listening bars.",
      "City of Yellow Magic Orchestra, Shibuya and Aoyama clubs, record shops and audiophile listening bars."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "YMO, образованные в Токио в 1978 году, были одними из первых, кто превратил синтезаторы и секвенсоры в поп-формат мирового масштаба. Токийские клубы известны вниманием к звуку и долгим ночным сетам, а культура jazz kissa и listening bars повлияла на появление подобных баров по всему миру."
      ),
    ],
    facts: [t("Японские законы долго ограничивали танцы в клубах после полуночи; реформа закона о развлекательных заведениях вступила в силу в 2016 году.")],
    genres: ["techno", "house", "ambient"],
    sources: [wiki("Yellow_Magic_Orchestra"), wiki("Fueiho")],
  }),
  city({
    slug: "tbilisi",
    country: "georgia",
    capital: true,
    name: t("Тбилиси", "Tbilisi"),
    aliases: ["tbilisi", "тбилиси", "tiflis"],
    coords: pt(41.7151, 44.8271),
    summary: t(
      "В 2010-х Тбилиси стал одной из самых обсуждаемых техно-столиц: Bassiani под стадионом «Динамо» и KHIDI под мостом превратили клубную ночь в пространство свободы.",
      "In the 2010s Tbilisi became one of the most talked-about techno capitals, with Bassiani and KHIDI as spaces of freedom."
    ),
    sections: [
      sec(
        "Танцпол и политика",
        "В мае 2018 года после полицейских рейдов в Bassiani и Café Gallery у здания парламента прошёл многотысячный протест-рейв под лозунгом «We dance together, we fight together». Событие стало символом связи техно-культуры с гражданским активизмом в Грузии."
      ),
    ],
    genres: ["techno", "hard-techno"],
    sources: [wiki("Bassiani"), wiki("Tbilisi")],
  }),
  city({
    slug: "lisbon",
    country: "portugal",
    capital: true,
    name: t("Лиссабон", "Lisbon"),
    aliases: ["lisbon", "lisboa", "лиссабон"],
    coords: pt(38.7223, -9.1393),
    summary: t(
      "Лиссабон соединяет клубную классику Lux Frágil на набережной Тежу с afro-португальскими звуками пригородов — batida и kuduro-гибридами лейбла Príncipe.",
      "Lisbon links Lux Frágil on the Tagus waterfront with the Afro-Portuguese batida sounds of the Príncipe label."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "Лейбл Príncipe (с 2011 года) вывел на мировую сцену продюсеров из пригородов Лиссабона — DJ Marfox, DJ Nigga Fox и других — с ритмами, выросшими из ангольского kuduro. Lux Frágil работает на набережной с 1998 года."
      ),
    ],
    genres: ["afro-house", "house", "techno"],
    sources: [wiki("Príncipe_Discos"), wiki("Lux_Frágil")],
  }),
  city({
    slug: "belgrade",
    country: "serbia",
    capital: true,
    name: t("Белград", "Belgrade"),
    aliases: ["belgrade", "beograd", "белград", "београд"],
    coords: pt(44.7866, 20.4489),
    summary: t(
      "Ночной Белград известен клубами на сплавах — плавучих платформах на Саве и Дунае — и сильной техно-сценой бывших индустриальных пространств.",
      "Belgrade nightlife is famous for 'splavovi' river barges and a strong techno scene in former industrial spaces."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "Сочетание доступности, поздних закрытий и плотной локальной аудитории сделало Белград важной точкой балканского клубного маршрута. В 1990-х, в годы санкций и изоляции, электронные вечеринки были для многих формой эскапизма и сопротивления."
      ),
    ],
    genres: ["techno"],
    sources: [wiki("Belgrade"), wiki("Splav")],
  }),
  city({
    slug: "zagreb",
    country: "croatia",
    capital: true,
    name: t("Загреб", "Zagreb"),
    aliases: ["zagreb", "загреб"],
    coords: pt(45.815, 15.9819),
    summary: t(
      "Столица Хорватии — городская точка отсчёта для страны, побережье которой в 2010-х стало домом британских бутиковых фестивалей.",
      "Croatia's capital, the urban counterpart to a coast that hosted UK-born boutique festivals in the 2010s."
    ),
    sections: [
      sec(
        "Контекст",
        "Подробная история клубной сцены Загреба пока готовится редакцией. Информация уточняется."
      ),
    ],
    genres: ["techno", "house"],
    sources: [wiki("Zagreb")],
  }),
  city({
    slug: "stockholm",
    country: "sweden",
    capital: true,
    name: t("Стокгольм", "Stockholm"),
    aliases: ["stockholm", "стокгольм"],
    coords: pt(59.3293, 18.0686),
    summary: t(
      "Город Drumcode и «шведского техно» 1990-х, а также родина поколения поп-ориентированных продюсеров — от Eric Prydz до Swedish House Mafia и Avicii.",
      "Home of Drumcode and 1990s 'Swedish techno', and of Eric Prydz, Swedish House Mafia and Avicii."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "В 1996 году Adam Beyer основал в Стокгольме Drumcode — лейбл, сформировавший петлевое, перкуссионное и ударное шведское техно. В 2000–2010-х шведские продюсеры прогрессив-хауса определили звук фестивального EDM."
      ),
    ],
    genres: ["techno", "progressive-house"],
    sources: [wiki("Drumcode_Records"), wiki("Swedish_House_Mafia")],
  }),
  city({
    slug: "sao-paulo",
    country: "brazil",
    capital: true,
    name: t("Сан-Паулу", "São Paulo"),
    aliases: ["sao paulo", "são paulo", "сан-паулу", "sp"],
    coords: pt(-23.5505, -46.6333),
    summary: t(
      "Крупнейший мегаполис Южной Америки и её клубная столица: D-Edge, многолюдные уличные вечеринки и бразильский драм-н-бейс.",
      "South America's largest megacity and its club capital: D-Edge, street parties and Brazilian drum & bass."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "Сан-Паулу дал мировой сцене DJ Marky и поколение бразильских продюсеров drum & bass, а клуб D-Edge с 2003 года стал ориентиром для андеграундных площадок континента."
      ),
    ],
    genres: ["techno", "drum-and-bass", "house"],
    sources: [wiki("São_Paulo"), wiki("DJ_Marky")],
  }),
  city({
    slug: "buenos-aires",
    country: "argentina",
    capital: true,
    name: t("Буэнос-Айрес", "Buenos Aires"),
    aliases: ["buenos aires", "буэнос-айрес", "bsas"],
    coords: pt(-34.6037, -58.3816),
    summary: t(
      "Один из главных городов мирового прогрессив-хауса: многотысячные вечеринки с британскими и местными звёздами жанра, мастерство многочасовых сетов.",
      "One of the world capitals of progressive house, known for marathon sets."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "С конца 1990-х Буэнос-Айрес принимал Sasha, John Digweed и Hernán Cattáneo, а аргентинская публика стала известна особой преданностью мелодичным, медленно разворачивающимся сетам."
      ),
    ],
    genres: ["progressive-house", "melodic-house"],
    sources: [wiki("Buenos_Aires"), wiki("Hernán_Cattáneo")],
  }),
  city({
    slug: "cape-town",
    country: "south-africa",
    capital: true,
    name: t("Кейптаун", "Cape Town"),
    aliases: ["cape town", "kaapstad", "кейптаун"],
    coords: pt(-33.9249, 18.4241),
    summary: t(
      "Город южноафриканской house-культуры, глубокого и афро-хауса и летних open-air вечеринок у Столовой горы.",
      "A South African house city of deep and Afro house and summer open airs."
    ),
    sections: [
      sec(
        "Контекст",
        "Южноафриканская house-нация сосредоточена прежде всего в Йоханнесбурге, Претории и Дурбане; роль Кейптауна в этой истории редакция ещё уточняет."
      ),
    ],
    genres: ["deep-house", "afro-house"],
    sources: [wiki("Cape_Town")],
  }),
  city({
    slug: "melbourne",
    country: "australia",
    capital: true,
    name: t("Мельбурн", "Melbourne"),
    aliases: ["melbourne", "мельбурн"],
    coords: pt(-37.8136, 144.9631),
    summary: t(
      "Мельбурн — австралийская столица клубной музыки и родина танцевального стиля Melbourne Shuffle; здесь живёт Carl Cox.",
      "Australia's club-music capital and birthplace of the Melbourne Shuffle; home of Carl Cox."
    ),
    sections: [
      sec(
        "Уникальный вклад",
        "В рейвах конца 1980-х — начала 1990-х в Мельбурне сформировался танцевальный стиль Melbourne Shuffle. Город известен длинными after-party, например в клубе Revolver Upstairs в районе Прахран."
      ),
    ],
    genres: ["house", "techno"],
    sources: [wiki("Melbourne_shuffle"), wiki("Melbourne")],
  }),

  // ——— Другие города (фестивали, площадки, история) ———
  city({ slug: "manchester", country: "united-kingdom", name: t("Манчестер", "Manchester"), aliases: ["manchester", "madchester"], coords: pt(53.4808, -2.2426),
    summary: t("Город The Haçienda и «Мэдчестера», сегодня — The Warehouse Project.", "City of The Haçienda and 'Madchester'; today The Warehouse Project."),
    sections: [sec("Контекст", "The Haçienda (1982–1997), принадлежавший Factory Records и группе New Order, стал одним из главных клубов британского acid house. Манчестерская сцена конца 1980-х соединила инди-рок и рейв в явление «Madchester».")],
    genres: ["acid-house"], sources: [wiki("The_Haçienda"), wiki("Madchester")] }),
  city({ slug: "rotterdam", country: "netherlands", name: t("Роттердам", "Rotterdam"), aliases: ["rotterdam"], coords: pt(51.9244, 4.4777),
    summary: t("Портовый город, давший миру gabber в начале 1990-х (лейбл Rotterdam Records).", "Port city that gave the world gabber in the early 1990s."),
    genres: ["gabber", "hardcore"], sources: [wiki("Gabber")] }),
  city({ slug: "boom", country: "belgium", name: t("Бом", "Boom"), aliases: ["boom"], coords: pt(51.0877, 4.3667),
    summary: t("Город в провинции Антверпен, где в рекреационной зоне De Schorre проходит Tomorrowland.", "Town in Antwerp province; Tomorrowland takes place at De Schorre."),
    sources: [wiki("Boom,_Belgium")] }),
  city({ slug: "novi-sad", country: "serbia", name: t("Нови-Сад", "Novi Sad"), aliases: ["novi sad", "нови сад"], coords: pt(45.2671, 19.8335),
    summary: t("Город на Дунае, где в Петроварадинской крепости проходит EXIT.", "Danube city whose Petrovaradin Fortress hosts EXIT."), sources: [wiki("Novi_Sad")] }),
  city({ slug: "cluj-napoca", country: "romania", name: t("Клуж-Напока", "Cluj-Napoca"), aliases: ["cluj", "клуж"], coords: pt(46.7712, 23.6236),
    summary: t("Город в Трансильвании, принимающий фестиваль Untold.", "Transylvanian city hosting Untold."), sources: [wiki("Cluj-Napoca")] }),
  city({ slug: "constanta", country: "romania", name: t("Констанца (Мамая)", "Constanța (Mamaia)"), aliases: ["mamaia", "constanta", "мамая"], coords: pt(44.1598, 28.6348),
    summary: t("Черноморский курорт Мамая в Констанце — место фестиваля Sunwaves.", "Black Sea resort Mamaia, home of Sunwaves."), sources: [wiki("Mamaia")] }),
  city({ slug: "turin", country: "italy", name: t("Турин", "Turin"), aliases: ["torino", "turin", "турин"], coords: pt(45.0703, 7.6869),
    summary: t("Промышленный город на севере Италии, где в Parco Dora проходит Kappa FuturFestival.", "Industrial northern Italian city where Kappa FuturFestival is held."), sources: [wiki("Turin")] }),
  city({ slug: "montreal", country: "canada", name: t("Монреаль", "Montreal"), aliases: ["montreal", "montréal", "монреаль"], coords: pt(45.5019, -73.5674),
    summary: t("Город фестиваля цифрового творчества и электронной музыки MUTEK (с 2000 года).", "City of MUTEK, the festival of digital creativity and electronic music."), genres: ["experimental", "minimal-techno"], sources: [wiki("Mutek")] }),
  city({ slug: "las-vegas", country: "united-states", name: t("Лас-Вегас", "Las Vegas"), aliases: ["las vegas", "vegas", "лас-вегас"], coords: pt(36.1699, -115.1398),
    summary: t("Город казино-клубов эпохи EDM и фестиваля Electric Daisy Carnival (в Лас-Вегасе с 2011 года).", "EDM-era casino-club city and home of EDC since 2011."), sources: [wiki("Electric_Daisy_Carnival")] }),
  city({ slug: "mannheim", country: "germany", name: t("Мангейм", "Mannheim"), aliases: ["mannheim"], coords: pt(49.4875, 8.466),
    summary: t("Город Time Warp, который проходит в выставочном комплексе Maimarkt.", "Home of Time Warp at the Maimarkt complex."), sources: [wiki("Time_Warp_(festival)")] }),
  city({ slug: "frankfurt", country: "germany", name: t("Франкфурт-на-Майне", "Frankfurt"), aliases: ["frankfurt"], coords: pt(50.1109, 8.6821),
    summary: t("В 1980–90-х — центр EBM, раннего транса и клуба Omen Свена Вета.", "In the 1980s–90s a centre of EBM, early trance and Sven Väth's Omen club."), genres: ["trance", "ebm"], sources: [wiki("Sven_Väth")] }),
  city({ slug: "dusseldorf", country: "germany", name: t("Дюссельдорф", "Düsseldorf"), aliases: ["dusseldorf", "düsseldorf"], coords: pt(51.2277, 6.7735),
    summary: t("Город Kraftwerk и студии Kling Klang.", "City of Kraftwerk and the Kling Klang studio."), sources: [wiki("Kraftwerk")] }),
  city({ slug: "cologne", country: "germany", name: t("Кёльн", "Cologne"), aliases: ["köln", "koln", "cologne"], coords: pt(50.9375, 6.9603),
    summary: t("Студия электронной музыки WDR (1951) и лейбл Kompakt — две эпохи кёльнской электроники.", "The WDR electronic music studio (1951) and Kompakt label."), genres: ["minimal-techno", "experimental"], sources: [wiki("Studio_for_Electronic_Music_(WDR)"), wiki("Kompakt")] }),
  city({ slug: "munich", country: "germany", name: t("Мюнхен", "Munich"), aliases: ["munich", "münchen"], coords: pt(48.1351, 11.582),
    summary: t("Город студии Musicland, где Джорджо Мородер записывал «I Feel Love» с Донной Саммер (1977).", "Home of Musicland Studios, where 'I Feel Love' was produced."), genres: ["disco", "italo-disco"], sources: [wiki("I_Feel_Love")] }),
  city({ slug: "weeze", country: "germany", name: t("Веце", "Weeze"), aliases: ["weeze"], coords: pt(51.6267, 6.1967),
    summary: t("Город на западе Германии, где на территории бывшей авиабазы проходит Parookaville.", "Town where Parookaville is held on a former airbase."), sources: [wiki("Parookaville")] }),
  city({ slug: "kastellaun", country: "germany", name: t("Кастеллаун", "Kastellaun"), aliases: ["kastellaun", "pydna"], coords: pt(50.0697, 7.4417),
    summary: t("Город в Хунсрюке рядом с бывшей ракетной базой Pydna — местом Nature One.", "Hunsrück town near the former Pydna missile base, site of Nature One."), sources: [wiki("Nature_One")] }),
  city({ slug: "larz", country: "germany", name: t("Лерц", "Lärz"), aliases: ["lärz", "larz"], coords: pt(53.2833, 12.75),
    summary: t("Бывший военный аэродром в Мекленбурге, где проходит Fusion Festival.", "Former military airfield in Mecklenburg, home of Fusion Festival."), sources: [wiki("Fusion_Festival")] }),
  city({ slug: "biddinghuizen", country: "netherlands", name: t("Биддингхёйзен", "Biddinghuizen"), aliases: ["biddinghuizen"], coords: pt(52.4556, 5.6958),
    summary: t("Посёлок во Флеволанде, где проходит Defqon.1.", "Flevoland village where Defqon.1 is held."), sources: [wiki("Defqon.1_Festival")] }),
  city({ slug: "haarlemmermeer", country: "netherlands", name: t("Харлеммермер", "Haarlemmermeer"), aliases: ["haarlemmermeer", "hoofddorp"], coords: pt(52.3, 4.69),
    summary: t("Муниципалитет под Амстердамом, где Mysteryland проходит на бывшей территории Floriade.", "Municipality near Amsterdam; Mysteryland is held on the former Floriade site."), sources: [wiki("Mysteryland")] }),
  city({ slug: "hilvarenbeek", country: "netherlands", name: t("Хилваренбек", "Hilvarenbeek"), aliases: ["hilvarenbeek", "beekse bergen"], coords: pt(51.4858, 5.1375),
    summary: t("Муниципалитет в Северном Брабанте; в парке Beekse Bergen проходит летний Awakenings.", "North Brabant municipality where the Awakenings summer festival is held."), sources: [wiki("Awakenings_(festival)")] }),
  city({ slug: "daresbury", country: "united-kingdom", name: t("Дэрсбери", "Daresbury"), aliases: ["daresbury"], coords: pt(53.34, -2.63),
    summary: t("Деревня в Чешире, с 2006 года — место Creamfields.", "Cheshire village, home of Creamfields since 2006."), sources: [wiki("Creamfields")] }),
  city({ slug: "norfolk", country: "united-kingdom", name: t("Норфолк (Хоутон-холл)", "Norfolk (Houghton Hall)"), aliases: ["houghton", "norfolk"], coords: pt(52.83, 0.66),
    summary: t("Поместье Houghton Hall в Норфолке — место Houghton Festival.", "Houghton Hall estate in Norfolk, site of Houghton Festival."), sources: [wiki("Houghton_Hall")] }),
  city({ slug: "lincolnshire", country: "united-kingdom", name: t("Линкольншир", "Lincolnshire"), aliases: ["lincolnshire", "lincoln"], coords: pt(53.2307, -0.5406),
    summary: t("Графство на востоке Англии, где в лесу проходит Lost Village.", "East England county where Lost Village is held in woodland."), sources: [wiki("Lincolnshire")] }),
  city({ slug: "idanha-a-nova", country: "portugal", name: t("Иданья-а-Нова", "Idanha-a-Nova"), aliases: ["idanha-a-nova", "idanha"], coords: pt(39.9221, -7.2378),
    summary: t("Муниципалитет в центральной Португалии; на берегу водохранилища рядом проходит Boom Festival.", "Central Portuguese municipality near the Boom Festival lakeside site."), sources: [wiki("Boom_Festival")] }),
  city({ slug: "pula", country: "croatia", name: t("Пула", "Pula"), aliases: ["pula"], coords: pt(44.8666, 13.8496),
    summary: t("Город на Истрии; рядом, в форте Punta Christo, проходили Dimensions и Outlook.", "Istrian city; Dimensions and Outlook were held at nearby Fort Punta Christo."), sources: [wiki("Dimensions_Festival")] }),
  city({ slug: "playa-del-carmen", country: "mexico", name: t("Плайя-дель-Кармен", "Playa del Carmen"), aliases: ["playa del carmen", "playa"], coords: pt(20.6296, -87.0739),
    summary: t("Курорт на Карибском побережье Мексики, где с 2008 года проходил The BPM Festival.", "Caribbean resort that hosted The BPM Festival from 2008."), sources: [wiki("The_BPM_Festival")] }),
  city({ slug: "windsor", country: "canada", name: t("Виндзор", "Windsor"), aliases: ["windsor ontario", "windsor"], coords: pt(42.3149, -83.0364),
    summary: t("Канадский город через реку от Детройта; здесь вырос Richie Hawtin и был основан лейбл Plus 8.", "Across the river from Detroit; Richie Hawtin grew up here and Plus 8 was founded here."), sources: [wiki("Plus_8")] }),
  city({ slug: "goa", country: "india", name: t("Гоа", "Goa"), aliases: ["goa", "anjuna", "гоа"], coords: pt(15.2993, 74.124),
    summary: t("Пляжи Анджуны и Вагатора — колыбель гоа-транса конца 1980-х — начала 1990-х.", "Anjuna and Vagator beaches, cradle of Goa trance."), genres: ["goa-trance"], sources: [wiki("Goa_trance")] }),
  city({ slug: "durban", country: "south-africa", name: t("Дурбан", "Durban"), aliases: ["durban", "ethekwini"], coords: pt(-29.8587, 31.0218),
    summary: t("Родина gqom и город, где родился Black Coffee.", "Birthplace of gqom and of Black Coffee."), genres: ["gqom"], sources: [wiki("Gqom")] }),
  city({ slug: "johannesburg", country: "south-africa", name: t("Йоханнесбург", "Johannesburg"), aliases: ["johannesburg", "joburg", "jozi"], coords: pt(-26.2041, 28.0473),
    summary: t("Крупнейший город ЮАР; в его пригородах и в Претории в 2010-х сформировался amapiano.", "South Africa's largest city; amapiano emerged in its townships and Pretoria in the 2010s."), genres: ["amapiano", "deep-house"], sources: [wiki("Amapiano")] }),
  city({ slug: "split", country: "croatia", name: t("Сплит", "Split"), aliases: ["split"], coords: pt(43.5081, 16.4402),
    summary: t("Город на Далматинском побережье, где проходит Ultra Europe.", "Dalmatian city hosting Ultra Europe."), sources: [wiki("Ultra_Europe")] }),
  city({ slug: "brighton", country: "united-kingdom", name: t("Брайтон", "Brighton"), aliases: ["brighton"], coords: pt(50.8225, -0.1372),
    summary: t("Приморский город Fatboy Slim и лейбла Skint.", "Seaside home of Fatboy Slim and Skint Records."), genres: ["big-beat"], sources: [wiki("Fatboy_Slim")] }),
  city({ slug: "sheffield", country: "united-kingdom", name: t("Шеффилд", "Sheffield"), aliases: ["sheffield"], coords: pt(53.3811, -1.4701),
    summary: t("Город Warp Records (1989) и звучания bleep techno.", "City of Warp Records and bleep techno."), genres: ["idm", "techno"], sources: [wiki("Warp_(record_label)")] }),
  city({ slug: "ozora", country: "hungary", name: t("Озора", "Ozora"), aliases: ["ozora"], coords: pt(46.75, 18.4),
    summary: t("Деревня в медье Тольна, рядом с которой проходит фестиваль O.Z.O.R.A.", "Village in Tolna County near the O.Z.O.R.A. festival site."), sources: [wiki("Ozora")] }),
  city({ slug: "braintree", country: "united-kingdom", name: t("Брейнтри", "Braintree"), aliases: ["braintree", "essex"], coords: pt(51.878, 0.5536),
    summary: t("Город в Эссексе, где в 1990 году образовалась The Prodigy.", "Essex town where The Prodigy formed in 1990."), sources: [wiki("The_Prodigy")] }),
];
