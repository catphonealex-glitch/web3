---
title: "DubStage projekta dokumentācija: dublēšanas projektu sistēma"
sidebarTitle: "Projekta dokumentācija (LV)"
description: "Paskaidrojošais raksts par DubStage dublēšanas projektu funkcionalitāti — ievads, uzdevuma nostādne, datu modeļēšana, datu bāzes izstrāde, drošība un testēšana."
---

## Ievads

Mūsdienās balss aktiermāksla kļūst arvien populārāka — fanu dublējumi, audio drāmas un īsfilmas tiek veidotas gan profesionālos, gan amatieru līmenī. Tomēr iesācējiem, kuri vēlas apgūt dublēšanu, trūkst pieejamas vides, kur prakticities uz reālām ainām, saņemt atsauksmes un veidot portfolio. Tradicionālās kastinga aģentūras un nozares platformas ir orientētas uz profesionāļiem, tāpēc jaunpienācējiem tas rada „vārtsargu” barjeru.

Tirgus izpēte liecina, ka līdzīgās plaformas (piemēram, visāda veida demo bibliotēkas un socivālā mediji) cieš no sākotnējām problēmām: sarežģīta lietotāja saskarne, ierobežota funkcionalitāte dublēšanas specifikā (nav skripta sinhronizācijas ar video), valodas ierobežojumi un slēgtas pieteikšanās sistēmas.

DubStage projektu sistēma risina šo problēmu, piedāvājot atvērtu kopienas platformu, kur jebkurš lietotājs var publicēt dublēšanas projektu, pievienot video klipu un skriptu, kā arī saņemt pieteikumus no iesācējiem draudzīgā vidē. Galalietotājs — topošais balss aktieris — iegūst praktisku pieredzi, savukārt projekta veidotājs — ieinteresētu sastāvu.

## 1. Uzdevuma nostādne

Projekta uzdevums ir izveidot un nodrošināt tiešsaistes vietni, kurā lietotāji var publicēt dublēšanas projektus, augšupielādēt video klipus un skriptus, kā arī iesniegt un pārvaldīt balss pieteikumus. Šobrīd nav pieejamas platformas, kas vienlaikus piedāvātu kvalitatīvu projektu pārvaldību un atvērtu pieteikšanās procesu iesācējiem, tādēļ šīs sistēmas izveide ir aktuāla un lietderīga.

Datu bāzē tiks glabāta informācija par lietotājiem (segvārds, e-pasts, parole, biogrāfija, loma), projektiem (nosaukums, apraksts, video, skripts, statuss, izveides datums), tagiem (žanrs, valoda, grūtības līmenis), pieteikumiem (audio demo, piezīme, iesniedzējs) un komentāriem.

Sistēmas galvenās funkcionalitātes ietver:

- projektu publicēšanu, rediģēšanu un statusa mainīšanu (atvērts/slēgts);
- video klipu un skriptu (`.lrc` vai `.txt`) augšupielādi un karaoke sinhronizāciju;
- balss pieteikumu iesniegšanu atvērtiem projektiem;
- meklēšanu pēc nosaukuma vai taga ar pielāgotu atbilstības kārtošanu;
- projektu filtrēšanu pēc taga;
- komentāru pievienošanu un satura ziņošanu moderatoriem.

### 1.1. Sistēmas lietotāji un to mijiedarbība ar sistēmu

Izstrādātajā sistēmā ir definētas četras lietotāju lomas: **viesis**, **reģistrēts lietotājs**, **moderators** un **administrators**. Katrai lomai ir pieejama atšķirīga funkcionalitāte.

