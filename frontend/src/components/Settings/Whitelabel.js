import React, { useEffect, useState, useContext, useRef } from "react";

import Grid from "@material-ui/core/Grid";
import FormControl from "@material-ui/core/FormControl";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import Box from "@material-ui/core/Box";
import useSettings from "../../hooks/useSettings";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";

import { IconButton, InputAdornment, Chip } from "@material-ui/core";

import { Colorize, AttachFile, Delete, Palette, Image, Language, Apps } from "@material-ui/icons";
import ColorPicker from "../ColorPicker";
import ColorModeContext from "../../layout/themeContext";
import api from "../../services/api";
import { getBackendUrl } from "../../config";

import defaultLogoLight from "../../assets/logo.png";
import defaultLogoDark from "../../assets/logo-black.png";
import defaultLogoFavicon from "../../assets/favicon.ico";
import ColorBoxModal from "../ColorBoxModal/index.js";
import Checkbox from "@material-ui/core/Checkbox";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
  sectionPaper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: theme.spacing(1),
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(1.5),
    },
  },
  sectionIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  sectionTitle: {
    fontWeight: 600,
    color: theme.palette.text.primary,
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.1rem",
    },
  },
  sectionSubtitle: {
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
    marginTop: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.8rem",
    },
  },
  formField: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      marginBottom: theme.spacing(1.5),
    },
  },
  colorAdorment: {
    width: 20,
    height: 20,
    borderRadius: 4,
    border: "1px solid #ddd",
  },
  uploadInput: {
    display: "none",
  },
  uploadField: {
    "& .MuiInputBase-input": {
      cursor: "pointer",
    },
  },
  previewContainer: {
    marginTop: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(1),
    },
  },
  previewGrid: {
    [theme.breakpoints.down("sm")]: {
      justifyContent: "center",
    },
  },
  previewCard: {
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    border: "2px solid #e0e0e0",
    textAlign: "center",
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    [theme.breakpoints.down("sm")]: {
      height: "100px",
      padding: theme.spacing(1),
    },
  },
  previewCardLight: {
    backgroundColor: "#ffffff",
    borderColor: "#e0e0e0",
  },
  previewCardDark: {
    backgroundColor: "#424242",
    borderColor: "#666666",
  },
  previewCardFavicon: {
    backgroundColor: "#f5f5f5",
    borderColor: "#d0d0d0",
  },
  previewImage: {
    maxWidth: "100%",
    maxHeight: "80px",
    objectFit: "contain",
    [theme.breakpoints.down("sm")]: {
      maxHeight: "60px",
    },
  },
  previewBackgroundImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: theme.spacing(0.5),
  },
  previewLabel: {
    fontSize: "0.75rem",
    color: "#666",
    marginTop: theme.spacing(0.5),
    fontWeight: 500,
  },
  previewLabelDark: {
    color: "#ccc",
  },
  languageSection: {
    marginTop: theme.spacing(1),
  },
  languageGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(0.5),
    },
  },
  languageItem: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1),
    minWidth: "120px",
    [theme.breakpoints.down("sm")]: {
      minWidth: "100px",
      padding: theme.spacing(0.5),
    },
  },
  languageCheckbox: {
    padding: theme.spacing(0.5),
  },
  languageLabel: {
    fontSize: "0.875rem",
    fontWeight: 500,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.8rem",
    },
  },
  colorSection: {
    [theme.breakpoints.down("sm")]: {
      "& .MuiGrid-item": {
        paddingBottom: theme.spacing(1),
      },
    },
  },
  logoSection: {
    [theme.breakpoints.down("sm")]: {
      "& .MuiGrid-item": {
        paddingBottom: theme.spacing(1),
      },
    },
  },
  divider: {
    margin: theme.spacing(2, 0),
    [theme.breakpoints.down("sm")]: {
      margin: theme.spacing(1.5, 0),
    },
  },
}));

