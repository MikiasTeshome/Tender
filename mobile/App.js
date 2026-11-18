import React, {useCallback, useEffect, useState} from 'react';
import {Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import VehiclePreview from './VehiclePreview';
import {
  firebaseConfigured,
  registerEmail,
  signInEmail,
  signInGoogleIdToken,
  signOutAuth,
  watchAuth,
} from './firebase';

WebBrowser.maybeCompleteAuthSession();

Notifications.setNotificationHandler({
  handleNotification: async () => ({shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false}),
});

const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
const webBase = (process.env.EXPO_PUBLIC_WEB_URL || process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
const PUSH_TOKEN_KEY = 'fanos.pushToken';

async function resolveExpoPushToken() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Fanos Tender alerts', importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const {status: permission} = await Notifications.requestPermissionsAsync();
  if (permission !== 'granted') throw new Error('Allow notifications in your device settings.');
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) throw new Error('Android notifications are being configured.');
  return (await Notifications.getExpoPushTokenAsync({projectId})).data;
}

const sections = [['public', 'Public Tenders', '▤'], ['ngo', 'NGO Tenders', '◎'], ['private', 'Private Tenders', '▦'], ['vehicle', 'Vehicle Bids', '▰']];
const defaults = {section: '', q: '', region: '', access: '', deadline: '', condition: '', make: '', model: ''};
const format = new Intl.DateTimeFormat('en-ET', {timeZone: 'Africa/Addis_Ababa', dateStyle: 'medium', timeStyle: 'short'});
const date = (value) => format.format(new Date(value)) + ' EAT';
const photo = (id) => base + '/api/photos/' + id;

function Button({label, onPress, active = false}) {
  return <Pressable accessibilityRole="button" style={[styles.button, active && styles.active]} onPress={onPress}>
    <Text style={[styles.buttonText, active && styles.activeText]}>{label}</Text>
  </Pressable>;
}

function DetailDisclosure({label, content, active, children}) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.gap}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded}} style={[styles.button, active && styles.active]} onPress={() => setExpanded(!expanded)}>
      <Text style={[styles.buttonText, active && styles.activeText]}>{label} {expanded ? '−' : '+'}</Text>
    </Pressable>
    {expanded && <>{!!content && <Text style={styles.body}>{content}</Text>}{children}</>}
  </View>;
}

function conditionStyle(condition) {
  return ['damaged', 'salvage'].includes(condition?.toLowerCase()) ? styles.damage : null;
}

function Cards({items, open, width}) {
  return items.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item.id)} style={[styles.card, width && {width}]}>
    {item.cover && <Image source={{uri: photo(item.cover)}} style={styles.cover} accessibilityLabel={item.title} />}
    <View style={styles.cardBody}>
      <Text style={[styles.kicker, conditionStyle(item.condition)]}>{item.condition ?? item.sector} · {item.access === 'paid' ? 'Subscriber' : 'Free'}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.vehicle && <Text style={styles.kicker}>View vehicle →</Text>}
      {!item.vehicle && item.issuer && <Text style={styles.body}>{item.issuer}</Text>}
      <Text style={styles.body}>{item.status === 'active' ? 'Closes' : item.status} · {date(item.deadline)}</Text>
    </View>
  </Pressable>);
}

function Options({label, value, onChange, options}) {
  return <View style={styles.gap}><Text style={styles.kicker}>{label}</Text><View style={styles.row}>
    {options.map(([key, name]) => <Button key={key} label={name} active={key === value} onPress={() => onChange(key)} />)}
  </View></View>;
}