- **Viesis** ir nereģistrēts lietotājs. Viņš var pārlūkot projektu plūsmu, skatīties video, lasīt skriptus un komentārus, kā arī meklēt projektus pēc nosaukuma vai taga. Lai iesniegtu pieteikumu vai pievienotu komentāru, vieš tiek aicināts reģistrēties.
- **Reģistrēts lietotājs** var publicēt savus projektus, iesniegt balss pieteikumus atvērtos projektos, rediģēt profilu, pievienot komentārus un ziņot par neatbilstošu saturu. Darbība „iesniegt pieteikumu” _iekļauj_ (`include`) autentifikāciju, jo to nevar veikt nereģistrēts lietotājs. Darbību „publicēt projektu” _paplašina_ (`extend`) opcija „pievienot skriptu”, jo skripts nav obligāts.
- **Moderators** papildus var paslēpt projektus, komentārus un profilus, kas pārkāpj kopienas vadlīnijas.
- **Administrators** pārvalda visu sistēmu, ieskaitot lietotāju lomu piešķiršanu un satura pilnīgu dzēšanu.

Lietošanas gadījumu (Use Case) diagramma jāiekļauj 1. pielikumā.

### 1.2. Uzdevuma risināšanas līdzekļu izvēles pamatojums

Sistēmas izstrādē izmantoti šādi rīki un tehnoloģijas:

- **Programmēšanas valodas**: HTML5, CSS3, JavaScript (ES2022), TypeScript 5.4 — klienta puses izstrādei; Node.js 20 LTS — servera puses loģikai. HTML5 un CSS3 ir nozares standarts strukturēta un stilizēta tīmekļa satura veidošanai, savukārt TypeScript tika izvēlēts statiskās tipizācijas dēļ, kas ļauj atklāt kļūdas jau kompilēšanas laikā un padara lielāku kodu bāzi labāk uzturamu. Node.js 20 LTS nodrošina ilgtermiņa atbalstu un vienotu JavaScript vidi gan klientā, gan serverī, kas paātrina izstrādi un samazina konteksta pārslēgšanos.
- **Ietvars**: Next.js 14 — izvēlēts, jo nodrošina servera puses renderēšanu (SSR) un statisko ģenerēšanu (SSG), kas uzlabo lapas ielādes ātrumu un SEO rezultātus. Iebūvētā App Router un API maršrutu sistēma ļauj vienā projektā apvienot frontend un backend loģiku, kas ir īpaši izdevīgi nelielai izstrādes komandai. Turklāt cieša integrācija ar React 18 servera komponentiem samazina klienta puses JavaScript apjomu.
- **Datu bāzes pārvaldības sistēma**: PostgreSQL 16 — izvēlēta, jo nodrošina pilnu ACID atbalstu un spēcīgu datu integritāti, kas ir kritiski svarīgi lietotāju projektiem un pieteikumiem. Plašais datu tipu klāsts (`JSONB`, `enum`, pilntekstu meklēšana) ļauj efektīvi realizēt gan strukturētus, gan daļēji strukturētus datus bez papildu NoSQL risinājuma. PostgreSQL ir arī atvērtā koda risinājums ar lielu kopienu, kas mazina piegādātāja atkarību.
- **Stilizēšanas bibliotēka**: Tailwind CSS 3.4 — izvēlēta, jo utilīta klašu pieeja ļauj ātri veidot konsekventu dizainu, neradot nelietota CSS uzkrāšanos. Iebūvētā dizaina sistēma (atstarpes, krāsas, fonts) nodrošina vizuālu vienotību visā lietotnē un atvieglo responsīvo izkārtojumu. JIT kompilators ģenerē tikai faktiski izmantotās klases, kas samazina galīgā CSS faila izmēru.
- **Mediju glabāšana**: S3 saderīga objektu glabātava video un audio failiem — izvēlēta, jo lielu binārā satura failu glabāšana datu bāzē būtu neefektīva un dārga. Objektu glabātava nodrošina horizontālu mērogojamību, augstu pieejamību un iespēju piegādāt failus tieši caur CDN. S3 saderīgais API ļauj viegli mainīt piegādātāju (AWS, Cloudflare R2, MinIO) bez koda izmaiņām.
- **Autentifikācija**: NextAuth.js ar bcrypt paroļu šifrēšanai — NextAuth.js ir izvēlēts, jo tas dziļi integrējas ar Next.js un atbalsta gan e-pasta/paroles, gan OAuth piegādātājus bez nepieciešamības rakstīt sesiju pārvaldību no nulles. Bcrypt tika izvēlēts paroļu jaucējfunkcijai tā tīšās lēnuma un iebūvētā sāls dēļ, kas padara brute-force un vārdnīcas uzbrukumus dārgus. Kombinācija atbilst OWASP rekomendācijām autentifikācijas drošībai.
- **Programmatūra**: Visual Studio Code 1.89, Git 2.45, Figma dizaina maketiem. VS Code tika izvēlēts plašā paplašinājumu ekosistēmas un iebūvētā TypeScript atbalsta dēļ, kas paātrina ikdienas izstrādi. Git nodrošina sadalītu versiju kontroli un drošu sadarbību caur atzariem un pull pieprasījumiem. Figma tika izvēlēta, jo tā darbojas pārlūkprogrammā, atbalsta reāllaika sadarbību un ļauj eksportēt dizaina marķierus tieši Tailwind konfigurācijā.

