import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

export default class Path {
  static getBasePath(req) {
    return `${req.protocol}://${req.get("host")}/src/public/uploads`;
  }

  static unlinkImagePath(image) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const imagePath = image.split("http://localhost:3000").pop();
    const url = path.join(__dirname, "../../", imagePath);
    return fs.unlinkSync(url);
  }
}
