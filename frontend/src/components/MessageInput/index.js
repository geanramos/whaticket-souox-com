import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import { useMediaQuery, useTheme } from "@material-ui/core";
import { isNil } from "lodash";
import {
  Fade
} from "@material-ui/core";
import {
  CircularProgress,
  ClickAwayListener,
  IconButton,
  InputBase,
  makeStyles,
  Paper,
  Hidden,
  Menu,
  MenuItem,
  Tooltip,
  Fab,
  Chip,
  Box,
} from "@material-ui/core";
import { blue, green, pink, grey } from "@material-ui/core/colors";
import {
  AttachFile,
  CheckCircleOutline,
  Clear,
  Comment,
  Create,
  Description,
  HighlightOff,
  Mic,
  Mood,
  MoreVert,
  Send,
  PermMedia,
  Person,
  Reply,
  Duo,
  Timer,
  WhatsApp,
  Info,
  AccountTree
} from "@material-ui/icons";

import {
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatStrikethrough as FormatStrikethroughIcon,
  Code as CodeIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatQuote as FormatQuoteIcon,
  FormatClear as FormatClearIcon,
} from "@material-ui/icons";

import AddIcon from "@material-ui/icons/Add";
import { CameraAlt } from "@material-ui/icons";
import MicRecorder from "mic-recorder-to-mp3";
import clsx from "clsx";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api, { openApi } from "../../services/api";
import RecordingTimer from "./RecordingTimer";

import useQuickMessages from "../../hooks/useQuickMessages";
import { isString, isEmpty } from "lodash";
import ContactSendModal from "../ContactSendModal";
import CameraModal from "../CameraModal";
import axios from "axios";

import useCompanySettings from "../../hooks/useSettings/companySettings";
import { ForwardMessageContext } from "../../context/ForwarMessage/ForwardMessageContext";
import MessageUploadMedias from "../MessageUploadMedias";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";
import ScheduleModal from "../ScheduleModal";
import usePlans from "../../hooks/usePlans";
import TemplateModal from "../TemplateMetaModal";
import TriggerFlowModal from "../TriggerFlowModal";


const Mp3Recorder = new MicRecorder({
  bitRate: 128,
  sampleRate: 44100
});

