export const isAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send({
      message: "You are not authorized to access this resource",
    });
  }
  next();
};

export const stillAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(400).send({
      message: "You are already authenticated",
    });
  }
  next();
};

export const isAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(400).send({
      message: "Access denied!",
    });
  }
  next();
};
