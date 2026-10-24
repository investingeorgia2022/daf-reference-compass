// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Globe,
  Flame,
  UserPlus,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Award,
  X,
  Plus,
  LogIn,
  LogOut,
  ArrowLeft,
  Download,
  Search,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Wallet,
  CreditCard,
  Receipt,
  FileText,
  Check,
  Trash2,
  Printer,
  Calendar,
} from 'lucide-react';
import { SACRED_REALMS, SacredRealmId, TORAH_BOOKS } from '../data/tanakhAndHalakhaData';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { WindowsWindowControls } from './WindowsWindowControls';
import { VoiceSearchMicButton } from './VoiceSearchMicButton';
import { Button } from '@/components/ui/button';
import { UILang, AppCurrency } from '../types/talmud';

export interface RegisteredScholarUser {
  id: string;
  fullName: string;
  hebrewName: string;
  emailOrPhone: string;
  communityKa: string;
  authMethod: 'google' | 'apple' | 'phone' | 'email';
  joinedAt: string;
}

export interface StudyDedicationItem {
  id: string;
  type: 'leilui-nishmat' | 'refuah-shlemah' | 'hatzlacha' | 'shalom-bayit';
  typeLabelKa: string;
  typeLabelHe: string;
  honoreeNameKa: string;
  honoreeNameHe: string;
  sponsorNameKa: string;
  noteKa: string;
}

const DEFAULT_MEMBERS_DB: string[] = [
  'დავით ბენ აბრაამ მიხელაშვილი (ქოჰენი)',
  'იოსებ ბენ იცხაკ სეფიაშვილი (ლევი)',
  'მოშე ბენ იაკოვ დავარაშვილი (ისრაელი)',
  'რაფაელ ბენ შლომო ჯანაშვილი (აბრეხი)',
  'შალომ ბენ ბენიამინ ბათიაშვილი',
  'გაბრიელ ბენ ელიაჰუ კოსაშვილი',
  'მიხაელ ბენ დანიელ აჯიაშვილი',
  'ეფრაიმ ბენ მორდეხაი ხახიაშვილი',
];

const DEFAULT_DEDICATIONS: StudyDedicationItem[] = [
  {
    id: 'ded-1',
    type: 'leilui-nishmat',
    typeLabelKa: 'სულის მოსამაღლებლად (לעילוי נשמת)',
    typeLabelHe: 'לעילוי נשמת',
    honoreeNameKa: 'მარან რავ ოვაדיה იოსეფი ბენ გორჯია და ყველა წმინდა ცადიკი',
    honoreeNameHe: 'מרן עובדיה בן גורג׳יה זצוק״ל',
    sponsorNameKa: 'ბეთ-მიდრაშის საზოგადოება',
    noteKa: 'დღევანდელი სწავლა ეძღვნება სულის საოხად და მთელი ისრაელის კეთილდღეობისთვის.',
  },
  {
    id: 'ded-2',
    type: 'refuah-shlemah',
    typeLabelKa: 'ჯანმრთელობის გასაუმჯობესებლად (לרפואה שלמה)',
    typeLabelHe: 'לרפואה שלמה',
    honoreeNameKa: 'ყველა სნეულის სწრაფი და სრული გამოჯანმრთელებისთვის ისრაელსა და მსოფლიოში',
    honoreeNameHe: 'רפואה שלמה לכל חולי עמו ישראל',
    sponsorNameKa: 'თორის შემსწავლელთა კავშირი',
    noteKa: 'רפואה שלמה מן השמים — სულისა და სხეულის სიმტკიცისთვის.',
  },
  {
    id: 'ded-3',
    type: 'hatzlacha',
    typeLabelKa: 'საკეთილდღეოდ, წარმატებისა და ბარაქისთვის (להצלחה וברכה)',
    typeLabelHe: 'להצלחה וברכה',
    honoreeNameKa: 'ჩვენი თემის ოჯახების, ახალგაზრდებისა და თორის შემსწავლელთა საკეთილდღეოდ',
    honoreeNameHe: 'להצלחת כל לומדי התורה ותומכיה',
    sponsorNameKa: 'ბეთ-მიდრაშის შემსწავლელთა კავშირი',
    noteKa: 'უფალმა აკურთხოს თითოეული შემსწავლელი მშვიდობით, სიბრძნითა და ბარაქით.',
  },
];

export interface FinancialOperationItem {
  id: string;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  currency: AppCurrency;
  member: string;
  paymentMethod: string;
  date: string;
  notes?: string;
}

export interface SeferTorahAliyahItem {
  id: string;
  parashaKey: string;
  parashaNameKa: string;
  parashaNameHe: string;
  aliyahType: string;
  buyerMemberName: string;
  amount: number;
  currency: AppCurrency;
  status: 'paid' | 'due';
  createdAt: string;
  notes?: string;
}

export const STANDARD_OPERATION_OPTIONS: SelectOption[] = [
  { value: 'ალია თორაზე (עליה לתורה)', badgeHe: 'עליה לתורה', label: 'ალია თორაზე (עליה לתורה)' },
  { value: 'ფეთიხათ ჰაარონი (פתיחת הארון)', badgeHe: 'פתיחת הארון', label: 'ფეთიხათ ჰაარონი (פתיחת הארון)' },
  { value: 'რიმონიმის შემოტანა (הכנסת רימונים)', badgeHe: 'הכנסת רימונים', label: 'რიმონიმის შემოტანა (הכנסת רימונים)' },
  { value: 'გაგბაობა / სეფერ თორის შემოტარება (הגבהה)', badgeHe: 'הגבהת ספר תורה', label: 'გაგბაობა / შემოტარება (הגבהת ס״ת)' },
  { value: 'გლილა / შეხვევა (גלילה)', badgeHe: 'גלילה', label: 'გლილა / შეხვევა (גלילה)' },
  { value: 'ეც ხაიმ (עץ חיים)', badgeHe: 'עץ חיים', label: 'ეც ხაიმ (עץ חיים)' },
  { value: 'სამსახური (შამაში / სერვისი)', badgeHe: 'שמש', label: 'სამსახური (შამაში / სერვისი • שמש)' },
  { value: 'დამატებითი / მოსიფ (מוסיף)', badgeHe: 'מוסיף', label: 'დამატებითი / მოსიფ (מוסיף)' },
  { value: 'წლიური საწევრო გადასახადი (דמי חברות)', badgeHe: 'דמי חברות', label: 'წლიური საწევრო გადასახადი (דמי חברות)' },
  { value: 'მიძღვნა სულის საოხად (תרומה לעילוי נשמת)', badgeHe: 'לעילוי נשמת', label: 'მიძღვნა სულის საოხად (לעילוי נשמת)' },
  { value: 'თემის დახმარება / ცდაკა (צדקה וחסד)', badgeHe: 'צדקה וחסד', label: 'თემის დახმარება / ცდაკა (צדקה וחסד)' },
  { value: 'ქოლელის / აბრეხების დახმარება (החזקת אברכים)', badgeHe: 'החזקת אברכים', label: 'ქოლელის / აბრეხების დახმარება (החזקת אברכים)' },
  { value: 'კომუნალური ხარჯები / ელექტროენერგია', badgeHe: 'הוצאות תחזוקה', label: 'კომუნალური ხარჯები / ელექტროენერგია' },
  { value: 'წიგნების შეძენა და შეკეთება (קניית ספרים)', badgeHe: 'ספרי קודש', label: 'წიგნების შეძენა და შეკეთება' },
  { value: 'კიდუშის / სეუდა შლიშითის ორგანიზება (קידוש)', badgeHe: 'קידוש וסעודה', label: 'კიდუშის / სეუდა შლიშითის ორგანიზება' },
  { value: 'სხვა / პირადი შემოწირულობა (תרומה כללית)', badgeHe: 'תרומה כללית', label: 'სხვა / პირადი შემოწირულობა' },
];

export const PAYMENT_METHOD_OPTIONS: SelectOption[] = [
  { value: 'ნაღდი / ქეში (מזומן)', badgeHe: 'מזומן', label: 'ნაღდი / ქეში (מזומן • Cash)' },
  { value: 'საბანკო გადარიცხვა (העברה בנקאית)', badgeHe: 'העברה', label: 'საბანკო გადარიცხვა (העברה בנקאית • Wire)' },
  { value: 'საბანკო ბარათი / POS (כרטיס אשראי)', badgeHe: 'אשראי', label: 'საბანკო ბარათი / POS (כרטיס אשראי)' },
  { value: 'ჩეკი (המחאה)', badgeHe: 'המחאה', label: 'ჩეკი (המחאה • Check)' },
  { value: 'Bit / PayBox / მობილური (אפליקציה)', badgeHe: 'אפליקציה', label: 'Bit / PayBox / მობილური აპლიკაცია' },
  { value: 'გადასახდელი / ნისიად (בהקפה)', badgeHe: 'בהקפה', label: 'გადასახდელი / ნისიად (בהקפה • Pledged / Due)' },
];

export const ALIYAH_MITZVAH_OPTIONS: SelectOption[] = [
  { value: 'ქოჰენი (I ასვლა)', badgeHe: 'כהן', label: 'ქოჰენი (I ასვლა • כהן)' },
  { value: 'ლევი (II ასვლა)', badgeHe: 'לוי', label: 'ლევი (II ასვლა • לוי)' },
  { value: 'მესამე / შლიში (III)', badgeHe: 'שלישי', label: 'მესამე / შლიში (III • שלישי)' },
  { value: 'მეოთხე / რევიყი (IV)', badgeHe: 'רביעי', label: 'მეოთხე / რევიყი (IV • רביעי)' },
  { value: 'მეხუთე / ხამიში (V)', badgeHe: 'חמישי', label: 'მეხუთე / ხამიში (V • חמישי)' },
  { value: 'მეექვსე / შიში (VI)', badgeHe: 'ששי', label: 'მეექვსე / შიში (VI • ששי)' },
  { value: 'მეშვიდე / შვიყი (VII)', badgeHe: 'שביעי', label: 'მეშვიდე / შვიყი (VII • שביעי)' },
  { value: 'მაფტირი (დასკვნითი)', badgeHe: 'מפטיר', label: 'მაფტირი (დასკვნითი • מפטיר)' },
  { value: 'სამსახური (შამაში / სერვისი)', badgeHe: 'שמש', label: 'სამსახური (შამაში / სერვისი • שמש)' },
  { value: 'დამატებითი / მოსიფ', badgeHe: 'מוסיף', label: 'დამატებითი / მოსიფ (מוסיף)' },
  { value: 'ფეთიხათ ჰაარონი', badgeHe: 'פתיחה', label: 'ფეთიხათ ჰაარონი (פתיחת הארון)' },
  { value: 'რიმონიმის შემოტანა', badgeHe: 'რიמונים', label: 'რიმონიმის შემოტანა (הכנסת רימונים)' },
  { value: 'გაგბაობა / სეფერ თორის შემოტარება', badgeHe: 'הגבהה', label: 'გაგბაობა / შემოტარება (הגבהת ס״ת)' },
  { value: 'გლილა / შეხვევა', badgeHe: 'גלילה', label: 'გლილა / შეხვევა (גלילה)' },
  { value: 'ეც ხაიმ', badgeHe: 'עץ חיים', label: 'ეც ხაიმ (עץ חיים)' },
];

export const CURRENCY_OPTIONS = [
  { id: 'GEL', symbol: '₾', label: '₾ GEL' },
  { id: 'USD', symbol: '$', label: '$ USD' },
  { id: 'ILS', symbol: '₪', label: '₪ ILS' },
  { id: 'EUR', symbol: '€', label: '€ EUR' },
] as const;

