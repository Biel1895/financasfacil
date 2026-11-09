// GERADO por npm run build. Fontes em src/js/.
(() => {
  // src/js/services/auth-return.js
  var errorKeys = ["error", "error_code", "error_description"];
  var callbackKeys = ["code", "sb_flow_id", ...errorKeys];
  function readAuthReturn(url) {
    const fragment = new URLSearchParams(url.hash.slice(1));
    return {
      code: url.searchParams.get("code"),
      flowId: url.searchParams.get("sb_flow_id"),
      redirectError: errorKeys.some((key) => url.searchParams.has(key) || fragment.has(key))
    };
  }

  // src/js/landing.js
  var current = new URL(location.href);
  var { code, redirectError } = readAuthReturn(current);
  var oldAppBookmark = ["#inicio", "#lancamentos", "#contas", "#relatorios"].includes(current.hash);
  if (code || redirectError || oldAppBookmark) {
    const destination = new URL("login.html", current);
    for (const key of callbackKeys) {
      if (current.searchParams.has(key)) {
        destination.searchParams.set(key, current.searchParams.get(key));
      }
    }
    destination.hash = current.hash;
    location.replace(destination.href);
  }
})();
