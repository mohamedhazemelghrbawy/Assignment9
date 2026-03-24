export const authorization = (role = []) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      throw new Error("You  are not have access");
    }
    next();
  };
};
