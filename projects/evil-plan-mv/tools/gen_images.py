"""Batch image generation through the Codex CLI (adapted from comics/tools/gen.py).

Usage:
    python tools/gen_images.py tools/jobs_wave1.json            # every missing image
    python tools/gen_images.py tools/jobs_wave1.json id1 id2    # only these ids (regenerates)
    python tools/gen_images.py tools/jobs_wave1.json -j 5       # concurrency

Each job: {"id", "out", "aspect", "prompt", "refs": [paths], "style": "day|night|sprite|..."}.
Codex is asked to only call its image tool; the PNG is picked up from
~/.codex/generated_images/<thread_id>/ and copied to "out".
Model is fixed to gpt-6-sol with medium reasoning effort (user's instruction).
"""
import json
import shutil
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GEN_DIR = Path.home() / ".codex" / "generated_images"
LOG_DIR = ROOT / "tools" / "logs"
CODEX = shutil.which("codex.cmd") or shutil.which("codex")
MODEL = "gpt-6-sol"

BASE = (
    "High-quality Japanese anime key-visual illustration that matches the art style of the attached reference character art "
    "when one is attached: delicate clean line art, soft cel shading with gentle gradients, luminous painterly backgrounds, "
    "cinematic composition and lighting like a modern Japanese animated film, light film grain. "
    "Absolutely NO text, letters, numbers, digits, logos, UI text, captions, speech bubbles, signatures or watermarks anywhere."
)
STYLES = {
    "day": BASE + " Palette: warm cream, ivory, tangerine orange, honey gold and soft sky blue; bright, hopeful daylight.",
    "night": BASE + " Palette: deep indigo and navy night tones lit by warm tangerine-orange lamplight and candle glow; cozy, intimate.",
    "warm": BASE + " Palette: warm cream, amber, tangerine and chocolate brown; tender golden lamplight.",
    "cool": BASE + " Palette: quiet hospital blues and grey-greens with one warm amber light source; gentle, respectful, never graphic.",
    "sprite": BASE + " This is a cut-out character sprite: plain flat solid light-grey background (#D8D8D8) with nothing else on it, "
              "no floor, no cast shadow, no props unless described. The entire figure must be fully inside the frame with a generous margin "
              "on every side (do not crop hair, hands, feet or props).",
    "edit": "Precise image edit, not a new drawing: reproduce the attached image as exactly as possible (same framing, "
            "crop, character, face, eyes, hair strands, colours, line art, lighting and background) and change only what "
            "the scene asks to change. Keep the attached image's art style. No text anywhere.",
}

ASPECTS = {
    "landscape": "Landscape orientation, 3:2 aspect ratio (wide). Compose for a later 16:9 crop: keep every important element "
                 "out of the top 6% and bottom 6% of the frame.",
    "portrait": "Portrait orientation, 2:3 aspect ratio (tall).",
    "square": "Square 1:1 aspect ratio.",
}

CLAUDE = (
    "the ORIGINAL girl from the attached reference image, kept exactly on-model: a cheerful young woman with very long, voluminous, "
    "wavy tangerine-orange hair with one thin braid, warm amber-orange eyes, a white daisy-like flower hair ornament with an orange "
    "striped ribbon and a small white tag charm, a thin black headset microphone along her right cheek, a cream-white frilled blouse "
    "with puffed sleeves and an orange daisy-print capelet, a black bow with a daisy brooch at the collar, a black corset belt with a "
    "thin gold chain and orange ribbons, a white skirt with orange daisy motifs over layered orange ruffles, white frilly socks with "
    "orange bows and dark-brown Mary Jane shoes"
)

print_lock = threading.Lock()
limit_hit = threading.Event()


def log(msg):
    with print_lock:
        print(time.strftime("%H:%M:%S"), msg, flush=True)


