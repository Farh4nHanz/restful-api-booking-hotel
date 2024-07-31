import multer from "multer";

const FILE_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = FILE_TYPE[file.mimetype];
    let errors = new Error("Invalid image extension!");

    if (isValid) {
      errors = null;
    }

    cb(errors, "src/public/uploads");
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    const extension = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}_${unique}.${extension}`);
  },
});

export const fileUpload = multer({ storage: storage });