export const ALL_54_PARASHOT_OPTIONS: SelectOption[] = (() => {
  const list: SelectOption[] = [];
  for (const book of TORAH_BOOKS) {
    if (book.parshiot) {
      for (const p of book.parshiot) {
        list.push({
          value: `${book.id}::${p.id}`,
          badgeHe: p.nameHe.replace('פרשת ', ''),
          label: `${p.nameKa} (${book.nameKa.split(' ')[0]})`,
          sublabel: `${book.nameKa} • თავი ${p.startRef}`,
        });
      }
    }
  }
  return list;
})();

const DEFAULT_FINANCIAL_OPS: FinancialOperationItem[] = [
  {
    id: 'op-1',
    type: 'income',
    title: 'ალია თორაზე (עליה לתורה)',
    amount: 250,
    currency: 'GEL',
    member: 'დავით ბენ აბრაამ მიხელაშვილი (ქოჰენი)',
    paymentMethod: 'ნაღდი / ქეში (מזומן)',
    date: '14.10.2026',
    notes: 'შაბათის დილის ლოცვა',
  },
  {
    id: 'op-2',
    type: 'income',
    title: 'ფეთიხათ ჰაარონი (פתיחת הארון)',
    amount: 500,
    currency: 'GEL',
    member: 'იოსებ ბენ იცხაკ სეფიაშვილი (ლევი)',
    paymentMethod: 'საბანკო გადარიცხვა (העברה בנקאית)',
    date: '12.10.2026',
    notes: 'ჰეხალის გახსნის მიცვა',
  },
  {
    id: 'op-3',
    type: 'expense',
    title: 'კომუნალური ხარჯები / ელექტროენერგია',
    amount: 140,
    currency: 'GEL',
    member: 'ბეთ-მიდრაშის საზოგადოება',
    paymentMethod: 'საბანკო ბარათი / POS (כרטיס אשראי)',
    date: '10.10.2026',
    notes: 'სინაგოგის განათება და გათბობა',
  },
  {
    id: 'op-4',
    type: 'income',
    title: 'წლიური საწევრო გადასახადი (דמי חברות)',
    amount: 360,
    currency: 'GEL',
    member: 'რაფაელ ბენ შლომო ჯანაშვილი (აბრეხი)',
    paymentMethod: 'ნაღდი / ქეში (מזומן)',
    date: '08.10.2026',
    notes: '2026 წლის საწევრო',
  },
];

const DEFAULT_ALIYOT_RECORDS: SeferTorahAliyahItem[] = [
  {
    id: 'aliyah-1',
    parashaKey: 'Genesis::bereshit',
    parashaNameKa: 'ბერეშით',
    parashaNameHe: 'בראשית',
    aliyahType: 'ქოჰენი (I ასვლა)',
    buyerMemberName: 'დავით ბენ აბრაამ მიხელაშვილი (ქოჰენი)',
    amount: 150,
    currency: 'GEL',
    status: 'paid',
    createdAt: '14.10.2026',
    notes: 'პირველი ალია',
  },
  {
    id: 'aliyah-2',
    parashaKey: 'Genesis::bereshit',
    parashaNameKa: 'ბერეშით',
    parashaNameHe: 'בראשית',
    aliyahType: 'ლევი (II ასვლა)',
    buyerMemberName: 'იოსებ ბენ იცხაკ სეფიაშვილი (ლევი)',
    amount: 120,
    currency: 'GEL',
    status: 'paid',
    createdAt: '14.10.2026',
    notes: 'ლევი ასვლა',
  },
  {
    id: 'aliyah-3',
    parashaKey: 'Genesis::bereshit',
    parashaNameKa: 'ბერეშით',
    parashaNameHe: 'בראשית',
    aliyahType: 'ფეთიხათ ჰაარონი',
    buyerMemberName: 'მოშე ბენ იაკოვ დავარაშვილი (ისრაელი)',
    amount: 350,
    currency: 'GEL',
    status: 'due',
    createdAt: '14.10.2026',
    notes: 'ჰეხალის გახსნა (გადასახდელი)',
  },
  {
    id: 'aliyah-4',
    parashaKey: 'Genesis::bereshit',
    parashaNameKa: 'ბერეშით',
    parashaNameHe: 'בראשית',
    aliyahType: 'სამსახური (შამაში / სერვისი)',
    buyerMemberName: 'შალომ ბენ ბენიამინ ბათიაშვილი',
    amount: 100,
    currency: 'GEL',
    status: 'paid',
    createdAt: '14.10.2026',
    notes: 'შამაშის მიცვა',
  },
  {
    id: 'aliyah-5',
    parashaKey: 'Genesis::bereshit',
    parashaNameKa: 'ბერეშით',
    parashaNameHe: 'בראשית',
    aliyahType: 'დამატებითი / მოსიფ',
    buyerMemberName: 'ეფრაიმ ბენ მორდეხაი ხახიაშვილი',
    amount: 180,
    currency: 'GEL',
    status: 'due',
    createdAt: '14.10.2026',
    notes: 'დამატებითი ალია (მოსიფი)',
  },
];

const COMM_STRINGS: Record<
  UILang,
  {
    tabOperations: string;
    tabAliyot: string;
    modalTitle: string;
    modalSubtitle: string;
    backBtn: string;
    income: string;
    expense: string;
    opNameLabel: string;
    opNamePlaceholder: string;
    donorLabel: string;
    donorPlaceholder: string;
    amountLabel: string;
    currencyLabel: string;
    paymentLabel: string;
    paymentPlaceholder: string;
    dateLabel: string;
    notesLabel: string;
    notesPlaceholder: string;
    submitOperation: string;
    parashaLabel: string;
    parashaPlaceholder: string;
    aliyahTypeLabel: string;
    buyerLabel: string;
    buyerPlaceholder: string;
    submitAliyah: string;
    filterAll: string;
    filterPaid: string;
    filterDue: string;
    statsTotal: string;
    statsBalance: string;
    statsPaid: string;
    statsDue: string;
    statusPaid: string;
    statusDue: string;
    exportCsv: string;
    printReceipt: string;
    autoSaved: string;
    deleteConfirm: string;
  }
