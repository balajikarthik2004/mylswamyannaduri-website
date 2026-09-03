import { remove } from "./src/lib/server/booking-store.js";
import { config } from "dotenv";

config();

async function test() {
    await remove("MA-260909-54PN");
    console.log("Done");
}
test();
