"""Batch image generation through the Codex CLI (from pvz-remake/tools/gen_images.py; adds the "title" style).

Usage:
    python tools/gen_images.py tools/jobs_x.json            # every missing image
    python tools/gen_images.py tools/jobs_x.json id1 id2    # only these ids (regenerates)
    python tools/gen_images.py tools/jobs_x.json -j 5       # concurrency

Each job: {"id", "out", "aspect", "prompt", "refs": [paths], "style": "sprite|scene|edit|ui"}.
Codex is asked to only call its image tool; the PNG is picked up from
~/.codex/generated_images/<thread_id>/ and copied to "out".
Model is fixed to gpt-6.1-terra with medium reasoning effort (user's instruction).
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
MODEL = "gpt-6.1-terra"

NOTEXT = " Absolutely NO text, letters, numbers, logos, captions, speech bubbles, signatures or watermarks anywhere."
STYLES = {
    "sheet": "Clean modern Japanese animation character design sheet, delicate line art, flat cel colours, plain light-grey background (#D8D8D8)." + NOTEXT,
    "raw": "Follow the era style described in SUBJECT exactly." + NOTEXT,
    "sprite": "Follow the era style described in SUBJECT exactly. This is a cut-out figure on a plain flat solid pure magenta background (#FF00FF) with nothing else on it, no floor, no cast shadow. The whole figure stays inside the frame with a generous margin on every side." + NOTEXT,
}

ASPECTS = {
    "landscape": "Landscape orientation, 3:2 aspect ratio (wide).",
    "portrait": "Portrait orientation, 2:3 aspect ratio (tall).",
    "square": "Square 1:1 aspect ratio.",
    "wide": "Very wide landscape image (as wide as the tool allows, at least 3:2).",
}

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
        "FORMAT: " + ASPECTS[job.get("aspect", "square")],
    ]
    if refs and job.get("style") == "edit":
        parts += ["", "REFERENCE: The attached image is the picture to edit. Output the same picture with only the requested change."]
    elif refs:
        parts += [
            "",
            "REFERENCE: The attached image(s) show the character or object to draw. Keep it exactly on-model: same shapes, "
            "proportions, colours, outline weight and rendering style. " + job.get("refnote", ""),
        ]
    parts += ["", "SUBJECT:", job["prompt"].strip(), "", "STYLE:", STYLES[job.get("style", "sprite")]]
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
    jobs = []
    for a in [x for x in args if x.endswith(".json")]:
        jobs += json.loads(Path(a).read_text(encoding="utf-8"))
    ids = set(x for x in args if not x.endswith(".json"))
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
