(function () {
  if (window.__ccListingEmbed) return;
  window.__ccListingEmbed = true;

  var BASE = 'https://chatbot.circucity.com/demo/listing?embed=1';
  var label = 'List with AI';

  var btn = document.createElement('button');
  btn.textContent = label;
  btn.setAttribute('aria-label', label);
  btn.style.cssText = [
    'position:fixed',
    'right:24px',
    'bottom:24px',
    'z-index:2147483000',
    'display:inline-flex',
    'align-items:center',
    'gap:8px',
    'padding:0 20px',
    'height:48px',
    'border:0',
    'outline:0',
    'cursor:pointer',
    'font:700 14px/1 system-ui, sans-serif',
    'color:#0A1428',
    'background:linear-gradient(135deg,#A3E635,#9EF01A)',
    'border-radius:12px',
    'box-shadow:0 8px 24px rgba(163,230,53,0.35)',
    'transition:transform .15s ease, opacity .15s ease',
  ].join(';');
  btn.addEventListener('mouseenter', function () { btn.style.transform = 'translateY(-2px)'; });
  btn.addEventListener('mouseleave', function () { btn.style.transform = 'none'; });

  var panel = document.createElement('div');
  panel.style.cssText = [
    'position:fixed',
    'right:24px',
    'bottom:84px',
    'z-index:2147483000',
    'width:min(460px,calc(100vw - 32px))',
    'height:calc(100vh - 120px)',
    'min-height:520px',
    'background:#0A1428',
    'border-radius:20px',
    'border:1px solid rgba(255,255,255,0.12)',
    'box-shadow:0 24px 64px rgba(0,0,0,0.45)',
    'overflow:hidden',
    'transform:translateY(12px) scale(0.985)',
    'opacity:0',
    'pointer-events:none',
    'transition:opacity .2s ease, transform .2s ease',
  ].join(';');

  var frame = document.createElement('iframe');
  frame.src = BASE;
  frame.setAttribute('title', label);
  frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:#0A1428';
  panel.appendChild(frame);

  function open() {
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0) scale(1)';
    panel.style.pointerEvents = 'auto';
    btn.style.display = 'none';
  }

  function close() {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(12px) scale(0.985)';
    panel.style.pointerEvents = 'none';
    btn.style.display = 'inline-flex';
  }

  var closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = [
    'position:absolute',
    'top:10px',
    'right:10px',
    'z-index:1',
    'border:0',
    'outline:0',
    'cursor:pointer',
    'padding:6px 12px',
    'border-radius:8px',
    'font:600 12px/1 system-ui, sans-serif',
    'color:#fff',
    'background:rgba(255,255,255,0.12)',
  ].join(';');
  closeBtn.addEventListener('click', close);
  panel.appendChild(closeBtn);

  btn.addEventListener('click', open);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  document.body.appendChild(btn);
  document.body.appendChild(panel);
})();