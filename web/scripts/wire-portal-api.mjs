import fs from 'fs';

const path = new URL('../app/v0-portal.tsx', import.meta.url);
let s = fs.readFileSync(path, 'utf8');

const oldBlockStart = '  // Saved Lots & Tenders (Local Persistence)';
const oldBlockEnd = '  // Exact Category Navigator (Stitch alignment)';
const start = s.indexOf(oldBlockStart);
const end = s.indexOf(oldBlockEnd);
if (start < 0 || end < 0) {
  console.error('block markers missing', start, end);
  process.exit(1);
}

const replacement = `  // Live listings from API
  const [vehicleLots, setVehicleLots] = useState<VehicleLot[]>([])
  const [procurementTenders, setProcurementTenders] = useState<ProcurementTender[]>([])
  const [catalogBusy, setCatalogBusy] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [plans, setPlans] = useState<any>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentTerm, setPaymentTerm] = useState('1')
  const [payments, setPayments] = useState<any[]>([])

  // Saved Lots & Tenders
  const [savedVehicleIds, setSavedVehicleIds] = useState<string[]>([])
  const [savedTenderIds, setSavedTenderIds] = useState<string[]>([])
  const [savedViewFilter, setSavedViewFilter] = useState<'all' | 'vehicles' | 'tenders'>('all')

  // User Profile & OTP Login
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

  const client = useMemo(() => createPortalClient(authUrl, authKey), [authUrl, authKey])
  const api = useMemo(() => createApi(() => accessToken), [accessToken])

  const showToast = (msg: string) => {
    setFeedbackToast(msg)
    setTimeout(() => setFeedbackToast(null), 4000)
  }

  const applyAccount = useCallback((me: any, emailFallback = '') => {
    if (!me) {
      setCurrentUser(null)
      setIsSubscriberUnlocked(false)
      return
    }
    const profile: UserProfile = {
      name: me.email?.split('@')[0] || 'Bidder',
      email: me.email || emailFallback,
      organization: me.admin ? 'Staff' : 'Registered bidder',
      tin: '—',
      phone: '—',
      isSubscriber: !!me.subscribed || !!me.admin,
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
      setVehicleLots(vehicles)
      setProcurementTenders(tenders)
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
    if (!client) return
    client.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null)
    })
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null)
    })
    return () => subscription.unsubscribe()
  }, [client])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    void refreshAccount().catch((error) => showToast(error.message || 'Could not load account.'))
  }, [refreshAccount])

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

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!client) {
      setLoginError('Email sign-in is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.')
      return
    }
    if (!loginEmail || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid business or personal email address.')
      return
    }
    setLoginBusy(true)
    setLoginError('')
    try {
      const { error } = await client.auth.signInWithOtp({ email: loginEmail })
      if (error) throw error
      setLoginStep('code')
      showToast('Check your inbox for your sign-in code.')
    } catch (error: any) {
      setLoginError(error.message || 'Could not send code.')
    } finally {
      setLoginBusy(false)
    }
  }

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!client) {
      setLoginError('Email sign-in is not configured.')
      return
    }
    if (!/^\\d{6}$/.test(loginCode.trim())) {
      setLoginError('Enter the 6-digit confirmation code from your email.')
      return
    }
    setLoginBusy(true)
    setLoginError('')
    try {
      const { data, error } = await client.auth.verifyOtp({
        email: loginEmail,
        token: loginCode.trim(),
        type: 'email',
      })
      if (error) throw error
      setAccessToken(data.session?.access_token ?? null)
      setIsLoginModalOpen(false)
      setLoginStep('email')
      setLoginCode('')
      setLoginEmail('')
      showToast('Signed in successfully.')
      await loadCatalog()
    } catch (error: any) {
      setLoginError(error.message || 'Invalid or expired code.')
    } finally {
      setLoginBusy(false)
    }
  }

  const handleSignOut = async () => {
    if (client) await client.auth.signOut()
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

  // `;

s = s.slice(0, start) + replacement + s.slice(end);

