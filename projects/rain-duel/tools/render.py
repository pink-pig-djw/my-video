#!/usr/bin/env python3
"""Frame-by-frame renderer for the MV (adapted from the AI速通 render.py): a local http server, headless system
Chrome opening src/index.html?render=1, window.renderFrame(t) per frame, canvas pixels piped to ffmpeg.

  stills: uv run --no-project --with playwright python tools/render.py --stills 3.2,15.4 --out render/stills
  chunk : uv run --no-project --with playwright python tools/render.py --from 0 --to 30 --fps 30 --out render/chunks/p00.mp4
  full  : uv run --no-project --with playwright python tools/render.py --jobs 4 --fps 30 --out out/evil_plan_mv.mp4
          (the timeline is cut into --chunk-second pieces rendered by a pool of --jobs workers with a light, high-quality
           intermediate encode; finished pieces are kept and skipped on a rerun; one final x264 pass joins them with the song)
Page errors (console.error / pageerror) make the run exit non-zero after rendering.
"""
import argparse, base64, functools, http.server, json, os, socketserver, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFMPEG = os.environ.get('FFMPEG', 'D:/LenovoSoftstore/Install/Zipjieyasuo/ffmpeg.exe')
ap = argparse.ArgumentParser()
ap.add_argument('--out', required=True)
ap.add_argument('--fps', type=int, default=24)
ap.add_argument('--from', dest='t0', type=float, default=0.0)
ap.add_argument('--to', dest='t1', type=float, default=None)
ap.add_argument('--stills')
ap.add_argument('--jobs', type=int, default=0)
ap.add_argument('--crf', type=int, default=17)
ap.add_argument('--preset', default='medium')
ap.add_argument('--threads', type=int, default=3)
ap.add_argument('--chunk', type=float, default=16.0)
ap.add_argument('--page', default='src/index.html')
ap.add_argument('--quality', type=float, default=0.93)
ap.add_argument('--audio', default=str(ROOT / 'audio' / 'song.wav'))
ap.add_argument('--final-preset', default='slow')
ap.add_argument('--thumbs', action='store_true')
ap.add_argument('--chunks', default='chunks')
a = ap.parse_args()


def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *x): pass
    class S(socketserver.ThreadingTCPServer):
        request_queue_size = 128
        daemon_threads = True
        allow_reuse_address = True
    srv = S(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def total_len():
    from playwright.sync_api import sync_playwright
    srv = serve()
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome')
        pg = b.new_page(viewport={'width': 1920, 'height': 1080})
        pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/{a.page}?render=1')
        pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=180000)
        t = pg.evaluate('window.__total')
        b.close()
    srv.shutdown()
    return t


def parallel():
    t1 = a.t1 if a.t1 is not None else total_len()
    n0, n1 = round(a.t0 * a.fps), round(t1 * a.fps)
    step = max(1, int(round(a.chunk * a.fps)))
    chunks = ROOT / 'render' / a.chunks
    chunks.mkdir(parents=True, exist_ok=True)
    tasks = [(k, f0, min(n1, f0 + step), chunks / f'{Path(a.page).stem}_c_{f0:06d}_{min(n1, f0 + step):06d}.mp4') for k, f0 in enumerate(range(n0, n1, step))]
    st = time.time()

    def run(task):
        k, f0, f1, part = task
        ok = part.with_suffix('.ok')
        if part.exists() and ok.exists():
            return k, 0
        with open(part.with_suffix('.log'), 'w', encoding='utf-8') as log:
            cmd = [sys.executable, __file__, '--page', a.page, '--fps', str(a.fps), '--crf', '12', '--preset', 'veryfast', '--threads', '3',
                   '--from', f'{f0 / a.fps:.6f}', '--to', f'{f1 / a.fps:.6f}', '--out', str(part)]
            rc = subprocess.run(cmd, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, env=dict(os.environ, PYTHONIOENCODING='utf-8')).returncode
        if rc == 0:
            ok.write_text('ok')
        print(f'chunk {k + 1}/{len(tasks)} frames {f0}-{f1} rc={rc}  {time.time() - st:.0f}s', flush=True)
        return k, rc

    with ThreadPoolExecutor(a.jobs) as ex:
        res = list(ex.map(run, tasks))
    bad = [k for k, rc in res if rc != 0]
    if bad:
        print('FAILED chunks:', bad, '(rerun the same command to retry only those)')
        sys.exit(1)
    lst = chunks / 'list.txt'
    lst.write_text(''.join(f"file '{t[3].as_posix()}'\n" for t in tasks), encoding='utf-8')
    out = Path(a.out) if Path(a.out).is_absolute() else ROOT / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    dur = (n1 - n0) / a.fps
    print(f'final encode ({dur:.1f}s) ...', flush=True)
    subprocess.run([FFMPEG, '-y', '-v', 'error', '-stats', '-f', 'concat', '-safe', '0', '-i', str(lst), '-ss', f'{a.t0:.6f}', '-i', a.audio,
                    '-filter_complex', f'[1:a]apad,atrim=0:{dur:.6f}[aa]', '-map', '0:v', '-map', '[aa]',
                    '-c:v', 'libx264', '-preset', a.final_preset, '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-threads', '8', '-r', str(a.fps),
                    '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-t', f'{dur:.6f}', str(out)], check=True)
    print(f'done -> {out} ({time.time() - st:.0f}s)')