def build_prompt(job):
    refs = job.get("refs") or []
    parts = [
        "Use your built-in image generation tool to create exactly ONE image, then reply with the single word DONE.",
        "Do not run any shell commands, do not read or write any files, do not ask questions.",
        "",
        "FORMAT: " + ASPECTS[job.get("aspect", "landscape")],
    ]
    if refs and job.get("style") == "edit":
        parts += ["", "REFERENCE: The attached image is the picture to edit. Output the same picture with only the requested change."]
    elif refs:
        parts += [
            "",
            "REFERENCE: The attached image(s) show characters that appear in this scene. Keep every character who appears exactly "
            "on-model: same face, eye shape and color, hairstyle, hair color, outfit details and accessories. Match the art style. "
            "Do not copy the reference layout, pose or background unless the scene asks for it.",
        ]
    prompt = job["prompt"].replace("{CLAUDE}", CLAUDE).strip()
    parts += ["", "SCENE:", prompt, "", "STYLE:", STYLES[job.get("style", "day")]]
    return "\n".join(parts)


def run_job(job):
    out = ROOT / job["out"]
    out.parent.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        CODEX, "exec", "--json", "--skip-git-repo-check",
        "-s", "read-only",
        "-m", MODEL,
        "-c", 'model_reasoning_effort="medium"',
        "-C", str(ROOT / "tools"),
    ]
    for r in job.get("refs") or []:
        cmd += ["-i", str(ROOT / r)]
    cmd.append("-")
    prompt = build_prompt(job)

    for attempt in range(1, 4):
        if limit_hit.is_set():
            log(f"[{job['id']}] skipped (usage limit)")
            return False
        log(f"[{job['id']}] start (attempt {attempt})")
        t0 = time.time()
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            stdout_b, stderr_b = proc.communicate(prompt.encode("utf-8"), timeout=900)
        except subprocess.TimeoutExpired:
            # codex.cmd spawns child processes that keep the pipes open; kill the whole tree.
            subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
            stdout_b, stderr_b = proc.communicate()
            log(f"[{job['id']}] timed out after {time.time() - t0:.0f}s")
        stdout = stdout_b.decode("utf-8", "replace")
        (LOG_DIR / f"{job['id']}.jsonl").write_text(stdout, encoding="utf-8")
        thread_id = None
        for line in stdout.splitlines():
            try:
                ev = json.loads(line)
            except ValueError:
                continue
            if ev.get("type") == "thread.started":
                thread_id = ev.get("thread_id")
            if ev.get("type") == "error" and "usage limit" in ev.get("message", ""):
                if not limit_hit.is_set():
                    log("USAGE LIMIT: " + ev["message"])
                limit_hit.set()
        pngs = []
        if thread_id and (GEN_DIR / thread_id).is_dir():
            pngs = sorted((GEN_DIR / thread_id).glob("*.png"), key=lambda p: p.stat().st_mtime)
        if pngs:
            shutil.copyfile(pngs[-1], out)
            log(f"[{job['id']}] ok -> {job['out']} ({time.time() - t0:.0f}s)")
            return True
        log(f"[{job['id']}] no image (exit {proc.returncode}, thread {thread_id}); stderr: "
            + stderr_b.decode("utf-8", "replace")[-300:].replace("\n", " "))
    return False


def main():
    args = sys.argv[1:]
    conc = 5
    if "-j" in args:
        i = args.index("-j")
        conc = int(args[i + 1])
        del args[i:i + 2]
    jobs = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    ids = set(args[1:])
    if ids:
        todo = [j for j in jobs if j["id"] in ids]
    else:
        todo = [j for j in jobs if not (ROOT / j["out"]).exists()]
    log(f"{len(todo)} job(s), concurrency {conc}, model {MODEL}")
    with ThreadPoolExecutor(conc) as ex:
        results = list(ex.map(run_job, todo))
    failed = [j["id"] for j, ok in zip(todo, results) if not ok]
    log("done; failed: " + (", ".join(failed) if failed else "none"))


if __name__ == "__main__":
    main()
