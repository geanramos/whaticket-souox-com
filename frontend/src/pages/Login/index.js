import React, { useState, useContext, useEffect, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import useSettings from "../../hooks/useSettings";
import IconButton from "@material-ui/core/IconButton";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import InputAdornment from "@material-ui/core/InputAdornment";
import { Helmet } from "react-helmet";
import BRFlag from "../../assets/brazil.png";
import USFlag from "../../assets/unitedstates.png";
import ESFlag from "../../assets/esspain.png";
import ARFlag from "../../assets/arabe.png";
import clsx from "clsx";
import { getBackendUrl } from "../../config";

const languageOptions = [
  { value: "pt-BR", label: "Português", icon: BRFlag },
  { value: "en", label: "English", icon: USFlag },
  { value: "es", label: "Spanish", icon: ESFlag },
  { value: "ar", label: "عربي", icon: ARFlag },
];

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "0",
    margin: "0",
    boxSizing: "border-box",
    overflow: "hidden", // Corrigido: removido auto que causava rolagem
    // Background com tom de azul
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
    position: "relative",
    
    // Padrão de pontos no fundo
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.05) 1px, transparent 1px),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px)
      `,
      backgroundSize: "50px 50px",
      animation: "$float 20s ease-in-out infinite",
    },
  },

  "@keyframes float": {
    "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
    "50%": { transform: "translateY(-10px) rotate(180deg)" },
  },

  // Container ajustado - desktop à direita, mobile centralizado
  containerLogin: {
    padding: "16px",
    maxWidth: "444px",
    width: "100%",
    margin: "0 auto",
    position: "relative",
    zIndex: 10,
    
    // Desktop - alinhar à direita
    [theme.breakpoints.up("md")]: {
      position: "absolute",
      right: "8%",
      top: "50%",
      transform: "translateY(-50%)",
      margin: "0",
      maxWidth: "420px",
    },
    
    // Mobile - centralizado (comportamento original)
    [theme.breakpoints.down("sm")]: {
      position: "relative",
      margin: "0 auto",
      transform: "none",
    },
  },

  paper: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: `
      0 20px 40px rgba(0, 0, 0, 0.1),
      0 1px 0 rgba(255, 255, 255, 0.2) inset,
      0 0 0 1px rgba(255, 255, 255, 0.1)
    `,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 30px",
    borderRadius: "20px",
    maxWidth: "420px",
    width: "100%",
    margin: "0 auto",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    animation: "$slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    
    [theme.breakpoints.down("sm")]: {
      animation: "$slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
      borderRadius: "12px",
      padding: "35px 25px",
    },
  },

  "@keyframes slideInRight": {
    from: {
      opacity: 0,
      transform: "translateX(50px)",
    },
    to: {
      opacity: 1,
      transform: "translateX(0)",
    },
  },

  "@keyframes slideInUp": {
    from: {
      opacity: 0,
      transform: "translateY(30px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },

  avatar: {
    margin: theme.spacing(1),
    backgroundColor: "#3b82f6",
  },

  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },

  submit: {
    margin: theme.spacing(3, 0, 2),
    background: "linear-gradient(45deg, #3b82f6, #1e40af)",
    color: "white",
    borderRadius: "12px",
    padding: "12px 0",
    fontSize: "16px",
    fontWeight: 600,
    textTransform: "none",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    border: "none",
    transition: "all 0.3s ease",
    "&:hover": {
      background: "linear-gradient(45deg, #2563eb, #1d4ed8)",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(59, 130, 246, 0.4)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },

  powered: {
    color: "white",
  },

  // Logo - mantendo o sistema original
  logoImg: {
    width: "100%",
    maxWidth: "280px",
    height: "auto",
    maxHeight: "80px",
    margin: "0 auto 20px auto",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
    // IMPORTANTE: Mantendo o sistema original de carregamento do logo
    content: "url(" + (theme.mode === "light" 
      ? theme.calculatedLogoLight() 
      : theme.calculatedLogoDark()) + ")",
  },

  iconButton: {
    position: "absolute",
    top: 15,
    right: 15,
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#374151",
    transition: "all 0.3s ease",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.2)",
      transform: "scale(1.05)",
    },
  },

  // Campos de input melhorados mas compatíveis
  textField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
      "&.Mui-focused": {
        backgroundColor: "rgba(255, 255, 255, 1)",
        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
      },
      "& fieldset": {
        borderColor: "rgba(59, 130, 246, 0.2)",
      },
      "&:hover fieldset": {
        borderColor: "rgba(59, 130, 246, 0.4)",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3b82f6",
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      color: "#6b7280",
      fontWeight: 500,
      "&.Mui-focused": {
        color: "#3b82f6",
      },
    },
  },

  // Seletor de idioma - versão simplificada
  languageSelector: {
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 1000,
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "8px 12px",
  },

  // Link de registro
  registerLink: {
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: 600,
    transition: "all 0.3s ease",
    "&:hover": {
      color: "#2563eb",
      textDecoration: "underline",
    },
  },

  // Estilos para o dropdown de idiomas
  languageDropdown: {
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    gap: "8px",
    transition: "opacity 0.3s ease",
    "&:hover": {
      opacity: 0.8,
    },
  },

  languageOptions: {
    position: "absolute",
    top: "100%",
    left: "0",
    marginTop: "8px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "8px",
    zIndex: 1000,
    minWidth: "140px",
  },

  languageOption: {
    background: "none",
    border: "none",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "8px 12px",
    textAlign: "left",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      background: "rgba(59, 130, 246, 0.1)",
      color: "#3b82f6",
    },
  },

  flagIcon: {
    width: 20,
    height: 15,
    borderRadius: 2,
  },
}));

const Login = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const { appLogoFavicon, appName, mode } = colorMode;
  const [user, setUser] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [allowSignup, setAllowSignup] = useState(false);
  const { getPublicSetting } = useSettings();
  const { handleLogin } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const ref = useRef();
  const [enabledLanguages, setEnabledLanguages] = useState(["pt-BR", "en"]);
  const [backgroundLight, setBackgroundLight] = useState("");
  const [backgroundDark, setBackgroundDark] = useState("");

  const getCompanyIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get("companyId");
    return companyId ? parseInt(companyId) : null;
  };

  const handleChangeInput = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handlSubmit = (e) => {
    e.preventDefault();
    handleLogin(user);
  };

  useEffect(() => {
    const companyId = getCompanyIdFromUrl();

    getPublicSetting("userCreation", companyId)
      .then((data) => {
        setAllowSignup(data === "enabled");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    
    getPublicSetting("enabledLanguages", companyId)
      .then((langs) => {
        let arr = ["pt-BR", "en"];
        try {
          if (langs) arr = JSON.parse(langs);
        } catch {}
        setEnabledLanguages(arr);
      })
      .catch(() => {
        setEnabledLanguages(["pt-BR", "en"]);
      });

    getPublicSetting("appLogoBackgroundLight", companyId)
      .then((bgLight) => {
        if (bgLight) {
          setBackgroundLight(getBackendUrl() + "/public/" + bgLight);
        } else {
          setBackgroundLight("");
        }
      })
      .catch(() => {
        setBackgroundLight("");
      });

    getPublicSetting("appLogoBackgroundDark", companyId)
      .then((bgDark) => {
        if (bgDark) {
          setBackgroundDark(getBackendUrl() + "/public/" + bgDark);
        } else {
          setBackgroundDark("");
        }
      })
      .catch(() => {
        setBackgroundDark("");
      });
  }, []);

  const current =
    languageOptions.find((opt) => opt.value === i18n.language) ||
    languageOptions[0];

  const handleSelect = (opt) => {
    i18n.changeLanguage(opt.value);
    localStorage.setItem("language", opt.value);
    setOpen(false);
    window.location.reload();
  };

    let finalBackground;
  if (mode === "light") {
    if (backgroundLight) {
      finalBackground = `url(${backgroundLight})`;
    } else {
      finalBackground = theme.palette.light || "#f5f5f5";
    }
  } else {
    if (backgroundDark) {
      finalBackground = `url(${backgroundDark})`;
    } else {
      finalBackground = theme.palette.dark || "#303030";
    }
  }

  finalBackground = String(finalBackground || "#f5f5f5");


  return (
    <>
      <Helmet>
        <title>{appName || "Multi100"}</title>
        <link rel="icon" href={appLogoFavicon || "/default-favicon.ico"} />
      </Helmet>
      
      <div className={clsx(classes.root, "login-page")}
      style={{   
          width: "100vw !important",
          height: "100vh !important",
          display: "flex !important",
          alignItems: "center !important",
          justifyContent: "center !important",
          padding: "0 !important",
          margin: "0 !important",
          boxSizing: "border-box !important",
          overflow: "auto !important",
          backgroundColor:
            typeof finalBackground === "string" &&
            finalBackground.includes("url(")
              ? "transparent"
              : finalBackground,
          backgroundImage:
            typeof finalBackground === "string" &&
            finalBackground.includes("url(")
              ? finalBackground
              : "none",
          backgroundRepeat: "no-repeat !important",
          backgroundSize: "cover !important",
          backgroundPosition: "center !important",
        }}
      >
        {/* Seletor de idioma */}
        <div
          ref={ref}
          className={classes.languageSelector}
        >
          <button 
            onClick={() => setOpen((o) => !o)}
            className={classes.languageDropdown}
          >
            <img
              src={current.icon}
              alt={current.label}
              className={classes.flagIcon}
            />
            {current.label}
            <span>▾</span>
          </button>

          {open && (
            <div className={classes.languageOptions}>
              {languageOptions
                .filter((opt) => enabledLanguages.includes(opt.value))
                .map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={classes.languageOption}
                  >
                    <img
                      src={opt.icon}
                      alt={opt.label}
                      className={classes.flagIcon}
                    />
                    {opt.label}
                  </button>
                ))}
            </div>
          )}
        </div>

        <Container
          component="main"
          maxWidth="xs"
          className={classes.containerLogin}
        >
          <CssBaseline />
          <div className={classes.paper}>
            <IconButton
              className={classes.iconButton}
              onClick={colorMode.toggleColorMode}
            >
              {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            
            <div>
              <img className={classes.logoImg} alt="logo" />
            </div>
            
            <form className={classes.form} noValidate onSubmit={handlSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="email"
                label={i18n.t("login.form.email")}
                name="email"
                value={user.email}
                onChange={handleChangeInput}
                autoComplete="email"
                autoFocus
                className={classes.textField}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={i18n.t("login.form.password")}
                type={showPassword ? "text" : "password"}
                id="password"
                value={user.password}
                onChange={handleChangeInput}
                autoComplete="current-password"
                className={classes.textField}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                        style={{ color: "#6b7280" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                {i18n.t("login.buttons.submit")}
              </Button>
              {allowSignup && (
                <Grid container justifyContent="center">
                  <Grid item>
                    <Link
                      href="#"
                      variant="body2"
                      component={RouterLink}
                      to="/signup"
                      className={classes.registerLink}
                    >
                      {i18n.t("login.buttons.register")}
                    </Link>
                  </Grid>
                </Grid>
              )}
            </form>
          </div>
        </Container>
      </div>
    </>
  );
};

export default Login;