> = {
  ka: {
    tabOperations: '💰 ახალი ფინანსური ოპერაცია',
    tabAliyot: '📜 სეფერ თორას ალიის / ფასუკების აღრიცხვა',
    modalTitle: 'სინაგოგის ფინანსები & სეფერ თორას ალიები',
    modalSubtitle: 'შემოსავლები, გასავლები, წევრთა აღრიცხვა და ალიების რეესტრი',
    backBtn: 'უკან დაბრუნება',
    income: 'შემოსავალი (הכנסה)',
    expense: 'გასავალი (הוצאה)',
    opNameLabel: 'დასახელება / ოპერაციის ტიპი',
    opNamePlaceholder: 'აირჩიეთ ან აკრიფეთ ნებისმიერი დასახელება...',
    donorLabel: 'წევრი / შემომწირველი',
    donorPlaceholder: 'აირჩიეთ წევრი ან აკრიფეთ ახალი...',
    amountLabel: 'თანხა',
    currencyLabel: 'ვალუტა',
    paymentLabel: 'გადახდის მეთოდი',
    paymentPlaceholder: 'აირჩიეთ გადახდის მეთოდი...',
    dateLabel: 'თარიღი',
    notesLabel: 'შენიშვნა / მიძღვნა (არასავალდებულო)',
    notesPlaceholder: 'დამატებითი დეტალები...',
    submitOperation: 'ოპერაციის დამატება რეესტრში',
    parashaLabel: 'ყველა ფარაშა (54 ფარაშა)',
    parashaPlaceholder: 'ყველა ფარაშა (მოძებნეთ)...',
    aliyahTypeLabel: 'ალიის / მიცვის ტიპი',
    buyerLabel: 'მყიდველი / წევრი',
    buyerPlaceholder: 'აირჩიეთ მყიდველი ან დაამატეთ ბაზაში...',
    submitAliyah: 'ალიის ჩაწერა რეესტრში',
    filterAll: 'ყველა',
    filterPaid: 'გადახდილი',
    filterDue: 'გადასახდელი',
    statsTotal: 'სულ ბრუნვა',
    statsBalance: 'სუფთა ნაშთი',
    statsPaid: 'შეგროვილი',
    statsDue: 'გადასახდელი',
    statusPaid: 'გადახდილი',
    statusDue: 'გადასახდელი',
    exportCsv: 'ექსპორტი (CSV)',
    printReceipt: 'ბეჭდვა',
    autoSaved: 'ყველა ჩანაწერი ავტომატურად ინახება სისტემაში',
    deleteConfirm: 'წავშალოთ ეს ჩანაწერი?',
  },
  he: {
    tabOperations: '💰 פעולה כספית חדשה',
    tabAliyot: '📜 רישום עליות ספר תורה ופסוקים',
    modalTitle: 'קופת בית הכנסת ועליות לספר תורה',
    modalSubtitle: 'הכנסות, הוצאות, חברי קהילה ורישום עליות',
    backBtn: 'חזרה',
    income: 'הכנסה',
    expense: 'הוצאה',
    opNameLabel: 'שם הפעולה / סוג תרומה',
    opNamePlaceholder: 'בחר או הקלד שם פעולה חופשי...',
    donorLabel: 'חבר קהילה / תורם',
    donorPlaceholder: 'בחר חבר או הקלד שם חדש...',
    amountLabel: 'סכום',
    currencyLabel: 'מטבע',
    paymentLabel: 'אמצעי תשלום',
    paymentPlaceholder: 'בחר אמצעי תשלום...',
    dateLabel: 'תאריך',
    notesLabel: 'הערות / הקדשה',
    notesPlaceholder: 'פרטים נוספים...',
    submitOperation: 'הוסף פעולה לפנקס',
    parashaLabel: 'כל הפרשות (54 פרשיות)',
    parashaPlaceholder: 'חפש פרשה...',
    aliyahTypeLabel: 'סוג עליה / מצווה',
    buyerLabel: 'רוכש / חבר',
    buyerPlaceholder: 'בחר רוכש או הוסף למאגר...',
    submitAliyah: 'רשום עליה לפנקס',
    filterAll: 'הכל',
    filterPaid: 'שולם',
    filterDue: 'בהקפה',
    statsTotal: 'סה״כ מחזור',
    statsBalance: 'יתרה',
    statsPaid: 'נגבה',
    statsDue: 'לחוב',
    statusPaid: 'שולם',
    statusDue: 'בהקפה',
    exportCsv: 'ייצוא CSV',
    printReceipt: 'הדפסה',
    autoSaved: 'כל הפעולות נשמרות אוטומטית',
    deleteConfirm: 'למחוק רשומה זו?',
  },
  en: {
    tabOperations: '💰 New Financial Operation',
    tabAliyot: '📜 Sefer Torah Aliyot & Passuk Registry',
    modalTitle: 'Synagogue Finance & Torah Aliyot Registry',
    modalSubtitle: 'Income, Expenses, Community Members & Aliyah Records',
    backBtn: 'Back',
    income: 'Income',
    expense: 'Expense',
    opNameLabel: 'Operation Title / Type',
    opNamePlaceholder: 'Select or type any custom operation...',
    donorLabel: 'Member / Donor',
    donorPlaceholder: 'Select member or type new name...',
    amountLabel: 'Amount',
    currencyLabel: 'Currency',
    paymentLabel: 'Payment Method',
    paymentPlaceholder: 'Select payment method...',
    dateLabel: 'Date',
    notesLabel: 'Notes / Dedication (Optional)',
    notesPlaceholder: 'Additional notes...',
    submitOperation: 'Record Financial Operation',
    parashaLabel: 'All Parashot (54 Parashot)',
    parashaPlaceholder: 'Search Parasha...',
    aliyahTypeLabel: 'Aliyah / Mitzvah Type',
    buyerLabel: 'Buyer / Member',
    buyerPlaceholder: 'Select buyer or add to members DB...',
    submitAliyah: 'Save Aliyah to Registry',
    filterAll: 'All',
    filterPaid: 'Paid',
    filterDue: 'Due / Pledged',
    statsTotal: 'Total Turnover',
    statsBalance: 'Net Balance',
    statsPaid: 'Collected',
    statsDue: 'Pending Due',
    statusPaid: 'Paid',
    statusDue: 'Pledged',
    exportCsv: 'Export CSV',
    printReceipt: 'Print',
    autoSaved: 'All operations automatically saved to register',
    deleteConfirm: 'Delete this record?',
  },
  ru: {
    tabOperations: '💰 Новая финансовая операция',
    tabAliyot: '📜 Реестр алий и пасуков Сефер Тора',
    modalTitle: 'Финансы синагоги и алии Сефер Тора',
    modalSubtitle: 'Доходы, расходы, члены общины и реестр алий',
    backBtn: 'Назад',
    income: 'Доход',
    expense: 'Расход',
    opNameLabel: 'Наименование операции',
    opNamePlaceholder: 'Выберите или введите название...',
    donorLabel: 'Член общины / Жертвователь',
    donorPlaceholder: 'Выберите имя или введите новое...',
    amountLabel: 'Сумма',
    currencyLabel: 'Валюта',
    paymentLabel: 'Способ оплаты',
    paymentPlaceholder: 'Выберите способ оплаты...',
    dateLabel: 'Дата',
    notesLabel: 'Примечания / Посвящение',
    notesPlaceholder: 'Дополнительно...',
    submitOperation: 'Сохранить операцию',
    parashaLabel: 'Все 54 недельные главы',
    parashaPlaceholder: 'Поиск главы...',
    aliyahTypeLabel: 'Тип алии / мицвы',
    buyerLabel: 'Покупатель / Член',
    buyerPlaceholder: 'Выберите покупателя...',
    submitAliyah: 'Записать алию',
    filterAll: 'Все',
    filterPaid: 'Оплачено',
    filterDue: 'К оплате',
    statsTotal: 'Оборот',
    statsBalance: 'Остаток',
    statsPaid: 'Оплачено',
    statsDue: 'К оплате',
    statusPaid: 'Оплачено',
    statusDue: 'К оплате',
    exportCsv: 'Экспорт CSV',
    printReceipt: 'Печать',
    autoSaved: 'Все записи сохраняются автоматически',
    deleteConfirm: 'Удалить эту запись?',
  },
  fr: {
    tabOperations: '💰 Nouvelle opération financière',
    tabAliyot: '📜 Registre des Aliyot et Passukim',
    modalTitle: 'Finances de la Synagogue & Aliyot',
    modalSubtitle: 'Recettes, dépenses et registre des aliyot',
    backBtn: 'Retour',
    income: 'Recette',
    expense: 'Dépense',
    opNameLabel: 'Titre de l’opération',
    opNamePlaceholder: 'Choisir ou saisir...',
    donorLabel: 'Membre / Donateur',
    donorPlaceholder: 'Sélectionner un membre...',
    amountLabel: 'Montant',
    currencyLabel: 'Devise',
    paymentLabel: 'Mode de paiement',
    paymentPlaceholder: 'Choisir le mode...',
    dateLabel: 'Date',
    notesLabel: 'Notes / Dédicace',
    notesPlaceholder: 'Détails...',
    submitOperation: 'Enregistrer l’opération',
    parashaLabel: 'Toutes les Parachot (54)',
    parashaPlaceholder: 'Rechercher une paracha...',
    aliyahTypeLabel: 'Type d’Aliyah / Mitsva',
    buyerLabel: 'Acheteur / Membre',
    buyerPlaceholder: 'Choisir...',
    submitAliyah: 'Enregistrer l’Aliyah',
    filterAll: 'Tous',
    filterPaid: 'Payé',
    filterDue: 'Dû',
    statsTotal: 'Total',
    statsBalance: 'Solde',
    statsPaid: 'Payé',
    statsDue: 'Dû',
    statusPaid: 'Payé',
    statusDue: 'Dû',
    exportCsv: 'Exporter CSV',
    printReceipt: 'Imprimer',
    autoSaved: 'Enregistrement automatique',
    deleteConfirm: 'Supprimer cet enregistrement ?',
  },
  es: {
    tabOperations: '💰 Nueva operación financiera',
    tabAliyot: '📜 Registro de Aliot y Pesukim',
    modalTitle: 'Finanzas de la Sinagoga & Aliot',
    modalSubtitle: 'Ingresos, gastos y registro de aliot',
    backBtn: 'Volver',
    income: 'Ingreso',
    expense: 'Gasto',
    opNameLabel: 'Nombre de la operación',
    opNamePlaceholder: 'Seleccionar o escribir...',
    donorLabel: 'Miembro / Donante',
    donorPlaceholder: 'Seleccionar miembro...',
    amountLabel: 'Monto',
    currencyLabel: 'Moneda',
    paymentLabel: 'Método de pago',
    paymentPlaceholder: 'Seleccionar método...',
    dateLabel: 'Fecha',
    notesLabel: 'Notas / Dedicatoria',
    notesPlaceholder: 'Detalles...',
    submitOperation: 'Guardar operación',
    parashaLabel: 'Todas las Parashiot (54)',
    parashaPlaceholder: 'Buscar parashá...',
    aliyahTypeLabel: 'Tipo de Aliyá / Mitzvá',
    buyerLabel: 'Comprador / Miembro',
    buyerPlaceholder: 'Seleccionar comprador...',
    submitAliyah: 'Registrar Aliyá',
    filterAll: 'Todos',
    filterPaid: 'Pagado',
    filterDue: 'Pendiente',
    statsTotal: 'Total',
    statsBalance: 'Balance',
    statsPaid: 'Cobrado',
    statsDue: 'Pendiente',
    statusPaid: 'Pagado',
    statusDue: 'Pendiente',
    exportCsv: 'Exportar CSV',
    printReceipt: 'Imprimir',
    autoSaved: 'Guardado automático',
    deleteConfirm: '¿Eliminar este registro?',
  },
  de: {
    tabOperations: '💰 Neue Finanzoperation',
    tabAliyot: '📜 Sefer Tora Alijot & Passuk-Register',
    modalTitle: 'Synagogenfinanzen & Alijot',
    modalSubtitle: 'Einnahmen, Ausgaben und Alijot-Register',
    backBtn: 'Zurück',
    income: 'Einnahme',
    expense: 'Ausgabe',
    opNameLabel: 'Titel der Operation',
    opNamePlaceholder: 'Wählen oder eingeben...',
    donorLabel: 'Mitglied / Spender',
    donorPlaceholder: 'Mitglied wählen...',
    amountLabel: 'Betrag',
    currencyLabel: 'Währung',
    paymentLabel: 'Zahlungsart',
    paymentPlaceholder: 'Zahlungsart wählen...',
    dateLabel: 'Datum',
    notesLabel: 'Notizen / Widmung',
    notesPlaceholder: 'Details...',
    submitOperation: 'Operation speichern',
    parashaLabel: 'Alle Paraschot (54)',
    parashaPlaceholder: 'Parascha suchen...',
    aliyahTypeLabel: 'Art der Alija / Mizwa',
    buyerLabel: 'Käufer / Mitglied',
    buyerPlaceholder: 'Käufer wählen...',
    submitAliyah: 'Alija speichern',
    filterAll: 'Alle',
    filterPaid: 'Bezahlt',
    filterDue: 'Fällig',
    statsTotal: 'Gesamt',
    statsBalance: 'Saldo',
    statsPaid: 'Bezahlt',
    statsDue: 'Fällig',
    statusPaid: 'Bezahlt',
    statusDue: 'Fällig',
    exportCsv: 'CSV exportieren',
    printReceipt: 'Drucken',
    autoSaved: 'Automatisch gespeichert',
    deleteConfirm: 'Diesen Eintrag löschen?',
  },
};

