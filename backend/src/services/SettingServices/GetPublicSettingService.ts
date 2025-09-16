import Setting from "../../models/Setting";

interface Request {
  key: string;
  companyId?: number;
}

const publicSettingsKeys = [
  "userCreation",
  "primaryColorLight",
  "primaryColorDark",
  "appLogoLight",
  "appLogoDark",
  "appLogoFavicon",
  "appName",
  "enabledLanguages",
  "appLogoBackgroundLight",
  "appLogoBackgroundDark"
];

const GetPublicSettingService = async ({
  key,
  companyId
}: Request): Promise<string | undefined> => {
  if (!publicSettingsKeys.includes(key)) {
    return null;
  }

  const targetCompanyId = companyId || 1;

  const setting = await Setting.findOne({
    where: {
      companyId: targetCompanyId,
      key
    }
  });
  return setting?.value;
};

export default GetPublicSettingService;