## 2. Datu modeļēšana

### 2.1. Objektorientēts konceptuālais datu modelis

Sistēmā informācija organizēta, izmantojot objektorientētu pieeju. Galvenās klases un to savstarpējās attiecības:

- **Lietotājs** — satur segvārdu, e-pastu, paroli, lomu, biogrāfiju; metodes: `pieslegties()`, `registreties()`, `redigetProfilu()`. Lietotājs ir centrālā klase, no kuras izriet lielākā daļa darbību sistēmā — viņš var būt gan projekta autors, gan pieteikuma iesniedzējs, gan komentāra autors. Lomas lauks nosaka, kādas papildu metodes (piemēram, moderācija) ir pieejamas konkrētam objektam.
- **Projekts** — satur nosaukumu, aprakstu, statusu, izveides datumu; metodes: `mainitStatusu()`, `pievienotTagu()`, `dzest()`. Klase **Projekts** ir saistīta ar klasi **Lietotājs** asociācijā „pieder” (1..1 no projekta puses, 1..m no lietotāja puses), jo katrs projekts vienmēr pieder tieši vienam autoram, bet autors var izveidot vairākus projektus. Projekts arī apkopo zem sevis video, skriptu, pieteikumus un komentārus.
- **VideoKlips** — satur faila ceļu, ilgumu un MIME tipu. Klase atrodas **kompozīcijā** ar **Projektu**, kas nozīmē, ka video klips nevar pastāvēt bez sava projekta — projekta dzēšana automātiski iznīcina arī video klipa objektu. Šī stingrā saistība atspoguļo to, ka video ir dublēšanas projekta neatņemama sastāvdaļa.
- **Skripts** — satur teksta saturu vai `.lrc` laika marķējumus; neobligāts. Klase atrodas **agregācijā** ar **Projektu**, jo skripts loģiski pieder projektam, bet var pastāvēt arī patstāvīgi (piemēram, ja autors vēlāk izvēlas to atkārtoti izmantot citā projektā). Atšķirībā no video, projekta dzēšana neiznīcina skriptu automātiski.
- **Pieteikums** — satur audio demo, piezīmi, iesniedzēja atsauci. Pieteikums ir saistīts ar **Projektu** asociācijā „attiecas uz” (1..m — vienam projektam var būt daudzi pieteikumi) un ar **Lietotāju** asociācijā „iesniedzis” (1..m — viens lietotājs var iesniegt daudzus pieteikumus dažādiem projektiem). Tādējādi **Pieteikums** kalpo kā asociatīva klase starp lietotāju un projektu.
- **Tags** — satur nosaukumu un kategoriju (žanrs, valoda, grūtības līmenis). Klase atrodas **daudzi pret daudziem** asociācijā ar **Projektu**, kas konceptuālajā modelī tiek attēlota kā tieša saite ar kardinalitāti `m..m`, bet fiziskajā modelī tiek realizēta caur starpklases objektu. Tas ļauj vienu tagu izmantot daudzos projektos un vienam projektam piešķirt vairākus tagus.
- **Komentārs** — satur teksta saturu un izveides laiku. Klase ir saistīta gan ar **Projektu** (1..m — projektam daudzi komentāri), gan ar **Lietotāju** (1..m — lietotājs raksta daudzus komentārus), un darbojas līdzīgi kā **Pieteikums** — kā asociatīva klase, kas savieno divas galvenās entītijas un fiksē mijiedarbības faktu.

