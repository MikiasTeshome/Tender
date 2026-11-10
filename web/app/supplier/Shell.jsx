'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DeskNav, Dock } from './components.jsx';
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
  const [route, setRoute] = useState({bid: '', screen: 'home', section: ''});
  const [filters, setFilters] = useState(emptyFilters);
  const [catalog, setCatalog] = useState({items: []});
  const [detail, setDetail] = useState(null);
  const [saved, setSaved] = useState([]);
  const [demoSaved, setDemoSaved] = useState([]);
  const [plans, setPlans] = useState(null);
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(true);
  const [language, setLanguage] = useState('en');
  const [reference, setReference] = useState('');
  const [term, setTerm] = useState('');

  const accessToken = session?.access_token;
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
    const [account, list] = await Promise.all([api('me'), api('saved')]);
    setMe(account);
    setSaved(list);
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
      setRoute(next);
      if (next.bid) return;
      if (next.screen === 'catalog') {
        setFilters((prev) => ({
          ...emptyFilters,
          q: prev.q,
          section: next.section || '',
        }));
      } else if (next.screen === 'home') {
        setFilters(emptyFilters);
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
    if (route.screen === 'auth' && me) go('profile');
  }, [route.screen, me]);

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
    if (!route.bid) return;
    const controller = new AbortController();
    api('listings/' + encodeURIComponent(route.bid), {signal: controller.signal})
      .then(setDetail)
      .catch((error) => {
        if (!controller.signal.aborted) setStatus(errorText(error));
      });
    return () => controller.abort();
  }, [api, route.bid]);

  useEffect(() => {
    if (route.screen !== 'plans') return;
    api('plans').then(setPlans).catch((error) => setStatus(errorText(error)));
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
    writeRoute(next);
    setRoute({bid: next.bid || '', screen: next.screen || 'home', section: next.section || ''});
    window.scrollTo(0, 0);
  }

  function go(screen, section = '') {
    setStatus('');
    if (screen === 'catalog') {
      setFilters((prev) => ({...emptyFilters, q: prev.q, section}));
      navigate({screen: 'catalog', section});
      return;
    }
    setFilters((prev) => ({...emptyFilters, q: screen === 'home' ? '' : prev.q}));
    navigate({screen, section: ''});
  }

  function open(id) {
    setStatus('');
    navigate({bid: id});
  }

  function setQ(value) {
    setStatus('');
    setFilters((prev) => ({...prev, q: value}));
    if (value && route.screen === 'home') navigate({screen: 'catalog', section: filters.section});
  }

  function setCondition(value) {
    setFilters((prev) => ({...prev, condition: value}));
  }

  function chooseLanguage(next) {
    setLanguage(next);
    window.localStorage.setItem('bid-lang', next);
  }

  const shown = catalog.items.filter((item) => {
    if (filters.section === 'vehicle') {
      if (filters.condition && item.condition !== filters.condition) return false;
      return !!item.vehicle;
    }
    if (filters.section) return !item.vehicle && item.sector === filters.section;
    return true;
  });
  const homeItems = catalog.items;
  const savedItems = me && saved.length ? saved : demoSaved;
  const savedCurrent = saved.some((entry) => entry.id === route.bid);
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
      me={me}
      onHome={() => go('home')}
      onVehicles={() => go('catalog', 'vehicle')}
      onSaved={() => go('saved')}
      onAlerts={() => go('alerts')}
      onProfile={() => go('profile')}
      onSignIn={() => go('auth')}
      onSection={(key) => go('catalog', key)}
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
              me={me}
              saved={savedCurrent}
              onBack={() => go(filters.section ? 'catalog' : 'home', filters.section)}
              onSave={() => run(async () => {
                await api('saved/' + route.bid, {method: savedCurrent ? 'DELETE' : 'PUT'});
                await refresh();
              })}
              onSubscribe={() => go('plans')}
              onSignIn={() => go('auth')}
            />
          : !status && <p>Loading opportunity…</p>
      ) : screen === 'auth' ? (
        <AuthScreen client={client} onBack={() => go('profile')} />
      ) : screen === 'profile' ? (
        <ProfileScreen
          me={me}
          language={language}
          onLanguage={chooseLanguage}
          onSignIn={() => go('auth')}
          onAlerts={() => go('alerts')}
          onSaved={() => go('saved')}
          onPlans={() => go('plans')}
        />
      ) : screen === 'plans' ? (
        <PlansScreen
          me={me}
          plans={plans}
          payments={payments}
          term={term}
          setTerm={setTerm}
          reference={reference}
          setReference={setReference}
          onAuth={() => go('auth')}
          onBack={() => go('profile')}
          onSubmit={(event) => {
            event.preventDefault();
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
