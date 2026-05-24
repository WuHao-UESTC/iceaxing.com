'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { PreferenceTree } from './preference-tree';
import type { SubscriptionOption } from '@/lib/sanity/types';

interface Props {
  showHeading?: boolean;
}

export function SubscribeForm({ showHeading = true }: Props) {
  const t = useTranslations('subscribe');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<SubscriptionOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/subscription-options');
        const json = await res.json();
        if (!cancelled && json.success) {
          setOptions(json.data);
        }
      } catch {
        // options fetch failure is non-fatal
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelectionChange = useCallback((next: Set<string>) => {
    setSubscriptions(next);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStatus('loading');

    const trimmedEmail = email.trim();

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          locale,
          subscriptions: [...subscriptions],
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(String(data.message ?? '') || t('success'));
        setEmail('');
        setSubscriptions(new Set());
      } else {
        setStatus('error');
        setMessage(String(data.message ?? '') || t('error'));
      }
    } catch {
      setStatus('error');
      setMessage(t('networkError'));
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === 'success') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showHeading && (
        <h3 className="font-semibold text-sm">{t('title')}</h3>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('placeholder')}
          required
          className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-zinc-400 transition-colors"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </button>
      </div>

      {/* Subscription preferences */}
      <fieldset className="border rounded-lg p-3">
        <legend className="text-xs text-zinc-500 px-1">
          {t('preferencesLabel')}
        </legend>
        {optionsLoading ? (
          <p className="text-xs text-zinc-400 py-2">{t('loadingOptions')}</p>
        ) : (
          <PreferenceTree
            options={options}
            selected={subscriptions}
            onSelectionChange={handleSelectionChange}
          />
        )}
        <p className="text-xs text-zinc-400 mt-1">{t('preferencesHint')}</p>
      </fieldset>

      {status === 'error' && (
        <p className="text-sm text-red-600">{message}</p>
      )}
    </form>
  );
}
