#!/usr/bin/env python3
"""
Start the Next.js dev server and open the Playwright UI.
Reads credentials from .env.test (same variable names as GitHub Actions secrets).

Usage:  python run_tests.py
"""

import os
import sys
import time
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

ENV_FILE = Path(__file__).parent / ".env.test"
DEV_URL  = "http://localhost:3000"


def load_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        print(f"[error] {path} not found.")
        print("Create it with:")
        print("  NEXT_PUBLIC_SUPABASE_URL=...")
        print("  NEXT_PUBLIC_SUPABASE_ANON_KEY=...")
        print("  TEST_USER_EMAIL=...")
        print("  TEST_USER_PASSWORD=...")
        sys.exit(1)

    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def wait_for_server(url: str, timeout: int = 60) -> None:
    print(f"Waiting for dev server at {url} ", end="", flush=True)
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            print(" ready.")
            return
        except (urllib.error.URLError, OSError):
            print(".", end="", flush=True)
            time.sleep(1)
    print()
    print(f"[error] Dev server did not start within {timeout}s.")
    sys.exit(1)


def main() -> None:
    env_vars = load_env_file(ENV_FILE)

    # Merge with current environment so Node/npm work correctly
    full_env = {**os.environ, **env_vars}

    print("Starting Next.js dev server...")
    dev = subprocess.Popen(
        ["npm", "run", "dev"],
        env=full_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        wait_for_server(DEV_URL)

        print("Opening Playwright UI...")
        playwright = subprocess.run(
            ["npx", "playwright", "test", "--ui"],
            env=full_env,
        )
        sys.exit(playwright.returncode)

    finally:
        print("\nStopping dev server...")
        dev.terminate()
        try:
            dev.wait(timeout=5)
        except subprocess.TimeoutExpired:
            dev.kill()


if __name__ == "__main__":
    main()
