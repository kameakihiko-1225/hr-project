export function createLogger(ns) {
  const format = (level, ...args) => console[level](`[${level.toUpperCase()}] [${ns}]`, ...args);
  return {
    info:  (...a) => format('log', ...a),
    debug: (...a) => format('debug', ...a),
    warn:  (...a) => format('warn', ...a),
    error: (...a) => format('error', ...a),
  };
} 