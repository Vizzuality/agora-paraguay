/**
 * Regenerates the binary upload fixtures next to this script:
 *
 *   - farms.kmz          — farms.kml zipped as doc.kml
 *   - farms-utm21s.zip   — a zipped shapefile in EPSG:32721 (UTM 21S), the projection
 *                          a Paraguayan client is most likely to deliver, exercising
 *                          shpjs's .prj reprojection path
 *   - corrupt.zip        — bytes that claim to be a zip and are not
 *
 * ogr2ogr is deliberately not required: the shapefile is written by hand (the format
 * is simple for plain polygons) and then verified by round-tripping through shpjs —
 * the same library the app parses with.
 *
 *   node tests/e2e/fixtures/uploads/generate.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { zipSync } from "fflate";

const HERE = dirname(fileURLToPath(import.meta.url));

// proj4 is shpjs's dependency, not the app's — resolve it through shpjs so this script
// keeps working under pnpm's strict node_modules layout.
const require = createRequire(import.meta.url);
const requireFromShpjs = createRequire(require.resolve("shpjs"));
const proj4 = requireFromShpjs("proj4");

const UTM21S = "+proj=utm +zone=21 +south +datum=WGS84 +units=m +no_defs";

/** ESRI WKT for EPSG:32721, what a real .prj for UTM 21S contains. */
const PRJ =
  'PROJCS["WGS_1984_UTM_Zone_21S",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",' +
  'SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],' +
  'UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],' +
  'PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",10000000.0],' +
  'PARAMETER["Central_Meridian",-57.0],PARAMETER["Scale_Factor",0.9996],' +
  'PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]';

/** The farms, as lon/lat rings (clockwise, as the shapefile spec wants outer rings). */
const FARMS = [
  {
    name: "Estancia San Pedro",
    ring: [
      [-59.4, -24.4],
      [-59.4, -22.4],
      [-57.4, -22.4],
      [-57.4, -24.4],
      [-59.4, -24.4],
    ],
  },
  {
    name: "Campo Verde",
    ring: [
      [-56.8, -24.8],
      [-56.8, -24.2],
      [-56.2, -24.2],
      [-56.2, -24.8],
      [-56.8, -24.8],
    ],
  },
];

function projectedRings() {
  const forward = proj4(UTM21S).forward;

  return FARMS.map((farm) => farm.ring.map(([lng, lat]) => forward([lng, lat])));
}

/** Shapefile main file (.shp): 100-byte header, then one polygon record per farm. */
function buildShp(rings) {
  const records = rings.map((ring, index) => {
    const contentBytes = 48 + 16 * ring.length;
    const buffer = Buffer.alloc(8 + contentBytes);

    buffer.writeInt32BE(index + 1, 0);
    buffer.writeInt32BE(contentBytes / 2, 4);
    buffer.writeInt32LE(5, 8); // shape type: polygon
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);
    buffer.writeDoubleLE(Math.min(...xs), 12);
    buffer.writeDoubleLE(Math.min(...ys), 20);
    buffer.writeDoubleLE(Math.max(...xs), 28);
    buffer.writeDoubleLE(Math.max(...ys), 36);
    buffer.writeInt32LE(1, 44); // numParts
    buffer.writeInt32LE(ring.length, 48); // numPoints
    buffer.writeInt32LE(0, 52); // parts[0]
    ring.forEach(([x, y], point) => {
      buffer.writeDoubleLE(x, 56 + point * 16);
      buffer.writeDoubleLE(y, 64 + point * 16);
    });

    return buffer;
  });

  const body = Buffer.concat(records);
  const header = Buffer.alloc(100);

  header.writeInt32BE(9994, 0);
  header.writeInt32BE((100 + body.length) / 2, 24);
  header.writeInt32LE(1000, 28);
  header.writeInt32LE(5, 32);
  const allX = rings.flat().map(([x]) => x);
  const allY = rings.flat().map(([, y]) => y);
  header.writeDoubleLE(Math.min(...allX), 36);
  header.writeDoubleLE(Math.min(...allY), 44);
  header.writeDoubleLE(Math.max(...allX), 52);
  header.writeDoubleLE(Math.max(...allY), 60);

  return { shp: Buffer.concat([header, body]), records };
}

