if(!self.define){const e=e=>{"require"!==e&&(e+=".js");let s=Promise.resolve();return n[e]||(s=new Promise((async s=>{if("document"in self){const n=document.createElement("script");n.src=e,document.head.appendChild(n),n.onload=s}else importScripts(e),s()}))),s.then((()=>{if(!n[e])throw new Error(`Module ${e} didn’t register its module`);return n[e]}))},s=(s,n)=>{Promise.all(s.map(e)).then((e=>n(1===e.length?e[0]:e)))},n={require:Promise.resolve(s)};self.define=(s,r,i)=>{n[s]||(n[s]=Promise.resolve().then((()=>{let n={};const t={uri:location.origin+s.slice(1)};return Promise.all(r.map((s=>{switch(s){case"exports":return n;case"module":return t;default:return e(s)}}))).then((e=>{const s=i(...e);return n.default||(n.default=s),n}))})))}}define("./sw.js",["./workbox-ea903bce"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/BSjSLIvvV3w9dvC8jIgr1/_buildManifest.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/BSjSLIvvV3w9dvC8jIgr1/_ssgManifest.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/224.95c116ff2b337769d0b8.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/29107295.2648cb5e919f7c78c7cc.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/666.08a063a9d36bc18279e5.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/764.ab43ce83a44483c339f7.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/773.92221d49731644439af8.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/881-dfad5bf9c2ba77139617.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/8ebce0ea.5ef866eed786f241f68a.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/914.975fd1ad6a2659197859.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/949.150626f9009da61bec9d.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/971.1901ecf466d5cfafa548.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/a4bb5219.d535a108b254b4fc6126.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/framework-d23658296916ce920464.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/main-cd8dd92c03ec9e36a72f.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/pages/_app-ec15c0f0679748887f9b.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/pages/_error-82a806cd39f8ab3dc3ac.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/pages/index-d95675ebbb2ace2853a7.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/polyfills-a54b4f32bdc1ef890ddd.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/chunks/webpack-f9fa74042116d6d4c75e.js",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/_next/static/css/98123c684855979436f3.css",revision:"BSjSLIvvV3w9dvC8jIgr1"},{url:"/favicon.ico",revision:"c30c7d42707a47a3f4591831641e50dc"},{url:"/icons/icon-128x128.png",revision:"d626cfe7c65e6e5403bcbb9d13aa5053"},{url:"/icons/icon-144x144.png",revision:"e53a506b62999dc7a4f8b7222f8c5add"},{url:"/icons/icon-152x152.png",revision:"18b3958440703a9ecd3c246a0f3f7c72"},{url:"/icons/icon-16x16.png",revision:"83703514f19796ee15151e450984416d"},{url:"/icons/icon-192x192.png",revision:"27dc12f66697a47b6a8b3ee25ba96257"},{url:"/icons/icon-32x32.png",revision:"25e2c6ee34840568012b32e4314278df"},{url:"/icons/icon-384x384.png",revision:"a40324a3fde2b0b26eeffd4f08bf8be8"},{url:"/icons/icon-512x512.png",revision:"93d6e8e15cfa78dfee55446f607d9a28"},{url:"/icons/icon-72x72.png",revision:"f2ffc41b3482888f3ae614e0dd2f6980"},{url:"/icons/icon-96x96.png",revision:"fba02a40f7ba6fc65be8a2f245480f6d"},{url:"/manifest.json",revision:"c96057f6fe080d95b52920d55437ade9"},{url:"/vercel.svg",revision:"4b4f1876502eb6721764637fe5c41702"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:r})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\.(?:mp3|mp4)$/i,new e.StaleWhileRevalidate({cacheName:"static-media-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600,purgeOnQuotaError:!0})]}),"GET")}));
