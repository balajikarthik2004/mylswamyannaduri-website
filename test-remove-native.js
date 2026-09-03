const fs = require('fs/promises');
const path = require('path');

async function remove(reference) {
    const targetFile = path.join(process.cwd(), '.data', 'bookings.json');
    let raw = await fs.readFile(targetFile, 'utf8');
    let all = JSON.parse(raw);
    console.log("Initial count:", all.length);
    let filtered = all.filter(b => b.reference !== reference);
    console.log("Filtered count:", filtered.length);
    const tmp = path.join(process.cwd(), '.data', `.bookings.json.${process.pid}.tmp`);
    await fs.writeFile(tmp, JSON.stringify(filtered, null, 2), "utf8");
    await fs.rename(tmp, targetFile);
    console.log("Done");
}

remove("MA-260909-54PN").catch(console.error);
