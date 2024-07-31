import "dotenv/config";
import "./config/db.js";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import logger from "morgan";
import passport from "passport";
import MongoStore from "connect-mongo";

const app = express();
const port = process.env.PORT || 3000;

// cross origin
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// static files
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(
  "/src/public/uploads",
  express.static(path.join(__dirname, "/src/public/uploads"))
);

// parsing cookie
app.use(cookieParser());

// session
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  })
);

// passport config
app.use(passport.initialize());
app.use(passport.session());

// schedule
import "./src/lib/schedule.js";

// routes
import userRoutes from "./src/routes/userRoutes.js";
import hotelRoutes from "./src/routes/hotelRoutes.js";
import transactionRoutes from "./src/routes/transactionRoutes.js";

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/hotels", hotelRoutes);
app.use("/api/v1/booking", transactionRoutes);

// error not found
app.use((req, res, next) => {
  res.status(404).send({ message: "Not Found" });
  next();
});

app.listen(port, () => console.log(`server listening on port ${port}`));
