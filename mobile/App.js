import 'react-native-url-polyfill/auto';
import React, {useCallback, useEffect, useState} from 'react';
import {AppState, Image, Linking, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions} from 'react-native';
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

const sections = [['public','Public Tenders','▤'],['ngo','NGO Tenders','◎'],['private','Private Tenders','▦'],['vehicle','Vehicle Bids','▰']];
const defaults = {section:'',q:'',region:'',access:'',deadline:'',condition:'',make:'',model:''};
const format = new Intl.DateTimeFormat('en-ET',{timeZone:'Africa/Addis_Ababa',dateStyle:'medium',timeStyle:'short'});
const date = (value) => format.format(new Date(value)) + ' EAT';
const photo = (id) => base + '/api/photos/' + id;

function Button({label,onPress,active=false}) {
  return <Pressable accessibilityRole="button" style={[styles.button,active && styles.active]} onPress={onPress}>
    <Text style={[styles.buttonText,active && styles.activeText]}>{label}</Text>
  </Pressable>;
}

function DetailDisclosure({label,content,active,children}) {
  const [expanded,setExpanded] = useState(false);
  return <View style={styles.gap}>
    <Pressable accessibilityRole="button" accessibilityState={{expanded}} style={[styles.button,active && styles.active]} onPress={() => setExpanded(!expanded)}>
      <Text style={[styles.buttonText,active && styles.activeText]}>{label} {expanded ? '−' : '+'}</Text>
    </Pressable>
    {expanded && <>{!!content && <Text style={styles.body}>{content}</Text>}{children}</>}
  </View>;
}

function conditionStyle(condition) {
  return ['damaged','salvage'].includes(condition?.toLowerCase()) ? styles.damage : null;
}

function Cards({items,open,width}) {
  return items.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => open(item.id)} style={[styles.card,width && {width}]}>
    {item.cover && <Image source={{uri:photo(item.cover)}} style={styles.cover} accessibilityLabel={item.title} />}
    <View style={styles.cardBody}>
      <Text style={[styles.kicker,conditionStyle(item.condition)]}>{item.condition ?? item.sector} · {item.access === 'paid' ? 'Subscriber' : 'Free'}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.vehicle && <Text style={styles.kicker}>View vehicle →</Text>}
      {!item.vehicle && item.issuer && <Text style={styles.body}>{item.issuer}</Text>}
      <Text style={styles.body}>{item.status === 'active' ? 'Closes' : item.status} · {date(item.deadline)}</Text>
    </View>
  </Pressable>);
}

function Options({label,value,onChange,options}) {
  return <View style={styles.gap}><Text style={styles.kicker}>{label}</Text><View style={styles.row}>
    {options.map(([key,name]) => <Button key={key} label={name} active={key === value} onPress={() => onChange(key)} />)}
  </View></View>;
}

