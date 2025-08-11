import app from "./app.js";
import { connectDB } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;

connectDB();
app.listen(PORT, () => {
  console.log("server on port:", PORT);
});
console.log("server on port: ", 4000);
