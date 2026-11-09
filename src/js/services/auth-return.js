const errorKeys = ['error', 'error_code', 'error_description'];
const callbackKeys = ['code', 'sb_flow_id', ...errorKeys];

function readAuthReturn(url) {
  const fragment = new URLSearchParams(url.hash.slice(1));
  return {
    code: url.searchParams.get('code'),
    flowId: url.searchParams.get('sb_flow_id'),
    redirectError: errorKeys.some((key) => url.searchParams.has(key) || fragment.has(key)),
  };
}

export { callbackKeys, readAuthReturn };
