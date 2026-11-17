import { getSeed } from "../src/data";
import { validateAtlas } from "../src/lib/validate";

const d = getSeed();
const issues = validateAtlas(d);
console.log(
  `continents=${d.continents.length} countries=${d.countries.length} cities=${d.cities.length} venues=${d.venues.length} festivals=${d.festivals.length} artists=${d.artists.length} genres=${d.genres.length} labels=${d.labels.length} milestones=${d.milestones.length} sources=${d.sources.length}`
);
for (const i of issues) console.log(`✗ ${i.entity}/${i.slug}: ${i.problem}`);
if (issues.length) process.exit(1);
console.log("✓ data is consistent");
