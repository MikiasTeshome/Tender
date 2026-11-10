'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Admin from './staff.jsx';
import { Icon, sectionIcons, conditionLabel } from './stitch-ui.jsx';

const sections = [
  ['public','public','publicHint'],
  ['ngo','ngo','ngoHint'],
  ['private','private','privateHint'],
  ['vehicle','vehicle','vehicleHint'],
];
const terms = {1:'Monthly',3:'Quarterly',6:'Half-year',12:'Annual'};
const deadline = new Intl.DateTimeFormat('en-ET',{timeZone:'Africa/Addis_Ababa',dateStyle:'medium',timeStyle:'short'});
const format = (value) => deadline.format(new Date(value));
const initial = {q:'',section:'',region:'',access:'',deadline:'',condition:'',make:'',model:''};
const demoEmails = ['procurement@addis-transport.et','bidder@sample.et'];

const copy = {
  en: {
    browse:'Browse', vehicles:'Vehicles', plans:'Subscriptions', signIn:'Sign in', account:'My account',
    openBids:'Open bids', openNow:'Open now', all:'All', home:'Home', hello:'Bid Ethiopia',
    categories:'Categories', viewAll:'View All',
    intro:'Search Ethiopian tenders and vehicle auctions. You still submit the bid with the issuer.',
    search:'Search Ethiopian tenders & auctions...',
    public:'Public Tenders', publicHint:'Government procurement', publicShort:'Public',
    ngo:'NGO Tenders', ngoHint:'Humanitarian and development', ngoShort:'NGO',
    private:'Private Tenders', privateHint:'Company procurement', privateShort:'Private',
    vehicle:'Vehicle Bids', vehicleHint:'Fleet, damaged and salvage lots', vehicleShort:'Vehicles',
    vehicleLots:'Vehicle Bids', allLots:'View All',
    openTenders:'Open tenders', searchResults:'Search results', openCount:'{n} open', showingVehicles:'Showing {n} vehicles',
    free:'Free', freeAccess:'Free access', subscriber:'Subscriber', used:'Used', damaged:'Damaged', salvage:'Salvage',
    closesToday:'Closes today', closesTomorrow:'Closes tomorrow', closesIn:'Closes in {n} days',
    lot:'Lot', vehicleBid:'Vehicle bid', bidWith:'Bid with the issuer',
    viewInstructions:'View bidding instructions', openNotice:'View original notice', viewTender:'View Tender →',
    noInstructions:'The issuer has not attached bidding instructions to this notice yet.',
    lockedTitle:'Subscriber listing', lockedBody:'The issuer, reference, and lot are visible. A subscription unlocks the bidding instructions and the other photos.',
    viewPlans:'View subscriptions', signInSubscribe:'Sign in to subscribe', save:'Save', unsave:'Saved',
    savedTab:'Saved', alertsTab:'Alerts', viewVehicle:'View Vehicle', demo:'DEMO',
    protoBanner:'Prototype environment — simulated feed',
    back:'Back', region:'Region', access:'Access', closing:'Closing', anyRegion:'Any region', allAccess:'All access',
    anyDeadline:'Any deadline', today:'Today', week:'Within 7 days', month:'Within 30 days', clear:'Clear filters', filters:'Filters',
    saveSearch:'Sign in to save a search', loading:'Loading opportunities…', none:'No active opportunities match these filters.',
    issuer:'Issuer', location:'Location', reference:'Reference', make:'Make', model:'Model', year:'Year', mileage:'Mileage',
    conditionNotes:'Inspection notes', notice:'Description & scope', language:'Language', footer:'All closing times shown in Ethiopia time (EAT).',
    noVehicles:'No vehicle bids to show yet', noVehiclesBody:'Company vehicles appear here with a photo, condition, and time left.',
    savedEmpty:'No saved opportunities yet.', profile:'Profile', profileSub:'Procurement Directory',
    guest:'Guest User', browseOnly:'Browse-Only',
    guestBody:'Browse-only mode. Sign in to sync your saved tenders, vehicle bids, and custom alerts.',
    savedLots:'Saved Lots', activeBids:'Active Bids', alertsStat:'Alerts',
    syncedZero:'0 synced', locked:'Locked', localOnly:'Local only',
    officialBanner:'Official Commercial Bidding — Ministry & private fleet tenders verified daily across Ethiopia.',
    appLanguage:'App Language', timezone:'Timezone', appBuild:'App Build',
    amharicSoon:'Amharic (አማርኛ) available soon.', eatSync:'Synced to tender closing counters.',
    buildNote:'Automotive procurement terminal.',
    prototypeNote:'Bid Ethiopia is an informational directory prototype. No real user transactions or credentials required.',
    directoryHelp:'Directory Help', auctionRules:'Auction Rules',
    signInTitle:'Sign in to Bid Ethiopia',
    signInBody:'Access official tenders, saved motor auctions, verified bank deposits, and critical closing alerts across your field devices.',
    prototypeNotice:'Interactive Prototype Notice',
    prototypeNoticeBody:'Demo Mode active. No real email or SMS is dispatched. Enter any valid demo email address and authenticate instantly using the simulated clearance code.',
    stepEmail:'Tenderer Email', stepCode:'Code Clearance',
    emailLabel:'Official Procurement Email', fieldAccount:'Field Account',
    emailHint:'We will issue a one-time 6-digit access token for registered Ethiopian bidders.',
    sendCode:'Send Code', verifyCode:'Verify Code', sandbox:'Sandbox Environment',
    backProfile:'Back to Profile', encrypted:'End-to-End Encrypted', gazette:'Federal Gazette Compliant',
    legal:'Protected under the Commercial Registration and Business Licensing Proclamation. Bids submitted via verified accounts carry legal obligation.',
    savedCount:'{n} Demo Items Saved', syncedLocally:'Synced Locally',
    allItems:'All Items', vehiclesFilter:'Vehicles', procurementFilter:'Procurement',
    restoreSaved:'Restore demo saved items', demoEnv:'Demo environment — items are stored locally for this preview.',
    simulatedUpdates:'Simulated Tender Updates', markRead:'Mark all read',
    returnDash:'Return to Tender Dashboard',
    alertsSandbox:'Ethiopian procurement sandbox. Demo alerts simulated for prototype preview. Notifications reflect fictional Ethiopian procurement postings.',
    alertsLead:'Get notified when saved searches match new notices.',
    alertsBody:'Turn on email alerts from your account. Closing times stay in EAT.',
  },
  am: {
    browse:'ያስሱ', vehicles:'ተሽከርካሪ', plans:'ምዝገባ', signIn:'ይግቡ', account:'መለያዬ',
    openBids:'ክፍት ጨረታዎች', openNow:'አሁን ክፍት', all:'ሁሉም', home:'መነሻ', hello:'Bid Ethiopia',
    categories:'ምድቦች', viewAll:'ሁሉንም ይመልከቱ',
    intro:'የኢትዮጵያ ጨረታዎችንና የተሽከርካሪ ሎቶችን ይፈልጉ። ጨረታውን ለአውጪው ያቅርቡ።',
    search:'የኢትዮጵያ ጨረታዎችንና ጨረታዎችን ይፈልጉ...',
    public:'የመንግሥት ጨረታ', publicHint:'የመንግሥት ግዥ', publicShort:'መንግሥት',
    ngo:'መንግሥታዊ ያልሆኑ', ngoHint:'የልማትና የሰብዓዊ እርዳታ', ngoShort:'መ/መ',
    private:'የግል ጨረታ', privateHint:'የኩባንያ ግዥ', privateShort:'የግል',
    vehicle:'የተሽከርካሪ ጨረታ', vehicleHint:'የጭነት፣ የተጎዱ እና የተበላሹ ሎቶች', vehicleShort:'ተሽከርካሪ',
    vehicleLots:'የተሽከርካሪ ጨረታ', allLots:'ሁሉንም ይመልከቱ',
    openTenders:'ክፍት ጨረታዎች', searchResults:'የፍለጋ ውጤት', openCount:'{n} ክፍት', showingVehicles:'{n} ተሽከርካሪዎች',
    free:'ነፃ', freeAccess:'ነፃ መዳረሻ', subscriber:'ለተመዝጋቢ', used:'ያገለገለ', damaged:'የተጎዳ', salvage:'የተበላሸ',
    closesToday:'ዛሬ ይዘጋል', closesTomorrow:'ነገ ይዘጋል', closesIn:'በ{n} ቀን ይዘጋል',
    lot:'ሎት', vehicleBid:'የተሽከርካሪ ጨረታ', bidWith:'ለአውጪው ያቅርቡ',
    viewInstructions:'የጨረታ መመሪያ ይመልከቱ', openNotice:'ዋናውን ማስታወቂያ ይመልከቱ', viewTender:'ጨረታ ይመልከቱ →',
    noInstructions:'አውጪው የጨረታ መመሪያ አላያያዘም።',
    lockedTitle:'የተመዝጋቢ ማስታወቂያ', lockedBody:'አውጪው፣ ማጣቀሻው እና ሎቱ ይታያሉ። ምዝገባ የጨረታ መመሪያውን እና ተጨማሪ ፎቶዎችን ይከፍታል።',
    viewPlans:'ምዝገባዎችን ይመልከቱ', signInSubscribe:'ለመመዝገብ ይግቡ', save:'ያስቀምጡ', unsave:'ተቀምጧል',
    savedTab:'የተቀመጡ', alertsTab:'ማሳወቂያ', viewVehicle:'ተሽከርካሪ ይመልከቱ', demo:'DEMO',
    protoBanner:'የሙከራ አካባቢ — የተመሰለ መረጃ',
    back:'ተመለስ', region:'ክልል', access:'መዳረሻ', closing:'መዝጊያ', anyRegion:'ማንኛውም ክልል', allAccess:'ሁሉም',
    anyDeadline:'ማንኛውም ቀን', today:'ዛሬ', week:'በ7 ቀን ውስጥ', month:'በ30 ቀን ውስጥ', clear:'ማጣሪያ አጽዳ', filters:'ማጣሪያዎች',
    saveSearch:'ፍለጋ ለማስቀመጥ ይግቡ', loading:'በመጫን ላይ…', none:'የሚዛመድ ክፍት ጨረታ የለም።',
    issuer:'አውጪ', location:'ቦታ', reference:'ማጣቀሻ', make:'አምራች', model:'ሞዴል', year:'ዓመት', mileage:'ርቀት',
    conditionNotes:'የምርመራ ማስታወሻ', notice:'መግለጫና ወሰን', language:'ቋንቋ', footer:'ሁሉም የመዝጊያ ሰዓቶች በኢትዮጵያ ሰዓት ናቸው።',
    noVehicles:'የሚታይ የተሽከርካሪ ጨረታ የለም', noVehiclesBody:'የኩባንያ ተሽከርካሪዎች እዚህ በፎቶ፣ በሁኔታ እና በቀረው ጊዜ ይታያሉ።',
    savedEmpty:'የተቀመጠ ጨረታ የለም።', profile:'መገለጫ', profileSub:'የግዥ ማውጫ',
    guest:'እንግዳ ተጠቃሚ', browseOnly:'አሰሳ ብቻ',
    guestBody:'የአሰሳ ብቻ ሁነታ። የተቀመጡ ጨረታዎችን ለማስመሳሰል ይግቡ።',
    savedLots:'የተቀመጡ ሎቶች', activeBids:'ንቁ ጨረታዎች', alertsStat:'ማሳወቂያ',
    syncedZero:'0 ተመሳስሏል', locked:'ተቆልፏል', localOnly:'በአካባቢ ብቻ',
    officialBanner:'ኦፊሴላዊ የንግድ ጨረታ — በየቀኑ የተረጋገጡ ማስታወቂያዎች።',
    appLanguage:'የመተግበሪያ ቋንቋ', timezone:'የሰዓት ክልል', appBuild:'ስሪት',
    amharicSoon:'አማርኛ በቅርቡ ይገኛል።', eatSync:'ከመዝጊያ ቆጣሪ ጋር ተመሳስሏል።',
    buildNote:'የተሽከርካሪ ግዥ ተርሚናል።',
    prototypeNote:'Bid Ethiopia የመረጃ ማውጫ ምሳሌ ነው። እውነተኛ ግብይት አያስፈልግም።',
    directoryHelp:'የማውጫ እገዛ', auctionRules:'የጨረታ ደንቦች',
    signInTitle:'ወደ Bid Ethiopia ይግቡ',
    signInBody:'ኦፊሴላዊ ጨረታዎችን፣ የተቀመጡ ሎቶችን እና ማሳወቂያዎችን ያግኙ።',
    prototypeNotice:'የሙከራ ማሳወቂያ',
    prototypeNoticeBody:'የሙከራ ሁነታ። እውነተኛ ኢሜይል አይላክም። ማንኛውንም ምሳሌ ኢሜይል ያስገቡ።',
    stepEmail:'የጨረታ ኢሜይል', stepCode:'የኮድ ማረጋገጫ',
    emailLabel:'ኦፊሴላዊ የግዥ ኢሜይል', fieldAccount:'የመስክ መለያ',
    emailHint:'አንድ ጊዜ የሚያገለግል 6 አሃዝ ኮድ እንልካለን።',
    sendCode:'ኮድ ላክ', verifyCode:'ኮድ አረጋግጥ', sandbox:'የሙከራ አካባቢ',
    backProfile:'ወደ መገለጫ ተመለስ', encrypted:'End-to-End Encrypted', gazette:'Federal Gazette Compliant',
    legal:'በንግድ ምዝገባ አዋጅ የተጠበቀ።',
    savedCount:'{n} የተቀመጡ ምሳሌዎች', syncedLocally:'በአካባቢ ተመሳስሏል',
    allItems:'ሁሉም', vehiclesFilter:'ተሽከርካሪ', procurementFilter:'ግዥ',
    restoreSaved:'የሙከራ የተቀመጡን መልስ', demoEnv:'የሙከራ አካባቢ — በአካባቢ ይቀመጣል።',
    simulatedUpdates:'የተመሰሉ ማሻሻያዎች', markRead:'ሁሉንም ያንብቡ',
    returnDash:'ወደ ዳሽቦርድ ተመለስ',
    alertsSandbox:'የኢትዮጵያ ግዥ ሳንድቦክስ። ማሳወቂያዎች ምሳሌ ናቸው።',
    alertsLead:'አዲስ ማስታወቂያ ሲመጣ ማሳወቂያ ይቀበሉ።',
    alertsBody:'ከመለያዎ የኢሜይል ማሳወቂያ ያብሩ።',
  },
};
const text = (language, key, value) => (copy[language]?.[key] ?? copy.en[key] ?? key).replace('{n}', value ?? '');
function errorText(error) { return error?.message ?? 'Please try again.'; }

