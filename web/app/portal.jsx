'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Admin from './staff.jsx';

const sections = [
  ['public','Public tenders','Government procurement','▤'],
  ['ngo','NGO tenders','Development and humanitarian work','◎'],
  ['private','Private tenders','Company procurement','◇'],
  ['vehicle','Vehicle bids','Fleet, damaged and salvage vehicles','↗'],
];
const terms = {1:'Monthly',3:'Quarterly',6:'Half-year',12:'Annual'};
const deadline = new Intl.DateTimeFormat('en-ET',{timeZone:'Africa/Addis_Ababa',dateStyle:'medium',timeStyle:'short'});
const format = (value) => deadline.format(new Date(value));
const initial = {q:'',section:'',region:'',access:'',deadline:'',condition:'',make:'',model:''};

function errorText(error) {
  return error?.message ?? 'Please try again.';
}

function Auth({client}) {
  const [email,setEmail] = useState('');
  const [code,setCode] = useState('');
  const [sent,setSent] = useState(false);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!client) return setMessage('Email sign-in is being configured.');
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
  return <section className="surface narrow"><div className="eyebrow">Your account</div><h2>Sign in to Bid Ethiopia</h2>
    <p>Save opportunities, get alerts, and manage your subscription.</p>
    <form className="stack" onSubmit={submit}>
      <label>Email address<input type="email" value={email} disabled={sent} required onChange={(e) => setEmail(e.target.value)} /></label>
      {sent && <label>Sign-in code<input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} /></label>}
      <button className="primary" disabled={busy}>{sent ? 'Verify code' : 'Send sign-in code'}</button>
      {sent && <button type="button" className="ghost" onClick={() => {setSent(false);setMessage('');}}>Use another email</button>}
      {message && <p role="status">{message}</p>}
    </form>
  </section>;
}

