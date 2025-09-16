const OnlyForSuperUser = ({ user, yes, no }) => {
  if (!user || !user.super) {
    return no ? no() : null;
  }

  return yes ? yes() : null;
};

OnlyForSuperUser.defaultProps = {
  user: {},
  yes: () => null,
  no: () => null,
};

export default OnlyForSuperUser;
