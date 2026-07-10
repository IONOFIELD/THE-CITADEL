export function fmtUSD(n) {
  if (n === null || n === undefined) return '...';
  return '$' + Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function fmtUSDPrecise(n) {
  if (n === null || n === undefined) return '...';
  return '$' + Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtBTC(n) {
  if (n === null || n === undefined) return '...';
  return Number(n).toFixed(8) + ' BTC';
}

export function fmtSats(btc) {
  if (!btc) return '...';
  return Math.round(btc * 1e8).toLocaleString() + ' sats';
}

export function fmtCompact(n) {
  if (n === null || n === undefined) return '...';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function fmtPct(n) {
  if (n === null || n === undefined) return '...';
  const sign = n >= 0 ? '+' : '';
  return sign + n.toFixed(2) + '%';
}

export function fmtTimeAgo(timestamp) {
  const secs = Math.round(Date.now() / 1000 - timestamp);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

export function truncateAddr(addr) {
  if (!addr || addr.length < 12) return addr || '';
  return addr.slice(0, 8) + '...' + addr.slice(-6);
}

export function satsToBTC(sats) {
  return sats / 1e8;
}