export default function App() {
  const {width} = useWindowDimensions();
  const [session,setSession] = useState(null);
  const [account,setAccount] = useState(null);
  const [view,setView] = useState('browse');
  const [homeCategory,setHomeCategory] = useState('vehicle');
  const [directory,setDirectory] = useState(false);
  const [filters,setFilters] = useState(defaults);
  const [showFilters,setShowFilters] = useState(false);
  const [list,setList] = useState({items:[]});
  const [categoryPreview,setCategoryPreview] = useState([]);
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
  function goHome() {setDirectory(false);setFilters(defaults);setShowFilters(false);go('browse');}
  function showDirectory(section) {
    setList({items:[]});setDirectory(true);setFilters({...defaults,section});setShowFilters(false);go('browse');
  }
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
  const home = !directory && !filters.q;
  const currentSection = home ? homeCategory : filters.section;
  useEffect(() => {
    if (view !== 'browse') return;
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams(Object.entries(home ? {section:homeCategory} : filters).filter(([,v]) => v)).toString();
        const result = await api('listings?' + query);
        if (alive) {
          if (home) setCategoryPreview(result.items.slice(0,3));
          else setList(result);
        }
      } catch (error) {if (alive) setStatus(error.message);}
      finally {if (alive) setLoading(false);}
    },220);
    return () => {alive=false;clearTimeout(timer);};
  },[api,filters,home,homeCategory,view]);
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
    <StatusBar barStyle="dark-content" />
    <View style={styles.nav}><Pressable accessibilityRole="button" accessibilityLabel="Bid Ethiopia home" onPress={goHome}><Text style={styles.logo}>Bid Ethiopia</Text></Pressable><Button label={account ? 'Profile' : 'Sign in'} onPress={() => go(account ? 'account' : 'signIn')} /></View>
    <ScrollView key={view + selected + (directory ? '-directory' : '')} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {!!status && <Text accessibilityLiveRegion="polite" style={styles.notice}>{status}</Text>}
      {view !== 'browse' && <Button label="← Browse bids" onPress={() => go('browse')} />}
      {view === 'vehiclePreview' && <VehiclePreview base={base} />}
      {view === 'saved' && <View style={styles.gap}>
        <Text accessibilityRole="header" style={styles.heading}>Saved</Text>
        {account ? (saved.length ? <Cards items={saved} open={open} /> : <Text style={styles.body}>No saved opportunities yet.</Text>) :
          <><Text style={styles.body}>Sign in to see your saved tenders and vehicle lots.</Text><Button label="Sign in" active onPress={() => go('signIn')} /></>}
      </View>}
      {view === 'alerts' && <View style={styles.gap}>
        <Text accessibilityRole="header" style={styles.heading}>Alerts</Text>
        <Text style={styles.body}>{account ? 'Manage alerts for your saved searches.' : 'Sign in to set up tender and vehicle alerts.'}</Text>
        <Button label={account ? 'Manage alerts' : 'Sign in'} active onPress={() => go(account ? 'account' : 'signIn')} />
      </View>}
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
        {searches.map((search) => <View key={search.id} style={styles.row}><Button label={search.label} onPress={() => {setDirectory(true);setFilters({...defaults,...search.filters});go('browse');}} /><Button label="Remove" onPress={() => run(async () => {
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
        <Text style={styles.kicker}>{item.vehicle ? 'Vehicle bid' : item.sector} · {item.access === 'paid' ? 'Subscriber' : 'Free'}</Text>
        <Text accessibilityRole="header" style={styles.heading}>{item.title}</Text>
        <View style={styles.deadline}>
          <Text style={styles.kicker}>{item.status === 'active' ? 'Closing time' : item.status}</Text>
          <Text style={styles.body}>{date(item.deadline)}</Text>
        </View>
        {item.condition && <Text style={[styles.kicker,conditionStyle(item.condition)]}>{item.condition}</Text>}
        {item.locked ? <Text style={styles.notice}>An active subscription is required to see the issuer and bidding instructions.</Text> :
          <>
            {Object.entries({Issuer:item.issuer,Region:item.region,Location:item.details.location,Reference:item.details.reference,Lot:item.details.lot,
              Make:item.details.make,Model:item.details.model,Year:item.details.year,Mileage:item.details.mileage,'Notice details':item.details.description}).filter(([,value]) => value).map(([key,value]) => <View key={key}><Text style={styles.kicker}>{key}</Text><Text style={styles.body}>{value}</Text></View>)}
            {item.vehicle && item.photos.some((id) => id !== item.cover) && <DetailDisclosure key={item.id + '-photos'} label="More photos">
              {item.photos.filter((id) => id !== item.cover).map((id) => <Image key={id} source={{uri:photo(id),headers:token ? {Authorization:'Bearer ' + token} : {}}} style={styles.cover} />)}
            </DetailDisclosure>}
            {item.details.inspection && <DetailDisclosure key={item.id + '-inspection'} label="Inspection notes" content={item.details.inspection} />}
            {item.details.instructions ? <DetailDisclosure key={item.id + '-instructions'} label="View bidding instructions" content={item.details.instructions} active>
              {!!item.details.sourceUrl && <Button label="Open original notice ↗" onPress={() => run(() => Linking.openURL(item.details.sourceUrl))} />}
            </DetailDisclosure> : !!item.details.sourceUrl && <Button label="View bidding instructions ↗" active onPress={() => run(() => Linking.openURL(item.details.sourceUrl))} />}
          </>}
        <Button label={showSaved ? 'Remove from saved' : 'Save opportunity'} onPress={() => account ? run(async () => {
          await api('saved/' + item.id,{method:showSaved ? 'DELETE' : 'PUT'});await refresh();
        }) : go('signIn')} />
      </View>}
      {view === 'browse' && <>
        {!home && <Text accessibilityRole="header" style={styles.heading}>{sections.find(([id]) => id === currentSection)?.[1] ?? 'Search results'}</Text>}
        <TextInput accessibilityLabel="Search tenders and vehicles" placeholder="Search tenders and vehicles" style={styles.input} value={filters.q} onChangeText={(value) => set('q',value)} />
        {home ? <>
        <Text accessibilityRole="header" style={styles.heading}>Categories</Text>
        <View style={styles.categoryGrid} accessibilityRole="tablist">
          {sections.map(([section,label,icon]) => <Pressable key={section} accessibilityRole="tab" accessibilityState={{selected:homeCategory === section}}
            style={[styles.category,homeCategory === section && styles.active]} onPress={() => {if (section !== homeCategory) {setCategoryPreview([]);setStatus('');setHomeCategory(section);}}}>
            <Text style={[styles.categoryIcon,homeCategory === section && styles.activeText]}>{icon}</Text>
            <Text style={[styles.buttonText,homeCategory === section && styles.activeText]}>{label}</Text>
          </Pressable>)}
        </View>
        <View style={styles.sectionTitle}>
          <Text accessibilityRole="header" style={styles.heading}>{sections.find(([id]) => id === homeCategory)[1]}</Text>
          <Button label="View all ›" onPress={() => showDirectory(homeCategory)} />
        </View>
        {homeCategory === 'vehicle' ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}><Cards items={categoryPreview} open={open} width={Math.min(width - 64, 330)} /></ScrollView> : <Cards items={categoryPreview} open={open} />}
        {loading && <Text style={styles.body}>Loading opportunities…</Text>}
        {!loading && !status && !categoryPreview.length && <Text style={styles.body}>No active opportunities in this category.</Text>}
          {process.env.EXPO_PUBLIC_VEHICLE_REFERENCE_PREVIEW === 'true' && <Button label="Open vehicle design preview" onPress={() => go('vehiclePreview')} />}
        </> : <>
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
        {loading ? <Text style={styles.body}>Loading opportunities…</Text> : <Cards items={list.items} open={open} />}
        {!loading && !status && !list.items.length && <Text style={styles.body}>No active opportunities match these filters.</Text>}
        {list.next && !loading && <Button label="Load more" onPress={() => run(async () => {
          const query = new URLSearchParams(Object.entries({...filters,page:list.next}).filter(([,v]) => v));
          const result = await api('listings?' + query);
          setList({next:result.next,items:[...new Map([...list.items,...result.items].map((entry) => [entry.id,entry])).values()]});
        })} />}
        </>}
      </>}
    </ScrollView>
    <View style={styles.bottomNav}>
      {[
        ['Home','⌂',view === 'browse' && home,goHome],
        ['Vehicles','▰',view === 'browse' && !home && filters.section === 'vehicle',() => showDirectory('vehicle')],
        ['Saved','▮',view === 'saved',() => go('saved')],
        ['Alerts','◉',view === 'alerts',() => go('alerts')],
      ].map(([label,icon,active,onPress]) => <Pressable key={label} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{selected:active}} onPress={onPress} style={[styles.navTab,active && styles.navTabActive]}>
        <Text style={styles.navIcon}>{icon}</Text><Text style={styles.navLabel}>{label}</Text>
      </Pressable>)}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#fafaf4',paddingTop:Platform.OS === 'android' ? StatusBar.currentHeight : 0},
  nav:{backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  logo:{fontSize:26,fontFamily:'serif',fontWeight:'700',color:'#1b4332'},container:{padding:16,gap:14,paddingBottom:24},
  sectionTitle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10},
  gallery:{gap:12},
  deadline:{gap:4,padding:12,backgroundColor:'#e3eedf',borderRadius:10},
  bottomNav:{flexDirection:'row',gap:4,padding:8,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#d7e2dc'},
  navTab:{flex:1,minHeight:52,justifyContent:'center',alignItems:'center',gap:2,borderRadius:14},
  navTabActive:{backgroundColor:'#d8f3dc'},
  navIcon:{color:'#1b4332',fontSize:21,lineHeight:24},
  navLabel:{color:'#1b4332',fontSize:12,fontWeight:'700'},
  categoryGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},
  category:{flexBasis:'46%',flexGrow:1,minHeight:80,padding:12,gap:5,borderWidth:1,borderColor:'#b5c8bc',borderRadius:12,backgroundColor:'#fff'},
  categoryIcon:{fontSize:21,color:'#1b4332'},
  heading:{fontSize:26,fontFamily:'serif',fontWeight:'700',color:'#1b4332'},
  body:{color:'#425e53',lineHeight:21},kicker:{color:'#366951',fontSize:12,fontWeight:'800',textTransform:'uppercase'},
  damage:{color:'#92400e',backgroundColor:'#fef3c7',alignSelf:'flex-start',borderRadius:6,paddingHorizontal:8,paddingVertical:4},
  row:{flexDirection:'row',flexWrap:'wrap',gap:7},gap:{gap:10},toggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  button:{backgroundColor:'#fff',borderWidth:1,borderColor:'#b5c8bc',paddingHorizontal:12,paddingVertical:11,minHeight:44,justifyContent:'center',borderRadius:8,alignSelf:'flex-start'},
  active:{backgroundColor:'#1b4332',borderColor:'#1b4332'},buttonText:{color:'#173e33',fontWeight:'700'},activeText:{color:'#fff'},
  card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d7e2dc',borderRadius:12,overflow:'hidden'},
  cardBody:{padding:13,gap:6},cardTitle:{fontSize:17,color:'#14382e',fontWeight:'700'},
  cover:{width:'100%',aspectRatio:16/9,backgroundColor:'#deebe0',borderRadius:8},
  input:{borderWidth:1,borderColor:'#b5c8bc',borderRadius:8,backgroundColor:'#fff',padding:11,color:'#14382e'},
  notice:{padding:12,borderRadius:8,backgroundColor:'#e3eedf',color:'#204b3b'},
});


