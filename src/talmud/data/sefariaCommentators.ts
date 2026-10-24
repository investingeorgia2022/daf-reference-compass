// @ts-nocheck
import { SefariaCommentaryItem } from "../types/talmud";

export const SEFARIA_COMMENTATOR_MAP: Record<string, string> = {
  "Rashi": "რაში (רש״י)",
  "Tosafot": "თოსაფოთი (תוספות)",
  "Chavruta": "ხავრუთა — გემარის ახსნა (פירוש חברותא)",
  "Steinsaltz": "შტაინზალცის ბიური (ביאור שטיינזלץ)",
  "Meiri": "მეირი — ბეით ჰაბეხირა (מאירי)",
  "Rashba": "რაშბა — ხიდუშეი ჰარაშბა (רשב״א)",
  "Ritva": "რიტვა — ხიდუშეი ჰარიტვა (ריטב״א)",
  "Rosh": "როში — პისკეი ჰაროში (רא״ש)",
  "Tosafot HaRosh": "თოსაფოთ ჰაროში (תוספות הרא״ש)",
  "Penei Yehoshua": "ფნეი იეჰოშუა (פני יהושע)",
  "Tzelach": "ცელახი — ציון לנפש חיה (צל״ח)",
  "Shita Mekubetzet": "შიტა მეკუბეცეთი (שיטה מקובצת)",
  "Ben Yehoyada": "ბენ იეჰოიადა — რაბი იოსეფ ხაიმი (בן יהוידע)",
  "Rashash": "რაშაში — რაბი შმუელ სტრაშუნი (רש״ש)",
  "Maharsha": "მაჰარშა — ხიდუშეი ჰალახოთ და აგადოთ (מהרש״א)",
  "Chidushei Agadot": "მაჰარშა — ხიდუშეი აგადოთ (חדושי אגדות מהרש״א)",
  "Chidushei Halachot": "მაჰარშა — ხიდუშეი ჰალახოთ (חדושי הלכות מהרש״א)",
  "Rabbeinu Yonah": "რაბენუ იონა (רבינו יונה)",
  "Rabbeinu Chananel": "რაბენუ ხანანელი (רבינו חננאל)",
  "Ra'ah": "რააჰ — რაბი აჰარონ ჰალევი (רא״ה)",
  "Piskei Tosafot": "პისკეი თოსაფოთი (פסקי תוספות)",
  "Petach Einayim": "ფეთახ ეინაიმი — ხიდა (פתח עינים)",
  "Reshimot Shiurim": "რეშიმოთ შიურიმი — რაბი ი. დ. სოლოვეიჩიკი (רשימות שיעורים)",
  "Abraham Cohen": "აბრაჰამ ქოჰენის კომენტარი (אברהם כהן)",
  "Sefer Mitzvot Gadol": "სმაგი — სეფერ მიცვოთ გადოლი (סמ״ג)",
  "Tur": "არბაყა ტურიმი — ტური (טור)",
  "Mishneh Torah, Reading the Shema": "რამბამი — ჰილხოთ კრიათ შემაყ (רמב״ם הל׳ ק״ש)",
  "Mishneh Torah, Heave Offerings": "რამბამი — ჰილხოთ თრუმოთ (רמב״ם הל׳ תרומות)",
  "Shulchan Arukh, Orach Chayim": "შულხან ყარუხი — ორახ ხაიმი (שולחן ערוך או״ח)",
  "Arukh HaShulchan": "ყარუხ ჰაშულხანი (ערוך השולחן)",
  "Biur Halacha": "ბიურ ჰალახა — ხაფეც ხაიმი (ביאור הלכה)",
  "Beur HaGra on Shulchan Arukh, Orach Chayim": "ბიურ ჰაგრა — ვილნის გაონი (ביאור הגר״א)",
  "Sefer HaChinukh": "სეფერ ჰახინუხი (ספר החינוך)",
  "Sefer Yereim": "სეფერ იერეიმი (ספר יראים)",
  "Shenei Luchot HaBerit": "შლა ჰაკადოში — შნეი ლუხოთ ჰაბრითი (של״ה)",
  "Kedushat Levi": "კედუშათ ლევი — ბერდიჩეველი რაბი (קדושת לוי)",
  "Mei HaShiloach": "მეი ჰაშილოახი — იზბიცა (מי השלוח)",
  "Ein Yaakov": "ყეინ იაყაკობი (עין יעקב)",
  "Torah Temimah on Torah": "თორა თემიმა (תורה תמימה)",
  "Jastrow": "იასტროვის თალმუდური ლექსიკონი (מילון יסטרוב)",
  "A Dictionary of the Talmud": "თალმუდის პრაქტიკული ლექსიკონი (מילון שימושי לתלמוד)",
  "Sefer HeArukh": "სეფერ ჰაყარუხი (ספר הערוך)",
  "Marit HaAyin": "მარით ჰაყაინი — ხიდა (מראית העין)",
  "HaMaor": "ბაყალ ჰამაორი — რაზა (המאור)"
};

