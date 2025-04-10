export const stopPropagation = <T extends { stopPropagation: () => void }>(e: T) => {
  e.stopPropagation();
};

export function getOS(): 'macOS' | 'iOS' | 'Windows' | 'Android' | 'Linux' | 'SSR' | null {
  if (typeof window === 'undefined') return 'SSR';
  const userAgent = window.navigator.userAgent.toLowerCase(),
    macosPlatforms = /(macintosh|macintel|macppc|mac68k|macos)/i,
    windowsPlatforms = /(win32|win64|windows|wince)/i,
    iosPlatforms = /(iphone|ipad|ipod)/i;
  let os: ReturnType<typeof getOS> = null;

  if (macosPlatforms.test(userAgent)) {
    // Fuck Apple
    // https://stackoverflow.com/a/57924983
    if (navigator.maxTouchPoints > 1) {
      os = 'iOS';
    } else {
      os = 'macOS';
    }
  } else if (iosPlatforms.test(userAgent)) {
    os = 'iOS';
  } else if (windowsPlatforms.test(userAgent)) {
    os = 'Windows';
  } else if (userAgent.includes('android')) {
    os = 'Android';
  } else if (!os && userAgent.includes('linux')) {
    os = 'Linux';
  }

  return os;
}

export function isApple(): boolean {
  const os = getOS();
  return os === 'macOS' || os === 'iOS';
}

export const isCrossOrigin = () => {
  const hostname = window.location.hostname;
  const localHosts = ['localhost', '127.0.0.1', '::1'];
  if (
    localHosts.includes(hostname) ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.')
  ) {
    return true;
  }
  const ends = ['.boluo-legacy.pages.dev', '.boluo-app.pages.dev', '.mythal.workers.dev', ''];
  if (ends.some((x) => hostname.endsWith(x))) {
    return true;
  }
  // 根域名通配符匹配
  const rootDomains = ['boluo.app', 'mythal.net']; // 添加你需要的根域名
  if (
    rootDomains.some((rootDomain) => hostname === rootDomain || hostname.endsWith('.' + rootDomain))
  ) {
    return true;
  }

  return false;
};