const isMobileDevice = () => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const useStyles = makeStyles((theme) => ({
  mainWrapper: {
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
    [theme.breakpoints.down("sm")]: {
      position: "fixed",
      bottom: 0,
      width: "100%",
    },
  },
  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "25%",
  },
  dropInfo: {
    background: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    padding: 15,
    left: 0,
    right: 0,
  },
  dropInfoOut: {
    display: "none",
  },
  gridFiles: {
    maxHeight: "100%",
    overflow: "scroll",
  },
  newMessageBox: {
    background: theme.palette.background.default,
    width: "100%",
    display: "flex",
    padding: "7px",
    alignItems: "center",
  },
  messageInputWrapper: {
    padding: 6,
    marginRight: 7,
    background: theme.palette.background.paper,
    display: "flex",
    borderRadius: 20,
    flex: 1,
    position: "relative", // ✅ Essencial para o position absolute funcionar
    zIndex: 1, // ✅ Z-index base
  },

  messageInputWrapperPrivate: {
    padding: 6,
    marginRight: 7,
    background: "#F0E68C",
    display: "flex",
    borderRadius: 20,
    flex: 1,
    position: "relative", // ✅ Essencial para o position absolute funcionar
    zIndex: 1, // ✅ Z-index base
  },

  messageInputWrapperPending: {
    padding: 6,
    marginRight: 7,
    background: "#FFE0B2",
    display: "flex",
    borderRadius: 20,
    flex: 1,
    position: "relative", // ✅ Essencial para o position absolute funcionar
    border: "2px solid #FF9800",
    zIndex: 1, // ✅ Z-index base
  },
  messageInput: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
  },
  messageInputPrivate: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
    color: grey[800],
  },
  messageInputPending: {
    paddingLeft: 10,
    flex: 1,
    border: "none",
    color: "#E65100",
    fontWeight: 500,
  },
  sendMessageIcons: {
    color: grey[700],
  },
  ForwardMessageIcons: {
    color: grey[700],
    transform: "scaleX(-1)",
  },
  uploadInput: {
    display: "none",
  },
  viewMediaInputWrapper: {
    maxHeight: "100%",
    display: "flex",
    padding: "10px 13px",
    position: "relative",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.mode === "light" ? "#ffffff" : "#202c33",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },
  emojiBox: {
    position: "absolute",
    bottom: 63,
    width: 40,
    borderTop: "1px solid #e8e8e8",
  },
  circleLoading: {
    color: green[500],
    opacity: "70%",
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -12,
  },
  audioLoading: {
    color: green[500],
    opacity: "70%",
  },
  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    alignContent: "middle",
  },
  cancelAudioIcon: {
    color: "red",
  },
  sendAudioIcon: {
    color: "green",
  },
  replyginMsgWrapper: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingLeft: 73,
    paddingRight: 7,
    backgroundColor: theme.palette.optionsBackground,
  },
  replyginMsgContainer: {
    flex: 1,
    marginRight: 5,
    overflowY: "hidden",
    backgroundColor: theme.mode === "light" ? "#f0f0f0" : "#1d282f",
    borderRadius: "7.5px",
    display: "flex",
    position: "relative",
  },
  replyginMsgBody: {
    padding: 10,
    height: "auto",
    display: "block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
  },
  replyginContactMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#35cd96",
  },
  replyginSelfMsgSideColor: {
    flex: "none",
    width: "4px",
    backgroundColor: "#6bcbef",
  },
  floatingFormatMenu: {
    position: 'fixed',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[8],
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '4px',
    border: `1px solid ${theme.palette.divider}`,
  },

  formatIconButton: {
    padding: '6px',
    borderRadius: '4px',
    minWidth: '32px',
    height: '32px',
  },
  messageContactName: {
    display: "flex",
    color: "#6bcbef",
    fontWeight: 500,
  },
  messageQuickAnswersWrapper: {
    margin: 0,
    position: "absolute",
    bottom: "50px",
    background: theme.palette.background.default,
    padding: 0,
    border: "none",
    left: 0,
    width: "100%",
    maxHeight: "200px",
    overflowY: "auto",
    overflowX: "hidden",
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.15)", // ✅ Sombra mais forte
    borderRadius: "8px 8px 0 0",
    zIndex: 9999, // ✅ Z-index muito alto para ficar acima de tudo
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.palette.action.disabled,
      borderRadius: "3px",
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
      },
    },
    "& li": {
      listStyle: "none",
      "& a": {
        display: "block",
        padding: "8px",
        textOverflow: "ellipsis",
        overflow: "hidden",
        maxHeight: "auto",
        "&:hover": {
          background: theme.palette.background.paper,
          cursor: "pointer",
        },
      },
    },
  },
  quickAnswerItem: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1.5),
    minHeight: "48px",
    cursor: "pointer", // ✅ Adicionar cursor pointer
    borderRadius: "4px", // ✅ Bordas arredondadas
    margin: "2px 4px", // ✅ Pequena margem
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    transition: "all 0.2s ease-in-out",
  },

  // ✅ NOVO: Estilo para item selecionado via teclado
  quickAnswerItemSelected: {
    backgroundColor: theme.palette.primary.light + "30", // ✅ Cor semi-transparente
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    fontWeight: 500,
  },

  // ✅ NOVO: Indicador de scroll
  quickAnswersScrollIndicator: {
    textAlign: "center",
    padding: theme.spacing(1),
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    fontStyle: "italic",
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  quickAnswerText: {
    flex: 1,
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
  mediaTypeChip: {
    height: 20,
    fontSize: "0.7rem",
  },
  invertedFabMenu: {
    border: "none",
    borderRadius: 50,
    boxShadow: "none",
    padding: theme.spacing(1),
    backgroundColor: "transparent",
    color: "grey",
    "&:hover": {
      backgroundColor: "transparent",
    },
    "&:disabled": {
      backgroundColor: "transparent !important",
    },
  },
  invertedFabMenuMP: {
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    width: theme.spacing(4),
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: blue[800],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuCont: {
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    minHeight: "auto",
    width: theme.spacing(4),
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: blue[500],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuMeet: {
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    minHeight: "auto",
    width: theme.spacing(4),
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: green[500],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuDoc: {
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    width: theme.spacing(4),
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: "#7f66ff",
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  invertedFabMenuCamera: {
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    width: theme.spacing(4),
    height: theme.spacing(4),
    backgroundColor: "transparent",
    color: pink[500],
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  flexContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
  },
  flexItem: {
    flex: 1,
  },
  pendingAlert: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1, 2),
    backgroundColor: "#E3F2FD",
    border: "1px solid #2196F3",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    color: "#1976D2",
    fontSize: "0.875rem",
  },
}));

const MessageInput = ({
  ticketId,
  ticketStatus,
  droppedFiles,
  contactId,
  ticketChannel,
  whatsappId,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const [mediasUpload, setMediasUpload] = useState([]);
  const isMounted = useRef(true);

  const [inputMessage, setInputMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [quickAnswers, setQuickAnswer] = useState([]);
  const [typeBar, setTypeBar] = useState(false);
  const inputRef = useRef();
  const [onDragEnter, setOnDragEnter] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { setReplyingMessage, replyingMessage } =
    useContext(ReplyMessageContext);
  const { setEditingMessage, editingMessage } = useContext(EditMessageContext);
  const { user } = useContext(AuthContext);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const { getPlanCompany } = usePlans();

  const [signMessagePar, setSignMessagePar] = useState(false);
  const { get: getSetting } = useCompanySettings();
  const [signMessage, setSignMessage] = useState(true);
  const [privateMessage, setPrivateMessage] = useState(false);
  const [privateMessageInputVisible, setPrivateMessageInputVisible] =
    useState(false);
  const [senVcardModalOpen, setSenVcardModalOpen] = useState(false);
  const [showModalMedias, setShowModalMedias] = useState(false);
  const [showSchedules, setShowSchedules] = useState(false);
  const [useWhatsappOfficial, setUseWhatsappOfficial] = useState(false);
  const { list: listQuickMessages } = useQuickMessages();

  const isMobile = useMediaQuery("(max-width: 767px)");
  const [placeholderText, setPlaceHolderText] = useState("");

  const [selectedQuickAnswerIndex, setSelectedQuickAnswerIndex] = useState(-1);
  const [isNavigatingQuickAnswers, setIsNavigatingQuickAnswers] = useState(false);

  const [triggerFlowModalOpen, setTriggerFlowModalOpen] = useState(false);
  const [flowProcessing, setFlowProcessing] = useState(false);
  const flowProcessingRef = useRef(false);

  const [formatMenuAnchorPosition, setFormatMenuAnchorPosition] = useState(null);
  const [selectedText, setSelectedText] = useState({ text: '', start: 0, end: 0 });

  const isTicketPending = () => {
    return ticketStatus === "pending";
  };

  useEffect(() => {
    if (isTicketPending()) {
      setPrivateMessage(true);
      setPrivateMessageInputVisible(true);
    }
  }, [ticketStatus]);

  useEffect(() => {
    async function fetchTemplates() {
      const templates = await api.request({
        url: `/quick-messages/list`,
        method: "GET",
        params: {
          isOficial: "true",
          userId: user.id,
          companyId: user.companyId,
          status: "APPROVED",
          // whatsappId,
        },
      });
      setTemplates(templates.data);
    }
    if (useWhatsappOfficial) {
      fetchTemplates();
    }
  }, [useWhatsappOfficial]);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      setShowSchedules(planConfigs.plan.useSchedules);
      setUseWhatsappOfficial(planConfigs.plan.useWhatsappOfficial);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (ticketStatus === "open" || ticketStatus === "group") {
      setPlaceHolderText(i18n.t("messagesInput.placeholderOpen"));
    } else if (ticketStatus === "pending") {
      setPlaceHolderText("Digite sua mensagem interna (ticket aguardando)...");
    } else {
      setPlaceHolderText(i18n.t("messagesInput.placeholderClosed"));
    }

    const maxLength = isMobile ? 20 : Infinity;

    if (isMobile && placeholderText.length > maxLength) {
      setPlaceHolderText(placeholderText.substring(0, maxLength) + "...");
    }
  }, [ticketStatus]);

  const {
    selectedMessages,
    setForwardMessageModalOpen,
    showSelectMessageCheckbox,
  } = useContext(ForwardMessageContext);

  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      const selectedMedias = Array.from(droppedFiles);
      setMediasUpload(selectedMedias);
      setShowModalMedias(true);
    }
  }, [droppedFiles]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    inputRef.current.focus();
    if (editingMessage) {
      setInputMessage(editingMessage.body);
    }
  }, [replyingMessage, editingMessage]);

  useEffect(() => {
    inputRef.current.focus();
    return () => {
      setInputMessage("");
      setShowEmoji(false);
      setMediasUpload([]);
      setReplyingMessage(null);
      if (!isTicketPending()) {
        setPrivateMessage(false);
        setPrivateMessageInputVisible(false);
      }
      setEditingMessage(null);
    };
  }, [ticketId, setReplyingMessage, setEditingMessage]);


  useEffect(() => {
    let isProcessing = false; // ✅ Flag para evitar processamento duplo

    const handleInsertQuickMessage = (event) => {
      // ✅ IMPORTANTE: Evitar processamento duplo
      if (isProcessing) {
        console.log("⚠️ Já processando evento, ignorando...");
        return;
      }

      isProcessing = true;
      console.log("📥 Evento insertQuickMessage recebido:", event.detail);

      const { quickMessage } = event.detail;

      if (!quickMessage) {
        console.error("❌ quickMessage não encontrado no evento");
        isProcessing = false;
        return;
      }

      console.log("🔍 Processando quickMessage:", {
        hasMedia: !!quickMessage.mediaPath,
        mediaType: quickMessage.mediaType,
        message: quickMessage.message,
        ticketId: ticketId
      });

      if (quickMessage.mediaPath) {
        console.log("🎵 Processando resposta rápida com mídia");
        handleQuickAnswersClick({
          value: quickMessage.message || "",
          mediaPath: quickMessage.mediaPath,
          mediaType: quickMessage.mediaType,
          shortcode: quickMessage.shortcode,
          label: `/${quickMessage.shortcode} - ${quickMessage.message}`
        }).finally(() => {
          isProcessing = false; // ✅ Liberar flag após processamento
        });
      } else {
        console.log("📝 Processando resposta rápida de texto");
        const currentText = inputMessage?.trim() || "";
        const newText = currentText
          ? `${currentText}\n\n${quickMessage.message}`
          : quickMessage.message;

        setInputMessage(newText);

        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            const length = newText.length;
            inputRef.current.setSelectionRange(length, length);
          }
          isProcessing = false; // ✅ Liberar flag
        }, 100);
      }
    };

    // ✅ IMPORTANTE: Escutar apenas no window
    window.addEventListener('insertQuickMessage', handleInsertQuickMessage);

    return () => {
      window.removeEventListener('insertQuickMessage', handleInsertQuickMessage);
      isProcessing = false; // ✅ Reset da flag no cleanup
    };
  }, [inputMessage, ticketId, privateMessage]);

  useEffect(() => {
    setTimeout(() => {
      if (isMounted.current) setOnDragEnter(false);
    }, 1000);
  }, [onDragEnter === true]);

  useEffect(() => {
    const fetchSettings = async () => {
      const setting = await getSetting({
        column: "sendSignMessage",
      });

      if (isMounted.current) {
        if (setting.sendSignMessage === "enabled") {
          setSignMessagePar(true);
          const signMessageStorage = JSON.parse(
            localStorage.getItem("persistentSignMessage")
          );
          if (isNil(signMessageStorage)) {
            setSignMessage(true);
          } else {
            setSignMessage(signMessageStorage);
          }
        } else if (setting.sendSignMessage === "dontSend") {
          localStorage.setItem("persistentSignMessage", false);
          setSignMessage(false);
          setSignMessagePar(false);
        } else {
          setSignMessagePar(false);
        }
      }
    };
    fetchSettings();
  }, []);

  // CORREÇÃO DO ERRO charAt - Função mais robusta
  const safeCapitalizeFirstLetter = (string) => {
    if (!string || typeof string !== 'string') return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // FUNÇÕES PARA TRIGGER FLOW MODAL
  const handleTriggerFlowClick = useCallback(() => {
    console.log("🎯 Abrindo modal de fluxo");

    // 🛡️ RESET PREVENTIVO
    setFlowProcessing(false);
    flowProcessingRef.current = false;

    setTriggerFlowModalOpen(true);
  }, []);

  const handleTriggerFlowClose = useCallback(() => {
    console.log("🚪 Fechando modal");

    setFlowProcessing(false);
    flowProcessingRef.current = false;
    setTriggerFlowModalOpen(false);
  }, []);

  const handleFlowProcessing = useCallback((isProcessing) => {
    console.log("🔄 Flow processing:", isProcessing);
    setFlowProcessing(isProcessing);
    flowProcessingRef.current = isProcessing;

    // 🔥 TIMEOUT SIMPLES: 8 segundos e libera SEM PERGUNTAR
    if (isProcessing) {
      setTimeout(() => {
        console.log("⏰ TIMEOUT - Liberando campo FORÇADO");
        setFlowProcessing(false);
        flowProcessingRef.current = false;
      }, 8000);
    }
  }, []);

  const handleFlowTriggered = useCallback((data) => {
    console.log("✅ Fluxo concluído");

    // 🔥 RESET IMEDIATO - SEM TIMEOUT
    setFlowProcessing(false);
    flowProcessingRef.current = false;
  }, []);


  // NAVEGAÇÃO POR TECLADO CORRIGIDA
  const handleKeyDown = useCallback((e) => {
    if (!typeBar || !Array.isArray(typeBar) || typeBar.length === 0) {
      setSelectedQuickAnswerIndex(-1);
      setIsNavigatingQuickAnswers(false);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIsNavigatingQuickAnswers(true);
        setSelectedQuickAnswerIndex(prev => {
          const nextIndex = prev < typeBar.length - 1 ? prev + 1 : 0;

          // SCROLL AUTOMÁTICO CORRIGIDO
          setTimeout(() => {
            const container = document.querySelector('.MuiBox-root ul');
            if (container) {
              const selectedElement = container.children[nextIndex];
              if (selectedElement) {
                selectedElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest'
                });
              }
            }
          }, 0);

          return nextIndex;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setIsNavigatingQuickAnswers(true);
        setSelectedQuickAnswerIndex(prev => {
          const nextIndex = prev > 0 ? prev - 1 : typeBar.length - 1;

          // SCROLL AUTOMÁTICO CORRIGIDO
          setTimeout(() => {
            const container = document.querySelector('.MuiBox-root ul');
            if (container) {
              const selectedElement = container.children[nextIndex];
              if (selectedElement) {
                selectedElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest'
                });
              }
            }
          }, 0);

          return nextIndex;
        });
        break;

      case 'Enter':
        if (isNavigatingQuickAnswers && selectedQuickAnswerIndex >= 0) {
          e.preventDefault();
          const selectedAnswer = typeBar[selectedQuickAnswerIndex];
          handleQuickAnswersClick(selectedAnswer);
          setSelectedQuickAnswerIndex(-1);
          setIsNavigatingQuickAnswers(false);
        }
        break;

      case 'Escape':
        if (isNavigatingQuickAnswers) {
          e.preventDefault();
          setSelectedQuickAnswerIndex(-1);
          setIsNavigatingQuickAnswers(false);
          setTypeBar(false);
        }
        break;

      case 'Tab':
        if (isNavigatingQuickAnswers) {
          e.preventDefault();
          setSelectedQuickAnswerIndex(prev => {
            const nextIndex = prev < typeBar.length - 1 ? prev + 1 : 0;
            return nextIndex;
          });
        }
        break;

      default:
        if (isNavigatingQuickAnswers && e.key.length === 1) {
          setSelectedQuickAnswerIndex(-1);
          setIsNavigatingQuickAnswers(false);
        }
        break;
    }
  }, [typeBar, selectedQuickAnswerIndex, isNavigatingQuickAnswers]);

  useEffect(() => {
    if (!typeBar || !Array.isArray(typeBar) || typeBar.length === 0) {
      setSelectedQuickAnswerIndex(-1);
      setIsNavigatingQuickAnswers(false);
    }
  }, [typeBar]);

  const getQuickAnswerItemStyle = (index) => ({
    backgroundColor: selectedQuickAnswerIndex === index
      ? (theme.mode === 'light' ? '#e3f2fd' : '#1e3a5f')
      : 'transparent',
    borderLeft: selectedQuickAnswerIndex === index
      ? `4px solid ${theme.palette.primary.main}`
      : '4px solid transparent',
  });

  const handleSendLinkVideo = async () => {
    const link = `https://meet.jit.si/${ticketId}`;
    setInputMessage(link);
  };

  const handleSendTemplate = async () => {
    setTemplateModalOpen(true);
  };

  const handleChangeInput = useCallback((e) => {
    setInputMessage(e.target.value);
  }, []);

  const handlePrivateMessage = (e) => {
    if (isTicketPending()) {
      return;
    }
    setPrivateMessage(!privateMessage);
    setPrivateMessageInputVisible(!privateMessageInputVisible);
  };

  const getMediaTypeIcon = (mediaType) => {
    switch (mediaType) {
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'document': return '📎';
      default: return '📎';
    }
  };

  const getMediaTypeColor = (mediaType) => {
    switch (mediaType) {
      case 'audio': return 'secondary';
      case 'image': return 'primary';
      case 'video': return 'default';
      case 'document': return 'default';
      default: return 'default';
    }
  };

  const handleQuickAnswersClick = useCallback(async (value) => {
    // ✅ IMPORTANTE: Evitar múltiplas execuções simultâneas
    if (loading) {
      console.log("⚠️ Já processando, ignorando clique...");
      return;
    }

    console.log("🎯 handleQuickAnswersClick chamado:", value);
    console.log("📋 ticketId atual:", ticketId);

    if (!ticketId) {
      console.error("❌ ticketId não encontrado");
      toastError("Erro: ID do ticket não encontrado");
      return;
    }

    if (value.mediaPath) {
      try {
        setLoading(true);
        console.log("📥 Baixando mídia:", value.mediaPath);

        const response = await api.get(value.mediaPath, {
          responseType: "blob",
        });

        console.log("✅ Mídia baixada com sucesso, tamanho:", response.data.size);

        const messageBody = value.value && value.value.trim() !== "" ? value.value : "";

        await handleUploadQuickMessageMedia(response.data, messageBody, value.mediaType);

        console.log("✅ Mídia enviada com sucesso");

        setInputMessage("");
        setTypeBar(false);
        return;
      } catch (err) {
        console.error("❌ Erro ao processar mídia:", err);
        toastError(err);
      } finally {
        setLoading(false);
      }
    } else {
      // Para mensagens de texto
      setInputMessage(value.value || "");
      setTypeBar(false);
    }
  }, [loading, ticketId, privateMessage]);

  const handleUploadQuickMessageMedia = useCallback(async (blob, message, mediaType = null) => {
    console.log("📤 Iniciando upload de mídia:", {
      blobSize: blob.size,
      message,
      mediaType,
      ticketId
    });

    if (!ticketId) {
      throw new Error("ID do ticket não encontrado");
    }

    // ✅ IMPORTANTE: Verificar se já está enviando
    if (loading) {
      console.log("⚠️ Upload já em andamento, ignorando...");
      return;
    }

    try {
      let extension = 'bin';

      if (blob.type) {
        const mimeType = blob.type.split("/")[1];
        extension = mimeType;

        if (blob.type.includes('webm') || blob.type.includes('audio')) {
          extension = blob.type.includes('webm') ? 'webm' : 'mp3';
        }
      } else if (mediaType) {
        const typeExtensionMap = {
          'audio': 'webm',
          'image': 'jpg',
          'video': 'mp4',
          'document': 'pdf'
        };
        extension = typeExtensionMap[mediaType] || 'bin';
      }

      const formData = new FormData();
      const filename = `${new Date().getTime()}.${extension}`;
      formData.append("medias", blob, filename);
      formData.append("typeArch", "quickMessage");

      const body = message && message.trim() !== ""
        ? ((privateMessage || isTicketPending()) ? `\u200d${message}` : message)
        : ((privateMessage || isTicketPending()) ? `\u200d` : "");

      formData.append("body", body);
      formData.append("fromMe", true);
      formData.append("isPrivate", (privateMessage || isTicketPending()) ? "true" : "false");

      console.log("📤 Enviando para:", `/messages/${ticketId}`);

      if (isMounted.current) {
        const response = await api.post(`/messages/${ticketId}`, formData);
        console.log("✅ Upload realizado com sucesso:", response.status);
      }
    } catch (err) {
      console.error("❌ Erro no upload:", err);
      toastError(err);
      throw err;
    }
  }, [ticketId, privateMessage, loading]);

  const handleAddEmoji = (e) => {
    let emoji = e.native;
    setInputMessage((prevState) => prevState + emoji);
  };

  const [modalCameraOpen, setModalCameraOpen] = useState(false);

  const handleCapture = (imageData) => {
    if (imageData) {
      handleUploadCamera(imageData);
    }
  };

  const handleChangeMedias = (e) => {
    if (!e.target.files) {
      return;
    }
    const selectedMedias = Array.from(e.target.files);
    setMediasUpload(selectedMedias);
    setShowModalMedias(true);
  };

  const handleChangeSign = (e) => {
    getStatusSingMessageLocalstogare();
  };

  const handleOpenModalForward = () => {
    if (selectedMessages.length === 0) {
      setForwardMessageModalOpen(false);
      toastError(i18n.t("messagesList.header.notMessage"));
      return;
    }
    setForwardMessageModalOpen(true);
  };

  const getStatusSingMessageLocalstogare = () => {
    const signMessageStorage = JSON.parse(
      localStorage.getItem("persistentSignMessage")
    );
    if (signMessageStorage !== null) {
      if (signMessageStorage) {
        localStorage.setItem("persistentSignMessage", false);
        setSignMessage(false);
      } else {
        localStorage.setItem("persistentSignMessage", true);
        setSignMessage(true);
      }
    } else {
      localStorage.setItem("persistentSignMessage", false);
      setSignMessage(false);
    }
  };

  const handleInputPaste = (e) => {
    if (e.clipboardData.files[0]) {
      const selectedMedias = Array.from(e.clipboardData.files);
      setMediasUpload(selectedMedias);
      setShowModalMedias(true);
    }
  };

  const handleInputDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) {
      const selectedMedias = Array.from(e.dataTransfer.files);
      setMediasUpload(selectedMedias);
      setShowModalMedias(true);
    }
  };

  const handleUploadMedia = async (mediasUpload) => {
    setLoading(true);

    if (!mediasUpload.length) {
      console.log("Nenhuma mídia selecionada.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("fromMe", true);
    formData.append("isPrivate", (privateMessage || isTicketPending()) ? "true" : "false");
    mediasUpload.forEach((media) => {
      formData.append("body", media.caption);
      formData.append("medias", media.file);
    });

    try {
      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
    }

    setLoading(false);
    setMediasUpload([]);
    setShowModalMedias(false);
    if (!isTicketPending()) {
      setPrivateMessage(false);
      setPrivateMessageInputVisible(false);
    }
  };

  const handleSendContatcMessage = async (vcard) => {
    setSenVcardModalOpen(false);
    setLoading(true);

    if (isNil(vcard)) {
      setLoading(false);
      return;
    }

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: null,
      quotedMsg: replyingMessage,
      isPrivate: (privateMessage || isTicketPending()) ? "true" : "false",
      vCard: vcard,
    };
    try {
      await api.post(`/messages/${ticketId}`, message);
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
    setEditingMessage(null);
    if (!isTicketPending()) {
      setPrivateMessage(false);
      setPrivateMessageInputVisible(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage || inputMessage.trim() === "") return;
    setLoading(true);

    const userName = (privateMessage || isTicketPending())
      ? `${user.name} - Mensagem Interna`
      : user.name;

    const sendMessage = inputMessage.trim();

    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body:
        ((signMessage && !isTicketPending()) || privateMessage || isTicketPending()) && !editingMessage
          ? `*${userName}:*\n${sendMessage}`
          : sendMessage,
      quotedMsg: replyingMessage,
      isPrivate: (privateMessage || isTicketPending()) ? "true" : "false",
    };

    try {
      if (editingMessage !== null) {
        await api.post(`/messages/edit/${editingMessage.id}`, message);
      } else {
        console.log("ENVIOU PARA TIKCET", ticketId);
        await api.post(`/messages/${ticketId}`, message);
      }
    } catch (err) {
      toastError(err);
    }

    setInputMessage("");
    setShowEmoji(false);
    setLoading(false);
    setReplyingMessage(null);
    if (!isTicketPending()) {
      setPrivateMessage(false);
    }
    setEditingMessage(null);
    if (!isTicketPending()) {
      setPrivateMessageInputVisible(false);
    }
    handleMenuItemClick();
  };

  const handleSendMessageTemplate = async (e) => {
    if (e.id === "") return;
    setLoading(true);

    const message = {
      templateId: e.id,
      variables: e.variables,
      bodyToSave: e.bodyToSave,
      mediaUrl: "",
      quotedMsg: replyingMessage,
    };

    try {
      await api.post(`/messages-template/${ticketId}`, message);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
    setTemplateModalOpen(false);
    setInputMessage("");
    setShowEmoji(false);
    setReplyingMessage(null);
    if (!isTicketPending()) {
      setPrivateMessage(false);
    }
    setEditingMessage(null);
    if (!isTicketPending()) {
      setPrivateMessageInputVisible(false);
    }
    handleMenuItemClick();
  };

  const handleStartRecording = async () => {
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await Mp3Recorder.start();
      setRecording(true);
      setLoading(false);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const messages = await listQuickMessages({
        companyId,
        userId: user.id,
        isOficial: ticketChannel === "whatsapp_oficial" ? "true" : "false",
      });
      const options = messages.map((m) => {
        let truncatedMessage = m.message;
        if (isString(truncatedMessage) && truncatedMessage.length > 90) {
          truncatedMessage = m.message.substring(0, 90) + "...";
        }
        return {
          value: m.message,
          label: `/${m.shortcode} - ${truncatedMessage}`,
          mediaPath: m.mediaPath,
          mediaType: m.mediaType,
          shortcode: m.shortcode,
        };
      });
      if (isMounted.current) {
        setQuickAnswer(options);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (
      isString(inputMessage) &&
      !isEmpty(inputMessage) &&
      inputMessage.length >= 1
    ) {
      const firstWord = inputMessage.charAt(0);

      if (firstWord === "/") {
        setTypeBar(firstWord.indexOf("/") > -1);

        const filteredOptions = quickAnswers.filter(
          (m) => m.label.toLowerCase().indexOf(inputMessage.toLowerCase()) > -1
        );
        setTypeBar(filteredOptions);
      } else {
        setTypeBar(false);
      }
    } else {
      setTypeBar(false);
    }
  }, [inputMessage]);

  useEffect(() => {
    console.log("🔍 Modal state:", triggerFlowModalOpen, "Flow processing:", flowProcessing);

    // 🔥 RESET SIMPLES: Se modal fecha, libera campo
    if (!triggerFlowModalOpen && flowProcessing) {
      console.log("🔓 FORÇANDO liberação do campo");
      setFlowProcessing(false);
      flowProcessingRef.current = false;
    }
  }, [triggerFlowModalOpen, flowProcessing]);

  const disableOption = useCallback(() => {
    const isFlowProcessing = flowProcessingRef.current || flowProcessing;

    return (
      loading ||
      recording ||
      isFlowProcessing || // 🛡️ Usar tanto ref quanto estado
      (!isTicketPending() && ticketStatus !== "open" && ticketStatus !== "group")
    );
  }, [loading, recording, flowProcessing, ticketStatus]);

  const disableOptionForPending = useCallback(() => {
    const isFlowProcessing = flowProcessingRef.current || flowProcessing;

    return (
      loading ||
      recording ||
      isFlowProcessing || // 🛡️ Usar tanto ref quanto estado
      ticketStatus === "closed"
    );
  }, [loading, recording, flowProcessing, ticketStatus]);

  const handleUploadCamera = async (blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      const filename = `${new Date().getTime()}.png`;
      formData.append("medias", blob, filename);
      formData.append("body", (privateMessage || isTicketPending()) ? `\u200d` : "");
      formData.append("fromMe", true);

      await api.post(`/messages/${ticketId}`, formData);
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
    setLoading(false);
  };

  // ✅ CORREÇÃO KISS: Apenas otimizar nome do arquivo para mobile
  const handleUploadAudio = async () => {
    setLoading(true);
    try {
      const [, blob] = await Mp3Recorder.stop().getMp3();
      if (blob.size < 10000) {
        setLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();

      // ✅ CORREÇÃO: Nome do arquivo otimizado para mobile
      let filename;
      if (["whatsapp", "whatsapp_oficial"].includes(ticketChannel)) {
        // Para WhatsApp, usar formato mais compatível com mobile
        filename = isMobileDevice()
          ? `audio_${new Date().getTime()}.ogg`  // OGG para mobile
          : `audio_${new Date().getTime()}.mp3`; // MP3 para desktop
      } else {
        filename = `${new Date().getTime()}.m4a`;
      }

      formData.append("medias", blob, filename);
      formData.append("body", "🎵 Mensagem de voz"); // ✅ Body mais claro
      formData.append("fromMe", true);
      formData.append("isPrivate", (privateMessage || isTicketPending()) ? "true" : "false");

      console.log(`📤 Enviando áudio: ${filename} (${blob.size} bytes)`);

      if (isMounted.current) {
        await api.post(`/messages/${ticketId}`, formData);
      }
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRecording(false);
      }
    }
  };

  const handleCloseModalMedias = () => {
    setShowModalMedias(false);
  };

  const handleCancelAudio = async () => {
    try {
      await Mp3Recorder.stop().getMp3();
      setRecording(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event) => {
    setAnchorEl(null);
  };

  const handleSendContactModalOpen = async () => {
    handleMenuItemClick();
    setSenVcardModalOpen(true);
  };

  const handleCameraModalOpen = async () => {
    handleMenuItemClick();
    setModalCameraOpen(true);
  };

  const handleCancelSelection = () => {
    setMediasUpload([]);
    setShowModalMedias(false);
  };

  const checkForSelectedText = useCallback(() => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;

      if (start !== end && start !== null && end !== null) {
        const selectedText = inputMessage.substring(start, end);
        if (selectedText.trim() !== '') {
          // Para InputBase, calcular posição baseada no elemento
          const inputRect = inputRef.current.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

          setSelectedText({
            text: selectedText,
            start: start,
            end: end
          });

          setFormatMenuAnchorPosition({
            x: inputRect.left + inputRect.width / 2,
            y: inputRect.top + scrollTop - 10 // Posicionar acima do input
          });

          return true;
        }
      }
    }

    setFormatMenuAnchorPosition(null);
    return false;
  }, [inputMessage]);

  const handleCloseFormatMenu = useCallback(() => {
    setFormatMenuAnchorPosition(null);
  }, []);

  // Aplica a formatação ao texto selecionado
  const handleFormatText = useCallback((formatType) => {
    const { text, start, end } = selectedText;
    let formattedText = '';

    switch (formatType) {
      case 'bold':
        formattedText = `*${text}*`;
        break;
      case 'italic':
        formattedText = `_${text}_`;
        break;
      case 'strikethrough':
        formattedText = `~${text}~`;
        break;
      case 'code':
        formattedText = `\`${text}\``;
        break;
      case 'numberedList':
        formattedText = text.split('\n')
          .map((line, index) => `${index + 1}. ${line}`)
          .join('\n');
        break;
      case 'bulletList':
        formattedText = text.split('\n')
          .map(line => `• ${line}`)
          .join('\n');
        break;
      case 'quote':
        formattedText = text.split('\n')
          .map(line => `> ${line}`)
          .join('\n');
        break;
      case 'clear':
        formattedText = text
          .replace(/\*([^*]+)\*/g, '$1')  // remove negrito
          .replace(/_([^_]+)_/g, '$1')    // remove itálico
          .replace(/~([^~]+)~/g, '$1')    // remove tachado
          .replace(/`([^`]+)`/g, '$1')    // remove código
          .replace(/^\d+\.\s/gm, '')      // remove numeração de lista
          .replace(/^•\s/gm, '')          // remove marcadores de lista
          .replace(/^>\s/gm, '');         // remove citação
        break;
      default:
        formattedText = text;
    }

    // Substitui o texto selecionado pelo texto formatado
    const newInputMessage =
      inputMessage.substring(0, start) +
      formattedText +
      inputMessage.substring(end);

    setInputMessage(newInputMessage);

    // Fecha o menu após a formatação
    handleCloseFormatMenu();

    // Define o foco e a posição do cursor após a operação
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPosition = start + formattedText.length;
        inputRef.current.selectionStart = newCursorPosition;
        inputRef.current.selectionEnd = newCursorPosition;
      }
    }, 100);
  }, [selectedText, inputMessage, handleCloseFormatMenu]);

  // Handlers para detectar seleção de texto
  const handleSelectText = useCallback(() => {
    checkForSelectedText();
  }, [checkForSelectedText]);

  const handleMouseUp = useCallback(() => {
    checkForSelectedText();
  }, [checkForSelectedText]);

  const handleKeyUp = useCallback((e) => {
    // Teclas que podem alterar a seleção
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Shift') {
      checkForSelectedText();
    }
  }, [checkForSelectedText]);

  const renderReplyingMessage = (message) => {
    return (
      <div className={classes.replyginMsgWrapper}>
        <div className={classes.replyginMsgContainer}>
          <span
            className={clsx(classes.replyginContactMsgSideColor, {
              [classes.replyginSelfMsgSideColor]: !message.fromMe,
            })}
          ></span>
          {replyingMessage && (
            <div className={classes.replyginMsgBody}>
              {!message.fromMe && (
                <span className={classes.messageContactName}>
                  {message.contact?.name}
                </span>
              )}
              {message.body}
            </div>
          )}
        </div>
        <IconButton
          aria-label="showRecorder"
          component="span"
          disabled={disableOptionForPending()}
          onClick={() => {
            setReplyingMessage(null);
            setEditingMessage(null);
            setInputMessage("");
          }}
        >
          <Clear className={classes.sendMessageIcons} />
        </IconButton>
      </div>
    );
  };

  const renderFlowProcessingAlert = () => {
    if (!flowProcessing) return null;

    return (
      <Box className={classes.pendingAlert} style={{ backgroundColor: "#E8F5E8", borderColor: "#4CAF50" }}>
        <CircularProgress size={16} style={{ marginRight: 8 }} />
        <span>
          <strong>Fluxo em Execução:</strong> Campo de mensagem temporariamente desabilitado.
        </span>
      </Box>
    );
  };

  const TextFormatMenu = () => {
    const isMenuOpen = Boolean(formatMenuAnchorPosition);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (!isMenuOpen) return null;

    return (
      <ClickAwayListener onClickAway={handleCloseFormatMenu}>
        <Fade in={isMenuOpen}>
          <div
            className={classes.floatingFormatMenu}
            style={{
              top: formatMenuAnchorPosition ? formatMenuAnchorPosition.y - 50 : 0,
              left: formatMenuAnchorPosition ? formatMenuAnchorPosition.x : 0,
            }}
          >
            <Tooltip title="Negrito">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('bold')}
                size="small"
              >
                <FormatBoldIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Itálico">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('italic')}
                size="small"
              >
                <FormatItalicIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Tachado">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('strikethrough')}
                size="small"
              >
                <FormatStrikethroughIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Código">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('code')}
                size="small"
              >
                <CodeIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Lista Numerada">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('numberedList')}
                size="small"
              >
                <FormatListNumberedIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Lista com Marcadores">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('bulletList')}
                size="small"
              >
                <FormatListBulletedIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Citação">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('quote')}
                size="small"
              >
                <FormatQuoteIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Limpar Formatação">
              <IconButton
                className={classes.formatIconButton}
                disabled={disableOptionForPending()}
                onClick={() => handleFormatText('clear')}
                size="small"
              >
                <FormatClearIcon fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>
          </div>
        </Fade>
      </ClickAwayListener>
    );
  };

  const renderPendingAlert = () => {
    if (!isTicketPending()) return null;

    return (
      <Box className={classes.pendingAlert}>
        <Info style={{ fontSize: 20 }} />
        <span>
          <strong>Ticket Aguardando:</strong> Apenas mensagens internas são permitidas neste momento.
        </span>
      </Box>
    );
  };

  if (mediasUpload.length > 0) {
    return (
      <Paper
        elevation={0}
        square
        className={classes.viewMediaInputWrapper}
        onDragEnter={() => setOnDragEnter(true)}
        onDrop={(e) => handleInputDrop(e)}
      >
        {showModalMedias && (
          <MessageUploadMedias
            isOpen={showModalMedias}
            files={mediasUpload}
            onClose={handleCloseModalMedias}
            onSend={handleUploadMedia}
            onCancelSelection={handleCancelSelection}
          />
        )}
      </Paper>
    );
  } else {
    return (
      <>
        {templateModalOpen && (
          <TemplateModal
            open={templateModalOpen}
            handleClose={() => setTemplateModalOpen(false)}
            onSelectTemplate={(e) => handleSendMessageTemplate(e)}
            templates={templates}
          />
        )}
        {modalCameraOpen && (
          <CameraModal
            isOpen={modalCameraOpen}
            onRequestClose={() => setModalCameraOpen(false)}
            onCapture={handleCapture}
          />
        )}
        {senVcardModalOpen && (
          <ContactSendModal
            modalOpen={senVcardModalOpen}
            onClose={(c) => {
              handleSendContatcMessage(c);
            }}
          />
        )}

        {/* NOVO MODAL DE TRIGGER FLOW */}
        {triggerFlowModalOpen && (
          <TriggerFlowModal
            open={triggerFlowModalOpen}
            onClose={handleTriggerFlowClose}
            ticketId={ticketId}
            ticketStatus={ticketStatus}
            onFlowTriggered={handleFlowTriggered}
            onFlowProcessing={handleFlowProcessing}
          />
        )}

        <Paper
          square
          elevation={0}
          className={classes.mainWrapper}
          onDragEnter={() => setOnDragEnter(true)}
          onDrop={(e) => handleInputDrop(e)}
        >
          {renderPendingAlert()}
          {renderFlowProcessingAlert()}

          {(replyingMessage && renderReplyingMessage(replyingMessage)) ||
            (editingMessage && renderReplyingMessage(editingMessage))}
          <div className={classes.newMessageBox}>
            {!isTicketPending() && (
              <Hidden only={["sm", "xs"]}>
                <IconButton
                  aria-label="emojiPicker"
                  component="span"
                  disabled={disableOption()}
                  onClick={(e) => setShowEmoji((prevState) => !prevState)}
                >
                  <Mood className={classes.sendMessageIcons} />
                </IconButton>
                {showEmoji ? (
                  <div className={classes.emojiBox}>
                    <ClickAwayListener onClickAway={(e) => setShowEmoji(true)}>
                      <Picker
                        perLine={16}
                        theme={"dark"}
                        i18n={i18n}
                        showPreview={true}
                        showSkinTones={false}
                        onSelect={handleAddEmoji}
                      />
                    </ClickAwayListener>
                  </div>
                ) : null}

                <Fab
                  disabled={disableOption()}
                  aria-label="uploadMedias"
                  component="span"
                  className={classes.invertedFabMenu}
                  onClick={handleOpenMenuClick}
                >
                  <AddIcon />
                </Fab>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuItemClick}
                  id="simple-menu"
                >
                  <MenuItem onClick={handleMenuItemClick}>
                    <input
                      multiple
                      type="file"
                      id="upload-img-button"
                      accept="image/*, video/*, audio/* "
                      className={classes.uploadInput}
                      onChange={handleChangeMedias}
                    />
                    <label htmlFor="upload-img-button">
                      <Fab
                        aria-label="upload-img"
                        component="span"
                        className={classes.invertedFabMenuMP}
                      >
                        <PermMedia />
                      </Fab>
                      {i18n.t("messageInput.type.imageVideo")}
                    </label>
                  </MenuItem>
                  <MenuItem onClick={handleCameraModalOpen}>
                    <Fab className={classes.invertedFabMenuCamera}>
                      <CameraAlt />
                    </Fab>
                    {i18n.t("messageInput.type.cam")}
                  </MenuItem>
                  <MenuItem onClick={handleMenuItemClick}>
                    <input
                      multiple
                      type="file"
                      id="upload-doc-button"
                      accept="application/*, text/*, .odt, .ods, .odp, .odg, .xml, .ofx, .zip, .rar, .7z, .tar, .gz, .bz2, .msg, .key, .numbers, .pages"
                      className={classes.uploadInput}
                      onChange={handleChangeMedias}
                    />
                    <label htmlFor="upload-doc-button">
                      <Fab
                        aria-label="upload-img"
                        component="span"
                        className={classes.invertedFabMenuDoc}
                      >
                        <Description />
                      </Fab>
                      Documento
                    </label>
                  </MenuItem>
                  <MenuItem onClick={handleSendContactModalOpen}>
                    <Fab className={classes.invertedFabMenuCont}>
                      <Person />
                    </Fab>
                    {i18n.t("messageInput.type.contact")}
                  </MenuItem>
                  <MenuItem onClick={handleSendLinkVideo}>
                    <Fab className={classes.invertedFabMenuMeet}>
                      <Duo />
                    </Fab>
                    {i18n.t("messageInput.type.meet")}
                  </MenuItem>
                  {useWhatsappOfficial &&
                    ticketChannel === "whatsapp_oficial" && (
                      <MenuItem onClick={handleSendTemplate}>
                        <Fab className={classes.invertedFabMenuMeet}>
                          <WhatsApp />
                        </Fab>
                        {i18n.t("messageInput.type.template")}
                      </MenuItem>
                    )}
                </Menu>

                {signMessagePar && (
                  <Tooltip title={i18n.t("messageInput.tooltip.signature")}>
                    <IconButton
                      aria-label="send-upload"
                      component="span"
                      onClick={handleChangeSign}
                    >
                      {signMessage === true ? (
                        <Create
                          style={{
                            color:
                              theme.mode === "light"
                                ? theme.palette.primary.main
                                : "#EEE",
                          }}
                        />
                      ) : (
                        <Create style={{ color: "grey" }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}

                {/* NOVO ÍCONE DE TRIGGER FLOW - APENAS EM TICKETS OPEN */}
                {ticketStatus === "open" && (
                  <Tooltip title="Disparar Fluxo">
                    <IconButton
                      aria-label="trigger-flow"
                      component="span"
                      onClick={handleTriggerFlowClick}
                      disabled={disableOption()}
                    >
                      <AccountTree
                        style={{
                          color: theme.mode === "light"
                            ? theme.palette.secondary.main
                            : "#EEE"
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                )}

                {!isTicketPending() && (
                  <Tooltip title={i18n.t("messageInput.tooltip.privateMessage")}>
                    <IconButton
                      aria-label="send-upload"
                      component="span"
                      onClick={handlePrivateMessage}
                    >
                      {privateMessage === true ? (
                        <Comment
                          style={{
                            color:
                              theme.mode === "light"
                                ? theme.palette.primary.main
                                : "#EEE",
                          }}
                        />
                      ) : (
                        <Comment style={{ color: "grey" }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
              </Hidden>
            )}

            {isTicketPending() && (
              <Hidden only={["md", "lg", "xl"]}>
                <IconButton
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={handleOpenMenuClick}
                >
                  <MoreVert></MoreVert>
                </IconButton>
                <Menu
                  id="simple-menu"
                  keepMounted
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuItemClick}
                >
                  <MenuItem onClick={handleMenuItemClick}>
                    <IconButton
                      aria-label="emojiPicker"
                      component="span"
                      disabled={disableOptionForPending()}
                      onClick={(e) => setShowEmoji((prevState) => !prevState)}
                    >
                      <Mood className={classes.sendMessageIcons} />
                    </IconButton>
                    Emoji
                  </MenuItem>
                </Menu>
              </Hidden>
            )}

            {!isTicketPending() && (
              <Hidden only={["md", "lg", "xl"]}>
                <IconButton
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={handleOpenMenuClick}
                >
                  <MoreVert></MoreVert>
                </IconButton>
                <Menu
                  id="simple-menu"
                  keepMounted
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuItemClick}
                >
                  <MenuItem onClick={handleMenuItemClick}>
                    <IconButton
                      aria-label="emojiPicker"
                      component="span"
                      disabled={disableOption()}
                      onClick={(e) => setShowEmoji((prevState) => !prevState)}
                    >
                      <Mood className={classes.sendMessageIcons} />
                    </IconButton>
                  </MenuItem>
                  <MenuItem onClick={handleMenuItemClick}>
                    <input
                      multiple
                      type="file"
                      id="upload-button"
                      disabled={disableOption()}
                      className={classes.uploadInput}
                      onChange={handleChangeMedias}
                    />
                    <label htmlFor="upload-button">
                      <IconButton
                        aria-label="upload"
                        component="span"
                        disabled={disableOption()}
                      >
                        <AttachFile className={classes.sendMessageIcons} />
                      </IconButton>
                    </label>
                  </MenuItem>
                  {signMessagePar && (
                    <Tooltip title="Habilitar/Desabilitar Assinatura">
                      <IconButton
                        aria-label="send-upload"
                        component="span"
                        onClick={handleChangeSign}
                      >
                        {signMessage === true ? (
                          <Create
                            style={{
                              color:
                                theme.mode === "light"
                                  ? theme.palette.primary.main
                                  : "#EEE",
                            }}
                          />
                        ) : (
                          <Create style={{ color: "grey" }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* NOVO ITEM DE MENU MOBILE PARA TRIGGER FLOW */}
                  {ticketStatus === "open" && (
                    <MenuItem onClick={() => {
                      handleMenuItemClick();
                      handleTriggerFlowClick();
                    }}>
                      <IconButton
                        aria-label="trigger-flow"
                        component="span"
                      >
                        <AccountTree
                          style={{
                            color: theme.mode === "light"
                              ? theme.palette.secondary.main
                              : "#EEE"
                          }}
                        />
                      </IconButton>
                      Disparar Fluxo
                    </MenuItem>
                  )}

                  <Tooltip title="Habilitar/Desabilitar Comentários">
                    <IconButton
                      aria-label="send-upload"
                      component="span"
                      onClick={handlePrivateMessage}
                    >
                      {privateMessage === true ? (
                        <Comment
                          style={{
                            color:
                              theme.mode === "light"
                                ? theme.palette.primary.main
                                : "#EEE",
                          }}
                        />
                      ) : (
                        <Comment style={{ color: "grey" }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Menu>
              </Hidden>
            )}

            <div className={classes.flexContainer}>
              {(privateMessageInputVisible || isTicketPending()) && (
                <div className={classes.flexItem}>
                  <div className={isTicketPending() ? classes.messageInputWrapperPending : classes.messageInputWrapperPrivate}>
                    <InputBase
                      inputRef={(input) => {
                        input && input.focus();
                        input && (inputRef.current = input);
                      }}
                      className={isTicketPending() ? classes.messageInputPending : classes.messageInputPrivate}
                      placeholder={
                        isTicketPending()
                          ? "Mensagem interna (ticket aguardando aceite)..."
                          : ticketStatus === "open" || ticketStatus === "group"
                            ? i18n.t("messagesInput.placeholderPrivateMessage")
                            : i18n.t("messagesInput.placeholderClosed")
                      }
                      multiline
                      maxRows={5}
                      value={safeCapitalizeFirstLetter(inputMessage)}
                      onChange={handleChangeInput}
                      disabled={disableOptionForPending()}
                      onPaste={(e) => {
                        (ticketStatus === "open" || ticketStatus === "group" || isTicketPending()) &&
                          handleInputPaste(e);
                      }}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      onMouseUp={handleMouseUp}
                      onSelect={handleSelectText}
                      onKeyPress={(e) => {
                        if (loading || e.shiftKey) return;
                        else if (e.key === "Enter" && !isNavigatingQuickAnswers) {
                          handleSendMessage();
                        }
                      }}
                      spellCheck={true}
                    />
                    {typeBar ? (
                      <Box
                        component="ul"
                        className={classes.messageQuickAnswersWrapper}
                        style={{
                          zIndex: 10000, // ✅ Z-index inline para garantia máxima
                          position: "absolute",
                          bottom: "100%", // ✅ Posicionar acima do input
                          marginBottom: "8px" // ✅ Pequeno espaço entre input e lista
                        }}
                      >
                        {typeBar.map((value, index) => {
                          const isSelected = selectedQuickAnswerIndex === index;
                          return (
                            <li
                              className={classes.messageQuickAnswersWrapperItem}
                              key={index}
                              style={{ listStyle: "none" }}
                            >
                              <div
                                className={clsx(
                                  classes.quickAnswerItem,
                                  isSelected && classes.quickAnswerItemSelected
                                )}
                                style={{
                                  ...getQuickAnswerItemStyle(index),
                                  // ✅ Estilo adicional para item selecionado
                                  ...(isSelected && {
                                    backgroundColor: theme.palette.primary.light + "20",
                                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                                    transform: "translateX(2px)" // ✅ Leve deslocamento visual
                                  })
                                }}
                                onClick={() => handleQuickAnswersClick(value)}
                              >
                                <Box className={classes.quickAnswerText}>
                                  {value.label}
                                </Box>
                                {value.mediaType && (
                                  <Chip
                                    size="small"
                                    label={`${getMediaTypeIcon(value.mediaType)} ${value.mediaType}`}
                                    color={getMediaTypeColor(value.mediaType)}
                                    className={classes.mediaTypeChip}
                                  />
                                )}
                              </div>
                            </li>
                          );
                        })}

                        {/* ✅ Indicador de scroll apenas se necessário */}
                        {typeBar.length > 4 && (
                          <li style={{ listStyle: "none" }}>
                            <div className={classes.quickAnswersScrollIndicator}>
                              📋 {typeBar.length} respostas • use ↑↓ para navegar
                            </div>
                          </li>
                        )}
                      </Box>
                    ) : null}
                  </div>
                </div>
              )}
              {!privateMessageInputVisible && !isTicketPending() && (
                <div className={classes.flexItem}>
                  <div className={classes.messageInputWrapper}>
                    <InputBase
                      inputRef={(input) => {
                        input && input.focus();
                        input && (inputRef.current = input);
                      }}
                      className={classes.messageInput}
                      placeholder={placeholderText}
                      multiline
                      maxRows={5}
                      value={safeCapitalizeFirstLetter(inputMessage)}
                      onChange={handleChangeInput}
                      disabled={disableOption()}
                      onPaste={(e) => {
                        (ticketStatus === "open" || ticketStatus === "group") &&
                          handleInputPaste(e);
                      }}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      onMouseUp={handleMouseUp}
                      onSelect={handleSelectText}
                      onKeyPress={(e) => {
                        if (loading || e.shiftKey) return;
                        else if (e.key === "Enter" && !isNavigatingQuickAnswers) {
                          handleSendMessage();
                        }
                      }}
                      spellCheck={true}
                    />
                    {typeBar ? (
                      <ul className={classes.messageQuickAnswersWrapper}>
                        {typeBar.map((value, index) => {
                          const isSelected = selectedQuickAnswerIndex === index;
                          return (
                            <li
                              className={classes.messageQuickAnswersWrapperItem}
                              key={index}
                            >
                              <div
                                className={`${classes.quickAnswerItem} ${isSelected ? 'selected' : ''}`}
                                style={getQuickAnswerItemStyle(index)}
                                onClick={() => handleQuickAnswersClick(value)}
                              >
                                <Box className={classes.quickAnswerText}>
                                  {value.label}
                                </Box>
                                {value.mediaType && (
                                  <Chip
                                    size="small"
                                    label={`${getMediaTypeIcon(value.mediaType)} ${value.mediaType}`}
                                    color={getMediaTypeColor(value.mediaType)}
                                    className={classes.mediaTypeChip}
                                  />
                                )}
                              </div>
                            </li>
                          );
                        })}

                        {typeBar.length > 5 && (
                          <div className={classes.quickAnswersScrollIndicator}>
                            {typeBar.length} respostas • role para ver mais
                          </div>
                        )}
                      </ul>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {(!privateMessageInputVisible || isTicketPending()) && (
              <>
                {showSchedules && !isTicketPending() && (
                  <Tooltip title={i18n.t("tickets.buttons.scredule")}>
                    <IconButton
                      aria-label="scheduleMessage"
                      component="span"
                      onClick={() => setAppointmentModalOpen(true)}
                      disabled={loading}
                    >
                      <Timer className={classes.sendMessageIcons} />
                    </IconButton>
                  </Tooltip>
                )}
                {inputMessage || showSelectMessageCheckbox ? (
                  <>
                    <IconButton
                      aria-label="sendMessage"
                      component="span"
                      onClick={
                        showSelectMessageCheckbox
                          ? handleOpenModalForward
                          : handleSendMessage
                      }
                      disabled={loading}
                    >
                      {showSelectMessageCheckbox ? (
                        <Reply className={classes.ForwardMessageIcons} />
                      ) : (
                        <Send className={classes.sendMessageIcons} />
                      )}
                    </IconButton>
                  </>
                ) : recording ? (
                  <div className={classes.recorderWrapper}>
                    <IconButton
                      aria-label="cancelRecording"
                      component="span"
                      fontSize="large"
                      disabled={loading}
                      onClick={handleCancelAudio}
                    >
                      <HighlightOff className={classes.cancelAudioIcon} />
                    </IconButton>
                    {loading ? (
                      <div>
                        <CircularProgress className={classes.audioLoading} />
                      </div>
                    ) : (
                      <RecordingTimer />
                    )}

                    <IconButton
                      aria-label="sendRecordedAudio"
                      component="span"
                      onClick={handleUploadAudio}
                      disabled={loading}
                    >
                      <CheckCircleOutline className={classes.sendAudioIcon} />
                    </IconButton>
                  </div>
                ) : (
                  <IconButton
                    aria-label="showRecorder"
                    component="span"
                    disabled={disableOptionForPending()}
                    onClick={handleStartRecording}
                  >
                    <Mic className={classes.sendMessageIcons} />
                  </IconButton>
                )}
              </>
            )}

            {privateMessageInputVisible && !isTicketPending() && (
              <>
                <IconButton
                  aria-label="sendMessage"
                  component="span"
                  onClick={
                    showSelectMessageCheckbox
                      ? handleOpenModalForward
                      : handleSendMessage
                  }
                  disabled={loading}
                >
                  {showSelectMessageCheckbox ? (
                    <Reply className={classes.ForwardMessageIcons} />
                  ) : (
                    <Send className={classes.sendMessageIcons} />
                  )}
                </IconButton>
              </>
            )}

            {appointmentModalOpen && (
              <ScheduleModal
                open={appointmentModalOpen}
                onClose={() => setAppointmentModalOpen(false)}
                message={inputMessage}
                contactId={contactId}
                fromMessageInput={true}
                user={user}
              />
            )}

            {/* Menu de formatação que aparece quando texto é selecionado */}
            <TextFormatMenu />

          </div>
        </Paper>
      </>
    );
  }
};

export default MessageInput;