function Auth({client,t,onBack}) {
  const [email,setEmail] = useState('demo@bidethiopia.et');
  const [code,setCode] = useState('');
  const [sent,setSent] = useState(false);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!client) {
      setSent(true);
      setMessage('Demo mode: enter any 6-digit code to continue locally.');
      return;
    }
    setBusy(true);
    try {
      const {error} = sent
        ? await client.auth.verifyOtp({email,token:code,type:'email'})
        : await client.auth.signInWithOtp({email});
      if (error) throw error;
      setSent(true);
      setMessage('Check your inbox for your sign-in code.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return <section className="stitch-auth">
    <div className="stitch-subnav">
      <button type="button" className="text-back" onClick={onBack}><Icon name="back" size={18} /> {t('backProfile')}</button>
      <span className="sandbox-pill"><span className="dot" /> {t('sandbox')}</span>
    </div>
    <div className="auth-hero card-cream">
      <div className="auth-gavel"><Icon name="gavel" size={28} /></div>
      <h1>{t('signInTitle')}</h1>
      <p>{t('signInBody')}</p>
    </div>
    <div className="auth-notice">
      <Icon name="info" size={18} />
      <div><strong>{t('prototypeNotice')}</strong><p>{t('prototypeNoticeBody')}</p></div>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-steps" aria-hidden="true">
        <span className={'step' + (!sent ? ' on' : '')}><i>1</i>{t('stepEmail')}</span>
        <span className="step-line" />
        <span className={'step' + (sent ? ' on' : '')}><i>2</i>{t('stepCode')}</span>
      </div>
      {!sent ? <>
        <div className="field-head"><label htmlFor="proc-email">{t('emailLabel')}</label><span>{t('fieldAccount')}</span></div>
        <div className="mail-input">
          <Icon name="mail" size={18} />
          <input id="proc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="demo@bidethiopia.et" />
        </div>
        <p className="field-hint">{t('emailHint')}</p>
        <div className="fast-fill">{demoEmails.map((item) => <button type="button" key={item} onClick={() => setEmail(item)}>{item}</button>)}</div>
        <button className="primary wide" disabled={busy}>{t('sendCode')} <Icon name="arrow" size={18} /></button>
      </> : <>
        <label htmlFor="otp-code">{t('stepCode')}</label>
        <input id="otp-code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="primary wide" disabled={busy}>{t('verifyCode')}</button>
        <button type="button" className="ghost" onClick={() => {setSent(false);setMessage('');}}>{t('stepEmail')}</button>
      </>}
      {message && <p role="status">{message}</p>}
    </form>
    <div className="trust-row"><span><Icon name="lock" size={14} /> {t('encrypted')}</span><span><Icon name="shield" size={14} /> {t('gazette')}</span></div>
    <p className="legal-note">{t('legal')}</p>
  </section>;
}

function Access({item,t}) {
  return <span className={item.access === 'paid' ? 'badge paid' : 'badge free-access'}>{item.access === 'paid' ? t('subscriber') : t('freeAccess')}</span>;
}

function closing(item,t,now) {
  if (item.status !== 'active') return {label:item.status,tone:'closed'};
  if (!now) return {label:format(item.deadline) + ' EAT',tone:''};
  const days = Math.ceil((new Date(item.deadline) - now) / 86400000);
  if (days <= 1) return {label:t('closesToday'),tone:'soon'};
  if (days === 2) return {label:t('closesTomorrow'),tone:'soon'};
  return {label:t('closesIn',days),tone:days <= 7 ? 'soon' : ''};
}

function Close({item,t}) {
  const [now,setNow] = useState(0);
  useEffect(() => {setNow(Date.now());},[]);
  const window = closing(item,t,now);
  return <span className={'deadline ' + window.tone}><strong>{window.label}</strong>{!!now && <small>{format(item.deadline)} EAT</small>}</span>;
}

function VehicleRailCard({item,open,t}) {
  const place = (item.region || item.details?.location || '').toUpperCase();
  return <article className="vehicle-rail-card">
    <button type="button" className="vehicle-rail-media" onClick={() => open(item.id)}>
      {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : <span className="lot-sector">{t('vehicleShort')}</span>}
      <span className={'cond-pill' + (item.condition === 'damaged' || item.condition === 'salvage' ? ' warn' : '')}>{conditionLabel(item.condition)}</span>
      <span className="bookmark-fab" aria-hidden="true"><Icon name="bookmark" size={16} /></span>
    </button>
    <div className="vehicle-rail-body">
      <p className="rail-meta"><span className="place">{place || 'ETHIOPIA'}</span><span className="sep">·</span><Icon name="clock" size={14} /><span>Closing {format(item.deadline)} EAT</span></p>
      <h3>{item.title.replace(/^Sample ·\s*/,'')}</h3>
      <p className="issuer">{item.issuer}</p>
      <button type="button" className="primary wide" onClick={() => open(item.id)}>{t('viewVehicle')} <Icon name="arrow" size={16} /></button>
    </div>
  </article>;
}

function TenderListCard({item,open,t}) {
  const title = item.title.replace(/^Sample ·\s*/,'');
  return <article className="tender-list-card">
    <div className="tender-list-top">
      <Access item={item} t={t} />
      <span className="badge demo">{t('demo')}</span>
      {item.details?.reference && <span className="ref-pill">Ref: {item.details.reference}</span>}
    </div>
    <h3>{title}</h3>
    <p className="entity"><Icon name="building" size={14} /> {item.issuer}</p>
    {(item.region || item.details?.location) && <p className="lot-place"><Icon name="pin" size={14} /> {item.region || item.details?.location}</p>}
    <div className="deadline-bar mint"><Icon name="clock" size={14} /> Closing: {format(item.deadline)} EAT</div>
    <div className="sourced-row"><Icon name="shield" size={14} /> Sourced Directly</div>
    <button type="button" className="primary wide" onClick={() => open(item.id)}>{t('viewTender')}</button>
  </article>;
}

function VehicleListCard({item,open,t}) {
  return <article className="vehicle-list-card">
    <button type="button" className="vehicle-rail-media" onClick={() => open(item.id)}>
      {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : <span className="lot-sector">{t('vehicleShort')}</span>}
      <span className={'cond-pill' + (item.condition === 'damaged' || item.condition === 'salvage' ? ' warn' : '')}>{conditionLabel(item.condition)}</span>
      <span className="bookmark-fab" aria-hidden="true"><Icon name="bookmark" size={16} /></span>
      {item.details?.lot && <span className="lot-overlay">Lot #{item.details.lot}</span>}
      {(item.region || item.details?.location) && <span className="place-overlay">{item.region || item.details?.location}</span>}
    </button>
    <div className="vehicle-rail-body">
      <p className="rail-meta"><span className="place">{(item.region || 'Ethiopia').toUpperCase()}</span><span className="sep">·</span><Icon name="clock" size={14} /><span>Closing {format(item.deadline)} EAT</span></p>
      <h3>{item.title.replace(/^Sample ·\s*/,'')}</h3>
      <p className="issuer">{item.issuer}</p>
      <button type="button" className="primary wide" onClick={() => open(item.id)}>{t('viewVehicle')} <Icon name="arrow" size={16} /></button>
    </div>
  </article>;
}

function LotCard({item,open,t}) {
  if (item.vehicle) return <VehicleListCard item={item} open={open} t={t} />;
  return <TenderListCard item={item} open={open} t={t} />;
}

function Results({items,open,t}) {
  return <div className="list-stack">{items.map((item) => <LotCard key={item.id} item={item} open={open} t={t} />)}</div>;
}

function Photo({id,api}) {
  const [url,setUrl] = useState('');
  useEffect(() => {
    let current = true;
    let objectUrl;
    api('photos/' + id,{binary:true}).then((blob) => {
      if (!current) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {});
    return () => {current=false; if (objectUrl) URL.revokeObjectURL(objectUrl);};
  },[id,api]);
  return url ? <img src={url} alt="Vehicle lot" /> : null;
}

function Detail({item,api,me,saved,onSave,subscribe,signIn,t}) {
  const info = item.details ?? {};
  const facts = Object.entries({issuer:item.issuer,region:item.region,location:info.location,reference:info.reference,lot:info.lot,make:info.make,model:info.model,year:info.year,mileage:info.mileage}).filter(([,value]) => value);
  const actionLabel = item.vehicle ? t('viewInstructions') : t('openNotice');
  const action = item.locked
    ? <button className="primary" onClick={me ? subscribe : signIn}>{me ? t('viewPlans') : t('signInSubscribe')}</button>
    : info.sourceUrl
      ? <a className="primary button" href={info.sourceUrl} target="_blank" rel="noreferrer">{actionLabel}</a>
      : <button className="primary" disabled>{actionLabel}</button>;
  return <article className="detail-layout">
    <div className="detail-visual">
      {item.vehicle && <div className="detail-photo">
        {item.cover ? <img className="detail-cover" src={'/api/photos/' + item.cover} alt={item.title} /> : <div className="cover"><span>Photo unavailable</span></div>}
        {item.condition && item.condition !== 'used' && <div className="condition-banner">{conditionLabel(item.condition)}</div>}
      </div>}
      <div className="detail-facts">
        <span className="badge demo">{t('demo')}</span>
        <Access item={item} t={t} />
        {item.condition && <span className={'badge condition ' + item.condition}>{conditionLabel(item.condition)}</span>}
        {info.lot && <span className="lot">{t('lot')} {info.lot}</span>}
      </div>
      <p className="eyebrow">{item.vehicle ? t('vehicleBid') : t(item.sector)}</p>
      <h1>{item.title}</h1>
      <div className="deadline-box">
        <strong>{t('closing')}</strong>
        <span>{format(item.deadline)} EAT</span>
        <Close item={item} t={t} />
      </div>
      {!!facts.length && <dl className="spec-grid">{facts.map(([key,value]) => <div key={key}><dt>{t(key)}</dt><dd>{value}</dd></div>)}</dl>}
      {!item.locked && <>
        {item.vehicle && item.photos?.some((id) => id !== item.cover) && <div className="detail-photos">{item.photos.filter((id) => id !== item.cover).map((id) => <Photo key={id} id={id} api={api} />)}</div>}
        {info.inspection && <div className="notice-text"><h3>{t('conditionNotes')}</h3><p>{info.inspection}</p></div>}
        {info.description && <div className="notice-text"><h3>{t('notice')}</h3><p>{info.description}</p></div>}
        {info.instructions && <div className="notice-text"><h3>{t('viewInstructions')}</h3><p>{info.instructions}</p></div>}
      </>}
    </div>
    <aside className="detail-panel surface">
      {item.locked ? <><h2>{t('lockedTitle')}</h2><p>{t('lockedBody')}</p>{action}</> : <><h2>{actionLabel}</h2>{info.instructions && <div className="notice-text"><p>{info.instructions}</p></div>}{action}{!info.instructions && !info.sourceUrl && <p>{t('noInstructions')}</p>}</>}
      <button className="outline" onClick={me ? onSave : signIn}>{saved ? t('unsave') : t('save')}</button>
    </aside>
    <div className="detail-dock">
      <button type="button" className="save-fab" aria-label={saved ? t('unsave') : t('save')} onClick={me ? onSave : signIn}><Icon name="bookmark" size={18} /></button>
      {action}
    </div>
  </article>;
}

function Profile({me,t,language,chooseLanguage,onSignIn,onAlerts,onSaved,onStaff}) {
  return <section className="stitch-profile">
    <div className="profile-head">
      <div>
        <div className="page-head"><h1>{t('profile')}</h1><span className="badge demo">{t('demo')}</span></div>
        <p className="muted">{t('profileSub')}</p>
      </div>
      <button type="button" className="icon-btn" onClick={onAlerts} aria-label={t('alertsTab')}><Icon name="bell" /></button>
    </div>
    <div className="guest-card">
      <div className="guest-row">
        <div className="avatar guest"><Icon name="user" size={28} /></div>
        <div>
          <div className="name-row">
            <strong>{me?.email || t('guest')}</strong>
            {!me && <span className="badge browse-only">{t('browseOnly')}</span>}
            {me?.admin && <span className="badge paid">Staff</span>}
          </div>
          <p>{me ? (me.subscribed ? 'Subscription active' : 'Signed in · free account') : t('guestBody')}</p>
        </div>
      </div>
      <div className="stat-grid">
        <button type="button" className="stat" onClick={onSaved}><Icon name="bookmark" size={16} /><span>{t('savedLots')}</span><strong>{me ? String(0) : t('syncedZero')}</strong></button>
        <div className="stat"><Icon name="gavel" size={16} /><span>{t('activeBids')}</span><strong>{t('locked')}</strong></div>
        <div className="stat"><Icon name="bell" size={16} /><span>{t('alertsStat')}</span><strong>{t('localOnly')}</strong></div>
      </div>
      {!me && <button type="button" className="primary wide" onClick={onSignIn}>{t('signIn')} <Icon name="arrow" size={18} /></button>}
      {me?.admin && onStaff && <button type="button" className="primary wide" onClick={onStaff}>Open staff console <Icon name="arrow" size={18} /></button>}
    </div>
    <div className="verify-banner"><Icon name="shield" size={18} /><p>{t('officialBanner')}</p></div>
    <div className="pref-list">
      <div className="pref-row">
        <div><Icon name="doc" size={18} /><div><strong>{t('appLanguage')}</strong><small>{t('amharicSoon')}</small></div></div>
        <div className="lang mini" role="group" aria-label={t('language')}>
          <button type="button" aria-pressed={language === 'en'} onClick={() => chooseLanguage('en')}>EN</button>
          <button type="button" aria-pressed={language === 'am'} onClick={() => chooseLanguage('am')}>አማ</button>
        </div>
      </div>
      <div className="pref-row">
        <div><Icon name="clock" size={18} /><div><strong>{t('timezone')}</strong><small>{t('eatSync')}</small></div></div>
        <span className="value-pill">EAT (UTC+3)</span>
      </div>
      <div className="pref-row">
        <div><Icon name="shield" size={18} /><div><strong>{t('appBuild')}</strong><small>{t('buildNote')}</small></div></div>
        <span className="value-pill">v1.0.4-demo</span>
      </div>
    </div>
    <div className="info-box"><Icon name="info" size={16} /><p>{t('prototypeNote')}</p></div>
    <div className="help-row">
      <button type="button" className="help-btn"><Icon name="info" size={16} />{t('directoryHelp')}</button>
      <button type="button" className="help-btn"><Icon name="shield" size={16} />{t('auctionRules')}</button>
    </div>
  </section>;
}

function SavedView({items,open,t,onRestore}) {
  const [filter,setFilter] = useState('all');
  const vehicles = items.filter((item) => item.vehicle);
  const procurement = items.filter((item) => !item.vehicle);
  const shown = filter === 'vehicles' ? vehicles : filter === 'procurement' ? procurement : items;
  return <section className="stitch-saved">
    <div className="saved-status">
      <strong>{t('savedCount', items.length)}</strong>
      <span className="badge mint">{t('syncedLocally')}</span>
    </div>
    <div className="chip-row">
      <button type="button" className={filter === 'all' ? 'chip on' : 'chip'} onClick={() => setFilter('all')}>{t('allItems')} ({items.length})</button>
      <button type="button" className={filter === 'vehicles' ? 'chip on' : 'chip'} onClick={() => setFilter('vehicles')}>{t('vehiclesFilter')} ({vehicles.length})</button>
      <button type="button" className={filter === 'procurement' ? 'chip on' : 'chip'} onClick={() => setFilter('procurement')}>{t('procurementFilter')} ({procurement.length})</button>
    </div>
    <div className="saved-stack">
      {shown.map((item) => item.vehicle ? (
        <article key={item.id} className="saved-vehicle">
          <div className="saved-media">
            {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : null}
            <span className={'cond-pill' + (item.condition !== 'used' ? ' warn' : '')}>{conditionLabel(item.condition)}</span>
            <span className="lot-overlay">{item.details?.lot ? 'Lot #' + item.details.lot : ''}</span>
            <span className="place-overlay">{item.region || item.details?.location || ''}</span>
          </div>
          <h3>{item.title.replace(/^Sample ·\s*/,'')}</h3>
          <div className="spec-row">
            {item.details?.mileage && <div><span>Odometer</span><strong>{item.details.mileage}</strong></div>}
            {item.details?.year && <div><span>Year</span><strong>{item.details.year}</strong></div>}
            {item.details?.make && <div><span>Make</span><strong>{item.details.make}</strong></div>}
          </div>
          <div className="deadline-bar warn"><Icon name="clock" size={14} /> Submission Deadline: {format(item.deadline)} EAT</div>
          <button type="button" className="primary wide" onClick={() => open(item.id)}>{t('viewVehicle')} <Icon name="arrow" size={16} /></button>
        </article>
      ) : (
        <article key={item.id} className="saved-tender">
          <div className="saved-tender-top">
            <Access item={item} t={t} />
            {item.details?.reference && <span className="ref-pill">Ref: {item.details.reference}</span>}
          </div>
          <p className="entity"><Icon name="building" size={14} /> {item.issuer}</p>
          <h3>{item.title.replace(/^Sample ·\s*/,'')}</h3>
          {item.details?.description && <p className="muted clamp">{item.details.description}</p>}
          <div className="deadline-bar mint"><Icon name="clock" size={14} /> Bid Box Submission: {format(item.deadline)} EAT</div>
          <button type="button" className="primary wide" onClick={() => open(item.id)}>{t('viewTender')}</button>
        </article>
      ))}
      {!shown.length && <div className="empty">{t('savedEmpty')}</div>}
    </div>
    <div className="demo-foot"><p>{t('demoEnv')}</p><button type="button" className="link" onClick={onRestore}>{t('restoreSaved')}</button></div>
  </section>;
}

function AlertsView({items,open,t,onHome}) {
  const vehicle = items.find((item) => item.vehicle) || items[0];
  const tender = items.find((item) => !item.vehicle) || items[1];
  return <section className="stitch-alerts">
    <div className="alerts-toolbar">
      <span className="sandbox-pill"><span className="dot" /> {t('simulatedUpdates')}</span>
      <button type="button" className="text-back"><Icon name="check" size={16} /> {t('markRead')}</button>
    </div>
    <div className="alert-stack">
      {vehicle && <article className="alert-card urgent">
        <div className="alert-ico warn"><Icon name="clock" size={18} /></div>
        <div>
          <div className="alert-top"><span className="badge warn-badge">Urgent Deadline</span><small>2 hours ago · EAT</small></div>
          <h3>Closing Soon: {vehicle.title.replace(/^Sample ·\s*/,'')}</h3>
          <p>Bidding closes soon at {format(vehicle.deadline)} EAT{vehicle.details?.lot ? ' (Lot #' + vehicle.details.lot + ')' : ''}.</p>
          <div className="alert-action">
            <div><Icon name="car" size={16} /><span>{vehicle.issuer}</span></div>
            <button type="button" className="primary" onClick={() => open(vehicle.id)}>Review Bid</button>
          </div>
        </div>
      </article>}
      {tender && <article className="alert-card update">
        <div className="alert-ico mint"><Icon name="doc" size={18} /></div>
        <div>
          <div className="alert-top"><span className="badge mint">Tender Update</span><small>Yesterday · EAT</small></div>
          <h3>Specification Clarification: {tender.title.replace(/^Sample ·\s*/,'')}</h3>
          <p>{tender.issuer} posted an updated notice addendum.</p>
          <div className="alert-action file"><Icon name="doc" size={16} /><span>{tender.details?.reference || 'Addendum'}</span><Icon name="download" size={16} /></div>
        </div>
      </article>}
      {tender && <article className="alert-card new">
        <div className="alert-ico gray"><Icon name="bookmark" size={18} /></div>
        <div>
          <div className="alert-top"><span className="badge">New Listing</span><small>3 days ago</small></div>
          <h3>New {t(tender.sector)} opportunity</h3>
          <p>New opportunity matching your saved preferences: {tender.title.replace(/^Sample ·\s*/,'')} closing {format(tender.deadline)}.</p>
          <div className="tag-row"><span>#{tender.sector}</span><span>#Procurement</span><span>#Ethiopia</span></div>
        </div>
      </article>}
    </div>
    <button type="button" className="primary wide" onClick={onHome}><Icon name="back" size={16} /> {t('returnDash')}</button>
    <div className="info-box"><Icon name="shield" size={16} /><p>{t('alertsSandbox')}</p></div>
  </section>;
}

export default function Portal({authUrl,authKey}) {
  const client = useMemo(() => authUrl && authKey ? createClient(authUrl,authKey) : null,[authUrl,authKey]);
  const [session,setSession] = useState(null);
  const [me,setMe] = useState(null);
  const [view,setView] = useState('browse');
  const [filters,setFilters] = useState(initial);
  const [catalog,setCatalog] = useState({items:[]});
  const [detail,setDetail] = useState(null);
  const [activeId,setActiveId] = useState('');
  const [saved,setSaved] = useState([]);
  const [demoSaved,setDemoSaved] = useState([]);
  const [searches,setSearches] = useState([]);
  const [plans,setPlans] = useState(null);
  const [payments,setPayments] = useState([]);
  const [searchName,setSearchName] = useState('');
  const [status,setStatus] = useState('');
  const [loadError,setLoadError] = useState('');
  const [busy,setBusy] = useState(true);
  const [language,setLanguage] = useState('en');
  const [showFilters,setShowFilters] = useState(false);
  const [mode,setMode] = useState('home');
  const t = (key,value) => text(language,key,value);
  useEffect(() => {
    const savedLang = window.localStorage.getItem('bid-lang');
    if (savedLang === 'am' || savedLang === 'en') setLanguage(savedLang);
  }, []);
  function chooseLanguage(next) {
    setLanguage(next);
    window.localStorage.setItem('bid-lang', next);
  }
  const [reference,setReference] = useState('');
  const [term,setTerm] = useState('');
  const accessToken = session?.access_token;
  const api = useCallback(async (path,options={}) => {
    const {data,binary,...init} = options;
    const headers = new Headers(init.headers);
    if (accessToken) headers.set('Authorization','Bearer ' + accessToken);
    if (data && !(data instanceof FormData)) headers.set('Content-Type','application/json');
    const response = await fetch('/api/' + path,{...init,headers,body:data instanceof FormData ? data : data ? JSON.stringify(data) : undefined});
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? 'Request failed.');
    return binary ? response.blob() : response.json();
  },[accessToken]);

  const refresh = useCallback(async () => {
    if (!accessToken) {setMe(null);setSaved([]);setSearches([]);setPayments([]);return;}
    const [account,list,queries] = await Promise.all([api('me'),api('saved'),api('searches')]);
    setMe(account);setSaved(list);setSearches(queries);
  },[api,accessToken]);

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({data}) => setSession(data.session));
    const {data:{subscription}} = client.auth.onAuthStateChange((_event,next) => setSession(next));
    return () => subscription.unsubscribe();
  },[client]);
  useEffect(() => {
    const read = () => {
      setActiveId(new URL(location.href).searchParams.get('bid') ?? '');
      setView('browse');
    };
    read();
    window.addEventListener('popstate',read);
    return () => window.removeEventListener('popstate',read);
  },[]);
  useEffect(() => {refresh().catch((error) => setStatus(errorText(error)));},[refresh]);
  useEffect(() => {if (view === 'auth' && me) setView('account');},[view,me]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      const query = new URLSearchParams(Object.entries(filters).filter(([,v]) => v));
      try {
        const result = await api('listings?' + query,{signal:controller.signal});
        setCatalog(result);
        setLoadError('');
        if (!demoSaved.length && result.items?.length) {
          const seed = [
            result.items.find((item) => item.vehicle),
            result.items.find((item) => !item.vehicle),
          ].filter(Boolean);
          setDemoSaved(seed);
        }
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') setLoadError(errorText(error));
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    },220);
    return () => {clearTimeout(timer);controller.abort();};
  },[api,filters,demoSaved.length]);
  useEffect(() => {
    setDetail(null);
    if (!activeId) return;
    const controller = new AbortController();
    api('listings/' + encodeURIComponent(activeId),{signal:controller.signal}).then(setDetail)
      .catch((error) => {if (!controller.signal.aborted) setStatus(errorText(error));});
    return () => controller.abort();
  },[api,activeId]);
  useEffect(() => {
    if (view !== 'plans' && view !== 'account') return;
    api('plans').then(setPlans).catch((error) => setStatus(errorText(error)));
    if (accessToken) api('payments').then(setPayments).catch((error) => setStatus(errorText(error)));
  },[api,accessToken,view]);

  async function run(action) {
    setStatus('');
    try {await action();}
    catch (error) {setStatus(errorText(error));}
  }
  function go(next) {
    if (activeId) history.pushState(null,'','/');
    setActiveId('');setView(next);setStatus('');
  }
  function open(id) {
    history.pushState(null,'','/?bid=' + id);
    setStatus('');setView('browse');setActiveId(id);
    window.scrollTo(0,0);
  }
  function set(key,value) {
    setStatus('');
    if (key === 'q' && value) setMode('catalog');
    setFilters((previous) => ({...previous,[key]:value}));
  }
  function section(key) {
    if (activeId) history.pushState(null,'','/');
    setActiveId('');
    setView('browse');
    setMode('catalog');
    setFilters({...initial,section:key});
    setStatus('');
    window.scrollTo(0,0);
  }
  function goHome() {
    if (activeId) history.pushState(null,'','/');
    setActiveId('');
    setView('browse');
    setMode('home');
    setFilters(initial);
    setShowFilters(false);
    setStatus('');
    window.scrollTo(0,0);
  }
  const savedCurrent = saved.some((entry) => entry.id === activeId);
  const isHome = view === 'browse' && !activeId && mode === 'home';
  const isCatalog = view === 'browse' && !activeId && mode === 'catalog';
  const title = filters.section === 'vehicle' ? t('vehicle') : filters.section ? t(filters.section) : filters.q ? t('searchResults') : t('openBids');
  const shown = catalog.items.filter((item) => {
    if (filters.section === 'vehicle') {
      if (filters.condition && item.condition !== filters.condition) return false;
      return !!item.vehicle;
    }
    if (filters.section) return !item.vehicle && item.sector === filters.section;
    return true;
  });
  const vehiclesPreview = catalog.items.filter((item) => item.vehicle).slice(0,4);
  const openNow = catalog.items.filter((item) => !item.vehicle);
  const savedItems = me && saved.length ? saved : demoSaved;
  const bottom = !activeId && ['browse','plans','account','auth','saved','alerts','profile'].includes(view);
  const vehicleChips = [
    ['', t('all')],
    ['used', t('used')],
    ['damaged', t('damaged')],
    ['salvage', t('salvage')],
  ];

  return <>
    <main className={'shell main stitch-app' + (bottom ? ' has-dock' : '') + (isHome ? ' is-home' : '') + (isCatalog ? ' is-catalog' : '')} data-screen={activeId ? 'detail' : isCatalog ? 'catalog' : isHome ? 'home' : view}>
      {status && <div role="status" className="callout alert">{status}<button aria-label="Dismiss message" onClick={() => setStatus('')}>×</button></div>}

      {activeId ? <><button className="text-back page-back" onClick={() => { setActiveId(''); history.pushState(null,'','/'); }}><Icon name="back" size={18} /> {t('back')}</button>
        {detail ? <Detail key={detail.id} item={detail} api={api} me={me} saved={savedCurrent} t={t} onSave={() => run(async () => {
          await api('saved/' + activeId,{method:savedCurrent ? 'DELETE' : 'PUT'});await refresh();
        })} subscribe={() => go('plans')} signIn={() => go('auth')} /> : !status && <p>{t('loading')}</p>}</> :
      view === 'auth' ? <Auth client={client} t={t} onBack={() => go('profile')} /> :
      view === 'profile' ? <Profile me={me} t={t} language={language} chooseLanguage={chooseLanguage} onSignIn={() => go('auth')} onAlerts={() => go('alerts')} onSaved={() => go('saved')} onStaff={me?.admin ? () => go('staff') : undefined} /> :
      view === 'staff' && me?.admin ? <Admin api={api} onBack={() => go('profile')} /> :
      view === 'plans' ? <section className="surface"><div className="eyebrow">Subscription access</div><h1>Unlock paid listings</h1>
        <p>Choose a term to view full paid tenders and vehicle bidding instructions on web, iOS, and Android.</p>
        {plans && <><div className="plans">{plans.plans.map((plan) => <button key={plan.months} className={'plan ' + (String(plan.months) === term ? 'selected' : '')} disabled={!plan.price} onClick={() => setTerm(String(plan.months))}><strong>{terms[plan.months]}</strong><span>{plan.price ? 'ETB ' + plan.price : 'Unavailable'}</span></button>)}</div>
          {plans.instructions && <div className="callout notice-text"><h3>Payment instructions</h3><p>{plans.instructions}</p></div>}</>}
        {me ? <form className="stack narrow-form" onSubmit={(event) => {event.preventDefault();void run(async () => {
          await api('payments',{method:'POST',data:{reference,months:term}});
          setReference('');setStatus('Payment reference submitted for staff verification.');
          setPayments(await api('payments'));
        });}}><label>Transaction reference<input value={reference} onChange={(event) => setReference(event.target.value)} required /></label><button className="primary" disabled={!term || !plans?.instructions}>Submit for verification</button></form> :
          <button className="primary" onClick={() => go('auth')}>Sign in to submit a reference</button>}
        {!!payments.length && <PaymentHistory items={payments} />}
      </section> :
      view === 'account' && me ? <section className="surface"><div className="split"><div><div className="eyebrow">Your account</div><h2>{me.email}</h2></div><button className="outline" onClick={() => run(async () => {await client.auth.signOut();goHome();})}>Sign out</button></div>
        <p>{me.subscribed ? 'Subscription active until ' + format(me.expiresAt) + ' EAT' : 'Free account'}</p>
        <button className="primary" onClick={() => go('profile')}>{t('profile')}</button>
        <h3>Saved opportunities</h3>{saved.length ? <Results items={saved} open={open} t={t} /> : <p>{t('savedEmpty')}</p>}
        {!!payments.length && <PaymentHistory items={payments} />}
      </section> :
      view === 'saved' ? <SavedView items={savedItems} open={open} t={t} onRestore={() => setDemoSaved(catalog.items.slice(0,2))} /> :
      view === 'alerts' ? <AlertsView items={catalog.items} open={open} t={t} onHome={goHome} /> :
      isCatalog ? <section className="catalog is-catalog" key={'catalog-' + (filters.section || 'all')}>
        <div className="list-topbar">
          <button type="button" className="icon-btn" onClick={goHome} aria-label={t('back')}><Icon name="back" size={22} /></button>
          <div className="page-head"><h1>{title}</h1><span className="badge demo">{t('demo')}</span></div>
          <button type="button" className="avatar-btn" onClick={() => go('profile')} aria-label={t('profile')}><span className="avatar"><Icon name="user" size={18} /></span></button>
        </div>
        <div className="search-wrap">
          <Icon name="search" size={18} />
          <input className="workspace-search" type="search" aria-label={t('search')} placeholder={t('search')} value={filters.q} onChange={(event) => set('q',event.target.value)} />
        </div>
        <div className="chip-row catalog-chips">
          {filters.section === 'vehicle'
            ? vehicleChips.map(([value,label]) => <button type="button" key={label} className={((!filters.condition && !value) || filters.condition === value) ? 'chip on' : 'chip'} onClick={() => set('condition', value)}>{label}</button>)
            : sections.map(([key,label]) => <button type="button" key={key} className={filters.section === key ? 'chip on' : 'chip'} onClick={() => section(key)}>{t(label)}</button>)}
        </div>
        <div className="list-count">
          <p>{busy ? t('loading') : loadError ? loadError : filters.section === 'vehicle' ? t('showingVehicles', shown.length) : t('openCount', shown.length)}</p>
          <button type="button" className="link" onClick={goHome}>{t('clear')}</button>
        </div>
        {filters.section === 'private' && <div className="tier-banner"><Icon name="shield" size={16} /><div><strong>Commercial & Private</strong><span>Enterprise tier access preview</span></div></div>}
        {filters.section === 'ngo' && <div className="notify-card"><p>Need more humanitarian bids?</p><button type="button" className="primary wide" onClick={() => go('alerts')}><Icon name="bell" size={16} /> Notify on New NGO Tenders</button></div>}
        {busy && !shown.length ? <p role="status">{t('loading')}</p> : loadError && !shown.length ? <div className="empty" role="alert">{loadError}</div> : shown.length ? <Results items={shown} open={open} t={t} /> : <div className="empty">{t('none')}</div>}
        <div className="demo-foot"><p>{t('protoBanner')}</p></div>
        {catalog.next && !busy && <button className="outline more" onClick={() => run(async () => {
          const query = new URLSearchParams(Object.entries({...filters,page:catalog.next}).filter(([,v]) => v));
          const result = await api('listings?' + query);
          setCatalog({next:result.next,items:[...new Map([...catalog.items,...result.items].map((item) => [item.id,item])).values()]});
        })}>Load more</button>}
      </section> :
      <section className="catalog is-home">
        <div className="app-home-bar">
          <div className="page-head"><h1>{t('hello')}</h1><span className="badge demo soft">{t('demo')}</span></div>
          <button type="button" className="avatar-btn" onClick={() => go('profile')} aria-label={t('profile')}>
            <span className="avatar"><Icon name="user" size={20} /></span>
          </button>
        </div>
        <div className="search-wrap">
          <Icon name="search" size={18} />
          <input className="workspace-search" type="search" aria-label={t('search')} placeholder={t('search')} value={filters.q} onChange={(event) => set('q',event.target.value)} />
        </div>
        <h2 className="section-label">{t('categories')}</h2>
        <div className="section-tiles">
          {sections.map(([key,label]) => <button key={key} type="button" className={'section-tile sector-' + key} onClick={() => section(key)}>
            <span className="tile-ico"><Icon name={sectionIcons[key]} size={22} /></span>
            <strong>{t(label)}</strong>
          </button>)}
        </div>
        {!!vehiclesPreview.length && <div className="home-strip">
          <div className="catalog-meta">
            <h2><Icon name="car" size={18} /> {t('vehicleLots')}</h2>
            <button type="button" className="link" onClick={() => section('vehicle')}>{t('allLots')} ›</button>
          </div>
          <div className="lot-rail">{vehiclesPreview.map((item) => <VehicleRailCard key={item.id} item={item} open={open} t={t} />)}</div>
        </div>}
        {!!openNow.length && <div className="home-open-now"><h2 className="section-label">{t('openNow')}</h2><Results items={openNow} open={open} t={t} /></div>}
      </section>}
    </main>

    {bottom && <nav className="dock" aria-label="Mobile navigation">
      <button type="button" className={isHome ? 'active' : ''} onClick={goHome}><span className="dock-pill"><Icon name="home" size={20} /></span>{t('home')}</button>
      <button type="button" className={isCatalog && filters.section === 'vehicle' ? 'active' : ''} onClick={() => section('vehicle')}><span className="dock-pill"><Icon name="car" size={20} /></span>{t('vehicles')}</button>
      <button type="button" className={view === 'saved' ? 'active' : ''} onClick={() => go('saved')}><span className="dock-pill"><Icon name="bookmark" size={20} /></span>{t('savedTab')}</button>
      <button type="button" className={view === 'alerts' ? 'active' : ''} onClick={() => go('alerts')}><span className="dock-pill"><Icon name="bell" size={20} /></span>{t('alertsTab')}</button>
    </nav>}
  </>;
}

function PaymentHistory({items}) {
  return <><h3>Payment history</h3><ul className="rows">{items.map((payment) => <li key={payment.id}><span>{terms[payment.months]} · ETB {payment.price} · {payment.reference}</span><span className="badge">{payment.status}</span></li>)}</ul></>;
}