def single():
    from playwright.sync_api import sync_playwright
    srv = serve()
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', args=['--disable-web-security', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'])
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
        def on_console(m):
            if 'favicon' in (m.location or {}).get('url', ''): return
            if m.type in ('error', 'warning'): print('[page]', m.text, flush=True)
            if m.type == 'error' and 'Failed to load resource' not in m.text: errors.append(m.text)
        pg.on('console', on_console)
        pg.on('pageerror', lambda e: (print('[pageerror]', e, flush=True), errors.append(str(e))))
        pg.on('response', lambda r: print('[http]', r.status, r.url, flush=True) if r.status >= 400 else None)
        if a.thumbs:
            rng = '&thumbs=1'
        elif a.stills:
            ts = [float(x) for x in a.stills.split(',')]
            rng = f'&t0={min(ts):.3f}&t1={max(ts):.3f}'
        else:
            rng = f'&t0={a.t0:.3f}&t1={a.t1:.3f}' if a.t1 is not None else ''
        pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/{a.page}?render=1{rng}')
        pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=180000)
        bf = pg.evaluate('window.__bootFailed || null')
        if bf: raise SystemExit('boot failed:\n' + bf)
        if a.thumbs:
            out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
            for it in pg.evaluate('window.__makeThumbs()'):
                if 'error' in it: print('thumb error', it['id'], it['error']); continue
                (out / f"{it['id']}.png").write_bytes(base64.b64decode(it['data'].split(',')[1]))
                print('thumb', it['id'], round(it['t'], 2))
        elif a.stills:
            out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
            grab = "async (t)=>{ await window.renderFrame(t); return window.__canvas.toDataURL('image/jpeg', 0.9).split(',')[1]; }"
            for s in a.stills.split(','):
                tt = float(s)
                (out / f't{tt:07.2f}.jpg').write_bytes(base64.b64decode(pg.evaluate(grab, tt)))
            print('stills ->', out)
        else:
            t1 = a.t1 if a.t1 is not None else pg.evaluate('window.__total')
            outp = Path(a.out); outp.parent.mkdir(parents=True, exist_ok=True)
            ff = subprocess.Popen([FFMPEG, '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'mjpeg', '-i', '-',
                                   '-c:v', 'libx264', '-preset', a.preset, '-crf', str(a.crf), '-threads', str(a.threads), '-pix_fmt', 'yuv420p', '-r', str(a.fps), str(outp)], stdin=subprocess.PIPE)
            grab = f"async (t)=>{{ await window.renderFrame(t); return window.__canvas.toDataURL('image/jpeg', {a.quality}).split(',')[1]; }}"
            n0, n1 = round(a.t0 * a.fps), round(t1 * a.fps)
            st = time.time()
            for i in range(n0, n1):
                ff.stdin.write(base64.b64decode(pg.evaluate(grab, i / a.fps)))
                if (i - n0) % 90 == 0:
                    el = time.time() - st
                    print(f'{i}/{n1}  {el:.0f}s  {(i - n0 + 1) / max(el, 1e-3):.1f} fps', flush=True)
            ff.stdin.close(); ff.wait()
            print('done ->', outp)
        b.close()
    srv.shutdown()
    if errors:
        raise SystemExit(f'page reported {len(errors)} error(s)')


if a.jobs > 1:
    parallel()
else:
    single()