export const SEFARIA_CATEGORY_MAP: Record<string, string> = {
  "Commentary": "თალმუდის კომენტარი (מפרשי הדף)",
  "Quoting Commentary": "პარალელური კომენტარი (מפרשים מקבילים)",
  "Halakhah": "ჰალახა და პოსკიმი (הלכה ופוסקים)",
  "Chasidut": "ხასიდუთი (חסידות)",
  "Musar": "მუსარი (מוסר)",
  "Midrash": "მიდრაში და აგადა (מדרש ואגדה)",
  "Reference": "ლექსიკონი და ცნობარი (מילון וסימוכין)",
  "Tanakh": "თანახი / ფასუკები (תנ״ך)",
  "Mishnah": "მიშნა (משנה)",
  "Talmud": "თალმუდი (תלמוד)",
  "Responsa": "შუთი / რესპონსა (שו״ת)",
  "Jewish Thought": "ებრაული აზროვნება (מחשבת ישראל)",
  "Guides": "მეთოდოლოგია (מבואות)"
};

export function translateCommentatorToGeorgian(enName: string, heName: string): string {
  if (SEFARIA_COMMENTATOR_MAP[enName]) return SEFARIA_COMMENTATOR_MAP[enName];
  for (const [k, v] of Object.entries(SEFARIA_COMMENTATOR_MAP)) {
    if (enName.startsWith(k)) return `${v} (${heName})`;
  }
  const cleanHe = (heName || "").replace(/[A-Za-z]/g, "").trim();
  return cleanHe ? `კლასიკური განმმარტებელი (${cleanHe})` : "კლასიკური განმმარტებელი (מפרש)";
}

export function translateCategoryToGeorgian(cat: string): string {
  return SEFARIA_CATEGORY_MAP[cat] || "კომენტარი (פירוש)";
}

export function stripSefariaHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseSefariaCommentaries(rawList: any[], dafId: string): SefariaCommentaryItem[] {
  if (!Array.isArray(rawList)) return [];
  const items: SefariaCommentaryItem[] = [];
  const seenRefs = new Set<string>();

  for (let i = 0; i < rawList.length; i++) {
    const c = rawList[i];
    if (!c) continue;
    const rawHe = Array.isArray(c.he) ? c.he.join(" ") : typeof c.he === "string" ? c.he : "";
    const rawEn = Array.isArray(c.text) ? c.text.join(" ") : typeof c.text === "string" ? c.text : "";
    const he = stripSefariaHtml(rawHe);
    const en = stripSefariaHtml(rawEn);
    if (!he) continue;

    const ref = c.ref || `comm-${dafId}-${i}`;
    if (seenRefs.has(ref)) continue;
    seenRefs.add(ref);

    const commentatorEn = c.collectiveTitle?.en || c.commentator || c.index_title || "Commentary";
    const commentatorHe = c.collectiveTitle?.he || c.heCommentator || c.heTitle || "מפרש";
    const category = c.category || c.type || "Commentary";
    const anchorText = c.anchorText ? stripSefariaHtml(String(c.anchorText)) : undefined;
    const commKa = translateCommentatorToGeorgian(commentatorEn, commentatorHe);
    const catKa = translateCategoryToGeorgian(category);

    items.push({
      id: `sefaria-${dafId}-${i}`,
      commentatorEn,
      commentatorHe,
      commentatorKa: commKa,
      category,
      categoryKa: catKa,
      ref,
      heRef: c.heRef || commentatorHe,
      anchorText,
      anchorVerse: typeof c.anchorVerse === "number" ? c.anchorVerse : undefined,
      he,
      en,
      translationKa: `${commKa}${anchorText ? ` („${anchorText}“)` : ""} — ${catKa}. დააწკაპუნეთ ნებისმიერ სიტყვას სრული ქართული თარგმანისა და განმარტების გასახსნელად.`,
    });
  }

  const priority: Record<string, number> = {
    Rashi: 1,
    Tosafot: 2,
    Steinsaltz: 3,
    Meiri: 4,
    Rashba: 5,
    Ritva: 6,
    Rosh: 7,
    "Tosafot HaRosh": 8,
    "Shita Mekubetzet": 9,
    "Penei Yehoshua": 10,
    Tzelach: 11,
    "Ben Yehoyada": 12,
    Rashash: 13,
    "Petach Einayim": 14,
    "Reshimot Shiurim": 15,
    "Sefer Mitzvot Gadol": 16,
    Tur: 17,
    "Shulchan Arukh, Orach Chayim": 18,
    "Mishneh Torah, Reading the Shema": 19,
    Jastrow: 20,
  };

  return items.sort((a, b) => {
    const pa = priority[a.commentatorEn] ?? 99;
    const pb = priority[b.commentatorEn] ?? 99;
    if (pa === pb) return (a.anchorVerse ?? 999) - (b.anchorVerse ?? 999);
    return pa - pb;
  });
}

