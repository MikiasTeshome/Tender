'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Brand from './brand.jsx'
import AuthPanel from './AuthPanel.jsx'
import './auth-panel.css'
import { signOutAuth, watchAuth } from './firebase-client.js'
import {
  alertsFromListings,
  createApi,
  fetchAllListings,
  listingsToPortal,
  mapTender,
  mapVehicle,
} from './portal-api.js'
import { HomePricing } from './HomePricing.jsx'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Filter,
  Globe,
  Grid2X2,
  Info,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  User,
  UserCheck,
  X,
} from 'lucide-react'

// TYPES — public tease + subscriber fields (paid listings hide deadline/address until unlocked)
type VehicleLot = {
  id: string
  title: string
  condition: 'Used' | 'Damaged'
  conditionLabel: string
  regionLabel?: string
  region: string
  yardLocation: string
  issuer: string
  closeIso: string
  closeLabel: string
  year: number
  mileage: string
  make: string
  model: string
  summary: string
  instructions: string
  inspection: string
  sourceUrl: string
  noticeRef: string
  lot: string
  mainImage: string
  gallery: { src: string; caption: string }[]
  locked: boolean
  access: string
}

type ProcurementTender = {
  id: string
  title: string
  category: 'Public' | 'NGO' | 'Private'
  categoryLabel: string
  sector: string
  issuer: string
  refNumber: string
  lot: string
  closeIso: string
  closeLabel: string
  region: string
  summary: string
  sourceUrl: string
  locked: boolean
  access: string
}

