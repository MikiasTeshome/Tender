'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Brand from './brand.jsx'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Fuel,
  Gauge,
  Gavel,
  Globe,
  Grid2X2,
  HelpCircle,
  Info,
  Key,
  Layers,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  PhoneCall,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  Unlock,
  User,
  UserCheck,
  X,
  Zap,
} from 'lucide-react'

// TYPES
type VehicleLot = {
  id: string
  title: string
  condition: 'Used' | 'Damaged'
  conditionLabel: string
  regionLabel?: string
  region: string
  yardLocation: string
  issuer: string
  issuerCategory: string
  closeIso: string
  closeLabel: string
  cpoBond: string
  estimatedReserve: string
  year: number
  mileage: string
  keys: string
  starter: string
  fuelType: string
  transmission: string
  plateStatus: string
  summary: string
  inspectionReport: {
    engine: string
    gearbox: string
    bodyFrame: string
    interior: string
    tyres: string
  }
  contactPerson: string
  visitingHours: string
  mainImage: string
  gallery: { src: string; caption: string }[]
  noticeRef: string
}

type ProcurementTender = {
  id: string
  title: string
  category: 'Public' | 'NGO' | 'Private'
  categoryLabel: string
  sector: string
  issuer: string
  refNumber: string
  closeIso: string
  closeLabel: string
  cpoAmount: string
  documentFee: string
  region: string
  gazette: string
  summary: string
  scopeOfWork: string[]
  eligibilityRequirements: string[]
  contactPerson: string
  submissionAddress: string
  fullNoticeText: string[]
}

type UserProfile = {
  name: string
  email: string
  organization: string
  tin: string
  phone: string
  isSubscriber: boolean
}

type AlertNotification = {
  id: string
  title: string
  message: string
  category: 'Public' | 'NGO' | 'Private' | 'Vehicles'
  timestamp: string
  read: boolean
  targetId?: string
  targetType?: 'tender' | 'vehicle'
}

// 1. VEHICLE LOTS FIXTURES (with Keys, Starter, Mileage)
const VEHICLE_LOTS: VehicleLot[] = [
  {
    "id": "ሙከራ-ተ-፩",
    "title": "የአገልግሎት ላይ የዋለ ቶዮታ ኮሮላ ሽያጭ",
    "condition": "Used",
    "conditionLabel": "ያገለገለ",
    "region": "Addis Ababa",
    "regionLabel": "አዲስ አበባ",
    "yardLocation": "አቃቂ፣ አዲስ አበባ",
    "issuer": "የተሽከርካሪ አስተዳደር ክፍል (ምናባዊ ተቋም)",
    "issuerCategory": "የተቋም ተሽከርካሪ ሽያጭ",
    "closeIso": "2026-12-29T10:00:00+03:00",
    "closeLabel": "ዲሴምበር 29፣ 2026 · 10:00 የምሥራቅ አፍሪካ ሰዓት",
    "cpoBond": "50,000 ብር",
    "estimatedReserve": "1,450,000 ብር",
    "year": 2017,
    "mileage": "112,450 ኪሎ ሜትር",
    "keys": "ሁለት ቁልፎች አሉ",
    "starter": "ሞተሩ በቀላሉ ይነሳል",
    "fuelType": "ቤንዚን",
    "transmission": "ባለ አምስት ፍጥነት ማርሽ",
    "plateStatus": "የተቋም ታርጋ ያለው",
    "summary": "ይህ የሙከራ ጨረታ ነው። ተሽከርካሪው ከዚህ በፊት ለቢሮ አገልግሎት ውሏል። ተጫራቾች ዋጋ ከማቅረባቸው በፊት መኪናውን በቦታው ማየት ይችላሉ።",
    "inspectionReport": {
      "engine": "ሞተሩ ተፈትሾ በአግባቡ ይሠራል።",
      "gearbox": "ማርሹ በቀላሉ ይቀየራል።",
      "bodyFrame": "በፊት መከላከያው ላይ ትንሽ ጭረት አለ።",
      "interior": "መቀመጫዎቹ ጥቂት የአጠቃቀም ምልክቶች አሏቸው።",
      "tyres": "ተጨማሪ ጎማ አለ።"
    },
    "contactPerson": "የተሽከርካሪ ሽያጭ ኮሚቴ",
    "visitingHours": "ከሰኞ እስከ ዓርብ፣ 09:00–12:00 የምሥራቅ አፍሪካ ሰዓት",
    "mainImage": "/sedan-demo.webp",
    "gallery": [
      {
        "src": "/sedan-demo.webp",
        "caption": "የተሽከርካሪው ውጫዊ ገጽታ"
      },
      {
        "src": "/interior-demo.webp",
        "caption": "የተሽከርካሪው ውስጣዊ ክፍል"
      },
      {
        "src": "/engine-demo.webp",
        "caption": "የሞተር ክፍል"
      }
    ],
    "noticeRef": "ሙከራ/ተ/፩"
  },
  {
    id: 'EVP-2407-018',
    title: '2017 Fleet Sedan · Toyota Corolla 1.6L',
    condition: 'Used',
    conditionLabel: 'Used Fleet',
    region: 'Addis Ababa',
    yardLocation: 'Akaki Federal Equipment Yard, Addis Ababa',
    issuer: 'Ethiopian Roads Administration Fleet Disposal Unit (Sample Fictional Entity)',
    issuerCategory: 'Federal Agency Fleet Disposal',
    closeIso: '2026-12-18T14:00:00+03:00',
    closeLabel: '18 Dec 2026 · 14:00 EAT',
    cpoBond: '50,000 ETB',
    estimatedReserve: '1,450,000 ETB',
    year: 2017,
    mileage: '112,450 km (Service Log Checked)',
    keys: '2 Original Transponder Keys Present',
    starter: 'Starts & Idles Smoothly (Starter Motor Checked)',
    fuelType: 'Petrol (Gasoline)',
    transmission: '5-Speed Manual',
    plateStatus: 'Government (ERA Code 2) · Duty Paid',
    summary:
      'Regular institutional fleet service vehicle released under scheduled 2026 government fleet renewal. Engine starts promptly; full service log maintained by ERA Central Workshop.',
    inspectionReport: {
      engine: 'Starts immediately, no visible oil smoke, recent oil filter service recorded at 110,000 km.',
      gearbox: 'Manual clutch engagement responsive, standard synchromesh wear.',
      bodyFrame: 'Original chassis straight; superficial cosmetic stone chips on front bumper and lower sill.',
      interior: 'Original cloth seats clean with minor wear on driver bolster; air conditioning blows cold.',
      tyres: 'Dunlop 195/65 R15 with ~60% remaining tread; spare wheel and jack verified present.',
    },
    contactPerson: 'Ato Getachew Bekele · Fleet Disposal Committee',
    visitingHours: 'Monday–Friday: 08:30–12:30 EAT & 13:30–16:30 EAT (Gate pass required)',
    mainImage: '/sedan-demo.webp',
    gallery: [
      { src: '/sedan-demo.webp', caption: 'Front 3/4 Exterior Angle at Akaki Lot' },
      { src: '/interior-demo.webp', caption: 'Driver Cabin & Center Console' },
      { src: '/engine-demo.webp', caption: '1.6L VVT-i Engine Bay' },
      { src: '/pickup-demo.webp', caption: 'Rear Profile & Vehicle Yard View' },
    ],
    noticeRef: 'ERA/VT/2026/08',
  },
  {
    id: 'EVP-2407-031',
    title: '2019 Double Cab 4WD Pickup · Isuzu D-Max',
    condition: 'Damaged',
    conditionLabel: 'Damaged · Collision Salvage',
    region: 'Oromia',
    yardLocation: 'Gelan Regional Transport Depot, Oromia State',
    issuer: 'Oromia Water Works Construction Enterprise (Sample Fictional Entity)',
    issuerCategory: 'Regional Enterprise Asset Disposal',
    closeIso: '2026-12-12T10:30:00+03:00',
    closeLabel: '12 Dec 2026 · 10:30 EAT',
    cpoBond: '75,000 ETB',
    estimatedReserve: '980,000 ETB',
    year: 2019,
    mileage: '88,200 km (Odometer Checked)',
    keys: '1 Working Key (Spare Lost)',
    starter: 'Cranks · Does Not Idle (Cooling Pack Damaged)',
    fuelType: 'Turbo Diesel 3.0L',
    transmission: '5-Speed Manual 4WD',
    plateStatus: 'Oromia Regional Code 4 · Commercial Transferable',
    summary:
      'Collision-damaged field supervision vehicle offered strictly as-is where-is. Front right quarter panel, bumper, and cooling pack have structural impact; towing/flatbed required for recovery.',
    inspectionReport: {
      engine: '3.0L Ddi Turbo Diesel cranks; radiator and intercooler punctured from impact, engine not run to avoid overheating.',
      gearbox: 'Gearbox and 4WD transfer case intact; front right half-shaft requires replacement.',
      bodyFrame: 'Front right chassis horn deflected approx. 18mm; cab passenger compartment intact.',
      interior: 'Driver steering wheel airbag deployed; seats and dashboard electronics otherwise intact.',
      tyres: 'Front right tyre ruptured; remaining three all-terrain tyres in serviceable condition.',
    },
    contactPerson: 'W/ro Selamawit Tadesse · Fleet Disposal Committee',
    visitingHours: 'Monday–Thursday: 09:00–12:00 EAT & 14:00–16:00 EAT',
    mainImage: '/pickup-demo.webp',
    gallery: [
      { src: '/pickup-demo.webp', caption: 'Front Right Collision Damage Profile' },
      { src: '/engine-demo.webp', caption: 'Turbo Diesel Engine Bay & Cooling Damage' },
      { src: '/interior-demo.webp', caption: 'Cabin Overview & Deployed Steering Airbag' },
      { src: '/sedan-demo.webp', caption: 'Depot Yard Overview' },
    ],
    noticeRef: 'OWCE/DISP/2026/03',
  },
  {
    id: 'EVP-2407-044',
    title: '2018 Heavy-Duty 4x4 SUV · Nissan Patrol Y61',
    condition: 'Used',
    conditionLabel: 'Used Fleet',
    region: 'Tigray',
    yardLocation: 'Mekelle Municipal Yard, Tigray Region',
    issuer: 'Mekelle Municipal Fleet & Transport Directorate (Sample Fictional Entity)',
    issuerCategory: 'Municipal Administration Fleet',
    closeIso: '2026-12-24T16:00:00+03:00',
    closeLabel: '24 Dec 2026 · 16:00 EAT',
    cpoBond: '100,000 ETB',
    estimatedReserve: '2,200,000 ETB',
    year: 2018,
    mileage: '142,600 km (Field Fleet Inspection)',
    keys: '2 Original Keys + Remote Fobs',
    starter: 'Starts Instantly · Smooth Idle',
    fuelType: '4.2L Diesel Inline-6',
    transmission: '5-Speed Manual with High/Low 4WD',
    plateStatus: 'Tigray Regional Code 1 · Duty Paid',
    summary:
      'Robust all-terrain supervision vehicle maintained in northern regional service. Heavy-duty suspension, dual fuel tanks, and mechanical winch equipped. Sold due to standardized fleet transition.',
    inspectionReport: {
      engine: '4.2L naturally aspirated diesel runs smoothly with steady oil pressure.',
      gearbox: 'Solid manual transmission; 4H and 4L mechanical lever shifts engage firmly.',
      bodyFrame: 'Heavy ladder-frame chassis rust-free; bull bar and rear bumper intact.',
      interior: 'Heavy vinyl commercial upholstery intact; minor dashboard sun fading.',
      tyres: 'All 4 Bridgestone Desert Dueller tyres replaced in 2025 (~80% tread).',
    },
    contactPerson: 'Ato Haile Mehari · Municipal Asset Officer',
    visitingHours: 'Tuesday–Friday: 09:00–12:30 EAT & 14:00–16:00 EAT',
    mainImage: '/sedan-demo.webp',
    gallery: [
      { src: '/sedan-demo.webp', caption: 'Fleet SUV Staging at Regional Compound' },
      { src: '/engine-demo.webp', caption: 'Inline-6 Diesel Mechanical Inspection' },
      { src: '/interior-demo.webp', caption: 'Driver Cabin & 4x4 Selector Levers' },
      { src: '/pickup-demo.webp', caption: 'Rear Cargo & Spare Carrier' },
    ],
    noticeRef: 'MMF/ASSET/2026/11',
  },
]