Klašu diagramma jāiekļauj 2. pielikumā.

### 2.2. Entītiju relāciju datu modelis

ER diagramma Pitera Čena notācijā sastāv no 7 entītijām: `Lietotajs`, `Projekts`, `VideoKlips`, `Skripts`, `Pieteikums`, `Tags`, `Komentars`. Zemāk aprakstītas visas modeļa relācijas kopā ar to kardinalitāti un pamatojumu.

- **Lietotajs — veido — Projekts (1..m)**. Viens lietotājs var izveidot vairākus projektus, taču katrs projekts pieder tieši vienam autoram. Šī relācija nodrošina, ka sistēmā vienmēr ir skaidri zināms, kurš lietotājs ir atbildīgs par projekta saturu, un ļauj parādīt autora visus projektus profila lapā.
- **Projekts — satur — VideoKlips (1..1)**. Katram projektam ir tieši viens video klips, un katrs video klips pieder tieši vienam projektam. Šī obligātā viens-pret-vienu relācija atspoguļo to, ka dublēšanas projekta pamatā vienmēr ir tieši viens video materiāls, ar kuru sinhronizēties.
- **Projekts — satur — Skripts (1..0..1)**. Projektam var būt nulle vai viens skripts, jo dažreiz autors publicē tikai video bez teksta sinhronizācijas. Neobligātās relācijas raksturs ļauj iesācējiem ātri publicēt projektu un pievienot skriptu vēlāk.
- **Projekts — saņem — Pieteikums (1..m)**. Viens projekts var saņemt vairākus pieteikumus, bet katrs pieteikums attiecas tikai uz vienu projektu. Šī relācija ir kastinga procesa pamatā — tā ļauj autoram vienuviet salīdzināt visus konkrētā projekta pieteikumus.
- **Lietotajs — iesniedz — Pieteikums (1..m)**. Viens lietotājs var iesniegt vairākus pieteikumus dažādiem projektiem, bet katrs pieteikums pieder tieši vienam iesniedzējam. Šādā veidā tiek nodrošināta pieteikuma autorība un iespēja parādīt lietotāja pieteikumu vēsturi viņa profilā.
- **Projekts — marķēts ar — Tags (m..m → starptabula `ProjektsTags`)**. Viens projekts var būt saistīts ar vairākiem tagiem, un viens tags var attiekties uz vairākiem projektiem. Daudzi-pret-daudziem relācija tiek normalizēta, izmantojot starptabulu `ProjektsTags`, kas glabā tikai svešās atslēgas — tas atbilst 3NF un ļauj efektīvi filtrēt projektus pēc taga.
- **Projekts — saņem — Komentars (1..m)**. Vienam projektam var būt daudzi komentāri, bet katrs komentārs pieder tieši vienam projektam. Šī relācija ļauj diskusijai noritēt projekta kontekstā, neradot globālu komentāru plūsmu.
- **Lietotajs — raksta — Komentars (1..m)**. Viens lietotājs var rakstīt daudzus komentārus, bet katram komentāram ir tieši viens autors. Tas nodrošina komentāra atbildību un iespēju moderatoram vai administratoram veikt darbības ar konkrēta lietotāja saturu.

## 3. Datu bāzes izstrāde un drošības nodrošināšana

### 3.1. Datu glabāšanas fiziskā struktūra

Datu bāze sastāv no 8 tabulām. Tabulas, kas nav saistītas ar citām (piemēram, `sistemas_zurnals`), šai shēmai netiek pievienotas.

