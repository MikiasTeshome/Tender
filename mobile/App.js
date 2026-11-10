import 'react-native-url-polyfill/auto';
import React, {useCallback, useEffect, useState} from 'react';
import {AppState, Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {createClient, processLock} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import VehiclePreview from './VehiclePreview';

Notifications.setNotificationHandler({
  handleNotification:async () => ({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:false,shouldSetBadge:false}),
});

const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/,'') ?? '';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const auth = supabaseUrl && supabaseKey ? createClient(supabaseUrl,supabaseKey,{
  auth:{
    storage:{getItem:SecureStore.getItemAsync,setItem:SecureStore.setItemAsync,removeItem:SecureStore.deleteItemAsync},
    persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,lock:processLock,
  },
}).auth : null;

const sections = [['public','Public tenders','Government procurement'],['ngo','NGO tenders','Development and humanitarian work'],['private','Private tenders','Company procurement'],['vehicle','Vehicle bids','Fleet, damaged and salvage vehicles']];
const defaults = {section:'',q:'',region:'',access:'',deadline:'',condition:'',make:'',model:''};
const format = new Intl.DateTimeFormat('en-ET',{timeZone:'Africa/Addis_Ababa',dateStyle:'medium',timeStyle:'short'});
const date = (value) => format.format(new Date(value)) + ' EAT';
function closesIn(value,status) {
  if (status !== 'active') return status;
  const days = Math.ceil((new Date(value) - Date.now()) / 86400000);
  if (days <= 1) return 'Closes today';
  if (days === 2) return 'Closes tomorrow';
  return 'Closes in ' + days + ' days';
}
const photo = (id) => base + '/api/photos/' + id;

function Button({label,onPress,active=false}) {
  return <Pressable accessibilityRole="button" style={[styles.button,active && styles.active]} onPress={onPress}>
    <Text style={[styles.buttonText,active && styles.activeText]}>{label}</Text>
  </Pressable>;
}

function Cards({items,open}) {
  return items.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item.id)} style={styles.card}>
    {item.cover && <Image source={{uri:photo(item.cover)}} style={styles.cover} accessibilityLabel={item.title} />}
    <View style={styles.cardBody}>
      <Text style={styles.kicker}>{item.condition ?? item.sector} · {item.access === 'paid' ? 'Subscriber' : 'Free'}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {!!item.issuer && <Text style={styles.body}>{item.issuer}</Text>}
      <Text style={styles.body}>{closesIn(item.deadline,item.status)} · {date(item.deadline)}</Text>
    </View>
  </Pressable>);
}

function Options({label,value,onChange,options}) {
  return <View style={styles.gap}><Text style={styles.kicker}>{label}</Text><View style={styles.row}>
    {options.map(([key,name]) => <Button key={key} label={name} active={key === value} onPress={() => onChange(key)} />)}
  </View></View>;
}

