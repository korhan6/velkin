/**
 * Tiny scripts inlined in <head> (run before first paint). Must live in a plain (non-'use client') module
 * so the server receives the strings, not client references.
 */
export const CONSENT_COOKIE = 'vk_consent';

/** Lets CSS hide `.reveal` content only when JS will reveal it (no-JS visitors see everything). */
export const JS_FLAG = `document.documentElement.classList.add('js')`;

/** Returning visitors (or Global Privacy Control) → hide the server-rendered consent banner before paint. */
export const CONSENT_FLAG = `try{if(document.cookie.indexOf('${CONSENT_COOKIE}=')>-1||navigator.globalPrivacyControl===true)document.documentElement.classList.add('vk-consented')}catch(e){}`;
