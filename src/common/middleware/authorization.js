export const authorization = async (role) => {
  return async (req, res, next) => {
    if (!role.includes(req.user.role)) {
      throw new Error("You  are not have access");
    }
    next();
  };
};