#### Tabulas `projects` struktūra

| Nr. | Nosaukums | Tips | Garums | Piezīme |
| --- | --- | --- | --- | --- |
| 1 | id | bigint |  | projekta kods, primārā atslēga (PK) |
| 2 | owner\_id | bigint |  | ārējā atslēga (FK) uz `users.id` |
| 3 | title | varchar | 120 | projekta nosaukums |
| 4 | description | text |  | projekta apraksts |
| 5 | status | enum |  | `open` vai `closed`, pēc noklusējuma `open` |
| 6 | video\_url | varchar | 255 | atsauce uz video objektu glabātavā |
| 7 | script\_url | varchar | 255 | neobligāts, atsauce uz `.lrc`/`.txt` failu |
| 8 | created\_at | timestamp |  | izveides laiks |
| 9 | updated\_at | timestamp |  | pēdējās atjaunināšanas laiks |

```sql
CREATE TABLE IF NOT EXISTS projects (
  id          BIGSERIAL PRIMARY KEY,
  owner_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  video_url   VARCHAR(255) NOT NULL,
  script_url  VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
```

#### 3.1.1. Datu integritātes nodrošināšana

- **NOT NULL** — obligātajiem laukiem (`title`, `description`, `video_url`).
- **UNIQUE** — lietotāja `email` un `nickname`.
- **CHECK** — `status` drīkst saturēt tikai `open` vai `closed`.
- **DEFAULT** — `status` pēc noklusējuma ir `open`; `created_at` automātiski tiek iestatīts.
- **Indeksi** uz `owner_id` un `status` paātrina filtrēšanu projektu plūsmā.
- **Trigeris** `set_updated_at` automātiski atjaunina `updated_at` lauku pie katras `UPDATE` darbības.

#### 3.1.2. Datu bāzes atbilstības pamatojums 3NF prasībām

Datu bāze atbilst trešās normālformas (3NF) prasībām: katra tabula satur tikai atomāras vērtības, visi atribūti ir pilnībā atkarīgi no primārās atslēgas, un nav transitīvu atkarību. Tagi un projekti ir atdalīti, izmantojot starptabulu `project_tags`, lai novērstu daudzi-pret-daudziem relāciju.

Izņēmums: tabulā `users` lauks `role` (`user`, `mod`, `admin`) nav izdalīts atsevišķā tabulā veiktspējas un projekta mēroga dēļ — lomu kopā ir fiksēta un nēkotnē neplošas pīldzināšanos.

### 3.2. Drošības mehānismi un piekļuves kontrole

#### 3.2.1. Lietotāju autentifikācija

Lietotājs ievada e-pasta adresi un paroli pieslēgšanās formā. Klienta puse validē formātu (e-pasta sintakse, paroles minimālais garums 6 simboli), savukārt servera puse pārbauda datus pret datu bāzi. Klienta puses validācija ir paredzēta tikai lietotāja ērtībai — tā nodrošina ātru atgriezenisko saiti, bet nekādā gadījumā netiek uzskatīta par drošības robežu, jo to var apiet, mainot pieprasījumu tieši. Tāpēc visas pārbaudes tiek dublētas serverī, kur tās nevar manipulēt.

Paroles tiek glabātas, izmantojot **bcrypt** hash algoritmu ar 12 izmaksu faktoru — izvēlēts, jo bcrypt ir lēnāks par SHA-256 un tāpēc noturīgāks pret brute-force uzbrukumiem. 12 izmaksu faktors nozīmē 2¹² hash iterācijas, kas mūsdienu aparatūrai prasa aptuveni 250 ms uz vienu pārbaudi — pietiekami ātri reālai lietošanai, bet pārāk lēni masveida uzbrukumiem. Bcrypt automātiski ģenerē unikālu sāls vērtību katrai parolei, kas pasargā pret iepriekš sagatavotām varavīksnes tabulām.

