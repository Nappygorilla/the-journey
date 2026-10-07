import { featureFlatList, featureRoutes } from "../src/data.js";

const expected = 142;
const missing = featureFlatList.filter(item => !item.item || !item.status || !featureRoutes[item.item]);
const groups = new Set(featureFlatList.map(item => item.group));

if (featureFlatList.length !== expected) {
  throw new Error("Feature manifest count mismatch: expected "+expected+", got "+featureFlatList.length);
}
if (missing.length) {
  throw new Error("Feature manifest has unbound entries: "+missing.map(x=>x.item).join(", "));
}
if (groups.size < 13) {
  throw new Error("Feature manifest is missing major feature groups.");
}

console.log("The Journey feature audit passed.");
console.log("Tracked entries:", featureFlatList.length);
console.log("Bound entries:", featureFlatList.length);
console.log("Groups:", groups.size);
