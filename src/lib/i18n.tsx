import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "lv";

type Dict = Record<string, string>;

const en: Dict = {
  // header
  "nav.projects": "Projects",
  "nav.tags": "Tags",
  "nav.guidelines": "Guidelines",
  "nav.about": "About",
  "nav.newProject": "New Project",
  "nav.admin": "Admin",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",

  // home / hero
  "home.kicker": "Est. MMXXVI · The Amateur Dubbing Gazette",
  "home.title1": "Cast your voice.",
  "home.title2": "Dub the world.",
  "home.lead": "DubStage is where aspiring voice actors take their first steps — practice on real scenes, audition for amateur projects, and build the reel that launches your dubbing career.",
  "home.searchPlaceholder": "Search projects...",
  "home.search": "Search",
  "home.stat.projects": "Projects",
  "home.stat.tags": "Tags",
  "home.stat.openCasts": "Open casts",
  "home.browseTags": "Browse tags",
  "home.clearFilter": "Clear filter",
  "home.latest": "Latest projects",
  "home.resultsFor": "Results for",
  "home.tagged": "Tagged",
  "home.match.title": "Matched by title",
  "home.match.tag": "No title match — showing tag matches",
  "home.match.fuzzy": "No exact match — showing closest results",
  "home.empty": "No projects yet. Be the first to post one.",
  "home.startProject": "Start a project",

  // about
  "about.kicker": "Our Story",
  "about.title": "About DubStage",
  "about.lead": "DubStage is a community for amateur dubbing — a place where aspiring voice actors take their first real steps toward a career behind the mic.",
  "about.p2": "Most professional dub artists started by recording in their bedrooms, practicing scenes off YouTube, and looking for anyone willing to give them feedback. DubStage formalises that journey: a stage to perform on, a script to read from, and an audience that actually listens.",
  "about.p3": "We're not a casting agency, and we're not chasing studio-grade output. We're the rehearsal room — the place to mess up, try a take three more times, and post it anyway.",
  "about.pillar.practice": "Practice",
  "about.pillar.practice.body": "Real scenes, scripts, and characters to dub.",
  "about.pillar.audition": "Audition",
  "about.pillar.audition.body": "Submit demos to community projects and get heard.",
  "about.pillar.portfolio": "Portfolio",
  "about.pillar.portfolio.body": "Build a public reel that shows your range.",
  "about.who": "Who it's for",
  "about.who.1": "Beginners who've never recorded a line and want a starting point",
  "about.who.2": "Hobbyists looking to sharpen their craft with regular practice",
  "about.who.3": "Aspiring pros building a public portfolio before approaching agencies",
  "about.who.4": "Directors and writers who want to cast amateur talent for passion projects",
  "about.cta": "Read the community guidelines →",

  // guidelines
  "gl.kicker": "House Rules",
  "gl.title": "Community Guidelines",
  "gl.intro": "DubStage works because beginners feel safe enough to post a first take. These rules protect that. By posting a project, comment, or audition you agree to follow them.",
  "gl.s1.title": "1. Be encouraging",
  "gl.s1.1": "Assume the person on the other end is new. Lead with what worked.",
  "gl.s1.2": "Critique the performance, never the person.",
  "gl.s1.3": "Specifics over vibes — \"your pacing rushed at 0:42\" beats \"this sucks\".",
  "gl.s2.title": "2. Keep it constructive",
  "gl.s2.1": "Auditions are practice. Don't pile on if a take isn't great.",
  "gl.s2.2": "If you can't say it kindly, don't post it. The report button exists for a reason.",
  "gl.s2.3": "Directors: when you close a project, thank the people who auditioned.",
  "gl.s3.title": "3. Respect copyright",
  "gl.s3.1": "Only upload clips and scripts you have the right to share, or short fair-use excerpts for practice.",
  "gl.s3.2": "Credit original creators in your project description.",
  "gl.s3.3": "If a rights-holder requests removal, we'll honor it.",
  "gl.s3.4": "Never monetize a dub of someone else's work without permission.",
  "gl.s4.title": "4. Zero tolerance",
  "gl.s4.intro": "The following result in immediate removal and a ban:",
  "gl.s4.1": "Harassment, hate speech, or targeted attacks",
  "gl.s4.2": "Sexual content involving minors, or content sexualising real people without consent",
  "gl.s4.3": "Doxxing, threats, or sharing private information",
  "gl.s4.4": "Voice impersonation intended to deceive (deepfake-style misuse)",
  "gl.s4.5": "Spam, scams, or off-platform recruitment for paid work disguised as auditions",
  "gl.s5.title": "5. Posting & auditioning",
  "gl.s5.1": "Tag your project accurately (genre, language, difficulty).",
  "gl.s5.2": "Mark projects open only if you'll actually review auditions.",
  "gl.s5.3": "Submit your own voice. AI-generated voice clones are not allowed in auditions.",
  "gl.s5.4": "Keep demos under a few minutes — quality over length.",
  "gl.s6.title": "6. Reporting & moderation",
  "gl.s6.1": "Use the report button on any project, comment, or profile that breaks these rules.",
  "gl.s6.2": "Moderators review reports and may remove content or ban accounts without prior notice.",
  "gl.s6.3": "Repeated minor violations escalate to a ban just like a major one.",
  "gl.updated": "Last updated · MMXXVI",
};

