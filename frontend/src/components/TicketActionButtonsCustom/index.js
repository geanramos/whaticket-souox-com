import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import { useHistory } from "react-router-dom";

import { Can } from "../Can";
import { makeStyles } from "@material-ui/core/styles";
import { IconButton, Menu, CircularProgress } from "@material-ui/core";
import {
  DeviceHubOutlined,
  History,
  MoreVert,
  PictureAsPdf,
  Replay,
  SwapHorizOutlined,
  AccountBalanceWallet,
  FileCopy as FileCopyIcon,
  FlashOn,
} from "@material-ui/icons";
import { v4 as uuidv4 } from "uuid";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
// import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import usePlans from "../../hooks/usePlans";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import Tooltip from "@material-ui/core/Tooltip";
import ConfirmationModal from "../ConfirmationModal";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";

import Button from "@material-ui/core/Button";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";

//icones
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import UndoIcon from "@material-ui/icons/Undo";

import ScheduleModal from "../ScheduleModal";
import MenuItem from "@material-ui/core/MenuItem";
import { Switch } from "@material-ui/core";
import ShowTicketOpen from "../ShowTicketOpenModal";
import { toast } from "react-toastify";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import ShowTicketLogModal from "../../components/ShowTicketLogModal";
import TicketMessagesDialog from "../TicketMessagesDialog";
import { useTheme } from "@material-ui/styles";
import html2pdf from "html2pdf.js";
import FinalizacaoVendaModal from "../FinalizacaoVendaModal";
import QuickMessageModal from "../QuickMessageModal";

const useStyles = makeStyles((theme) => ({
  actionButtons: {
    marginRight: 6,
    maxWidth: "100%",
    flex: "none",
    alignSelf: "center",
    marginLeft: "auto",
    // flexBasis: "50%",
    display: "flex",
    "& > *": {
      margin: theme.spacing(1),
    },
  },
  bottomButtonVisibilityIcon: {
    padding: 1,
    color: theme.mode === "light" ? theme.palette.primary.main : "#FFF",
  },
  botoes: {
    display: "flex",
    padding: "15px",
    justifyContent: "flex-end",
    maxWidth: "100%",
    // alignItems: "center"
  },
}));

const SessionSchema = Yup.object().shape({
  ratingId: Yup.string().required("Avaliação obrigatória"),
});