Pēc veiksmīgas autentifikācijas sistēma izveido sesijas tokenu (JWT), kas tiek glabāts kā HTTP-only sīkdatne, lai mazinātu XSS risku. HTTP-only karogs neļauj JavaScript kodam piekļūt sīkdatnei caur `document.cookie`, kas nozīmē, ka pat tad, ja uzbrucējam izdodas ievadīt ļaunprātīgu skriptu, viņš nevar nozagt sesiju. Papildus tiek izmantoti `SameSite=Lax` un `Secure` karogi, lai aizsargātu pret CSRF uzbrukumiem un nodrošinātu pārraidi tikai caur HTTPS.

#### 3.2.2. Autorizācija un piekļuves tiesību pārvaldība

Pēc autentifikācijas sistēma nosaka lietotāja lomu no datu bāzes lauka `users.role`. Loma tiek iekļauta JWT tokenā parakstītā veidā, lai izvairītos no atkārtotām datu bāzes pārbaudēm pie katra pieprasījuma — paraksts garantē, ka klients to nevar mainīt. Zemāk uzskaitītas visas funkcijas, kas pieejamas katrai lomai.

**Viesis** (nereģistrēts lietotājs):

- pārlūkot projektu plūsmu galvenajā lapā;
- skatīties video klipus un lasīt skriptus;
- lasīt komentārus zem projektiem;
- meklēt projektus pēc nosaukuma vai taga;
- filtrēt projektu sarakstu pēc taga, valodas vai grūtības līmeņa;
- skatīt publiskos lietotāju profilus;
- reģistrēties un pieteikties sistēmā.

Viesim ir liegta jebkura rakstīšanas darbība, jo bez identitātes nav iespējams nodrošināt atbildību par saturu un cīnīties ar surogātpastu.

**Reģistrēts lietotājs** (visas viesa funkcijas plus):

- publicēt jaunu dublēšanas projektu (augšupielādēt video, neobligāti skriptu);
- rediģēt un dzēst savus projektus;
- mainīt sava projekta statusu (`open` / `closed`);
- pievienot un noņemt tagus saviem projektiem;
- iesniegt balss pieteikumu atvērtos projektos (audio \+ neobligāta piezīme);
- atsaukt savu pieteikumu, kamēr projekts ir atvērts;
- skatīt visus pieteikumus saviem projektiem un izvēlēties izpildītāju;
- pievienot komentārus citu lietotāju projektos;
- rediģēt un dzēst savus komentārus;
- ziņot par neatbilstošu saturu (projektu, komentāru vai profilu) moderatoriem;
- rediģēt savu profilu (segvārds, biogrāfija, profila bilde);
- mainīt paroli un e-pasta adresi;
- dzēst savu kontu.

Reģistrēta lietotāja atļaujas ir ierobežotas ar viņa paša saturu — viņš nevar rediģēt svešus projektus vai komentārus, jo tas pārkāptu autorību un dotu iespēju ļaunprātīgi mainīt citu darbu.

**Moderators** (visas reģistrēta lietotāja funkcijas plus):

- paslēpt jebkura lietotāja projektu no publiskās plūsmas;
- paslēpt jebkuru komentāru;
- paslēpt lietotāja profilu uz laiku;
- skatīt un apstrādāt ziņojumu rindu (lietotāju iesūtītos ziņojumus par saturu);
- atstāt iekšējās piezīmes pie ziņojumiem citu moderatoru informēšanai;
- atjaunot iepriekš paslēptu saturu, ja ziņojums izrādās nepamatots.

Moderatoram apzināti nav dotas dzēšanas tiesības — slēpšana ir atgriezeniska darbība, kas ļauj kļūdas labot bez datu zaudēšanas un saglabā audita pēdas.

**Administrators** (visas moderatora funkcijas plus):

