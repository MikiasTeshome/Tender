import 'react-native-url-polyfill/auto';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {createClient, processLock} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import VehiclePreview from './VehiclePreview';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
const webBase = (process.env.EXPO_PUBLIC_WEB_URL || base || 'https://bidethiopia.et').replace(/\/$/, '');
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const auth = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: {
          getItem: SecureStore.getItemAsync,
          setItem: SecureStore.setItemAsync,
          removeItem: SecureStore.deleteItemAsync,
        },
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    }).auth
  : null;

const colors = {
  ink: '#0f1f18',
  green: '#0b2f24',
  green2: '#14503c',
  mint: '#dff0e6',
  line: '#dfe6df',
  muted: '#5f6b64',
  bg: '#f2f5f0',
  card: '#ffffff',
  accent: '#d97706',
  peach: '#ffe4cc',
};

const sections = [
  ['public', 'Public', 'business-outline', '#dff0e6', '#0b2f24'],
  ['ngo', 'NGO', 'heart-outline', '#fde8e3', '#8a3d2b'],
  ['private', 'Private', 'briefcase-outline', '#e6eaf7', '#3a4a8a'],
  ['vehicle', 'Vehicles', 'car-sport-outline', '#ffe4cc', '#9a5b08'],
];
const sectionTitle = {public: 'Public tenders', ngo: 'NGO tenders', private: 'Private tenders', vehicle: 'Vehicle bids'};
const conditions = [['', 'All'], ['used', 'Running'], ['damaged', 'Damaged'], ['salvage', 'Salvage']];
const emptyFilters = {section: '', q: '', condition: ''};
const eat = new Intl.DateTimeFormat('en-ET', {timeZone: 'Africa/Addis_Ababa', dateStyle: 'medium', timeStyle: 'short'});

const date = (value) => eat.format(new Date(value)) + ' EAT';
const photo = (id) => base + '/api/photos/' + id;
const plansUrl = () => webBase + '/?screen=plans';
const cleanTitle = (title = '') => title.replace(/^Sample ·\s*/, '');
const conditionLabel = (value) => (value === 'used' ? 'Running' : value ? value[0].toUpperCase() + value.slice(1) : '');

function closing(value) {
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms)) return {label: '—', hot: false};
  if (ms <= 0) return {label: 'Closed', hot: true};
  const hours = ms / 3600000;
  if (hours < 24) return {label: 'Closes today', hot: true};
  const days = Math.ceil(hours / 24);
  return {label: days + (days === 1 ? ' day left' : ' days left'), hot: days <= 3};
}

const shadow = Platform.select({
  ios: {shadowColor: '#0b2f24', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: {width: 0, height: 4}},
  android: {elevation: 3},
  default: {},
});

function Chip({label, active, onPress}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={[styles.chip, active && styles.chipOn]}
      android_ripple={{color: '#cfe3d7'}}
    >
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Btn({label, onPress, kind = 'primary', icon, disabled, style}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      android_ripple={{color: '#ffffff33'}}
      style={({pressed}) => [
        styles.btn,
        kind === 'primary' && styles.btnPrimary,
        kind === 'accent' && styles.btnAccent,
        kind === 'ghost' && styles.btnGhost,
        pressed && {opacity: 0.85},
        disabled && {opacity: 0.5},
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={kind === 'ghost' ? colors.green : '#fff'} /> : null}
      <Text style={[styles.btnText, kind === 'ghost' && {color: colors.green}]}>{label}</Text>
    </Pressable>
  );
}

function ClosingChip({deadline}) {
  const info = closing(deadline);
  return (
    <View style={styles.closing}>
      <Ionicons name="time-outline" size={13} color={info.hot ? '#b45309' : '#35574a'} />
      <Text style={[styles.closingText, info.hot && {color: '#b45309'}]}>{info.label}</Text>
    </View>
  );
}

function VehicleCard({item, onOpen, wide = false}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cleanTitle(item.title)}
      onPress={() => onOpen(item.id)}
      style={({pressed}) => [styles.vcard, wide ? styles.vcardWide : styles.vcardGrid, shadow, pressed && {transform: [{scale: 0.98}]}]}
    >
      <View style={styles.vmedia}>
        {item.cover ? <Image source={{uri: photo(item.cover)}} style={styles.fill} /> : (
          <View style={[styles.fill, styles.center]}><Ionicons name="car-sport" size={34} color="#8aa597" /></View>
        )}
        <View style={[styles.tag, item.condition !== 'used' && styles.tagWarn]}>
          <Text style={[styles.tagText, item.condition !== 'used' && {color: '#9a4b00'}]}>{conditionLabel(item.condition)}</Text>
        </View>
        {!!item.details?.lot && <View style={styles.lot}><Text style={styles.lotText}>Lot {item.details.lot}</Text></View>}
      </View>
      <View style={styles.vbody}>
        <Text style={styles.vtitle} numberOfLines={2}>{cleanTitle(item.title)}</Text>
        <View style={styles.rowCenter}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.meta} numberOfLines={1}> {item.region || item.details?.location || 'Ethiopia'}</Text>
        </View>
        <View style={styles.vfoot}>
          <ClosingChip deadline={item.deadline} />
          {item.access === 'paid' && <Ionicons name="lock-closed" size={13} color="#9a5b08" />}
        </View>
      </View>
    </Pressable>
  );
}

