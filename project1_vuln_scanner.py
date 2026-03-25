"""
Project 1: Web Application Vulnerability Scanner
Detects XSS, SQL Injection, and CSRF vulnerabilities
Tools: Python, requests, BeautifulSoup, Flask
"""

import requests
from bs4 import BeautifulSoup
import re
import logging
import json
from datetime import datetime
from urllib.parse import urljoin, urlparse
from flask import Flask, render_template_string, request, jsonify

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
logging.basicConfig(
    filename="scan_results.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# ─────────────────────────────────────────────
# Payload Definitions
# ─────────────────────────────────────────────
XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '"><script>alert(1)</script>',
    "'><img src=x onerror=alert(1)>",
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
]

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1--",
    '" OR "1"="1',
    "'; DROP TABLE users;--",
    "1' AND SLEEP(3)--",
    "' UNION SELECT null,null--",
]

SQLI_ERROR_PATTERNS = [
    r"sql syntax",
    r"mysql_fetch",
    r"ORA-\d+",
    r"sqlite3\.",
    r"pg_query",
    r"syntax error",
    r"unclosed quotation",
    r"microsoft ole db",
    r"odbc drivers",
]

# ─────────────────────────────────────────────
# Scanner Core
# ─────────────────────────────────────────────
class VulnerabilityScanner:
    def __init__(self, target_url: str):
        self.target_url = target_url
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "VulnScanner/1.0 (Educational)"})
        self.vulnerabilities = []
        self.scanned_urls = set()

    def log_vuln(self, vuln_type, url, evidence, severity):
        entry = {
            "type": vuln_type,
            "url": url,
            "evidence": evidence,
            "severity": severity,
            "timestamp": datetime.now().isoformat(),
        }
        self.vulnerabilities.append(entry)
        logging.warning(f"[{severity}] {vuln_type} at {url} | Evidence: {evidence}")
        print(f"  [!] {severity} - {vuln_type}: {evidence[:80]}")

    # ── Crawl ──────────────────────────────
    def crawl_forms(self, url):
        """Return all forms on a page with their action and inputs."""
        try:
            resp = self.session.get(url, timeout=8)
            soup = BeautifulSoup(resp.text, "html.parser")
            forms = []
            for form in soup.find_all("form"):
                action = form.get("action", "")
                method = form.get("method", "get").lower()
                inputs = []
                for inp in form.find_all(["input", "textarea"]):
                    inp_name = inp.get("name", "")
                    inp_type = inp.get("type", "text")
                    inp_val  = inp.get("value", "test")
                    if inp_name:
                        inputs.append({"name": inp_name, "type": inp_type, "value": inp_val})
                forms.append({
                    "action": urljoin(url, action),
                    "method": method,
                    "inputs": inputs,
                })
            return forms
        except Exception as e:
            print(f"  [crawl error] {e}")
            return []

    def crawl_links(self, url, depth=1):
        """Collect internal links up to given depth."""
        if depth == 0 or url in self.scanned_urls:
            return []
        self.scanned_urls.add(url)
        links = [url]
        try:
            resp = self.session.get(url, timeout=8)
            soup = BeautifulSoup(resp.text, "html.parser")
            base = urlparse(url).netloc
            for a in soup.find_all("a", href=True):
                href = urljoin(url, a["href"])
                if urlparse(href).netloc == base and href not in self.scanned_urls:
                    links += self.crawl_links(href, depth - 1)
        except Exception:
            pass
        return links

    # ── XSS Detection ──────────────────────
    def check_xss(self, url):
        forms = self.crawl_forms(url)
        for form in forms:
            for payload in XSS_PAYLOADS:
                data = {inp["name"]: payload for inp in form["inputs"]}
                try:
                    if form["method"] == "post":
                        resp = self.session.post(form["action"], data=data, timeout=8)
                    else:
                        resp = self.session.get(form["action"], params=data, timeout=8)
                    if payload in resp.text:
                        self.log_vuln(
                            "XSS (Reflected)",
                            form["action"],
                            f"Payload reflected: {payload[:50]}",
                            "HIGH",
                        )
                        break  # one finding per form
                except Exception:
                    pass

    # ── SQLi Detection ─────────────────────
    def check_sqli(self, url):
        forms = self.crawl_forms(url)
        for form in forms:
            for payload in SQLI_PAYLOADS:
                data = {inp["name"]: payload for inp in form["inputs"]}
                try:
                    if form["method"] == "post":
                        resp = self.session.post(form["action"], data=data, timeout=10)
                    else:
                        resp = self.session.get(form["action"], params=data, timeout=10)
                    for pattern in SQLI_ERROR_PATTERNS:
                        if re.search(pattern, resp.text, re.IGNORECASE):
                            self.log_vuln(
                                "SQL Injection",
                                form["action"],
                                f"Error pattern '{pattern}' matched with payload: {payload[:50]}",
                                "CRITICAL",
                            )
                            break
                except Exception:
                    pass

    # ── CSRF Detection ─────────────────────
    def check_csrf(self, url):
        forms = self.crawl_forms(url)
        for form in forms:
            token_found = any(
                re.search(r"csrf|token|nonce|_wpnonce", inp["name"], re.IGNORECASE)
                for inp in form["inputs"]
            )
            hidden_found = any(inp["type"] == "hidden" for inp in form["inputs"])
            if not token_found and not hidden_found and form["method"] == "post":
                self.log_vuln(
                    "CSRF",
                    form["action"],
                    "POST form has no CSRF token or hidden field",
                    "MEDIUM",
                )

    # ── Main Scan ──────────────────────────
    def scan(self):
        print(f"\n[*] Starting scan on: {self.target_url}")
        urls = self.crawl_links(self.target_url, depth=1)
        print(f"[*] Found {len(urls)} URL(s) to scan\n")
        for url in urls:
            print(f"[>] Scanning: {url}")
            self.check_xss(url)
            self.check_sqli(url)
            self.check_csrf(url)
        self._print_summary()
        return self.vulnerabilities

    def _print_summary(self):
        print("\n" + "="*60)
        print(f"  SCAN COMPLETE — {len(self.vulnerabilities)} vulnerability/ies found")
        print("="*60)
        for v in self.vulnerabilities:
            print(f"  [{v['severity']}] {v['type']} @ {v['url']}")
        print()

    def export_report(self, path="report.json"):
        with open(path, "w") as f:
            json.dump(self.vulnerabilities, f, indent=2)
        print(f"[*] Report saved to {path}")