// Replace fixture constants with state
s = s.replaceAll('VEHICLE_LOTS', 'vehicleLots');
s = s.replaceAll('PROCUREMENT_TENDERS', 'procurementTenders');

// Fix filtered useMemos to depend on live arrays
s = s.replace(
  '  }, [vehicleConditionFilter, vehicleRegionFilter, vehicleSearchQuery, vehicleClosingSoon])',
  '  }, [vehicleLots, vehicleConditionFilter, vehicleRegionFilter, vehicleSearchQuery, vehicleClosingSoon])',
);
s = s.replace(
  '  }, [tenderCategoryFilter, tenderSectorFilter, tenderSearchQuery, tenderClosingSoon])',
  '  }, [procurementTenders, tenderCategoryFilter, tenderSectorFilter, tenderSearchQuery, tenderClosingSoon])',
);
s = s.replace(
  '  }, [savedVehicleIds])',
  '  }, [vehicleLots, savedVehicleIds])',
);
s = s.replace(
  '  }, [savedTenderIds])',
  '  }, [procurementTenders, savedTenderIds])',
);
s = s.replace(
  "  }, [selectedHomeCategory])",
  '  }, [procurementTenders, selectedHomeCategory])',
);

// Demo UI cleanup (avoid bare DEMO — it appears inside "Democratic")
const swaps = [
  ['>DEMO<', '>LIVE<'],
  ['Demo Login', 'Sign in'],
  ['Demo Subscriber Login', 'Sign in'],
  ['View as Demo Subscriber', 'Sign in for full access'],
  ['Test as Subscriber', 'Sign in'],
  ['Test as Guest', 'Guest view'],
  ['Open Official Demo Notice', 'Open official notice'],
  ['Official Demo Gazette Notice Reference Box', 'Official notice reference'],
  ['Official Demo Notice', 'Official notice'],
  ['Simulated passwordless authentication', 'Email one-time code'],
  ['Demo Email Sign In', 'Email sign in'],
  ['Demo Email-Code Sign In', 'Email sign in'],
  ['We sent a simulated 6-digit confirmation code to', 'We sent a 6-digit confirmation code to'],
  ['Verify & Sign In as Subscriber', 'Verify & sign in'],
  ['Stitch Android Desktop Port · All Data Fictional', 'Ethiopian tenders and vehicle bids'],
  ['Local Browser Storage Active', 'East Africa Time (EAT)'],
];

for (const [from, to] of swaps) {
  s = s.replaceAll(from, to);
}

s = s.replace(
  'Showing 3 sample listings for {selectedHomeCategory} · All issuers and notices are fictional',
  '{catalogBusy ? "Loading listings…" : catalogError ? catalogError : `Showing live listings for ${selectedHomeCategory}`}',
);

// Remove fake subscriber toggle onClick that flips entitlement without auth
s = s.replaceAll(
  'onClick={() => setIsSubscriberUnlocked(!isSubscriberUnlocked)}',
  'onClick={() => { if (!currentUser) setIsLoginModalOpen(true) }}',
);
s = s.replaceAll(
  'onClick={() => {\n                    setIsSubscriberUnlocked(!isSubscriberUnlocked)\n                    showToast(\n                      !isSubscriberUnlocked\n',
  'onClick={() => {\n                    if (!currentUser) { setIsLoginModalOpen(true); return }\n                    showToast(\n                      !isSubscriberUnlocked\n',
);

// HomePricing + plans wiring
s = s.replace(
  '<HomePricing plans={null} onSelect={(months: number) => window.location.assign(\'/?screen=plans&term=\' + months)} />',
  `<HomePricing plans={plans} onSelect={(months: number) => { setPaymentTerm(String(months)); navigateTo('profile'); if (!currentUser) setIsLoginModalOpen(true); else showToast('Submit your bank reference from Profile after transfer.'); }} />`,
);

fs.writeFileSync(path, s);
console.log('wired portal api, lines', s.split('\\n').length);