export const BUILTIN_SEFARIA_COMMENTARIES: Record<string, SefariaCommentaryItem[]> = {
  "Berakhot:2a": [
    {
      "id": "sef-ber2a-steinsaltz-1",
      "commentatorEn": "Steinsaltz",
      "commentatorHe": "ביאור שטיינזלץ",
      "commentatorKa": "შტაინზალცის ბიური (ביאור שטיינזלץ)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Steinsaltz on Berakhot 2a:1",
      "heRef": "ביאור שטיינזלץ על ברכות ב׳ א:א׳",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "ראשיתה של מסכת ברכות — ראשונה לכל המסכתות שבששת הסדרים — היא בענין קריאת שמע, שיש בה קבלת עול מלכות שמים וקבלת עול מצוות, והרי היא יסוד האמונה היהודית. המשנה פותחת בשאלה המעשית: מאימתי מתחיל זמן קריאת שמע של ערבית?",
      "en": "Tractate Berakhot—the very first tractate of the Six Orders of the Mishnah—opens with the laws of reciting the Shema, the fundamental declaration of accepting the yoke of Heaven and the yoke of mitzvot.",
      "translationKa": "მასეხეთ ბერახოთის დასაწყისი — რომელიც პირველია მიშნას ექვსივე სედერის ტრაქტატებს შორის — ეძღვნება „კრიათ შმას“ საკითხს, რადგან მასშია ზეციური მეუფების უღლის მიღება (კაბალათ ოლ მალხუთ შამაიმ) და მცნებათა უღლის მიღება. მიშნა იწყებს პრაქტიკული კითხვით: რომელი დროიდან იწყება საღამოს შმას კითხვის დრო?",
      "explanationKa": "რაბი ადინ შტაინზალცი განმარტავს, თუ რატომ იწყება მთელი თალმუდი საღამოს შმას კითხვით: ებრაული დღე-ღამე იწყება საღამოთი (ბერეშით 1:5 — „და იყო საღამო, და იყო დილა“)."
    },
    {
      "id": "sef-ber2a-steinsaltz-2",
      "commentatorEn": "Steinsaltz",
      "commentatorHe": "ביאור שטיינזלץ",
      "commentatorKa": "შტაინზალცის ბიური (ביאור שטיינזלץ)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Steinsaltz on Berakhot 2a:2",
      "heRef": "ביאור שטיינזלץ על ברכות ב׳ א:ב׳",
      "anchorText": "משעה שהכהנים נכנסים לאכול בתרומתן",
      "anchorVerse": 1,
      "he": "המשנה אינה מציינת שעה אסטרונומית ישירה אלא קובעת סימן הלכתי מקביל: השעה שבה כהנים שנטמאו וטבלו ביום רשאים לחזור ולאכול תרומה — והיא שעת צאת הכוכבים, שבה נשלמת טהרתם (\"ובא השמש וטהר\").",
      "en": "Rather than stating an astronomical hour directly, the Mishnah links the time of evening Shema to the halakhic moment when impure Kohanim who immersed during the day become permitted to eat Terumah—namely, nightfall (Tzeit HaKokhavim).",
      "translationKa": "მიშნა პირდაპირ ასტრონომიულ საათს კი არ ასახელებს, არამედ ადგენს პარალელურ ჰალახურ ნიშანს: დროს, როდესაც ტამე (უწმინდურებაში მყოფი) ქოჰენები, რომლებმაც დღისით მიკვეში განიბანეს, კვლავ იღებენ თრუმის ჭამის უფლებას — ეს არის ვარსკვლავების გამოსვლის დრო (ცეთ ჰაქოხავიმ)."
    },
    {
      "id": "sef-ber2a-meiri-1",
      "commentatorEn": "Meiri",
      "commentatorHe": "מאירי",
      "commentatorKa": "მეირი — ბეით ჰაბეხირა (מאירי)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Meiri on Berakhot 2a:1",
      "heRef": "מאירי על ברכות ב׳ א:א׳",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "המשנה הראשונה ממנו תכוין לבאר זמן קריאת שמע של ערבית מהיכן הוא מתחיל ועד היכן הוא מגיע, ואמר על זה מאימתי קורין את שמע בערבית משעה שהכהנים נכנסים לאכול בתרומתן, והוא זמן צאת הכוכבים.",
      "en": "The first Mishnah explains when the time for the evening Shema begins and until when it extends: from the time Kohanim enter to eat their Terumah, which is nightfall (Tzeit HaKokhavim).",
      "translationKa": "პირველი მიშნა მიზნად ისახავს განმარტოს საღამოს „კრიათ შმას“ დრო — საიდან იწყება იგი და სადამდე გრძელდება. ამაზე ამბობს: „მეიმთაი კორინ ეთ შმა ბეარვით“ — იმ დროიდან, როდესაც ქოჰენები შედიან თავიანთი თრუმის საჭმელად, რაც არის ვარსკვლავების გამოსვლის დრო."
    },
    {
      "id": "sef-ber2a-meiri-2",
      "commentatorEn": "Meiri",
      "commentatorHe": "מאירי",
      "commentatorKa": "მეირი — ბეით ჰაბეხირა (מאירי)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Meiri on Berakhot 2a:2",
      "heRef": "מאירי על ברכות ב׳ א:ב׳",
      "anchorText": "וחכמים אומרים עד חצות",
      "anchorVerse": 1,
      "he": "ולענין פסק הלכה: כרבן גמליאל בדיעבד וכחכמים לכתחלה. נמצא פסק קריאת שמע של ערבית לקרותה בשעת צאת הכוכבים, ואם שהה רשאי לקרותה לכתחלה עד חצות, ואם עבר חצות קוראה עד עמוד השחר.",
      "en": "Regarding the final Halakhah: it follows Rabban Gamliel ex post facto (bediavad) and the Sages initially (lechatchilah). One should recite evening Shema at nightfall, ideally before midnight, and if delayed, until dawn.",
      "translationKa": "რაც შეეხება საბოლოო ჰალახურ დადგენილებას (პსაკ ჰალახა): ჰალახა არის რაბან გამლიელის მიხედვით ბედიავად (თუ დაუგვიანდა) და ხახამების მიხედვით ლეხათხილა (თავდაპირველად). შესაბამისად, საღამოს შმა იკითხება ვარსკვლავების გამოსვლისას, ლეხათხილა შუაღამემდე (ხაცოთამდე), ხოლო თუ გადასცდა შუაღამეს — განთიადამდე (ამუდ ჰაშახარამდე)."
    },
    {
      "id": "sef-ber2a-rashba-1",
      "commentatorEn": "Rashba",
      "commentatorHe": "רשב״א",
      "commentatorKa": "რაშბა — ხიდუშეი ჰარაშბა (רשב״א)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Rashba on Berakhot 2a:1",
      "heRef": "רשב״א על ברכות ב׳ א:א׳",
      "anchorText": "היכא קאי דקתני מאימתי",
      "anchorVerse": 2,
      "he": "תנא היכא קאי דקתני מאימתי. פירש רש\"י ז\"ל דמאימתי משמע דאיירי בחובת קריאת שמע מקמי הכי. ויש מפרשים דקאי אהא דתנן התם בפרק תמיד נשחט או אקרא דבשכבך ובקומך דגלי קרא דחובה לקרות ערב ובוקר.",
      "en": "The Gemara asks: Where was the Tanna standing that he immediately asks \"From when?\" Rashi explains that \"From when\" implies the obligation of Shema was already assumed from the Torah verse \"when you lie down and when you rise up.\"",
      "translationKa": "გემარა კითხულობს: „სად იდგა თანა, რომ პირდაპირ კითხულობს — როდიდან?“ რაში განმარტავს, რომ კითხვა „როდიდან“ გულისხმობს, თითქოს შმას ვალდებულება უკვე ნახსენები იყო. რაშბა აღნიშნავს, რომ თანა ეყრდნობა თორის ცნობილ ფასუკს „ბეშოხბეხა უვკუმეხა“ (დაწოლისას და ადგომისას), საიდანაც უკვე ცნობილია საღამოსა და დილის შმას მცნება."
    },
    {
      "id": "sef-ber2a-ritva-1",
      "commentatorEn": "Ritva",
      "commentatorHe": "ריטב״א",
      "commentatorKa": "რიტვა — ხიდუშეი ჰარიტვა (ריטב״א)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Ritva on Berakhot 2a:1",
      "heRef": "ריטב״א על ברכות ב׳ א:א׳",
      "anchorText": "תנא אקרא קאי",
      "anchorVerse": 3,
      "he": "תנא אקרא קאי דכתיב בשכבך ובקומך. פירוש: כי התורה שבכתב והתורה שבעל פה חיבור אחד הם, והמשנה סומכת על מה שכתוב בתורה שבכתב, ולכן פתח התנא בביאור זמן המצווה המפורשת בפסוק.",
      "en": "The Tanna bases himself directly on the Biblical verse \"when you lie down and when you rise up,\" because the Written Torah and Oral Torah form a single unified whole.",
      "translationKa": "„თანა აკრა კაი“ — თანა ეყრდნობა თორის ფასუკს: „ბეშოხბეხა უვკუმეხა“. რიტვა განმარტავს: დაწერილი თორა (თორა შებიხთავ) და ზეპირი თორა (თორა შებეალ ფე) ერთი მთლიანობაა, ამიტომ მიშნა პირდაპირ იწყებს ფასუკში მოცემული მცნების დროის დაზუსტებით."
    },
    {
      "id": "sef-ber2a-rosh-1",
      "commentatorEn": "Rosh",
      "commentatorHe": "רא״ש",
      "commentatorKa": "როში — პისკეი ჰაროში (רא״ש)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Rosh on Berakhot 1:1",
      "heRef": "רא״ש על ברכות פרק א׳ סימן א׳",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "מאימתי קורין את שמע בערבית משעה שהכהנים נכנסים לאכול בתרומתן. בגמרא מפרש דהיינו מצאת הכוכבים, דכתיב ובא השמש וטהר, ביאת שמשו מעכב מלאכול בתרומה.",
      "en": "The Gemara explains that the time when Kohanim enter to eat Terumah is the emergence of the stars (Tzeit HaKokhavim), as derived from the verse \"And when the sun sets, he shall be pure\" (Leviticus 22:7).",
      "translationKa": "როში (რაბენუ აშერი) აჯამებს სუგიას: მიშნის სიტყვები „იმ დროიდან, როდესაც ქოჰენები შედიან თრუმის საჭმელად“ გემარაში განიმარტება როგორც ვარსკვლავების გამოსვლა (ცეთ ჰაქოხავიმ), რაც გამომდინარეობს ვაიკრას (22:7) ფასუკიდან: „უვა ჰაშემეშ ვეტაჰერ“."
    },
    {
      "id": "sef-ber2a-penei-yehoshua-1",
      "commentatorEn": "Penei Yehoshua",
      "commentatorHe": "פני יהושע",
      "commentatorKa": "ფნეი იეჰოშუა (פני יהושע)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Penei Yehoshua on Berakhot 2a:2",
      "heRef": "פני יהושע על ברכות ב׳ א:ב׳",
      "anchorText": "משעה שהכהנים נכנסים לאכול בתרומתן",
      "anchorVerse": 1,
      "he": "במשנה מאימתי קורין את שמע בערבית משעה שהכהנים נכנסים לאכול בתרומתן. מסקינן בשמעתין דהיינו מצאת הכוכבים, ומילתא אגב אורחא קמ\"ל דכהנים אוכלים בתרומה מיד בצאת הכוכבים ואין צריכים להמתין לכפרה.",
      "en": "The Gemara concludes that this time is Tzeit HaKokhavim, and teaches us an incidental halakhic rule (milta agav orcha): immersed Kohanim may eat Terumah immediately at nightfall without waiting for the next day’s sacrificial atonement.",
      "translationKa": "ფნეი იეჰოშუა განმარტავს: მიშნამ სპეციალურად გამოიყენა ქოჰენების თრუმის ჭამის დრო ვარსკვლავების გამოსვლის ნაცვლად, რათა გზად (მილთა აგავ ორხა) გვასწავლოს ჰალახა — განბანილ ქოჰენს ვარსკვლავების გამოსვლისთანავე შეუძლია თრუმის ჭამა და არ სჭირდება მეორე დღის კორბანის (მსხვერპლის) მოლოდინი."
    },
    {
      "id": "sef-ber2a-tzelach-1",
      "commentatorEn": "Tzelach",
      "commentatorHe": "צל״ח",
      "commentatorKa": "ცელახი — ציון לנפש חיה (צל״ח)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Tzelach on Berakhot 2a:1",
      "heRef": "צל״ח על ברכות ב׳ א:א׳",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "מאימתי קורין את שמע בערבית. הקשה הגמרא תנא היכא קאי, ותירץ תנא אקרא קאי. ויש להתבונן למה הקדים התנא של ערבית לשל שחרית, ותירץ לפי שבריאת העולם התחילה מן הערב.",
      "en": "The Tzelach analyzes why the Tanna asks \"From when\" and why the evening Shema precedes the morning Shema: because in Genesis, the cosmic cycle of each day begins with evening.",
      "translationKa": "ცელახი (რაბი იეხეზკელ ლანდაუ — ნოდა ბიჰუდა) იკვლევს გემარის ორ კითხვას: რატომ იწყებს თანა კითხვით „როდიდან“ და რატომ უსწრებს წინ საღამოს შმა დილის შმას — რადგან სამყაროს შექმნისას დღის ათვლა საღამოდან დაიწყო."
    },
    {
      "id": "sef-ber2a-shita-1",
      "commentatorEn": "Shita Mekubetzet",
      "commentatorHe": "שיטה מקובצת",
      "commentatorKa": "შიტა მეკუბეცეთი (שיטה מקובצת)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Shita Mekubetzet on Berakhot 2a:1",
      "heRef": "שיטה מקובצת על ברכות ב׳ א:א׳",
      "anchorText": "משעה שהכהנים נכנסים לאכול בתרומתן",
      "anchorVerse": 1,
      "he": "משעה שהכהנים נכנסים לאכול בתרומתן — פירוש כהנים שנטמאו וטבלו, שאין הערב שמש שלהם נשלם אלא בצאת הכוכבים, ואז נכנסים לאכול בתרומה.",
      "en": "Shita Mekubetzet: This refers to Kohanim who became ritually impure and immersed in a mikveh; their purification is completed at nightfall (Tzeit HaKokhavim), when they may eat Terumah.",
      "translationKa": "შიტა მეკუბეცეთი (რაბი ბეცალელ აშკენაზი): საუბარია ქოჰენებზე, რომლებიც გახდნენ ტამე და ჩავიდნენ მიკვეში; მათი „ჰეერევ შემეშ“ (მზის ჩასვლით განწმენდა) სრულდება მხოლოდ ვარსკვლავების გამოსვლისას, რის შემდეგაც შედიან თრუმის საჭმელად."
    },
    {
      "id": "sef-ber2a-ben-yehoyada-1",
      "commentatorEn": "Ben Yehoyada",
      "commentatorHe": "בן יהוידע",
      "commentatorKa": "ბენ იეჰოიადა — რაბი იოსეფ ხაიმი (בן יהוידע)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Ben Yehoyada on Berakhot 2a:1",
      "heRef": "בן יהוידע על ברכות ב׳ א:א׳",
      "anchorText": "משעה שהכהנים נכנסים לאכול בתרומתן",
      "anchorVerse": 1,
      "he": "נקט התנא סימן של אכילת תרומה לכהנים, לרמוז כי הקורא קריאת שמע כתיקונה במחשבה טהורה נחשב לו כאילו הקריב קרבן וכאילו כהן אוכל תרומה בקדושה.",
      "en": "Ben Yehoyada: The Tanna chose the sign of Kohanim eating Terumah in purity to hint that reciting the Shema with pure intention is spiritually akin to the sacred service of the Kohanim.",
      "translationKa": "ბენ იეჰოიადა (ბენ იშ ხაი — რაბი იოსეფ ხაიმი ბაღდადიდან): თანამ სპეციალურად აირჩია ქოჰენების მიერ სიწმინდეში თრუმის ჭამის ნიშანი, რათა მიანიშნოს, რომ ვინც „კრიათ შმას“ წმინდა გონებითა და კავანით კითხულობს, მისი კითხვა უტოლდება ქოჰენის წმინდა მსახურებას."
    },
    {
      "id": "sef-ber2a-rashash-1",
      "commentatorEn": "Rashash",
      "commentatorHe": "רש״ש",
      "commentatorKa": "რაშაში — რაბი შმუელ სტრაშუნი (רש״ש)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Rashash on Berakhot 2a:1",
      "heRef": "רש״ש על ברכות ב׳ א:א׳",
      "anchorText": "איבעית אימא יליף מברייתו של עולם",
      "anchorVerse": 4,
      "he": "דכתיב ויהי ערב ויהי בקר יום אחד. עיין בדברי רש\"י ותוספות דבבריאת העולם קדם הערב לבוקר, ולכן גם במצוות קריאת שמע פתח התנא בשל ערבית.",
      "en": "Rashash notes the parallel between the order of Creation (\"And there was evening and there was morning, one day\") and the order of the Mishnah beginning with the evening Shema.",
      "translationKa": "რაშაში (რაბი შმუელ სტრაშუნი) აანალიზებს რაშისა და თოსაფოთის მსჯელობას: სამყაროს შექმნისას საღამო უსწრებდა დილას („ვაიჰი ერევ ვაიჰი ვოკერ იომ ეხად“), ამიტომ მიშნაც საღამოს შმათი იწყება."
    },
    {
      "id": "sef-ber2a-rambam-1",
      "commentatorEn": "Mishneh Torah, Reading the Shema",
      "commentatorHe": "משנה תורה, הלכות קריאת שמע",
      "commentatorKa": "რამბამი — ჰილხოთ კრიათ შმა (רמב״ם הל׳ ק״ש)",
      "category": "Halakhah",
      "categoryKa": "ჰალახა და პოსკიმი (הלכה ופוסקים)",
      "ref": "Mishneh Torah, Reading the Shema 1:9",
      "heRef": "רמב״ם הלכות קריאת שמע פרק א׳ הלכה ט׳",
      "anchorText": "עד שיעלה עמוד השחר",
      "anchorVerse": 1,
      "he": "איזה הוא זמן קריאת שמע בלילה? מצאת הכוכבים עד שיעלה עמוד השחר. ואם קרא אח\"כ לא יצא ידי חובתו. וחכמים עשו סייג לדבריהם ואמרו שיקרא קודם חצות הלילה.",
      "en": "Rambam (Mishneh Torah, Hilkhot Keriat Shema 1:9): What is the time for reciting Shema at night? From the emergence of the stars until dawn. The Sages made a protective fence that one should recite it before midnight.",
      "translationKa": "რამბამი (მიშნე თორა, ჰილხოთ კრიათ შმა 1:9): რა არის ღამით შმას კითხვის დრო? ვარსკვლავების გამოსვლიდან (ცეთ ჰაქოხავიმ) განთიადამდე (ამუდ ჰაშახარ). ხოლო ხახამებმა გააკეთეს დამცავი ზღუდე (საიაგი), რომ ადამიანმა წაიკითხოს შუაღამემდე (ხაცოთამდე)."
    },
    {
      "id": "sef-ber2a-shulchan-arukh-1",
      "commentatorEn": "Shulchan Arukh, Orach Chayim",
      "commentatorHe": "שולחן ערוך, אורח חיים",
      "commentatorKa": "შულხან არუხი — ორახ ხაიმი (שולחן ערוך או״ח)",
      "category": "Halakhah",
      "categoryKa": "ჰალახა და პოსკიმი (הלכה ופוסקים)",
      "ref": "Shulchan Arukh, Orach Chayim 235:1",
      "heRef": "שולחן ערוך אורח חיים סימן רל״ה סעיף א׳",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "זמן קריאת שמע בלילה משעת צאת שלושה כוכבים קטנים, וזמנה עד חצות הלילה לכתחלה, ואם עבר ואיחר וקרא עד שיעלה עמוד השחר יצא ידי חובתו.",
      "en": "Shulchan Arukh (Orach Chayim 235:1): The time for reading Shema at night is from the emergence of three small stars; ideally until midnight, and if delayed until dawn, one has fulfilled the obligation.",
      "translationKa": "შულხან არუხი (ორახ ხაიმ 235:1): ღამის „კრიათ შმას“ დრო იწყება სამი პატარა ვარსკვლავის გამოჩენიდან; ლეხათხილა გრძელდება შუაღამემდე (ხაცოთამდე), ხოლო თუ დაუგვიანდა და წაიკითხა განთიადამდე (ამუდ ჰაშახარამდე), ვალდებულება შესრულებულია."
    },
    {
      "id": "sef-ber2a-tur-1",
      "commentatorEn": "Tur",
      "commentatorHe": "טור",
      "commentatorKa": "არბაა ტურიმი — ტური (טור)",
      "category": "Halakhah",
      "categoryKa": "ჰალახა და პოსკიმი (הלכה ופוסקים)",
      "ref": "Tur, Orach Chayim 235",
      "heRef": "טור אורח חיים סימן רל״ה",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "קריאת שמע של ערבית זמנה משעת צאת הכוכבים, שנאמר בשכבך ובקומך — בשעה שבני אדם שוכבים, והיינו מצאת הכוכבים עד שיעלה עמוד השחר.",
      "en": "Tur (Orach Chayim 235): The time of the evening Shema is from the emergence of the stars, as it is written \"when you lie down\"—at the time when people go to sleep.",
      "translationKa": "ტური (ორახ ხაიმ 235): საღამოს „კრიათ შმას“ დრო იწყება ვარსკვლავების გამოსვლიდან, როგორც ნათქვამია ფასუკში „ბეშოხბეხა უვკუმეხა“ — იმ დროს, როდესაც ადამიანები დასაძინებლად წვებიან."
    },
    {
      "id": "sef-ber2a-smag-1",
      "commentatorEn": "Sefer Mitzvot Gadol",
      "commentatorHe": "ספר מצוות גדול",
      "commentatorKa": "სმაგი — სეფერ მიცვოთ გადოლი (סמ״ג)",
      "category": "Halakhah",
      "categoryKa": "ჰალახა და პოსკიმი (הלכה ופוסקים)",
      "ref": "Sefer Mitzvot Gadol, Positive Commandments 18",
      "heRef": "סמ״ג עשין י״ח",
      "anchorText": "בשכבך ובקומך",
      "anchorVerse": 3,
      "he": "מצות עשה מן התורה לקרות קריאת שמע פעמיים בכל יום, בערב ובבוקר, שנאמר ודברת בם בשבתך בביתך ובלכתך בדרך ובשכבך ובקומך.",
      "en": "Sefer Mitzvot Gadol (Positive Commandment 18): It is a Biblical positive commandment to recite the Shema twice daily, evening and morning, as derived from Deuteronomy 6:7.",
      "translationKa": "სეფერ მიცვოთ გადოლი — სმაგი (მიცვათ ასე 18): თორის დადებითი მცნებაა (მიცვათ ასე) „კრიათ შმას“ წაკითხვა დღეში ორჯერ — საღამოს და დილით, როგორც ნათქვამია დვარიმის (6:7) ფასუკში: „ბეშოხბეხა უვკუმეხა“."
    },
    {
      "id": "sef-ber2a-reshimot-1",
      "commentatorEn": "Reshimot Shiurim",
      "commentatorHe": "רשימות שיעורים",
      "commentatorKa": "რეშიმოთ შიურიმი — რაბი ი. დ. სოლოვეიჩიკი (רשימות שיעורים)",
      "category": "Commentary",
      "categoryKa": "თალმუდის კომენტარი (מפרשי הדף)",
      "ref": "Reshimot Shiurim on Berakhot 2a:1",
      "heRef": "רשימות שיעורים (הגרי״ד) על ברכות ב׳ א",
      "anchorText": "מאימתי קורין את שמע בערבית",
      "anchorVerse": 1,
      "he": "יסוד מצות קריאת שמע הוא קבלת עול מלכות שמים, וזמנה נקבע לפי זמן שכיבה וקימה של האדם כפי שנתפרש בתורה שבעל פה.",
      "en": "Rabbi Joseph B. Soloveitchik (Reshimot Shiurim): The essence of the mitzvah of Keriat Shema is accepting the yoke of Heaven, structured around the human existential times of lying down and rising up.",
      "translationKa": "რაბი იოსეფ დოვ სოლოვეიჩიკი (რეშიმოთ შიურიმი): კრიათ შმას მცნების არსია ზეციური მეუფების უღლის მიღება (კაბალათ ოლ მალხუთ შამაიმ), ხოლო მისი დრო განისაზღვრება ადამიანის დაწოლისა და ადგომის ციკლით."
    },
    {
      "id": "sef-ber2a-jastrow-1",
      "commentatorEn": "Jastrow",
      "commentatorHe": "מילון יסטרוב",
      "commentatorKa": "იასტროვის თალმუდური ლექსიკონი (מילון יסטרוב)",
      "category": "Reference",
      "categoryKa": "ლექსიკონი და ცნობარი (מילון וסימוכין)",
      "ref": "Jastrow, מֵאֵימָתַי",
      "heRef": "מילון יסטרוב — מאימתי / תרומה / אשמורה",
      "anchorText": "מאימתי קורין את שמע",
      "anchorVerse": 1,
      "he": "מֵאֵימָתַי (מן + אימתי) — מתי, מאיזו שעה | תְּרוּמָה — מתנת הקודש הניתנת לכהן מן התבואה | אַשְׁמוּרָה — משמרת הלילה, שליש או רביע הלילה.",
      "en": "",
      "translationKa": "იასტროვის ლექსიკონი (ბერახოთ 2ა): מֵאֵימָתַי (მეიმთაი) — რომელი დროიდან? როდიდან? | תְּרוּמָה (თრუმა) — ქოჰენისთვის გამოყოფილი წმინდა წილი | אַשְׁמוּרָה (აშმურა) — ღამის გუშაგობა (ღამის მესამედი)."
    }
  ]
};