export function useLiveOnlinePresence(currentRealm: SacredRealmId, activeLabel: string) {
  const [onlineCount, setOnlineCount] = useState<number>(38);
  const [activeScholars, setActiveScholars] = useState<
    { id: string; name: string; studying: string; location: string }[]
  >([
    { id: 's1', name: 'რაბი დავით მ. (იერუსალიმი)', studying: 'תלמוד בבלי • ברכות ב׳ ע״א', location: 'იერუსალიმი' },
    { id: 's2', name: 'იოსებ ს. (თბილისი)', studying: 'חומש בראשית • פרשת השבוע', location: 'თბილისი' },
    { id: 's3', name: 'მოშე დ. (აშდოდი)', studying: 'שולחן ערוך וילקוט יוסף', location: 'აშდოდი' },
    { id: 's4', name: 'რაფაელ ჯ. (ბათ-იამი)', studying: 'רמב״ם • ספר המדע', location: 'ბათ-იამი' },
    { id: 's5', name: 'შალომ ბ. (ნიუ-იორკი)', studying: 'משנה ברורה • הלכות שבת', location: 'ნიუ-იორკი' },
  ]);

  useEffect(() => {
    let clientId = localStorage.getItem('talmud_presence_client_id');
    if (!clientId) {
      clientId = `scholar-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('talmud_presence_client_id', clientId);
    }

    const pingPresence = () => {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          realm: currentRealm,
          studying: activeLabel,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && typeof data.onlineCount === 'number') {
            setOnlineCount(data.onlineCount);
          } else {
            setOnlineCount((prev) => Math.max(34, Math.min(62, prev + (Math.random() > 0.5 ? 1 : -1))));
          }
        })
        .catch(() => {
          setOnlineCount((prev) => Math.max(34, Math.min(62, prev + (Math.random() > 0.5 ? 1 : -1))));
        });
    };

    pingPresence();
    const interval = setInterval(pingPresence, 15000);
    return () => clearInterval(interval);
  }, [currentRealm, activeLabel]);

  return { onlineCount, activeScholars };
}

// ============================================================================
// TOP-LEFT APPLICATION LOGO MASTER INTERFACES DROPDOWN MENU
// ============================================================================
interface TopLeftLogoInterfacesMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeRealm: SacredRealmId;
  onSelectRealm: (realmId: SacredRealmId) => void;
  onOpenGlobe: () => void;
  onOpenAuthModal: () => void;
  onOpenDedicationModal: () => void;
  isDark: boolean;
}

export const TopLeftLogoInterfacesMenu: React.FC<TopLeftLogoInterfacesMenuProps> = ({
  isOpen,
  onClose,
  activeRealm,
  onSelectRealm,
  onOpenGlobe,
  onOpenAuthModal,
  onOpenDedicationModal,
  isDark,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="logo-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[145] bg-black/45 backdrop-blur-xs"
          />
          <motion.div
            key="logo-menu-panel"
            initial={{ opacity: 0, x: -16, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, y: -8, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-[62px] sm:top-[68px] left-2 sm:left-5 z-[150] w-[calc(100vw-16px)] max-w-[390px] max-h-[85vh] overflow-y-auto rounded-3xl border-2 p-3.5 shadow-[0_24px_65px_rgba(0,0,0,0.85)] ${
              isDark
                ? 'bg-[#1D130C]/98 border-[#C49A6C] text-[#FAF5EB]'
                : 'bg-[#FAF3E4]/98 border-[#5C3A21] text-[#21140B]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#8B5A2B]/35 pb-2.5 mb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black">
                  სასწავლო ინტერფეისების მთავარი მენიუ
                </h3>
                <p className="text-[10px] opacity-80">
                  თანახი • თალმუდი • ჰალახის 5 სკოლა • 3D გლობუსი • კალენდარი
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl border border-[#C49A6C]/45 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Super-Animated Galactic 3D Globe Trigger */}
            <button
              type="button"
              onClick={() => {
                onOpenGlobe();
                onClose();
              }}
              className="w-full mb-2.5 p-3 rounded-2xl border-2 border-[#FAF5EB] bg-gradient-to-r from-[#5C3A21] via-[#8B5A2B] to-[#5C3A21] text-[#FAF5EB] flex items-center justify-between gap-2 shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-left">
                <Globe className="w-5 h-5 text-[#F5DFBB] shrink-0" />
                <div>
                  <div className="text-xs font-black">გალაქტიკური 3D გლობუსი და ჭკვიანი AI</div>
                  <div className="text-[10px] text-[#E8D8BE]">
                    მბრუნავი 3D სფერო ყველა სასწავლო კონტინენტით
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-[#F5DFBB] shrink-0" />
            </button>

            {/* 2. All 10 Sacred Study Interfaces */}
            <div className="space-y-1.5">
              {SACRED_REALMS.map((realm) => {
                const isActive = realm.id === activeRealm;
                return (
                  <button
                    key={realm.id}
                    type="button"
                    onClick={() => {
                      onSelectRealm(realm.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#21140B] border-[#5C3A21] font-black shadow-sm'
                        : isDark
                          ? 'bg-[#291B12] hover:bg-[#382518] border-[#5C3A21]/60 text-[#FAF5EB]'
                          : 'bg-[#FFFDF8] hover:bg-[#E8D8BE] border-[#C9B38C] text-[#21140B]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold truncate">{realm.titleKa}</div>
                      <div className="text-[10px] opacity-80 truncate">{realm.subtitleKa}</div>
                    </div>
                    <span
                      dir="rtl"
                      className={`font-serif text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                        isActive
                          ? 'bg-[#21140B] text-[#FAF5EB]'
                          : 'bg-[#5C3A21]/30 text-[#C49A6C]'
                      }`}
                    >
                      {realm.badgeHe}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Study Dedication & Registration */}
            <div className="mt-3 pt-2.5 border-t border-[#8B5A2B]/35 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenDedicationModal();
                  onClose();
                }}
                className="p-2.5 rounded-2xl border border-[#C49A6C]/50 bg-[#5C3A21]/25 hover:bg-[#5C3A21]/40 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">სწავლის მიძღვნა</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAuthModal();
                  onClose();
                }}
                className="p-2.5 rounded-2xl border border-[#C49A6C]/50 bg-[#5C3A21]/25 hover:bg-[#5C3A21]/40 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">რეგისტრაცია / შესვლა</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectRealm('yalkut-yosef');
                  onClose();
                }}
                className="col-span-2 p-2.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-[#7C3F14] via-[#9A501B] to-[#6B3510] text-[#FAF5EB] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110"
              >
                <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                <span dir="rtl" className="font-serif text-amber-200 font-black">
                  ילקוט יוסף - קיצור שולחן ערוך
                </span>
                <span className="truncate">• იალკუტ იოსეფი</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectRealm('daily-halakhot');
                  onClose();
                }}
                className="col-span-2 p-2.5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-[#0F5132] via-[#157347] to-[#0B3D24] text-[#FAF5EB] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110"
              >
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span dir="rtl" className="font-serif text-amber-200 font-black">
                  שתי הלכות בכל יום
                </span>
                <span className="truncate">• ყოველდღიური ორი ჰალახა</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectRealm('siddur');
                  onClose();
                }}
                className="col-span-2 p-2.5 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-[#6B4226] via-[#8B5A2B] to-[#6B4226] text-[#FAF5EB] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110"
              >
                <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="truncate">
                  სიდური • סידור כוונת הלב & კლასიკური (PDF დაფი)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectRealm('blessings');
                  onClose();
                }}
                className="p-2.5 rounded-2xl border border-[#FAF5EB] bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#21140B] text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">კურთხევები • ברכות</span>
              </button>

              <a
                href="/export/Talmud-Bavli-3D.apk"
                download="Talmud-Bavli-3D.apk"
                onClick={onClose}
                className="col-span-2 p-2.5 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-[#5C3A21] via-[#7A4E2D] to-[#5C3A21] text-[#FAF5EB] text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md hover:brightness-110"
              >
                <Download className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="truncate">Android APK ფაილის ჩამოტვირთვა (Export APK)</span>
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// DAILY STUDY DEDICATION RIBBON (לעილוי נשמת / לרפואה שלמה / להצלחה)
// ============================================================================
interface DailyStudyDedicationRibbonProps {
  activeDedication: StudyDedicationItem;
  onOpenDedicationModal: () => void;
  activeRealm: SacredRealmId;
  onSelectRealm: (realm: SacredRealmId) => void;
  isDark: boolean;
}

export const DailyStudyDedicationRibbon: React.FC<DailyStudyDedicationRibbonProps> = ({
  activeDedication,
  onOpenDedicationModal,
  isDark,
}) => {
  return (
    <div className="dedication-ribbon-wrap">
      <Button variant="ghost" onClick={onOpenDedicationModal} className="dedication-ribbon" aria-label="სწავლის მიძღვნა">
        <Flame className="shrink-0" />
        <span className="dedication-ribbon-copy">
          <span className="dedication-ribbon-type">{activeDedication.typeLabelKa}</span>
          <span className="dedication-ribbon-name">{activeDedication.honoreeNameKa}</span>
        </span>
        <Plus className="shrink-0" />
      </Button>
    </div>
  );
};

// ============================================================================
// COMBINED MODALS FOR AUTH/ONLINE AND STUDY DEDICATION
// ============================================================================
export interface CommunityModalsManagerProps {
  authModalOpen: boolean;
  onCloseAuthModal: () => void;
  dedicationModalOpen: boolean;
  onCloseDedicationModal: () => void;
  currentUser: RegisteredScholarUser | null;
  onUpdateUser: (user: RegisteredScholarUser | null) => void;
  activeDedication: StudyDedicationItem;
  onSelectDedication: (item: StudyDedicationItem) => void;
  onlineCount: number;
  activeScholars: { id: string; name: string; studying: string; location: string }[];
  isDark: boolean;
  uiLang?: UILang;
}

export const CommunityModalsManager: React.FC<CommunityModalsManagerProps> = ({
  authModalOpen,
  onCloseAuthModal,
  dedicationModalOpen,
  onCloseDedicationModal,
  currentUser,
  onUpdateUser,
  activeDedication,
  onSelectDedication,
  onlineCount,
  activeScholars,
  isDark,
  uiLang = 'ka',
}) => {
  const onCloseFundModal = () => {};
  const [membersDb, setMembersDb] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_members_db_v1');
      return saved ? JSON.parse(saved) : DEFAULT_MEMBERS_DB;
    } catch {
      return DEFAULT_MEMBERS_DB;
    }
  });

  const handleAddMemberToDb = (newMemberName: string) => {
    const clean = newMemberName.trim();
    if (!clean || membersDb.includes(clean)) return;
    const updated = [clean, ...membersDb];
    setMembersDb(updated);
    try {
      localStorage.setItem('talmud_members_db_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Auth form state
  const [authFullName, setAuthFullName] = useState('');
  const [authHebrewName, setAuthHebrewName] = useState('דוד בן אברהם');
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState('');
  const [authCommunity, setAuthCommunity] = useState('თბილისის დიდი სინაგოგა / იერუსალიმი');

  // Study Dedication state
  const [dedicationsList, setDedicationsList] = useState<StudyDedicationItem[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_study_dedications_v1');
      return saved ? JSON.parse(saved) : DEFAULT_DEDICATIONS;
    } catch {
      return DEFAULT_DEDICATIONS;
    }
  });
  const [newDedType, setNewDedType] = useState<StudyDedicationItem['type']>('leilui-nishmat');
  const [newDedHonoreeKa, setNewDedHonoreeKa] = useState('');
  const [newDedHonoreeHe, setNewDedHonoreeHe] = useState('');
  const [newDedSponsorKa, setNewDedSponsorKa] = useState(membersDb[0] || '');
  const [newDedCustomMemberInput, setNewDedCustomMemberInput] = useState('');
  const [dedicationFilterType, setDedicationFilterType] = useState<'all' | StudyDedicationItem['type']>('all');
  const [dedicationSearchQuery, setDedicationSearchQuery] = useState('');
  const [litDedicationCandles, setLitDedicationCandles] = useState<Record<string, boolean>>({
    'ded-1': true,
    'ded-2': true,
  });

  const memberOptions: SelectOption[] = membersDb.map((m) => ({
    value: m,
    badgeHe: 'חבר קהילה',
    label: m,
  }));

  const handleQuickAuth = (method: RegisteredScholarUser['authMethod'], defaultName?: string) => {
    const finalName = authFullName.trim() || defaultName || 'დავით მიხელაშვილი';
    const newUser: RegisteredScholarUser = {
      id: `u-${Date.now()}`,
      fullName: finalName,
      hebrewName: authHebrewName.trim() || 'דוד בן אברהם',
      emailOrPhone: authEmailOrPhone.trim() || 'scholar@beitmidrash.org',
      communityKa: authCommunity.trim() || 'იერუსალიმი / თბილისი',
      authMethod: method,
      joinedAt: new Date().toLocaleDateString('ka-GE'),
    };
    onUpdateUser(newUser);
    handleAddMemberToDb(finalName);
    try {
      localStorage.setItem('talmud_registered_user_v1', JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const commT = COMM_STRINGS[uiLang] || COMM_STRINGS.ka;

  // Default Currency synced with SettingsModal and localStorage
  const [defaultCurrency, setDefaultCurrency] = useState<AppCurrency>(() => {
    try {
      const saved = localStorage.getItem('talmud_default_currency_v1');
      if (saved && ['GEL', 'USD', 'ILS', 'EUR'].includes(saved)) {
        return saved as AppCurrency;
      }
    } catch {
      // ignore
    }
    return 'GEL';
  });

  useEffect(() => {
    const handleCurrencyChanged = (e: any) => {
      if (e.detail && ['GEL', 'USD', 'ILS', 'EUR'].includes(e.detail)) {
        setDefaultCurrency(e.detail);
        setOpCurrency(e.detail);
        setAliyahCurrency(e.detail);
      }
    };
    window.addEventListener('talmud-default-currency-changed', handleCurrencyChanged);
    return () => {
      window.removeEventListener('talmud-default-currency-changed', handleCurrencyChanged);
    };
  }, []);

  // 1. Financial Operations State
  const [financialOpsList, setFinancialOpsList] = useState<FinancialOperationItem[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_financial_operations_v1');
      return saved ? JSON.parse(saved) : DEFAULT_FINANCIAL_OPS;
    } catch {
      return DEFAULT_FINANCIAL_OPS;
    }
  });

  const [activeFundTab, setActiveFundTab] = useState<'operations' | 'aliyot'>('operations');
  const [opFlowType, setOpFlowType] = useState<'income' | 'expense'>('income');
  const [opTitle, setOpTitle] = useState<string>(STANDARD_OPERATION_OPTIONS[0].value);
  const [opAmount, setOpAmount] = useState<string>('');
  const [opCurrency, setOpCurrency] = useState<AppCurrency>(defaultCurrency);
  const [opMember, setOpMember] = useState<string>(membersDb[0] || 'დავით ბენ აბრაამ მიხელაშვილი (ქოჰენი)');
  const [opPaymentMethod, setOpPaymentMethod] = useState<string>(PAYMENT_METHOD_OPTIONS[0].value);
  const [opDate, setOpDate] = useState<string>(() => new Date().toLocaleDateString('ka-GE'));
  const [opNotes, setOpNotes] = useState<string>('');
  const [opSearchQuery, setOpSearchQuery] = useState<string>('');
  const [opFilterType, setOpFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // 2. Sefer Torah Aliyot & Passukim State
  const [aliyotRecordsList, setAliyotRecordsList] = useState<SeferTorahAliyahItem[]>(() => {
    try {
      const saved = localStorage.getItem('talmud_sefer_torah_aliyot_v1');
      return saved ? JSON.parse(saved) : DEFAULT_ALIYOT_RECORDS;
    } catch {
      return DEFAULT_ALIYOT_RECORDS;
    }
  });

  const [aliyahParashaKey, setAliyahParashaKey] = useState<string>(
    ALL_54_PARASHOT_OPTIONS[0]?.value || 'Genesis::bereshit'
  );
  const [aliyahType, setAliyahType] = useState<string>(ALIYAH_MITZVAH_OPTIONS[0].value);
  const [aliyahBuyer, setAliyahBuyer] = useState<string>(membersDb[0] || 'დავით ბენ აბრაამ მიხელაშვილი (ქოჰენი)');
  const [aliyahAmount, setAliyahAmount] = useState<string>('');
  const [aliyahCurrency, setAliyahCurrency] = useState<AppCurrency>(defaultCurrency);
  const [aliyahStatus, setAliyahStatus] = useState<'paid' | 'due'>('paid');
  const [aliyahNotes, setAliyahNotes] = useState<string>('');
  const [aliyahSearchQuery, setAliyahSearchQuery] = useState<string>('');
  const [aliyahFilterStatus, setAliyahFilterStatus] = useState<'all' | 'paid' | 'due'>('all');

  const handleAddFinancialOperation = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(opAmount);
    if (!amt || isNaN(amt) || amt <= 0) return;
    const newOp: FinancialOperationItem = {
      id: `op-${Date.now()}`,
      type: opFlowType,
      title: opTitle.trim() || (opFlowType === 'income' ? 'შემოსავალი' : 'გასავალი'),
      amount: amt,
      currency: opCurrency,
      member: opMember.trim() || 'ანონიმური წევრი',
      paymentMethod: opPaymentMethod,
      date: opDate || new Date().toLocaleDateString('ka-GE'),
      notes: opNotes.trim() || undefined,
    };
    const updated = [newOp, ...financialOpsList];
    setFinancialOpsList(updated);
    try {
      localStorage.setItem('talmud_financial_operations_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setOpAmount('');
    setOpNotes('');
  };

  const handleDeleteFinancialOperation = (id: string) => {
    const updated = financialOpsList.filter((item) => item.id !== id);
    setFinancialOpsList(updated);
    try {
      localStorage.setItem('talmud_financial_operations_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddAliyahRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(aliyahAmount) || 0;
    const parashaOpt = ALL_54_PARASHOT_OPTIONS.find((p) => p.value === aliyahParashaKey);
    const newAliyah: SeferTorahAliyahItem = {
      id: `aliyah-${Date.now()}`,
      parashaKey: aliyahParashaKey,
      parashaNameKa: parashaOpt?.label || aliyahParashaKey,
      parashaNameHe: parashaOpt?.badgeHe || 'תורה',
      aliyahType,
      buyerMemberName: aliyahBuyer.trim() || 'ანონიმური მყიდველი',
      amount: amt,
      currency: aliyahCurrency,
      status: aliyahStatus,
      createdAt: new Date().toLocaleDateString('ka-GE'),
      notes: aliyahNotes.trim() || undefined,
    };
    const updated = [newAliyah, ...aliyotRecordsList];
    setAliyotRecordsList(updated);
    try {
      localStorage.setItem('talmud_sefer_torah_aliyot_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    // Also record into financial operations as income if amount > 0
    if (amt > 0) {
      const financialEntry: FinancialOperationItem = {
        id: `op-aliyah-${Date.now()}`,
        type: 'income',
        title: `სეფერ თორა: ${aliyahType} (${parashaOpt?.badgeHe || ''})`,
        amount: amt,
        currency: aliyahCurrency,
        member: aliyahBuyer.trim() || 'ანონიმური მყიდველი',
        paymentMethod: aliyahStatus === 'paid' ? 'ნაღდი / ქეში (מזומן)' : 'გადასახდელი / ნისიად (בהקפה)',
        date: new Date().toLocaleDateString('ka-GE'),
        notes: aliyahNotes.trim() ? `ალია • ${aliyahNotes.trim()}` : 'სეფერ თორის ალიის შემოწირულობა',
      };
      const updatedOps = [financialEntry, ...financialOpsList];
      setFinancialOpsList(updatedOps);
      try {
        localStorage.setItem('talmud_financial_operations_v1', JSON.stringify(updatedOps));
      } catch {
        // ignore
      }
    }
    setAliyahAmount('');
    setAliyahNotes('');
  };

  const handleToggleAliyahStatus = (id: string) => {
    const updated = aliyotRecordsList.map((a) =>
      a.id === id ? { ...a, status: (a.status === 'paid' ? 'due' : 'paid') as 'paid' | 'due' } : a
    );
    setAliyotRecordsList(updated);
    try {
      localStorage.setItem('talmud_sefer_torah_aliyot_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteAliyahRecord = (id: string) => {
    const updated = aliyotRecordsList.filter((a) => a.id !== id);
    setAliyotRecordsList(updated);
    try {
      localStorage.setItem('talmud_sefer_torah_aliyot_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleExportCsv = () => {
    if (activeFundTab === 'operations') {
      const header = 'ID,Type,Title,Amount,Currency,Member,PaymentMethod,Date,Notes\n';
      const rows = financialOpsList
        .map(
          (op) =>
            `"${op.id}","${op.type}","${op.title}","${op.amount}","${op.currency}","${op.member}","${op.paymentMethod}","${op.date}","${op.notes || ''}"`
        )
        .join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial_operations_${Date.now()}.csv`;
      a.click();
    } else {
      const header = 'ID,Parasha,AliyahType,Buyer,Amount,Currency,Status,Date,Notes\n';
      const rows = aliyotRecordsList
        .map(
          (al) =>
            `"${al.id}","${al.parashaNameKa} (${al.parashaNameHe})","${al.aliyahType}","${al.buyerMemberName}","${al.amount}","${al.currency}","${al.status}","${al.createdAt}","${al.notes || ''}"`
        )
        .join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sefer_torah_aliyot_${Date.now()}.csv`;
      a.click();
    }
  };

  // Filtered lists & calculations
  const filteredFinancialOps = useMemo(() => {
    return financialOpsList.filter((op) => {
      if (opFilterType !== 'all' && op.type !== opFilterType) return false;
      if (!opSearchQuery.trim()) return true;
      const q = opSearchQuery.toLowerCase();
      return (
        op.title.toLowerCase().includes(q) ||
        op.member.toLowerCase().includes(q) ||
        op.paymentMethod.toLowerCase().includes(q) ||
        (op.notes && op.notes.toLowerCase().includes(q))
      );
    });
  }, [financialOpsList, opFilterType, opSearchQuery]);

  const totalIncome = useMemo(
    () =>
      financialOpsList
        .filter((op) => op.type === 'income')
        .reduce((sum, op) => sum + op.amount, 0),
    [financialOpsList]
  );

  const totalExpense = useMemo(
    () =>
      financialOpsList
        .filter((op) => op.type === 'expense')
        .reduce((sum, op) => sum + op.amount, 0),
    [financialOpsList]
  );

  const netBalance = totalIncome - totalExpense;

  const filteredAliyotRecords = useMemo(() => {
    return aliyotRecordsList.filter((al) => {
      if (aliyahFilterStatus !== 'all' && al.status !== aliyahFilterStatus) return false;
      if (!aliyahSearchQuery.trim()) return true;
      const q = aliyahSearchQuery.toLowerCase();
      return (
        al.parashaNameKa.toLowerCase().includes(q) ||
        al.parashaNameHe.toLowerCase().includes(q) ||
        al.aliyahType.toLowerCase().includes(q) ||
        al.buyerMemberName.toLowerCase().includes(q) ||
        (al.notes && al.notes.toLowerCase().includes(q))
      );
    });
  }, [aliyotRecordsList, aliyahFilterStatus, aliyahSearchQuery]);

  const totalAliyotPledged = useMemo(
    () => aliyotRecordsList.reduce((sum, a) => sum + a.amount, 0),
    [aliyotRecordsList]
  );

  const totalAliyotPaid = useMemo(
    () =>
      aliyotRecordsList
        .filter((a) => a.status === 'paid')
        .reduce((sum, a) => sum + a.amount, 0),
    [aliyotRecordsList]
  );

  const totalAliyotDue = useMemo(
    () =>
      aliyotRecordsList
        .filter((a) => a.status === 'due')
        .reduce((sum, a) => sum + a.amount, 0),
    [aliyotRecordsList]
  );

  return (
    <>
      {/* ===================================================================== */}
      {/* 1. REGISTRATION / AUTH & LIVE ONLINE SCHOLARS MODAL                   */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {authModalOpen && (
          <motion.div
            key="auth-online-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseAuthModal}
            className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden box-border"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden box-border ${
                isDark
                  ? 'bg-[#1D140D] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#FAF3E4] border-[#6E472B] text-[#21140B]'
              }`}
            >
              {/* Sticky Top Header with Back & Close Buttons */}
              <div
                className={`shrink-0 px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-2 ${
                  isDark ? 'bg-[#261910] border-[#8B5A2B]/40' : 'bg-[#EFE2C8] border-[#8B5A2B]/35'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={onCloseAuthModal}
                    className="px-2.5 py-1.5 rounded-xl bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] text-xs font-extrabold flex items-center gap-1 border border-[#C49A6C]/60 cursor-pointer shrink-0 shadow-xs"
                    title="უკან დაბრუნება"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>უკან დაბრუნება</span>
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white hidden sm:flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-black truncate">
                      მომხმარებლის რეგისტრაცია • წევრთა ბაზა
                    </h3>
                    <p className="text-[10.5px] opacity-80 truncate">
                      ავტორიზაცია, სწავლის პროგრესი და ონლაინ მონაწილეობა
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseAuthModal}
                  className="p-2 rounded-xl bg-[#5C3A21] text-[#FAF5EB] border border-[#C49A6C]/50 cursor-pointer shrink-0"
                  title="დახურვა"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Middle Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
                {currentUser ? (
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDark ? 'bg-[#25180E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                        {currentUser.fullName[0] || 'D'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm flex items-center gap-1.5">
                          <span>{currentUser.fullName}</span>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div dir="rtl" className="font-serif text-xs opacity-80">
                          {currentUser.hebrewName}
                        </div>
                        <div className="text-[11px] opacity-70">
                          {currentUser.communityKa} • {currentUser.emailOrPhone}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateUser(null);
                        localStorage.removeItem('talmud_registered_user_v1');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-950/40 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>გასვლა</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAuth('google', 'დავით მიხელაშვილი')}
                        className="py-2.5 px-3 rounded-2xl border border-[#C49A6C]/60 bg-[#5C3A21]/30 hover:bg-[#5C3A21]/50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Google-ით შესვლა</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAuth('apple', 'იოსებ სეფიაშვილი')}
                        className="py-2.5 px-3 rounded-2xl border border-[#C49A6C]/60 bg-[#5C3A21]/30 hover:bg-[#5C3A21]/50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Apple ID-ით შესვლა</span>
                      </button>
                    </div>

                    <div className="text-[11px] opacity-70 text-center uppercase tracking-widest">
                      — ან შეავსეთ მონაცემები —
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block font-bold mb-1">სრული სახელი (ქართულად):</label>
                        <input
                          type="text"
                          value={authFullName}
                          onChange={(e) => setAuthFullName(e.target.value)}
                          placeholder="მაგ: დავით მიხელაშვილი"
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark
                              ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                              : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">ებრაული სახელი (שם עברי):</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={authHebrewName}
                          onChange={(e) => setAuthHebrewName(e.target.value)}
                          placeholder="דוד בן אברהם"
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark
                              ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                              : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">ელ-ფოსტა ან ტელეფონი:</label>
                        <input
                          type="text"
                          value={authEmailOrPhone}
                          onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                          placeholder="+995 599 00 00 00 / email@..."
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark
                              ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                              : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">სინაგოგა / თემი:</label>
                        <input
                          type="text"
                          value={authCommunity}
                          onChange={(e) => setAuthCommunity(e.target.value)}
                          placeholder="თბილისის დიდი სინაგოგა / იერუსალიმი"
                          className={`w-full px-3 py-2 rounded-xl border outline-none ${
                            isDark
                              ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                              : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                          }`}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleQuickAuth('email')}
                      className="w-full py-2.5 rounded-2xl bg-[#6B4226] hover:bg-[#7D4E2D] text-[#FAF5EB] font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>რეგისტრაციის დასრულება და წევრთა ბაზაში ჩაწერა</span>
                    </button>
                  </div>
                )}

                {/* Live Active Online Users List */}
                <div className="pt-3 border-t border-[#8B5A2B]/35 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>ამჟამად ონლაინ მყოფი შემსწავლელები ({onlineCount}):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeScholars.map((sc) => (
                      <div
                        key={sc.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          isDark ? 'bg-[#281B12] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold truncate">{sc.name}</div>
                          <div dir="rtl" className="font-serif text-[11px] text-[#C49A6C] truncate">
                            {sc.studying}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-800/40 text-emerald-300 font-bold shrink-0">
                          LIVE
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Footer with Return Button */}
              <div
                className={`shrink-0 px-4 sm:px-5 py-2.5 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'bg-[#261910] border-[#8B5A2B]/40' : 'bg-[#EFE2C8] border-[#8B5A2B]/35'
                }`}
              >
                <span className="text-[11px] opacity-75 truncate">
                  ყველა ახალი მომხმარებელი ავტომატურად ემატება წევრთა ბაზას
                </span>
                <button
                  type="button"
                  onClick={onCloseAuthModal}
                  className="px-4 py-1.5 rounded-xl bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] text-xs font-extrabold flex items-center gap-1.5 border border-[#C49A6C]/60 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>უკან დაბრუნება</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* 2. DAILY STUDY DEDICATION MODAL (לעילוי נשמת / לרפואה שלמה / להצלחה)  */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {dedicationModalOpen && (
          <motion.div
            key="study-dedication-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseDedicationModal}
            className="dedication-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-labelledby="dedication-dialog-title" className={`dedication-dialog w-full max-w-2xl flex flex-col overflow-hidden box-border ${
                isDark
                  ? 'bg-[#1D140D] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#FAF3E4] border-[#6E472B] text-[#21140B]'
              }`}
            >
              <header className="dedication-dialog-header">
                <div className="min-w-0 flex-1"><h3 id="dedication-dialog-title">სწავლის მიძღვნა</h3></div>
                <Button variant="ghost" size="icon" onClick={onCloseDedicationModal} aria-label="დახურვა" title="დახურვა"><X /></Button>
              </header>

              {/* Scrollable Middle Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 dedication-dialog-body">
                {/* Category Filter Pills & Search */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'ყველა', he: 'הכל' },
                        { id: 'leilui-nishmat', label: 'სულის საოხად', he: 'לעילוי נשמת' },
                        { id: 'refuah-shlemah', label: 'ჯანმრთელობა', he: 'לרפואה שלמה' },
                        { id: 'hatzlacha', label: 'წარმატება', he: 'להצלחה' },
                        { id: 'shalom-bayit', label: 'მშვიდობა', he: 'שלום בית' },
                      ] as const
                    ).map((cat) => {
                      const active = dedicationFilterType === cat.id;
                      return (
                        <Button variant="ghost"
                          key={cat.id}
                          type="button"
                          onClick={() => setDedicationFilterType(cat.id)}
                          className={`px-2 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                            active
                              ? 'bg-[#6B4226] text-[#FAF5EB] border-[#C49A6C] shadow-xs'
                              : isDark
                                ? 'bg-[#281B12] text-[#E8D8BE] border-[#5C3A21]'
                                : 'bg-[#FFFDF8] text-[#21140B] border-[#C9B38C]'
                          }`}
                        >
                          <span className="truncate">{cat.label}</span>
                        </Button>
                      );
                    })}
                  </div>

                  <div
                    className={`w-full flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                      isDark
                        ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                        : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <input
                      type="text"
                      value={dedicationSearchQuery}
                      onChange={(e) => setDedicationSearchQuery(e.target.value)}
                      placeholder="მოძებნეთ სახელით ან მიმძღვნელით..."
                      className="flex-1 min-w-0 bg-transparent text-xs outline-none"
                    />
                    <VoiceSearchMicButton
                      onTranscript={(text) => setDedicationSearchQuery(text)}
                      isDark={isDark}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Existing Dedications Selector */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black">აირჩიეთ აქტიური მიძღვნა დაფაზე გამოსატანად:</h4>
                  {dedicationsList
                    .filter((item) => {
                      if (dedicationFilterType !== 'all' && item.type !== dedicationFilterType) {
                        return false;
                      }
                      if (!dedicationSearchQuery.trim()) return true;
                      const q = dedicationSearchQuery.toLowerCase();
                      return (
                        item.honoreeNameKa.toLowerCase().includes(q) ||
                        item.honoreeNameHe.toLowerCase().includes(q) ||
                        item.sponsorNameKa.toLowerCase().includes(q)
                      );
                    })
                    .map((item) => {
                      const isCurrent = item.id === activeDedication.id;
                      const isLit = Boolean(litDedicationCandles[item.id]);
                      return (
                        <div
                          key={item.id}
                          className={`dedication-entry w-full p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                            isCurrent
                              ? 'bg-gradient-to-r from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#21140B] border-2 border-[#5C3A21] font-black shadow-md'
                              : isDark
                                ? 'bg-[#281B12] hover:bg-[#362417] border-[#5C3A21] text-[#FAF5EB]'
                                : 'bg-[#FFFDF8] hover:bg-[#EFE2C8] border-[#C9B38C] text-[#21140B]'
                          }`}
                        >
                          <div
                            onClick={() => {
                              onSelectDedication(item);
                              onCloseDedicationModal();
                            }}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <Flame
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isLit ? 'text-amber-500 animate-pulse' : 'opacity-50'
                                }`}
                              />
                              <span className="text-[11px] font-extrabold">{item.typeLabelKa}</span>
                            </div>
                            <div className="text-xs sm:text-sm font-black whitespace-normal break-words mt-1">
                              {item.honoreeNameKa}
                            </div>
                            <div dir="rtl" className="font-serif text-xs opacity-85 whitespace-normal">
                              {item.typeLabelHe} • {item.honoreeNameHe}
                            </div>
                            {item.sponsorNameKa && (
                              <div className="text-[10.5px] opacity-75 whitespace-normal">
                                მიმძღვნელი: {item.sponsorNameKa}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button variant="ghost"
                              type="button"
                              onClick={() =>
                                setLitDedicationCandles((prev) => ({
                                  ...prev,
                                  [item.id]: !prev[item.id],
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ${
                                isLit
                                  ? 'bg-amber-500/25 border-amber-500 text-amber-500'
                                  : 'bg-black/15 border-current/25 opacity-75'
                              }`}
                              title="მემორიალური / კურთხევის სანთლის ანთება"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>{isLit ? 'ანთია' : 'სანთელი'}</span>
                            </Button>

                            <Button variant="ghost"
                              type="button"
                              onClick={() => {
                                onSelectDedication(item);
                                onCloseDedicationModal();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#21140B] text-[#FAF5EB]'
                                  : 'bg-[#6B4226] text-[#FAF5EB] hover:bg-[#7D4E2D]'
                              }`}
                            >
                              {isCurrent ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>აქტიურია</span>
                                </>
                              ) : (
                                <span>არჩევა</span>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Add New Study Dedication Form */}
                <div className="pt-3 border-t border-[#8B5A2B]/35 space-y-3">
                  <h4 className="text-xs font-black">+ ახალი მიძღვნის დამატება:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SearchableSelect
                      label="მიძღვნის დანიშნულება:"
                      options={[
                        { value: 'leilui-nishmat', badgeHe: 'לעילוי נשמת', label: 'სულის მოსამაღლებლად (לעילוי נשמת)' },
                        { value: 'refuah-shlemah', badgeHe: 'לרפואה שלמה', label: 'ჯანმრთელობის გასაუმჯობესებლად (לרפואה שלמה)' },
                        { value: 'hatzlacha', badgeHe: 'להצלחה וברכה', label: 'საკეთილდღეოდ და წარმატებისთვის (להצלחה)' },
                        { value: 'shalom-bayit', badgeHe: 'לשלום בית', label: 'ოჯახის მშვიდობისა და კურთხევისთვის' },
                      ]}
                      value={newDedType}
                      onChange={(val) => setNewDedType(val as StudyDedicationItem['type'])}
                      isDark={isDark}
                    />

                    <SearchableSelect
                      label="მიმძღვნელი წევრი (ბაზიდან):"
                      options={memberOptions}
                      value={newDedSponsorKa}
                      onChange={(val) => setNewDedSponsorKa(val)}
                      isDark={isDark}
                    />

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        ვის ეძღვნება (სახელი ქართულად):
                      </label>
                      <input
                        type="text"
                        value={newDedHonoreeKa}
                        onChange={(e) => setNewDedHonoreeKa(e.target.value)}
                        placeholder="მაგ: აბრაამ ბენ სარა..."
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                          isDark
                            ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">
                        სახელი ებრაულად (פלוני בן פלונית):
                      </label>
                      <input
                        type="text"
                        dir="rtl"
                        value={newDedHonoreeHe}
                        onChange={(e) => setNewDedHonoreeHe(e.target.value)}
                        placeholder="אברהם בן שרה"
                        className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                          isDark
                            ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDedCustomMemberInput}
                      onChange={(e) => setNewDedCustomMemberInput(e.target.value)}
                      placeholder="თუ მიმძღვნელი არ არის წევრთა ბაზაში, აკრიფეთ აქ დასამატებლად..."
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none ${
                        isDark
                          ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                          : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                      }`}
                    />
                    {newDedCustomMemberInput.trim().length > 1 && (
                      <Button variant="ghost"
                        type="button"
                        onClick={() => {
                          const m = newDedCustomMemberInput.trim();
                          handleAddMemberToDb(m);
                          setNewDedSponsorKa(m);
                          setNewDedCustomMemberInput('');
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-extrabold cursor-pointer shrink-0"
                      >
                        + წევრის დამატება
                      </Button>
                    )}
                  </div>

                  <Button variant="ghost"
                    type="button"
                    onClick={() => {
                      if (!newDedHonoreeKa.trim()) return;
                      const typeLabels: Record<
                        StudyDedicationItem['type'],
                        { ka: string; he: string }
                      > = {
                        'leilui-nishmat': {
                          ka: 'სულის მოსამაღლებლად (לעילוי נשמת)',
                          he: 'לעילוי נשמת',
                        },
                        'refuah-shlemah': {
                          ka: 'ჯანმრთელობის გასაუმჯობესებლად (לרפואה שלמה)',
                          he: 'לרפואה שלמה',
                        },
                        hatzlacha: {
                          ka: 'საკეთილდღეოდ და წარმატებისთვის (להצלחה וברכה)',
                          he: 'להצלחה וברכה',
                        },
                        'shalom-bayit': {
                          ka: 'ოჯახის მშვიდობისა და კურთხევისთვის',
                          he: 'לשלום בית',
                        },
                      };
                      const created: StudyDedicationItem = {
                        id: `ded-${Date.now()}`,
                        type: newDedType,
                        typeLabelKa: typeLabels[newDedType].ka,
                        typeLabelHe: typeLabels[newDedType].he,
                        honoreeNameKa: newDedHonoreeKa.trim(),
                        honoreeNameHe: newDedHonoreeHe.trim() || newDedHonoreeKa.trim(),
                        sponsorNameKa: newDedSponsorKa,
                        noteKa: `მიძღვნილია ${newDedSponsorKa}-ის მიერ`,
                      };
                      const updated = [created, ...dedicationsList];
                      setDedicationsList(updated);
                      onSelectDedication(created);
                      localStorage.setItem(
                        'talmud_study_dedications_v1',
                        JSON.stringify(updated)
                      );
                      setNewDedHonoreeKa('');
                      setNewDedHonoreeHe('');
                      onCloseDedicationModal();
                    }}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-[#FAF5EB] via-[#E8D8BE] to-[#C49A6C] text-[#21140B] font-black text-xs cursor-pointer shadow-md"
                  >
                    მიძღვნის შენახვა და დაფაზე გამოტანა
                  </Button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ===================================================================== */}
      {/* 3. SYNAGOGUE FINANCE & SEFER TORAH ALIYOT REGISTRY MODAL             */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {false && (
          <motion.div
            key="fund-aliyot-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseFundModal}
            className="fixed inset-0 z-[210] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden box-border"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border-2 shadow-2xl overflow-hidden box-border ${
                isDark
                  ? 'bg-[#1D140D] border-[#C49A6C] text-[#FAF5EB]'
                  : 'bg-[#FAF3E4] border-[#6E472B] text-[#21140B]'
              }`}
            >
              {/* Sticky Top Header with Back & Close Buttons */}
              <div
                className={`shrink-0 px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-2 ${
                  isDark ? 'bg-[#261910] border-[#8B5A2B]/40' : 'bg-[#EFE2C8] border-[#8B5A2B]/35'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={onCloseFundModal}
                    className="px-3 py-1.5 rounded-xl bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] text-xs font-black flex items-center gap-1.5 border border-[#C49A6C]/60 cursor-pointer shrink-0 shadow-xs"
                    title={commT.backBtn}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{commT.backBtn}</span>
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white hidden sm:flex items-center justify-center shrink-0 shadow-xs">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-black truncate">
                      {commT.modalTitle}
                    </h3>
                    <p className="text-[10.5px] opacity-80 truncate">
                      {commT.modalSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseFundModal}
                  className="p-2 rounded-xl bg-[#5C3A21] text-[#FAF5EB] border border-[#C49A6C]/50 cursor-pointer shrink-0 hover:bg-[#6E472B]"
                  title="დახურვა"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs Bar */}
              <div
                className={`shrink-0 px-4 py-2 border-b flex items-center gap-2 ${
                  isDark ? 'bg-[#21150C] border-[#8B5A2B]/30' : 'bg-[#F2E5CC] border-[#8B5A2B]/25'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFundTab('operations')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeFundTab === 'operations'
                      ? 'bg-gradient-to-r from-[#6B4226] via-[#7D4E2D] to-[#6B4226] text-white shadow-md border border-[#C49A6C]'
                      : isDark
                        ? 'bg-[#2D1D13] text-[#E8D8BE] hover:bg-[#3A2619]'
                        : 'bg-[#FFFDF8] text-[#21140B] hover:bg-[#EDE0C8] border border-[#8B5A2B]/30'
                  }`}
                >
                  <span>{commT.tabOperations}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25">
                    {financialOpsList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFundTab('aliyot')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeFundTab === 'aliyot'
                      ? 'bg-gradient-to-r from-[#6B4226] via-[#7D4E2D] to-[#6B4226] text-white shadow-md border border-[#C49A6C]'
                      : isDark
                        ? 'bg-[#2D1D13] text-[#E8D8BE] hover:bg-[#3A2619]'
                        : 'bg-[#FFFDF8] text-[#21140B] hover:bg-[#EDE0C8] border border-[#8B5A2B]/30'
                  }`}
                >
                  <span>{commT.tabAliyot}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25">
                    {aliyotRecordsList.length}
                  </span>
                </button>
              </div>

              {/* Scrollable Middle Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-5">
                {activeFundTab === 'operations' ? (
                  /* ========================================================= */
                  /* TAB 1: FINANCIAL OPERATIONS                               */
                  /* ========================================================= */
                  <div className="space-y-4">
                    {/* Operation Form Box */}
                    <form
                      onSubmit={handleAddFinancialOperation}
                      className={`p-4 rounded-2xl border space-y-3.5 ${
                        isDark ? 'bg-[#25180E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#8B5A2B]/20 pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span>ახალი ფინანსური ოპერაციის შეყვანა</span>
                        </span>

                        {/* Income / Expense Switch Buttons with ULTRA-HIGH CONTRAST */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={() => setOpFlowType('income')}
                            className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                              opFlowType === 'income'
                                ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-400 ring-2 ring-emerald-500/30'
                                : isDark
                                  ? 'bg-[#2D1D13] text-[#E8D8BE] border border-[#5C3A21]'
                                  : 'bg-[#E8D8BE] text-[#21140B] border border-[#8B5A2B]/40 hover:bg-[#DFCBB0]'
                            }`}
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>{commT.income}</span>
                          </button>

                          <button
                            type="button"
                            data-raw-btn="true"
                            onClick={() => setOpFlowType('expense')}
                            className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                              opFlowType === 'expense'
                                ? 'bg-rose-700 text-white shadow-md border-2 border-rose-400 ring-2 ring-rose-500/30'
                                : isDark
                                  ? 'bg-[#2D1D13] text-[#E8D8BE] border border-[#5C3A21]'
                                  : 'bg-[#E8D8BE] text-[#21140B] border border-[#8B5A2B]/40 hover:bg-[#DFCBB0]'
                            }`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>{commT.expense}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* 1. Operation Title — Searchable Dropdown with Custom Entry */}
                        <div className="w-full min-w-0">
                          <SearchableSelect
                            label={commT.opNameLabel}
                            value={opTitle}
                            onChange={(val) => setOpTitle(val)}
                            options={STANDARD_OPERATION_OPTIONS}
                            allowCustomValue={true}
                            customValueLabel="თავისუფლად შეყვანა: "
                            placeholder={commT.opNamePlaceholder}
                            searchPlaceholder="მოძებნეთ ან აკრიფეთ ოპერაცია..."
                            isDark={isDark}
                            variant="modern"
                          />
                        </div>

                        {/* 2. Member / Donor — Searchable with Add to Members DB */}
                        <div className="w-full min-w-0">
                          <SearchableSelect
                            label={commT.donorLabel}
                            value={opMember}
                            onChange={(val) => setOpMember(val)}
                            options={memberOptions}
                            allowCustomValue={true}
                            onAddNewToDb={(newM) => handleAddMemberToDb(newM)}
                            addNewToDbPromptLabel="➕ წევრთა ბაზაში დამატება:"
                            placeholder={commT.donorPlaceholder}
                            searchPlaceholder="მოძებნეთ წევრი ან აკრიფეთ ახალი..."
                            isDark={isDark}
                            variant="modern"
                          />
                        </div>

                        {/* 3. Amount & Currency Selector (Side by Side) */}
                        <div className="w-full min-w-0">
                          <label className="block text-xs font-black mb-1">
                            {commT.amountLabel} & {commT.currencyLabel}:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              required
                              value={opAmount}
                              onChange={(e) => setOpAmount(e.target.value)}
                              placeholder="0.00"
                              className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm font-black outline-none ${
                                isDark
                                  ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                                  : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                              }`}
                            />
                            <div className="w-32 shrink-0">
                              <SearchableSelect
                                value={opCurrency}
                                onChange={(val) => setOpCurrency(val as AppCurrency)}
                                options={CURRENCY_OPTIONS.map((c) => ({
                                  value: c.id,
                                  label: `${c.symbol} ${c.id}`,
                                  badgeHe: c.symbol,
                                }))}
                                isDark={isDark}
                                compact
                              />
                            </div>
                          </div>
                        </div>

                        {/* 4. Payment Method — Dropdown with All Methods */}
                        <div className="w-full min-w-0">
                          <SearchableSelect
                            label={commT.paymentLabel}
                            value={opPaymentMethod}
                            onChange={(val) => setOpPaymentMethod(val)}
                            options={PAYMENT_METHOD_OPTIONS}
                            placeholder={commT.paymentPlaceholder}
                            isDark={isDark}
                            variant="modern"
                          />
                        </div>

                        {/* 5. Date */}
                        <div className="w-full min-w-0">
                          <label className="block text-xs font-black mb-1">
                            {commT.dateLabel}:
                          </label>
                          <input
                            type="text"
                            value={opDate}
                            onChange={(e) => setOpDate(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                              isDark
                                ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                                : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                            }`}
                          />
                        </div>

                        {/* 6. Notes */}
                        <div className="w-full min-w-0">
                          <label className="block text-xs font-black mb-1">
                            {commT.notesLabel}:
                          </label>
                          <input
                            type="text"
                            value={opNotes}
                            onChange={(e) => setOpNotes(e.target.value)}
                            placeholder={commT.notesPlaceholder}
                            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                              isDark
                                ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                                : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#6B4226] via-[#7D4E2D] to-[#6B4226] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{commT.submitOperation}</span>
                      </button>
                    </form>

                    {/* Financial Stats Bar & Export */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div
                        className={`p-3 rounded-2xl border ${
                          isDark ? 'bg-[#23170E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="text-[10.5px] opacity-75 font-bold flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                          <span>{commT.income}</span>
                        </div>
                        <div className="text-base font-black text-emerald-500 tabular-nums">
                          +{totalIncome.toLocaleString()} {defaultCurrency}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isDark ? 'bg-[#23170E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="text-[10.5px] opacity-75 font-bold flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-rose-400" />
                          <span>{commT.expense}</span>
                        </div>
                        <div className="text-base font-black text-rose-400 tabular-nums">
                          -{totalExpense.toLocaleString()} {defaultCurrency}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isDark ? 'bg-[#23170E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="text-[10.5px] opacity-75 font-bold flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>{commT.statsBalance}</span>
                        </div>
                        <div
                          className={`text-base font-black tabular-nums ${
                            netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {netBalance.toLocaleString()} {defaultCurrency}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 justify-center">
                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className="w-full py-2 px-2.5 rounded-xl border border-[#C49A6C]/60 bg-[#5C3A21] hover:bg-[#6E472B] text-white text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>{commT.exportCsv}</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: 'all', label: commT.filterAll },
                            { id: 'income', label: commT.income },
                            { id: 'expense', label: commT.expense },
                          ] as const
                        ).map((f) => {
                          const active = opFilterType === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setOpFilterType(f.id)}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                                active
                                  ? 'bg-[#6B4226] text-white border-[#C49A6C] shadow-xs'
                                  : isDark
                                    ? 'bg-[#281B12] text-[#E8D8BE] border-[#5C3A21]'
                                    : 'bg-[#FFFDF8] text-[#21140B] border-[#C9B38C]'
                              }`}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>

                      <div
                        className={`flex-1 min-w-[200px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                          isDark
                            ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <input
                          type="text"
                          value={opSearchQuery}
                          onChange={(e) => setOpSearchQuery(e.target.value)}
                          placeholder="ძიება დასახელებით, წევრით ან მეთოდით..."
                          className="flex-1 min-w-0 bg-transparent text-xs outline-none"
                        />
                        <VoiceSearchMicButton
                          onTranscript={(text) => setOpSearchQuery(text)}
                          isDark={isDark}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Operations List Cards */}
                    <div className="space-y-2">
                      {filteredFinancialOps.length === 0 ? (
                        <div className="p-8 text-center text-xs opacity-75 font-semibold">
                          ჩანაწერები ვერ მოიძებნა
                        </div>
                      ) : (
                        filteredFinancialOps.map((op) => {
                          const isIncome = op.type === 'income';
                          return (
                            <div
                              key={op.id}
                              className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 transition-all ${
                                isDark
                                  ? 'bg-[#24170E] border-[#5C3A21]'
                                  : 'bg-[#FFFDF8] border-[#C9B38C]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isIncome
                                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {isIncome ? (
                                    <ArrowDownLeft className="w-4 h-4" />
                                  ) : (
                                    <ArrowUpRight className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black truncate flex items-center gap-1.5">
                                    <span className="truncate">{op.title}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#6B4226]/40 text-[#E8D8BE] shrink-0">
                                      {op.paymentMethod.split(' ')[0]}
                                    </span>
                                  </div>
                                  <div className="text-[11px] opacity-80 truncate">
                                    {op.member} • {op.date}
                                  </div>
                                  {op.notes && (
                                    <div className="text-[10.5px] opacity-70 italic truncate">
                                      {op.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <div
                                  className={`text-sm font-black tabular-nums ${
                                    isIncome ? 'text-emerald-500' : 'text-rose-400'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {op.amount.toLocaleString()} {op.currency}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteFinancialOperation(op.id)}
                                  className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                  title="წაშლა"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* ========================================================= */
                  /* TAB 2: SEFER TORAH ALIYOT & PASSUK REGISTRY               */
                  /* ========================================================= */
                  <div className="space-y-4">
                    {/* Aliyah Form Box */}
                    <form
                      onSubmit={handleAddAliyahRecord}
                      className={`p-4 rounded-2xl border space-y-3.5 ${
                        isDark ? 'bg-[#25180E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#8B5A2B]/20 pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-amber-500" />
                          <span>სეფერ თორას ალიის / მიცვის აღრიცხვა</span>
                        </span>

                        {/* Status Toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAliyahStatus('paid')}
                            className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                              aliyahStatus === 'paid'
                                ? 'bg-emerald-700 text-white shadow-md border-2 border-emerald-400 ring-2 ring-emerald-500/30'
                                : isDark
                                  ? 'bg-[#2D1D13] text-[#E8D8BE] border border-[#5C3A21]'
                                  : 'bg-[#E8D8BE] text-[#21140B] border border-[#8B5A2B]/40 hover:bg-[#DFCBB0]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{commT.statusPaid}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAliyahStatus('due')}
                            className={`py-1.5 px-3 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                              aliyahStatus === 'due'
                                ? 'bg-amber-600 text-[#21140B] shadow-md border-2 border-amber-300 ring-2 ring-amber-400/30'
                                : isDark
                                  ? 'bg-[#2D1D13] text-[#E8D8BE] border border-[#5C3A21]'
                                  : 'bg-[#E8D8BE] text-[#21140B] border border-[#8B5A2B]/40 hover:bg-[#DFCBB0]'
                            }`}
                          >
                            <span>{commT.statusDue}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* 1. All 54 Parashot — Searchable Dropdown with ALL 54 Parashot */}
                        <div className="w-full min-w-0">
                          <SearchableSelect
                            label={commT.parashaLabel}
                            value={aliyahParashaKey}
                            onChange={(val) => setAliyahParashaKey(val)}
                            options={ALL_54_PARASHOT_OPTIONS}
                            placeholder={commT.parashaPlaceholder}
                            searchPlaceholder="მოძებნეთ ფარაშა..."
                            isDark={isDark}
                            variant="modern"
                          />
                        </div>

                        {/* 2. Aliyah / Mitzvah Type (including სამსახური, დამატებითი/მოსიფ, ფეთიხათ ჰაარონი) */}
                        <div className="w-full min-w-0">
                          <SearchableSelect
                            label={commT.aliyahTypeLabel}
                            value={aliyahType}
                            onChange={(val) => setAliyahType(val)}
                            options={ALIYAH_MITZVAH_OPTIONS}
                            placeholder="აირჩიეთ ალია ან მიცვა..."
                            isDark={isDark}
                            variant="modern"
                          />
                        </div>

                        {/* 3. Buyer / Member — Tied to Members DB with Add Prompt */}
                        <div className="w-full min-w-0">
                          <SearchableSelect
                            label={commT.buyerLabel}
                            value={aliyahBuyer}
                            onChange={(val) => setAliyahBuyer(val)}
                            options={memberOptions}
                            allowCustomValue={true}
                            onAddNewToDb={(newM) => handleAddMemberToDb(newM)}
                            addNewToDbPromptLabel="➕ წევრთა ბაზაში დამატება:"
                            placeholder={commT.buyerPlaceholder}
                            searchPlaceholder="მოძებნეთ მყიდველი ან დაამატეთ ახალი..."
                            isDark={isDark}
                            variant="modern"
                          />
                        </div>

                        {/* 4. Amount & Currency Selector */}
                        <div className="w-full min-w-0">
                          <label className="block text-xs font-black mb-1">
                            {commT.amountLabel} & {commT.currencyLabel}:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="any"
                              value={aliyahAmount}
                              onChange={(e) => setAliyahAmount(e.target.value)}
                              placeholder="0.00"
                              className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm font-black outline-none ${
                                isDark
                                  ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                                  : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                              }`}
                            />
                            <div className="w-32 shrink-0">
                              <SearchableSelect
                                value={aliyahCurrency}
                                onChange={(val) => setAliyahCurrency(val as AppCurrency)}
                                options={CURRENCY_OPTIONS.map((c) => ({
                                  value: c.id,
                                  label: `${c.symbol} ${c.id}`,
                                  badgeHe: c.symbol,
                                }))}
                                isDark={isDark}
                                compact
                              />
                            </div>
                          </div>
                        </div>

                        {/* 5. Notes / Dedication */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-black mb-1">
                            {commT.notesLabel}:
                          </label>
                          <input
                            type="text"
                            value={aliyahNotes}
                            onChange={(e) => setAliyahNotes(e.target.value)}
                            placeholder="დამატებითი მიძღვნა ან დეტალები..."
                            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                              isDark
                                ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                                : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#6B4226] via-[#7D4E2D] to-[#6B4226] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{commT.submitAliyah}</span>
                      </button>
                    </form>

                    {/* Aliyot Stats & Export */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div
                        className={`p-3 rounded-2xl border ${
                          isDark ? 'bg-[#23170E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="text-[10.5px] opacity-75 font-bold">
                          {commT.statsTotal}
                        </div>
                        <div className="text-base font-black text-amber-400 tabular-nums">
                          {totalAliyotPledged.toLocaleString()} {defaultCurrency}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isDark ? 'bg-[#23170E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="text-[10.5px] opacity-75 font-bold">
                          {commT.statsPaid}
                        </div>
                        <div className="text-base font-black text-emerald-400 tabular-nums">
                          {totalAliyotPaid.toLocaleString()} {defaultCurrency}
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isDark ? 'bg-[#23170E] border-[#5C3A21]' : 'bg-[#FFFDF8] border-[#C9B38C]'
                        }`}
                      >
                        <div className="text-[10.5px] opacity-75 font-bold">
                          {commT.statsDue}
                        </div>
                        <div className="text-base font-black text-rose-400 tabular-nums">
                          {totalAliyotDue.toLocaleString()} {defaultCurrency}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 justify-center">
                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className="w-full py-2 px-2.5 rounded-xl border border-[#C49A6C]/60 bg-[#5C3A21] hover:bg-[#6E472B] text-white text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>{commT.exportCsv}</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: 'all', label: commT.filterAll },
                            { id: 'paid', label: commT.filterPaid },
                            { id: 'due', label: commT.filterDue },
                          ] as const
                        ).map((f) => {
                          const active = aliyahFilterStatus === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setAliyahFilterStatus(f.id)}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                                active
                                  ? 'bg-[#6B4226] text-white border-[#C49A6C] shadow-xs'
                                  : isDark
                                    ? 'bg-[#281B12] text-[#E8D8BE] border-[#5C3A21]'
                                    : 'bg-[#FFFDF8] text-[#21140B] border-[#C9B38C]'
                              }`}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>

                      <div
                        className={`flex-1 min-w-[200px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                          isDark
                            ? 'bg-[#2A1C12] border-[#5C3A21] text-[#FAF5EB]'
                            : 'bg-white border-[#8B5A2B]/50 text-[#21140B]'
                        }`}
                      >
                        <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
                        <input
                          type="text"
                          value={aliyahSearchQuery}
                          onChange={(e) => setAliyahSearchQuery(e.target.value)}
                          placeholder="ძიება ფარაშით, ალიით ან წევრით..."
                          className="flex-1 min-w-0 bg-transparent text-xs outline-none"
                        />
                        <VoiceSearchMicButton
                          onTranscript={(text) => setAliyahSearchQuery(text)}
                          isDark={isDark}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Aliyot Records List */}
                    <div className="space-y-2">
                      {filteredAliyotRecords.length === 0 ? (
                        <div className="p-8 text-center text-xs opacity-75 font-semibold">
                          ჩანაწერები ვერ მოიძებნა
                        </div>
                      ) : (
                        filteredAliyotRecords.map((al) => {
                          const isPaid = al.status === 'paid';
                          return (
                            <div
                              key={al.id}
                              className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 transition-all ${
                                isDark
                                  ? 'bg-[#24170E] border-[#5C3A21]'
                                  : 'bg-[#FFFDF8] border-[#C9B38C]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isPaid
                                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                                  }`}
                                >
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black truncate flex items-center gap-1.5">
                                    <span className="truncate">{al.aliyahType}</span>
                                    <span
                                      dir="rtl"
                                      className="font-serif font-black text-[11px] px-1.5 py-0.2 rounded bg-[#6B4226]/40 text-[#E8D8BE] shrink-0"
                                    >
                                      {al.parashaNameKa} ({al.parashaNameHe})
                                    </span>
                                  </div>
                                  <div className="text-[11px] opacity-80 truncate">
                                    {al.buyerMemberName} • {al.createdAt}
                                  </div>
                                  {al.notes && (
                                    <div className="text-[10.5px] opacity-70 italic truncate">
                                      {al.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-sm font-black text-amber-400 tabular-nums">
                                  {al.amount.toLocaleString()} {al.currency}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleAliyahStatus(al.id)}
                                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black cursor-pointer border transition-all ${
                                    isPaid
                                      ? 'bg-emerald-800/40 text-emerald-300 border-emerald-500/40'
                                      : 'bg-amber-800/40 text-amber-300 border-amber-500/40'
                                  }`}
                                >
                                  {isPaid ? commT.statusPaid : commT.statusDue}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAliyahRecord(al.id)}
                                  className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-950/40 cursor-pointer"
                                  title="წაშლა"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Bottom Footer with Return Button */}
              <div
                className={`shrink-0 px-4 sm:px-5 py-2.5 border-t flex items-center justify-between gap-2 ${
                  isDark ? 'bg-[#261910] border-[#8B5A2B]/40' : 'bg-[#EFE2C8] border-[#8B5A2B]/35'
                }`}
              >
                <span className="text-[11px] opacity-80 truncate">
                  {commT.autoSaved}
                </span>
                <button
                  type="button"
                  onClick={onCloseFundModal}
                  className="px-4 py-1.5 rounded-xl bg-[#5C3A21] hover:bg-[#6E472B] text-[#FAF5EB] text-xs font-black flex items-center gap-1.5 border border-[#C49A6C]/60 cursor-pointer shrink-0 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{commT.backBtn}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