type UserProfile = {
  name: string
  email: string
  organization: string
  tin: string
  phone: string
  isSubscriber: boolean
  isAdmin: boolean
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

const heroTitles = [
  { text: 'Find your next bid', lang: 'en' },
  { text: 'ቀጣዩን ጨረታዎን ያግኙ', lang: 'am' },
]

function HeroTitle() {
  const [title, setTitle] = useState({ index: 0, length: heroTitles[0].text.length, deleting: false, hasSwitched: false })
  const current = heroTitles[title.index]

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return

    const atEnd = title.length === current.text.length
    const atStart = title.length === 0
    const hold = current.lang === 'en' && title.hasSwitched ? 10_000 : 2600
    const delay = title.deleting ? (atStart ? 220 : 42) : (atEnd ? hold : 85)

    const timer = window.setTimeout(() => {
      if (motion.matches) return
      if (title.deleting && atStart) {
        setTitle({ index: (title.index + 1) % heroTitles.length, length: 0, deleting: false, hasSwitched: true })
      } else if (!title.deleting && atEnd) {
        setTitle({ ...title, deleting: true })
      } else {
        setTitle({ ...title, length: title.length + (title.deleting ? -1 : 1) })
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [current, title])

  return (
    <h1 className="fanos-hero-title grid text-4xl sm:text-5xl md:text-[3.4rem] font-extrabold tracking-tight leading-[1.2]">
      <span className="sr-only">{heroTitles[0].text} <span lang="am">{heroTitles[1].text}</span></span>
      {heroTitles.map(({ text, lang }) => (
        <span key={lang} aria-hidden="true" lang={lang} className="invisible col-start-1 row-start-1">{text}</span>
      ))}
      <span aria-hidden="true" lang={current.lang} className="col-start-1 row-start-1">
        {current.text.slice(0, title.length)}
      </span>
    </h1>
  )
}


function MembershipRequired({ label = 'Membership required' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#B45309] font-semibold">
      <LockKeyhole className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}

function ClosingField({ locked, closeLabel }: { locked?: boolean; closeLabel?: string }) {
  if (locked) return <MembershipRequired />
  if (!closeLabel) return <span className="text-[#6E695F]">—</span>
  return <span className="text-[#B84A2B] font-bold">{closeLabel}</span>
}

export default function FanosPortal() {
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

  // Live listings from API
  const [vehicleLots, setVehicleLots] = useState<VehicleLot[]>([])
  const [procurementTenders, setProcurementTenders] = useState<ProcurementTender[]>([])
  const [catalogBusy, setCatalogBusy] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [plans, setPlans] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentTerm, setPaymentTerm] = useState('1')
  const [payments, setPayments] = useState<any[]>([])

  // Saved Lots & Tenders
  const [savedVehicleIds, setSavedVehicleIds] = useState<string[]>([])
  const [savedTenderIds, setSavedTenderIds] = useState<string[]>([])
  const [savedViewFilter, setSavedViewFilter] = useState<'all' | 'vehicles' | 'tenders'>('all')

  // User Profile & Firebase Login
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  // Gated Access & Photo Selection
  const [isSubscriberUnlocked, setIsSubscriberUnlocked] = useState(false)
  const [activeVehiclePhotoIndex, setActiveVehiclePhotoIndex] = useState(0)

  // Modals & Feedback
  const [activeNoticeModal, setActiveNoticeModal] = useState<{
    refNumber: string
    title: string
    issuer: string
    closingDate: string
    paragraphs: string[]
    sourceUrl?: string
  } | null>(null)
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Alerts List State
  const [alerts, setAlerts] = useState<AlertNotification[]>([])
  const [alertPrefChannels, setAlertPrefChannels] = useState({
    email: true,
    sms: false,
    telegram: false,
  })
  const [alertPrefCategories, setAlertPrefCategories] = useState({
    public: true,
    ngo: true,
    private: true,
    vehicles: true,
  })

  const api = useMemo(() => createApi(() => accessToken), [accessToken])

  const showToast = (msg: string) => {
    setFeedbackToast(msg)
    setTimeout(() => setFeedbackToast(null), 4000)
  }

  const applyAccount = useCallback((me: any, emailFallback = '', displayName = '') => {
    if (!me) {
      setCurrentUser(null)
      setIsSubscriberUnlocked(false)
      return
    }
    const profile: UserProfile = {
      name: displayName || me.email?.split('@')[0] || 'Bidder',
      email: me.email || emailFallback,
      organization: me.admin ? 'Superadmin' : 'Registered bidder',
      tin: '—',
      phone: '—',
      isSubscriber: !!me.subscribed || !!me.admin,
      isAdmin: !!me.admin,
    }
    setCurrentUser(profile)
    setIsSubscriberUnlocked(!!me.subscribed || !!me.admin)
    setAlertPrefChannels((prev) => ({ ...prev, email: !!me.emailAlerts }))
  }, [])

  const refreshAccount = useCallback(async (token = accessToken) => {
    if (!token) {
      applyAccount(null)
      setSavedVehicleIds([])
      setSavedTenderIds([])
      setPayments([])
      return
    }
    const me = await api('me')
    applyAccount(me)
    const saved = await api('saved')
    const vehicleIds: string[] = []
    const tenderIds: string[] = []
    for (const row of saved) {
      if (row.vehicle) vehicleIds.push(row.id)
      else tenderIds.push(row.id)
    }
    setSavedVehicleIds(vehicleIds)
    setSavedTenderIds(tenderIds)
    setPayments(await api('payments'))
  }, [accessToken, api, applyAccount])

  const loadCatalog = useCallback(async () => {
    setCatalogBusy(true)
    setCatalogError('')
    try {
      const [items, planData] = await Promise.all([
        fetchAllListings(api),
        api('plans').catch(() => null),
      ])
      const { vehicles, tenders } = listingsToPortal(items)
      setVehicleLots(vehicles as VehicleLot[])
      setProcurementTenders(tenders as ProcurementTender[])
      setAlerts(alertsFromListings(vehicles, tenders) as AlertNotification[])
      if (planData) setPlans(planData)
    } catch (error: any) {
      setCatalogError(error?.message || 'Could not load listings.')
      setVehicleLots([])
      setProcurementTenders([])
      setAlerts([])
    } finally {
      setCatalogBusy(false)
    }
  }, [api])

  useEffect(() => {
    return watchAuth(async (user) => {
      if (!user) {
        setAccessToken(null)
        return
      }
      setAccessToken(await user.getIdToken())
    })
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    void refreshAccount().catch((error) => showToast(error.message || 'Could not load account.'))
  }, [refreshAccount])

  const deepLinkHandled = useRef('')
  // Deep links from email/push: /?bid=<id>
  useEffect(() => {
    if (catalogBusy) return
    const bid = new URLSearchParams(window.location.search).get('bid')
    if (!bid || deepLinkHandled.current === bid) return
    deepLinkHandled.current = bid
    void api('listings/' + bid)
      .then((row) => {
        if (row?.vehicle) {
          setSelectedVehicle(mapVehicle(row) as VehicleLot)
          setSelectedTender(null)
          setActiveVehiclePhotoIndex(0)
        } else if (row) {
          setSelectedTender(mapTender(row) as ProcurementTender)
          setSelectedVehicle(null)
        }
      })
      .catch(() => showToast('Listing not found.'))
  }, [catalogBusy, api])

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [activeTab, selectedVehicle, selectedTender])

  const persistSave = async (id: string, isSaved: boolean) => {
    if (!accessToken) {
      setIsLoginModalOpen(true)
      showToast('Sign in to save opportunities.')
      return false
    }
    await api('saved/' + id, { method: isSaved ? 'DELETE' : 'PUT' })
    return true
  }

  // Save/Unsave Vehicles
  const toggleSaveVehicle = async (vehicleId: string) => {
    const isSaved = savedVehicleIds.includes(vehicleId)
    try {
      const ok = await persistSave(vehicleId, isSaved)
      if (!ok) return
      setSavedVehicleIds((prev) => (isSaved ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]))
      showToast(isSaved ? 'Removed vehicle lot from saved bookmarks.' : 'Saved vehicle lot to bookmarks.')
    } catch (error: any) {
      showToast(error.message || 'Could not update saved list.')
    }
  }

  // Save/Unsave Tenders
  const toggleSaveTender = async (tenderId: string) => {
    const isSaved = savedTenderIds.includes(tenderId)
    try {
      const ok = await persistSave(tenderId, isSaved)
      if (!ok) return
      setSavedTenderIds((prev) => (isSaved ? prev.filter((id) => id !== tenderId) : [...prev, tenderId]))
      showToast(isSaved ? 'Removed tender from saved bookmarks.' : 'Saved procurement tender to bookmarks.')
    } catch (error: any) {
      showToast(error.message || 'Could not update saved list.')
    }
  }

  const handleSignOut = async () => {
    await signOutAuth()
    setAccessToken(null)
    applyAccount(null)
    setSavedVehicleIds([])
    setSavedTenderIds([])
    setPayments([])
    showToast('Signed out. Switched to public guest mode.')
    void loadCatalog()
  }

  const submitPaymentReference = async () => {
    if (!accessToken) {
      setIsLoginModalOpen(true)
      return
    }
    try {
      await api('payments', { method: 'POST', data: { reference: paymentReference, months: Number(paymentTerm) } })
      setPaymentReference('')
      setPayments(await api('payments'))
      showToast('Payment reference submitted for staff verification.')
    } catch (error: any) {
      showToast(error.message || 'Could not submit payment reference.')
    }
  }

  const saveEmailAlertPref = async (enabled: boolean) => {
    setAlertPrefChannels((prev) => ({ ...prev, email: enabled }))
    if (!accessToken) return
    try {
      await api('preferences', { method: 'PUT', data: { emailAlerts: enabled } })
    } catch (error: any) {
      showToast(error.message || 'Could not save alert preference.')
    }
  }

  // Navigation Helper
  const navigateTo = (tab: 'home' | 'tenders' | 'vehicles' | 'saved' | 'alerts' | 'guidelines' | 'profile') => {
    setSelectedVehicle(null)
    setSelectedTender(null)
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  // Exact Category Navigator
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
  const openVehicleDetail = async (lot: VehicleLot) => {
    setSelectedVehicle(lot)
    setSelectedTender(null)
    setActiveVehiclePhotoIndex(0)
    try {
      const row = await api('listings/' + lot.id)
      if (row?.vehicle) setSelectedVehicle(mapVehicle(row) as VehicleLot)
    } catch {
      // keep list preview if detail fetch fails
    }
  }

  // Open Tender
  const openTenderDetail = async (tender: ProcurementTender) => {
    setSelectedTender(tender)
    setSelectedVehicle(null)
    try {
      const row = await api('listings/' + tender.id)
      if (row && !row.vehicle) setSelectedTender(mapTender(row) as ProcurementTender)
    } catch {
      // keep list preview if detail fetch fails
    }
  }

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    return vehicleLots.filter((lot) => {
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
  }, [vehicleLots, vehicleConditionFilter, vehicleRegionFilter, vehicleSearchQuery, vehicleClosingSoon])

  // Filtered Tenders
  const filteredTenders = useMemo(() => {
    return procurementTenders.filter((tender) => {
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
  }, [procurementTenders, tenderCategoryFilter, tenderSectorFilter, tenderSearchQuery, tenderClosingSoon])

  const savedVehicles = useMemo(() => {
    return vehicleLots.filter((v) => savedVehicleIds.includes(v.id))
  }, [vehicleLots, savedVehicleIds])

  const savedTenders = useMemo(() => {
    return procurementTenders.filter((t) => savedTenderIds.includes(t.id))
  }, [procurementTenders, savedTenderIds])

  // Selected Category Preview for Home Portal
  const previewTenders = useMemo(() => {
    if (selectedHomeCategory === 'Public Tenders') {
      return procurementTenders.filter((t) => t.category === 'Public')
    }
    if (selectedHomeCategory === 'NGO Tenders') {
      return procurementTenders.filter((t) => t.category === 'NGO')
    }
    if (selectedHomeCategory === 'Private Tenders') {
      return procurementTenders.filter((t) => t.category === 'Private')
    }
    return []
  }, [procurementTenders, selectedHomeCategory])

  const totalSavedCount = savedVehicleIds.length + savedTenderIds.length
  const unreadAlertsCount = alerts.filter((a) => !a.read).length

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#16201B] flex flex-col font-sans selection:bg-[#1B4332] selection:text-white">
      {/* 1. COMPACT TOP HEADER (56px) with Forest Green Accent (#1B4332) */}
      <header className="sticky top-0 z-30 h-14 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5DFD5] px-3 sm:px-4 lg:px-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-left group focus:outline-hidden"
            aria-label="Fanos Tender - Go to Home"
          >
            <div className="flex items-center gap-1.5">
              <Brand />
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
              {vehicleLots.length}
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
              {procurementTenders.filter((t) => t.category === 'Public').length}
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
              {procurementTenders.filter((t) => t.category === 'NGO').length}
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
              {procurementTenders.filter((t) => t.category === 'Private').length}
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

        {/* Right Utility Bar: Profile, Alerts Bell */}
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
              <span>Sign in</span>
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
            <span className="text-[10px]">{vehicleLots.length} Lots</span>
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
            <span className="text-[10px]">{procurementTenders.filter((t) => t.category === 'Public').length} Tenders</span>
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
            <span className="text-[10px]">{procurementTenders.filter((t) => t.category === 'NGO').length} Tenders</span>
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
            <span className="text-[10px]">{procurementTenders.filter((t) => t.category === 'Private').length} Tenders</span>
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
            <span>{currentUser ? 'My Profile & Settings' : 'Sign in'}</span>
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
            {/* Search-first hero (kept from local design; mate portal wiring retained) */}
            <section className="rounded-[28px] bg-gradient-to-br from-[#dff0e6] via-[#f3f5f0] to-[#e6ebe4] text-[#16201B] px-6 py-14 sm:px-10 sm:py-16 shadow-sm flex flex-col items-center text-center gap-4">
              <HeroTitle />
              <div className="grid max-w-xl gap-1.5">
                <p className="text-base sm:text-lg text-[#5f6b64] leading-relaxed">
                  Public, NGO and private tenders, plus vehicle lots, in one place.
                </p>
                <p lang="am" className="fanos-hero-intro text-[11px] lg:text-xs leading-relaxed">
                  የመንግሥት፣ የግልና የመንግሥታዊ ያልሆኑ ድርጅቶች ጨረታዎችን እንዲሁም የተሽከርካሪ ጨረታዎችን እዚህ ያገኛሉ።
                </p>
              </div>

              <form
                role="search"
                className="w-full max-w-[720px] mt-2 bg-white border border-[#e4e9e4] rounded-full shadow-[0_2px_8px_rgba(16,24,20,0.08)] focus-within:ring-2 focus-within:ring-[#1B4332]/20 flex items-center gap-3 pl-4 pr-1 py-1 md:pl-6 md:pr-2 md:py-2 text-left"
                onSubmit={(e) => {
                  e.preventDefault()
                  const q = tenderSearchQuery.trim().toLowerCase()
                  if (q.includes('toyota') || q.includes('isuzu') || q.includes('sedan') || q.includes('pickup') || q.includes('patrol')) {
                    setVehicleSearchQuery(tenderSearchQuery)
                    navigateTo('vehicles')
                  } else {
                    navigateTo('tenders')
                  }
                }}
              >
                <Search aria-hidden="true" className="size-5 text-[#315d48] shrink-0" />
                <input
                  type="search"
                  aria-label="Search tenders and vehicles"
                  placeholder="Search bids"
                  value={tenderSearchQuery}
                  onChange={(e) => setTenderSearchQuery(e.target.value)}
                  className="flex-1 min-w-0 border-0 bg-transparent text-base text-[#16201B] placeholder:text-sm md:placeholder:text-base placeholder:text-[#918C81] focus:outline-hidden min-h-[44px] md:min-h-[48px]"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="shrink-0 flex items-center justify-center rounded-full bg-[#edf3ee] hover:bg-[#dfeae2] text-[#1B4332] md:bg-[#0b2f24] md:hover:bg-[#14503c] md:text-white font-bold text-base w-11 md:w-auto md:px-8 min-h-[44px] md:min-h-[52px] transition"
                >
                  <ArrowRight aria-hidden="true" className="size-5 md:hidden" />
                  <span className="hidden md:inline">Search</span>
                </button>
              </form>

              <div className="hidden flex-wrap items-center justify-center gap-2.5 mt-2 md:flex" aria-label="Browse by category">
                {[
                  { label: 'Public tenders', cat: 'Public Tenders' as const, icon: Building2, count: procurementTenders.filter((t) => t.category === 'Public').length },
                  { label: 'NGO tenders', cat: 'NGO Tenders' as const, icon: Briefcase, count: procurementTenders.filter((t) => t.category === 'NGO').length },
                  { label: 'Private tenders', cat: 'Private Tenders' as const, icon: Building2, count: procurementTenders.filter((t) => t.category === 'Private').length },
                  { label: 'Vehicle bids', cat: 'Vehicle Bids' as const, icon: Truck, count: vehicleLots.length },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setSelectedHomeCategory(item.cat)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dfe6df] bg-white px-4 py-2.5 text-sm font-semibold text-[#16201B] hover:shadow-md transition"
                  >
                    <item.icon className="size-[18px] text-[#5f6b64]" />
                    {item.label}
                    <em className="not-italic text-xs font-medium text-[#5f6b64]">{item.count}</em>
                  </button>
                ))}
              </div>
            </section>

            {/* Four Exact Category Labels (Stitch Android Alignment) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6E695F]">
                  Select a Category to Preview
                </h2>
                <span className="text-xs text-[#6E695F] hidden sm:inline">
                  Click a category below to switch active preview
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-3 sm:gap-3.5">
                {[
                  {
                    id: 'Vehicle Bids' as const,
                    label: 'Vehicle Bids',
                    sublabel: 'የተሽከርካሪ ጨረታዎች',
                    count: `${vehicleLots.length} Lots`,
                    icon: Truck,
                    accent: 'bg-[#D8F3DC] text-[#1B4332]',
                  },
                  {
                    id: 'Public Tenders' as const,
                    label: 'Public Tenders',
                    sublabel: 'የመንግሥት ጨረታዎች',
                    count: `${procurementTenders.filter((t) => t.category === 'Public').length} Tenders`,
                    icon: Building2,
                    accent: 'bg-[#EAF7EE] text-[#1B4332]',
                  },
                  {
                    id: 'NGO Tenders' as const,
                    label: 'NGO Tenders',
                    sublabel: 'የመንግሥታዊ ያልሆኑ ድርጅቶች ጨረታዎች',
                    count: `${procurementTenders.filter((t) => t.category === 'NGO').length} Tenders`,
                    icon: Globe,
                    accent: 'bg-[#EFF6FF] text-[#1D4ED8]',
                  },
                  {
                    id: 'Private Tenders' as const,
                    label: 'Private Tenders',
                    sublabel: 'የግል ድርጅቶች ጨረታዎች',
                    count: `${procurementTenders.filter((t) => t.category === 'Private').length} Tenders`,
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
                        <span lang="am" className="font-['Noto_Serif_Ethiopic'] text-[11px] leading-relaxed text-[#6E695F] block">
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
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#16201B] mt-1">
                    {selectedHomeCategory}
                  </h3>
                  <p className="text-xs text-[#6E695F] mt-0.5 max-w-2xl">
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
                  <span>View full {selectedHomeCategory} directory · {selectedHomeCategory === 'Vehicle Bids' ? vehicleLots.length : previewTenders.length} listings</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              {/* Preview Cards Grid */}
              {selectedHomeCategory === 'Vehicle Bids' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {vehicleLots.map((lot) => {
                    const isSaved = savedVehicleIds.includes(lot.id)
                    return (
                      <div
                        key={lot.id}
                        onClick={() => openVehicleDetail(lot)}
                        className="group bg-[#FAF8F5] border border-[#E5DFD5] hover:border-[#1B4332] rounded-xl p-4 transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 text-left"
                      >
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[#E8E4DA]">
                          {lot.mainImage ? (
                            <Image unoptimized src={lot.mainImage} alt={lot.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6E695F] text-xs gap-1">
                              <CarFront className="size-6 opacity-60" />
                              <span>Photo coming soon</span>
                            </div>
                          )}
                        </div>
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
                              <span className="text-[#6E695F] block">Vehicle:</span>
                              <strong className="text-[#16201B] font-semibold truncate block">
                                {[lot.make, lot.model].filter(Boolean).join(' ') || '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#6E695F] block">Year / km:</span>
                              <strong className="text-[#16201B] font-semibold truncate block">
                                {lot.year || lot.mileage || "—"}
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
                            <ClosingField locked={lot.locked} closeLabel={lot.closeLabel} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#1B4332] font-semibold text-right">
                              {lot.access === 'paid' ? (lot.locked ? 'Membership' : 'Paid') : 'Free'}
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
                            <ClosingField locked={tender.locked} closeLabel={tender.closeLabel} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#1B4332] font-semibold text-right">
                              {tender.access === 'paid' ? (tender.locked ? 'Membership' : 'Paid') : 'Free'}
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
                  {catalogBusy ? "Loading listings…" : catalogError ? catalogError : `Showing live listings for ${selectedHomeCategory}`}
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
                            <span className="text-[#6E695F]">Region:</span>
                            <strong className="text-[#16201B] font-semibold">{tender.region || '—'}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#6E695F]">Closing date:</span>
                            <ClosingField locked={tender.locked} closeLabel={tender.closeLabel} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#6E695F]">Original notice:</span>
                            {tender.locked ? <MembershipRequired /> : <span className="font-semibold text-[#1B4332]">{tender.sourceUrl ? 'Available' : '—'}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Row */}
                      <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between gap-2">
                        <button
                          onClick={() => openTenderDetail(tender)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4332] hover:underline"
                        >
                          <span>View notice details</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                        {tender.locked ? (
                          <span className="text-xs"><MembershipRequired /></span>
                        ) : tender.summary || tender.sourceUrl ? (
                          <button
                            onClick={() =>
                              setActiveNoticeModal({
                                refNumber: tender.refNumber || tender.id.slice(0, 8),
                                title: tender.title,
                                issuer: tender.issuer,
                                closingDate: tender.closeLabel,
                                paragraphs: tender.summary ? [tender.summary] : ['See the original notice for full details.'],
                                sourceUrl: tender.sourceUrl,
                              })
                            }
                            className="text-xs text-[#6E695F] hover:text-[#16201B] flex items-center gap-1"
                          >
                            <Eye className="size-3.5" />
                            <span>Notice summary</span>
                          </button>
                        ) : null}
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
                  <><BookmarkCheck className="size-3.5 fill-[#1B4332]" /><span>Saved</span></>
                ) : (
                  <><Bookmark className="size-3.5" /><span>Save Tender</span></>
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  selectedTender.category === 'Public'
                    ? 'bg-[#EAF7EE] text-[#1B4332]'
                    : selectedTender.category === 'NGO'
                      ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                      : 'bg-[#FEF3C7] text-[#B45309]'
                }`}>
                  {selectedTender.categoryLabel}
                </span>
                {selectedTender.refNumber ? (
                  <span className="text-xs font-mono font-bold text-[#1B4332]">{selectedTender.refNumber}</span>
                ) : null}
                <span className="text-xs font-semibold text-[#1B4332]">• Bidding open</span>
                {selectedTender.access === 'paid' ? (
                  <span className="text-xs text-[#B45309] font-semibold">Paid notice</span>
                ) : (
                  <span className="text-xs text-[#6E695F]">Free notice</span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16201B] tracking-tight">{selectedTender.title}</h1>
              <p className="text-sm text-[#6E695F]">{selectedTender.issuer}{selectedTender.region ? ` · ${selectedTender.region}` : ''}</p>
              {!selectedTender.locked && selectedTender.summary ? (
                <p className="text-sm text-[#6E695F] max-w-3xl leading-relaxed whitespace-pre-wrap">{selectedTender.summary}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                  <h2 className="text-sm font-bold text-[#16201B] border-b border-[#F0ECE1] pb-2.5">Notice facts</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-[#6E695F]">Closing date</dt>
                      <dd className="mt-0.5"><ClosingField locked={selectedTender.locked} closeLabel={selectedTender.closeLabel} /></dd>
                    </div>
                    <div>
                      <dt className="text-[#6E695F]">Original notice</dt>
                      <dd className="mt-0.5">
                        {selectedTender.locked ? (
                          <MembershipRequired />
                        ) : selectedTender.sourceUrl ? (
                          <a href={selectedTender.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#1B4332] hover:underline inline-flex items-center gap-1">
                            Open notice <ExternalLink className="size-3.5" />
                          </a>
                        ) : (
                          <span className="text-[#6E695F]">Not published</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#6E695F]">Issuer</dt>
                      <dd className="font-semibold text-[#16201B] mt-0.5">{selectedTender.issuer}</dd>
                    </div>
                    <div>
                      <dt className="text-[#6E695F]">Region</dt>
                      <dd className="font-semibold text-[#16201B] mt-0.5">{selectedTender.region || '—'}</dd>
                    </div>
                  </dl>
                </div>

                {selectedTender.locked ? (
                  <div className="relative overflow-hidden rounded-xl border border-[#E5DFD5] bg-white">
                    <div className="p-5 space-y-2 blur-[2.5px] select-none pointer-events-none opacity-50" aria-hidden="true">
                      <p className="text-xs text-[#6E695F] leading-relaxed">
                        Full notice text, submission address, and issuer contact details are reserved for subscribers.
                        Full notice text, submission address, and issuer contact details are reserved for subscribers.
                      </p>
                      <p className="text-xs text-[#6E695F] leading-relaxed">
                        Membership unlocks closing deadlines and the original notice link so you can bid with the issuer.
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-b from-white/40 via-white/85 to-white">
                      <div className="max-w-sm w-full rounded-xl border border-[#E5DFD5] bg-white p-5 shadow-sm text-center space-y-3">
                        <LockKeyhole className="size-6 text-[#B45309] mx-auto" />
                        <h3 className="text-sm font-bold text-[#16201B]">Become a member to get the full details</h3>
                        <p className="text-[11px] text-[#6E695F]">
                          Closing date, original notice link, and bidding details unlock after staff verifies your bank payment reference.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentUser) setIsLoginModalOpen(true)
                            else navigateTo('profile')
                          }}
                          className="w-full rounded-lg bg-[#1B4332] py-2.5 text-xs font-bold text-white hover:bg-[#2D6A4F]"
                        >
                          {currentUser ? 'Subscribe from Profile' : 'Sign in to subscribe'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-xl bg-[#1B4332] text-white p-6 shadow-sm space-y-3">
                  <span className="text-xs font-medium text-[#D8F3DC] flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    Closing deadline (EAT)
                  </span>
                  {selectedTender.locked ? (
                    <div className="space-y-2">
                      <strong className="block text-xl font-extrabold tracking-tight text-[#FFE4CC]">Membership required</strong>
                      <p className="text-xs text-[#D8F3DC]">Subscribe to unlock the closing time and original notice.</p>
                    </div>
                  ) : (
                    <>
                      <strong className="block text-2xl font-extrabold tracking-tight">{selectedTender.closeLabel}</strong>
                      <p className="text-xs text-[#D8F3DC]">Bid with the issuer using their published instructions — not on this website.</p>
                    </>
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
          <article className="space-y-6 animate-in fade-in duration-200">
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
                  <><BookmarkCheck className="size-3.5 fill-[#1B4332]" /><span>Saved</span></>
                ) : (
                  <><Bookmark className="size-3.5" /><span>Save Lot</span></>
                )}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  selectedVehicle.condition === 'Used' ? 'bg-[#1B4332] text-white' : 'bg-[#96422A] text-white'
                }`}>
                  {selectedVehicle.conditionLabel}
                </span>
                {selectedVehicle.region ? (
                  <span className="text-xs text-[#6E695F] flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {selectedVehicle.region}
                  </span>
                ) : null}
                <span className="text-xs font-semibold text-[#1B4332]">• Bidding open</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16201B] tracking-tight">{selectedVehicle.title}</h1>
              <p className="text-sm text-[#6E695F]">{selectedVehicle.issuer}</p>
              {!selectedVehicle.locked && selectedVehicle.summary ? (
                <p className="text-sm text-[#6E695F] max-w-3xl leading-relaxed whitespace-pre-wrap">{selectedVehicle.summary}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  {selectedVehicle.mainImage ? (
                    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-[#E8E4DA] border border-[#E5DFD5]">
                      <Image
                        unoptimized
                        src={selectedVehicle.gallery[activeVehiclePhotoIndex]?.src || selectedVehicle.mainImage}
                        alt={selectedVehicle.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 60vw"
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E5DFD5] bg-[#FAF8F5] p-10 text-center text-xs text-[#6E695F]">
                      No authorized photo published for this lot yet.
                    </div>
                  )}

                  {!selectedVehicle.locked && selectedVehicle.gallery.length > 1 ? (
                    <div className="grid grid-cols-4 gap-2.5">
                      {selectedVehicle.gallery.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveVehiclePhotoIndex(idx)}
                          className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 ${
                            activeVehiclePhotoIndex === idx ? 'border-[#1B4332]' : 'border-[#E5DFD5]'
                          }`}
                        >
                          <Image unoptimized src={item.src} alt={item.caption} fill sizes="150px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {selectedVehicle.locked ? (
                    <div className="rounded-xl border border-[#E5DFD5] bg-white p-4 space-y-3">
                      <p className="text-xs text-[#6E695F] flex items-center gap-2">
                        <LockKeyhole className="size-3.5 text-[#B45309]" />
                        Closing date, yard location, extra photos, and bidding instructions require membership.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (!currentUser) setIsLoginModalOpen(true)
                          else navigateTo('profile')
                        }}
                        className="w-full rounded-lg bg-[#1B4332] py-2.5 text-xs font-bold text-white hover:bg-[#2D6A4F]"
                      >
                        {currentUser ? 'Subscribe from Profile' : 'Sign in to subscribe'}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                  <h2 className="text-sm font-bold text-[#16201B] border-b border-[#F0ECE1] pb-2.5">Lot facts</h2>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    {selectedVehicle.make ? <div><dt className="text-[#6E695F]">Make</dt><dd className="font-semibold text-[#16201B]">{selectedVehicle.make}</dd></div> : null}
                    {selectedVehicle.model ? <div><dt className="text-[#6E695F]">Model</dt><dd className="font-semibold text-[#16201B]">{selectedVehicle.model}</dd></div> : null}
                    {selectedVehicle.year ? <div><dt className="text-[#6E695F]">Year</dt><dd className="font-semibold text-[#16201B]">{selectedVehicle.year}</dd></div> : null}
                    <div>
                      <dt className="text-[#6E695F]">Yard location</dt>
                      <dd className="mt-0.5">{selectedVehicle.locked ? <MembershipRequired /> : <span className="font-semibold text-[#16201B]">{selectedVehicle.yardLocation || '—'}</span>}</dd>
                    </div>
                    <div>
                      <dt className="text-[#6E695F]">Closing date</dt>
                      <dd className="mt-0.5"><ClosingField locked={selectedVehicle.locked} closeLabel={selectedVehicle.closeLabel} /></dd>
                    </div>
                    <div><dt className="text-[#6E695F]">Issuer</dt><dd className="font-semibold text-[#16201B]">{selectedVehicle.issuer}</dd></div>
                  </dl>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="rounded-xl bg-[#1B4332] text-white p-6 shadow-sm space-y-3">
                  <span className="text-xs font-medium text-[#D8F3DC] flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    Closing deadline (EAT)
                  </span>
                  {selectedVehicle.locked ? (
                    <strong className="block text-xl font-extrabold tracking-tight text-[#FFE4CC]">Membership required</strong>
                  ) : (
                    <strong className="block text-2xl font-extrabold tracking-tight">{selectedVehicle.closeLabel}</strong>
                  )}
                  <p className="text-xs text-[#D8F3DC]">Bid with the issuer — not on this website.</p>
                </div>

                {!selectedVehicle.locked ? (
                  <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-4">
                    {selectedVehicle.instructions ? (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-[#16201B]">Verified bidding instructions</h3>
                        <p className="text-xs text-[#6E695F] whitespace-pre-wrap leading-relaxed">{selectedVehicle.instructions}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#6E695F]">No bidding instructions were published for this lot yet.</p>
                    )}
                    {selectedVehicle.inspection ? (
                      <div className="space-y-2 border-t border-[#F0ECE1] pt-3">
                        <h3 className="text-xs font-bold text-[#16201B]">Inspection notes</h3>
                        <p className="text-xs text-[#6E695F] whitespace-pre-wrap leading-relaxed">{selectedVehicle.inspection}</p>
                      </div>
                    ) : null}
                    {selectedVehicle.sourceUrl ? (
                      <a
                        href={selectedVehicle.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        Open original notice
                      </a>
                    ) : null}
                  </div>
                ) : null}
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
                            unoptimized
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
                          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
                            <Grid2X2 className="size-3" />
                            <span>{lot.gallery.length} Photos</span>
                          </div>
                        </div>

                        {/* Card Content with Keys, Starter, Mileage */}
                        <div className="p-5 flex flex-col flex-1 gap-3">
                          <div>
                            <div className="flex items-center justify-between">
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
                            <div className="truncate" title={[lot.make, lot.model].filter(Boolean).join(' ') || '—'}>
                              <span className="text-[#6E695F] block">Keys</span>
                              <strong className="text-[#16201B] truncate block">{[lot.make, lot.model].filter(Boolean).join(' ') || '—'}</strong>
                            </div>
                            <div className="truncate" title={lot.year || lot.mileage || "—"}>
                              <span className="text-[#6E695F] block">Starter</span>
                              <strong className="text-[#16201B] truncate block">{lot.year || lot.mileage || "—"}</strong>
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
                              <ClosingField locked={lot.locked} closeLabel={lot.closeLabel} />
                            </div>
                            <span className="text-[#1B4332] font-bold">
                              {lot.access === 'paid' ? (lot.locked ? 'Membership' : 'Paid') : 'Free'}
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
                            <ClosingField locked={lot.locked} closeLabel={lot.closeLabel} />
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
                            <ClosingField locked={tender.locked} closeLabel={tender.closeLabel} />
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
                            const found = procurementTenders.find((t) => t.id === alert.targetId)
                            if (found) openTenderDetail(found)
                          } else {
                            const found = vehicleLots.find((v) => v.id === alert.targetId)
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
                      onChange={(e) => {
                        void saveEmailAlertPref(e.target.checked)
                      }}
                      className="rounded text-[#1B4332] focus:ring-[#1B4332]"
                    />
                    <span>Daily Email Digest (EAT Morning)</span>
                  </label>
                  <p className="text-[11px] text-[#6E695F]">
                    SMS and Telegram are not enabled yet. Use email digest and Android app push.
                  </p>
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
                  HOW FANOS TENDER WORKS
                </span>
                <span className="size-1 rounded-full bg-[#1B4332]" />
                <span className="text-[11px] font-medium text-[#6E695F]">EAT deadlines</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#16201B]">
                Guidelines for using this directory
              </h1>
              <p className="text-sm text-[#6E695F] max-w-2xl">
                Practical guidance for browsing notices on Fanos Tender. Issuer documents always control. This page is not legal advice and does not replace each notice’s rules.
              </p>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-[#E5DFD5] p-4 shadow-xs">
                <span className="text-[11px] text-[#6E695F] font-semibold block uppercase tracking-wide">1. Directory only</span>
                <strong className="text-base text-[#1B4332] font-bold block mt-0.5">Bid with the issuer</strong>
                <p className="text-[11px] text-[#6E695F] mt-1">
                  Find notices here, then follow the issuer’s published instructions. Sealed bids and CPOs are not submitted on this website.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#E5DFD5] p-4 shadow-xs">
                <span className="text-[11px] text-[#6E695F] font-semibold block uppercase tracking-wide">2. Deadlines</span>
                <strong className="text-base text-[#1B4332] font-bold block mt-0.5">East Africa Time (EAT)</strong>
                <p className="text-[11px] text-[#6E695F] mt-1">
                  Closing times shown in the directory use EAT. Confirm the issuer’s exact cutoff on the original notice.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-[#E5DFD5] p-4 shadow-xs">
                <span className="text-[11px] text-[#6E695F] font-semibold block uppercase tracking-wide">3. Paid details</span>
                <strong className="text-base text-[#1B4332] font-bold block mt-0.5">Subscription unlock</strong>
                <p className="text-[11px] text-[#6E695F] mt-1">
                  Some bidding instructions and extra vehicle photos unlock after a verified bank payment reference.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
                  <div className="p-1.5 rounded-lg bg-[#EAF7EE] text-[#1B4332]">
                    <ShieldCheck className="size-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#16201B]">Before you bid with an issuer</h2>
                </div>
                <ul className="list-disc list-inside text-xs text-[#6E695F] space-y-1.5 pl-1">
                  <li>Read the full notice text and any corrigenda from the issuer.</li>
                  <li>Confirm eligibility, documents, bid security, and submission place with the issuer.</li>
                  <li>For vehicles, use listed inspection windows and authorized photo sets as a preview only.</li>
                  <li>Treat directory summaries as a starting point—not a substitute for the original notice.</li>
                </ul>
              </div>

              <div className="bg-white border border-[#E5DFD5] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-[#F0ECE1] pb-3">
                  <div className="p-1.5 rounded-lg bg-[#EAF7EE] text-[#1B4332]">
                    <Building2 className="size-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#16201B]">Subscriptions on Fanos Tender</h2>
                </div>
                <ul className="list-disc list-inside text-xs text-[#6E695F] space-y-1.5 pl-1">
                  <li>Sign in with Google or email and password.</li>
                  <li>Transfer using the published bank instructions, then submit your reference in Profile.</li>
                  <li>Access unlocks after the operator verifies the reference.</li>
                  <li>Subscription fees pay for directory access—not for a bid, CPO, or contract award.</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-[#E5DFD5] bg-[#FAF8F5] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-[#6E695F] max-w-xl">
                Binding rules for using the Service are in our legal pages.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="/terms" className="inline-flex items-center rounded-lg bg-[#1B4332] px-3 py-2 text-xs font-bold text-white hover:bg-[#2D6A4F]">
                  Terms of Use
                </a>
                <a href="/privacy" className="inline-flex items-center rounded-lg border border-[#1B4332] px-3 py-2 text-xs font-bold text-[#1B4332] hover:bg-[#EAF7EE]">
                  Privacy Policy
                </a>
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
                  <span className={`inline-block mt-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                    currentUser.isAdmin
                      ? 'bg-[#1B4332] text-white'
                      : isSubscriberUnlocked
                        ? 'bg-[#D8F3DC] text-[#1B4332]'
                        : 'bg-[#F0ECE1] text-[#635E53]'
                  }`}>
                    {currentUser.isAdmin ? 'Superadmin' : isSubscriberUnlocked ? 'Active subscriber' : 'Free account'}
                  </span>
                </div>
              </div>

              {currentUser.isAdmin && (
                <div className="rounded-xl border border-[#1B4332] bg-[#EAF7EE] p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-[#1B4332] text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#16201B]">Superadmin console</h4>
                      <p className="text-[11px] text-[#6E695F] mt-0.5">
                        Post tenders and vehicle lots, upload photos, set subscription prices and bank instructions, and approve payment references.
                      </p>
                    </div>
                  </div>
                  <a
                    href="/?screen=staff"
                    className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#1B4332] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#2D6A4F]"
                  >
                    Open Superadmin console
                    <ArrowRight className="size-3.5" />
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="text-[#6E695F] block text-[11px]">Account email</span>
                  <strong className="text-[#16201B] font-semibold">{currentUser.email}</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#EFECE6]">
                  <span className="text-[#6E695F] block text-[11px]">Access</span>
                  <strong className="text-[#16201B] font-semibold">
                    {currentUser.isAdmin ? 'Full directory management' : isSubscriberUnlocked ? 'Paid notices unlocked' : 'Public notices only'}
                  </strong>
                </div>
              </div>

              <div className="space-y-3 border-t border-[#F0ECE1] pt-4">
                <h4 className="text-xs font-bold text-[#16201B]">Submit bank payment reference</h4>
                <p className="text-[11px] text-[#6E695F]">
                  Transfer using the published bank instructions, then submit your reference for staff approval.
                </p>
                {plans?.instructions ? (
                  <p className="text-[11px] whitespace-pre-wrap rounded-lg bg-[#FAF8F5] border border-[#EFECE6] p-3 text-[#16201B]">{plans.instructions}</p>
                ) : null}
                {(() => {
                  const pricedPlans = (plans?.plans || []).filter((plan: any) => plan.price)
                  if (!pricedPlans.length || !plans?.instructions) {
                    return (
                      <p className="text-[11px] text-[#6E695F]" role="status">
                        Payment submission opens after staff publish plan prices and bank instructions.
                      </p>
                    )
                  }
                  return (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={paymentTerm}
                        onChange={(e) => setPaymentTerm(e.target.value)}
                        className="rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] px-3 py-2 text-xs"
                      >
                        {pricedPlans.map((plan: any) => (
                          <option key={plan.months} value={String(plan.months)}>
                            {plan.months} month{plan.months > 1 ? 's' : ''} · {plan.price} ETB
                          </option>
                        ))}
                      </select>
                      <input
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Bank reference"
                        className="flex-1 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => void submitPaymentReference()}
                        className="rounded-lg bg-[#1B4332] px-3 py-2 text-xs font-bold text-white hover:bg-[#2D6A4F]"
                      >
                        Submit
                      </button>
                    </div>
                  )
                })()}
                {payments.length > 0 && (
                  <ul className="space-y-1.5 text-[11px] text-[#6E695F]">
                    {payments.slice(0, 5).map((payment) => (
                      <li key={payment.id} className="flex justify-between gap-2 border-b border-[#F0ECE1] py-1">
                        <span>{payment.reference}</span>
                        <span className="font-semibold text-[#16201B]">{payment.status} · {payment.months} mo</span>
                      </li>
                    ))}
                  </ul>
                )}
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
        {/* MODAL 1: FIREBASE SIGN IN (Google + email/password) */}
        {/* ============================================================== */}
        {isLoginModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
          >
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E5DFD5] p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#16201B]">Sign in to Fanos Tender</h3>
                    <p className="text-[11px] text-[#6E695F]">Google or email and password</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="p-1 rounded-md text-[#6E695F] hover:text-black hover:bg-[#FAF8F5]"
                >
                  <X className="size-5" />
                </button>
              </div>
              <AuthPanel
                compact
                onSuccess={async () => {
                  setIsLoginModalOpen(false)
                  showToast('Signed in successfully.')
                  await loadCatalog()
                }}
              />
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
            aria-label="Notice summary"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5DFD5] p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between border-b border-[#E5DFD5] pb-4">
                <div className="space-y-1">
                  {activeNoticeModal.refNumber ? (
                    <span className="text-[11px] font-mono font-bold text-[#1B4332] tracking-wide">
                      {activeNoticeModal.refNumber}
                    </span>
                  ) : null}
                  <h3 className="text-base sm:text-lg font-bold text-[#16201B]">
                    {activeNoticeModal.title}
                  </h3>
                  <p className="text-xs text-[#6E695F]">{activeNoticeModal.issuer}</p>
                </div>
                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="p-1 rounded-md text-[#6E695F] hover:text-black hover:bg-[#FAF8F5]"
                  aria-label="Close modal"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DFD5] p-5 space-y-3 text-xs text-[#16201B] leading-relaxed">
                {activeNoticeModal.paragraphs.map((para, idx) => (
                  <p key={idx} className="whitespace-pre-wrap">{para}</p>
                ))}
                <div className="pt-3 border-t border-[#E5DFD5] flex justify-between gap-3">
                  <span className="text-[#6E695F]">Closes (EAT)</span>
                  <strong className="text-[#B84A2B]">{activeNoticeModal.closingDate || '—'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {activeNoticeModal.sourceUrl ? (
                  <a
                    href={activeNoticeModal.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#E5DFD5] bg-[#FAF8F5] text-xs font-semibold text-[#1B4332] hover:bg-[#EAF7EE]"
                  >
                    <ExternalLink className="size-3.5" />
                    Open original notice
                  </a>
                ) : <span />}
                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="px-4 py-2 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
        {!selectedVehicle && !selectedTender && activeTab === 'home' && (
          <HomePricing
            plans={plans}
            onSelect={(months: number) => {
              setPaymentTerm(String(months))
              navigateTo('profile')
              if (!currentUser) setIsLoginModalOpen(true)
              else showToast('Submit your bank reference from Profile after transfer.')
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E5DFD5] bg-[#FFFFFF] px-4 sm:px-6 lg:px-8 py-5 text-xs text-[#6E695F]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold text-[#16201B]">Fanos Tender</span>
            <span className="hidden sm:inline">·</span>
            <span>Bid with the issuer — not on this site</span>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-[11px]">
            <a href="/terms" className="font-semibold text-[#1B4332] hover:underline">Terms of Use</a>
            <a href="/privacy" className="font-semibold text-[#1B4332] hover:underline">Privacy</a>
            <button type="button" onClick={() => navigateTo('guidelines')} className="font-semibold text-[#1B4332] hover:underline">Guidelines</button>
            <span>Deadlines in EAT (UTC+3)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
