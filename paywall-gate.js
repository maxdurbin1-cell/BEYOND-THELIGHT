(function () {
  "use strict";

  function resolveApiUrl(pathname) {
    var path = String(pathname || "").trim();
    if (!path) path = "/";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.charAt(0) !== "/") path = "/" + path;
    if (typeof window === "undefined" || !window.location) return path;

    var forcedBase = String(window.__BTL_API_BASE || "").trim();
    if (forcedBase) {
      return forcedBase.replace(/\/$/, "") + path;
    }

    var currentPath = String(window.location.pathname || "/");
    var base = currentPath.replace(/\/[^/]*$/, "");
    if (!base) base = "/";
    if (base === "/") return path;
    return base.replace(/\/$/, "") + path;
  }

  function resolveAppRoot() {
    if (typeof window === "undefined" || !window.location) return "/";
    var path = String(window.location.pathname || "/");
    var base = path.replace(/\/[^/]*$/, "");
    if (!base) base = "/";
    return base.endsWith("/") ? base : (base + "/");
  }

  function setStatus(message, type) {
    var el = document.getElementById("status");
    if (!el) return;
    el.textContent = String(message || "");
    el.className = "status" + (type ? " " + String(type) : "");
  }

  async function fetchJson(url, opts) {
    var response = await fetch(url, opts || {});
    var body = null;
    try {
      body = await response.json();
    } catch (_err) {
      body = null;
    }
    return {
      ok: response.ok,
      status: response.status,
      body: body
    };
  }

  async function init() {
    var status = await fetchJson(resolveApiUrl("/api/license/status"), { method: "GET" });
    if (status.ok && status.body && status.body.authorized) {
      window.location.replace(resolveAppRoot());
      return;
    }

    var form = document.getElementById("paywall-form");
    if (!form) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setStatus("Checking access code...", "");

      var emailInput = document.getElementById("email");
      var codeInput = document.getElementById("code");
      var email = emailInput ? String(emailInput.value || "").trim() : "";
      var code = codeInput ? String(codeInput.value || "").trim() : "";

      if (!email || !code) {
        setStatus("Enter both email and access code.", "error");
        return;
      }

      var result = await fetchJson(resolveApiUrl("/api/license/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, code: code })
      });

      if (!result.ok || !result.body || !result.body.ok) {
        var errorMessage = (result.body && result.body.error) ? result.body.error : "Access failed.";
        setStatus(errorMessage, "error");
        return;
      }

      setStatus("Access granted. Entering website...", "ok");
      window.location.replace(resolveAppRoot());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
