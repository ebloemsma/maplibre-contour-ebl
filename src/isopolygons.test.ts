import { convertTileIsolinesToPolygons, LineIndex, TiledLine, TileInformation, type LineDefinition } from "./isopolygons";
import { HeightTile } from "./height-tile";
import { lineArrayToStrings, reverseLine } from "./isopoly-utils";
const initialTile = HeightTile.fromRawDem({
  width: 129,
  height: 129,
  data: Float32Array.from([0, 1, 2, 3]),
});



const line11CloseWithCorners = new TiledLine([170,-32,  170,50,  100,50,  100,-32 ],-32,4128)
const line11DirectCloseable = new TiledLine( reverseLine(line11CloseWithCorners.line),-32,4128)



// test("isEndBeforeStartSameEdge1",()=>{
   
//   expect(LineIndex.lineSameEdgeClosableOverallCorners(line11DirectCloseable)).toBe(false)
//   expect(LineIndex.lineSameEdgeClosableOverallCorners(line11CloseWithCorners)).toBe(true)

// })

// test("closeLine", () => {
//   const closed = LineIndex.closeLine(line11DirectCloseable,-32,4128)
//   console.log(closed)
// })

test("sameEdgeStartEndIdentical", () => {
  const tile = new TileInformation(7, 20, 10, initialTile)
  // console.log( "tile",tile )

  const lineOuter = [1000,-32,  1000,400,  2000,400,  2000,-32 ]
  const lineInner = [1500,-32,  1500,200,  1250,200,  1000,-32 ]

  const lines = [
    lineOuter,
    lineInner
  ];

  const polys = convertTileIsolinesToPolygons(400, lines, tile)

  const validLine = [1000,-32,1000,400,2000,400,2000,-32,1500,-32,1500,200,1250,200,1000,-32,1000,-32]

  expect(polys).toHaveLength(1)
  expect(polys[0]).toStrictEqual(validLine)

  console.log( lineArrayToStrings(polys) )
});