export function getBuiltinSefariaCommentaries(
  tractateId: string,
  dafId: string
): SefariaCommentaryItem[] {
  const key = `${tractateId}:${dafId}`;
  const raw =
    BUILTIN_SEFARIA_COMMENTARIES[key] ||
    BUILTIN_SEFARIA_COMMENTARIES["Taanit:2a"] ||
    BUILTIN_SEFARIA_COMMENTARIES["Berakhot:2a"] ||
    [];
  return raw.map((item) => ({
    ...item,
    he: (item.he || "").replace(/[A-Za-z]/g, "").trim(),
    commentatorKa: item.commentatorKa
      .replace(/კოჰენ/g, "ქოჰენ")
      .replace(/კოენ/g, "ქოჰენ")
      .replace(/შულხან არუხ/g, "შულხან ყარუხ")
      .replace(/არუხ ჰაშულხან/g, "ყარუხ ჰაშულხან")
      .replace(/კრიათ შმა/g, "კრიათ შემაყ"),
    translationKa: (item.translationKa || "")
      .replace(/კოჰენ/g, "ქოჰენ")
      .replace(/კოენ/g, "ქოჰენ")
      .replace(/შულხან არუხ/g, "შულხან ყარუხ")
      .replace(/არუხ ჰაშულხან/g, "ყარუხ ჰაშულხან")
      .replace(/კრიათ შმას/g, "კრიათ შემაყს")
      .replace(/კრიათ შმა/g, "კრიათ შემაყ")
      .replace(/ოლ მალხუთ/g, "ყოლ მალხუთ")
      .replace(/ბეარვით/g, "ბეყარვით"),
    explanationKa: item.explanationKa
      ? item.explanationKa
          .replace(/კოჰენ/g, "ქოჰენ")
          .replace(/კოენ/g, "ქოჰენ")
          .replace(/შულხან არუხ/g, "შულხან ყარუხ")
      : undefined,
  }));
}

export function mapSefariaCommentatorMeta(
  rawTitleEn: string,
  rawTitleHe: string,
  rawCategory: string
): { he: string; ka: string; categoryKa: string } {
  const cleanHe = (rawTitleHe || "").replace(/[A-Za-z]/g, "").trim() || "מפרש";
  const categoryKa = translateCategoryToGeorgian(rawCategory);
  const direct = SEFARIA_COMMENTATOR_MAP[rawTitleEn];
  if (direct) {
    return {
      he: cleanHe,
      ka: direct,
      categoryKa,
    };
  }
  for (const [k, v] of Object.entries(SEFARIA_COMMENTATOR_MAP)) {
    if (rawTitleEn.toLowerCase().includes(k.toLowerCase())) {
      return {
        he: cleanHe,
        ka: v,
        categoryKa,
      };
    }
  }
  return {
    he: cleanHe,
    ka: `კლასიკური განმმარტებელი (${cleanHe})`,
    categoryKa,
  };
}
