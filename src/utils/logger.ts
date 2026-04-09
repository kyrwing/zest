export function logInfo(msg: string) {
  console.log(`ℹ️  ${msg}`);
}

export function logSuccess(msg: string) {
  console.log(`✅ ${msg}`);
}

export function logError(msg: string) {
  console.error(`❌ ${msg}`);
}

export function logWarn(msg: string) {
  console.warn(`⚠️ ${msg}`);
}