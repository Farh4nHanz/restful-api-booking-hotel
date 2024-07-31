import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../models/User.js";
import { comparePassword } from "../lib/comparePassword.js";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email });

        if (!user)
          return done(null, false, {
            message: `Cannot find a user with email ${email}`,
          });

        if (!comparePassword(password, user.password))
          return done(null, false, { message: "Incorrect password!" });

        return done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, user.id);
  });
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    return user ? done(null, user) : done(null, null);
  } catch (err) {
    done(err, null);
  }
});
