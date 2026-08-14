'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function FacebookSDK() {
  useEffect(() => {
    fetch('/api/admin/meta-config')
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data?.metaAppId) return;
        const appId = d.data.metaAppId;

        window.fbAsyncInit = function () {
          window.FB.init({
            appId,
            cookie: true,
            xfbml: true,
            version: 'v19.0',
          });
          window.FB.AppEvents.logPageView();
        };

        if (!document.getElementById('facebook-jssdk')) {
          const script = document.createElement('script');
          script.id = 'facebook-jssdk';
          script.src = 'https://connect.facebook.net/en_US/sdk.js';
          script.async = true;
          script.defer = true;
          document.body.appendChild(script);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
