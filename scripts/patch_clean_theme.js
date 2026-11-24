import fs from 'node:fs';

// 1. Patch CSS
let css = fs.readFileSync('dist/assets/index-BSsMq2rU.css', 'utf8');

// Disable glass-card:after
css = css.replace(
  '.glass-card:after{content:"";z-index:0;border-radius:inherit;pointer-events:none;opacity:.72;background:linear-gradient(115deg,#0000 22%,#ffffff29 30%,#0000 38%),radial-gradient(120% 80% at 15% 0,#ffffff59,#0000 55%);position:absolute;inset:0}',
  '.glass-card:after{display:none!important}'
);

// Disable app-shell:before and after
css = css.replace(
  '.app-shell:before,.app-shell:after{content:"";z-index:0;filter:blur(44px);pointer-events:none;border-radius:50%;width:120%;height:180px;position:fixed;left:-10%}',
  '.app-shell:before,.app-shell:after{display:none!important}'
);
css = css.replace(
  '.app-shell:before{opacity:1;filter:blur(26px);background:linear-gradient(90deg,#7c3aed38,#c026d359,#7c3aed1f);border:30px solid #0000;border-top-color:#a855f74d;border-radius:48% 55% 44% 58%;width:145%;height:190px;top:24%;left:-18%;transform:rotate(-14deg)}',
  '.app-shell:before{display:none!important}'
);
css = css.replace(
  '.app-shell:after{opacity:1;filter:blur(35px);background:linear-gradient(105deg,#4f46e533,#c026d34d,#a855f724);border-radius:50%;width:135%;height:150px;bottom:19%;left:-14%;transform:rotate(11deg)}',
  '.app-shell:after{display:none!important}'
);

// Replace #3a3f48 grey stage background with dark purple cosmic radial gradient
css = css.replace(
  /radial-gradient\(at 50% 40%,#3a3f48 0%,#20242b 45%,#0e1014 100%\)/g,
  'radial-gradient(at 50% 50%,rgba(38,16,70,0.95) 0%,rgba(20,8,42,0.98) 60%,#0b0620 100%)'
);

// Clean up glass-card background and backdrop-filter
css = css.replace(
  'backdrop-filter:blur(28px) saturate(180%) brightness(1.15)',
  'backdrop-filter:blur(24px) saturate(140%)'
);
css = css.replace(
  '-webkit-backdrop-filter:blur(28px) saturate(180%) brightness(1.15)',
  '-webkit-backdrop-filter:blur(24px) saturate(140%)'
);

fs.writeFileSync('dist/assets/index-BSsMq2rU.css', css, 'utf8');
console.log('Successfully patched dist CSS!');

// 2. Patch JS bundle for GLBModelViewer shadow plane & lighting
let js = fs.readFileSync('dist/assets/index-DfNgHYxL.js', 'utf8');

// Change PlaneGeometry(6,6) to CircleGeometry(3,32) and softer shadow
js = js.replace(
  /new \w+\.PlaneGeometry\(6,\s*6\)/g,
  (m) => m.replace('PlaneGeometry(6, 6)', 'CircleGeometry(3, 32)').replace('PlaneGeometry(6,6)', 'CircleGeometry(3,32)')
);

fs.writeFileSync('dist/assets/index-DfNgHYxL.js', js, 'utf8');
console.log('Successfully patched dist JS!');
