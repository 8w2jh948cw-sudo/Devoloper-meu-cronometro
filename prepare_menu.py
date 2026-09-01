from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
SITE = ROOT / "site"
STABLE_RELEASE = os.environ.get("STABLE_RELEASE", "0.8.8").strip()
BETA_LABEL = os.environ.get("BETA_LABEL", "0.8.9-beta.2").strip()

if not SITE.exists():
    raise SystemExit("site/ ausente")
if not (SITE / "beta").exists():
    raise SystemExit("site/beta/ ausente")

menu = SITE / "menu"
menu.mkdir(exist_ok=True)

html = f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#101118">
  <meta name="robots" content="noindex,nofollow">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Cronômetro Menu">
  <title>Menu · Cronômetro</title>
  <link rel="icon" href="../icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="../icon.svg">
  <style>
    :root{{--bg:#0d0f17;--card:#171924;--card2:#1e2130;--text:#f7f7fb;--muted:#9b9dad;--line:#2b2e40;--violet:#a784ff;--blue:#64a8ff;--green:#55d879;--orange:#ffad38;--red:#ff5a5f}}
    *{{box-sizing:border-box}}
    html,body{{margin:0;min-height:100%;background:radial-gradient(circle at 78% -10%,rgba(108,92,255,.16),transparent 34%),var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}}
    body{{min-height:100dvh}}
    main{{width:min(100%,500px);margin:0 auto;padding:calc(24px + env(safe-area-inset-top)) 16px calc(38px + env(safe-area-inset-bottom))}}
    header{{padding:3px 4px 20px}}
    .headrow{{display:flex;align-items:center;gap:13px;margin-bottom:8px}}
    .headicon{{width:54px;height:54px;border-radius:16px;overflow:hidden;flex:none;box-shadow:0 6px 22px rgba(102,92,255,.18)}}
    .headicon img{{width:100%;height:100%;display:block}}
    h1{{font-size:30px;line-height:1.05;margin:0;letter-spacing:-.035em}}
    .lead{{margin:0;color:var(--muted);font-size:13.5px;line-height:1.45}}
    .section-title{{margin:22px 4px 9px;font-size:11.5px;letter-spacing:.085em;text-transform:uppercase;color:#74778a;font-weight:780}}
    .grid{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
    .card{{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;background:linear-gradient(180deg,var(--card2),var(--card));border:1px solid var(--line);border-radius:19px;padding:14px;min-height:80px;-webkit-tap-highlight-color:transparent;transition:transform .12s ease,border-color .12s ease}}
    .card:active{{transform:scale(.985);border-color:#52566d}}
    .card.wide{{grid-column:1/-1}}
    .app-card{{align-items:flex-start;min-height:116px;padding:15px}}
    .icon{{width:46px;height:46px;border-radius:13px;display:grid;place-items:center;flex:0 0 auto;background:#272a39;border:1px solid #35394c;overflow:hidden}}
    .app-card .icon{{width:58px;height:58px;border-radius:16px;background:transparent;border:0}}
    .icon img{{width:100%;height:100%;display:block;object-fit:cover}}
    .icon svg{{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}}
    .copy{{min-width:0;flex:1}}
    .copy strong{{display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:15px;line-height:1.2;margin-bottom:4px}}
    .copy small{{display:block;color:var(--muted);font-size:11.4px;line-height:1.36}}
    .tag{{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;font-size:9px;line-height:1;background:#332a59;color:#c9bdff;font-weight:820;letter-spacing:.035em}}
    .tag.stable{{background:#173a22;color:#87e69a}}.tag.beta{{background:#3b2373;color:#d0b5ff}}.tag.warn{{background:#4c3312;color:#ffd06e}}
    .arrow{{color:#727589;font-size:24px;line-height:1;margin-left:auto}}
    .note{{margin:18px 4px 0;padding:13px 14px;border-radius:15px;background:#151720;border:1px solid var(--line);color:var(--muted);font-size:12px;line-height:1.46}}
    .note strong{{color:var(--text)}}
    @media(max-width:370px){{.grid{{grid-template-columns:1fr}}.card.wide{{grid-column:auto}}}}
  </style>
</head>
<body>
<main>
  <header>
    <div class="headrow"><span class="headicon"><img src="../icon.svg" alt=""></span><h1>Cronômetro</h1></div>
    <p class="lead">Menu de acesso à versão Oficial, Beta e ferramentas de diagnóstico e recuperação.</p>
  </header>

  <div class="section-title">Apps</div>
  <div class="grid">
    <a class="card app-card" href="../">
      <span class="icon"><img src="../icon.svg" alt=""></span>
      <span class="copy"><strong>Oficial <span class="tag stable">USO DIÁRIO</span></strong><small>Versão estável · v{STABLE_RELEASE}<br>Seus registros reais.</small></span>
    </a>
    <a class="card app-card" href="../beta/">
      <span class="icon"><img src="../beta/app-icon-beta-192.png" alt=""></span>
      <span class="copy"><strong>Beta <span class="tag beta">TESTES</span></strong><small>Atualizações · v{BETA_LABEL}<br>Dados isolados.</small></span>
    </a>
  </div>

  <div class="section-title">Diagnóstico</div>
  <div class="grid">
    <a class="card wide" href="../diagnostico/">
      <span class="icon" style="color:var(--violet)"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.6 1.6"/><path d="M4 4l2 2M20 4l-2 2M4 20l2-2M20 20l-2-2"/></svg></span>
      <span class="copy"><strong>Central de Diagnóstico</strong><small>Ponto de partida para abertura, recuperação e verificação de dados.</small></span><span class="arrow">›</span>
    </a>
  </div>

  <div class="section-title">Ferramentas do Oficial</div>
  <div class="grid">
    <a class="card" href="../launch.html"><span class="icon" style="color:var(--blue)"><svg viewBox="0 0 24 24"><path d="M5 13c2.5-5 7-8 14-8-1 7-4 11.5-9 14l-5-6Z"/><path d="M14 10h.01"/><path d="M5 13 2 16l5 1"/><path d="m10 19 1 3 3-4"/></svg></span><span class="copy"><strong>Inicializador</strong><small>Abertura limpa do app Oficial.</small></span></a>
    <a class="card" href="../recover.html"><span class="icon" style="color:var(--orange)"><svg viewBox="0 0 24 24"><path d="M4 7h6v6"/><path d="M5.5 17a8 8 0 1 0 1-10L4 9"/></svg></span><span class="copy"><strong>Recuperação</strong><small>Remove somente cache/runtime.</small></span></a>
    <a class="card wide" href="../safe.html"><span class="icon" style="color:var(--green)"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span><span class="copy"><strong>Modo Seguro</strong><small>Verifica o banco Oficial e permite backup de emergência sem carregar o app principal.</small></span><span class="arrow">›</span></a>
  </div>

  <div class="section-title">Ferramentas da Beta</div>
  <div class="grid">
    <a class="card" href="../beta/launch.html"><span class="icon" style="color:var(--blue)"><svg viewBox="0 0 24 24"><path d="M5 13c2.5-5 7-8 14-8-1 7-4 11.5-9 14l-5-6Z"/><path d="M14 10h.01"/><path d="M5 13 2 16l5 1"/><path d="m10 19 1 3 3-4"/></svg></span><span class="copy"><strong>Inicializador Beta</strong><small>Abertura limpa dos testes.</small></span></a>
    <a class="card" href="../beta/recover.html"><span class="icon" style="color:var(--orange)"><svg viewBox="0 0 24 24"><path d="M4 7h6v6"/><path d="M5.5 17a8 8 0 1 0 1-10L4 9"/></svg></span><span class="copy"><strong>Recuperar Beta</strong><small>Não afeta a versão Oficial.</small></span></a>
    <a class="card wide" href="../beta/safe.html"><span class="icon" style="color:var(--green)"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg></span><span class="copy"><strong>Modo Seguro Beta</strong><small>Inspeciona somente o banco de testes e cria backup da Beta.</small></span><span class="arrow">›</span></a>
  </div>

  <div class="note"><strong>Importante:</strong> a Beta usa armazenamento separado. O botão “Copiar dados do Oficial” cria apenas uma cópia para testes. Alterações, exclusões e cronometrações feitas na Beta não modificam seus registros reais.</div>
</main>
</body>
</html>'''

(menu / "index.html").write_text(html, encoding="utf-8")
root_html = html.replace('../', './')
(SITE / "menu.html").write_text(root_html, encoding="utf-8")

if not (SITE / "menu.html").exists() or (SITE / "menu.html").stat().st_size < 1000:
    raise SystemExit("Falha ao gerar site/menu.html")
if 'href="./beta/"' not in root_html or 'src="./beta/app-icon-beta-192.png"' not in root_html:
    raise SystemExit("Links relativos do menu.html incorretos")

print(f"Menus publicados em /menu/ e /menu.html · Oficial {STABLE_RELEASE} · Beta {BETA_LABEL}")