/** Shapefile index (.shx): the .shp header plus one offset/length pair per record. */
function buildShx(shpHeader, records) {
  const header = Buffer.from(shpHeader.subarray(0, 100));

  header.writeInt32BE((100 + 8 * records.length) / 2, 24);

  const entries = Buffer.alloc(8 * records.length);
  let offsetWords = 50;

  records.forEach((record, index) => {
    entries.writeInt32BE(offsetWords, index * 8);
    entries.writeInt32BE((record.length - 8) / 2, index * 8 + 4);
    offsetWords += record.length / 2;
  });

  return Buffer.concat([header, entries]);
}

/** Attribute table (.dbf) with a single NOMBRE character field. */
function buildDbf(names) {
  const fieldLength = 40;
  const headerSize = 32 + 32 + 1;
  const recordSize = 1 + fieldLength;
  const header = Buffer.alloc(headerSize);

  header[0] = 0x03;
  header[1] = 26; // last update: 2026-08-20; informational only
  header[2] = 8;
  header[3] = 20;
  header.writeUInt32LE(names.length, 4);
  header.writeUInt16LE(headerSize, 8);
  header.writeUInt16LE(recordSize, 10);
  header.write("NOMBRE", 32, "ascii");
  header[32 + 11] = "C".codePointAt(0);
  header[32 + 16] = fieldLength;
  header[headerSize - 1] = 0x0d;

  const records = names.map((name) => {
    const record = Buffer.alloc(recordSize, 0x20);

    record.write(name.slice(0, fieldLength), 1, "latin1");

    return record;
  });

  return Buffer.concat([header, ...records, Buffer.from([0x1a])]);
}

function buildShapefileZip() {
  const rings = projectedRings();
  const { shp, records } = buildShp(rings);

  return zipSync({
    "farms-utm21s.shp": new Uint8Array(shp),
    "farms-utm21s.shx": new Uint8Array(buildShx(shp, records)),
    "farms-utm21s.dbf": new Uint8Array(buildDbf(FARMS.map((farm) => farm.name))),
    "farms-utm21s.prj": new TextEncoder().encode(PRJ),
    "farms-utm21s.cpg": new TextEncoder().encode("UTF-8"),
  });
}

async function verifyShapefileZip(zipBytes) {
  const { default: shp } = await import("shpjs");
  const parsed = await shp(zipBytes.buffer);
  const collection = Array.isArray(parsed) ? parsed[0] : parsed;

  if (collection.features.length !== FARMS.length) {
    throw new Error(`round-trip produced ${collection.features.length} features`);
  }

  collection.features.forEach((feature, index) => {
    if (feature.properties.NOMBRE !== FARMS[index].name) {
      throw new Error(`NOMBRE mismatch: ${JSON.stringify(feature.properties)}`);
    }

    for (const [lng, lat] of feature.geometry.coordinates[0]) {
      const [expectedLng, expectedLat] = FARMS[index].ring[0];

      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        throw new Error(`coordinate not reprojected: ${lng}, ${lat}`);
      }

      // Every ring stays within a degree of its source square.
      if (Math.abs(lng - expectedLng) > 3 || Math.abs(lat - expectedLat) > 3) {
        throw new Error(`coordinate far from source: ${lng}, ${lat}`);
      }
    }
  });
}

const kml = readFileSync(join(HERE, "farms.kml"));

writeFileSync(join(HERE, "farms.kmz"), zipSync({ "doc.kml": new Uint8Array(kml) }));

const shapefileZip = buildShapefileZip();

await verifyShapefileZip(shapefileZip);
writeFileSync(join(HERE, "farms-utm21s.zip"), shapefileZip);

// A believable-looking prefix followed by garbage: unzippable by fflate and shpjs alike.
writeFileSync(
  join(HERE, "corrupt.zip"),
  Buffer.concat([Buffer.from("PK\x03\x04"), Buffer.alloc(64, 0xab)]),
);

console.log("fixtures written: farms.kmz, farms-utm21s.zip (verified via shpjs), corrupt.zip");
