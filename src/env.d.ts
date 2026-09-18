/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Google Tag Manager container ID (GTM-XXXXXXX).
   *
   * PUBLIC_ because it is inlined into the client bundle -- a container ID is
   * not a secret, it is visible in any page that loads GTM. Left unset, the
   * loader, the noscript fallback and the consent banner all no-op, so local
   * dev and any build without it stay free of analytics entirely.
   */
  readonly PUBLIC_GTM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
