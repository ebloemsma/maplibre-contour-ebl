import AsyncCache from "./cache";
import defaultDecodeImage from "./decode-image";
import { HeightTile } from "./height-tile";
import generateIsolines from "./isolines";
import { encodeIndividualOptions, isAborted, withTimeout } from "./utils";
import type {
  ContourTile,
  DecodeImageFunction,
  DemManager,
  DemManagerInitizlizationParameters,
  DemTile,
  Encoding,
  FetchResponse,
  GetTileFunction,
  IndividualContourTileOptions,
} from "./types";
import encodeVectorTile, { GeomType } from "./vtpbf";
import { Timer } from "./performance";
import { classifyRings } from "@mapbox/vector-tile";

const defaultGetTile: GetTileFunction = async (
  url: string,
  abortController: AbortController,
) => {
  const options: RequestInit = {
    signal: abortController.signal,
  };
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Bad response: ${response.status} for ${url}`);
  }
  return {
    data: await response.blob(),
    expires: response.headers.get("expires") || undefined,
    cacheControl: response.headers.get("cache-control") || undefined,
  };
};

/**
 * Caches, decodes, and processes raster tiles in the current thread.
 */
export class LocalDemManager implements DemManager {
  tileCache: AsyncCache<string, FetchResponse>;
  parsedCache: AsyncCache<string, DemTile>;
  contourCache: AsyncCache<string, ContourTile>;
  demUrlPattern: string;
  encoding: Encoding;
  maxzoom: number;
  timeoutMs: number;
  loaded = Promise.resolve();
  decodeImage: DecodeImageFunction;
  getTile: GetTileFunction;

  constructor(options: DemManagerInitizlizationParameters) {
    this.tileCache = new AsyncCache(options.cacheSize);
    this.parsedCache = new AsyncCache(options.cacheSize);
    this.contourCache = new AsyncCache(options.cacheSize);
    this.timeoutMs = options.timeoutMs;
    this.demUrlPattern = options.demUrlPattern;
    this.encoding = options.encoding;
    this.maxzoom = options.maxzoom;
    this.decodeImage = options.decodeImage || defaultDecodeImage;
    this.getTile = options.getTile || defaultGetTile;
  }

  fetchTile(
    z: number,
    x: number,
    y: number,
    parentAbortController: AbortController,
    timer?: Timer,
  ): Promise<FetchResponse> {
    const url = this.demUrlPattern
      .replace("{z}", z.toString())
      .replace("{x}", x.toString())
      .replace("{y}", y.toString());
    timer?.useTile(url);
    return this.tileCache.get(
      url,
      (_, childAbortController) => {
        timer?.fetchTile(url);
        const mark = timer?.marker("fetch");
        return withTimeout(
          this.timeoutMs,
          this.getTile(url, childAbortController).finally(() => mark?.()),
          childAbortController,
        );
      },
      parentAbortController,
    );
  }
  fetchAndParseTile = (
    z: number,
    x: number,
    y: number,
    abortController: AbortController,
    timer?: Timer,
  ): Promise<DemTile> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const url = this.demUrlPattern
      .replace("{z}", z.toString())
      .replace("{x}", x.toString())
      .replace("{y}", y.toString());

    timer?.useTile(url);

    return this.parsedCache.get(
      url,
      async (_, childAbortController) => {
        const response = await self.fetchTile(
          z,
          x,
          y,
          childAbortController,
          timer,
        );
        if (isAborted(childAbortController)) throw new Error("canceled");
        const promise = self.decodeImage(
          response.data,
          self.encoding,
          childAbortController,
        );
        const mark = timer?.marker("decode");
        const result = await promise;
        mark?.();
        return result;
      },
      abortController,
    );
  };

  async fetchDem(
    z: number,
    x: number,
    y: number,
    options: IndividualContourTileOptions,
    abortController: AbortController,
    timer?: Timer,
  ): Promise<HeightTile> {
    
    //const zoom = Math.min(z - (options.overzoom || 0), this.maxzoom);
    const maxFetchZoom = options.maxFetchZoom || 22;
    const zoom = Math.min( Math.min(z - (options.overzoom || 0), this.maxzoom) , maxFetchZoom) ;

    const subZ = z - zoom;
    const div = 1 << subZ;
    const newX = Math.floor(x / div);
    const newY = Math.floor(y / div);

    const tile = await this.fetchAndParseTile(
      zoom,
      newX,
      newY,
      abortController,
      timer,
    );

    return HeightTile.fromRawDem(tile).split(subZ, x % div, y % div);
  }

  fetchContourTile(
    z: number,
    x: number,
    y: number,
    options: IndividualContourTileOptions,
    parentAbortController: AbortController,
    timer?: Timer,
  ): Promise<ContourTile> {
    const {
      contours,
      levels,
      intervals,
      multiplier = 1,
      buffer = 1,
      extent = 4096,
      contourLayer = "contours",
      elevationKey = "ele",
      deltaKey = "delta",
      intervalKey = "intervalIndex",
      subsampleBelow = 100,
    } = options;

    // console.log(`FETCH options`, options)
    

    // no levels means less than min zoom with levels specified
    if ( (!intervals || intervals.length === 0) && (! levels || levels.length === 0) && (!contours || contours.length === 0)) {
      return Promise.resolve({ arrayBuffer: new ArrayBuffer(0) });
    }

    const key = [z, x, y, encodeIndividualOptions(options)].join("/");
    return this.contourCache.get(
      key,
      async (_, childAbortController) => {
        const max = 1 << z;
        const neighborPromises: (Promise<HeightTile> | undefined)[] = [];
        for (let iy = y - 1; iy <= y + 1; iy++) {
          for (let ix = x - 1; ix <= x + 1; ix++) {
            neighborPromises.push(
              iy < 0 || iy >= max
                ? undefined
                : this.fetchDem(
                    z,
                    (ix + max) % max,
                    iy,
                    options,
                    childAbortController,
                    timer,
                  ),
            );
          }
        }
        const neighbors = await Promise.all(neighborPromises);
        let virtualTile = HeightTile.combineNeighbors(neighbors);
        if (!virtualTile || isAborted(childAbortController)) {
          return { arrayBuffer: new Uint8Array().buffer };
        }
        const mark = timer?.marker("isoline");

        if (virtualTile.width >= subsampleBelow) {
          virtualTile = virtualTile.materialize(2);
        } else {
          while (virtualTile.width < subsampleBelow) {
            virtualTile = virtualTile.subsamplePixelCenters(2).materialize(2);
          }
        }

        virtualTile = virtualTile
          .averagePixelCentersToGrid()
          .scaleElevation(multiplier)
          .materialize(1);

  

        // const isoOptions = {
        //     levels: [ -300, 0, 400],
        //     interval : 100, //levels[0]
        //     polygons: false,
        //     deltaReference: 0,
        // } as IsoOptions;

        const isolines = generateIsolines(
          options,
          virtualTile,
          extent,
          buffer
          ,x,y,z
        );

        const geomType = (options.polygons) ? GeomType.POLYGON: GeomType.LINESTRING;

        // natural ordering will messe up ordering if negative levels are involved
        const isoLinesKeysSorted = Object.keys(isolines).map( a => Number(a)).sort( (a,b) => a-b);
        
        mark?.();
        const result = encodeVectorTile({
          extent,
          layers: {
            [contourLayer]: {

              //features: Object.entries(isolines).map(([eleString, geom]) => {
              features: isoLinesKeysSorted.map( l => { return {ele : l , geom: isolines[l] }} ).map(({ele, geom}) => {
                // const ele = Number(eleString);

                const baseProps = { 
                    [elevationKey]: ele, 
                    [intervalKey]: (intervals)?Math.max(...intervals.map((l, i) => (ele % l === 0 ? i : 0))) : 0,
                }

                //POLYGONS: calc delta value and extend props
                const deltaAlt = (options.deltaBaseAltitude!=undefined) ? ele - options.deltaBaseAltitude : undefined ;
                const deltaProps = (deltaAlt!=undefined)? {
                    [deltaKey]: deltaAlt,
                }:{}

                // get optional custom props from config
                const countourDefintion = options.contours?.find( e => Number(e.contourElevation)==ele )
                const customProps = (countourDefintion)?countourDefintion.addProperties:{}

                const properties = Object.assign( baseProps, deltaProps,customProps)
                // console.log(properties)

                return {
                    type: geomType,
                    geometry: geom,
                    properties: properties,
                };

              }),
            },
          },
        });
        mark?.();

        return { arrayBuffer: result.buffer as ArrayBuffer };
      },
      parentAbortController,
    );
  }
}