const TicketActionButtonsCustom = ({
  ticket,
  contact,
  onQuickMessageSelect,
  // , showSelectMessageCheckbox,
  // selectedMessages,
  // forwardMessageModalOpen,
  // setForwardMessageModalOpen
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const isMounted = useRef(true);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const { setCurrentTicket, setTabOpen } = useContext(TicketsContext);
  const [open, setOpen] = React.useState(false);
  const formRef = React.useRef(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(null);
  const [
    acceptTicketWithouSelectQueueOpen,
    setAcceptTicketWithouSelectQueueOpen,
  ] = useState(false);
  const [showTicketLogOpen, setShowTicketLogOpen] = useState(false);
  const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
  const [disableBot, setDisableBot] = useState(ticket.contact.disableBot);

  const [showSchedules, setShowSchedules] = useState(false);
  const [enableIntegration, setEnableIntegration] = useState(
    ticket.useIntegration
  );

  const [openAlert, setOpenAlert] = useState(false);
  const [userTicketOpen, setUserTicketOpen] = useState("");
  const [queueTicketOpen, setQueueTicketOpen] = useState("");
  const [logTicket, setLogTicket] = useState([]);

  const { get: getSetting } = useCompanySettings();
  const { getPlanCompany } = usePlans();

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [showTestButton, setShowTestButton] = useState(false);
  const [exportedToPDF, setExportedToPDF] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);

  const [openFinalizacaoVenda, setOpenFinalizacaoVenda] = useState(false);
  const [ticketDataToFinalize, setTicketDataToFinalize] = useState(null);
  const [showFinalizacaoOptions, setShowFinalizacaoOptions] = useState(false);
  const [finalizacaoTipo, setFinalizacaoTipo] = useState(null); // 'semDespedida' ou 'comDespedida'
  const [directTicketsToWallets, setDirectTicketsToWallets] = useState(false);

  // Estados para copiar telefone e respostas rápidas
  const [quickMessageModalOpen, setQuickMessageModalOpen] = useState(false);

  console.log("DEBUG user:", user);
  console.log(
    "DEBUG user.finalizacaoComValorVendaAtiva:",
    user?.finalizacaoComValorVendaAtiva
  );

  useEffect(() => {
    fetchData();
    checkWhatsAppTriggerIntegration();
    fetchDirectTicketsToWalletsSetting();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    console.log("DEBUG openFinalizacaoVenda:", openFinalizacaoVenda);
  }, [openFinalizacaoVenda]);

  useEffect(() => {
    console.log("DEBUG open (modal avaliação):", open);
  }, [open]);

  const fetchData = async () => {
    const companyId = user.companyId;
    const planConfigs = await getPlanCompany(undefined, companyId);
    if (isMounted.current) {
      setShowSchedules(planConfigs.plan.useSchedules);
      setOpenTicketMessageDialog(false);
      setDisableBot(ticket.contact.disableBot);
      setShowTicketLogOpen(false);
    }
  };

  const checkWhatsAppTriggerIntegration = async () => {
    try {
      const { data } = await api.get(`/whatsapp/${ticket.whatsappId}`);
      if (isMounted.current) {
        setShowTestButton(data.triggerIntegrationOnClose === true);
      }
    } catch (err) {
      console.error(err);
      if (isMounted.current) {
        setShowTestButton(false);
      }
    }
  };

  const fetchDirectTicketsToWalletsSetting = async () => {
    try {
      const setting = await getSetting({
        column: "DirectTicketsToWallets"
      });
      if (isMounted.current) {
        setDirectTicketsToWallets(setting.DirectTicketsToWallets);
      }
    } catch (err) {
      console.error(err);
      if (isMounted.current) {
        setDirectTicketsToWallets(false);
      }
    }
  };

  // Função para copiar telefone
  const handleCopyPhone = async () => {
    try {
      if (!contact?.number) {
        toast.error(i18n.t("ticketInfo.noPhone"));
        return;
      }
  
      // Remove todos os caracteres não numéricos e copia o número puro
      const phoneNumber = contact.number.replace(/\D/g, '');
  
      // Verifica se tem pelo menos 8 dígitos (número mínimo válido)
      if (phoneNumber.length >= 8) {
        await navigator.clipboard.writeText(phoneNumber);
        toast.success(i18n.t("ticketInfo.phonecopied"));
      } else {
        toast.error(i18n.t("ticketInfo.invalidPhoneFormat"));
      }
    } catch (err) {
      console.error('Erro ao copiar telefone:', err);
      toast.error(i18n.t("ticketInfo.copyError"));
    }
  };

  // Funções para respostas rápidas
  const handleOpenQuickMessageModal = () => {
    setQuickMessageModalOpen(true);
  };

  const handleCloseQuickMessageModal = () => {
    setQuickMessageModalOpen(false);
  };

  const handleQuickMessageSelect = useCallback((selectedMessage) => {
    console.log("🎯 Resposta rápida selecionada:", selectedMessage);
    
    handleCloseQuickMessageModal();
    
    if (selectedMessage.mediaPath) {
      const event = new CustomEvent('insertQuickMessage', {
        detail: {
          quickMessage: {
            id: selectedMessage.id,
            message: selectedMessage.message || "",
            shortcode: selectedMessage.shortcode || "",
            mediaPath: selectedMessage.mediaPath,
            mediaType: selectedMessage.mediaType,
            value: selectedMessage.message || ""
          }
        },
        bubbles: false
      });
      
      window.dispatchEvent(event);
    } else {
      // Para texto, também usar evento
      const event = new CustomEvent('insertQuickMessage', {
        detail: {
          quickMessage: {
            id: selectedMessage.id,
            message: selectedMessage.message || "",
            shortcode: selectedMessage.shortcode || "",
            mediaPath: null,
            mediaType: null,
            value: selectedMessage.message || ""
          }
        },
        bubbles: false
      });
      
      window.dispatchEvent(event);
    }
  }, []);

  const handleClickOpen = async (e) => {
    const setting = await getSetting({
      column: "requiredTag",
    });

    if (setting?.requiredTag === "enabled") {
      //verificar se tem uma tag
      try {
        const contactTags = await api.get(`/contactTags/${ticket.contact.id}`);
        if (!contactTags.data.tags) {
          toast.warning(i18n.t("messagesList.header.buttons.requiredTag"));
        } else {
          setOpen(true);
          // handleUpdateTicketStatus(e, "closed", user?.id);
        }
      } catch (err) {
        toastError(err);
      }
    } else {
      setOpen(true);
      // handleUpdateTicketStatus(e, "closed", user?.id);
    }
  };

  const handleClose = () => {
    formRef.current.resetForm();
    setOpen(false);
  };

  const handleCloseAlert = () => {
    setOpenAlert(false);
    setLoading(false);
  };
  const handleOpenAcceptTicketWithouSelectQueue = async () => {
    setAcceptTicketWithouSelectQueueOpen(true);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenTransferModal = (e) => {
    setTransferTicketModalOpen(true);
    if (typeof handleClose == "function") handleClose();
  };

  const handleOpenConfirmationModal = (e) => {
    setConfirmationOpen(true);
    if (typeof handleClose == "function") handleClose();
  };

  const handleCloseTicketWithoutFarewellMsg = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "closed",
        userId: user?.id || null,
        sendFarewellMessage: false,
        amountUsedBotQueues: 0,
      });

      setLoading(false);
      history.push("/tickets");
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const handleExportPDF = async () => {
    setOpenTicketMessageDialog(true);
    handleCloseMenu();
  };

  const handleEnableIntegration = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        useIntegration: !enableIntegration,
      });
      setEnableIntegration(!enableIntegration);

      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const handleShowLogTicket = async () => {
    setShowTicketLogOpen(true);
  };

  const handleContactToggleDisableBot = async () => {
    const { id } = ticket.contact;

    try {
      const { data } = await api.put(`/contacts/toggleDisableBot/${id}`);
      ticket.contact.disableBot = data.disableBot;
      setDisableBot(data.disableBot);
    } catch (err) {
      toastError(err);
    }
  };

  const handleCloseTransferTicketModal = () => {
    setTransferTicketModalOpen(false);
  };

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticket.id}`);
      history.push("/tickets");
    } catch (err) {
      toastError(err);
    }
  };

  const handleSendMessage = async (id) => {
    let setting;

    try {
      setting = await getSetting({
        column: "greetingAcceptedMessage",
      });
    } catch (err) {
      toastError(err);
    }
    if (!setting.greetingAcceptedMessage) {
      toast.warning(
        i18n.t("messagesList.header.buttons.greetingAcceptedMessage")
      );
      return;
    }
    const msg = `${setting.greetingAcceptedMessage}`; //`{{ms}} *{{name}}*, ${i18n.t("mainDrawer.appBar.user.myName")} *${user?.name}* ${i18n.t("mainDrawer.appBar.user.continuity")}.`;
    const message = {
      read: 1,
      fromMe: true,
      mediaUrl: "",
      body: `${msg.trim()}`,
    };
    try {
      await api.post(`/messages/${id}`, message);
    } catch (err) {
      toastError(err);
    }
  };

  const handleUpdateTicketStatus = async (e, status, userId) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: status,
        userId: userId || null,
      });

      let setting;

      try {
        setting = await getSetting({
          column: "sendGreetingAccepted",
        });
      } catch (err) {
        toastError(err);
      }

      if (
        setting?.sendGreetingAccepted === "enabled" &&
        (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled") &&
        ticket.status === "pending"
      ) {
        handleSendMessage(ticket.id);
      }

      if (isMounted.current) {
        setLoading(false);
      }

      if (status === "open" || status === "group") {
        setCurrentTicket({ ...ticket, code: "#" + status });
        setTimeout(() => {
          history.push("/tickets");
        }, 0);

        setTimeout(() => {
          history.push(`/tickets/${ticket.uuid}`);
          setTabOpen(status);
        }, 10);
      } else {
        setCurrentTicket({ id: null, code: null });
        history.push("/tickets");
      }
    } catch (err) {
      if (isMounted.current) {
        setLoading(false);
      }
      toastError(err);
    }
  };

  const handleAcepptTicket = async (id) => {
    setLoading(true);
    try {
      const otherTicket = await api.put(`/tickets/${id}`, {
        status: ticket.isGroup ? "group" : "open",
        userId: user?.id,
      });
      if (otherTicket.data.id !== ticket.id) {
        if (otherTicket.data.userId !== user?.id) {
          if (isMounted.current) {
            setOpenAlert(true);
            setUserTicketOpen(otherTicket.data.user.name);
            setQueueTicketOpen(otherTicket.data.queue.name);
            setTabOpen(otherTicket.isGroup ? "group" : "open");
          }
        } else {
          if (isMounted.current) {
            setLoading(false);
            setTabOpen(otherTicket.isGroup ? "group" : "open");
          }
          history.push(`/tickets/${otherTicket.data.uuid}`);
        }
      } else {
        if (isMounted.current) {
          setLoading(false);
        }
        history.push("/tickets");
        setTimeout(() => {
          history.push(`/tickets/${ticket.uuid}`);
          setTabOpen(ticket.isGroup ? "group" : "open");
        }, 1000);
      }
    } catch (err) {
      if (isMounted.current) {
        setLoading(false);
      }
      toastError(err);
    }
  };

  const handleExportToPDF = () => {
    const messagesListElement = document.getElementById("messagesList");
    const headerElement = document.getElementById("TicketHeader");

    const pdfOptions = {
      margin: 1,
      filename: `${i18n.t("whatsappModalRel.form.reportFilename")}${
        ticket.id
      }.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    if (messagesListElement && headerElement) {
      const headerClone = headerElement.cloneNode(true);
      const messagesListClone = messagesListElement.cloneNode(true);

      const containerElement = document.createElement("div");
      containerElement.appendChild(headerClone);
      containerElement.appendChild(messagesListClone);

      return html2pdf().from(containerElement).set(pdfOptions).output("blob");
    } else {
      toast.error(i18n.t("whatsappModalRel.form.elementNotFoundForExport"));
      return null;
    }
  };

  const handleTestButton = async () => {
    try {
      if (ticket?.whatsapp?.integrationTypeId) {
        const { data: integration } = await api.get(
          `/queueIntegration/${ticket.whatsapp.integrationTypeId}`
        );

        if (integration) {
          await api.post(`/queueIntegration/testsession`, {
            integrationId: ticket.whatsapp.integrationTypeId,
            ticketId: ticket.id,
            contactId: ticket.contactId,
            body: ticket.lastMessage?.body || "",
            status: "closed",
          });

          if (isMounted.current) {
            toast.success(i18n.t("ticketList.success.integrationTriggered"));
          }
        }
      }

      await handleUpdateTicketStatus(
        null,
        "closed",
        user?.id,
        ticket?.queue?.id
      );

      if (isMounted.current) {
        handleClose();
      }
    } catch (err) {
      toastError(err);
    }
  };

  const handleLinkToWallet = async () => {
    if (!ticket.contactId) {
      toast.error(i18n.t("contactModal.saveFirst"));
      return;
    }

    setLinkingWallet(true);
    try {
      if (!user.queues || user.queues.length === 0) {
        toast.error(i18n.t("contactModal.walletError"));
        return;
      }

      // Usa a primeira fila do usuário
      const userQueue = user.queues[0];

      await api.put(`/contacts/wallet/${ticket.contactId}`, {
        wallets: {
          userId: user.id,
          queueId: ticket.queueId || userQueue.id,
        },
      });

      toast.success(i18n.t("contactModal.walletLinked"));
    } catch (err) {
      toastError(err);
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleFinalizarTicket = async (tipo) => {
    if (
      user.finalizacaoComValorVendaAtiva === true ||
      user.finalizacaoComValorVendaAtiva === "true"
    ) {
      setFinalizacaoTipo(tipo);
      setOpenFinalizacaoVenda(true);
    } else {
      if (tipo === "semDespedida") {
        handleCloseTicketWithoutFarewellMsg();
      } else {
        handleUpdateTicketStatus(null, "closed", user?.id, ticket?.queue?.id);
      }
    }
  };

  const handleClickResolver = () => {
    console.log("DEBUG handleClickResolver chamado");
    if (
      user.finalizacaoComValorVendaAtiva === true ||
      user.finalizacaoComValorVendaAtiva === "true"
    ) {
      setFinalizacaoTipo("comDespedida");
      setOpenFinalizacaoVenda(true);
    } else {
      setOpen(true);
    }
  };

  const handleUpdateTicketStatusWithData = async (
    ticketData,
    sendFarewellMessage,
    finalizacaoMessage
  ) => {
    try {
      await api.put(`/tickets/${ticket.id}`, {
        ...ticketData,
        sendFarewellMessage,
        finalizacaoMessage,
      });
      toast.success("Ticket finalizado com sucesso!");
      // Atualize o estado conforme necessário
    } catch (err) {
      toastError(err);
    }
  };

  // Tooltip dinâmico para copiar telefone
  const getCopyPhoneTooltip = () => {
    const usePrefixWhenCopy = localStorage.getItem('usePrefixWhenCopy') === 'true';
    const prefix = localStorage.getItem('contactCopyPrefix') || '';
    
    let copyTooltip = i18n.t("ticketInfo.copyPhone");
    if (usePrefixWhenCopy && prefix) {
      copyTooltip = `Copiar telefone com prefixo (${prefix})`;
    }
    return copyTooltip;
  };

  return (
    <>
      {openAlert && (
        <ShowTicketOpen
          isOpen={openAlert}
          handleClose={handleCloseAlert}
          user={userTicketOpen}
          queue={queueTicketOpen}
        />
      )}
      {acceptTicketWithouSelectQueueOpen && (
        <AcceptTicketWithouSelectQueue
          modalOpen={acceptTicketWithouSelectQueueOpen}
          onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
          ticketId={ticket.id}
          ticket={ticket}
        />
      )}
      {showTicketLogOpen && (
        <ShowTicketLogModal
          isOpen={showTicketLogOpen}
          handleClose={(e) => setShowTicketLogOpen(false)}
          ticketId={ticket.id}
        />
      )}
      {openTicketMessageDialog && (
        <TicketMessagesDialog
          open={openTicketMessageDialog}
          handleClose={() => setOpenTicketMessageDialog(false)}
          ticketId={ticket.id}
        />
      )}
      
      {quickMessageModalOpen && (
  <QuickMessageModal
    open={quickMessageModalOpen}
    onClose={handleCloseQuickMessageModal}
    onSelect={handleQuickMessageSelect}
    companyId={user?.companyId}
    userId={user?.id}
  />
)}

      <div className={classes.actionButtons}>
        {ticket.status === "closed" &&
          (ticket.queueId === null || ticket.queueId === undefined) && (
            <ButtonWithSpinner
              loading={loading}
              startIcon={<Replay />}
              size="small"
              onClick={(e) => handleOpenAcceptTicketWithouSelectQueue()}
            >
              {i18n.t("messagesList.header.buttons.reopen")}
            </ButtonWithSpinner>
          )}
        {ticket.status === "closed" && ticket.queueId !== null && (
          <ButtonWithSpinner
            startIcon={<Replay />}
            loading={loading}
            onClick={(e) => handleAcepptTicket(ticket.id)}
          >
            {i18n.t("messagesList.header.buttons.reopen")}
          </ButtonWithSpinner>
        )}
        {/* <IconButton
                    className={classes.bottomButtonVisibilityIcon}
                    onClick={handleShowLogTicket}
                >
                    <Tooltip title={i18n.t("messagesList.header.buttons.logTicket")}>
                        <History />

                    </Tooltip>
                </IconButton> */}
        {(ticket.status === "open" || ticket.status === "group") && (
          <>
            {/* {!showSelectMessageCheckbox ? ( */}
            <>
              {/* <IconButton
                                className={classes.bottomButtonVisibilityIcon}
                                onClick={handleEnableIntegration}
                            >
                                <Tooltip title={i18n.t("messagesList.header.buttons.enableIntegration")}>
                                    {enableIntegration === true ? <DeviceHubOutlined style={{ color: "green" }} /> : <DeviceHubOutlined />}

                                </Tooltip>
                            </IconButton> */}

              {/* Ícone para copiar telefone */}
              <IconButton 
                className={classes.bottomButtonVisibilityIcon}
                onClick={handleCopyPhone}
                disabled={!contact?.number}
              >
                <Tooltip title={getCopyPhoneTooltip()}>
                  <FileCopyIcon />
                </Tooltip>
              </IconButton>

              {/* Ícone para respostas rápidas */}
              <IconButton 
                className={classes.bottomButtonVisibilityIcon}
                onClick={handleOpenQuickMessageModal}
              >
                <Tooltip title={i18n.t("ticketInfo.quickMessages")}>
                  <FlashOn />
                </Tooltip>
              </IconButton>

              <IconButton className={classes.bottomButtonVisibilityIcon}>
                <Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
                  <HighlightOffIcon onClick={handleClickResolver} />
                </Tooltip>
              </IconButton>

              <IconButton className={classes.bottomButtonVisibilityIcon}>
                <Tooltip title={i18n.t("tickets.buttons.returnQueue")}>
                  <UndoIcon
                    // color="primary"
                    onClick={(e) =>
                      handleUpdateTicketStatus(e, "pending", null)
                    }
                  />
                </Tooltip>
              </IconButton>

              <IconButton className={classes.bottomButtonVisibilityIcon}>
                <Tooltip title="Transferir Ticket">
                  <SwapHorizOutlined
                    // color="primary"
                    onClick={handleOpenTransferModal}
                  />
                </Tooltip>
              </IconButton>

              {/* Botão de vincular à carteira só aparece se NÃO houver carteira vinculada E se a configuração DirectTicketsToWallets estiver ativa */}
              {directTicketsToWallets && !(
                ticket.contact?.contactWallets &&
                ticket.contact.contactWallets.length > 0
              ) && (
                <IconButton
                  className={classes.bottomButtonVisibilityIcon}
                  onClick={handleLinkToWallet}
                  disabled={linkingWallet}
                >
                  <Tooltip title="Vincular à minha carteira">
                    {linkingWallet ? (
                      <CircularProgress size={20} />
                    ) : (
                      <AccountBalanceWallet />
                    )}
                  </Tooltip>
                </IconButton>
              )}
            </>

            {/* {showSchedules && (
                            <>
                                <IconButton className={classes.bottomButtonVisibilityIcon}>
                                    <Tooltip title={i18n.t("tickets.buttons.scredule")}>
                                        <EventIcon
                                            // color="primary"
                                            onClick={handleOpenScheduleModal}
                                        />
                                    </Tooltip>
                                </IconButton>
                            </>
                        )} */}

            <MenuItem className={classes.bottomButtonVisibilityIcon}>
              <Tooltip title={i18n.t("contactModal.form.chatBotContact")}>
                <Switch
                  size="small"
                  // color="primary"
                  checked={disableBot}
                  onChange={() => handleContactToggleDisableBot()}
                />
              </Tooltip>
            </MenuItem>

            {confirmationOpen && (
              <ConfirmationModal
                title={`${i18n.t(
                  "ticketOptionsMenu.confirmationModal.title"
                )} #${ticket.id}?`}
                open={confirmationOpen}
                onClose={setConfirmationOpen}
                onConfirm={handleDeleteTicket}
              >
                {i18n.t("ticketOptionsMenu.confirmationModal.message")}
              </ConfirmationModal>
            )}
            {transferTicketModalOpen && (
              <TransferTicketModalCustom
                modalOpen={transferTicketModalOpen}
                onClose={handleCloseTransferTicketModal}
                ticketid={ticket.id}
                ticket={ticket}
              />
            )}
          </>
        )}
        {ticket.status === "pending" &&
          (ticket.queueId === null || ticket.queueId === undefined) && (
            <ButtonWithSpinner
              loading={loading}
              size="small"
              variant="contained"
              onClick={(e) => handleOpenAcceptTicketWithouSelectQueue()}
            >
              {i18n.t("messagesList.header.buttons.accept")}
            </ButtonWithSpinner>
          )}
        {ticket.status === "pending" && ticket.queueId !== null && (
          <ButtonWithSpinner
            loading={loading}
            size="small"
            variant="contained"
            // color="primary"
            onClick={(e) => handleUpdateTicketStatus(e, "open", user?.id)}
          >
            {i18n.t("messagesList.header.buttons.accept")}
          </ButtonWithSpinner>
        )}
        <IconButton
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
          style={{ paddingHorizontal: 3, paddingTop: 10 }}
        >
          <MoreVert style={{ fontSize: 16, padding: 0 }} />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={menuOpen}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={handleOpenConfirmationModal}>
            <Can
              role={user.profile}
              perform="ticket-options:deleteTicket"
              yes={() => i18n.t("tickets.buttons.deleteTicket")}
            />
          </MenuItem>
          <MenuItem onClick={handleEnableIntegration}>
            {enableIntegration === true
              ? i18n.t("messagesList.header.buttons.disableIntegration")
              : i18n.t("messagesList.header.buttons.enableIntegration")}
          </MenuItem>
          <MenuItem onClick={handleShowLogTicket}>
            {i18n.t("messagesList.header.buttons.logTicket")}
          </MenuItem>
          <MenuItem onClick={handleExportPDF}>
            {i18n.t("ticketsList.buttons.exportAsPDF")}
          </MenuItem>
        </Menu>
      </div>
      <>
        {(!user.finalizacaoComValorVendaAtiva ||
          user.finalizacaoComValorVendaAtiva === false ||
          user.finalizacaoComValorVendaAtiva === "false") && (
          <Formik
            enableReinitialize={true}
            validationSchema={SessionSchema}
            innerRef={formRef}
            onSubmit={(values, actions) => {
              setTimeout(() => {
                actions.setSubmitting(false);
                actions.resetForm();
              }, 400);
            }}
          >
            {({
              values,
              touched,
              errors,
              isSubmitting,
              setFieldValue,
              resetForm,
            }) => (
              <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <Form>
                  <DialogActions className={classes.botoes}>
                    <Button
                      onClick={() => handleFinalizarTicket("semDespedida")}
                      style={{
                        background: theme.palette.primary.main,
                        color: "white",
                      }}
                    >
                      {i18n.t(
                        "messagesList.header.dialogRatingWithoutFarewellMsg"
                      )}
                    </Button>

                    <Button
                      onClick={() => handleFinalizarTicket("comDespedida")}
                      style={{
                        background: theme.palette.primary.main,
                        color: "white",
                      }}
                    >
                      {i18n.t("messagesList.header.dialogRatingCancel")}
                    </Button>

                    {showTestButton && (
                      <Button
                        onClick={handleTestButton}
                        style={{
                          background: theme.palette.primary.main,
                          color: "white",
                        }}
                      >
                        {i18n.t(
                          "whatsappModalRel.form.resolveAndTriggerIntegration"
                        )}
                      </Button>
                    )}
                  </DialogActions>
                </Form>
              </Dialog>
            )}
          </Formik>
        )}
      </>
      {openFinalizacaoVenda &&
        (console.log("DEBUG JSX: Renderizando FinalizacaoVendaModal"),
        (
          <FinalizacaoVendaModal
            open={openFinalizacaoVenda}
            onClose={() => setOpenFinalizacaoVenda(false)}
            ticket={ticket}
            onFinalizar={(ticketData) => {
              setOpenFinalizacaoVenda(false);
              setTicketDataToFinalize(ticketData);
              setShowFinalizacaoOptions(true);
            }}
          />
        ))}
      {showFinalizacaoOptions && (
        <Dialog
          open={showFinalizacaoOptions}
          onClose={() => setShowFinalizacaoOptions(false)}
          aria-labelledby="finalizacao-options-title"
        >
          <DialogTitle id="finalizacao-options-title">
            Como deseja finalizar?
          </DialogTitle>
          <DialogActions className={classes.botoes}>
            <Button
              onClick={async () => {
                setShowFinalizacaoOptions(false);
                await handleUpdateTicketStatusWithData(
                  ticketDataToFinalize,
                  false,
                  null
                );
              }}
              style={{ background: theme.palette.primary.main, color: "white" }}
            >
              {i18n.t("messagesList.header.dialogRatingWithoutFarewellMsg")}
            </Button>
            <Button
              onClick={async () => {
                setShowFinalizacaoOptions(false);
                await handleUpdateTicketStatusWithData(
                  ticketDataToFinalize,
                  true,
                  null
                );
              }}
              style={{ background: theme.palette.primary.main, color: "white" }}
            >
              {i18n.t("messagesList.header.dialogRatingCancel")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default TicketActionButtonsCustom;