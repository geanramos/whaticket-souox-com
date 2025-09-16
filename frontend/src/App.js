import React, { useState, useEffect, useMemo } from "react";
import api from "./services/api";
import "react-toastify/dist/ReactToastify.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { ptBR } from "@material-ui/core/locale";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import { useMediaQuery } from "@material-ui/core";
import ColorModeContext from "./layout/themeContext";
import { ActiveMenuProvider } from "./context/ActiveMenuContext";
import Favicon from "react-favicon";
import { getBackendUrl } from "./config";
import Routes from "./routes";
import defaultLogoLight from "./assets/logo.png";
import defaultLogoDark from "./assets/logo-black.png";
import defaultLogoFavicon from "./assets/favicon.ico";
import useSettings from "./hooks/useSettings";

import "./styles/animations.css";

const queryClient = new QueryClient();

const App = () => {
  const [locale, setLocale] = useState();
  const appColorLocalStorage =
    localStorage.getItem("primaryColorLight") ||
    localStorage.getItem("primaryColorDark") ||
    "#065183";
  const appNameLocalStorage = localStorage.getItem("appName") || "";
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = window.localStorage.getItem("preferredTheme");
  const [mode, setMode] = useState(
    preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light"
  );
  const [primaryColorLight, setPrimaryColorLight] =
    useState(appColorLocalStorage);
  const [primaryColorDark, setPrimaryColorDark] =
    useState(appColorLocalStorage);
  const [appLogoLight, setAppLogoLight] = useState(defaultLogoLight);
  const [appLogoDark, setAppLogoDark] = useState(defaultLogoDark);
  const [appLogoFavicon, setAppLogoFavicon] = useState(defaultLogoFavicon);
  const [appName, setAppName] = useState(appNameLocalStorage);
  const { getPublicSetting } = useSettings();

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          window.localStorage.setItem("preferredTheme", newMode); // Persistindo o tema no localStorage
          return newMode;
        });
      },
      setPrimaryColorLight,
      setPrimaryColorDark,
      setAppLogoLight,
      setAppLogoDark,
      setAppLogoFavicon,
      setAppName,
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      mode,
    }),
    [appLogoLight, appLogoDark, appLogoFavicon, appName, mode]
  );

  const theme = useMemo(
    () =>
      createTheme(
        {
          // Scrollbar styles melhorados mas usando cores do tema
          scrollbarStyles: {
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              boxShadow: "inset 0 0 6px rgba(0, 0, 0, 0.3)",
              backgroundColor:
                mode === "light" ? primaryColorLight : primaryColorDark, // Usa cores do tema
              borderRadius: "4px", // Bordas arredondadas
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: mode === "light" ? "#f5f5f5" : "#2a2a2a",
              borderRadius: "4px",
            },
          },

          scrollbarStylesSoft: {
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: mode === "light" ? "#E0E0E0" : "#404040",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: mode === "light" ? "#BDBDBD" : "#505050",
              }
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
          },

          palette: {
            type: mode,
            primary: {
              main: mode === "light" ? primaryColorLight : primaryColorDark, // Usa cores dinâmicas
              light: mode === "light"
                ? `${primaryColorLight}80`
                : `${primaryColorDark}80`,
              dark: mode === "light"
                ? `${primaryColorLight}CC`
                : `${primaryColorDark}CC`,
              contrastText: "#ffffff",
            },
            textPrimary:
              mode === "light" ? primaryColorLight : primaryColorDark,
            borderPrimary:
              mode === "light" ? primaryColorLight : primaryColorDark,
            dark: { main: mode === "light" ? "#333333" : "#F3F3F3" },
            light: { main: mode === "light" ? "#F3F3F3" : "#333333" },
            fontColor: mode === "light" ? primaryColorLight : primaryColorDark,
            tabHeaderBackground: mode === "light" ? "#EEE" : "#666",
            optionsBackground: mode === "light" ? "#fafafa" : "#333",
            fancyBackground: mode === "light" ? "#fafafa" : "#333",
            total: mode === "light" ? "#fff" : "#222",
            messageIcons: mode === "light" ? "grey" : "#F3F3F3",
            inputBackground: mode === "light" ? "#FFFFFF" : "#333",
            barraSuperior: mode === "light" ? primaryColorLight : "#666", // Usa cor do tema
          },

          typography: {
            fontFamily: [
              'Inter',
              'Roboto',
              '-apple-system',
              'BlinkMacSystemFont',
              '"Segoe UI"',
              '"Helvetica Neue"',
              'Arial',
              'sans-serif',
            ].join(','),
            h1: {
              fontWeight: 700,
              letterSpacing: '-0.025em',
            },
            h2: {
              fontWeight: 700,
              letterSpacing: '-0.025em',
            },
            h3: {
              fontWeight: 600,
              letterSpacing: '-0.025em',
            },
            h4: {
              fontWeight: 600,
              letterSpacing: '-0.025em',
            },
            h5: {
              fontWeight: 600,
              letterSpacing: '-0.025em',
            },
            h6: {
              fontWeight: 600,
              letterSpacing: '-0.025em',
            },
            button: {
              fontWeight: 600,
              textTransform: 'none',
              letterSpacing: '0.025em',
            },
          },

          shape: {
            borderRadius: 8, // Bordas arredondadas mas não excessivas
          },
          overrides: {
            // Botões usando cor do tema
            MuiButton: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: '0.025em',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              },
              contained: {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                }
              }
            },

            MuiContainer: {
              root: {
                paddingLeft: '0 !important',
                paddingRight: '0 !important',
                maxWidth: 'none !important',
                width: '100% !important',
              },
              maxWidthLg: {
                maxWidth: 'none !important',
              },
              maxWidthMd: {
                maxWidth: 'none !important',
              },
              maxWidthSm: {
                maxWidth: 'none !important',
              },
              maxWidthXl: {
                maxWidth: 'none !important',
              },
              maxWidthXs: {
                maxWidth: 'none !important',
              },
            },
          
            // ✅ VOLTAR: Papers com largura total
            MuiPaper: {
              root: {
                backgroundImage: 'none',
                marginLeft: 0,
                marginRight: 0,
                width: '100%',
              },
              rounded: {
                borderRadius: 12,
              },
              elevation1: {
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              },
              elevation2: {
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
              },
              elevation3: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }
            },

            // ⭐ ADICIONAR: Proteção específica para menus
            MuiMenu: {
              paper: {
                width: 'auto !important',
                maxWidth: '300px !important',
                minWidth: '180px !important',
              }
            },

            // ⭐ ADICIONAR: Proteção específica para popovers
            MuiPopover: {
              paper: {
                width: 'auto !important',
                maxWidth: '300px !important',
                minWidth: 'auto !important',
              }
            },

            // Inputs melhorados
            MuiTextField: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === "light" ? "#ccc" : "#555",
                    }
                  },
                  '&.Mui-focused': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: mode === "light" ? primaryColorLight : primaryColorDark,
                      borderWidth: 2,
                    }
                  }
                }
              }
            },

            // Tabs usando cor do tema
            MuiTab: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: '0.025em',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: mode === "light"
                    ? `${primaryColorLight}08`
                    : `${primaryColorDark}08`,
                },
                '&.Mui-selected': {
                  color: mode === "light" ? primaryColorLight : primaryColorDark,
                }
              }
            },

            // Drawer sem bordas
            MuiDrawer: {
              paper: {
                border: 'none',
              }
            },

            // AppBar transparente
            MuiAppBar: {
              root: {
                boxShadow: 'none',
              }
            }
          },

          mode,
          appLogoLight,
          appLogoDark,
          appLogoFavicon,
          appName,
          calculatedLogoDark: () => {
            if (
              appLogoDark === defaultLogoDark &&
              appLogoLight !== defaultLogoLight
            ) {
              return appLogoLight;
            }
            return appLogoDark;
          },
          calculatedLogoLight: () => {
            if (
              appLogoDark !== defaultLogoDark &&
              appLogoLight === defaultLogoLight
            ) {
              return appLogoDark;
            }
            return appLogoLight;
          },
        },
        locale
      ),
    [
      appLogoLight,
      appLogoDark,
      appLogoFavicon,
      appName,
      locale,
      mode,
      primaryColorDark,
      primaryColorLight, // Essas são as cores que vêm do tema dinâmico
    ]
  );

  useEffect(() => {
    window.localStorage.setItem("preferredTheme", mode);
  }, [mode]);

  useEffect(() => {
    getPublicSetting("primaryColorLight")
      .then((color) => {
        setPrimaryColorLight(color || "#0000FF");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("primaryColorDark")
      .then((color) => {
        setPrimaryColorDark(color || "#39ACE7");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoLight")
      .then((file) => {
        setAppLogoLight(
          file ? getBackendUrl() + "/public/" + file : defaultLogoLight
        );
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoDark")
      .then((file) => {
        setAppLogoDark(
          file ? getBackendUrl() + "/public/" + file : defaultLogoDark
        );
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appLogoFavicon")
      .then((file) => {
        setAppLogoFavicon(
          file ? getBackendUrl() + "/public/" + file : defaultLogoFavicon
        );
      })
      .catch((error) => {
        console.log("Error reading setting", error);
      });
    getPublicSetting("appName")
      .then((name) => {
        setAppName(name || "Multi100");
      })
      .catch((error) => {
        console.log("Error reading setting", error);
        setAppName("Multi100");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--primaryColor",
      mode === "light" ? primaryColorLight : primaryColorDark
    );
  }, [primaryColorLight, primaryColorDark, mode]);

  useEffect(() => {
    async function fetchVersionData() {
      try {
        const response = await api.get("/version");
        const { data } = response;
        window.localStorage.setItem("frontendVersion", data.version);
      } catch (error) {
        console.log("Error fetching data", error);
      }
    }
    fetchVersionData();
  }, []);

  return (
    <>
      <Favicon
        url={
          appLogoFavicon
            ? appLogoFavicon
            : defaultLogoFavicon
        }
      />
      <ColorModeContext.Provider value={{ colorMode }}>
        <ThemeProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <ActiveMenuProvider>
              <Routes />
            </ActiveMenuProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
};

export default App;