- piešķirt un atsaukt lietotāju lomas (`user`, `mod`, `admin`);
- pilnībā dzēst jebkuru saturu (projektus, komentārus, pieteikumus);
- pilnībā dzēst lietotāju kontus, ieskaitot ar tiem saistītos failus glabātavā;
- skatīt sistēmas žurnālus (`sistemas_zurnals`) ar visām moderācijas un administratīvajām darbībām;
- pārvaldīt globālo tagu sarakstu (pievienot, pārdēvēt, apvienot tagus);
- konfigurēt sistēmas iestatījumus (maksimālie failu izmēri, atļautie formāti, reģistrācijas ierobežojumi);
- piespiedu kārtā izrakstīt lietotāju no visām sesijām.

Administratora tiesības ir maksimāli ierobežotas konta skaitā (parasti 1–2 personas), jo pilnīga dzēšana ir neatgriezeniska darbība un nepareiza lomu piešķiršana var apdraudēt visu sistēmu.

Servera puses middleware pārbauda lomas pirms katra aizsargāta API izsaukuma, tāpēc pat ja lietotājs manuāli ievada aizsargātu URL, piekļuve tiek liegta. Pārbaude tiek veikta servera pusē, jo klienta puses paslēpšana (piemēram, pogu noņemšana no UI) nav drošības pasākums — pieredzējis uzbrucējs joprojām var nosūtīt HTTP pieprasījumu tieši. Papildus tiek piemērots **principa par mazākajām privilēģijām** — katrai lomai tiek piešķirts tikai tas funkciju kopums, kas nepieciešams tās uzdevumiem, un nekas vairāk.

## 4. Sistēmas vienību darbības testēšana

### 4.1. Jauna projekta izveide

Pārbaude apliecina, ka projekta publicēšanas forma korekti saglabā datus datu bāzē un norāda kļūdas pie nederīgiem ievaddatiem.

| Testa ID | Testa nosaukums | Testa soļi | Paredzētais rezultāts | Rezultāts | Secinājums |
| --- | --- | --- | --- | --- | --- |
| 1 | Tukšs nosaukums | 1. Atvērt „Pūlicēt projektu”. 2. Atstāt `title` tukšu. 3. Iesniegt. | Klūdas ziņojums: „Nosaukums ir obligāts” | Atbilst | Veiksmīgs |
| 2 | Video fails pārāk liels | 1. Augšupielādēt \> 200 MB video. | Klūdas ziņojums par maksimālo izmēru | Atbilst | Veiksmīgs |
| 3 | Korekti dati | 1. Aizpildīt visus laukus pareizi. 2. Iesniegt. | Projekts izveidots, redirects uz lapu | Atbilst | Veiksmīgs |

### 4.2. Pieteikuma iesniegšana

Šis tests pārbauda balss pieteikuma iesniegšanas procesu — vienu no sistēmas galvenajām funkcijām, jo tieši pieteikumi savieno projekta autorus ar potenciālajiem balss aktieriem. Pārbaudes mērķis ir nodrošināt, ka tikai derīgi audio faili nonāk līdz projekta autoram un ka iesniedzējs saņem skaidru atgriezenisko saiti gan veiksmes, gan kļūdu gadījumā.

**Ievaddati**: audio fails (`.mp3` vai `.wav`, max 25 MB), neobligāta piezīme (max 500 simboli).

**Apstrāde**: sistēma pārbauda faila formātu, izmēru un to, ka projekts ir `open`. Pēc veiksmīgas validācijas pieteikums tiek saglabāts un par to tiek paziņots projekta īpašniekam.

**Izvaddati**: pieteikums pievienots projekta `auditions` panelim; iesniedzējs redz apstiprinājuma paziņojumu.

**Klūdas paziņojumi**: „Projekts ir slēgts”, „Faila formāts nav atļauts”, „Fails par lielu”.

### 4.3. Meklēšana pēc vairākiem kritērijiem

Šis tests apliecina meklēšanas funkcionalitātes kvalitāti, kas ir kritiski svarīga lietotāja pieredzei — ja meklēšana neatgriež atbilstošus rezultātus, lietotāji nevar atrast projektus, kas tiem patiesi interesē. Algoritma trīspakāpju struktūra ļauj sabalansēt precizitāti un toleranci pret drukas kļūdām: vispirms tiek meklētas pilnīgas sakritības, pēc tam tagu atbilstības un visbeidzot — aptuvenas atbilstības, kas palīdz lietotājiem atrast vēlamo arī tad, ja viņi nezina precīzu nosaukumu.

