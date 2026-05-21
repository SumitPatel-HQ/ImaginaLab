const isDev = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error' | 'info';

const shouldLog = (level: LogLevel): boolean => {
  if (isDev) return true;
  return level === 'error';
};

export const logger = {
  log: (...args: unknown[]) => shouldLog('log') && console.log(...args),
  warn: (...args: unknown[]) => shouldLog('warn') && console.warn(...args),
  error: (...args: unknown[]) => shouldLog('error') && console.error(...args),
  info: (...args: unknown[]) => shouldLog('info') && console.info(...args),
  debug: (...args: unknown[]) => shouldLog('log') && console.debug(...args),
};

export default logger;