const lv: Dict = {
  // header
  "nav.projects": "Projekti",
  "nav.tags": "Birkas",
  "nav.guidelines": "Vadlīnijas",
  "nav.about": "Par mums",
  "nav.newProject": "Jauns projekts",
  "nav.admin": "Administrācija",
  "nav.signIn": "Pieslēgties",
  "nav.signOut": "Iziet",

  // home
  "home.kicker": "Dib. MMXXVI · Amatieru dublēšanas avīze",
  "home.title1": "Atrodi savu balsi.",
  "home.title2": "Dublē pasauli.",
  "home.lead": "DubStage ir vieta, kur topošie balss aktieri sper pirmos soļus — vingrinies ar reālām ainām, piesakies amatieru projektiem un veido portfolio, kas aizsāk tavu dublēšanas karjeru.",
  "home.searchPlaceholder": "Meklēt projektus...",
  "home.search": "Meklēt",
  "home.stat.projects": "Projekti",
  "home.stat.tags": "Birkas",
  "home.stat.openCasts": "Atvērti uzklausījumi",
  "home.browseTags": "Pārlūkot birkas",
  "home.clearFilter": "Notīrīt filtru",
  "home.latest": "Jaunākie projekti",
  "home.resultsFor": "Rezultāti vaicājumam",
  "home.tagged": "Ar birku",
  "home.match.title": "Atrasts pēc nosaukuma",
  "home.match.tag": "Nav nosaukuma sakritības — rāda birku sakritības",
  "home.match.fuzzy": "Nav precīzas sakritības — rāda tuvākos rezultātus",
  "home.empty": "Vēl nav projektu. Esi pirmais, kas publicē!",
  "home.startProject": "Sākt projektu",

  // about
  "about.kicker": "Mūsu stāsts",
  "about.title": "Par DubStage",
  "about.lead": "DubStage ir amatieru dublēšanas kopiena — vieta, kur topošie balss aktieri sper pirmos reālos soļus ceļā uz karjeru aiz mikrofona.",
  "about.p2": "Lielākā daļa profesionālo dublētāju sākuši, ierakstoties savās guļamistabās, vingrinoties ar YouTube ainām un meklējot kādu, kurš sniegtu atsauksmi. DubStage šo ceļu padara skaidrāku: skatuve, kur uzstāties, scenārijs, ko lasīt, un publika, kas patiešām klausās.",
  "about.p3": "Mēs neesam aktieru aģentūra un nedzenamies pēc studijas kvalitātes. Mēs esam mēģinājumu telpa — vieta, kur kļūdīties, atkārtot dublējumu vēl trīs reizes un tomēr to publicēt.",
  "about.pillar.practice": "Vingrinies",
  "about.pillar.practice.body": "Reālas ainas, scenāriji un tēli, ko dublēt.",
  "about.pillar.audition": "Piesakies",
  "about.pillar.audition.body": "Iesniedz demo kopienas projektiem un ļauj sevi dzirdēt.",
  "about.pillar.portfolio": "Portfolio",
  "about.pillar.portfolio.body": "Veido publisku ierakstu krājumu, kas parāda tavu diapazonu.",
  "about.who": "Kam tas paredzēts",
  "about.who.1": "Iesācējiem, kas nekad nav ierakstījuši nevienu rindiņu un meklē sākumpunktu",
  "about.who.2": "Hobija entuziastiem, kuri vēlas regulāri pilnveidot prasmes",
  "about.who.3": "Topošiem profesionāļiem, kas veido portfolio pirms aģentūru uzrunāšanas",
  "about.who.4": "Režisoriem un scenāristiem, kas meklē amatieru talantus aizraušanās projektiem",
  "about.cta": "Lasīt kopienas vadlīnijas →",

  // guidelines
  "gl.kicker": "Mājas noteikumi",
  "gl.title": "Kopienas vadlīnijas",
  "gl.intro": "DubStage darbojas, jo iesācēji jūtas pietiekami droši, lai publicētu pirmo dublējumu. Šie noteikumi to aizsargā. Publicējot projektu, komentāru vai uzklausījumu, tu piekrīti tos ievērot.",
  "gl.s1.title": "1. Esi atbalstošs",
  "gl.s1.1": "Pieņem, ka otrā galā ir iesācējs. Sāc ar to, kas izdevies.",
  "gl.s1.2": "Kritizē sniegumu, nekad personu.",
  "gl.s1.3": "Konkrēti ieteikumi labāki par sajūtām — \"tempu pasteidzini 0:42\" pārspēj \"šis ir slikti\".",
  "gl.s2.title": "2. Esi konstruktīvs",
  "gl.s2.1": "Uzklausījumi ir vingrinājumi. Nekrāj kritiku, ja dublējums nav lielisks.",
  "gl.s2.2": "Ja nevari pateikt laipni, nepublicē. Ziņošanas poga eksistē ar iemeslu.",
  "gl.s2.3": "Režisori: aizverot projektu, pateicieties tiem, kas pieteicās.",
  "gl.s3.title": "3. Ievēro autortiesības",
  "gl.s3.1": "Augšupielādē tikai tos klipus un scenārijus, ko tev ir tiesības dalīties, vai īsus godīgas izmantošanas fragmentus vingrinājumiem.",
  "gl.s3.2": "Projekta aprakstā piemini oriģinālos autorus.",
  "gl.s3.3": "Ja tiesību īpašnieks lūdz noņemt, mēs to ievērosim.",
  "gl.s3.4": "Nekad necenties pelnīt no svešdarba dublējuma bez atļaujas.",
  "gl.s4.title": "4. Nulles tolerance",
  "gl.s4.intro": "Sekojošais noved pie tūlītējas noņemšanas un bloķēšanas:",
  "gl.s4.1": "Aizskaršana, naida runa vai mērķēti uzbrukumi",
  "gl.s4.2": "Seksuāls saturs ar nepilngadīgajiem vai reālu cilvēku seksualizēšana bez piekrišanas",
  "gl.s4.3": "Personas datu izpaušana, draudi vai privātas informācijas izplatīšana",
  "gl.s4.4": "Balss imitācija ar mērķi maldināt (deepfake-veida ļaunprātīga izmantošana)",
  "gl.s4.5": "Surogātpasts, krāpniecība vai slēpta apmaksāta darba meklēšana uzklausījumu aizsegā",
  "gl.s5.title": "5. Publicēšana un uzklausījumi",
  "gl.s5.1": "Atzīmē projektu precīzi (žanrs, valoda, sarežģītība).",
  "gl.s5.2": "Atzīmē projektus kā atvērtus tikai tad, ja patiešām pārskatīsi pieteikumus.",
  "gl.s5.3": "Iesniedz pats savu balsi. AI ģenerēti balss kloni uzklausījumos nav atļauti.",
  "gl.s5.4": "Demo glabā īsus — kvalitāte pār garumu.",
  "gl.s6.title": "6. Ziņošana un moderācija",
  "gl.s6.1": "Izmanto ziņošanas pogu jebkuram projektam, komentāram vai profilam, kas pārkāpj šos noteikumus.",
  "gl.s6.2": "Moderatori pārskata ziņojumus un var noņemt saturu vai bloķēt kontus bez iepriekšēja brīdinājuma.",
  "gl.s6.3": "Atkārtoti nelieli pārkāpumi noved pie bloķēšanas tāpat kā nopietns pārkāpums.",
  "gl.updated": "Pēdējoreiz atjaunots · MMXXVI",
};

const dictionaries: Record<Lang, Dict> = { en, lv };

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (stored === "en" || stored === "lv") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