const LANGUAGE_OPTIONS = [
  { code: "pt-BR", label: "Português" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ar", label: "عربي" },
];

export default function Whitelabel(props) {
  const { settings } = props;
  const classes = useStyles();
  const [settingsLoaded, setSettingsLoaded] = useState({});

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const { colorMode } = useContext(ColorModeContext);
  const [primaryColorLightModalOpen, setPrimaryColorLightModalOpen] =
    useState(false);
  const [primaryColorDarkModalOpen, setPrimaryColorDarkModalOpen] =
    useState(false);

  const logoLightInput = useRef(null);
  const logoDarkInput = useRef(null);
  const logoFaviconInput = useRef(null);
  const backgroundLightInput = useRef(null);
  const backgroundDarkInput = useRef(null);
  const appNameInput = useRef(null);
  const [appName, setAppName] = useState(settingsLoaded.appName || "");
  const [enabledLanguages, setEnabledLanguages] = useState(["pt-BR", "en"]);

  const { update } = useSettings();

  function updateSettingsLoaded(key, value) {
    if (
      key === "primaryColorLight" ||
      key === "primaryColorDark" ||
      key === "appName"
    ) {
      localStorage.setItem(key, value);
    }
    const newSettings = { ...settingsLoaded };
    newSettings[key] = value;
    setSettingsLoaded(newSettings);
  }

  useEffect(() => {
    let isMounted = true;

    getCurrentUserInfo().then((u) => {
      const userData = u.user || u;
      if (isMounted) {
        setCurrentUser(userData);
      }
    });

    if (Array.isArray(settings) && settings.length) {
      const primaryColorLight = settings.find(
        (s) => s.key === "primaryColorLight"
      )?.value;
      const primaryColorDark = settings.find(
        (s) => s.key === "primaryColorDark"
      )?.value;
      const appLogoLight = settings.find(
        (s) => s.key === "appLogoLight"
      )?.value;
      const appLogoDark = settings.find((s) => s.key === "appLogoDark")?.value;
      const appLogoFavicon = settings.find(
        (s) => s.key === "appLogoFavicon"
      )?.value;
      const appLogoBackgroundLight = settings.find(
        (s) => s.key === "appLogoBackgroundLight"
      )?.value;
      const appLogoBackgroundDark = settings.find(
        (s) => s.key === "appLogoBackgroundDark"
      )?.value;
      const appName = settings.find((s) => s.key === "appName")?.value;
      const enabledLanguagesSetting = settings.find(
        (s) => s.key === "enabledLanguages"
      )?.value;
      let langs = ["pt-BR", "en"];
      try {
        if (enabledLanguagesSetting) {
          langs = JSON.parse(enabledLanguagesSetting);
        }
      } catch {}

      if (isMounted) {
        setAppName(appName || "");
        setEnabledLanguages(langs);
        setSettingsLoaded({
          ...settingsLoaded,
          primaryColorLight,
          primaryColorDark,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appLogoBackgroundLight,
          appLogoBackgroundDark,
          appName,
          enabledLanguages: langs,
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [settings]);

  async function handleSaveSetting(key, value) {
    await update({
      key,
      value,
    });
    updateSettingsLoaded(key, value);
    toast.success("Operação atualizada com sucesso.");
  }

  async function handleSaveEnabledLanguages(newLangs) {
    await handleSaveSetting("enabledLanguages", newLangs);
    setEnabledLanguages(newLangs);
  }

  const uploadLogo = async (e, mode) => {
    if (!e.target.files) {
      return;
    }

    const file = e.target.files[0];
    const formData = new FormData();

    formData.append("typeArch", "logo");
    formData.append("mode", mode);
    formData.append("file", file);

    await api
      .post("/settings-whitelabel/logo", formData, {
        onUploadProgress: (event) => {
          let progress = Math.round((event.loaded * 100) / event.total);
          console.log(`A imagem está ${progress}% carregada... `);
        },
      })
      .then((response) => {
        updateSettingsLoaded(`appLogo${mode}`, response.data);
        if (mode === "BackgroundLight" || mode === "BackgroundDark") {
        } else {
          colorMode[`setAppLogo${mode}`](
            getBackendUrl() + "/public/" + response.data
          );
        }
      })
      .catch((err) => {
        console.error(`Houve um problema ao realizar o upload da imagem.`);
        console.log(err);
      });
  };

  return (
    <div className={classes.container}>
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <>
            {/* Seção de Configurações Gerais */}
            <Paper className={classes.sectionPaper}>
              <div className={classes.sectionHeader}>
                <Apps className={classes.sectionIcon} />
                <div>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    {i18n.t("whitelabel.sections.general")}
                  </Typography>
                  <Typography className={classes.sectionSubtitle}>
                    {i18n.t("whitelabel.sections.generalDescription")}
                  </Typography>
                </div>
              </div>

              <Grid container spacing={3}>
                <Grid xs={12} sm={6} md={6} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="appname-field"
                      label={i18n.t("whitelabel.appName")}
                      variant="outlined"
                      name="appName"
                      value={appName}
                      inputRef={appNameInput}
                      onChange={(e) => {
                        setAppName(e.target.value);
                      }}
                      onBlur={async (_) => {
                        await handleSaveSetting("appName", appName);
                        colorMode.setAppName(appName || "Multi100");
                      }}
                      size="small"
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Seção de Cores */}
            <Paper className={classes.sectionPaper}>
              <div className={classes.sectionHeader}>
                <Palette className={classes.sectionIcon} />
                <div>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    {i18n.t("whitelabel.sections.colors")}
                  </Typography>
                  <Typography className={classes.sectionSubtitle}>
                    {i18n.t("whitelabel.sections.colorsDescription")}
                  </Typography>
                </div>
              </div>

              <Grid container spacing={3} className={classes.colorSection}>
                <Grid xs={12} sm={6} md={6} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="primary-color-light-field"
                      label={i18n.t("whitelabel.primaryColorLight")}
                      variant="outlined"
                      value={settingsLoaded.primaryColorLight || ""}
                      onClick={() => setPrimaryColorLightModalOpen(true)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <div
                              style={{
                                backgroundColor: settingsLoaded.primaryColorLight,
                              }}
                              className={classes.colorAdorment}
                            ></div>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => setPrimaryColorLightModalOpen(true)}
                          >
                            <Colorize />
                          </IconButton>
                        ),
                      }}
                    />
                  </FormControl>
                  <ColorBoxModal
                    open={primaryColorLightModalOpen}
                    handleClose={() => setPrimaryColorLightModalOpen(false)}
                    onChange={(color) => {
                      console.log("🔍 [Whitelabel] Color changed:", color);
                      handleSaveSetting("primaryColorLight", `#${color.hex}`);
                      colorMode.setPrimaryColorLight(`#${color.hex}`);
                    }}
                    currentColor={settingsLoaded.primaryColorLight}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={6} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="primary-color-dark-field"
                      label={i18n.t("whitelabel.primaryColorDark")}
                      variant="outlined"
                      value={settingsLoaded.primaryColorDark || ""}
                      onClick={() => setPrimaryColorDarkModalOpen(true)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <div
                              style={{
                                backgroundColor: settingsLoaded.primaryColorDark,
                              }}
                              className={classes.colorAdorment}
                            ></div>
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => setPrimaryColorDarkModalOpen(true)}
                          >
                            <Colorize />
                          </IconButton>
                        ),
                      }}
                    />
                  </FormControl>
                  <ColorBoxModal
                    open={primaryColorDarkModalOpen}
                    handleClose={() => setPrimaryColorDarkModalOpen(false)}
                    onChange={(color) => {
                      handleSaveSetting("primaryColorDark", `#${color.hex}`);
                      colorMode.setPrimaryColorDark(`#${color.hex}`);
                    }}
                    currentColor={settingsLoaded.primaryColorDark}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Seção de Logos e Imagens */}
            <Paper className={classes.sectionPaper}>
              <div className={classes.sectionHeader}>
                <Image className={classes.sectionIcon} />
                <div>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    {i18n.t("whitelabel.sections.logos")}
                  </Typography>
                  <Typography className={classes.sectionSubtitle}>
                    {i18n.t("whitelabel.sections.logosDescription")}
                  </Typography>
                </div>
              </div>

              <Grid container spacing={3} className={classes.logoSection}>
                <Grid xs={12} sm={6} md={4} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="logo-light-upload-field"
                      label={i18n.t("whitelabel.logoLight")}
                      variant="outlined"
                      value={settingsLoaded.appLogoLight || ""}
                      size="small"
                      className={classes.uploadField}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <>
                            {settingsLoaded.appLogoLight && (
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  handleSaveSetting("appLogoLight", "");
                                  colorMode.setAppLogoLight(defaultLogoLight);
                                }}
                              >
                                <Delete
                                  titleAccess={i18n.t("whitelabel.delete")}
                                />
                              </IconButton>
                            )}
                            <input
                              type="file"
                              id="upload-logo-light-button"
                              ref={logoLightInput}
                              className={classes.uploadInput}
                              onChange={(e) => uploadLogo(e, "Light")}
                            />
                            <label htmlFor="upload-logo-light-button">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  logoLightInput.current.click();
                                }}
                              >
                                <AttachFile
                                  titleAccess={i18n.t("whitelabel.upload")}
                                />
                              </IconButton>
                            </label>
                          </>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={4} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="logo-dark-upload-field"
                      label={i18n.t("whitelabel.logoDark")}
                      variant="outlined"
                      value={settingsLoaded.appLogoDark || ""}
                      size="small"
                      className={classes.uploadField}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <>
                            {settingsLoaded.appLogoDark && (
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  handleSaveSetting("appLogoDark", "");
                                  colorMode.setAppLogoDark(defaultLogoDark);
                                }}
                              >
                                <Delete
                                  titleAccess={i18n.t("whitelabel.delete")}
                                />
                              </IconButton>
                            )}
                            <input
                              type="file"
                              id="upload-logo-dark-button"
                              ref={logoDarkInput}
                              className={classes.uploadInput}
                              onChange={(e) => uploadLogo(e, "Dark")}
                            />
                            <label htmlFor="upload-logo-dark-button">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  logoDarkInput.current.click();
                                }}
                              >
                                <AttachFile
                                  titleAccess={i18n.t("whitelabel.upload")}
                                />
                              </IconButton>
                            </label>
                          </>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={4} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="logo-favicon-upload-field"
                      label={i18n.t("whitelabel.favicon")}
                      variant="outlined"
                      value={settingsLoaded.appLogoFavicon || ""}
                      size="small"
                      className={classes.uploadField}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <>
                            {settingsLoaded.appLogoFavicon && (
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  handleSaveSetting("appLogoFavicon", "");
                                  colorMode.setAppLogoFavicon(defaultLogoFavicon);
                                }}
                              >
                                <Delete
                                  titleAccess={i18n.t("whitelabel.delete")}
                                />
                              </IconButton>
                            )}
                            <input
                              type="file"
                              id="upload-logo-favicon-button"
                              ref={logoFaviconInput}
                              className={classes.uploadInput}
                              onChange={(e) => uploadLogo(e, "Favicon")}
                            />
                            <label htmlFor="upload-logo-favicon-button">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  logoFaviconInput.current.click();
                                }}
                              >
                                <AttachFile
                                  titleAccess={i18n.t("whitelabel.upload")}
                                />
                              </IconButton>
                            </label>
                          </>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={6} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="background-light-upload-field"
                      label={i18n.t("whitelabel.backgroundLight")}
                      variant="outlined"
                      value={settingsLoaded.appLogoBackgroundLight || ""}
                      size="small"
                      className={classes.uploadField}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <>
                            {settingsLoaded.appLogoBackgroundLight && (
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  handleSaveSetting("appLogoBackgroundLight", "");
                                }}
                              >
                                <Delete
                                  titleAccess={i18n.t("whitelabel.delete")}
                                />
                              </IconButton>
                            )}
                            <input
                              type="file"
                              id="upload-background-light-button"
                              ref={backgroundLightInput}
                              className={classes.uploadInput}
                              onChange={(e) => uploadLogo(e, "BackgroundLight")}
                            />
                            <label htmlFor="upload-background-light-button">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  backgroundLightInput.current.click();
                                }}
                              >
                                <AttachFile
                                  titleAccess={i18n.t("whitelabel.upload")}
                                />
                              </IconButton>
                            </label>
                          </>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={6} item>
                  <FormControl className={classes.formField} fullWidth>
                    <TextField
                      id="background-dark-upload-field"
                      label={i18n.t("whitelabel.backgroundDark")}
                      variant="outlined"
                      value={settingsLoaded.appLogoBackgroundDark || ""}
                      size="small"
                      className={classes.uploadField}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <>
                            {settingsLoaded.appLogoBackgroundDark && (
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  handleSaveSetting("appLogoBackgroundDark", "");
                                }}
                              >
                                <Delete
                                  titleAccess={i18n.t("whitelabel.delete")}
                                />
                              </IconButton>
                            )}
                            <input
                              type="file"
                              id="upload-background-dark-button"
                              ref={backgroundDarkInput}
                              className={classes.uploadInput}
                              onChange={(e) => uploadLogo(e, "BackgroundDark")}
                            />
                            <label htmlFor="upload-background-dark-button">
                              <IconButton
                                size="small"
                                color="default"
                                onClick={() => {
                                  backgroundDarkInput.current.click();
                                }}
                              >
                                <AttachFile
                                  titleAccess={i18n.t("whitelabel.upload")}
                                />
                              </IconButton>
                            </label>
                          </>
                        ),
                      }}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Preview Section */}
              <div className={classes.previewContainer}>
                <Typography variant="subtitle2" gutterBottom style={{ fontWeight: 600, marginBottom: 16 }}>
                  {i18n.t("whitelabel.preview")}
                </Typography>
                <Grid container spacing={2} className={classes.previewGrid}>
                  <Grid xs={12} sm={6} md={3} item>
                    <div className={`${classes.previewCard} ${classes.previewCardLight}`}>
                      <img
                        className={classes.previewImage}
                        src={settingsLoaded.appLogoLight ? 
                          getBackendUrl() + "/public/" + settingsLoaded.appLogoLight : 
                          defaultLogoLight
                        }
                        alt={i18n.t("whitelabel.preview") + " light-logo"}
                        onError={(e) => {
                          e.target.src = defaultLogoLight;
                        }}
                      />
                      <div className={classes.previewLabel}>
                        {i18n.t("whitelabel.logoLight")}
                      </div>
                    </div>
                  </Grid>

                  <Grid xs={12} sm={6} md={3} item>
                    <div className={`${classes.previewCard} ${classes.previewCardDark}`}>
                      <img
                        className={classes.previewImage}
                        src={settingsLoaded.appLogoDark ? 
                          getBackendUrl() + "/public/" + settingsLoaded.appLogoDark : 
                          defaultLogoDark
                        }
                        alt={i18n.t("whitelabel.preview") + " dark-logo"}
                        onError={(e) => {
                          e.target.src = defaultLogoDark;
                        }}
                      />
                      <div className={`${classes.previewLabel} ${classes.previewLabelDark}`}>
                        {i18n.t("whitelabel.logoDark")}
                      </div>
                    </div>
                  </Grid>

                  <Grid xs={12} sm={6} md={3} item>
                    <div className={`${classes.previewCard} ${classes.previewCardFavicon}`}>
                      <img
                        className={classes.previewImage}
                        src={settingsLoaded.appLogoFavicon ? 
                          getBackendUrl() + "/public/" + settingsLoaded.appLogoFavicon : 
                          defaultLogoFavicon
                        }
                        alt={i18n.t("whitelabel.preview") + " favicon"}
                        onError={(e) => {
                          e.target.src = defaultLogoFavicon;
                        }}
                      />
                      <div className={classes.previewLabel}>
                        {i18n.t("whitelabel.favicon")}
                      </div>
                    </div>
                  </Grid>

                  <Grid xs={12} sm={6} md={6} item>
                    <div className={`${classes.previewCard} ${classes.previewCardLight}`}>
                      {settingsLoaded.appLogoBackgroundLight ? (
                        <img
                          className={classes.previewBackgroundImage}
                          src={
                            getBackendUrl() +
                            "/public/" +
                            settingsLoaded.appLogoBackgroundLight
                          }
                          alt={i18n.t("whitelabel.preview") + " background-light"}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className={classes.previewLabel}>
                          {i18n.t("whitelabel.backgroundLight")}
                        </div>
                      )}
                    </div>
                  </Grid>

                  <Grid xs={12} sm={6} md={6} item>
                    <div className={`${classes.previewCard} ${classes.previewCardDark}`}>
                      {settingsLoaded.appLogoBackgroundDark ? (
                        <img
                          className={classes.previewBackgroundImage}
                          src={
                            getBackendUrl() +
                            "/public/" +
                            settingsLoaded.appLogoBackgroundDark
                          }
                          alt={i18n.t("whitelabel.preview") + " background-dark"}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className={`${classes.previewLabel} ${classes.previewLabelDark}`}>
                          {i18n.t("whitelabel.backgroundDark")}
                        </div>
                      )}
                    </div>
                  </Grid>
                </Grid>
              </div>
            </Paper>

            {/* Seção de Idiomas */}
            <Paper className={classes.sectionPaper}>
              <div className={classes.sectionHeader}>
                <Language className={classes.sectionIcon} />
                <div>
                  <Typography variant="h6" className={classes.sectionTitle}>
                    {i18n.t("whitelabel.sections.languages")}
                  </Typography>
                  <Typography className={classes.sectionSubtitle}>
                    {i18n.t("whitelabel.sections.languagesDescription")}
                  </Typography>
                </div>
              </div>

              <div className={classes.languageSection}>
                <div className={classes.languageGrid}>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <div key={lang.code} className={classes.languageItem}>
                      <Checkbox
                        className={classes.languageCheckbox}
                        checked={enabledLanguages.includes(lang.code)}
                        onChange={(e) => {
                          let newLangs = e.target.checked
                            ? [...enabledLanguages, lang.code]
                            : enabledLanguages.filter((c) => c !== lang.code);
                          if (newLangs.length === 0) {
                            toast.error(
                              i18n.t("whitelabel.atLeastOneLanguage")
                            );
                            return;
                          }
                          handleSaveEnabledLanguages(newLangs);
                        }}
                        color="primary"
                        size="small"
                      />
                      <span className={classes.languageLabel}>
                        {lang.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Paper>
          </>
        )}
      />
    </div>
  );
}