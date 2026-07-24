import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { emailPrefs } from '../../services/api';

// Public page reached from the "Unsubscribe" link in emails (?token=...).
// Honors the opt-out immediately, then offers a one-click resubscribe.
const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState('loading'); // loading | unsubscribed | resubscribed | error
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState('error'); setError('This unsubscribe link is missing its token.'); return; }
    (async () => {
      try {
        const res = await emailPrefs.unsubscribe(token);
        setEmail(res?.email || '');
        setState('unsubscribed');
      } catch (e) {
        setState('error');
        setError(e.message || 'This unsubscribe link is invalid or has expired.');
      }
    })();
  }, [token]);

  const resubscribe = async () => {
    setBusy(true);
    try {
      await emailPrefs.resubscribe(token);
      setState('resubscribed');
    } catch (e) {
      setError(e.message || 'Could not resubscribe.');
    } finally {
      setBusy(false);
    }
  };

  const unsubscribeAgain = async () => {
    setBusy(true);
    try {
      await emailPrefs.unsubscribe(token);
      setState('unsubscribed');
    } catch (e) {
      setError(e.message || 'Could not unsubscribe.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040b0b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#081414] border border-[#142e2e] rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-[#00ff88]" />
        </div>

        {state === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Updating your email preferences…</p>
          </>
        )}

        {state === 'unsubscribed' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-[#00ff88] mx-auto mb-3" />
            <h1 className="text-white text-xl font-bold mb-2">You've been unsubscribed</h1>
            <p className="text-gray-400 text-sm mb-1">
              {email ? <span className="text-gray-300 font-medium">{email}</span> : 'This address'} will no longer receive marketing or notification emails from LenientTree.
            </p>
            <p className="text-gray-600 text-xs mb-6">Important account emails (like password resets and security alerts) will still be sent.</p>
            <button onClick={resubscribe} disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-[#00b36b] hover:bg-[#00c878] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Changed your mind? Resubscribe
            </button>
          </>
        )}

        {state === 'resubscribed' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-[#00ff88] mx-auto mb-3" />
            <h1 className="text-white text-xl font-bold mb-2">You're resubscribed</h1>
            <p className="text-gray-400 text-sm mb-6">
              {email ? <span className="text-gray-300 font-medium">{email}</span> : 'This address'} will receive LenientTree emails again.
            </p>
            <button onClick={unsubscribeAgain} disabled={busy}
              className="w-full flex items-center justify-center gap-2 border border-[#1a4d4d] hover:border-red-500/50 text-gray-300 hover:text-red-400 font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Unsubscribe again
            </button>
          </>
        )}

        {state === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h1 className="text-white text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
          </>
        )}

        <Link to="/" className="inline-block mt-6 text-[#00ff88] text-sm hover:underline">← Back to LenientTree</Link>
      </div>
    </div>
  );
};

export default Unsubscribe;