function Card({item,open}) {
  return <button className={'card ' + (item.vehicle ? 'vehicle-card' : '')} onClick={() => open(item.id)}>
    {item.vehicle && <div className="cover">{item.cover ? <img src={'/api/photos/' + item.cover} alt={item.title} loading="lazy" /> : <span>Vehicle photo unavailable</span>}</div>}
    <div className="card-body">
      <div className="card-meta"><span>{item.vehicle ? item.condition : item.sector}</span><span className={item.access === 'paid' ? 'badge paid' : 'badge'}>{item.access === 'paid' ? 'Subscriber' : 'Free'}</span></div>
      <h3>{item.title}</h3>
      {!item.vehicle && item.issuer && <p>{item.issuer}</p>}
      <div className="deadline">{item.status !== 'active' ? item.status + ' · ' : 'Closes '}{format(item.deadline)} <span>EAT</span></div>
    </div>
  </button>;
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

function Detail({item,api,me,saved,onSave,subscribe,signIn}) {
  const info = item.details;
  return <article className={item.vehicle && item.cover ? "surface detail detail-with-cover" : "surface detail"}>
    {item.vehicle && item.cover && <img className="detail-cover" src={'/api/photos/' + item.cover} alt={item.title} />}
    <div className="detail-content">
    <div className="eyebrow">{item.vehicle ? 'Vehicle bid' : sections.find(([key]) => key === item.sector)?.[1]}</div>
    <h1>{item.title}</h1>
    <p className="deadline">{item.status === 'active' ? 'Closes' : item.status} · {format(item.deadline)} EAT</p>
    {item.condition && <span className="badge">{item.condition}</span>}
    {item.locked ? <div className="callout"><h3>Subscriber listing</h3><p>Unlock the issuer, full details, and bidding instructions.</p><button className="primary" onClick={subscribe}>View subscriptions</button></div> : <>
      <dl>{Object.entries({Issuer:item.issuer,Region:item.region,Location:info.location,Reference:info.reference,Lot:info.lot,Make:info.make,Model:info.model,Year:info.year,Mileage:info.mileage}).filter(([,v]) => v).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
      {info.description && <div className="notice-text"><h3>Notice details</h3><p>{info.description}</p></div>}
      {item.vehicle && item.photos.some((id) => id !== item.cover) && <details className="bid-disclosure"><summary>More photos</summary><div className="detail-photos">{item.photos.filter((id) => id !== item.cover).map((id) => <Photo key={id} id={id} api={api} />)}</div></details>}
      {info.inspection && <details className="notice-text bid-disclosure"><summary>Inspection notes</summary><p>{info.inspection}</p></details>}
      {info.instructions ? <details className="notice-text bid-disclosure">
        <summary className="primary button">View bidding instructions</summary><p>{info.instructions}</p>
        {info.sourceUrl && <a href={info.sourceUrl} target="_blank" rel="noreferrer">Open original notice ↗</a>}
      </details> : info.sourceUrl && <a className="primary button" href={info.sourceUrl} target="_blank" rel="noreferrer">View bidding instructions ↗</a>}
    </>}
    <div className="detail-actions"><button className="outline" onClick={me ? onSave : signIn}>{saved ? 'Remove from saved' : 'Save opportunity'}</button></div>
    </div>
  </article>;
}

export default function Portal({authUrl,authKey}) {
  const [showFilters, setShowFilters] = useState(false);
  const client = useMemo(() => authUrl && authKey ? createClient(authUrl,authKey) : null,[authUrl,authKey]);
  const [session,setSession] = useState(null);
  const [me,setMe] = useState(null);
  const [view,setView] = useState('browse');
  const [filters,setFilters] = useState(initial);
  const [catalog,setCatalog] = useState({items:[]});
  const [vehicles,setVehicles] = useState([]);
  const [detail,setDetail] = useState(null);
  const [activeId,setActiveId] = useState('');
  const [saved,setSaved] = useState([]);
  const [searches,setSearches] = useState([]);
  const [plans,setPlans] = useState(null);
  const [payments,setPayments] = useState([]);
  const [searchName,setSearchName] = useState('');
  const [status,setStatus] = useState('');
  const [busy,setBusy] = useState(false);
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
        if (!query.size) {
          const gallery = await api('listings?section=vehicle',{signal:controller.signal});
          setVehicles(gallery.items.slice(0,3));
        }
      } catch (error) {
        if (!controller.signal.aborted) setStatus(errorText(error));
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    },220);
    return () => {clearTimeout(timer);controller.abort();};
  },[api,filters]);
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
  function set(key,value) {setStatus('');setFilters((previous) => ({...previous,[key]:value}));}
  function section(key) {
    go('browse');setFilters({...initial,section:key});
    setTimeout(() => document.getElementById('directory')?.scrollIntoView({behavior:'smooth'}),50);
  }
  const savedCurrent = saved.some((entry) => entry.id === activeId);
  const isHome = !Object.values(filters).some(Boolean);
  const title = sections.find(([key]) => key === filters.section)?.[1] ?? 'Active opportunities';

  return <>
    <header className="top"><div className="shell nav">
      <button className="brand" onClick={() => {go('browse');setFilters(initial);}}><span className="mark">B</span> Bid Ethiopia</button>
      <nav aria-label="Main navigation">
        <button onClick={() => section('')}>Browse</button><button onClick={() => section('vehicle')}>Vehicle bids</button>
        <button onClick={() => go('plans')}>Subscriptions</button>
        {me?.admin && <button onClick={() => go('staff')}>Staff</button>}
        <button className="nav-action" onClick={() => go(me ? 'account' : 'auth')}>{me ? 'My account' : 'Sign in'}</button>
      </nav>
    </div></header>
    <main className="shell main">
      {status && <div role="status" className="callout alert">{status}<button aria-label="Dismiss message" onClick={() => setStatus('')}>×</button></div>}
      {activeId ? <><button className="back" onClick={() => go('browse')}>← Back to opportunities</button>
        {detail ? <Detail key={detail.id} item={detail} api={api} me={me} saved={savedCurrent} onSave={() => run(async () => {
          await api('saved/' + activeId,{method:savedCurrent ? 'DELETE' : 'PUT'});await refresh();
        })} subscribe={() => go('plans')} signIn={() => go('auth')} /> : !status && <p>Loading opportunity…</p>}</> :
      view === 'auth' ? <Auth client={client} /> :
      view === 'staff' && me?.admin ? <Admin api={api} /> :
      view === 'plans' ? <section className="surface"><div className="eyebrow">Subscription access</div><h1>Unlock paid listings</h1>
        <p>Choose a term to view full paid tenders and vehicle bidding instructions on web and Android.</p>
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
      view === 'account' && me ? <section className="surface"><div className="split"><div><div className="eyebrow">Your account</div><h2>{me.email}</h2></div><button className="outline" onClick={() => run(async () => {await client.auth.signOut();go('browse');})}>Sign out</button></div>
        <p>{me.subscribed ? 'Subscription active until ' + format(me.expiresAt) + ' EAT' : 'Free account'}</p>
        <label className="check"><input type="checkbox" checked={me.emailAlerts} onChange={(event) => {
          const emailAlerts = event.target.checked;void run(async () => {await api('preferences',{method:'PUT',data:{emailAlerts}});await refresh();});
        }} /> Email me saved search matches and listing updates</label>
        <h3>Saved searches</h3>
        {searches.length ? <ul className="rows">{searches.map((search) => <li key={search.id}><button className="link" onClick={() => {setFilters({...initial,...search.filters});go('browse');}}>{search.label}</button><button className="outline" onClick={() => run(async () => {await api('searches/' + search.id,{method:'DELETE'});await refresh();})}>Remove</button></li>)}</ul> : <p>No saved searches yet.</p>}
        <h3>Saved opportunities</h3><div className="grid">{saved.map((item) => <Card key={item.id} item={item} open={open} />)}</div>{!saved.length && <p>No saved opportunities yet.</p>}
        {!!payments.length && <PaymentHistory items={payments} />}
      </section> :
      <>
        <section className="browse-intro">
          <h1>Find a bid</h1>
          <input type="search" aria-label="Search tenders and vehicles" placeholder="Search tenders and vehicles" value={filters.q} onChange={(event) => set('q',event.target.value)} />
        </section>
        <div className="sections">{sections.map(([key,label,,icon]) => <button key={key} aria-pressed={filters.section === key} className={filters.section === key ? 'selected' : ''} onClick={() => section(key)}><span className="section-icon" aria-hidden="true">{icon}</span><strong>{label}</strong></button>)}</div>
        {isHome && <section className="gallery"><div className="split"><div><h2>Vehicle bids</h2></div><button className="outline" onClick={() => section('vehicle')}>Browse vehicles ↗</button></div>
          {vehicles.length ? <div className="grid">{vehicles.map((item) => <Card key={item.id} item={item} open={open} />)}</div> : <div className="empty"><span>↗</span><div><strong>No vehicle bids to show yet</strong><p>Company vehicles appear here with photos, condition, and closing dates.</p></div></div>}
        </section>}
        <section className="directory" id="directory">
          <h2>{title}</h2>
          <div className="directory-layout">
          <aside className="directory-sidebar" aria-label="Listing filters">
          <button className="outline filter-toggle" aria-expanded={showFilters} aria-controls="listing-filters" onClick={() => setShowFilters(!showFilters)}>Filters</button>
          <div id="listing-filters" className={showFilters ? "filter-panel is-open" : "filter-panel"}>
          <h3>Filter opportunities</h3>
          <div className="filters">
            <label>Region<input placeholder="Any region" value={filters.region} onChange={(e) => set('region',e.target.value)} /></label>
            <label>Access<select value={filters.access} onChange={(e) => set('access',e.target.value)}><option value="">All access</option><option value="free">Free</option><option value="paid">Subscriber</option></select></label>
            <label>Closing<select value={filters.deadline} onChange={(e) => set('deadline',e.target.value)}><option value="">Any deadline</option><option value="today">Today</option><option value="week">Within 7 days</option><option value="month">Within 30 days</option></select></label>
            {filters.section === 'vehicle' && <><label>Condition<select value={filters.condition} onChange={(e) => set('condition',e.target.value)}><option value="">Any condition</option><option>used</option><option>damaged</option><option>salvage</option></select></label>
              <label>Make<input value={filters.make} onChange={(e) => set('make',e.target.value)} /></label>
              <label>Model<input value={filters.model} onChange={(e) => set('model',e.target.value)} /></label></>}
          </div>
          <button className="link" onClick={() => section(filters.section)}>Clear filters</button>
          </div>
          </aside>
          <div className="directory-results">
          <div className="split directory-actions">
            {me ? <form className="inline" onSubmit={(event) => {event.preventDefault();void run(async () => {
              await api('searches',{method:'POST',data:{label:searchName,filters}});setSearchName('');await refresh();setStatus('Search saved.');
            });}}><input aria-label="Saved search name" placeholder="Name this search" value={searchName} onChange={(event) => setSearchName(event.target.value)} required /><button className="outline">Save search</button></form> :
              <button className="link" onClick={() => go('auth')}>Sign in to save a search</button>}
          </div>
          {busy ? <p role="status">Loading opportunities…</p> : catalog.items.length ? <div className="grid">{catalog.items.map((item) => <Card key={item.id} item={item} open={open} />)}</div> : !status && <div className="empty">No active opportunities match these filters.</div>}
          {catalog.next && !busy && <button className="outline more" onClick={() => run(async () => {
            const query = new URLSearchParams(Object.entries({...filters,page:catalog.next}).filter(([,v]) => v));
            const result = await api('listings?' + query);
            setCatalog({next:result.next,items:[...new Map([...catalog.items,...result.items].map((item) => [item.id,item])).values()]});
          })}>Load more</button>}
          </div>
          </div>
        </section>
      </>}
    </main>
    <footer><div className="shell split"><strong>Bid Ethiopia</strong><span>All closing times shown in Ethiopia time (EAT).</span></div></footer>
  </>;
}

function PaymentHistory({items}) {
  return <><h3>Payment history</h3><ul className="rows">{items.map((payment) => <li key={payment.id}><span>{terms[payment.months]} · ETB {payment.price} · {payment.reference}</span><span className="badge">{payment.status}</span></li>)}</ul></>;
}