// 2. PROCUREMENT TENDERS FIXTURES (Public, NGO, Private - Matching Stitch Examples)
const PROCUREMENT_TENDERS: ProcurementTender[] = [
  {
    "id": "ሙከራ-መ-፩",
    "title": "የትምህርት ቤት ዴስኮች ግዥ",
    "category": "Public",
    "categoryLabel": "የመንግሥት ግዥ",
    "sector": "የትምህርት ቁሳቁስ",
    "issuer": "የከተማ ትምህርት ጽሕፈት ቤት (ምናባዊ ተቋም)",
    "refNumber": "ሙከራ/መ/፩",
    "closeIso": "2026-12-30T14:00:00+03:00",
    "closeLabel": "ዲሴምበር 30፣ 2026 · 14:00 የምሥራቅ አፍሪካ ሰዓት",
    "cpoAmount": "15,000 ብር",
    "documentFee": "ክፍያ የለውም",
    "region": "አዲስ አበባ",
    "gazette": "የሙከራ ጨረታ ማስታወቂያ",
    "summary": "ይህ የሙከራ ጨረታ ነው። የከተማ ትምህርት ጽሕፈት ቤት ብቁ ተጫራቾችን ይጋብዛል። ባለ ሁለት መቀመጫ ዴስኮችን ማምረትና ማቅረብ።",
    "scopeOfWork": [
      "ባለ ሁለት መቀመጫ ዴስኮችን ማምረትና ማቅረብ።",
      "ዴስኮቹን በ30 ቀናት ውስጥ ማስረከብ።"
    ],
    "eligibilityRequirements": [
      "የታደሰ የንግድ ፈቃድ ማቅረብ።",
      "የግብር ከፋይ መለያ ቁጥር ማቅረብ።"
    ],
    "contactPerson": "የግዥ ክፍል",
    "submissionAddress": "የግዥ ጽሕፈት ቤት፣ አዲስ አበባ",
    "fullNoticeText": [
      "ይህ ለማሳያ ብቻ የተዘጋጀ ምናባዊ ጨረታ ነው። ባለ ሁለት መቀመጫ ዴስኮችን ማምረትና ማቅረብ።",
      "የጨረታ ሰነዱ ከግዥ ክፍሉ በነፃ ይገኛል።",
      "የጨረታ ሰነዶች እስከ ዲሴምበር 30፣ 2026 በ14:00 የምሥራቅ አፍሪካ ሰዓት በታሸገ ፖስታ መቅረብ አለባቸው።"
    ]
  },
  {
    "id": "ሙከራ-ድ-፩",
    "title": "የንጽሕና ቁሳቁስ ግዥ",
    "category": "NGO",
    "categoryLabel": "መንግሥታዊ ያልሆነ ድርጅት",
    "sector": "የንጽሕና ቁሳቁስ",
    "issuer": "የማኅበረሰብ ድጋፍ ማኅበር (ምናባዊ ተቋም)",
    "refNumber": "ሙከራ/ድ/፩",
    "closeIso": "2026-12-30T14:00:00+03:00",
    "closeLabel": "ዲሴምበር 30፣ 2026 · 14:00 የምሥራቅ አፍሪካ ሰዓት",
    "cpoAmount": "10,000 ብር",
    "documentFee": "ክፍያ የለውም",
    "region": "አዲስ አበባ",
    "gazette": "የሙከራ ጨረታ ማስታወቂያ",
    "summary": "ይህ የሙከራ ጨረታ ነው። የማኅበረሰብ ድጋፍ ማኅበር ብቁ ተጫራቾችን ይጋብዛል። ሳሙና፣ የውሃ መያዣና ሌሎች የንጽሕና ቁሳቁሶችን ማቅረብ።",
    "scopeOfWork": [
      "ሳሙና፣ የውሃ መያዣና ሌሎች የንጽሕና ቁሳቁሶችን ማቅረብ።",
      "ከአቅርቦት በፊት አንድ የተሟላ ናሙና ማሳየት።"
    ],
    "eligibilityRequirements": [
      "የታደሰ የንግድ ፈቃድ ማቅረብ።",
      "የግብር ከፋይ መለያ ቁጥር ማቅረብ።"
    ],
    "contactPerson": "የግዥ ክፍል",
    "submissionAddress": "የግዥ ጽሕፈት ቤት፣ አዲስ አበባ",
    "fullNoticeText": [
      "ይህ ለማሳያ ብቻ የተዘጋጀ ምናባዊ ጨረታ ነው። ሳሙና፣ የውሃ መያዣና ሌሎች የንጽሕና ቁሳቁሶችን ማቅረብ።",
      "የጨረታ ሰነዱ ከግዥ ክፍሉ በነፃ ይገኛል።",
      "የጨረታ ሰነዶች እስከ ዲሴምበር 30፣ 2026 በ14:00 የምሥራቅ አፍሪካ ሰዓት በታሸገ ፖስታ መቅረብ አለባቸው።"
    ]
  },
  {
    "id": "ሙከራ-ግ-፩",
    "title": "የቢሮ ጽዳት አገልግሎት",
    "category": "Private",
    "categoryLabel": "የግል ድርጅት",
    "sector": "የጽዳት አገልግሎት",
    "issuer": "የከተማ የንግድ ማዕከል (ምናባዊ ተቋም)",
    "refNumber": "ሙከራ/ግ/፩",
    "closeIso": "2026-12-30T14:00:00+03:00",
    "closeLabel": "ዲሴምበር 30፣ 2026 · 14:00 የምሥራቅ አፍሪካ ሰዓት",
    "cpoAmount": "8,000 ብር",
    "documentFee": "ክፍያ የለውም",
    "region": "አዲስ አበባ",
    "gazette": "የሙከራ ጨረታ ማስታወቂያ",
    "summary": "ይህ የሙከራ ጨረታ ነው። የከተማ የንግድ ማዕከል ብቁ ተጫራቾችን ይጋብዛል። የቢሮ ክፍሎችንና የጋራ መጠቀሚያ ቦታዎችን በየቀኑ ማጽዳት።",
    "scopeOfWork": [
      "የቢሮ ክፍሎችንና የጋራ መጠቀሚያ ቦታዎችን በየቀኑ ማጽዳት።",
      "የጽዳት መሣሪያዎችንና ቁሳቁሶችን ማቅረብ።"
    ],
    "eligibilityRequirements": [
      "የታደሰ የንግድ ፈቃድ ማቅረብ።",
      "የግብር ከፋይ መለያ ቁጥር ማቅረብ።"
    ],
    "contactPerson": "የግዥ ክፍል",
    "submissionAddress": "የግዥ ጽሕፈት ቤት፣ አዲስ አበባ",
    "fullNoticeText": [
      "ይህ ለማሳያ ብቻ የተዘጋጀ ምናባዊ ጨረታ ነው። የቢሮ ክፍሎችንና የጋራ መጠቀሚያ ቦታዎችን በየቀኑ ማጽዳት።",
      "የጨረታ ሰነዱ ከግዥ ክፍሉ በነፃ ይገኛል።",
      "የጨረታ ሰነዶች እስከ ዲሴምበር 30፣ 2026 በ14:00 የምሥራቅ አፍሪካ ሰዓት በታሸገ ፖስታ መቅረብ አለባቸው።"
    ]
  },
  // Stitch Example 1: School Desks (Public Tender)
  {
    id: 'PUB-2026-DESK-01',
    title: 'Procurement and Delivery of 2,400 Standardized Combined Primary School Desks',
    category: 'Public',
    categoryLabel: 'Public · Regional Education Bureau',
    sector: 'Educational Furniture & Woodwork',
    issuer: 'Oromia Regional Education Bureau (Sample Fictional Entity)',
    refNumber: 'OREB/NCB/DESK/2026/04',
    closeIso: '2026-12-22T14:00:00+03:00',
    closeLabel: '22 Dec 2026 · 14:00 EAT',
    cpoAmount: '45,000 ETB',
    documentFee: '400 ETB (Non-refundable)',
    region: 'Oromia (West Shewa & Jimma School Zones)',
    gazette: 'Sample Official Gazette Ref: FDRE-TEND-2026/04',
    summary:
      'Fictional sample tender for manufacturing, metal frame powder-coating, and delivery of 2,400 dual-seater combined student desks and bench units to primary school clusters.',
    scopeOfWork: [
      'Fabrication and supply of 2,400 standardized two-seater desks with attached benches according to national MoE technical specifications.',
      'Heavy gauge hollow steel tubular frames (25mm x 25mm x 1.5mm) with electrostatically applied anti-rust powder coating.',
      'Kiln-dried seasoned eucalyptus/cypress hardwood tops and seats treated with non-toxic polyurethane varnish.',
      'Direct delivery and offloading at designated school cluster distribution depots across Jimma, Ambo, and Adama.',
    ],
    eligibilityRequirements: [
      'Renewed Grade 4 or above Woodwork, Furniture Manufacturing, or General Metal Works trade license.',
      'Current Tax Clearance Certificate, VAT Registration, and Taxpayer Identification Number (TIN).',
      'Certified Payment Order (CPO) of 45,000 ETB issued by any recognized commercial bank in Ethiopia.',
      'Demonstrated capacity to deliver full order quantity within 60 calendar days of contract signing.',
    ],
    contactPerson: 'Procurement & Property Administration Directorate · Regional Bureau Compound',
    submissionAddress: 'Oromia Regional Education Bureau, Sarbet Area, Tender Box #02, Addis Ababa',
    fullNoticeText: [
      '1. Oromia Regional Education Bureau invites eligible local manufacturers and suppliers to bid for the supply and delivery of 2,400 school desks.',
      '2. Bidding will be conducted through National Competitive Bidding (NCB) procedures specified in the regional public procurement directive.',
      '3. Interested bidders may purchase bidding documents upon payment of a non-refundable 400 ETB fee.',
      '4. Bids accompanied by a CPO of 45,000 ETB must be deposited in Tender Box #02 on or before 22 Dec 2026 at 14:00 EAT.',
      '5. Technical bids will be opened immediately thereafter at 14:15 EAT in the presence of bidders or authorized delegates.',
    ],
  },
  // Public Tender 2: Bridge Structural Audit
  {
    id: 'PUB-2026-091',
    title: 'Consultancy Services for Hawassa-Dilla Expressway Bridge Structural Integrity Audit',
    category: 'Public',
    categoryLabel: 'Public · Federal Agency',
    sector: 'Civil Engineering & Infrastructure',
    issuer: 'Ethiopian Roads Administration (Sample Fictional Entity)',
    refNumber: 'ERA/ICB/BRIDGE/2026/09',
    closeIso: '2026-12-22T14:00:00+03:00',
    closeLabel: '22 Dec 2026 · 14:00 EAT',
    cpoAmount: '120,000 ETB',
    documentFee: '500 ETB (Non-refundable)',
    region: 'Sidama & SNNPR',
    gazette: 'Sample Official Gazette Ref: FDRE-INFRA-2026/09',
    summary:
      'Fictional sample tender for specialized bridge engineering firms to perform non-destructive ultrasonic testing, vibration analysis, and load rating on 14 major river crossings.',
    scopeOfWork: [
      'Comprehensive visual and non-destructive testing (NDT) on 14 reinforced concrete bridge superstructures.',
      'Core sampling, carbonation depth measurement, and ultrasonic pulse velocity testing.',
      'Finite element load capacity modeling and remaining structural lifespan estimation.',
      'Preparation of tender-ready structural rehabilitation designs and cost estimates.',
    ],
    eligibilityRequirements: [
      'Category 1 Highway & Bridge Engineering Consultancy License from Ministry of Urban Development.',
      'Renewed Trade License, TIN, and VAT Registration Certificates.',
      'Certified Payment Order (CPO) of 120,000 ETB from a licensed commercial bank.',
      'Demonstrated completion of at least two comparable bridge evaluation assignments in East Africa.',
    ],
    contactPerson: 'Engineering Procurement Directorate · ERA Headquarters 2nd Floor',
    submissionAddress: 'ERA Head Office, Ras Abebe Aregay Street, Tender Box #01, Addis Ababa',
    fullNoticeText: [
      '1. The Ethiopian Roads Administration invites eligible consulting engineering firms to submit expressions of interest and sealed financial offers for structural evaluation of the Hawassa-Dilla highway bridges.',
      '2. Bidding will be conducted through National Competitive Bidding procedures specified in the Federal Public Procurement Directive.',
      '3. A complete set of bidding documents in English may be purchased by interested bidders upon payment of a non-refundable fee of 500 ETB.',
      '4. Bids must be delivered to Tender Box #01 on or before 22 Dec 2026 at 14:00 EAT. Electronic bidding is not permitted.',
      '5. Technical proposals will be opened publicly at 14:30 EAT in the main conference room in the presence of bidders or designated legal representatives.',
    ],
  },
  // Public Tender 3: Data Center Energy Storage
  {
    id: 'PUB-2026-104',
    title: 'Supply, Delivery, and Commissioning of Tier-III Data Center Backup Lithium Energy Storage Units',
    category: 'Public',
    categoryLabel: 'Public · State Enterprise',
    sector: 'Information & Telecommunications',
    issuer: 'Ethio Telecom Enterprise (Sample Fictional Entity)',
    refNumber: 'ET/NCB/DC-POWER/2026/41',
    closeIso: '2026-12-28T10:00:00+03:00',
    closeLabel: '28 Dec 2026 · 10:00 EAT',
    cpoAmount: '250,000 ETB',
    documentFee: '1,000 ETB',
    region: 'Addis Ababa',
    gazette: 'Sample Official Gazette Ref: FDRE-TELE-2026/41',
    summary:
      'Fictional sample tender for procurement of 2.4 MWh high-discharge LiFePO4 battery storage banks and intelligent BMS power integration for core data center.',
    scopeOfWork: [
      'Supply of modular 48V/100Ah rack-mounted lithium iron phosphate battery strings.',
      'Integration with existing 800kVA Huawei modular UPS system and SCADA monitoring.',
      'Factory acceptance testing (FAT) certification and on-site load bank validation.',
      '24-month comprehensive manufacturer warranty and local engineer training.',
    ],
    eligibilityRequirements: [
      'Registered ICT Infrastructure Supplier / Electrical Importer Grade 1.',
      'Manufacturer Authorization Letter (MAL) from OEM tier-1 battery producer.',
      'CPO of 250,000 ETB issued by Commercial Bank of Ethiopia or accredited commercial bank.',
      'ISO 9001 and CE/UL battery safety certification.',
    ],
    contactPerson: 'Supply Chain Division · Ethio Telecom Headquarters, Churchill Road',
    submissionAddress: 'Ethio Telecom Head Office, Room 204, Churchill Road, Addis Ababa',
    fullNoticeText: [
      '1. Ethio Telecom intends to procure Tier-III Data Center Lithium Energy Storage Systems for core infrastructure expansion.',
      '2. Eligible bidders must submit valid trade licenses for electrical/telecom equipment importation and tax clearance certificates.',
      '3. Bids must be accompanied by a bid security of 250,000 ETB in the form of CPO or unconditional bank guarantee.',
      '4. Submissions must be delivered to Room 204 before 28 Dec 2026 at 10:00 EAT. Late arrivals will be returned unopened.',
    ],
  },

  // Stitch Example 2: Hygiene Kits (NGO Tender)
  {
    id: 'NGO-2026-HYG-02',
    title: 'Supply and Packaging of 12,000 Emergency Family Hygiene Kits & Water Containers',
    category: 'NGO',
    categoryLabel: 'NGO · Humanitarian Initiative',
    sector: 'WASH & Emergency Relief Supplies',
    issuer: 'East Africa Humanitarian Initiative (Sample Fictional NGO)',
    refNumber: 'EAHI/RFP/WASH/2026/19',
    closeIso: '2026-12-19T12:00:00+03:00',
    closeLabel: '19 Dec 2026 · 12:00 EAT',
    cpoAmount: '60,000 ETB',
    documentFee: 'Free of Charge (Digital Download)',
    region: 'Somali & Afar Regional Logistics Corridors',
    gazette: 'Sample Humanitarian Logistics Bulletin Ref: NGO-WASH-2026/19',
    summary:
      'Fictional sample tender for procurement, quality verification, and kit assembly of emergency family hygiene supplies and collapsible food-grade water containers.',
    scopeOfWork: [
      'Supply and batch packaging of 12,000 standardized household hygiene kits in heavy-duty moisture-resistant corrugated boxes.',
      'Each kit includes: 12 bars antibacterial hand soap (100g), 4 tubes fluoride toothpaste, 1kg laundry detergent powder, and 1 pack sanitary pads.',
      'Supply of 12,000 food-grade collapsible 20L HDPE jerrycans with UV stabilization and reinforced screw caps.',
      'Inclusion of 50 water purification chlorine tablets (Aquatabs 67mg) per kit with multilingual pictorial usage instructions.',
    ],
    eligibilityRequirements: [
      'Legally registered commercial supplier or importer of soap, hygiene commodities, or relief goods.',
      'Valid business license, renewed tax clearance certificate, and Ethiopian FDA hygiene compliance certification.',
      'Bid security of 60,000 ETB in the form of CPO or unconditional bank guarantee with 90-day validity.',
      'Past performance certificates demonstrating successful assembly and logistics delivery of relief kits.',
    ],
    contactPerson: 'Emergency WASH Procurement Officer · Country Logistics Base',
    submissionAddress: 'East Africa Humanitarian Initiative, Bole Medhanialem Area, Tender Box #A, Addis Ababa',
    fullNoticeText: [
      '1. East Africa Humanitarian Initiative invites qualified relief commodity suppliers to submit bids for 12,000 emergency family hygiene kits.',
      '2. Bidding documents and detailed technical composition sheets are available free of charge upon email registration.',
      '3. Physical sample inspection of commodity items is mandatory prior to final commercial bid evaluation.',
      '4. Sealed proposals with 60,000 ETB CPO must reach Tender Box #A before 19 Dec 2026 at 12:00 EAT.',
    ],
  },
  // NGO Tender 2: Solar Borehole Pumping
  {
    id: 'NGO-2026-033',
    title: 'Supply and Installation of Solar-Powered Borehole Water Pumping Systems for Dollo Ado Settlements',
    category: 'NGO',
    categoryLabel: 'NGO · UN Humanitarian Agency',
    sector: 'Water, Sanitation & Renewable Energy',
    issuer: 'UNHCR Ethiopia Representation (Sample Fictional Agency)',
    refNumber: 'UNHCR/ETH/RFP/2026/014',
    closeIso: '2026-12-19T12:00:00+03:00',
    closeLabel: '19 Dec 2026 · 12:00 EAT',
    cpoAmount: '150,000 ETB',
    documentFee: 'Free of Charge',
    region: 'Somali Regional State',
    gazette: 'Sample Humanitarian Bulletin Ref: UNGM-ETH-2026/14',
    summary:
      'Fictional sample turnkey engineering procurement for 6 deep borehole solar pumping arrays (45kWp each) with automated chlorination across refugee settlements.',
    scopeOfWork: [
      'Design, supply, and installation of Grundfos or equivalent submersible solar pumps (25m³/hr at 140m head).',
      'Galvanized cyclone-resistant solar mounting structures and Monocrystalline Tier-1 PV modules.',
      'Automated solar inverter drives with dual hybrid diesel-generator changeover capability.',
      'Construction of masonry pump control houses, lightning protection systems, and perimeter chain link fences.',
    ],
    eligibilityRequirements: [
      'Valid UNGM Registration (Basic or Level 1 vendor code).',
      'Water Works Contractor or Electromechanical Category 1 or 2 license.',
      'Bid Security of 150,000 ETB in form of CPO or Bank Guarantee with 120-day validity.',
      'Proven experience executing off-grid solar water projects in the Somali or Afar regions.',
    ],
    contactPerson: 'UNHCR Supply Management Unit · Bole Sub-City, Addis Ababa',
    submissionAddress: 'UNHCR Regional Office, Behind ECA Compound, Tender Box #A, Addis Ababa',
    fullNoticeText: [
      '1. The Office of the United Nations High Commissioner for Refugees (UNHCR) in Ethiopia invites sealed proposals for solar borehole water pump systems.',
      '2. Complete tender documents with detailed technical specifications and BOQ schedules are available at no charge on UNGM.',
      '3. Bids must be submitted in dual sealed envelopes (Envelope 1: Technical & Bid Bond; Envelope 2: Financial Offer).',
      '4. Closing deadline is strictly 19 Dec 2026 at 12:00 EAT. Bids received after this hour will not be considered.',
    ],
  },
  // NGO Tender 3: Fleet Maintenance
  {
    id: 'NGO-2026-058',
    title: 'Long-Term Fleet Preventative Maintenance and Genuine Spare Parts Supply for 4WD Field Vehicles',
    category: 'NGO',
    categoryLabel: 'NGO · Humanitarian Mission',
    sector: 'Automotive & Logistics Fleet',
    issuer: 'International Committee of the Red Cross Delegation (Sample Fictional Mission)',
    refNumber: 'ICRC/ADD/FLEET/2026/02',
    closeIso: '2026-12-16T16:00:00+03:00',
    closeLabel: '16 Dec 2026 · 16:00 EAT',
    cpoAmount: '100,000 ETB',
    documentFee: 'Free of Charge',
    region: 'Nationwide (Addis Ababa, Hawassa, Mekelle Hubs)',
    gazette: 'Sample Logistics Bulletin Ref: ICRC-FLEET-2026/02',
    summary:
      'Fictional sample framework agreement for certified automotive garages to maintain a fleet of 85 Toyota Land Cruiser HZJ76/79 and Hilux field vehicles operated across humanitarian corridors.',
    scopeOfWork: [
      'Scheduled 5,000 km and 10,000 km preventative servicing, fluid flushes, and brake overhauls.',
      'Guaranteed supply of genuine Toyota OEM filters, brake components, suspension bushings, and clutches.',
      'Rapid breakdown field recovery service within 150 km of regional service centers.',
      'Digital maintenance tracking logs and computerized engine diagnostic reports.',
    ],
    eligibilityRequirements: [
      'Automotive Workshop Grade 1 license with certified hydraulic lifts and diagnostic scanners.',
      'Authorized dealer or registered importer of genuine OEM vehicle replacement parts.',
      '100,000 ETB CPO bid bond payable to ICRC Ethiopia Delegation.',
      'Zero-tolerance compliance with humanitarian neutral procurement protocols.',
    ],
    contactPerson: 'ICRC Delegation Logistics Department · Sarbet Area',
    submissionAddress: 'ICRC Ethiopia Delegation, Sarbet Jomo Kenyatta Street, Addis Ababa',
    fullNoticeText: [
      '1. The International Committee of the Red Cross (ICRC) Delegation in Ethiopia invites competitive tenders for vehicle fleet maintenance.',
      '2. Reputable workshops with facilities in Addis Ababa and regional branches are eligible to bid.',
      '3. Bid security of 100,000 ETB must be enclosed in the technical envelope.',
      '4. Tender closes on 16 Dec 2026 at 16:00 EAT. Workshop physical audits will be conducted as part of technical evaluation.',
    ],
  },

  // Stitch Example 3: Office Cleaning (Private Tender)
  {
    id: 'PRV-2026-CLN-03',
    title: 'Annual Janitorial, Office Cleaning, and Facility Hygiene Services for Head Office Tower',
    category: 'Private',
    categoryLabel: 'Private · Commercial Banking S.C.',
    sector: 'Facility Management & Janitorial Services',
    issuer: 'Abyssinia Commercial Bank S.C. (Sample Fictional Enterprise)',
    refNumber: 'ACB/HO/CLEAN/2026/12',
    closeIso: '2026-12-24T15:00:00+03:00',
    closeLabel: '24 Dec 2026 · 15:00 EAT',
    cpoAmount: '35,000 ETB',
    documentFee: '300 ETB (Non-refundable)',
    region: 'Addis Ababa (Financial District, Ras Abebe Aregay Street)',
    gazette: 'Sample Commercial Press Ref: BANK-CORP-2026/12',
    summary:
      'Fictional sample tender for reputable janitorial and facility hygiene enterprises to provide comprehensive daily cleaning, floor polishing, and window care for an 18-storey bank headquarters.',
    scopeOfWork: [
      'Comprehensive daily office cleaning, surface sanitization, and trash management across 18 floors and 2 basement parking levels (approx. 24,000 m²).',
      'Bi-weekly industrial machine scrubbing, marble floor crystallization, and deep carpet hot-water extraction.',
      'Quarterly high-rise exterior glass curtain wall cleaning using certified rope access or facade cradle operators.',
      'Provision of eco-friendly cleaning detergents, automated touchless hand sanitizer refills, and institutional restroom paper supplies.',
    ],
    eligibilityRequirements: [
      'Renewed Commercial Cleaning & Janitorial Services trade license with minimum 3 years corporate operating track record.',
      'Certificate of Competence from Ministry of Labor & Skills for workplace occupational safety and chemical handling.',
      'Certified Payment Order (CPO) of 35,000 ETB issued by any licensed commercial bank.',
      'Proof of Workman’s Compensation Insurance and professional indemnity coverage for cleaning personnel.',
    ],
    contactPerson: 'General Services & Procurement Department · 8th Floor Cashier',
    submissionAddress: 'Abyssinia Commercial Bank S.C., Financial District Tower, Tender Box #B, Addis Ababa',
    fullNoticeText: [
      '1. Abyssinia Commercial Bank S.C. invites sealed commercial bids from experienced cleaning companies for facility hygiene services.',
      '2. Tender dossiers can be obtained from the 8th floor General Services Department against payment of 300 ETB.',
      '3. A compulsory pre-bid building walkthrough and facility inspection is scheduled for 18 Dec 2026 at 10:00 EAT.',
      '4. Sealed bids accompanied by a 35,000 ETB CPO must be submitted before 24 Dec 2026 at 15:00 EAT.',
    ],
  },
  // Private Tender 2: ATM Kiosks
  {
    id: 'PRV-2026-021',
    title: 'Turnkey Fabrication, Civil Installation, and Branding of Standardized Off-Site ATM Kiosks',
    category: 'Private',
    categoryLabel: 'Private · Commercial Banking',
    sector: 'Banking Infrastructure & Fit-Out',
    issuer: 'Awash Bank S.C. (Sample Fictional Enterprise)',
    refNumber: 'AB/HO/PROC/ATM-KIOSK/2026/88',
    closeIso: '2026-12-26T15:30:00+03:00',
    closeLabel: '26 Dec 2026 · 15:30 EAT',
    cpoAmount: '80,000 ETB',
    documentFee: '300 ETB',
    region: 'Oromia & Addis Ababa',
    gazette: 'Sample Commercial Press Ref: BANK-ATM-2026/88',
    summary:
      'Fictional sample tender for design, reinforced steel fabrication, biometric access door installation, and thermal insulation of 28 standardized freestanding ATM kiosks.',
    scopeOfWork: [
      'Fabrication of bullet-resistant double-skin steel enclosure kiosks with anti-pry anchoring.',
      'Installation of UPS electrical panel boards, surge protectors, and dual redundant split AC units.',
      'Exterior corporate branding conforming to Awash Bank brand identity guidelines.',
      'Concrete plinth casting, electrical trenching, and earthing installation at 28 designated sites.',
    ],
    eligibilityRequirements: [
      'General Metal Fabrication / Building Finishing Contractor Category 3 or higher.',
      'Renewed Trade License, TIN, and Current Tax Clearance Certificate.',
      'Bank CPO of 80,000 ETB drawn in favor of Awash Bank S.C.',
      'Submission of material quality test certificates for steel gauge and powder-coated paint.',
    ],
    contactPerson: 'Procurement Directorate · Awash Bank HQ Tower 11th Floor',
    submissionAddress: 'Awash Bank Headquarters, Balcha Aba Nefso Road, Addis Ababa',
    fullNoticeText: [
      '1. Awash Bank S.C. invites sealed competitive bids from eligible contractors for the turnkey manufacturing of 28 ATM Kiosks.',
      '2. Bid documents can be purchased against payment of 300 ETB at the Cash Office on the 11th floor.',
      '3. A bid bond of 80,000 ETB must accompany the technical bid document.',
      '4. Bids must be submitted to the Tender Box at the Procurement Department before 26 Dec 2026 at 15:30 EAT.',
    ],
  },
  // Private Tender 3: Heavy Bulk Haulage
  {
    id: 'PRV-2026-045',
    title: 'Outsourced Heavy Bulk Haulage Transport Services for Mugher Cement Factory Raw Materials',
    category: 'Private',
    categoryLabel: 'Private · Industrial Enterprise',
    sector: 'Logistics & Heavy Freight',
    issuer: 'Dangote Cement (Ethiopia) Plc (Sample Fictional Enterprise)',
    refNumber: 'DCP/ETH/LOG/HAUL/2026/15',
    closeIso: '2026-12-30T11:00:00+03:00',
    closeLabel: '30 Dec 2026 · 11:00 EAT',
    cpoAmount: '300,000 ETB',
    documentFee: '1,500 ETB',
    region: 'Oromia (Mugher & Adama Corridors)',
    gazette: 'Sample Commercial Press Ref: IND-HAUL-2026/15',
    summary:
      'Fictional sample tender for licensed freight transport fleet operators to haul gypsum, pozzolana, and coal to the Mugher Cement Plant with dedicated 40-ton tipper and flatbed trucks.',
    scopeOfWork: [
      'Provision of minimum 25 dedicated 40-tonne commercial tipper/trailer trucks.',
      'Guaranteed monthly transport capacity of 45,000 metric tonnes across Mugher quarry routes.',
      'Real-time GPS fleet tracking integration with Dangote logistics dashboard.',
      'Compliance with occupational safety, driver fatigue management, and cargo transit insurance.',
    ],
    eligibilityRequirements: [
      'Valid Commercial Freight Transport Enterprise Operating Permit Grade 1.',
      'Title registration certificates proving ownership or certified lease of at least 20 heavy trucks.',
      'CPO of 300,000 ETB from an accredited Ethiopian commercial bank.',
      'Valid Goods-in-Transit (GIT) insurance coverage of minimum 15,000,000 ETB.',
    ],
    contactPerson: 'Logistics & Procurement Division · Dangote Mugher Office',
    submissionAddress: 'Dangote Cement Ethiopia Head Office, Meskel Flower Road, Addis Ababa',
    fullNoticeText: [
      '1. Dangote Cement (Ethiopia) Plc invites sealed bids from experienced logistics freight companies for heavy bulk transport.',
      '2. Bid documents can be collected upon presentation of bank deposit slip for 1,500 ETB.',
      '3. The technical offer must contain valid vehicle registrations, driver certifications, and 300,000 ETB CPO bond.',
      '4. Deadline for submission of tenders is 30 Dec 2026 at 11:00 EAT.',
    ],
  },
]