function TenderRow({item, onOpen}) {
  const stripe = item.sector === 'ngo' ? '#c4553f' : item.sector === 'private' ? '#4a5fb0' : '#5f9a7e';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(item.id)}
      android_ripple={{color: '#e3eedf'}}
      style={({pressed}) => [styles.trow, {borderLeftColor: stripe}, pressed && {backgroundColor: '#f3f8f4'}]}
    >
      <View style={{flex: 1, gap: 4}}>
        <Text style={styles.ttitle} numberOfLines={2}>{cleanTitle(item.title)}</Text>
        <Text style={styles.meta} numberOfLines={1}>{item.issuer}{item.region ? ' · ' + item.region : ''}</Text>
      </View>
      <View style={{alignItems: 'flex-end', gap: 6}}>
        <ClosingChip deadline={item.deadline} />
        <View style={[styles.pill, item.access === 'paid' && styles.pillPaid]}>
          <Text style={[styles.pillText, item.access === 'paid' && {color: '#9a5b08'}]}>{item.access === 'paid' ? 'Subscriber' : 'Free'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function Listings({items, onOpen}) {
  const vehicles = items.filter((entry) => entry.vehicle);
  const tenders = items.filter((entry) => !entry.vehicle);
  return (
    <View style={{gap: 14}}>
      {!!vehicles.length && (
        <View style={styles.gridWrap}>
          {vehicles.map((entry) => <VehicleCard key={entry.id} item={entry} onOpen={onOpen} />)}
        </View>
      )}
      {!!tenders.length && <View style={{gap: 8}}>{tenders.map((entry) => <TenderRow key={entry.id} item={entry} onOpen={onOpen} />)}</View>}
    </View>
  );
}

function TabBar({tab, onTab}) {
  const tabs = [
    ['home', 'Home', 'home'],
    ['vehicles', 'Vehicles', 'car-sport'],
    ['saved', 'Saved', 'bookmark'],
    ['alerts', 'Alerts', 'notifications'],
    ['profile', 'Profile', 'person'],
  ];
  return (
    <View style={styles.tabbar} accessibilityRole="tablist">
      {tabs.map(([key, label, icon]) => {
        const on = tab === key;
        return (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{selected: on}} style={styles.tab} onPress={() => onTab(key)}>
            <View style={[styles.tabPill, on && styles.tabPillOn]}>
              <Ionicons name={on ? icon : icon + '-outline'} size={22} color={on ? '#fff' : colors.muted} />
            </View>
            <Text style={[styles.tabText, on && {color: colors.green}]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchBar({value, onChange, onFocus}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel="Search tenders and vehicles"
        placeholder="Search tenders and vehicles"
        placeholderTextColor="#8a968f"
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        returnKeyType="search"
      />
      {!!value && (
        <Pressable accessibilityLabel="Clear search" onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={18} color="#8a968f" />
        </Pressable>
      )}
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [demoMe, setDemoMe] = useState(null);
  const [screen, setScreen] = useState('home');
  const [filters, setFilters] = useState(emptyFilters);
  const [catalog, setCatalog] = useState({items: []});
  const [allItems, setAllItems] = useState([]);
  const [saved, setSaved] = useState([]);
  const [demoSaved, setDemoSaved] = useState([]);
  const [selected, setSelected] = useState('');
  const [item, setItem] = useState(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const token = session?.access_token;
  const me = account || demoMe;
  const savedItems = account ? saved : demoSaved;
  const savedCurrent = selected ? savedItems.some((entry) => entry.id === selected) : false;
  const tab = screen === 'catalog' ? (filters.section === 'vehicle' ? 'vehicles' : 'home') : screen;

  const api = useCallback(async (path, {data, ...options} = {}) => {
    if (!base) throw new Error('Set the API URL to connect the app.');
    const response = await fetch(base + '/api/' + path, {
      ...options,
      headers: {
        ...(token ? {Authorization: 'Bearer ' + token} : {}),
        ...(data ? {'Content-Type': 'application/json'} : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? 'Request failed.');
    return response.json();
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) {
      setAccount(null);
      setSaved([]);
      return;
    }
    const [profile, bookmarks] = await Promise.all([api('me'), api('saved')]);
    setAccount(profile);
    setSaved(bookmarks);
    setDemoMe(null);
  }, [api, token]);

  async function run(action) {
    setStatus('');
    try {
      await action();
    } catch (error) {
      setStatus(error.message);
    }
  }

  const go = useCallback((next, section = '') => {
    setStatus('');
    setSelected('');
    setItem(null);
    if (next === 'catalog') {
      setFilters((prev) => ({...prev, section, condition: ''}));
    } else if (next === 'home') {
      setFilters(emptyFilters);
    }
    setScreen(next);
  }, []);

  const open = useCallback((id) => {
    setStatus('');
    setSelected(id);
    setScreen('detail');
  }, []);

  function onTab(key) {
    if (key === 'vehicles') go('catalog', 'vehicle');
    else if (key === 'profile') go(me ? 'profile' : 'auth');
    else go(key);
  }

  const openPlans = () => run(() => Linking.openURL(plansUrl()));

  useEffect(() => {
    if (!auth) return;
    auth.getSession().then(({data}) => setSession(data.session));
    const {data: {subscription}} = auth.onAuthStateChange((_event, next) => setSession(next));
    const listener = AppState.addEventListener('change', (state) => (state === 'active' ? auth.startAutoRefresh() : auth.stopAutoRefresh()));
    if (AppState.currentState === 'active') auth.startAutoRefresh();
    return () => {
      subscription.unsubscribe();
      listener.remove();
      auth.stopAutoRefresh();
    };
  }, []);

  useEffect(() => {
    refresh().catch((error) => setStatus(error.message));
  }, [refresh]);

  useEffect(() => {
    if (me && screen === 'auth') go('profile');
  }, [me, screen, go]);

  useEffect(() => {
    function follow(response) {
      if (!response) return;
      const id = response.notification.request.content.data.listingId;
      if (typeof id === 'string') open(id);
      else go('home');
      Notifications.clearLastNotificationResponse();
    }
    follow(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(follow);
    return () => subscription.remove();
  }, [go, open]);

  // Whole feed for home rails and counts
  useEffect(() => {
    let alive = true;
    api('listings')
      .then((result) => {
        if (!alive) return;
        setAllItems(result.items ?? []);
        setDemoSaved((prev) => (prev.length ? prev : (result.items ?? []).slice(0, 2)));
      })
      .catch((error) => alive && setStatus(error.message));
    return () => {
      alive = false;
    };
  }, [api, tick]);

  // Filtered catalog
  useEffect(() => {
    if (screen !== 'catalog') return;
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (filters.q) query.set('q', filters.q);
        if (filters.section) query.set('section', filters.section);
        if (filters.condition) query.set('condition', filters.condition);
        const result = await api('listings?' + query);
        if (alive) setCatalog(result);
      } catch (error) {
        if (alive) setStatus(error.message);
      } finally {
        if (alive) setLoading(false);
      }
    }, 220);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [api, filters, screen, tick]);

  useEffect(() => {
    setItem(null);
    if (!selected) return;
    let alive = true;
    api('listings/' + selected)
      .then((data) => alive && setItem(data))
      .catch((error) => alive && setStatus(error.message));
    return () => {
      alive = false;
    };
  }, [api, selected]);

  async function onRefresh() {
    setRefreshing(true);
    setTick((value) => value + 1);
    try {
      await refresh();
    } catch (error) {
      setStatus(error.message);
    }
    setTimeout(() => setRefreshing(false), 500);
  }

  async function updatePush(enabled) {
    let pushToken = null;
    if (enabled) {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Tender alerts',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const {status: permission} = await Notifications.requestPermissionsAsync();
      if (permission !== 'granted') throw new Error('Allow notifications in your device settings.');
      const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
      if (!projectId) throw new Error('Push notifications are being configured.');
      pushToken = (await Notifications.getExpoPushTokenAsync({projectId})).data;
    }
    await api('preferences', {method: 'PUT', data: {pushToken}});
    await refresh();
  }

  function toggleSave() {
    if (!selected) return;
    if (token) {
      void run(async () => {
        await api('saved/' + selected, {method: savedCurrent ? 'DELETE' : 'PUT'});
        await refresh();
      });
      return;
    }
    if (demoMe) {
      setDemoSaved((prev) => {
        if (prev.some((entry) => entry.id === selected)) return prev.filter((entry) => entry.id !== selected);
        const next = allItems.find((entry) => entry.id === selected) || (item?.id === selected ? item : null);
        return next ? [next, ...prev] : prev;
      });
      return;
    }
    go('auth');
  }

  const counts = useMemo(() => ({
    public: allItems.filter((e) => !e.vehicle && e.sector === 'public').length,
    ngo: allItems.filter((e) => !e.vehicle && e.sector === 'ngo').length,
    private: allItems.filter((e) => !e.vehicle && e.sector === 'private').length,
    vehicle: allItems.filter((e) => e.vehicle).length,
  }), [allItems]);

  const shown = useMemo(() => catalog.items.filter((entry) => {
    if (filters.section === 'vehicle') return !!entry.vehicle && (!filters.condition || entry.condition === filters.condition);
    if (filters.section) return !entry.vehicle && entry.sector === filters.section;
    return true;
  }), [catalog.items, filters.condition, filters.section]);

  const homeVehicles = allItems.filter((entry) => entry.vehicle);
  const homeTenders = allItems.filter((entry) => !entry.vehicle);
  const showTabs = ['home', 'catalog', 'saved', 'alerts', 'profile'].includes(screen);

  // ───────── Detail (full-bleed hero + sticky action bar) ─────────
  if (screen === 'detail') {
    const info = item?.details ?? {};
    const facts = item ? Object.entries({
      Issuer: item.issuer,
      Reference: info.reference,
      Lot: info.lot,
      Region: item.region,
      Location: info.location,
      Make: info.make,
      Model: info.model,
      Year: info.year,
      Mileage: info.mileage,
    }).filter(([, value]) => value) : [];
    const close = item ? closing(item.deadline) : null;
    const back = () => go(filters.section ? 'catalog' : 'home', filters.section);
    return (
      <View style={styles.root}>
        <StatusBar barStyle={item?.vehicle ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
        <ScrollView contentContainerStyle={{paddingBottom: 150}} showsVerticalScrollIndicator={false}>
          {item?.vehicle ? (
            <View style={styles.hero}>
              {item.cover ? <Image source={{uri: photo(item.cover)}} style={styles.fill} accessibilityLabel={item.title} /> : (
                <View style={[styles.fill, styles.center]}><Ionicons name="car-sport" size={60} color="#8aa597" /></View>
              )}
              {!!item.condition && (
                <View style={[styles.tag, styles.tagBig, item.condition !== 'used' && styles.tagWarn]}>
                  <Text style={[styles.tagText, item.condition !== 'used' && {color: '#9a4b00'}]}>{conditionLabel(item.condition)}</Text>
                </View>
              )}
            </View>
          ) : <View style={{height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 52 : 64}} />}

          {!item ? (
            <View style={[styles.sheet, styles.center, {minHeight: 240}]}>
              {status ? <Text style={styles.notice}>{status}</Text> : <ActivityIndicator color={colors.green} />}
            </View>
          ) : (
            <View style={[styles.sheet, !item.vehicle && {marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0}]}>
              <View style={styles.rowWrap}>
                <View style={[styles.pill, item.access === 'paid' && styles.pillPaid]}>
                  <Text style={[styles.pillText, item.access === 'paid' && {color: '#9a5b08'}]}>
                    {item.access === 'paid' ? (item.locked ? 'Subscriber listing' : 'Unlocked') : 'Free access'}
                  </Text>
                </View>
                {!item.vehicle && <View style={styles.pill}><Text style={styles.pillText}>{item.sector}</Text></View>}
              </View>
              <Text style={styles.h1}>{cleanTitle(item.title)}</Text>
              <View style={[styles.closeBox, close.hot && {backgroundColor: colors.peach}]}>
                <Text style={styles.kicker}>Closing</Text>
                <Text style={[styles.closeBig, close.hot && {color: '#8a4a00'}]}>{close.label}</Text>
                <Text style={styles.meta}>{date(item.deadline)}</Text>
              </View>

              <View style={styles.factsCard}>
                {facts.map(([key, value], index) => (
                  <View key={key} style={[styles.factRow, index === facts.length - 1 && {borderBottomWidth: 0}]}>
                    <Text style={styles.factKey}>{key}</Text>
                    <Text style={styles.factVal}>{value}</Text>
                  </View>
                ))}
              </View>

              {item.locked ? (
                <View style={styles.locked}>
                  <Ionicons name="lock-closed" size={22} color="#9a5b08" />
                  <View style={{flex: 1, gap: 4}}>
                    <Text style={styles.lockedTitle}>Bidding instructions are for subscribers</Text>
                    <Text style={styles.body}>
                      Issuer, reference, lot and closing time stay visible{item.vehicle ? ', plus the cover photo' : ''}. Subscribe on the website to unlock the rest.
                    </Text>
                    {item.vehicle && (
                      <View style={styles.rowWrap}>
                        {[2, 3, 4].map((n) => (
                          <View key={n} style={styles.lockSlot}><Ionicons name="lock-closed" size={14} color="#6b7d72" /><Text style={styles.lockSlotText}>Photo {n}</Text></View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{gap: 14}}>
                  {!!info.instructions && (
                    <View style={styles.section}><Text style={styles.sectionTitle}>Bidding instructions</Text><Text style={styles.body}>{info.instructions}</Text></View>
                  )}
                  {item.vehicle && item.photos?.some((id) => id !== item.cover) && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 10}}>
                      {item.photos.filter((id) => id !== item.cover).map((id) => (
                        <Image
                          key={id}
                          source={{uri: photo(id), headers: token ? {Authorization: 'Bearer ' + token} : {}}}
                          style={styles.galleryPhoto}
                          accessibilityLabel="Another photo of this lot"
                        />
                      ))}
                    </ScrollView>
                  )}
                  {!!info.inspection && <View style={styles.section}><Text style={styles.sectionTitle}>Inspection notes</Text><Text style={styles.body}>{info.inspection}</Text></View>}
                  {!!info.description && <View style={styles.section}><Text style={styles.sectionTitle}>Description</Text><Text style={styles.body}>{info.description}</Text></View>}
                  {!info.instructions && !info.sourceUrl && <Text style={styles.body}>The issuer has not attached bidding instructions to this notice yet.</Text>}
                </View>
              )}
              <View style={styles.rowCenter}>
                <Ionicons name="shield-checkmark-outline" size={15} color={colors.muted} />
                <Text style={styles.meta}> You bid with the issuer, not in this app.</Text>
              </View>
              {!!status && <Text style={styles.notice}>{status}</Text>}
            </View>
          )}
        </ScrollView>

        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={[styles.floatBtn, {left: 14}]}>
          <Ionicons name="chevron-back" size={22} color={colors.green} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={savedCurrent ? 'Remove from saved' : 'Save'} onPress={toggleSave} style={[styles.floatBtn, {right: 14}]}>
          <Ionicons name={savedCurrent ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.green} />
        </Pressable>

        {item && (
          <View style={styles.actionBar}>
            {item.locked ? (
              <Btn
                kind="accent"
                icon="lock-open-outline"
                label={me ? 'Subscribe on the website' : 'Sign in to subscribe'}
                style={{flex: 1}}
                onPress={() => (me ? openPlans() : go('auth'))}
              />
            ) : info.sourceUrl ? (
              <Btn kind="accent" icon="open-outline" label="Open the issuer’s notice" style={{flex: 1}} onPress={() => run(() => Linking.openURL(info.sourceUrl))} />
            ) : (
              <Btn kind="primary" label={savedCurrent ? 'Saved' : 'Save opportunity'} style={{flex: 1}} onPress={toggleSave} />
            )}
          </View>
        )}
      </View>
    );
  }

  // ───────── Tab screens ─────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle={screen === 'home' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0}}>
        <ScrollView
          key={screen}
          contentContainerStyle={[styles.container, showTabs && {paddingBottom: 110}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} colors={[colors.green]} />}
          stickyHeaderIndices={[]}
        >
          {!!status && <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text>}

          {screen === 'home' && (
            <View style={{gap: 18}}>
              <View style={styles.homeHead}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.brand}>Bid Ethiopia</Text>
                    <Text style={styles.brandSub}>Find a bid. Judge the lot.</Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => go(me ? 'profile' : 'auth')} style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </Pressable>
                </View>
                <SearchBar
                  value={filters.q}
                  onChange={(value) => {
                    setFilters((prev) => ({...prev, q: value}));
                    if (value) setScreen('catalog');
                  }}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {sections.map(([key, label, icon, bg, fg]) => (
                  <Pressable key={key} accessibilityRole="button" accessibilityLabel={sectionTitle[key]} style={styles.cat} onPress={() => go('catalog', key)}>
                    <View style={[styles.catIcon, {backgroundColor: bg}]}><Ionicons name={icon} size={26} color={fg} /></View>
                    <Text style={styles.catLabel}>{label}</Text>
                    <Text style={styles.catCount}>{counts[key]}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {!!homeVehicles.length && (
                <View style={{gap: 10}}>
                  <View style={[styles.rowBetween, styles.pad]}>
                    <Text style={styles.h2}>Vehicle bids</Text>
                    <Pressable accessibilityRole="button" onPress={() => go('catalog', 'vehicle')}><Text style={styles.link}>See all</Text></Pressable>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={276} decelerationRate="fast" contentContainerStyle={styles.rail}>
                    {homeVehicles.map((entry) => <VehicleCard key={entry.id} item={entry} onOpen={open} wide />)}
                  </ScrollView>
                </View>
              )}

              <View style={[styles.pad, {gap: 10}]}>
                <Text style={styles.h2}>Open now</Text>
                {homeTenders.map((entry) => <TenderRow key={entry.id} item={entry} onOpen={open} />)}
                {!allItems.length && <Text style={styles.body}>{status ? '' : 'Loading opportunities…'}</Text>}
                {!!allItems.length && !homeTenders.length && <Text style={styles.body}>No open tenders right now.</Text>}
              </View>
            </View>
          )}

          {screen === 'catalog' && (
            <View style={styles.pad}>
              <View style={{gap: 12}}>
                <View style={styles.rowBetween}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => go('home')} style={styles.roundBtn}>
                    <Ionicons name="chevron-back" size={22} color={colors.green} />
                  </Pressable>
                  <Text style={styles.h1Small}>{sectionTitle[filters.section] || 'Browse'}</Text>
                  <View style={{width: 40}} />
                </View>
                <SearchBar value={filters.q} onChange={(value) => setFilters((prev) => ({...prev, q: value}))} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                  <Chip label="All" active={!filters.section} onPress={() => setFilters((prev) => ({...prev, section: '', condition: ''}))} />
                  {sections.map(([key, label]) => (
                    <Chip key={key} label={label} active={filters.section === key} onPress={() => setFilters((prev) => ({...prev, section: key, condition: ''}))} />
                  ))}
                </ScrollView>
                {filters.section === 'vehicle' && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
                    {conditions.map(([key, label]) => (
                      <Chip key={key || 'all'} label={label} active={filters.condition === key} onPress={() => setFilters((prev) => ({...prev, condition: key}))} />
                    ))}
                  </ScrollView>
                )}
                <Text style={styles.meta}>{loading ? 'Loading…' : `${shown.length} ${shown.length === 1 ? 'result' : 'results'}`}</Text>
                {loading && !shown.length ? <ActivityIndicator color={colors.green} /> : <Listings items={shown} onOpen={open} />}
                {!loading && !shown.length && (
                  <View style={styles.empty}><Ionicons name="search" size={28} color="#8aa597" /><Text style={styles.body}>No active opportunities match these filters.</Text></View>
                )}
              </View>
            </View>
          )}

          {screen === 'saved' && (
            <View style={[styles.pad, {gap: 12}]}>
              <Text style={styles.h1Small2}>Saved lots</Text>
              <Text style={styles.meta}>{me ? 'Synced to your account.' : 'On this device only — sign in to sync.'}</Text>
              <Listings items={savedItems} onOpen={open} />
              {!savedItems.length && (
                <View style={styles.empty}>
                  <Ionicons name="bookmark-outline" size={28} color="#8aa597" />
                  <Text style={styles.body}>Nothing saved yet.</Text>
                  {!me && <Btn kind="ghost" label="Restore demo saves" onPress={() => setDemoSaved(allItems.slice(0, 2))} />}
                </View>
              )}
            </View>
          )}

          {screen === 'alerts' && (
            <View style={[styles.pad, {gap: 12}]}>
              <Text style={styles.h1Small2}>Closing soon</Text>
              <Text style={styles.meta}>Active lots by deadline. Push alerts are in Profile.</Text>
              <Listings
                items={allItems.filter((entry) => entry.status === 'active').sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 8)}
                onOpen={open}
              />
            </View>
          )}

          {screen === 'profile' && (
            <View style={[styles.pad, {gap: 14}]}>
              <Text style={styles.h1Small2}>Profile</Text>
              <View style={[styles.profileCard, shadow]}>
                <View style={styles.avatarLg}><Ionicons name="person" size={28} color="#fff" /></View>
                <View style={{flex: 1, gap: 3}}>
                  <Text style={styles.ttitle}>{me?.email || 'Guest'}</Text>
                  <Text style={styles.meta}>
                    {me ? (me.subscribed ? 'Subscription active' : 'Free account') : 'Browse-only'}
                  </Text>
                </View>
                {!!me?.subscribed && <View style={[styles.pill, styles.pillPaid]}><Text style={[styles.pillText, {color: '#9a5b08'}]}>Subscriber</Text></View>}
              </View>
              <Btn kind="accent" icon="card-outline" label="Subscriptions on the website" onPress={openPlans} />
              {me && token && (
                <View style={styles.listCard}>
                  <View style={styles.setting}>
                    <Text style={styles.ttitle}>Email alerts</Text>
                    <Switch
                      accessibilityLabel="Email alerts"
                      value={!!account?.emailAlerts}
                      onValueChange={(emailAlerts) => run(async () => {
                        await api('preferences', {method: 'PUT', data: {emailAlerts}});
                        await refresh();
                      })}
                    />
                  </View>
                  <View style={[styles.setting, {borderBottomWidth: 0}]}>
                    <Text style={styles.ttitle}>Push alerts</Text>
                    <Switch accessibilityLabel="Push alerts" value={!!account?.pushEnabled} onValueChange={(enabled) => run(() => updatePush(enabled))} />
                  </View>
                </View>
              )}
              {!me
                ? <Btn icon="log-in-outline" label="Sign in" onPress={() => go('auth')} />
                : <Btn kind="ghost" icon="log-out-outline" label="Sign out" onPress={() => run(async () => {
                    if (auth) await auth.signOut();
                    setDemoMe(null);
                    setSent(false);
                    setCode('');
                    go('home');
                  })} />}
              {process.env.EXPO_PUBLIC_VEHICLE_REFERENCE_PREVIEW === 'true' && (
                <Btn kind="ghost" label="Vehicle design preview" onPress={() => go('vehiclePreview')} />
              )}
              <Text style={styles.meta}>Closing times are shown in EAT (UTC+3). Purchases happen on the website.</Text>
            </View>
          )}

          {screen === 'auth' && (
            <View style={[styles.pad, {gap: 12}]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => go('home')} style={styles.roundBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.green} />
              </Pressable>
              <Text style={styles.h1}>Sign in</Text>
              <Text style={styles.body}>Sync saved lots and see paid listings once your subscription is approved on the website.</Text>
              <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#8a968f" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!sent} />
              {sent && <TextInput style={styles.input} placeholder="6-digit code" placeholderTextColor="#8a968f" value={code} onChangeText={setCode} keyboardType="numeric" />}
              <Btn
                label={sent ? 'Verify code' : 'Send sign-in code'}
                onPress={() => run(async () => {
                  if (!auth) {
                    if (!sent) {
                      setSent(true);
                      setStatus('Demo mode: enter any 6-digit code to continue.');
                      return;
                    }
                    if (!/^\d{6}$/.test(code.trim())) throw new Error('Enter a 6-digit demo code.');
                    setDemoMe({email: email || 'demo@bidethiopia.et', subscribed: false, demo: true});
                    go('profile');
                    return;
                  }
                  const {error} = sent ? await auth.verifyOtp({email, token: code, type: 'email'}) : await auth.signInWithOtp({email});
                  if (error) throw error;
                  if (!sent) {
                    setSent(true);
                    setStatus('Check your email for your sign-in code.');
                  }
                })}
              />
              {sent && <Btn kind="ghost" label="Use another email" onPress={() => {setSent(false); setCode(''); setStatus('');}} />}
            </View>
          )}

          {screen === 'vehiclePreview' && (
            <View style={[styles.pad, {gap: 12}]}>
              <Btn kind="ghost" label="Back" onPress={() => go('profile')} />
              <VehiclePreview base={base} />
            </View>
          )}
        </ScrollView>
        {showTabs && <TabBar tab={tab} onTab={onTab} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  container: {paddingBottom: 40},
  pad: {paddingHorizontal: 16},
  fill: {width: '100%', height: '100%'},
  center: {alignItems: 'center', justifyContent: 'center'},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10},
  rowCenter: {flexDirection: 'row', alignItems: 'center'},
  rowWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},

  homeHead: {backgroundColor: colors.green, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18, gap: 14, borderBottomLeftRadius: 26, borderBottomRightRadius: 26},
  brand: {color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5},
  brandSub: {color: '#9fd1b6', fontSize: 13, fontWeight: '600', marginTop: 2},
  avatar: {width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center'},
  avatarLg: {width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center'},
  search: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: colors.line},
  searchInput: {flex: 1, color: colors.ink, fontSize: 15, paddingVertical: 0},

  catRow: {paddingHorizontal: 16, gap: 14},
  cat: {alignItems: 'center', gap: 5, width: 78},
  catIcon: {width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center'},
  catLabel: {fontSize: 12.5, fontWeight: '800', color: colors.ink},
  catCount: {fontSize: 11, color: colors.muted, marginTop: -3},

  h1: {fontSize: 26, fontWeight: '800', color: colors.green, letterSpacing: -0.5, lineHeight: 31},
  h1Small: {fontSize: 18, fontWeight: '800', color: colors.green},
  h1Small2: {fontSize: 26, fontWeight: '800', color: colors.green, marginTop: 14},
  h2: {fontSize: 19, fontWeight: '800', color: colors.green},
  link: {color: colors.green, fontWeight: '800', fontSize: 14},
  body: {color: '#425e53', lineHeight: 21, fontSize: 14.5},
  meta: {color: colors.muted, fontSize: 12.5, flexShrink: 1},
  kicker: {color: '#366951', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8},
  notice: {marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10, backgroundColor: '#e3eedf', color: '#204b3b', overflow: 'hidden'},

  rail: {paddingHorizontal: 16, gap: 12},
  gridWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  vcard: {backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: Platform.OS === 'ios' ? 0 : 1, borderColor: colors.line},
  vcardWide: {width: 264},
  vcardGrid: {width: '47.8%'},
  vmedia: {aspectRatio: 4 / 3, backgroundColor: '#e6ece6'},
  vbody: {padding: 12, gap: 5},
  vtitle: {fontSize: 15, fontWeight: '800', color: colors.ink, lineHeight: 19, minHeight: 38},
  vfoot: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3},
  tag: {position: 'absolute', top: 10, left: 10, backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999},
  tagBig: {top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 58, left: 66},
  tagWarn: {backgroundColor: colors.peach},
  tagText: {fontSize: 11, fontWeight: '800', color: colors.green},
  lot: {position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(11,47,36,0.82)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  lotText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  closing: {flexDirection: 'row', alignItems: 'center', gap: 4},
  closingText: {fontSize: 12, fontWeight: '800', color: '#35574a'},

  trow: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4, padding: 14, borderWidth: 1, borderColor: colors.line},
  ttitle: {fontSize: 15, fontWeight: '800', color: colors.ink, lineHeight: 19},
  pill: {backgroundColor: colors.mint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start'},
  pillPaid: {backgroundColor: colors.peach},
  pillText: {fontSize: 11, fontWeight: '800', color: colors.green, textTransform: 'capitalize'},

  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line},
  chipOn: {backgroundColor: colors.green, borderColor: colors.green},
  chipText: {fontWeight: '700', color: colors.green, fontSize: 13.5},
  chipTextOn: {color: '#fff'},
  roundBtn: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line},

  btn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14},
  btnPrimary: {backgroundColor: colors.green},
  btnAccent: {backgroundColor: colors.accent},
  btnGhost: {backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line},
  btnText: {color: '#fff', fontWeight: '800', fontSize: 15.5},

  hero: {height: 320, backgroundColor: '#dfe7df'},
  sheet: {marginTop: -26, backgroundColor: colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, gap: 14},
  floatBtn: {position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 54, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...shadow},
  closeBox: {backgroundColor: colors.mint, borderRadius: 14, padding: 14, gap: 2},
  closeBig: {fontSize: 24, fontWeight: '800', color: colors.green},
  factsCard: {backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14},
  factRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#edf0ec'},
  factKey: {color: colors.muted, fontWeight: '600'},
  factVal: {color: colors.ink, fontWeight: '800', flexShrink: 1, textAlign: 'right'},
  locked: {flexDirection: 'row', gap: 12, backgroundColor: '#fff8ee', borderRadius: 14, borderWidth: 1, borderColor: '#f0d3ad', padding: 14},
  lockedTitle: {fontSize: 15, fontWeight: '800', color: colors.green},
  lockSlot: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#d4dbd4', borderStyle: 'dashed'},
  lockSlotText: {fontSize: 11, color: '#6b7d72', fontWeight: '700'},
  section: {backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: colors.line},
  sectionTitle: {fontSize: 15, fontWeight: '800', color: colors.green},
  galleryPhoto: {width: 240, height: 160, borderRadius: 12, backgroundColor: '#dfe7df'},
  actionBar: {position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 14, paddingBottom: Platform.OS === 'ios' ? 30 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, ...shadow},

  tabbar: {position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 24 : 10},
  tab: {flex: 1, alignItems: 'center', gap: 2},
  tabPill: {width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  tabPillOn: {backgroundColor: colors.green},
  tabText: {fontSize: 11, fontWeight: '700', color: colors.muted},

  profileCard: {flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 16},
  listCard: {backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14},
  setting: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#edf0ec'},
  input: {borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#fff', padding: 13, color: colors.ink, fontSize: 15},
  empty: {alignItems: 'center', gap: 10, padding: 28, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#b9c9bf'},
});
