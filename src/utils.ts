import type {
  ContourTile,
  DemTile,
  GlobalContourTileOptions,
  IndividualContourTileOptions,
  TransferrableContourTile,
  TransferrableDemTile,
} from "./types";

function sortedEntries(object: any): [string, any][] {
  const entries = Object.entries(object);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries;
}

function encodeThresholds(thresholds: {
  [n: number]: number | number[];
}): string {
  return sortedEntries(thresholds)
    .map(([key, value]) =>
      [key, ...(typeof value === "number" ? [value] : value)].join("*"),
    )
    .join("~");
}

function decodeThresholds(thresholds: string): {
  [n: number]: number | number[];
} {
  return Object.fromEntries(
    thresholds
      .split("~")
      .map((part) => part.split("*").map(Number))
      .map(([key, ...values]) => [key, values]),
  );
}

export function encodeOptions({
  thresholds,
  ...rest
}: GlobalContourTileOptions): string {
  return sortedEntries({ thresholds: encodeThresholds(thresholds), ...rest })
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

export function decodeOptions(options: string): GlobalContourTileOptions {
  return Object.fromEntries(
    options
      .replace(/^.*\?/, "")
      .split("&")
      .map((part) => {
        const parts = part.split("=").map(decodeURIComponent);
        const k = parts[0] as keyof GlobalContourTileOptions;
        let v: any = parts[1];
        switch (k) {
          case "thresholds":
            v = decodeThresholds(v);
            break;
          case "extent":
          case "multiplier":
          case "overzoom":
          case "buffer":
            v = Number(v);
        }
        return [k, v];
      }),
  ) as any as GlobalContourTileOptions;
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function md5(inputString) {
  var hc = "0123456789abcdef";
  function rh(n) { var j, s = ""; for (j = 0; j <= 3; j++) s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F); return s; }
  function ad(x, y) { var l = (x & 0xFFFF) + (y & 0xFFFF); var m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); }
  function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
  function cm(q, a, b, x, s, t) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cm(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
  function sb(x) {
    var i; var nblk = ((x.length + 8) >> 6) + 1; var blks = new Array(nblk * 16); for (i = 0; i < nblk * 16; i++) blks[i] = 0;
    for (i = 0; i < x.length; i++) blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
    blks[i >> 2] |= 0x80 << ((i % 4) * 8); blks[nblk * 16 - 2] = x.length * 8; return blks;
  }
  var i, x = sb("" + inputString), a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, olda, oldb, oldc, oldd;
  for (i = 0; i < x.length; i += 16) {
    olda = a; oldb = b; oldc = c; oldd = d;
    a = ff(a, b, c, d, x[i + 0], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = ff(b, c, d, a, x[i + 3], 22, -1044525330); a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983); a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = ff(b, c, d, a, x[i + 15], 22, 1236535329); a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i + 0], 20, -373897302); a = gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = gg(b, c, d, a, x[i + 8], 20, 1163531501); a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734); a = hh(a, b, c, d, x[i + 5], 4, -378558);
    d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = hh(b, c, d, a, x[i + 10], 23, -1094730640); a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189); a = hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = ii(a, b, c, d, x[i + 0], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = ii(b, c, d, a, x[i + 5], 21, -57434055); a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799); a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = ii(b, c, d, a, x[i + 9], 21, -343485551); a = ad(a, olda); b = ad(b, oldb); c = ad(c, oldc); d = ad(d, oldd);
  }
  return rh(a) + rh(b) + rh(c) + rh(d);
}
export function encodeIndividualOptions(
  options: IndividualContourTileOptions,
): string {

  return md5(JSON.stringify(options));

  //return sortedEntries(options)
  //  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  //  .join(",");
}

export function getOptionsForZoom(
  options: GlobalContourTileOptions,
  zoom: number,
): IndividualContourTileOptions {
  const { thresholds, ...rest } = options;

  let levels: number[] = [];
  let maxLessThanOrEqualTo: number = -Infinity;

  Object.entries(thresholds).forEach(([zString, value]) => {
    const z = Number(zString);
    if (z <= zoom && z > maxLessThanOrEqualTo) {
      maxLessThanOrEqualTo = z;
      levels = typeof value === "number" ? [value] : value;
    }
  });

  return {
    levels,
    ...rest,
  };
}

export function copy(src: ArrayBuffer): ArrayBuffer {
  const dst = new ArrayBuffer(src.byteLength);
  new Uint8Array(dst).set(new Uint8Array(src));
  return dst;
}

export function prepareDemTile(
  promise: Promise<DemTile>,
  copy: boolean,
): Promise<TransferrableDemTile> {
  return promise.then(({ data, ...rest }) => {
    let newData = data;
    if (copy) {
      newData = new Float32Array(data.length);
      newData.set(data);
    }
    return { ...rest, data: newData, transferrables: [newData.buffer] };
  });
}

export function prepareContourTile(
  promise: Promise<ContourTile>,
): Promise<TransferrableContourTile> {
  return promise.then(({ arrayBuffer }) => {
    const clone = copy(arrayBuffer);
    return {
      arrayBuffer: clone,
      transferrables: [clone],
    };
  });
}

let supportsOffscreenCanvas: boolean | null = null;

export function offscreenCanvasSupported(): boolean {
  if (supportsOffscreenCanvas == null) {
    supportsOffscreenCanvas =
      typeof OffscreenCanvas !== "undefined" &&
      new OffscreenCanvas(1, 1).getContext("2d") &&
      typeof createImageBitmap === "function";
  }

  return supportsOffscreenCanvas || false;
}

let useVideoFrame: boolean | null = null;

export function shouldUseVideoFrame(): boolean {
  if (useVideoFrame == null) {
    useVideoFrame = false;
    // if webcodec is supported, AND if the browser mangles getImageData results
    // (ie. safari with increased privacy protections) then use webcodec VideoFrame API
    if (offscreenCanvasSupported() && typeof VideoFrame !== "undefined") {
      const size = 5;
      const canvas = new OffscreenCanvas(5, 5);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (context) {
        for (let i = 0; i < size * size; i++) {
          const base = i * 4;
          context.fillStyle = `rgb(${base},${base + 1},${base + 2})`;
          context.fillRect(i % size, Math.floor(i / size), 1, 1);
        }
        const data = context.getImageData(0, 0, size, size).data;
        for (let i = 0; i < size * size * 4; i++) {
          if (i % 4 !== 3 && data[i] !== i) {
            useVideoFrame = true;
            break;
          }
        }
      }
    }
  }

  return useVideoFrame || false;
}

export function withTimeout<T>(
  timeoutMs: number,
  value: Promise<T>,
  abortController?: AbortController,
): Promise<T> {
  let reject: (error: Error) => void = () => { };
  const timeout = setTimeout(() => {
    reject(new Error("timed out"));
    abortController?.abort();
  }, timeoutMs);
  onAbort(abortController, () => {
    reject(new Error("aborted"));
    clearTimeout(timeout);
  });
  const cancelPromise: Promise<any> = new Promise((_, rej) => {
    reject = rej;
  });
  return Promise.race([
    cancelPromise,
    value.finally(() => clearTimeout(timeout)),
  ]);
}

export function onAbort(
  abortController?: AbortController,
  action?: () => void,
) {
  if (action) {
    abortController?.signal.addEventListener("abort", action);
  }
}

export function isAborted(abortController?: AbortController): boolean {
  return Boolean(abortController?.signal?.aborted);
}