// 3. FICTIONAL NOTIFICATIONS / ALERTS
const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alt-01',
    title: 'New NGO Humanitarian Notice Published',
    message: 'East Africa Humanitarian Initiative issued a fictional sample tender for 12,000 Emergency Family Hygiene Kits & Water Containers.',
    category: 'NGO',
    timestamp: '15m ago',
    read: false,
    targetId: 'NGO-2026-HYG-02',
    targetType: 'tender',
  },
  {
    id: 'alt-02',
    title: 'Urgent Vehicle Auction Deadline: 48 Hours',
    message: 'Isuzu D-Max collision salvage pickup (Gelan Depot) closes on 12 Dec 2026 at 10:30 EAT.',
    category: 'Vehicles',
    timestamp: '2h ago',
    read: false,
    targetId: 'EVP-2407-031',
    targetType: 'vehicle',
  },
  {
    id: 'alt-03',
    title: 'Public School Desks Procurement Active',
    message: 'Oromia Regional Education Bureau published a sample tender for 2,400 Combined Primary School Desks.',
    category: 'Public',
    timestamp: '5h ago',
    read: false,
    targetId: 'PUB-2026-DESK-01',
    targetType: 'tender',
  },
  {
    id: 'alt-04',
    title: 'Bank Facility Notice Published',
    message: 'Abyssinia Commercial Bank S.C. issued a corporate tender for Annual Janitorial & Office Cleaning Services.',
    category: 'Private',
    timestamp: '1d ago',
    read: true,
    targetId: 'PRV-2026-CLN-03',
    targetType: 'tender',
  },
]