Pārbauda pielāgoto trīspakāpju meklēšanas alogritmu: precīza nosaukuma atbilstība → taga atbilstība → izplūdusi atbilstība ar `Levenshtein` distanci. Testa scenāriji apliecina, ka rezultāti tiek atgriezti kārtībā, kas atbilst prioritātei.

## Nobeigums

Darba mērķis — izstrādāt DubStage projektu pārvaldības sistēmu — ir sasniegts. Visas plānotās funkcionalitātes (publicēšana, pieteikumi, meklēšana, komentāri, moderācija) ir realizētas un testētas. Izstrādes gaitā tika apgūta moderna pilna steka tīmekļa lietotņu veidošana, izmantojot Next.js, PostgreSQL un S3 saderīgu objektu glabātavu, kā arī praktiski pielietoti datu modelēšanas, normalizācijas līdz 3NF un drošības principi (bcrypt, JWT, lomu balstīta piekļuves kontrole). Sistēma šobrīd nodrošina iesācējiem draudzīgu vidi dublēšanas prakses uzsākšanai un projektu autoriem — vienkāršu rīku sava aktieru sastāva atrašanai.

Nākotnē sistēmu iespējams paplašināt ar šādām funkcijām:

- **Automātiska `.lrc` failu ģenerēšana no skripta teksta**, izmantojot runas atpazīšanas modeli (piemēram, Whisper), lai autoriem nebūtu manuāli jāveido laika marķējumi.
- **Vērtējumu un atsauksmju sistēma** balss aktieriem, lai projektu autori varētu redzēt iepriekšējo darbu kvalitāti un iesācēji — uzkrāt reputāciju.
- **Iekšējā ziņojumapmaiņa** starp projekta autoru un pieteikuma iesniedzēju, lai apspriestu detaļas, neizejot ārpus platformas.
- **Reāllaika paziņojumi** caur WebSocket par jauniem pieteikumiem, komentāriem un statusa izmaiņām, lai lietotājiem nav atkārtoti jāpārlādē lapa.
- **Sadarbības projekti ar vairākām lomām** — viena video sadalīšana vairākos personāžos, kur katram personāžam tiek pieņemts atsevišķs pieteikums.
- **Publiskais API un OAuth piegādātāji** (Google, Discord), lai trešo pušu izstrādātāji varētu integrēties ar DubStage un lietotāji varētu pieslēgties bez atsevišķa konta izveides.
- **Maksājumu integrācija** (Stripe), kas ļautu profesionāliem projektiem piedāvāt simbolisku atalgojumu izvēlētajam balss aktierim un platformai — ieturēt nelielu komisiju.
- **Eksportējams portfolio** — iespēja katram lietotājam ģenerēt publisku PDF vai tīmekļa lapu ar saviem labākajiem pieteikumiem darba intervijām vai aģentūrām.

## Informācijas avoti

- DubStage iekšējā produkta dokumentācija.
- Supabase oficiālā dokumentācija — [https://supabase.com/docs](https://supabase.com/docs) (izmantota kā backend platforma: PostgreSQL datu bāze, autentifikācija un objektu glabātava).
- Next.js oficiālā dokumentācija — [https://nextjs.org/docs](https://nextjs.org/docs)
- PostgreSQL 16 dokumentācija — [https://www.postgresql.org/docs/16/](https://www.postgresql.org/docs/16/)
- OWASP paroļu glabāšanas vadlīnijas.

## Pielikumi

1. Lietošanas gadījumu (Use Case) diagramma.
2. Klašu diagramma (UML).
3. ER diagramma (Pitera Čena notācija).
4. Datu bāzes tabulu saišu shēma.
5. Reģistrācijas un pieteikšanās logu ekrānuzņēmumi.