export default function App() {
  const {width} = useWindowDimensions();
  const [token, setToken] = useState(null);
  const [account, setAccount] = useState(null);
  const [view, setView] = useState('browse');
  const [homeCategory, setHomeCategory] = useState('vehicle');
  const [directory, setDirectory] = useState(false);
  const [filters, setFilters] = useState(defaults);
  const [showFilters, setShowFilters] = useState(false);
  const [list, setList] = useState({items: []});
  const [categoryPreview, setCategoryPreview] = useState([]);
  const [saved, setSaved] = useState([]);
  const [searches, setSearches] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [selected, setSelected] = useState('');
  const [item, setItem] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  });

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
    if (!token) {setAccount(null); setSaved([]); setSearches([]); return;}
    const [profile, bookmarks, queries] = await Promise.all([api('me'), api('saved'), api('searches')]);
    setAccount(profile); setSaved(bookmarks); setSearches(queries);
  }, [api, token]);

  function open(id) {
    setStatus(''); setSelected(id); setView('detail');
  }
  function go(next) {setStatus(''); setSelected(''); setView(next);}
  function goHome() {setDirectory(false); setFilters(defaults); setShowFilters(false); go('browse');}
  function showDirectory(section) {
    setList({items: []}); setDirectory(true); setFilters({...defaults, section}); setShowFilters(false); go('browse');
  }
  async function run(action) {
    setStatus('');
    try {await action();} catch (error) {setStatus(error.message);}
  }

  useEffect(() => {
    return watchAuth(async (user) => {
      if (!user) {setToken(null); return;}
      setToken(await user.getIdToken());
    });
  }, []);

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.authentication?.idToken || googleResponse.params?.id_token;
    if (!idToken) {
      setStatus('Google sign-in did not return an ID token. Check OAuth client IDs.');
      return;
    }
    void run(async () => {
      await signInGoogleIdToken(idToken);
      setView('account');
    });
  }, [googleResponse]);

  useEffect(() => {refresh().catch((error) => setStatus(error.message));}, [refresh]);
  useEffect(() => {if (account && view === 'signIn') setView('account');}, [account, view]);

  useEffect(() => {
    function follow(response) {
      if (!response) return;
      const id = response.notification.request.content.data.listingId;
      if (typeof id === 'string') open(id);
      else go('browse');
      Notifications.clearLastNotificationResponse();
    }
    follow(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(follow);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!token || !account?.pushEnabled) return;
    let alive = true;
    (async () => {
      try {
        const pushToken = await resolveExpoPushToken();
        const cached = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
        if (!alive || !pushToken || pushToken === cached) return;
        await api('preferences', {method: 'PUT', data: {pushToken}});
        await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
      } catch {
        // Keep browsing if push re-registration fails.
      }
    })();
    return () => {alive = false;};
  }, [account?.pushEnabled, api, token]);

  const home = !directory && !filters.q;
  const currentSection = home ? homeCategory : filters.section;
  useEffect(() => {
    if (view !== 'browse') return;
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams(Object.entries(home ? {section: homeCategory} : filters).filter(([, v]) => v)).toString();
        const result = await api('listings?' + query);
        if (alive) {
          if (home) setCategoryPreview(result.items.slice(0, 3));
          else setList(result);
        }
      } catch (error) {if (alive) setStatus(error.message);}
      finally {if (alive) setLoading(false);}
    }, 220);
    return () => {alive = false; clearTimeout(timer);};
  }, [api, filters, home, homeCategory, view]);

  useEffect(() => {
    setItem(null);
    if (!selected) return;
    let alive = true;
    api('listings/' + selected).then((data) => {if (alive) setItem(data);})
      .catch((error) => {if (alive) setStatus(error.message);});
    return () => {alive = false;};
  }, [api, selected]);

  async function updatePush(enabled) {
    let pushToken = null;
    if (enabled) {
      pushToken = await resolveExpoPushToken();
      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
    } else {
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    }
    await api('preferences', {method: 'PUT', data: {pushToken}});
    await refresh();
  }

  const set = (key, value) => {setStatus(''); setFilters((previous) => ({...previous, [key]: value}));};
  const showSaved = saved.some(({id}) => id === item?.id);

  return <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content" />
    <View style={styles.nav}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fanos Tender, ፋኖስ ጨረታ, home" onPress={goHome} style={styles.brand}>
        <Image source={require('./assets/fanos-tender-icon.png')} style={styles.brandIcon} accessible={false} />
        <View style={styles.brandNames}>
          <Text style={styles.logo}>Fanos Tender</Text>
          <Text style={styles.amharic}>ፋኖስ ጨረታ</Text>
        </View>
      </Pressable>
      <Button label={account ? 'Profile' : 'Sign in'} onPress={() => go(account ? 'account' : 'signIn')} />
    </View>
    <ScrollView key={view + selected + (directory ? '-directory' : '')} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {!!status && <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text>}
      {view !== 'browse' && <Button label="← Browse bids" onPress={() => go('browse')} />}
      {view === 'vehiclePreview' && <VehiclePreview base={base} />}
      {view === 'saved' && <View style={styles.gap}>
        <Text accessibilityRole="header" style={styles.heading}>Saved</Text>
        {!account
          ? <><Text style={styles.body}>Sign in to see your saved tenders and vehicle lots.</Text><Button label="Sign in" active onPress={() => go('signIn')} /></>
          : saved.length ? <Cards items={saved} open={open} /> : <Text style={styles.body}>No saved opportunities yet.</Text>}
      </View>}
      {view === 'alerts' && <View style={styles.gap}>
        <Text accessibilityRole="header" style={styles.heading}>Alerts</Text>
        {!account ? <>
          <Text style={styles.body}>Sign in to manage email and Android push alerts for your saved searches.</Text>
          <Button label="Sign in" active onPress={() => go('signIn')} />
        </> : <>
          <Text style={styles.body}>Alerts follow your saved searches. Enable Android push to get matching updates on this device.</Text>
          <View style={styles.toggle}><Text style={styles.body}>Email alerts</Text><Switch accessibilityLabel="Email alerts" value={account.emailAlerts} onValueChange={(emailAlerts) => run(async () => {
            await api('preferences', {method: 'PUT', data: {emailAlerts}}); await refresh();
          })} /></View>
          <View style={styles.toggle}><Text style={styles.body}>Android push</Text><Switch accessibilityLabel="Android push" value={account.pushEnabled} onValueChange={(enabled) => run(() => updatePush(enabled))} /></View>
        </>}
      </View>}
      {view === 'signIn' && <View style={styles.gap}>
        <Text style={styles.heading}>{registerMode ? 'Create account' : 'Sign in'}</Text>
        <Text style={styles.body}>Continue with Google, or use email and password.</Text>
        {!firebaseConfigured() && <Text style={styles.notice}>Set EXPO_PUBLIC_FIREBASE_* in mobile/.env</Text>}
        <Button
          label="Continue with Google"
          active
          onPress={() => run(async () => {
            if (!googleRequest) throw new Error('Google sign-in is not ready. Set EXPO_PUBLIC_GOOGLE_* client IDs.');
            await promptGoogle();
          })}
        />
        <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.body}>By continuing you agree to the Terms of Use and Privacy Policy.</Text>
        {!!webBase && <View style={styles.row}>
          <Button label="Terms" onPress={() => Linking.openURL(webBase + '/terms')} />
          <Button label="Privacy" onPress={() => Linking.openURL(webBase + '/privacy')} />
        </View>}
        <Button label={registerMode ? 'Create account' : 'Sign in with email'} active onPress={() => run(async () => {
          if (!email.trim() || !password) throw new Error('Enter email and password.');
          if (registerMode) await registerEmail(email, password);
          else await signInEmail(email, password);
          setView('account');
        })} />
        <Button label={registerMode ? 'Already have an account? Sign in' : 'Need an account? Register'} onPress={() => setRegisterMode(!registerMode)} />
      </View>}
      {view === 'account' && account && <View style={styles.gap}>
        <Text style={styles.heading}>Profile</Text><Text style={styles.body}>{account.email}</Text>
        <Text style={styles.body}>{account.subscribed ? 'Subscription active until ' + date(account.expiresAt) : 'Free account'}</Text>
        <View style={styles.toggle}><Text style={styles.body}>Email alerts</Text><Switch accessibilityLabel="Email alerts" value={account.emailAlerts} onValueChange={(emailAlerts) => run(async () => {
          await api('preferences', {method: 'PUT', data: {emailAlerts}}); await refresh();
        })} /></View>
        <View style={styles.toggle}><Text style={styles.body}>Android push alerts</Text><Switch accessibilityLabel="Android push alerts" value={account.pushEnabled} onValueChange={(enabled) => run(() => updatePush(enabled))} /></View>
        <Text style={styles.heading}>Saved searches</Text>
        {searches.map((search) => <View key={search.id} style={styles.row}><Button label={search.label} onPress={() => {setDirectory(true); setFilters({...defaults, ...search.filters}); go('browse');}} /><Button label="Remove" onPress={() => run(async () => {
          await api('searches/' + search.id, {method: 'DELETE'}); await refresh();
        })} /></View>)}
        {!searches.length && <Text style={styles.body}>No saved searches yet.</Text>}
        <Text style={styles.heading}>Saved opportunities</Text><Cards items={saved} open={open} />
        {!saved.length && <Text style={styles.body}>No saved opportunities yet.</Text>}
        <Button label="Sign out" onPress={() => run(async () => {
          await signOutAuth();
          await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
          setToken(null); setAccount(null); setSaved([]); setSearches([]); go('browse');
        })} />
      </View>}
      {view === 'browse' && <View style={styles.gap}>
        {!directory && <>
          <Text accessibilityRole="header" style={styles.heading}>Browse Ethiopian bids</Text>
          <Text style={styles.body}>Pick a category, then open a notice. Bid with the issuer — not in this app.</Text>
          <View style={styles.categories}>
            {sections.map(([key, label]) => (
              <Pressable key={key} accessibilityRole="button" onPress={() => setHomeCategory(key)} style={[styles.category, homeCategory === key && styles.categoryOn]}>
                <Text style={[styles.categoryText, homeCategory === key && styles.categoryTextOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Button label={'Open ' + (sections.find(([key]) => key === homeCategory)?.[1] || 'directory')} active onPress={() => showDirectory(homeCategory)} />
          {!!categoryPreview.length && <>
            <Text style={styles.kicker}>Closing soon in this category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
              <Cards items={categoryPreview} open={open} width={Math.min(280, width - 48)} />
            </ScrollView>
          </>}
          <View style={styles.row}>
            <Button label="Saved" onPress={() => go('saved')} />
            <Button label="Alerts" onPress={() => go('alerts')} />
            {process.env.EXPO_PUBLIC_VEHICLE_REFERENCE_PREVIEW === 'true' && <Button label="Vehicle preview" onPress={() => go('vehiclePreview')} />}
          </View>
        </>}
        {directory && <>
          <Text accessibilityRole="header" style={styles.heading}>{sections.find(([key]) => key === currentSection)?.[1] || 'Directory'}</Text>
          <TextInput style={styles.input} placeholder="Search title, issuer, reference" value={filters.q} onChangeText={(value) => set('q', value)} />
          <Button label={showFilters ? 'Hide filters' : 'Show filters'} onPress={() => setShowFilters(!showFilters)} />
          {showFilters && <>
            <TextInput style={styles.input} placeholder="Region" value={filters.region} onChangeText={(value) => set('region', value)} />
            {currentSection === 'vehicle' && <>
              <Options label="Condition" value={filters.condition} onChange={(value) => set('condition', value)} options={[['', 'Any'], ['used', 'Used'], ['damaged', 'Damaged']]} />
              <TextInput style={styles.input} placeholder="Make" value={filters.make} onChangeText={(value) => set('make', value)} />
              <TextInput style={styles.input} placeholder="Model" value={filters.model} onChangeText={(value) => set('model', value)} />
            </>}
            <Options label="Access" value={filters.access} onChange={(value) => set('access', value)} options={[['', 'Any'], ['free', 'Free'], ['paid', 'Subscriber']]} />
          </>}
          {loading ? <Text style={styles.body}>Loading…</Text> : <Cards items={list.items} open={open} />}
          {!loading && !list.items.length && <Text style={styles.body}>No active listings match these filters.</Text>}
          <TextInput style={styles.input} placeholder="Name this search" value={searchName} onChangeText={setSearchName} />
          <Button label="Save search" onPress={() => run(async () => {
            if (!account) throw new Error('Sign in to save a search.');
            if (!searchName.trim()) throw new Error('Enter a search name.');
            await api('searches', {method: 'POST', data: {label: searchName.trim(), filters}});
            setSearchName(''); await refresh();
          })} />
        </>}
      </View>}
      {view === 'detail' && item && <View style={styles.gap}>
        <Text accessibilityRole="header" style={styles.heading}>{item.title}</Text>
        <Text style={styles.kicker}>{item.condition ?? item.sector} · {item.access === 'paid' ? 'Subscriber' : 'Free'} · {item.status}</Text>
        <Text style={styles.body}>{item.issuer}{item.region ? ' · ' + item.region : ''}</Text>
        <Text style={styles.body}>Closes {date(item.deadline)}</Text>
        {item.cover && <Image source={{uri: photo(item.cover), headers: token ? {Authorization: 'Bearer ' + token} : {}}} style={styles.hero} accessibilityLabel={item.title} />}
        {item.locked ? <Text style={styles.notice}>Subscribe on the website to unlock bidding instructions{item.vehicle ? ' and extra photos' : ''}.</Text> : <>
          {item.details?.description && <Text style={styles.body}>{item.details.description}</Text>}
          {item.details?.instructions && <DetailDisclosure label="Bidding instructions" content={item.details.instructions} active />}
          {item.details?.location && <Text style={styles.body}>Location: {item.details.location}</Text>}
          {item.photos?.length > 1 && <View style={styles.gap}>
            <Text style={styles.kicker}>Photos</Text>
            {item.photos.filter((id) => id !== item.cover).map((id) => <Image key={id} source={{uri: photo(id), headers: token ? {Authorization: 'Bearer ' + token} : {}}} style={styles.cover} />)}
          </View>}
        </>}
        <Button label={showSaved ? 'Remove from saved' : 'Save'} onPress={() => run(async () => {
          if (!account) throw new Error('Sign in to save listings.');
          await api('saved/' + item.id, {method: showSaved ? 'DELETE' : 'PUT'});
          await refresh();
        })} />
        {!!webBase && <Button label="Open on website" onPress={() => Linking.openURL(webBase + '/?bid=' + item.id)} />}
      </View>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FAF8F5'},
  nav: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5DFD5', backgroundColor: '#fff'},
  brand: {flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1},
  brandIcon: {width: 32, height: 32},
  brandNames: {gap: 1},
  logo: {fontWeight: '800', color: '#1B4332', fontSize: 16},
  amharic: {fontSize: 11, color: '#6E695F'},
  container: {padding: 16, gap: 12, paddingBottom: 40},
  gap: {gap: 10},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  heading: {fontSize: 22, fontWeight: '800', color: '#16201B'},
  body: {fontSize: 14, lineHeight: 20, color: '#6E695F'},
  kicker: {fontSize: 12, fontWeight: '700', color: '#1B4332', textTransform: 'uppercase'},
  notice: {backgroundColor: '#FDF2F2', color: '#9B1C1C', padding: 10, borderRadius: 8, overflow: 'hidden'},
  button: {borderWidth: 1, borderColor: '#1B4332', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff'},
  active: {backgroundColor: '#1B4332'},
  buttonText: {color: '#1B4332', fontWeight: '700'},
  activeText: {color: '#fff'},
  input: {borderWidth: 1, borderColor: '#E5DFD5', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#16201B'},
  card: {backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5DFD5', overflow: 'hidden'},
  cardBody: {padding: 12, gap: 4},
  cardTitle: {fontSize: 16, fontWeight: '700', color: '#16201B'},
  cover: {width: '100%', height: 140, backgroundColor: '#EFEBE1'},
  hero: {width: '100%', height: 220, borderRadius: 12, backgroundColor: '#EFEBE1'},
  categories: {gap: 8},
  category: {borderWidth: 1, borderColor: '#E5DFD5', borderRadius: 12, padding: 12, backgroundColor: '#fff'},
  categoryOn: {borderColor: '#1B4332', backgroundColor: '#EAF7EE'},
  categoryText: {fontWeight: '700', color: '#16201B'},
  categoryTextOn: {color: '#1B4332'},
  previewRow: {gap: 10, paddingVertical: 4},
  toggle: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5DFD5', paddingHorizontal: 12, paddingVertical: 8},
  damage: {color: '#96422A'},
});