export default function BidEthiopiaPortal() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'home' | 'tenders' | 'vehicles' | 'saved' | 'alerts' | 'guidelines' | 'profile'>('home')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLot | null>(null)
  const [selectedTender, setSelectedTender] = useState<ProcurementTender | null>(null)

  // Filters for Vehicles
  const [vehicleConditionFilter, setVehicleConditionFilter] = useState('All conditions')
  const [vehicleRegionFilter, setVehicleRegionFilter] = useState('All regions')
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('')
  const [vehicleClosingSoon, setVehicleClosingSoon] = useState(false)
  const [isVehicleDrawerOpen, setIsVehicleDrawerOpen] = useState(false)

  // Filters for Tenders
  const [tenderCategoryFilter, setTenderCategoryFilter] = useState<'All' | 'Public' | 'NGO' | 'Private'>('All')
  const [tenderSectorFilter, setTenderSectorFilter] = useState('All sectors')
  const [tenderSearchQuery, setTenderSearchQuery] = useState('')
  const [tenderClosingSoon, setTenderClosingSoon] = useState(false)

  // Home 4-Category Selection State (Stitch Alignment)
  const [selectedHomeCategory, setSelectedHomeCategory] = useState<
    'Vehicle Bids' | 'Public Tenders' | 'NGO Tenders' | 'Private Tenders'
  >('Vehicle Bids')

  // Saved Lots & Tenders (Local Persistence)
  const [savedVehicleIds, setSavedVehicleIds] = useState<string[]>([])
  const [savedTenderIds, setSavedTenderIds] = useState<string[]>([])
  const [savedViewFilter, setSavedViewFilter] = useState<'all' | 'vehicles' | 'tenders'>('all')

  // User Profile & Demo Login State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginStep, setLoginStep] = useState<'email' | 'code'>('email')
  const [loginCode, setLoginCode] = useState('')
  const [loginError, setLoginError] = useState('')

  // Gated Access & Photo Selection
  const [isSubscriberUnlocked, setIsSubscriberUnlocked] = useState(false)
  const [activeVehiclePhotoIndex, setActiveVehiclePhotoIndex] = useState(0)

  // Modals & Feedback
  const [activeNoticeModal, setActiveNoticeModal] = useState<{
    refNumber: string
    gazette: string
    title: string
    issuer: string
    cpoAmount: string
    closingDate: string
    paragraphs: string[]
    tenderBox?: string
  } | null>(null)
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Alerts List State
  const [alerts, setAlerts] = useState<AlertNotification[]>(INITIAL_ALERTS)
  const [alertPrefChannels, setAlertPrefChannels] = useState({
    email: true,
    sms: false,
    telegram: true,
  })
  const [alertPrefCategories, setAlertPrefCategories] = useState({
    public: true,
    ngo: true,
    private: true,
    vehicles: true,
  })

  // Hydrate persistence from localStorage
  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem('bid_ethiopia_saved_vehicles')
      if (storedVehicles) setSavedVehicleIds(JSON.parse(storedVehicles))

      const storedTenders = localStorage.getItem('bid_ethiopia_saved_tenders')
      if (storedTenders) setSavedTenderIds(JSON.parse(storedTenders))

      const storedUser = localStorage.getItem('bid_ethiopia_user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        setCurrentUser(parsed)
        setIsSubscriberUnlocked(parsed.isSubscriber)
      }
    } catch {
      // safe fallback
    }
  }, [])

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [activeTab, selectedVehicle, selectedTender])

  // Save/Unsave Vehicles
  const toggleSaveVehicle = (vehicleId: string) => {
    setSavedVehicleIds((prev) => {
      const isSaved = prev.includes(vehicleId)
      const updated = isSaved ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]
      try {
        localStorage.setItem('bid_ethiopia_saved_vehicles', JSON.stringify(updated))
      } catch {}
      return updated
    })
    showToast(
      savedVehicleIds.includes(vehicleId)
        ? 'Removed vehicle lot from saved bookmarks.'
        : 'Saved vehicle lot to bookmarks (access to full dossier remains separate).'
    )
  }

  // Save/Unsave Tenders
  const toggleSaveTender = (tenderId: string) => {
    setSavedTenderIds((prev) => {
      const isSaved = prev.includes(tenderId)
      const updated = isSaved ? prev.filter((id) => id !== tenderId) : [...prev, tenderId]
      try {
        localStorage.setItem('bid_ethiopia_saved_tenders', JSON.stringify(updated))
      } catch {}
      return updated
    })
    showToast(
      savedTenderIds.includes(tenderId)
        ? 'Removed tender from saved bookmarks.'
        : 'Saved procurement tender to bookmarks (access to technical dossier remains separate).'
    )
  }

  const showToast = (msg: string) => {
    setFeedbackToast(msg)
    setTimeout(() => setFeedbackToast(null), 4000)
  }

  // Demo Login Actions
  const handleSendCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!loginEmail || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid business or personal email address.')
      return
    }
    setLoginError('')
    setLoginStep('code')
  }

  const handleVerifyCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (loginCode.trim().length < 4) {
      setLoginError('Please enter the 6-digit confirmation code (Demo: 849201).')
      return
    }
    const demoUser: UserProfile = {
      name: 'Abebe Kebede',
      email: loginEmail,
      organization: 'Kebede & Associates Trading Enterprise',
      tin: '0029481741 (Sample TIN)',
      phone: '+251 91 124 5589',
      isSubscriber: true,
    }
    setCurrentUser(demoUser)
    setIsSubscriberUnlocked(true)
    try {
      localStorage.setItem('bid_ethiopia_user', JSON.stringify(demoUser))
    } catch {}
    setIsLoginModalOpen(false)
    setLoginStep('email')
    setLoginCode('')
    setLoginEmail('')
    showToast('Signed in successfully as Abebe Kebede · Enterprise Subscriber active.')
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    setIsSubscriberUnlocked(false)
    try {
      localStorage.removeItem('bid_ethiopia_user')
    } catch {}
    showToast('Signed out. Switched to public guest mode.')
  }

  // Navigation Helper
  const navigateTo = (tab: 'home' | 'tenders' | 'vehicles' | 'saved' | 'alerts' | 'guidelines' | 'profile') => {
    setSelectedVehicle(null)
    setSelectedTender(null)
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  // Exact Category Navigator (Stitch alignment)
  const navigateToCategory = (cat: 'Vehicle Bids' | 'Public Tenders' | 'NGO Tenders' | 'Private Tenders') => {
    setSelectedVehicle(null)
    setSelectedTender(null)
    setIsMobileMenuOpen(false)
    if (cat === 'Vehicle Bids') {
      setActiveTab('vehicles')
    } else {
      setActiveTab('tenders')
      setTenderCategoryFilter(cat === 'Public Tenders' ? 'Public' : cat === 'NGO Tenders' ? 'NGO' : 'Private')
    }
  }

  // Open Vehicle
  const openVehicleDetail = (lot: VehicleLot) => {
    setSelectedVehicle(lot)
    setSelectedTender(null)
    setActiveVehiclePhotoIndex(0)
  }

  // Open Tender
  const openTenderDetail = (tender: ProcurementTender) => {
    setSelectedTender(tender)
    setSelectedVehicle(null)
  }

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return VEHICLE_LOTS.filter((lot) => {
      const matchCond = vehicleConditionFilter === 'All conditions' || lot.condition === vehicleConditionFilter
      const matchReg = vehicleRegionFilter === 'All regions' || lot.region === vehicleRegionFilter
      const q = vehicleSearchQuery.trim().toLowerCase()
      const matchQ =
        !q ||
        lot.title.toLowerCase().includes(q) ||
        lot.id.toLowerCase().includes(q) ||
        lot.issuer.toLowerCase().includes(q)
      return matchCond && matchReg && matchQ
    }).sort((a, b) => {
      if (vehicleClosingSoon) return new Date(a.closeIso).getTime() - new Date(b.closeIso).getTime()
      return 0
    })
  }, [vehicleConditionFilter, vehicleRegionFilter, vehicleSearchQuery, vehicleClosingSoon])

  // Filtered Tenders
  const filteredTenders = useMemo(() => {
    return PROCUREMENT_TENDERS.filter((tender) => {
      const matchCat = tenderCategoryFilter === 'All' || tender.category === tenderCategoryFilter
      const matchSec = tenderSectorFilter === 'All sectors' || tender.sector === tenderSectorFilter
      const q = tenderSearchQuery.trim().toLowerCase()
      const matchQ =
        !q ||
        tender.title.toLowerCase().includes(q) ||
        tender.id.toLowerCase().includes(q) ||
        tender.issuer.toLowerCase().includes(q) ||
        tender.refNumber.toLowerCase().includes(q)
      return matchCat && matchSec && matchQ
    }).sort((a, b) => {
      if (tenderClosingSoon) return new Date(a.closeIso).getTime() - new Date(b.closeIso).getTime()
      return 0
    })
  }, [tenderCategoryFilter, tenderSectorFilter, tenderSearchQuery, tenderClosingSoon])

  const savedVehicles = useMemo(() => {
    return VEHICLE_LOTS.filter((v) => savedVehicleIds.includes(v.id))
  }, [savedVehicleIds])

  const savedTenders = useMemo(() => {
    return PROCUREMENT_TENDERS.filter((t) => savedTenderIds.includes(t.id))
  }, [savedTenderIds])

  // Selected Category Preview for Home Portal
  const previewTenders = useMemo(() => {
    if (selectedHomeCategory === 'Public Tenders') {
      return PROCUREMENT_TENDERS.filter((t) => t.category === 'Public')
    }
    if (selectedHomeCategory === 'NGO Tenders') {
      return PROCUREMENT_TENDERS.filter((t) => t.category === 'NGO')
    }
    if (selectedHomeCategory === 'Private Tenders') {
      return PROCUREMENT_TENDERS.filter((t) => t.category === 'Private')
    }
    return []
  }, [selectedHomeCategory])

  const totalSavedCount = savedVehicleIds.length + savedTenderIds.length
  const unreadAlertsCount = alerts.filter((a) => !a.read).length

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#16201B] flex flex-col font-sans selection:bg-[#1B4332] selection:text-white">
      {/* 1. COMPACT TOP HEADER (56px) with Forest Green Accent (#1B4332) */}
      <header className="sticky top-0 z-30 h-14 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5DFD5] px-3 sm:px-4 lg:px-6 flex items-center justify-between">
        {/* Brand & Demo Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-left group focus:outline-hidden"
            aria-label="Fanos Tender - Go to Home"
          >
            <div className="flex items-center gap-1.5">
              <Brand />
              <span className="rounded border border-[#C8C2B3] bg-[#EFEBE1] px-1 py-0.2 text-[9px] sm:text-[10px] font-bold tracking-widest text-[#635E53] shrink-0">
                DEMO
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav aria-label="Portal Navigation" className="hidden md:flex items-center gap-0.5 h-full">
          <button
            onClick={() => navigateTo('home')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'home' && !selectedVehicle && !selectedTender
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => navigateToCategory('Vehicle Bids')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center gap-1 text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'vehicles' && !selectedVehicle
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            <Truck className="size-3 text-[#1B4332]" />
            Vehicle Bids
            <span className="rounded-full bg-[#E2EDE6] px-1 py-0.2 text-[9px] font-bold text-[#1B4332]">
              {VEHICLE_LOTS.length}
            </span>
          </button>

          <button
            onClick={() => navigateToCategory('Public Tenders')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center gap-1 text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'tenders' && tenderCategoryFilter === 'Public' && !selectedTender
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            <Building2 className="size-3 text-[#1B4332]" />
            Public Tenders
            <span className="rounded-full bg-[#D8F3DC] px-1 py-0.2 text-[9px] font-bold text-[#1B4332]">
              {PROCUREMENT_TENDERS.filter((t) => t.category === 'Public').length}
            </span>
          </button>

          <button
            onClick={() => navigateToCategory('NGO Tenders')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center gap-1 text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'tenders' && tenderCategoryFilter === 'NGO' && !selectedTender
                ? 'text-[#1D4ED8] border-b-2 border-[#1D4ED8]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            <Globe className="size-3 text-[#1D4ED8]" />
            NGO Tenders
            <span className="rounded-full bg-[#EFF6FF] px-1 py-0.2 text-[9px] font-bold text-[#1D4ED8]">
              {PROCUREMENT_TENDERS.filter((t) => t.category === 'NGO').length}
            </span>
          </button>

          <button
            onClick={() => navigateToCategory('Private Tenders')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center gap-1 text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'tenders' && tenderCategoryFilter === 'Private' && !selectedTender
                ? 'text-[#B45309] border-b-2 border-[#B45309]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            <Briefcase className="size-3 text-[#B45309]" />
            Private Tenders
            <span className="rounded-full bg-[#FEF3C7] px-1 py-0.2 text-[9px] font-bold text-[#B45309]">
              {PROCUREMENT_TENDERS.filter((t) => t.category === 'Private').length}
            </span>
          </button>

          <button
            onClick={() => navigateTo('saved')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center gap-1 text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'saved' && !selectedVehicle && !selectedTender
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            <Bookmark className="size-3" />
            Saved
            {totalSavedCount > 0 && (
              <span className="rounded-full bg-[#1B4332] px-1 py-0.2 text-[9px] font-bold text-white">
                {totalSavedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigateTo('alerts')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center gap-1 text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'alerts' && !selectedVehicle && !selectedTender
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            <Bell className="size-3" />
            Alerts
            {unreadAlertsCount > 0 && (
              <span className="rounded-full bg-[#B84A2B] px-1 py-0.2 text-[9px] font-bold text-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigateTo('guidelines')}
            className={`relative h-full px-1.5 lg:px-2 flex items-center text-[11px] lg:text-xs font-semibold whitespace-nowrap transition focus:outline-hidden ${
              activeTab === 'guidelines' && !selectedVehicle && !selectedTender
                ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                : 'text-[#6E695F] hover:text-[#16201B]'
            }`}
          >
            Guidelines
          </button>
        </nav>

        {/* Right Utility Bar: Profile, Alerts Bell, Demo Subscriber Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Notification Bell */}
          <button
            type="button"
            onClick={() => navigateTo('alerts')}
            className="relative flex size-8 items-center justify-center rounded-lg border border-[#E5DFD5] bg-white text-[#6E695F] hover:text-[#16201B] hover:bg-[#F4F1EA] transition focus:outline-hidden"
            aria-label="View notifications and alerts"
          >
            <Bell className="size-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#B84A2B]" />
            )}
          </button>

          {/* User Account / Profile Button */}
          {currentUser ? (
            <button
              onClick={() => navigateTo('profile')}
              className="flex items-center gap-2 rounded-lg border border-[#E5DFD5] bg-white px-2.5 py-1 text-xs text-[#16201B] hover:border-[#1B4332] transition shadow-2xs"
            >
              <div className="size-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <span className="font-semibold text-xs hidden sm:inline">{currentUser.name}</span>
              <span className="rounded bg-[#D8F3DC] px-1.5 py-0.2 text-[10px] font-bold text-[#1B4332]">
                Subscriber
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B4332] bg-[#1B4332] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2D6A4F] transition shadow-2xs"
            >
              <LogIn className="size-3.5" />
              <span>Demo Login</span>
            </button>
          )}

          {/* Mobile Menu Button (< 768px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex size-8 items-center justify-center rounded-lg border border-[#E5DFD5] bg-white text-[#6E695F]"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="size-4.5" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown (< 768px) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E5DFD5] p-4 space-y-2 shadow-md animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => navigateTo('home')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'home' ? 'bg-[#1B4332] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span>Home Portal</span>
            <ChevronRight className="size-4" />
          </button>
          <button
            onClick={() => navigateToCategory('Vehicle Bids')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'vehicles' ? 'bg-[#1B4332] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck className="size-4 text-[#1B4332]" />
              Vehicle Bids
            </span>
            <span className="text-[10px]">{VEHICLE_LOTS.length} Lots</span>
          </button>
          <button
            onClick={() => navigateToCategory('Public Tenders')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'tenders' && tenderCategoryFilter === 'Public' ? 'bg-[#1B4332] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 className="size-4 text-[#1B4332]" />
              Public Tenders
            </span>
            <span className="text-[10px]">{PROCUREMENT_TENDERS.filter((t) => t.category === 'Public').length} Tenders</span>
          </button>
          <button
            onClick={() => navigateToCategory('NGO Tenders')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'tenders' && tenderCategoryFilter === 'NGO' ? 'bg-[#1D4ED8] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Globe className="size-4 text-[#1D4ED8]" />
              NGO Tenders
            </span>
            <span className="text-[10px]">{PROCUREMENT_TENDERS.filter((t) => t.category === 'NGO').length} Tenders</span>
          </button>
          <button
            onClick={() => navigateToCategory('Private Tenders')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'tenders' && tenderCategoryFilter === 'Private' ? 'bg-[#B45309] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="size-4 text-[#B45309]" />
              Private Tenders
            </span>
            <span className="text-[10px]">{PROCUREMENT_TENDERS.filter((t) => t.category === 'Private').length} Tenders</span>
          </button>
          <button
            onClick={() => navigateTo('saved')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'saved' ? 'bg-[#1B4332] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Bookmark className="size-3.5" />
              Saved Bookmarks
            </span>
            <span className="text-[10px]">{totalSavedCount} Saved</span>
          </button>
          <button
            onClick={() => navigateTo('alerts')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'alerts' ? 'bg-[#1B4332] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Bell className="size-3.5" />
              Tender Alerts
            </span>
            <span className="text-[10px]">{unreadAlertsCount} Unread</span>
          </button>
          <button
            onClick={() => navigateTo('guidelines')}
            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold ${
              activeTab === 'guidelines' ? 'bg-[#1B4332] text-white' : 'text-[#16201B] hover:bg-[#FAF8F5]'
            }`}
          >
            <span>Bidding Guidelines & CPO Rules</span>
            <span className="text-[10px]">Regulations</span>
          </button>
          <button
            onClick={() => {
              if (currentUser) navigateTo('profile')
              else setIsLoginModalOpen(true)
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-[#1B4332] bg-[#D8F3DC] mt-2"
          >
            <span>{currentUser ? 'My Profile & Settings' : 'Demo Subscriber Login'}</span>
            <User className="size-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Feedback Toast */}
        {feedbackToast && (
          <div className="mb-4 rounded-xl border border-[#A7D7C5] bg-[#EAF7EE] p-3 text-xs text-[#1B4332] flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#1B4332] shrink-0" />
              <span className="font-medium">{feedbackToast}</span>
            </div>
            <button
              onClick={() => setFeedbackToast(null)}
              className="text-[#1B4332] hover:text-black font-semibold text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: FOUR-CATEGORY HOME PORTAL (Simplified Stitch Alignment)*/}
        {/* ============================================================== */}
        {!selectedVehicle && !selectedTender && activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Search Hero Section (No invented verification claims) */}
            <section className="rounded-2xl bg-gradient-to-b from-[#1B4332] to-[#143527] text-white p-6 sm:p-9 shadow-sm space-y-5">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-[#D8F3DC] backdrop-blur-xs">
                  <Sparkles className="size-3 text-[#E0B263]" />
                  <span>Fictional Sample Prototype · Stitch Alignment</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                  Ethiopian Tender & Asset Portal
                </h1>
                <p className="text-sm sm:text-base text-[#D8F3DC]/90 leading-relaxed max-w-2xl">
                  Search across Vehicle Bids, Public Tenders, NGO Tenders, and Private Tenders in East Africa Time (EAT). All data and notices are fictional samples for evaluation.
                </p>
              </div>

              {/* Universal Search Bar */}
              <div className="bg-white rounded-xl p-2 sm:p-2.5 shadow-lg flex flex-col sm:flex-row items-center gap-2 border border-[#E5DFD5]">
                <div className="relative flex-1 w-full flex items-center">
                  <Search className="size-4 text-[#6E695F] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search across Vehicle Bids, Public, NGO, and Private tenders..."
                    value={tenderSearchQuery}
                    onChange={(e) => setTenderSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const q = tenderSearchQuery.trim().toLowerCase()
                        if (q.includes('toyota') || q.includes('isuzu') || q.includes('sedan') || q.includes('pickup') || q.includes('patrol')) {
                          setVehicleSearchQuery(tenderSearchQuery)
                          navigateTo('vehicles')
                        } else {
                          navigateTo('tenders')
                        }
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs text-[#16201B] placeholder:text-[#918C81] focus:outline-hidden"
                  />
                  {tenderSearchQuery && (
                    <button
                      onClick={() => setTenderSearchQuery('')}
                      className="mr-2 text-[#6E695F] hover:text-[#16201B]"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    const q = tenderSearchQuery.trim().toLowerCase()
                    if (q.includes('toyota') || q.includes('isuzu') || q.includes('sedan') || q.includes('pickup') || q.includes('patrol')) {
                      setVehicleSearchQuery(tenderSearchQuery)
                      navigateTo('vehicles')
                    } else {
                      navigateTo('tenders')
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shrink-0"
                >
                  Search Listings
                </button>
              </div>

              {/* Sample Keyword Suggestion Pills */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                <span className="text-[#D8F3DC]/80 text-[11px] font-medium">Sample Searches:</span>
                {[
                  { label: 'School Desks', cat: 'Public Tenders', q: 'school desks' },
                  { label: 'Hygiene Kits', cat: 'NGO Tenders', q: 'hygiene kits' },
                  { label: 'Office Cleaning', cat: 'Private Tenders', q: 'office cleaning' },
                  { label: 'Toyota Corolla', cat: 'Vehicle Bids', q: 'corolla' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setTenderSearchQuery(item.q)
                      setSelectedHomeCategory(item.cat as any)
                    }}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-[#D8F3DC] transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Four Exact Category Labels (Stitch Android Alignment) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E695F] block">
                    SECTOR DIRECTORY · FOUR EXACT CATEGORIES
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-[#16201B]">
                    Select a Category to Preview
                  </h2>
                </div>
                <span className="text-xs text-[#6E695F] hidden sm:inline">
                  Click a category below to switch active preview
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
                {[
                  {
                    id: 'Vehicle Bids' as const,
                    label: 'Vehicle Bids',
                    sublabel: 'Auctions & Fleet Disposal',
                    count: `${VEHICLE_LOTS.length} Lots`,
                    icon: Truck,
                    accent: 'bg-[#D8F3DC] text-[#1B4332]',
                  },
                  {
                    id: 'Public Tenders' as const,
                    label: 'Public Tenders',
                    sublabel: 'Federal & Regional Bureaus',
                    count: `${PROCUREMENT_TENDERS.filter((t) => t.category === 'Public').length} Tenders`,
                    icon: Building2,
                    accent: 'bg-[#EAF7EE] text-[#1B4332]',
                  },
                  {
                    id: 'NGO Tenders' as const,
                    label: 'NGO Tenders',
                    sublabel: 'UN & Relief Missions',
                    count: `${PROCUREMENT_TENDERS.filter((t) => t.category === 'NGO').length} Tenders`,
                    icon: Globe,
                    accent: 'bg-[#EFF6FF] text-[#1D4ED8]',
                  },
                  {
                    id: 'Private Tenders' as const,
                    label: 'Private Tenders',
                    sublabel: 'Commercial & Corporate',
                    count: `${PROCUREMENT_TENDERS.filter((t) => t.category === 'Private').length} Tenders`,
                    icon: Briefcase,
                    accent: 'bg-[#FEF3C7] text-[#B45309]',
                  },
                ].map((cat) => {
                  const isSelected = selectedHomeCategory === cat.id
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedHomeCategory(cat.id)}
                      className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-[#1B4332] bg-[#FAF8F5] ring-2 ring-[#1B4332]/20 shadow-xs'
                          : 'bg-white border-[#E5DFD5] hover:border-[#1B4332]/40 hover:bg-[#FAF8F5]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`size-9 rounded-lg flex items-center justify-center ${cat.accent}`}>
                          <Icon className="size-4.5" />
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#16201B]">
                          {cat.count}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm sm:text-base font-extrabold text-[#16201B] block">
                          {cat.label}
                        </span>
                        <span className="text-[11px] text-[#6E695F] block">
                          {cat.sublabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-[#F0ECE1] text-[11px] font-bold">
                        <span className={isSelected ? 'text-[#1B4332]' : 'text-[#6E695F]'}>
                          {isSelected ? 'Active Preview' : 'Click to preview'}
                        </span>
                        {isSelected ? (
                          <CheckCircle2 className="size-3.5 text-[#1B4332]" />
                        ) : (
                          <ChevronRight className="size-3.5 text-[#6E695F]" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* One Selected Category Preview and "View all" */}
            <section className="bg-white border border-[#E5DFD5] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
              {/* Preview Header with Category Description and "View all" Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DFD5]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#EFECE6] text-[#16201B]">
                      Selected Category Preview
                    </span>
                    <span className="text-xs text-[#6E695F]">·</span>
                    <span className="text-xs text-[#6E695F]">East Africa Time (EAT)</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#16201B] mt-1">
                    {selectedHomeCategory}
                  </h3>
                  <p className="text-xs text-[#6E695F] mt-0.5 max-w-2xl">
                    {selectedHomeCategory === 'Vehicle Bids' &&
                      'Institutional sedans, 4x4 pickups, and regional utility vehicles with Keys, Starter, and Mileage inspection specs.'}
                    {selectedHomeCategory === 'Public Tenders' &&
                      'Federal ministries and regional bureau procurements, including school desks and infrastructure audits.'}
                    {selectedHomeCategory === 'NGO Tenders' &&
                      'UN agencies and international relief missions, including emergency family hygiene kits and solar borehole water systems.'}
                    {selectedHomeCategory === 'Private Tenders' &&
                      'Commercial banks and corporate enterprises, including head office janitorial cleaning and facility management.'}
                  </p>
                </div>

                {/* Prominent "View all" Button */}
                <button
                  onClick={() => navigateToCategory(selectedHomeCategory)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <span>View all {selectedHomeCategory}</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              {/* Preview Cards Grid */}
              {selectedHomeCategory === 'Vehicle Bids' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {VEHICLE_LOTS.map((lot) => {
                    const isSaved = savedVehicleIds.includes(lot.id)
                    return (
                      <div
                        key={lot.id}
                        onClick={() => openVehicleDetail(lot)}
                        className="group bg-[#FAF8F5] border border-[#E5DFD5] hover:border-[#1B4332] rounded-xl p-4 transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 text-left"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                lot.condition === 'Used'
                                  ? 'bg-[#EAF7EE] text-[#1B4332] border border-[#C8EAD1]'
                                  : 'bg-[#96422A] text-white'
                              }`}
                            >
                              {lot.conditionLabel}
                            </span>
                            <span className="text-[11px] font-mono text-[#6E695F] font-semibold">
                              {lot.id}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#16201B] group-hover:text-[#1B4332] transition line-clamp-1">
                            {lot.title}
                          </h4>

                          <p className="text-xs text-[#6E695F] line-clamp-2">
                            {lot.summary}
                          </p>

                          {/* Vehicle Specs Snapshot */}
                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#EAE5D9] text-[11px]">
                            <div>
                              <span className="text-[#6E695F] block">Keys:</span>
                              <strong className="text-[#16201B] font-semibold truncate block">
                                {lot.keys}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#6E695F] block">Starter:</span>
                              <strong className="text-[#16201B] font-semibold truncate block">
                                {lot.starter}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#6E695F]">
                            <MapPin className="size-3 text-[#1B4332] shrink-0" />
                            <span className="truncate">{lot.yardLocation}</span>
                          </div>
                        </div>

                        {/* Footer with EAT Deadline, CPO & Bookmark */}
                        <div className="pt-2 border-t border-[#EAE5D9] flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-[#6E695F] block">Closes EAT:</span>
                            <span className="text-[#B84A2B] font-bold">
                              {lot.closeLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#1B4332] font-semibold text-right">
                              CPO: {lot.cpoBond}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSaveVehicle(lot.id)
                              }}
                              className={`p-1.5 rounded-lg border transition ${
                                isSaved
                                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                  : 'bg-white text-[#6E695F] border-[#E5DFD5] hover:text-[#16201B]'
                              }`}
                              title={isSaved ? 'Saved' : 'Save vehicle'}
                            >
                              <Bookmark className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {previewTenders.map((tender) => {
                    const isSaved = savedTenderIds.includes(tender.id)
                    return (
                      <div
                        key={tender.id}
                        onClick={() => openTenderDetail(tender)}
                        className="group bg-[#FAF8F5] border border-[#E5DFD5] hover:border-[#1B4332] rounded-xl p-4 transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 text-left"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                tender.category === 'Public'
                                  ? 'bg-[#EAF7EE] text-[#1B4332] border border-[#C8EAD1]'
                                  : tender.category === 'NGO'
                                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                                  : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                              }`}
                            >
                              {tender.categoryLabel}
                            </span>
                            <span className="text-[11px] font-mono text-[#6E695F] font-semibold">
                              {tender.id}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-[#16201B] group-hover:text-[#1B4332] transition line-clamp-2">
                            {tender.title}
                          </h4>

                          <p className="text-xs text-[#6E695F] line-clamp-2">
                            {tender.summary}
                          </p>

                          <div className="pt-2 border-t border-[#EAE5D9] text-[11px] space-y-1">
                            <div className="text-[#16201B] font-semibold truncate">
                              {tender.issuer}
                            </div>
                            <div className="text-[#6E695F] truncate">
                              Sector: {tender.sector}
                            </div>
                          </div>
                        </div>

                        {/* Footer with EAT Deadline, CPO & Bookmark */}
                        <div className="pt-2 border-t border-[#EAE5D9] flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-[#6E695F] block">Closes EAT:</span>
                            <span className="text-[#B84A2B] font-bold">
                              {tender.closeLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#1B4332] font-semibold text-right">
                              CPO: {tender.cpoAmount}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSaveTender(tender.id)
                              }}
                              className={`p-1.5 rounded-lg border transition ${
                                isSaved
                                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                                  : 'bg-white text-[#6E695F] border-[#E5DFD5] hover:text-[#16201B]'
                              }`}
                              title={isSaved ? 'Saved' : 'Save tender'}
                            >
                              <Bookmark className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Preview Footer Callout */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6E695F] border-t border-[#E5DFD5]">
                <span>
                  Showing 3 sample listings for {selectedHomeCategory} · All issuers and notices are fictional
                </span>
                <button
                  onClick={() => navigateToCategory(selectedHomeCategory)}
                  className="font-bold text-[#1B4332] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>View full {selectedHomeCategory} directory</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: PROCUREMENT TENDERS DIRECTORY (Public, NGO, Private)   */}
        {/* ============================================================== */}
        {!selectedVehicle && !selectedTender && activeTab === 'tenders' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header & Sector Tabs */}
            <section className="space-y-2 border-b border-[#E5DFD5] pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#6E695F]">
                  OFFICIAL TENDER DIRECTORY · ETHIOPIA
                </span>
                <span className="size-1 rounded-full bg-[#1B4332]" />
                <span className="text-[11px] font-medium text-[#6E695F]">
                  PUBLIC · NGO · PRIVATE
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#16201B]">
                  Procurement Tenders
                </h1>
                {/* Sector Category Switcher Tabs */}
                <div className="inline-flex rounded-xl bg-[#EFECE6] p-1 border border-[#E5DFD5] self-start sm:self-auto">
                  {(['All', 'Public', 'NGO', 'Private'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTenderCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        tenderCategoryFilter === cat
                          ? 'bg-[#1B4332] text-white shadow-xs'
                          : 'text-[#6E695F] hover:text-[#16201B]'
                      }`}
                    >
                      {cat === 'All' ? 'All Sectors' : cat === 'Public' ? 'Public Sector' : cat === 'NGO' ? 'NGO / UN' : 'Private'}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Search & Sort Controls Toolbar */}
            <div className="bg-white border border-[#E5DFD5] rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#16201B]">
                  {filteredTenders.length} {filteredTenders.length === 1 ? 'Tender' : 'Tenders'} Active
                </span>
                <span className="text-[11px] text-[#6E695F] hidden sm:inline">
                  · All closing deadlines in East Africa Time (EAT)
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 sm:w-64">
                  <Search className="size-3.5 text-[#6E695F] absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search tender title, issuer, ref..."
                    value={tenderSearchQuery}
                    onChange={(e) => setTenderSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-xs text-[#16201B] focus:outline-hidden focus:border-[#1B4332]"
                  />
                  {tenderSearchQuery && (
                    <button
                      onClick={() => setTenderSearchQuery('')}
                      className="absolute right-2 top-2 text-[#6E695F] hover:text-black"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setTenderClosingSoon(!tenderClosingSoon)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shrink-0 ${
                    tenderClosingSoon
                      ? 'border-[#1B4332] bg-[#EAF7EE] text-[#1B4332]'
                      : 'border-[#E5DFD5] bg-[#FAF8F5] text-[#6E695F] hover:text-[#16201B]'
                  }`}
                >
                  <Clock3 className="size-3.5" />
                  <span>Closing Soonest</span>
                </button>
              </div>
            </div>

            {/* Tenders Cards Grid */}
            {filteredTenders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTenders.map((tender) => {
                  const isSaved = savedTenderIds.includes(tender.id)
                  return (
                    <div
                      key={tender.id}
                      className="group bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between text-left"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tender.category === 'Public'
                                    ? 'bg-[#EAF7EE] text-[#1B4332] border border-[#C8EAD1]'
                                    : tender.category === 'NGO'
                                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                                    : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
                                }`}
                              >
                                {tender.categoryLabel}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-[#1B4332]">
                                {tender.refNumber}
                              </span>
                            </div>
                            <h2
                              onClick={() => openTenderDetail(tender)}
                              className="text-base font-bold text-[#16201B] group-hover:text-[#1B4332] transition cursor-pointer line-clamp-2"
                            >
                              {tender.title}
                            </h2>
                          </div>

                          {/* Save Tender Button */}
                          <button
                            type="button"
                            onClick={() => toggleSaveTender(tender.id)}
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded transition shrink-0 ${
                              isSaved
                                ? 'bg-[#EAF7EE] text-[#1B4332] font-bold'
                                : 'text-[#6E695F] hover:text-[#16201B] hover:bg-[#F4F1EA]'
                            }`}
                            title={isSaved ? 'Saved to bookmarks' : 'Save tender'}
                          >
                            {isSaved ? (
                              <>
                                <BookmarkCheck className="size-3.5 fill-[#1B4332]" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="size-3.5" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-[#6E695F] line-clamp-2 leading-relaxed">
                          {tender.summary}
                        </p>

                        <div className="rounded-lg bg-[#FAF8F5] border border-[#EFECE6] p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[#6E695F]">Issuing Entity:</span>
                            <strong className="text-[#16201B] font-semibold truncate max-w-[220px]">
                              {tender.issuer}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#6E695F]">Required CPO / Bond:</span>
                            <strong className="text-[#1B4332] font-bold">{tender.cpoAmount}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#6E695F]">Closing Deadline:</span>
                            <span className="font-bold text-[#B84A2B]">{tender.closeLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Row */}
                      <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between gap-2">
                        <button
                          onClick={() => openTenderDetail(tender)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4332] hover:underline"
                        >
                          <span>View Scope & Bidding Guide</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setActiveNoticeModal({
                              refNumber: tender.refNumber,
                              gazette: tender.gazette,
                              title: tender.title,
                              issuer: tender.issuer,
                              cpoAmount: tender.cpoAmount,
                              closingDate: tender.closeLabel,
                              paragraphs: tender.fullNoticeText,
                              tenderBox: tender.submissionAddress,
                            })
                          }
                          className="text-xs text-[#6E695F] hover:text-[#16201B] flex items-center gap-1"
                        >
                          <Eye className="size-3.5" />
                          <span>Gazette Notice</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-12 text-center space-y-3">
                <Search className="size-8 text-[#918C81] mx-auto" />
                <h3 className="text-base font-bold text-[#16201B]">No procurement tenders found</h3>
                <p className="text-xs text-[#6E695F]">Try clearing search queries or switching sector tabs.</p>
                <button
                  onClick={() => {
                    setTenderSearchQuery('')
                    setTenderCategoryFilter('All')
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: PROCUREMENT TENDER DETAIL VIEW                         */}
        {/* ============================================================== */}
        {selectedTender && (
          <article className="space-y-6 animate-in fade-in duration-200">
            {/* Top Back Row & Save Action */}
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <button
                onClick={() => setSelectedTender(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B4332] hover:underline"
              >
                <ArrowLeft className="size-4" />
                <span>Back to Procurement Tenders</span>
              </button>

              <button
                onClick={() => toggleSaveTender(selectedTender.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  savedTenderIds.includes(selectedTender.id)
                    ? 'border-[#1B4332] bg-[#EAF7EE] text-[#1B4332]'
                    : 'border-[#E5DFD5] bg-white text-[#6E695F] hover:text-[#16201B]'
                }`}
              >
                {savedTenderIds.includes(selectedTender.id) ? (
                  <>
                    <BookmarkCheck className="size-3.5 fill-[#1B4332]" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="size-3.5" />
                    <span>Save Tender</span>
                  </>
                )}
              </button>
            </div>

            {/* Save Microcopy Banner */}
            {savedTenderIds.includes(selectedTender.id) && (
              <div className="rounded-lg bg-[#FBF9F4] border border-[#E8DFCF] p-2.5 text-[11px] text-[#6E695F] flex items-center gap-2">
                <BookmarkCheck className="size-3.5 text-[#1B4332] shrink-0" />
                <span>
                  <strong>Saved to your browser list.</strong> Note: Saving bookmarks the tender for deadline tracking; subscriber access to full bid dossiers remains separate.
                </span>
              </div>
            )}

            {/* Title & Issuer Header */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedTender.category === 'Public'
                      ? 'bg-[#EAF7EE] text-[#1B4332]'
                      : selectedTender.category === 'NGO'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                      : 'bg-[#FEF3C7] text-[#B45309]'
                  }`}
                >
                  {selectedTender.categoryLabel}
                </span>
                <span className="text-xs font-mono font-bold text-[#1B4332]">
                  {selectedTender.refNumber}
                </span>
                <span className="text-xs text-[#6E695F]">· {selectedTender.sector}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16201B] tracking-tight">
                {selectedTender.title}
              </h1>
              <p className="text-sm text-[#6E695F] max-w-3xl leading-relaxed">
                {selectedTender.summary}
              </p>
            </div>

            {/* 2-Column Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols): Scope, Eligibility, Official Demo Notice */}
              <div className="lg:col-span-7 space-y-6">
                {/* Scope of Work */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                  <h2 className="text-sm font-bold text-[#16201B] flex items-center gap-2 border-b border-[#F0ECE1] pb-2.5">
                    <FileCheck2 className="size-4 text-[#1B4332]" />
                    Scope of Work & Procurement Deliverables
                  </h2>
                  <ul className="list-disc list-inside text-xs text-[#6E695F] space-y-2 leading-relaxed">
                    {selectedTender.scopeOfWork.map((item, idx) => (
                      <li key={idx} className="pl-1">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility Requirements */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                  <h2 className="text-sm font-bold text-[#16201B] flex items-center gap-2 border-b border-[#F0ECE1] pb-2.5">
                    <ShieldCheck className="size-4 text-[#1B4332]" />
                    Mandatory Bidder Eligibility Documents
                  </h2>
                  <ul className="list-disc list-inside text-xs text-[#6E695F] space-y-2 leading-relaxed">
                    {selectedTender.eligibilityRequirements.map((req, idx) => (
                      <li key={idx} className="pl-1">
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Official Demo Gazette Notice Reference Box */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#FAF8F5] text-[#1B4332] border border-[#E5DFD5]">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#16201B]">Official Published Notice</h3>
                      <p className="text-xs text-[#6E695F]">
                        Published in {selectedTender.gazette} ({selectedTender.refNumber}).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setActiveNoticeModal({
                        refNumber: selectedTender.refNumber,
                        gazette: selectedTender.gazette,
                        title: selectedTender.title,
                        issuer: selectedTender.issuer,
                        cpoAmount: selectedTender.cpoAmount,
                        closingDate: selectedTender.closeLabel,
                        paragraphs: selectedTender.fullNoticeText,
                        tenderBox: selectedTender.submissionAddress,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1B4332] text-xs font-semibold text-white hover:bg-[#2D6A4F] transition shrink-0"
                  >
                    <Eye className="size-3.5" />
                    <span>Open Official Demo Notice</span>
                  </button>
                </div>
              </div>

              {/* Right Column (5 cols): Deadline, CPO, Bidding Instructions */}
              <div className="lg:col-span-5 space-y-5">
                {/* Deadline & CPO Box */}
                <div className="rounded-xl bg-[#1B4332] text-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-white/15 pb-3">
                    <span className="text-xs font-medium text-[#D8F3DC] flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-[#D8F3DC]" />
                      Closing Submission Deadline
                    </span>
                    <span className="rounded bg-[#2D6A4F] px-2 py-0.5 text-[11px] font-bold text-white border border-white/10">
                      Active
                    </span>
                  </div>

                  <div className="space-y-1">
                    <strong className="block text-2xl font-extrabold tracking-tight">
                      {selectedTender.closeLabel}
                    </strong>
                    <p className="text-xs text-[#D8F3DC]">
                      Sealed proposals must be deposited into the designated tender box before this minute in East Africa Time (EAT).
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#143527] p-3.5 space-y-2 border border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#D8F3DC]">CPO Bid Security:</span>
                      <strong className="text-white font-bold">{selectedTender.cpoAmount}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#D8F3DC]">Document Fee:</span>
                      <span className="text-white">{selectedTender.documentFee}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                      <span className="text-[#D8F3DC]">Issuing Entity:</span>
                      <span className="text-white truncate max-w-[180px]">{selectedTender.issuer}</span>
                    </div>
                  </div>
                </div>

                {/* Bidding Instructions with Guest vs Subscriber Access */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                    <div className="flex items-center gap-2">
                      {isSubscriberUnlocked ? (
                        <div className="p-1 rounded bg-[#EAF7EE] text-[#1B4332]">
                          <Unlock className="size-4" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-[#FEF3C7] text-[#B45309]">
                          <LockKeyhole className="size-4" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-bold text-[#16201B]">
                          {isSubscriberUnlocked
                            ? 'Bidding Dossier Unlocked'
                            : 'Subscriber Access Required'}
                        </h3>
                        <p className="text-[11px] text-[#6E695F]">
                          {isSubscriberUnlocked ? 'Full submission guide active' : 'Guest preview mode'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSubscriberUnlocked(!isSubscriberUnlocked)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#1B4332] transition"
                    >
                      {isSubscriberUnlocked ? 'Switch to Guest' : 'View as Demo Subscriber'}
                    </button>
                  </div>

                  {/* If Guest Mode */}
                  {!isSubscriberUnlocked ? (
                    <div className="space-y-4">
                      <p className="text-xs text-[#6E695F] leading-relaxed">
                        Public guest mode shows basic eligibility and published notice. Downloadable Bill of Quantities (BOQ), financial schedule templates, and direct procurement officer extensions are reserved for subscribers.
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#F0ECE1] bg-[#FAF8F5] text-[#6E695F]">
                          <span className="flex items-center gap-2">
                            <LockKeyhole className="size-3.5 text-[#B45309]" />
                            Uneditable Financial Bid BOQ Schedule (.xlsx)
                          </span>
                          <span className="text-[10px] font-semibold text-[#B45309]">GATED</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#F0ECE1] bg-[#FAF8F5] text-[#6E695F]">
                          <span className="flex items-center gap-2">
                            <LockKeyhole className="size-3.5 text-[#B45309]" />
                            Direct Officer Contact & Clarifications Desk
                          </span>
                          <span className="text-[10px] font-semibold text-[#B45309]">GATED</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSubscriberUnlocked(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shadow-xs"
                      >
                        <Unlock className="size-3.5" />
                        <span>View as Demo Subscriber</span>
                      </button>
                    </div>
                  ) : (
                    /* If Subscriber Mode */
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-[#1B4332]" />
                          Step-by-Step Bidding Instructions
                        </h4>
                        <ol className="list-decimal list-inside text-xs text-[#6E695F] space-y-2 bg-[#FAF8F5] p-3 rounded-lg border border-[#EFECE6]">
                          <li>
                            Obtain <strong>{selectedTender.cpoAmount}</strong> Certified Payment Order (CPO) payable to <em>{selectedTender.issuer}</em>.
                          </li>
                          <li>
                            Package in <strong>Double-Envelope</strong>: Envelope A (Technical, TIN, Trade License, CPO Bond) and Envelope B (Financial Bid Form).
                          </li>
                          <li>
                            Deliver to: <strong>{selectedTender.submissionAddress}</strong> before {selectedTender.closeLabel}.
                          </li>
                        </ol>
                      </div>

                      <div className="rounded-lg bg-[#EAF7EE] border border-[#C8EAD1] p-3 text-xs space-y-1 text-[#1B4332]">
                        <span className="font-bold flex items-center gap-1.5">
                          <PhoneCall className="size-3.5" />
                          Clarifications & Procurement Desk Contact
                        </span>
                        <p className="text-[11px] text-[#2D6A4F]">
                          Officer: {selectedTender.contactPerson}
                        </p>
                      </div>

                      <button
                        onClick={() => showToast('Simulated Tender Dossier (.PDF) & BOQ (.XLSX) downloaded successfully.')}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#1B4332] text-[#1B4332] text-xs font-bold hover:bg-[#EAF7EE] transition"
                      >
                        <Download className="size-3.5" />
                        <span>Download Full Bid Dossier & BOQ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: VEHICLES & MACHINERY GRID & DETAIL                     */}
        {/* ============================================================== */}
        {selectedVehicle ? (
          /* Single Vehicle Lot Detail View (with Keys, Starter, Mileage) */
          <article className="space-y-6 animate-in fade-in duration-200">
            {/* Back Row */}
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B4332] hover:underline"
              >
                <ArrowLeft className="size-4" />
                <span>Back to Vehicle Auctions</span>
              </button>

              <button
                onClick={() => toggleSaveVehicle(selectedVehicle.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  savedVehicleIds.includes(selectedVehicle.id)
                    ? 'border-[#1B4332] bg-[#EAF7EE] text-[#1B4332]'
                    : 'border-[#E5DFD5] bg-white text-[#6E695F] hover:text-[#16201B]'
                }`}
              >
                {savedVehicleIds.includes(selectedVehicle.id) ? (
                  <>
                    <BookmarkCheck className="size-3.5 fill-[#1B4332]" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="size-3.5" />
                    <span>Save Lot</span>
                  </>
                )}
              </button>
            </div>

            {/* Save Microcopy Banner */}
            {savedVehicleIds.includes(selectedVehicle.id) && (
              <div className="rounded-lg bg-[#FBF9F4] border border-[#E8DFCF] p-2.5 text-[11px] text-[#6E695F] flex items-center gap-2">
                <BookmarkCheck className="size-3.5 text-[#1B4332] shrink-0" />
                <span>
                  <strong>Saved to your browser list.</strong> Note: Saving bookmarks the lot for quick access and deadline tracking; subscriber access to full technical documents remains separate.
                </span>
              </div>
            )}

            {/* Title & Conditions Header */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#6E695F]">
                  {selectedVehicle.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedVehicle.condition === 'Used'
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-[#96422A] text-white'
                  }`}
                >
                  {selectedVehicle.conditionLabel}
                </span>
                <span className="text-xs text-[#6E695F] flex items-center gap-1">
                  <MapPin className="size-3.5 text-[#8C571C]" />
                  {selectedVehicle.regionLabel ?? selectedVehicle.region}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16201B] tracking-tight">
                {selectedVehicle.title}
              </h1>
              <p className="text-sm text-[#6E695F] max-w-3xl leading-relaxed">
                {selectedVehicle.summary}
              </p>
            </div>

            {/* 2-Column Lot Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols): Gallery + Specs (Keys, Starter, Mileage) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Photo Gallery Box */}
                <div className="space-y-3">
                  <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-[#E8E4DA] border border-[#E5DFD5] shadow-xs">
                    <Image
                      src={
                        !isSubscriberUnlocked
                          ? selectedVehicle.mainImage
                          : selectedVehicle.gallery[activeVehiclePhotoIndex]?.src || selectedVehicle.mainImage
                      }
                      alt={
                        !isSubscriberUnlocked
                          ? `Public cover photo of ${selectedVehicle.title}`
                          : selectedVehicle.gallery[activeVehiclePhotoIndex]?.caption || selectedVehicle.title
                      }
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover transition duration-300"
                      priority
                    />

                    {/* Mode Tag */}
                    {!isSubscriberUnlocked ? (
                      <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <LockKeyhole className="size-3 text-[#E0B263]" />
                        <span>Public Cover (Guest Mode)</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 left-2.5 bg-[#1B4332]/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-white" />
                        <span>Full Gallery Unlocked</span>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 right-2 bg-black/65 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-lg flex items-center justify-between">
                      <span className="truncate">
                        {!isSubscriberUnlocked
                          ? 'Public cover photo'
                          : selectedVehicle.gallery[activeVehiclePhotoIndex]?.caption}
                      </span>
                      <span className="shrink-0 text-[11px] text-white/80 font-mono">
                        {!isSubscriberUnlocked ? '1 of 1 shown' : `${activeVehiclePhotoIndex + 1} of ${selectedVehicle.gallery.length}`}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnails Row: Accessible & Selectable in Subscriber Mode */}
                  {isSubscriberUnlocked ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#6E695F]">
                        <span className="font-semibold text-[#1B4332] flex items-center gap-1">
                          <Eye className="size-3.5" />
                          Selectable Inspection Views (Click to inspect)
                        </span>
                        <span className="text-[11px]">{selectedVehicle.gallery.length} Photos Available</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2.5">
                        {selectedVehicle.gallery.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveVehiclePhotoIndex(idx)}
                            className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition focus:outline-hidden ${
                              activeVehiclePhotoIndex === idx
                                ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20'
                                : 'border-[#E5DFD5] opacity-75 hover:opacity-100'
                            }`}
                            aria-label={`Select photo ${idx + 1}: ${item.caption}`}
                          >
                            <Image src={item.src} alt={item.caption} fill sizes="150px" className="object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Guest Mode: Extra Photos Locked */
                    <div className="rounded-xl border border-[#E5DFD5] bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#8C571C] flex items-center gap-1.5">
                          <LockKeyhole className="size-3.5 text-[#8C571C]" />
                          Extra Inspection Photos Gated ({selectedVehicle.gallery.length - 1} Restricted)
                        </span>
                        <button
                          onClick={() => setIsSubscriberUnlocked(true)}
                          className="text-xs font-bold text-[#1B4332] hover:underline"
                        >
                          View as Demo Subscriber
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2.5 opacity-60">
                        <div className="relative aspect-[16/10] rounded-lg overflow-hidden border-2 border-[#1B4332]">
                          <Image src={selectedVehicle.mainImage} alt="Cover" fill sizes="120px" className="object-cover" />
                        </div>
                        {selectedVehicle.gallery.slice(1).map((_, index) => (
                          <div
                            key={index}
                            className="relative aspect-[16/10] rounded-lg bg-[#EEEAE0] border border-[#E5DFD5] flex flex-col items-center justify-center text-center p-1"
                          >
                            <LockKeyhole className="size-3.5 text-[#8C571C] mb-0.5" />
                            <span className="text-[10px] font-bold text-[#8C571C]">Photo {index + 2}</span>
                            <span className="text-[9px] text-[#6E695F]">Subscriber</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#6E695F]">
                        Guest mode shows public cover only. Toggle &quot;View as demo subscriber&quot; below to reveal engine, cabin, and chassis photography.
                      </p>
                    </div>
                  )}
                </div>

                {/* Technical Profile Table (with Keys, Starter, Mileage) */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                    <h2 className="text-sm font-bold text-[#16201B] flex items-center gap-2">
                      <Layers className="size-4 text-[#1B4332]" />
                      Vehicle Technical Profile & Physical State
                    </h2>
                    <span className="text-[11px] font-mono text-[#6E695F]">
                      LOT REF #{selectedVehicle.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                    {/* Keys */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6] sm:col-span-1">
                      <span className="text-[#6E695F] block text-[11px] flex items-center gap-1">
                        <Key className="size-3 text-[#1B4332]" />
                        Keys Available
                      </span>
                      <strong className="text-[#16201B] text-xs font-bold block mt-0.5">
                        {selectedVehicle.keys}
                      </strong>
                    </div>

                    {/* Starter */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6] sm:col-span-1">
                      <span className="text-[#6E695F] block text-[11px] flex items-center gap-1">
                        <Zap className="size-3 text-[#1B4332]" />
                        Starter Condition
                      </span>
                      <strong className="text-[#16201B] text-xs font-bold block mt-0.5">
                        {selectedVehicle.starter}
                      </strong>
                    </div>

                    {/* Mileage */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6] sm:col-span-1">
                      <span className="text-[#6E695F] block text-[11px] flex items-center gap-1">
                        <Gauge className="size-3 text-[#1B4332]" />
                        Odometer Mileage
                      </span>
                      <strong className="text-[#16201B] text-xs font-bold block mt-0.5">
                        {selectedVehicle.mileage}
                      </strong>
                    </div>

                    {/* Year */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                      <span className="text-[#6E695F] block text-[11px]">Model Year</span>
                      <strong className="text-[#16201B] text-xs font-bold block mt-0.5">
                        {selectedVehicle.year}
                      </strong>
                    </div>

                    {/* Fuel */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                      <span className="text-[#6E695F] block text-[11px]">Fuel Type</span>
                      <strong className="text-[#16201B] text-xs font-bold block mt-0.5">
                        {selectedVehicle.fuelType}
                      </strong>
                    </div>

                    {/* Transmission */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                      <span className="text-[#6E695F] block text-[11px]">Transmission</span>
                      <strong className="text-[#16201B] text-xs font-bold block mt-0.5">
                        {selectedVehicle.transmission}
                      </strong>
                    </div>

                    {/* Plate & Duty */}
                    <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6] sm:col-span-3">
                      <span className="text-[#6E695F] block text-[11px]">Plate & Duty Status</span>
                      <strong className="text-[#16201B] text-xs font-semibold block mt-0.5">
                        {selectedVehicle.plateStatus}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#F0ECE1] text-xs text-[#6E695F] flex items-start gap-2">
                    <Building2 className="size-4 text-[#1B4332] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#16201B] block">
                        Disposal Custodian: {selectedVehicle.issuer}
                      </span>
                      <span>Physical Yard: {selectedVehicle.yardLocation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Deadline + Gated Bidding Instructions */}
              <div className="lg:col-span-5 space-y-5">
                {/* Deadline & CPO Bond Card */}
                <div className="rounded-xl bg-[#1B4332] text-white p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-white/15 pb-3">
                    <span className="text-xs font-medium text-[#D8F3DC] flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-[#D8F3DC]" />
                      Tender Closing Deadline
                    </span>
                    <span className="rounded bg-[#2D6A4F] px-2 py-0.5 text-[11px] font-bold text-white border border-white/10">
                      Active Auction
                    </span>
                  </div>

                  <div className="space-y-1">
                    <strong className="block text-2xl font-extrabold tracking-tight">
                      {selectedVehicle.closeLabel}
                    </strong>
                    <p className="text-xs text-[#D8F3DC]">
                      Strict deadline. All submissions must be received before this hour in East Africa Time (EAT / UTC+3).
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#143527] p-3.5 space-y-2 border border-white/10 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#D8F3DC]">Required CPO Bid Bond:</span>
                      <strong className="text-white font-bold">{selectedVehicle.cpoBond}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#D8F3DC]">Estimated Reserve:</span>
                      <span className="text-white">{selectedVehicle.estimatedReserve}</span>
                    </div>
                  </div>
                </div>

                {/* Working Access Panel: View as Demo Subscriber Toggle */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                    <div className="flex items-center gap-2">
                      {isSubscriberUnlocked ? (
                        <div className="p-1 rounded bg-[#EAF7EE] text-[#1B4332]">
                          <Unlock className="size-4" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-[#FEF3C7] text-[#8C571C]">
                          <LockKeyhole className="size-4" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-bold text-[#16201B]">
                          {isSubscriberUnlocked ? 'Subscriber Dossier Unlocked' : 'Subscriber Access Gated'}
                        </h3>
                        <p className="text-[11px] text-[#6E695F]">
                          {isSubscriberUnlocked
                            ? 'Full inspection reports & bidding instructions active'
                            : 'Public guest mode active'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSubscriberUnlocked(!isSubscriberUnlocked)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md border border-[#E5DFD5] bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#1B4332] transition"
                    >
                      {isSubscriberUnlocked ? 'Switch to Guest' : 'View as Demo Subscriber'}
                    </button>
                  </div>

                  {!isSubscriberUnlocked ? (
                    <div className="space-y-4">
                      <p className="text-xs text-[#6E695F] leading-relaxed">
                        Public visitors can see basic specs. Mechanical diagnostic reports, yard gate passes, and CBE bank CPO instructions are gated.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsSubscriberUnlocked(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shadow-xs"
                      >
                        <Unlock className="size-3.5" />
                        <span>View as Demo Subscriber</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Diagnostic sheet */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="size-3.5 text-[#1B4332]" />
                          Mechanical Inspection Report
                        </h4>
                        <div className="rounded-lg bg-[#FAF8F5] border border-[#E5DFD5] p-3 text-xs space-y-2">
                          <div>
                            <span className="font-semibold text-[#16201B] block">Engine Diagnostic:</span>
                            <span className="text-[#6E695F]">{selectedVehicle.inspectionReport.engine}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#16201B] block">Gearbox & Drivetrain:</span>
                            <span className="text-[#6E695F]">{selectedVehicle.inspectionReport.gearbox}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#16201B] block">Chassis & Body:</span>
                            <span className="text-[#6E695F]">{selectedVehicle.inspectionReport.bodyFrame}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#16201B] block">Interior & Equipment:</span>
                            <span className="text-[#6E695F]">{selectedVehicle.inspectionReport.interior}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-[#16201B] block">Tyre Wear:</span>
                            <span className="text-[#6E695F]">{selectedVehicle.inspectionReport.tyres}</span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Logistics Gatekeeper Contact */}
                      <div className="rounded-lg bg-[#EAF7EE] border border-[#C8EAD1] p-3 text-xs space-y-1 text-[#1B4332]">
                        <div className="font-bold flex items-center gap-1.5">
                          <PhoneCall className="size-3.5 text-[#1B4332]" />
                          Inspection Gate Pass Officer
                        </div>
                        <p className="text-[11px] text-[#2D6A4F]">
                          Contact: <strong>{selectedVehicle.contactPerson}</strong>
                        </p>
                        <p className="text-[11px] text-[#2D6A4F]">
                          Visiting Hours: {selectedVehicle.visitingHours}
                        </p>
                      </div>

                      {/* Bidding Instructions */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-[#16201B] uppercase tracking-wider flex items-center gap-1.5">
                          <FileCheck2 className="size-3.5 text-[#1B4332]" />
                          Bidding Submission Instructions
                        </h4>
                        <ol className="list-decimal list-inside text-xs text-[#6E695F] space-y-1.5 bg-[#FAF8F5] p-3 rounded-lg border border-[#EFECE6]">
                          <li>
                            Obtain <strong>{selectedVehicle.cpoBond}</strong> CPO from Commercial Bank of Ethiopia (CBE) payable to <em>{selectedVehicle.issuer}</em>.
                          </li>
                          <li>
                            Place original CPO into sealed envelope marked <em>&quot;Bid Bond - {selectedVehicle.id}&quot;</em>.
                          </li>
                          <li>
                            Submit price schedule in second envelope marked <em>&quot;Financial Offer&quot;</em>.
                          </li>
                          <li>
                            Deliver both to Tender Box at {selectedVehicle.yardLocation} before <strong>{selectedVehicle.closeLabel}</strong>.
                          </li>
                        </ol>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsSubscriberUnlocked(false)}
                        className="w-full text-center py-2 text-xs text-[#6E695F] hover:text-[#16201B] underline"
                      >
                        Switch Back to Guest Mode
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : !selectedTender && activeTab === 'vehicles' ? (
          /* Vehicle Grid & Left Filter Rail */
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header */}
            <section className="space-y-1.5 border-b border-[#E5DFD5] pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#6E695F]">
                  GOVERNMENT & ENTERPRISE FLEET AUCTIONS · ETHIOPIA
                </span>
                <span className="size-1 rounded-full bg-[#1B4332]" />
                <span className="text-[11px] font-medium text-[#6E695F]">
                  DUTY PAID & TRANSFERABLE
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#16201B]">
                Vehicles & Heavy Machinery
              </h1>
              <p className="text-sm text-[#6E695F] max-w-2xl">
                Browse institutional sedans, 4x4 pickups, and commercial fleet auctions across federal and regional depots.
              </p>
            </section>

            {/* Main Layout: Left Filter Rail + Results Grid */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Desktop Left Rail */}
              <aside
                aria-label="Vehicle Filters"
                className="hidden lg:block w-64 shrink-0 bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-6 sticky top-20"
              >
                <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#16201B]">
                    <SlidersHorizontal className="size-4 text-[#1B4332]" />
                    <span>Filter Lots</span>
                  </div>
                  {(vehicleConditionFilter !== 'All conditions' || vehicleRegionFilter !== 'All regions') && (
                    <button
                      onClick={() => {
                        setVehicleConditionFilter('All conditions')
                        setVehicleRegionFilter('All regions')
                        setVehicleSearchQuery('')
                        setVehicleClosingSoon(false)
                      }}
                      className="text-[11px] font-semibold text-[#1B4332] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Condition Filter */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#16201B]">Condition</label>
                  <div className="space-y-1.5">
                    {['All conditions', 'Used', 'Damaged'].map((cond) => {
                      const isSelected = vehicleConditionFilter === cond
                      return (
                        <button
                          key={cond}
                          onClick={() => setVehicleConditionFilter(cond)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left ${
                            isSelected
                              ? 'bg-[#1B4332] text-white font-semibold'
                              : 'bg-[#FAF8F5] text-[#6E695F] hover:bg-[#EFECE6]'
                          }`}
                        >
                          <span>{cond === 'All conditions' ? 'All Conditions' : cond === 'Used' ? 'Used Fleet' : 'Damaged / Salvage'}</span>
                          {isSelected && <CheckCircle2 className="size-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Region Filter */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#16201B]">Regional Yard</label>
                  <select
                    value={vehicleRegionFilter}
                    onChange={(e) => setVehicleRegionFilter(e.target.value)}
                    className="w-full rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] py-2 px-3 text-xs text-[#16201B] focus:outline-hidden"
                  >
                    {['All regions', 'Addis Ababa', 'Oromia', 'Tigray'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EAT Notice */}
                <div className="rounded-lg bg-[#FBF9F4] border border-[#E8DFCF] p-3 text-[11px] text-[#6E695F] space-y-1">
                  <div className="font-bold text-[#8C571C] flex items-center gap-1.5">
                    <Clock3 className="size-3.5 text-[#8C571C]" />
                    <span>East Africa Time (EAT)</span>
                  </div>
                  <p>All lot submission deadlines are calculated in East Africa Time (EAT / UTC+3).</p>
                </div>
              </aside>

              {/* Right Results Grid */}
              <section className="flex-1 w-full space-y-4">
                {/* Search & Sort Bar */}
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#16201B]">
                      {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Lot' : 'Lots'} Available
                    </span>
                    <span className="text-[11px] text-[#6E695F] hidden md:inline">
                      · Updated 2026 EAT
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="size-3.5 text-[#6E695F] absolute left-2.5 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search make, model, lot ID..."
                        value={vehicleSearchQuery}
                        onChange={(e) => setVehicleSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-xs text-[#16201B] focus:outline-hidden focus:border-[#1B4332]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setVehicleClosingSoon(!vehicleClosingSoon)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shrink-0 ${
                        vehicleClosingSoon
                          ? 'border-[#1B4332] bg-[#EAF7EE] text-[#1B4332]'
                          : 'border-[#E5DFD5] bg-[#FAF8F5] text-[#6E695F] hover:text-[#16201B]'
                      }`}
                    >
                      <Clock3 className="size-3.5" />
                      <span>Closing soonest</span>
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredVehicles.map((lot) => {
                    const isSaved = savedVehicleIds.includes(lot.id)
                    return (
                      <div
                        key={lot.id}
                        className="group bg-white border border-[#E5DFD5] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col text-left"
                      >
                        <div
                          onClick={() => openVehicleDetail(lot)}
                          className="relative w-full aspect-[16/10] bg-[#E8E4DA] overflow-hidden cursor-pointer"
                        >
                          <Image
                            src={lot.mainImage}
                            alt={lot.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover group-hover:scale-102 transition duration-300"
                            priority
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold shadow-xs ${
                                lot.condition === 'Used' ? 'bg-[#1B4332] text-white' : 'bg-[#96422A] text-white'
                              }`}
                            >
                              {lot.conditionLabel}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded font-semibold">
                              {lot.id}
                            </span>
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                            <Grid2X2 className="size-3" />
                            <span>{lot.gallery.length} Photos</span>
                          </div>
                        </div>

                        {/* Card Content with Keys, Starter, Mileage */}
                        <div className="p-5 flex flex-col flex-1 gap-3">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-semibold text-[#6E695F]">
                                LOT #{lot.id}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSaveVehicle(lot.id)}
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                                  isSaved
                                    ? 'bg-[#EAF7EE] text-[#1B4332] font-bold'
                                    : 'text-[#6E695F] hover:text-[#16201B] hover:bg-[#EFECE6]'
                                }`}
                              >
                                {isSaved ? (
                                  <>
                                    <BookmarkCheck className="size-3.5 fill-[#1B4332]" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="size-3.5" />
                                    <span>Save</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <h2
                              onClick={() => openVehicleDetail(lot)}
                              className="text-base font-bold text-[#16201B] group-hover:text-[#1B4332] transition line-clamp-1 cursor-pointer"
                            >
                              {lot.title}
                            </h2>
                          </div>

                          {/* Quick Spec Pills: Keys, Starter, Mileage */}
                          <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-[#FAF8F5] p-2 rounded-lg border border-[#EFECE6]">
                            <div className="truncate" title={lot.keys}>
                              <span className="text-[#6E695F] block">Keys</span>
                              <strong className="text-[#16201B] truncate block">{lot.keys}</strong>
                            </div>
                            <div className="truncate" title={lot.starter}>
                              <span className="text-[#6E695F] block">Starter</span>
                              <strong className="text-[#16201B] truncate block">{lot.starter}</strong>
                            </div>
                            <div className="truncate" title={lot.mileage}>
                              <span className="text-[#6E695F] block">Mileage</span>
                              <strong className="text-[#16201B] truncate block">{lot.mileage}</strong>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-[#6E695F]">
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="size-3.5 text-[#8C571C] shrink-0" />
                              <span className="truncate">{lot.yardLocation}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Building2 className="size-3.5 text-[#1B4332] shrink-0" />
                              <span className="truncate">{lot.issuer}</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-3 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-[#16201B]">
                              <Clock3 className="size-3.5 text-[#B84A2B] shrink-0" />
                              <span className="font-semibold">{lot.closeLabel}</span>
                            </div>
                            <span className="text-[#1B4332] font-bold">
                              CPO: {lot.cpoBond}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* VIEW 5: REAL SAVED LOTS & TENDERS VIEW (Local Persistence)      */}
        {/* ============================================================== */}
        {!selectedVehicle && !selectedTender && activeTab === 'saved' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header */}
            <section className="space-y-1.5 border-b border-[#E5DFD5] pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#6E695F]">
                  MY TRACKED OPPORTUNITIES · LOCAL BOOKMARKS
                </span>
                <span className="size-1 rounded-full bg-[#1B4332]" />
                <span className="text-[11px] font-medium text-[#6E695F]">
                  PERSISTENT IN BROWSER
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-[#16201B]">
                    Saved Tenders & Lots
                  </h1>
                  <p className="text-sm text-[#6E695F] mt-1">
                    Bookmarked procurement tenders and vehicle auction lots stored locally on your device.
                  </p>
                </div>

                {/* Subtabs for Saved: All, Vehicles, Tenders */}
                <div className="inline-flex rounded-xl bg-[#EFECE6] p-1 border border-[#E5DFD5]">
                  <button
                    onClick={() => setSavedViewFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      savedViewFilter === 'all' ? 'bg-[#1B4332] text-white shadow-xs' : 'text-[#6E695F]'
                    }`}
                  >
                    All ({totalSavedCount})
                  </button>
                  <button
                    onClick={() => setSavedViewFilter('vehicles')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      savedViewFilter === 'vehicles' ? 'bg-[#1B4332] text-white shadow-xs' : 'text-[#6E695F]'
                    }`}
                  >
                    Vehicles ({savedVehicles.length})
                  </button>
                  <button
                    onClick={() => setSavedViewFilter('tenders')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      savedViewFilter === 'tenders' ? 'bg-[#1B4332] text-white shadow-xs' : 'text-[#6E695F]'
                    }`}
                  >
                    Tenders ({savedTenders.length})
                  </button>
                </div>
              </div>
            </section>

            {/* Note banner explaining bookmark vs subscriber access */}
            <div className="rounded-xl bg-[#FBF9F4] border border-[#E8DFCF] p-3 text-xs text-[#6E695F] flex items-start gap-2.5">
              <Info className="size-4 text-[#8C571C] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#16201B] block font-semibold">
                  Saved items are stored locally in your browser session.
                </strong>
                <span>
                  Saving bookmarks tenders and vehicles for deadline monitoring. Subscriber access to engineering inspection reports, full dossiers, and CPO bank instructions remains separate.
                </span>
              </div>
            </div>

            {/* Content Display */}
            {totalSavedCount === 0 ? (
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
                <div className="size-14 rounded-full bg-[#EAF7EE] text-[#1B4332] flex items-center justify-center mx-auto">
                  <Bookmark className="size-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#16201B]">No saved items yet</h3>
                  <p className="text-xs text-[#6E695F]">
                    Click &quot;Save Lot&quot; or &quot;Save Tender&quot; to bookmark opportunities for quick reference and deadline alerts.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => navigateTo('tenders')}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition"
                  >
                    Browse Tenders
                  </button>
                  <button
                    onClick={() => navigateTo('vehicles')}
                    className="px-4 py-2 rounded-lg border border-[#E5DFD5] text-xs font-bold text-[#16201B] hover:bg-[#FAF8F5]"
                  >
                    Browse Vehicles
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Saved Vehicles Section */}
                {(savedViewFilter === 'all' || savedViewFilter === 'vehicles') && savedVehicles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#16201B] uppercase tracking-wider flex items-center gap-2">
                      <Truck className="size-4 text-[#1B4332]" />
                      Saved Vehicle Lots ({savedVehicles.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {savedVehicles.map((lot) => (
                        <div
                          key={lot.id}
                          className="bg-white border border-[#E5DFD5] rounded-xl overflow-hidden shadow-xs p-4 flex flex-col justify-between text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-[#1B4332]">
                                {lot.id}
                              </span>
                              <button
                                onClick={() => toggleSaveVehicle(lot.id)}
                                className="text-xs text-[#96422A] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <h4
                              onClick={() => openVehicleDetail(lot)}
                              className="text-sm font-bold text-[#16201B] hover:text-[#1B4332] cursor-pointer line-clamp-1"
                            >
                              {lot.title}
                            </h4>
                            <p className="text-xs text-[#6E695F] line-clamp-1">{lot.yardLocation}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                            <span className="text-[#B84A2B] font-semibold">{lot.closeLabel}</span>
                            <button
                              onClick={() => openVehicleDetail(lot)}
                              className="text-[#1B4332] font-bold hover:underline"
                            >
                              Open Lot →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Saved Tenders Section */}
                {(savedViewFilter === 'all' || savedViewFilter === 'tenders') && savedTenders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[#16201B] uppercase tracking-wider flex items-center gap-2">
                      <FileCheck2 className="size-4 text-[#1B4332]" />
                      Saved Procurement Tenders ({savedTenders.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {savedTenders.map((tender) => (
                        <div
                          key={tender.id}
                          className="bg-white border border-[#E5DFD5] rounded-xl overflow-hidden shadow-xs p-4 flex flex-col justify-between text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-[#1B4332]">
                                {tender.refNumber}
                              </span>
                              <button
                                onClick={() => toggleSaveTender(tender.id)}
                                className="text-xs text-[#96422A] hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <h4
                              onClick={() => openTenderDetail(tender)}
                              className="text-sm font-bold text-[#16201B] hover:text-[#1B4332] cursor-pointer line-clamp-1"
                            >
                              {tender.title}
                            </h4>
                            <p className="text-xs text-[#6E695F] line-clamp-1">{tender.issuer}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-xs">
                            <span className="text-[#B84A2B] font-semibold">{tender.closeLabel}</span>
                            <button
                              onClick={() => openTenderDetail(tender)}
                              className="text-[#1B4332] font-bold hover:underline"
                            >
                              Open Tender →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 6: TENDER ALERTS NOTIFICATION CENTER                      */}
        {/* ============================================================== */}
        {!selectedVehicle && !selectedTender && activeTab === 'alerts' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <section className="space-y-1.5 border-b border-[#E5DFD5] pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#6E695F]">
                  INSTANT PROCUREMENT NOTIFICATIONS
                </span>
                <span className="size-1 rounded-full bg-[#1B4332]" />
                <span className="text-[11px] font-medium text-[#6E695F]">
                  REAL-TIME ALERTS
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#16201B]">
                  Tender Alerts & Notifications
                </h1>
                <button
                  onClick={() => {
                    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
                    showToast('All notifications marked as read.')
                  }}
                  className="text-xs font-semibold text-[#1B4332] hover:underline self-start sm:self-auto"
                >
                  Mark all as read
                </button>
              </div>
            </section>

            {/* Notification Items List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left (2 cols): Active Alerts Stream */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-xs font-bold text-[#6E695F] uppercase tracking-wider">
                  Recent Opportunity Alerts ({alerts.length})
                </h2>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-4.5 transition flex items-start justify-between gap-3 ${
                      !alert.read
                        ? 'bg-white border-[#1B4332] shadow-xs'
                        : 'bg-[#FAF8F5] border-[#E5DFD5] opacity-80'
                    }`}
                  >
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            !alert.read ? 'bg-[#1B4332]' : 'bg-[#C8C2B3]'
                          }`}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332]">
                          {alert.category}
                        </span>
                        <span className="text-[11px] text-[#6E695F]">· {alert.timestamp}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#16201B]">{alert.title}</h3>
                      <p className="text-xs text-[#6E695F] leading-relaxed">{alert.message}</p>
                    </div>

                    {alert.targetType && alert.targetId && (
                      <button
                        onClick={() => {
                          if (alert.targetType === 'tender') {
                            const found = PROCUREMENT_TENDERS.find((t) => t.id === alert.targetId)
                            if (found) openTenderDetail(found)
                          } else {
                            const found = VEHICLE_LOTS.find((v) => v.id === alert.targetId)
                            if (found) openVehicleDetail(found)
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#EAF7EE] text-[#1B4332] text-xs font-bold hover:bg-[#D8F3DC] transition shrink-0"
                      >
                        Inspect →
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Right (1 col): Alert Preferences Configuration Box */}
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-4">
                <h2 className="text-xs font-bold text-[#16201B] uppercase tracking-wider flex items-center gap-2 border-b border-[#F0ECE1] pb-2">
                  <SlidersHorizontal className="size-4 text-[#1B4332]" />
                  Alert Notification Channels
                </h2>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center gap-2 text-[#16201B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertPrefChannels.email}
                      onChange={(e) =>
                        setAlertPrefChannels({ ...alertPrefChannels, email: e.target.checked })
                      }
                      className="rounded text-[#1B4332] focus:ring-[#1B4332]"
                    />
                    <span>Daily Email Digest (EAT Morning)</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#16201B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertPrefChannels.sms}
                      onChange={(e) =>
                        setAlertPrefChannels({ ...alertPrefChannels, sms: e.target.checked })
                      }
                      className="rounded text-[#1B4332] focus:ring-[#1B4332]"
                    />
                    <span>Urgent SMS Alerts (+251 Ethio Telecom)</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#16201B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertPrefChannels.telegram}
                      onChange={(e) =>
                        setAlertPrefChannels({ ...alertPrefChannels, telegram: e.target.checked })
                      }
                      className="rounded text-[#1B4332] focus:ring-[#1B4332]"
                    />
                    <span>Instant Telegram Bot Push (@BidEthiopiaBot)</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-[#F0ECE1] space-y-2">
                  <span className="text-[11px] font-bold text-[#16201B] block">Sector Subscriptions</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPrefCategories.public}
                        onChange={(e) =>
                          setAlertPrefCategories({ ...alertPrefCategories, public: e.target.checked })
                        }
                      />
                      <span>Public Tenders</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPrefCategories.ngo}
                        onChange={(e) =>
                          setAlertPrefCategories({ ...alertPrefCategories, ngo: e.target.checked })
                        }
                      />
                      <span>NGO / UN</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPrefCategories.private}
                        onChange={(e) =>
                          setAlertPrefCategories({ ...alertPrefCategories, private: e.target.checked })
                        }
                      />
                      <span>Private Bids</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPrefCategories.vehicles}
                        onChange={(e) =>
                          setAlertPrefCategories({ ...alertPrefCategories, vehicles: e.target.checked })
                        }
                      />
                      <span>Vehicles & Lots</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => showToast('Alert settings and channel preferences saved.')}
                  className="w-full py-2 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shadow-xs"
                >
                  Save Alert Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 7: TENDER GUIDELINES & CPO REGULATIONS                    */}
        {/* ============================================================== */}
        {!selectedVehicle && !selectedTender && activeTab === 'guidelines' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <section className="space-y-1.5 border-b border-[#E5DFD5] pb-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#6E695F]">
                  OFFICIAL PROCEDURAL GUIDE · ETHIOPIAN DISPOSAL REGULATIONS
                </span>
                <span className="size-1 rounded-full bg-[#1B4332]" />
                <span className="text-[11px] font-medium text-[#6E695F]">
                  UPDATED 2026 EAT
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#16201B]">
                Tender Guidelines & Bidding Procedures
              </h1>
              <p className="text-sm text-[#6E695F] max-w-2xl">
                Comprehensive statutory requirements, banking CPO protocols, and vehicle inspection gate rules for participating in Ethiopian public vehicle tenders.
              </p>
            </section>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-[#E5DFD5] p-4 shadow-xs">
                <span className="text-[11px] text-[#6E695F] font-semibold block uppercase tracking-wide">
                  1. Payment Security
                </span>
                <strong className="text-base text-[#1B4332] font-bold block mt-0.5">
                  Standard CPO Deposit Required
                </strong>
                <p className="text-[11px] text-[#6E695F] mt-1">
                  Cash or private cheques strictly prohibited by Federal Public Procurement Directive.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#E5DFD5] p-4 shadow-xs">
                <span className="text-[11px] text-[#6E695F] font-semibold block uppercase tracking-wide">
                  2. Submission Rule
                </span>
                <strong className="text-base text-[#1B4332] font-bold block mt-0.5">
                  Double-Envelope System
                </strong>
                <p className="text-[11px] text-[#6E695F] mt-1">
                  Technical eligibility CPO envelope and financial offer sealed separately.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#E5DFD5] p-4 shadow-xs">
                <span className="text-[11px] text-[#6E695F] font-semibold block uppercase tracking-wide">
                  3. Deadline Standard
                </span>
                <strong className="text-base text-[#1B4332] font-bold block mt-0.5">
                  East Africa Time (EAT)
                </strong>
                <p className="text-[11px] text-[#6E695F] mt-1">
                  Tender boxes sealed promptly at stated minute. Late bids rejected immediately.
                </p>
              </div>
            </div>

            {/* Procedural Guide Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
                  <div className="p-1.5 rounded-lg bg-[#EAF7EE] text-[#1B4332]">
                    <ShieldCheck className="size-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#16201B]">
                    1. Bidder Eligibility & Legal Documentation
                  </h2>
                </div>
                <ul className="list-disc list-inside text-xs text-[#6E695F] space-y-1.5 pl-1">
                  <li>Renewed Trade License for current Ethiopian fiscal year.</li>
                  <li>Taxpayer Identification Number (TIN) Certificate from ERCA.</li>
                  <li>VAT Registration Certificate (if aggregate bid exceeds threshold).</li>
                  <li>Notarized Power of Attorney if representative submits bid.</li>
                  <li>Valid Ethiopian National ID (Fayda / Kebele) or Passport.</li>
                </ul>
              </div>

              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
                  <div className="p-1.5 rounded-lg bg-[#EAF7EE] text-[#1B4332]">
                    <Building2 className="size-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#16201B]">
                    2. Certified Payment Order (CPO) Rules
                  </h2>
                </div>
                <ul className="list-disc list-inside text-xs text-[#6E695F] space-y-1.5 pl-1">
                  <li>Must be issued by Commercial Bank of Ethiopia (CBE) or authorized commercial banks.</li>
                  <li>Payable explicitly to the exact legal name of the disposing authority.</li>
                  <li>Must remain valid for at least 90 calendar days beyond the bid closure date.</li>
                  <li>CPOs for unsuccessful bidders are returned within 14 working days.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 8: USER PROFILE & SETTINGS (Stitch Android Scope)          */}
        {/* ============================================================== */}
        {!selectedVehicle && !selectedTender && activeTab === 'profile' && currentUser && (
          <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-150">
            <section className="space-y-1 border-b border-[#E5DFD5] pb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E695F]">
                ACCOUNT MANAGEMENT
              </span>
              <h1 className="text-3xl font-extrabold text-[#16201B]">User Profile & Subscription</h1>
            </section>

            <div className="bg-white border border-[#E5DFD5] rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-4 border-b border-[#F0ECE1] pb-5">
                <div className="size-16 rounded-full bg-[#1B4332] text-white text-2xl font-black flex items-center justify-center">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-[#16201B]">{currentUser.name}</h2>
                  <p className="text-xs text-[#6E695F]">{currentUser.email}</p>
                  <span className="inline-block mt-1 rounded bg-[#D8F3DC] px-2 py-0.5 text-[11px] font-bold text-[#1B4332]">
                    Active Enterprise Subscriber
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="text-[#6E695F] block text-[11px]">Organization / Company</span>
                  <strong className="text-[#16201B] font-semibold">{currentUser.organization}</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="text-[#6E695F] block text-[11px]">TIN Number (ERCA)</span>
                  <strong className="text-[#16201B] font-semibold">{currentUser.tin}</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="text-[#6E695F] block text-[11px]">Registered Mobile</span>
                  <strong className="text-[#16201B] font-semibold">{currentUser.phone}</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="text-[#6E695F] block text-[11px]">Subscription Expiry</span>
                  <strong className="text-[#1B4332] font-semibold">31 Dec 2026 (Renewed)</strong>
                </div>
              </div>

              {/* Subscriber Toggle Helper for Testing */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#16201B]">Simulation Access Switch</h4>
                  <p className="text-[11px] text-[#6E695F]">
                    Toggle between Subscriber and Guest mode to test gating behaviors.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsSubscriberUnlocked(!isSubscriberUnlocked)
                    showToast(
                      !isSubscriberUnlocked
                        ? 'Switched to Subscriber view.'
                        : 'Switched to Public Guest view.'
                    )
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#1B4332] text-xs font-bold text-[#1B4332] hover:bg-[#EAF7EE]"
                >
                  {isSubscriberUnlocked ? 'Test as Guest' : 'Test as Subscriber'}
                </button>
              </div>

              <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                <button
                  onClick={() => navigateTo('saved')}
                  className="text-xs font-bold text-[#1B4332] hover:underline"
                >
                  View My Saved Opportunities ({totalSavedCount})
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 text-xs text-[#96422A] hover:underline font-semibold"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 1: DEMO EMAIL-CODE LOGIN (Matches Stitch Android Scope)   */}
        {/* ============================================================== */}
        {isLoginModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Demo Email-Code Sign In"
          >
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E5DFD5] p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#16201B]">
                      {loginStep === 'email' ? 'Demo Email Sign In' : 'Enter 6-Digit Code'}
                    </h3>
                    <p className="text-[11px] text-[#6E695F]">
                      Simulated passwordless authentication
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="p-1 rounded-md text-[#6E695F] hover:text-black hover:bg-[#FAF8F5]"
                >
                  <X className="size-5" />
                </button>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-lg bg-[#FDF2F2] border border-[#F8B4B4] text-xs text-[#9B1C1C]">
                  {loginError}
                </div>
              )}

              {loginStep === 'email' ? (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#16201B]">
                      Enter your email address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. abebe.k@ethiopia-trade.et"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-xs text-[#16201B] focus:outline-hidden focus:border-[#1B4332]"
                      required
                      autoFocus
                    />
                  </div>

                  {/* One-click demo helper */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('abebe.k@ethiopia-trade.et')
                    }}
                    className="w-full text-left p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EFECE6] text-xs text-[#1B4332] hover:bg-[#EAF7EE] transition flex items-center justify-between"
                  >
                    <span>Click to autofill Ethiopian Enterprise demo email</span>
                    <Sparkles className="size-3.5 text-[#E0B263]" />
                  </button>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Send 6-Digit Code</span>
                    <Send className="size-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <p className="text-xs text-[#6E695F]">
                    We sent a simulated 6-digit confirmation code to{' '}
                    <strong className="text-[#16201B]">{loginEmail}</strong>.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#16201B]">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      placeholder="849201"
                      value={loginCode}
                      onChange={(e) => setLoginCode(e.target.value)}
                      className="w-full px-3 py-2.5 text-center font-mono tracking-widest text-lg font-bold rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-[#16201B] focus:outline-hidden focus:border-[#1B4332]"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  {/* Quick autofill code */}
                  <button
                    type="button"
                    onClick={() => setLoginCode('849201')}
                    className="w-full text-center text-xs text-[#1B4332] font-semibold hover:underline"
                  >
                    Click to autofill demo code: 849201
                  </button>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition shadow-xs"
                  >
                    Verify & Sign In as Subscriber
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: OFFICIAL GAZETTE NOTICE READER MODAL                  */}
        {/* ============================================================== */}
        {activeNoticeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Official Gazette Notice Document"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5DFD5] p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between border-b border-[#E5DFD5] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#1B4332] tracking-wide">
                      {activeNoticeModal.refNumber}
                    </span>
                    <span className="text-[11px] text-[#6E695F]">
                      Gazette: {activeNoticeModal.gazette}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#16201B]">
                    {activeNoticeModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="p-1 rounded-md text-[#6E695F] hover:text-black hover:bg-[#FAF8F5]"
                  aria-label="Close modal"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Gazette Document Text */}
              <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] p-5 space-y-4 text-xs text-[#16201B] font-serif leading-relaxed">
                <div className="text-center border-b border-[#E5DFD5] pb-3 space-y-0.5 font-sans">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-[#6E695F] block">
                    Federal Democratic Republic of Ethiopia
                  </span>
                  <strong className="text-sm font-extrabold text-[#1B4332] block">
                    {activeNoticeModal.issuer}
                  </strong>
                  <span className="text-[11px] text-[#6E695F]">
                    Public Procurement & Asset Disposal Notice
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeNoticeModal.paragraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E5DFD5] font-sans text-xs space-y-1 bg-white p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-[#6E695F]">Required CPO Bid Security:</span>
                    <strong className="text-[#1B4332] font-bold">{activeNoticeModal.cpoAmount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E695F]">Closing Date & Hour:</span>
                    <strong className="text-[#B84A2B] font-bold">{activeNoticeModal.closingDate}</strong>
                  </div>
                  {activeNoticeModal.tenderBox && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#6E695F]">Submission Box:</span>
                      <span className="text-[#16201B]">{activeNoticeModal.tenderBox}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    showToast('Official Gazette Document sent to browser print preview.')
                    setActiveNoticeModal(null)
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#1B4332] hover:bg-[#EAF7EE] transition"
                >
                  <Printer className="size-3.5" />
                  <span>Print Official Gazette Notice</span>
                </button>
                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E5DFD5] bg-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-5 text-xs text-[#6E695F]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#16201B]">Fanos Tender</span>
            <span>·</span>
            <span>Stitch Android Desktop Port · All Data Fictional</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>All Deadlines in East Africa Time (EAT, UTC+3)</span>
            <span>·</span>
            <span>Local Browser Storage Active</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
