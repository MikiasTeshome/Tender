'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DeskNav, Dock, SiteFooter } from './components.jsx';
import {
  AlertsScreen,
  AuthScreen,
  CatalogScreen,
  DetailScreen,
  HomeScreen,
  PlansScreen,
  ProfileScreen,
  SavedScreen,
} from './screens.jsx';
import { errorText, readRoute, writeRoute } from './utils.js';
import './supplier.css';

const emptyFilters = {q: '', section: '', condition: ''};

export default function Shell({authUrl = '', authKey = ''}) {
  const client = useMemo(() => (authUrl && authKey ? createClient(authUrl, authKey) : null), [authUrl, authKey]);
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [demoMe, setDemoMe] = useState(null);
  const [route, setRoute] = useState({bid: '', screen: 'home', section: ''});
  const [filters, setFilters] = useState(emptyFilters);
  const [catalog, setCatalog] = useState({items: []});
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [saved, setSaved] = useState([]);
  const [demoSaved, setDemoSaved] = useState([]);
  const [plans, setPlans] = useState(null);
  const [plansError, setPlansError] = useState('');
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(true);
  const [language, setLanguage] = useState('en');
  const [reference, setReference] = useState('');
  const [term, setTerm] = useState('');

  const accessToken = session?.access_token;
  const account = me || demoMe;
  const api = useCallback(async (path, options = {}) => {
    const {data, binary, ...init} = options;
    const headers = new Headers(init.headers);
    if (accessToken) headers.set('Authorization', 'Bearer ' + accessToken);
    if (data && !(data instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch('/api/' + path, {
      ...init,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? 'Request failed.');
    return binary ? response.blob() : response.json();
  }, [accessToken]);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setMe(null);
      setSaved([]);
      setPayments([]);
      return;
    }
    const [accountData, list] = await Promise.all([api('me'), api('saved')]);
    setMe(accountData);
    setSaved(list);
    setDemoMe(null);
  }, [api, accessToken]);

  useEffect(() => {
    const savedLang = window.localStorage.getItem('bid-lang');
    if (savedLang === 'am' || savedLang === 'en') setLanguage(savedLang);
  }, []);

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({data}) => setSession(data.session));
    const {data: {subscription}} = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, [client]);

  useEffect(() => {
    const sync = () => {
      const next = readRoute();
      setRoute({bid: next.bid, screen: next.screen, section: next.section});
      if (next.bid) return;
      if (next.screen === 'catalog') {
        setFilters({
          q: next.q || '',
          section: next.section || '',
          condition: next.condition || '',
        });
      } else if (next.screen === 'home') {
        setFilters({...emptyFilters, q: next.q || ''});
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    refresh().catch((error) => setStatus(errorText(error)));
  }, [refresh]);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const timer = setTimeout(async () => {
      if (!alive) return;
      setBusy(true);
      const query = new URLSearchParams();
      if (filters.q) query.set('q', filters.q);
      if (filters.section) query.set('section', filters.section);
      if (filters.condition) query.set('condition', filters.condition);
      try {
        const result = await api('listings?' + query, {signal: controller.signal});
        if (!alive) return;
        setCatalog(result);
        setLoadError('');
        setDemoSaved((prev) => {
          if (prev.length || !result.items?.length) return prev;
          return [
            result.items.find((item) => item.vehicle),
            result.items.find((item) => !item.vehicle),
          ].filter(Boolean);
        });
      } catch (error) {
        if (!alive || error.name === 'AbortError') return;
        setLoadError(errorText(error));
      } finally {
        if (alive) setBusy(false);
      }
    }, 220);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [api, filters.q, filters.section, filters.condition]);

  useEffect(() => {
    setDetail(null);
    setDetailError('');
    if (!route.bid) return;
    const controller = new AbortController();
    api('listings/' + encodeURIComponent(route.bid), {signal: controller.signal})
      .then(setDetail)
      .catch((error) => {
        if (!controller.signal.aborted) setDetailError(errorText(error));
      });
    return () => controller.abort();
  }, [api, route.bid]);

  useEffect(() => {
    if (route.screen !== 'plans') return;
    setPlans(null);
    setPlansError('');
    api('plans')
      .then((result) => {
        setPlans(result);
        if (!term && result.plans?.length) {
          const first = result.plans.find((plan) => plan.price);
          if (first) setTerm(String(first.months));
        }
      })
      .catch((error) => setPlansError(errorText(error)));
    if (accessToken) api('payments').then(setPayments).catch((error) => setStatus(errorText(error)));
  }, [api, accessToken, route.screen]);

  async function run(action) {
    setStatus('');
    try {
      await action();
    } catch (error) {
      setStatus(errorText(error));
    }
  }

  function navigate(next) {
    const payload = {
      bid: next.bid || '',
      screen: next.screen || 'home',
      section: next.section || '',
      q: next.q ?? filters.q,
      condition: next.condition ?? filters.condition,
    };
    writeRoute(payload);
    setRoute({bid: payload.bid, screen: payload.screen, section: payload.section});
    window.scrollTo(0, 0);
  }

  function go(screen, section = '') {
    setStatus('');
    if (screen === 'catalog') {
      setFilters((prev) => ({...emptyFilters, q: prev.q, section, condition: section === 'vehicle' ? prev.condition : ''}));
      navigate({screen: 'catalog', section, q: filters.q, condition: section === 'vehicle' ? filters.condition : ''});
      return;
    }
    setFilters((prev) => ({...emptyFilters, q: screen === 'home' ? '' : prev.q}));
    navigate({screen, section: '', q: screen === 'home' ? '' : filters.q, condition: ''});
  }

  function open(id) {
    setStatus('');
    navigate({bid: id, section: filters.section});
  }

  function setQ(value) {
    setStatus('');
    setFilters((prev) => ({...prev, q: value}));
    if (route.screen === 'home' && value) {
      writeRoute({screen: 'catalog', section: filters.section, q: value, condition: filters.condition});
      setRoute({bid: '', screen: 'catalog', section: filters.section});
      return;
    }
    if (route.screen === 'catalog' || route.screen === 'home') {
      writeRoute({
        screen: route.screen,
        section: filters.section,
        q: value,
        condition: filters.condition,
      });
    }
  }

  function setCondition(value) {
    setFilters((prev) => ({...prev, condition: value}));
    if (route.screen === 'catalog') {
      writeRoute({
        screen: 'catalog',
        section: filters.section,
        q: filters.q,
        condition: value,
      });
    }
  }

  function chooseLanguage(next) {
    if (next === 'am') return;
    setLanguage(next);
    window.localStorage.setItem('bid-lang', next);
  }

  function handleDemoSignIn({email}) {
    setDemoMe({email, subscribed: false, demo: true});
    setStatus('');
    go('profile');
  }

  async function handleSignOut() {
    setStatus('');
    if (client && accessToken) {
      await client.auth.signOut();
    }
    setDemoMe(null);
    setMe(null);
    setSaved([]);
    setPayments([]);
    go('home');
  }

  function toggleDemoSave(id) {
    setDemoSaved((prev) => {
      if (prev.some((entry) => entry.id === id)) return prev.filter((entry) => entry.id !== id);
      const fromCatalog = catalog.items.find((entry) => entry.id === id);
      const fromDetail = detail?.id === id ? detail : null;
      const next = fromCatalog || fromDetail;
      return next ? [next, ...prev] : prev;
    });
  }

  useEffect(() => {
    if (route.screen === 'auth' && account) go('profile');
  }, [route.screen, account]);

  const shown = catalog.items.filter((item) => {
    if (filters.section === 'vehicle') {
      if (filters.condition && item.condition !== filters.condition) return false;
      return !!item.vehicle;
    }
    if (filters.section) return !item.vehicle && item.sector === filters.section;
    return true;
  });
  const homeItems = catalog.items;
  const savedItems = me ? saved : demoSaved;
  const savedCount = me ? saved.length : demoSaved.length;
  const savedCurrent = me
    ? saved.some((entry) => entry.id === route.bid)
    : demoSaved.some((entry) => entry.id === route.bid);
  const screen = route.bid ? 'detail' : route.screen;
  const showDock = !route.bid && ['home', 'catalog', 'saved', 'alerts', 'profile', 'auth', 'plans'].includes(screen);

  return <div className="supplier-root">
    <DeskNav
      screen={screen}
      section={filters.section}
      q={filters.q}
      setQ={setQ}
      language={language}
      onLanguage={chooseLanguage}
      me={account}
      onHome={() => go('home')}
      onVehicles={() => go('catalog', 'vehicle')}
      onSaved={() => go('saved')}
      onAlerts={() => go('alerts')}
      onProfile={() => go('profile')}
      onSignIn={() => go('auth')}
    />
    <div className={'supplier-shell' + (route.bid ? ' has-detail-dock' : '') + (showDock ? ' has-dock' : '')}>
      {status && (
        <div role="status" className="callout alert">
          {status}
          <button type="button" aria-label="Dismiss message" onClick={() => setStatus('')}>×</button>
        </div>
      )}

      {route.bid ? (
        detail
          ? <DetailScreen
              item={detail}
              api={api}
              me={account}
              saved={savedCurrent}
              onBack={() => go(filters.section ? 'catalog' : 'home', filters.section)}
              onSave={() => {
                if (accessToken) {
                  void run(async () => {
                    await api('saved/' + route.bid, {method: savedCurrent ? 'DELETE' : 'PUT'});
                    await refresh();
                  });
                  return;
                }
                if (demoMe) {
                  toggleDemoSave(route.bid);
                  return;
                }
                go('auth');
              }}
              onSubscribe={() => go('plans')}
              onSignIn={() => go('auth')}
            />
          : detailError
            ? <div className="empty" role="alert">
                <p>{detailError}</p>
                <button type="button" className="outline" onClick={() => go(filters.section ? 'catalog' : 'home', filters.section)}>Back to listings</button>
              </div>
            : <p role="status">Loading opportunity…</p>
      ) : screen === 'auth' ? (
        <AuthScreen client={client} onBack={() => go('profile')} onDemoSignIn={handleDemoSignIn} />
      ) : screen === 'profile' ? (
        <ProfileScreen
          me={account}
          language={language}
          onLanguage={chooseLanguage}
          onSignIn={() => go('auth')}
          onSignOut={handleSignOut}
          onAlerts={() => go('alerts')}
          onSaved={() => go('saved')}
          onPlans={() => go('plans')}
          savedCount={savedCount}
        />
      ) : screen === 'plans' ? (
        <PlansScreen
          me={account}
          plans={plans}
          plansError={plansError}
          payments={payments}
          term={term}
          setTerm={setTerm}
          reference={reference}
          setReference={setReference}
          onAuth={() => go('auth')}
          onBack={() => go('profile')}
          onSubmit={(event) => {
            event.preventDefault();
            if (!accessToken) {
              setStatus(demoMe
                ? 'Demo sign-in cannot submit payments. Configure Supabase for real verification.'
                : 'Sign in to submit a payment reference.');
              return;
            }
            void run(async () => {
              await api('payments', {method: 'POST', data: {reference, months: term}});
              setReference('');
              setStatus('Payment reference submitted for staff verification.');
              setPayments(await api('payments'));
            });
          }}
        />
      ) : screen === 'saved' ? (
        <SavedScreen
          items={savedItems}
          guest={!me}
          onOpen={open}
          onRestore={() => setDemoSaved(catalog.items.slice(0, 2))}
        />
      ) : screen === 'alerts' ? (
        <AlertsScreen items={catalog.items} onOpen={open} onHome={() => go('home')} />
      ) : screen === 'catalog' ? (
        <CatalogScreen
          section={filters.section}
          q={filters.q}
          setQ={setQ}
          condition={filters.condition}
          setCondition={setCondition}
          items={shown}
          busy={busy}
          error={loadError}
          onSection={(key) => go('catalog', key)}
          onOpen={open}
          onHome={() => go('home')}
          onProfile={() => go('profile')}
          onAlerts={() => go('alerts')}
        />
      ) : (
        <HomeScreen
          q={filters.q}
          setQ={setQ}
          items={homeItems}
          onSection={(key) => go('catalog', key)}
          onOpen={open}
          onProfile={() => go('profile')}
        />
      )}
    </div>

    <SiteFooter
      me={account}
      compact={showDock || !!route.bid}
      onHome={() => go('home')}
      onSection={(key) => go('catalog', key)}
      onSaved={() => go('saved')}
      onAlerts={() => go('alerts')}
      onPlans={() => go('plans')}
      onProfile={() => go('profile')}
      onSignIn={() => go('auth')}
    />

    {showDock && (
      <Dock
        screen={screen}
        section={filters.section}
        onHome={() => go('home')}
        onVehicles={() => go('catalog', 'vehicle')}
        onSaved={() => go('saved')}
        onAlerts={() => go('alerts')}
      />
    )}
  </div>;
}