# ─────────────────────────────────────────────
# Flask Web UI
# ─────────────────────────────────────────────
app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Web Vulnerability Scanner</title>
<style>
  body { font-family: Arial, sans-serif; background:#1a1a2e; color:#eee; margin:0; padding:20px; }
  h1   { color:#e94560; }
  input[type=text] { width:60%; padding:10px; border-radius:5px; border:none; font-size:15px; }
  button { padding:10px 20px; background:#e94560; color:#fff; border:none; border-radius:5px;
           cursor:pointer; font-size:15px; margin-left:10px; }
  button:hover { background:#c73652; }
  #results { margin-top:20px; }
  .vuln  { background:#16213e; padding:14px; border-left:4px solid; margin:10px 0; border-radius:4px; }
  .HIGH  { border-color:#f39c12; }
  .CRITICAL { border-color:#e74c3c; }
  .MEDIUM   { border-color:#3498db; }
  .LOW      { border-color:#2ecc71; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px;
           font-weight:bold; color:#fff; }
  .badge.HIGH     { background:#f39c12; }
  .badge.CRITICAL { background:#e74c3c; }
  .badge.MEDIUM   { background:#3498db; }
  .badge.LOW      { background:#2ecc71; }
  .none { color:#2ecc71; font-size:18px; margin-top:20px; }
  #loader { display:none; color:#aaa; margin-top:10px; font-style:italic; }
</style>
</head>
<body>
<h1>🔍 Web Vulnerability Scanner</h1>
<p>Detects XSS, SQL Injection, and CSRF vulnerabilities.</p>
<div>
  <input type="text" id="url" placeholder="https://example.com" />
  <button onclick="startScan()">Scan</button>
</div>
<div id="loader">⏳ Scanning... This may take a moment.</div>
<div id="results"></div>

<script>
async function startScan() {
  const url = document.getElementById('url').value.trim();
  if (!url) return alert('Please enter a URL.');
  document.getElementById('loader').style.display = 'block';
  document.getElementById('results').innerHTML = '';
  const resp = await fetch('/scan', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({url})
  });
  const data = await resp.json();
  document.getElementById('loader').style.display = 'none';
  const container = document.getElementById('results');
  if (!data.vulnerabilities || data.vulnerabilities.length === 0) {
    container.innerHTML = '<div class="none">✅ No vulnerabilities detected.</div>';
    return;
  }
  container.innerHTML = `<h2>Found ${data.vulnerabilities.length} vulnerability/ies</h2>`;
  data.vulnerabilities.forEach(v => {
    container.innerHTML += `
      <div class="vuln ${v.severity}">
        <span class="badge ${v.severity}">${v.severity}</span>
        <strong> ${v.type}</strong><br>
        <small>URL: ${v.url}</small><br>
        <small>Evidence: ${v.evidence}</small><br>
        <small>Time: ${v.timestamp}</small>
      </div>`;
  });
}
</script>
</body>
</html>
"""

@app.route("/")
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route("/scan", methods=["POST"])
def scan_endpoint():
    data = request.get_json()
    target = data.get("url", "")
    if not target.startswith("http"):
        return jsonify({"error": "Invalid URL"}), 400
    scanner = VulnerabilityScanner(target)
    vulns = scanner.scan()
    return jsonify({"vulnerabilities": vulns})


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # CLI mode
        scanner = VulnerabilityScanner(sys.argv[1])
        scanner.scan()
        scanner.export_report()
    else:
        print("[*] Starting Flask UI at http://127.0.0.1:5000")
        app.run(debug=True)
