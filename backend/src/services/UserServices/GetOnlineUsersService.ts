import User from "../../models/User";

interface Request {
  companyId: number;
}

const GetOnlineUsersService = async ({
  companyId
}: Request): Promise<User[]> => {
  return User.findAll({
    where: {
      companyId,
      online: true
    },
    order: [["lastSeen", "DESC"]]
  });
};

export default GetOnlineUsersService;