export default function App() {
  const [session,setSession] = useState(null);
  const [account,setAccount] = useState(null);
  const [view,setView] = useState('browse');
  const [filters,setFilters] = useState(defaults);
  const [showFilters,setShowFilters] = useState(false);
  const [list,setList] = useState({items:[]});
  const [vehicles,setVehicles] = useState([]);
  const [saved,setSaved] = useState([]);
  const [searches,setSearches] = useState([]);
  const [searchName,setSearchName] = useState('');
  const [selected,setSelected] = useState('');
  const [item,setItem] = useState(null);
  const [email,setEmail] = useState('');
  const [code,setCode] = useState('');
  const [sent,setSent] = useState(false);
  const [status,setStatus] = useState('');
  const [loading,setLoading] = useState(false);
  const token = session?.access_token;
  const api = useCallback(async (path,{data,...options}={}) => {
    if (!base) throw new Error('Set the API URL to connect the app.');
    const response = await fetch(base + '/api/' + path,{
      ...options,headers:{...(token ? {Authorization:'Bearer ' + token} : {}),...(data ? {'Content-Type':'application/json'} : {})},
      body:data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? 'Request failed.');
    return response.json();
  },[token]);
  const refresh = useCallback(async () => {
    if (!token) {setAccount(null);setSaved([]);setSearches([]);return;}
    const [profile,bookmarks,queries] = await Promise.all([api('me'),api('saved'),api('searches')]);
    setAccount(profile);setSaved(bookmarks);setSearches(queries);
  },[api,token]);

  function open(id) {
    setStatus('');setSelected(id);setView('detail');
  }
  function go(next) {setStatus('');setSelected('');setView(next);}
  async function run(action) {
    setStatus('');
    try {await action();} catch (error) {setStatus(error.message);}
  }
  useEffect(() => {
    if (!auth) return;
    auth.getSession().then(({data}) => setSession(data.session));
    const {data:{subscription}} = auth.onAuthStateChange((_event,next) => setSession(next));
    const listener = AppState.addEventListener('change',(state) => state === 'active' ? auth.startAutoRefresh() : auth.stopAutoRefresh());
    if (AppState.currentState === 'active') auth.startAutoRefresh();
    return () => {subscription.unsubscribe();listener.remove();auth.stopAutoRefresh();};
  },[]);
  useEffect(() => {refresh().catch((error) => setStatus(error.message));},[refresh]);
  useEffect(() => {if (account && view === 'signIn') setView('account');},[account,view]);
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
  },[]);
  const home = !Object.values(filters).some(Boolean);
  useEffect(() => {
    if (view !== 'browse') return;
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams(Object.entries(filters).filter(([,v]) => v)).toString();
        const [result,gallery] = await Promise.all([api('listings?' + query),home ? api('listings?section=vehicle') : null]);
        if (alive) {setList(result);if (gallery) setVehicles(gallery.items.slice(0,3));}
      } catch (error) {if (alive) setStatus(error.message);}
      finally {if (alive) setLoading(false);}
    },220);
    return () => {alive=false;clearTimeout(timer);};
  },[api,filters,home,view]);
  useEffect(() => {
    setItem(null);
    if (!selected) return;
    let alive = true;
    api('listings/' + selected).then((data) => {if (alive) setItem(data);})
      .catch((error) => {if (alive) setStatus(error.message);});
    return () => {alive=false;};
  },[api,selected]);

  async function updatePush(enabled) {
    let pushToken = null;
    if (enabled) {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default',{name:'Tender alerts',importance:Notifications.AndroidImportance.DEFAULT});
      }
      const {status:permission} = await Notifications.requestPermissionsAsync();
      if (permission !== 'granted') throw new Error('Allow notifications in your device settings.');
      const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
      if (!projectId) throw new Error('Android notifications are being configured.');
      pushToken = (await Notifications.getExpoPushTokenAsync({projectId})).data;
    }
    await api('preferences',{method:'PUT',data:{pushToken}});
    await refresh();
  }
  const set = (key,value) => {setStatus('');setFilters((previous) => ({...previous,[key]:value}));};
  const showSaved = saved.some(({id}) => id === item?.id);
  return <SafeAreaView style={styles.root}>
    <View style={styles.nav}><Text style={styles.logo}>Bid Ethiopia</Text><Button label={account ? 'My account' : 'Sign in'} onPress={() => go(account ? 'account' : 'signIn')} /></View>
    <ScrollView key={view + selected} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {!!status && <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text>}
      {view !== 'browse' && <Button label="← Browse bids" onPress={() => go('browse')} />}
      {view === 'vehiclePreview' && <VehiclePreview base={base} />}
      {view === 'signIn' && <View style={styles.gap}>
        <Text style={styles.heading}>Sign in with email</Text>
        <TextInput style={styles.input} placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" editable={!sent} />
        {sent && <TextInput style={styles.input} placeholder="Sign-in code" value={code} onChangeText={setCode} keyboardType="numeric" />}
        <Button label={sent ? 'Verify code' : 'Send sign-in code'} active onPress={() => run(async () => {
          if (!auth) throw new Error('Email sign-in is being configured.');
          const {error} = sent ? await auth.verifyOtp({email,token:code,type:'email'}) : await auth.signInWithOtp({email});
          if (error) throw error;
          if (!sent) {setSent(true);setStatus('Check your email for your sign-in code.');}
        })} />
        {sent && <Button label="Use another email" onPress={() => {setSent(false);setCode('');setStatus('');}} />}
      </View>}
      {view === 'account' && account && <View style={styles.gap}>
        <Text style={styles.heading}>My account</Text><Text style={styles.body}>{account.email}</Text>
        <Text style={styles.body}>{account.subscribed ? 'Subscription active until ' + date(account.expiresAt) : 'Free account'}</Text>
        <View style={styles.toggle}><Text style={styles.body}>Email alerts</Text><Switch accessibilityLabel="Email alerts" value={account.emailAlerts} onValueChange={(emailAlerts) => run(async () => {
          await api('preferences',{method:'PUT',data:{emailAlerts}});await refresh();
        })} /></View>
        <View style={styles.toggle}><Text style={styles.body}>Android push alerts</Text><Switch accessibilityLabel="Android push alerts" value={account.pushEnabled} onValueChange={(enabled) => run(() => updatePush(enabled))} /></View>
        <Text style={styles.heading}>Saved searches</Text>
        {searches.map((search) => <View key={search.id} style={styles.row}><Button label={search.label} onPress={() => {setFilters({...defaults,...search.filters});go('browse');}} /><Button label="Remove" onPress={() => run(async () => {
          await api('searches/' + search.id,{method:'DELETE'});await refresh();
        })} /></View>)}
        {!searches.length && <Text style={styles.body}>No saved searches yet.</Text>}
        <Text style={styles.heading}>Saved opportunities</Text><Cards items={saved} open={open} />
        {!saved.length && <Text style={styles.body}>No saved opportunities yet.</Text>}
        <Button label="Sign out" onPress={() => run(async () => {await auth.signOut();setSent(false);setCode('');go('browse');})} />
      </View>}
      {view === 'detail' && !item && !status && <Text style={styles.body}>Loading opportunity…</Text>}
      {view === 'detail' && item && <View style={styles.gap}>
        {item.vehicle && !!item.cover && <Image source={{uri:photo(item.cover)}} style={styles.cover} accessibilityLabel={item.title} />}
        <Text style={styles.kicker}>{item.vehicle ? 'Vehicle bid' : item.sector} · {item.access === 'paid' ? (item.locked ? 'Paid listing' : 'Unlocked') : 'Free access'}</Text>
        <Text style={styles.heading}>{item.title}</Text><Text style={styles.body}>{closesIn(item.deadline,item.status)} · {date(item.deadline)}</Text>
        {!!item.condition && <Text style={styles.kicker}>{item.condition}</Text>}
        {Object.entries({Issuer:item.issuer,Region:item.region,Location:item.details?.location,Reference:item.details?.reference,Lot:item.details?.lot}).filter(([,value]) => value).map(([key,value]) => <View key={key}><Text style={styles.kicker}>{key}</Text><Text style={styles.body}>{value}</Text></View>)}
        {item.locked ? <>
          <Text style={styles.notice}>Issuer, reference, lot, and closing stay visible. Subscribe on the website to unlock bidding instructions{item.vehicle ? ' and extra photos' : ''}.</Text>
          <Button label="Open subscriptions on website" active onPress={() => run(() => Linking.openURL((base || 'https://bidethiopia.et') + '/?screen=plans'))} />
        </> : <>
            <View style={styles.notice}>
              <Text style={styles.cardTitle}>Bid with the issuer</Text>
              {!!item.details?.instructions && <Text style={styles.body}>{item.details.instructions}</Text>}
              {!!item.details?.sourceUrl && <Button label="Open the issuer's notice ↗" active onPress={() => run(() => Linking.openURL(item.details.sourceUrl))} />}
            </View>
            {Object.entries({Make:item.details?.make,Model:item.details?.model,Year:item.details?.year,Mileage:item.details?.mileage}).filter(([,value]) => value).map(([key,value]) => <View key={key}><Text style={styles.kicker}>{key}</Text><Text style={styles.body}>{value}</Text></View>)}
            {item.vehicle && item.photos?.some((id) => id !== item.cover) && item.photos.filter((id) => id !== item.cover).map((id) => <Image key={id} source={{uri:photo(id),headers:token ? {Authorization:'Bearer ' + token} : {}}} style={styles.cover} accessibilityLabel="Another photo of this lot" />)}
            {!!item.details?.inspection && <View><Text style={styles.kicker}>Condition notes</Text><Text style={styles.body}>{item.details.inspection}</Text></View>}
            {!!item.details?.description && <View><Text style={styles.kicker}>Notice details</Text><Text style={styles.body}>{item.details.description}</Text></View>}
          </>}
        <Button label={showSaved ? 'Remove from saved' : 'Save opportunity'} onPress={() => account ? run(async () => {
          await api('saved/' + item.id,{method:showSaved ? 'DELETE' : 'PUT'});await refresh();
        }) : go('signIn')} />
      </View>}
      {view === 'browse' && <>
        <Text style={styles.heading}>Active bids</Text>
        <Text style={styles.body}>Find a notice, check a vehicle, then submit the bid with the issuer.</Text>
        <TextInput accessibilityLabel="Search tenders and vehicles" placeholder="Search tenders and vehicles" style={styles.input} value={filters.q} onChangeText={(value) => set('q',value)} />
        <View style={styles.categoryGrid}>
          {sections.map(([section,label,hint]) => <Pressable key={section} accessibilityRole="button" accessibilityState={{selected:filters.section === section}}
            style={[styles.category,filters.section === section && styles.active]} onPress={() => {setStatus('');setShowFilters(false);setFilters({...defaults,section:filters.section === section ? '' : section});}}>
            <Text style={[styles.buttonText,filters.section === section && styles.activeText]}>{label}</Text>
            <Text style={[styles.body,filters.section === section && styles.activeText]}>{hint}</Text>
          </Pressable>)}
        </View>
        {home && <><Text style={styles.heading}>Vehicle bids</Text><Text style={styles.body}>Use the photo, condition, and closing time to choose a lot.</Text><Cards items={vehicles} open={open} />
          {process.env.EXPO_PUBLIC_VEHICLE_REFERENCE_PREVIEW === 'true' && <Button label="Open vehicle design preview" onPress={() => go('vehiclePreview')} />}
          {!vehicles.length && <Text style={styles.body}>Available company vehicles will appear here.</Text>}</>}
        <Text style={styles.heading}>{sections.find(([id]) => id === filters.section)?.[1] ?? 'Open tenders'}</Text>
        <Button label={showFilters ? 'Hide filters' : 'Filters'} onPress={() => setShowFilters(!showFilters)} />
        {showFilters && <>
        {[['region','Filter by region'],...(filters.section === 'vehicle' ? [['make','Filter by make'],['model','Filter by model']] : [])].map(([key,label]) =>
          <TextInput key={key} accessibilityLabel={label} placeholder={label} style={styles.input} value={filters[key]} onChangeText={(value) => set(key,value)} />)}
        <Options label="Access" value={filters.access} onChange={(value) => set('access',value)} options={[[ '', 'Any'],['free','Free'],['paid','Subscriber']]} />
        <Options label="Closing" value={filters.deadline} onChange={(value) => set('deadline',value)} options={[[ '', 'Any'],['today','Today'],['week','7 days'],['month','30 days']]} />
        {filters.section === 'vehicle' && <Options label="Condition" value={filters.condition} onChange={(value) => set('condition',value)} options={[[ '', 'Any'],['used','Used'],['damaged','Damaged'],['salvage','Salvage']]} />}
        <Button label="Clear filters" onPress={() => {setStatus('');setFilters({...defaults,section:filters.section});}} />
        </>}
        {account && <View style={styles.gap}><TextInput accessibilityLabel="Saved search name" style={styles.input} placeholder="Name this search" value={searchName} onChangeText={setSearchName} />
          <Button label="Save search" onPress={() => run(async () => {
            await api('searches',{method:'POST',data:{label:searchName,filters}});setSearchName('');await refresh();setStatus('Search saved.');
          })} /></View>}
        {loading ? <Text style={styles.body}>Loading opportunities…</Text> : <Cards items={(home ? list.items.filter((entry) => !entry.vehicle) : list.items)} open={open} />}
        {!loading && !status && !(home ? list.items.some((entry) => !entry.vehicle) : list.items.length) && <Text style={styles.body}>No active opportunities match these filters.</Text>}
        {list.next && !loading && <Button label="Load more" onPress={() => run(async () => {
          const query = new URLSearchParams(Object.entries({...filters,page:list.next}).filter(([,v]) => v));
          const result = await api('listings?' + query);
          setList({next:result.next,items:[...new Map([...list.items,...result.items].map((entry) => [entry.id,entry])).values()]});
        })} />}
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#f4f8f3',paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight : 0},
  nav:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  logo:{fontSize:21,fontWeight:'800',color:'#133b33'},container:{padding:16,gap:14,paddingBottom:48},
  categoryGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  category:{flexBasis:'46%',flexGrow:1,minHeight:80,padding:12,gap:5,borderWidth:1,borderColor:'#b5c8bc',borderRadius:12,backgroundColor:'#fff'},
  categoryIcon:{fontSize:21,color:'#133b33'},
  heading:{fontSize:25,fontWeight:'800',color:'#14382e'},
  body:{color:'#425e53',lineHeight:21},kicker:{color:'#366951',fontSize:12,fontWeight:'800',textTransform:'uppercase'},
  row:{flexDirection:'row',flexWrap:'wrap',gap:7},gap:{gap:10},toggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  button:{backgroundColor:'#fff',borderWidth:1,borderColor:'#b5c8bc',paddingHorizontal:12,paddingVertical:9,borderRadius:8,alignSelf:'flex-start'},
  active:{backgroundColor:'#133b33',borderColor:'#133b33'},buttonText:{color:'#173e33',fontWeight:'700'},activeText:{color:'#fff'},
  card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d7e2dc',borderRadius:12,overflow:'hidden'},
  cardBody:{padding:13,gap:6},cardTitle:{fontSize:17,color:'#14382e',fontWeight:'700'},
  cover:{width:'100%',aspectRatio:16/9,backgroundColor:'#deebe0',borderRadius:8},
  input:{borderWidth:1,borderColor:'#b5c8bc',borderRadius:8,backgroundColor:'#fff',padding:11,color:'#14382e'},
  notice:{padding:12,borderRadius:8,backgroundColor:'#e3eedf',color:'#204b3b'},
});


