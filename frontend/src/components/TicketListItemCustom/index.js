import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { green, grey } from "@material-ui/core/colors";
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { List, Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import GroupIcon from "@material-ui/icons/Group";
import ContactTag from "../ContactTag";
import ConnectionIcon from "../ConnectionIcon";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ShowTicketOpen from "../ShowTicketOpenModal";
import FinalizacaoVendaModal from "../FinalizacaoVendaModal";
import { isNil } from "lodash";
import { toast } from "react-toastify";
import { Done, HighlightOff, Replay, SwapHoriz } from "@material-ui/icons";
import VisibilityIcon from "@material-ui/icons/Visibility"; // Ícone de spy
import useCompanySettings from "../../hooks/useSettings/companySettings";
import {
  Avatar,
  Badge,
  ListItemAvatar,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  DialogContent,
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  ticket: {
    position: "relative",
  },

  pendingTicket: {
    cursor: "unset",
  },
  queueTag: {
    background: "#FCFCFC",
    color: "#000",
    marginRight: 1,
    padding: 1,
    fontWeight: "bold",
    borderRadius: 3,
    fontSize: "0.5em",
    whiteSpace: "nowrap",
  },
  noTicketsDiv: {
    display: "flex",
    height: "100px",
    margin: 40,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  newMessagesCount: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    top: 0,
    color: "green",
    fontWeight: "bold",
    marginRight: "10px",
    borderRadius: 0,
  },
  noTicketsText: {
    textAlign: "center",
    color: "rgb(104, 121, 146)",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  connectionTag: {
    background: "green",
    color: "#FFF",
    marginRight: 1,
    padding: 1,
    fontWeight: "bold",
    borderRadius: 3,
    fontSize: "0.6em",
  },
  noTicketsTitle: {
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0px",
  },

  contactNameWrapper: {
    display: "flex",
    justifyContent: "space-between",
    marginLeft: "5px",
    fontWeight: "bold",
    color: theme.mode === "light" ? "black" : "white",
  },

  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    top: -30,
    marginRight: "1px",
    color: theme.mode === "light" ? "black" : grey[400],
  },

  lastMessageTimeUnread: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    top: -30,
    color: "green",
    fontWeight: "bold",
    marginRight: "1px",
  },

  closedBadge: {
    alignSelf: "center",
    justifySelf: "flex-end",
    marginRight: 32,
    marginLeft: "auto",
  },

  contactLastMessage: {
    paddingRight: "0%",
    marginLeft: "5px",
    color: theme.mode === "light" ? "black" : grey[400],
  },

  contactLastMessageUnread: {
    paddingRight: 20,
    fontWeight: "bold",
    color: theme.mode === "light" ? "black" : grey[400],
    width: "50%",
  },

  badgeStyle: {
    color: "white",
    backgroundColor: green[500],
  },

  acceptButton: {
    position: "absolute",
    right: "1px",
  },

  ticketQueueColor: {
    flex: "none",
    height: "100%",
    position: "absolute",
    top: "0%",
    left: "0%",
  },

  ticketInfo: {
    position: "relative",
    top: -13,
  },
  secondaryContentSecond: {
    display: "flex",
    alignItems: "flex-start",
    flexWrap: "nowrap",
    flexDirection: "row",
    alignContent: "flex-start",
  },
  ticketInfo1: {
    position: "relative",
    top: 13,
    right: 0,
  },
  Radiusdot: {
    "& .MuiBadge-badge": {
      borderRadius: 2,
      position: "inherit",
      height: 16,
      margin: 2,
      padding: 3,
    },
    "& .MuiBadge-anchorOriginTopRightRectangle": {
      transform: "scale(1) translate(0%, -40%)",
    },
  },
  connectionIcon: {
    marginRight: theme.spacing(1),
  },

  // Estilos para o modal da imagem
  imageModal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalContent: {
    outline: "none",
    maxWidth: "90vw",
    maxHeight: "90vh",
  },
  expandedImage: {
    width: "100%",
    height: "auto",
    maxWidth: "500px",
    borderRadius: theme.spacing(1),
  },
  clickableAvatar: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8,
    },
  }
}));

const TicketListItemCustom = ({ setTabOpen, ticket }) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [
    acceptTicketWithouSelectQueueOpen,
    setAcceptTicketWithouSelectQueueOpen,
  ] = useState(false);
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);

  const [openAlert, setOpenAlert] = useState(false);
  const [userTicketOpen, setUserTicketOpen] = useState("");
  const [queueTicketOpen, setQueueTicketOpen] = useState("");

  // Estados para o modal de finalização de venda
  const [openFinalizacaoVenda, setOpenFinalizacaoVenda] = useState(false);
  const [finalizacaoTipo, setFinalizacaoTipo] = useState(null);
  const [ticketDataToFinalize, setTicketDataToFinalize] = useState(null);
  const [showFinalizacaoOptions, setShowFinalizacaoOptions] = useState(false);

  const [imageModalOpen, setImageModalOpen] = useState(false); // Estado para o modal da imagem

  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { user } = useContext(AuthContext);

  const { get: getSetting } = useCompanySettings();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Função para abrir modal da imagem
  const handleImageClick = (e) => {
    e.stopPropagation(); // Prevenir que o clique no avatar selecione o ticket
    if (ticket?.contact?.urlPicture) {
      setImageModalOpen(true);
    }
  };

  // Função para fechar modal da imagem
  const handleImageModalClose = () => {
    setImageModalOpen(false);
  };

  const handleOpenAcceptTicketWithouSelectQueue = useCallback(() => {
    setAcceptTicketWithouSelectQueueOpen(true);
  }, []);

  const handleCloseTicket = async (id) => {
    // Verificar se a finalização com valor de venda está ativa
    if (
      user.finalizacaoComValorVendaAtiva === true ||
      user.finalizacaoComValorVendaAtiva === "true"
    ) {
      // Se estiver ativa, abrir o modal de finalização de venda
      setFinalizacaoTipo("comDespedida");
      setOpenFinalizacaoVenda(true);
      handleSelectTicket(ticket);
      history.push(`/tickets/${ticket.uuid}`);
    } else {
      // Comportamento original
      const setting = await getSetting({
        column: "requiredTag",
      });

      if (setting.requiredTag === "enabled") {
        //verificar se tem uma tag
        try {
          const contactTags = await api.get(
            `/contactTags/${ticket.contact.id}`
          );
          if (!contactTags.data.tags) {
            toast.warning(i18n.t("messagesList.header.buttons.requiredTag"));
          } else {
            await api.put(`/tickets/${id}`, {
              status: "closed",
              userId: user?.id || null,
            });

            if (isMounted.current) {
              setLoading(false);
            }

            history.push(`/tickets/`);
          }
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      } else {
        setLoading(true);
        try {
          await api.put(`/tickets/${id}`, {
            status: "closed",
            userId: user?.id || null,
          });
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
        if (isMounted.current) {
          setLoading(false);
        }

        history.push(`/tickets/`);
      }
    }
  };

  const handleCloseIgnoreTicket = async (id) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${id}`, {
        status: "closed",
        userId: user?.id || null,
        sendFarewellMessage: false,
        amountUsedBotQueues: 0,
      });
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
    if (isMounted.current) {
      setLoading(false);
    }

    history.push(`/tickets/`);
  };

  const truncate = (str, len) => {
    if (!isNil(str)) {
      if (str.length > len) {
        return str.substring(0, len) + "...";
      }
      return str;
    }
  };

  const handleCloseTransferTicketModal = useCallback(() => {
    if (isMounted.current) {
      setTransferTicketModalOpen(false);
    }
  }, []);

  const handleOpenTransferModal = () => {
    setLoading(true);
    setTransferTicketModalOpen(true);
    if (isMounted.current) {
      setLoading(false);
    }
    handleSelectTicket(ticket);
    history.push(`/tickets/${ticket.uuid}`);
  };

  const handleAcepptTicket = async (id) => {
    setLoading(true);
    try {
      const otherTicket = await api.put(`/tickets/${id}`, {
        status:
          ticket.isGroup && ticket.channel === "whatsapp" ? "group" : "open",
        userId: user?.id,
      });

      if (otherTicket.data.id !== ticket.id) {
        if (otherTicket.data.userId !== user?.id) {
          setOpenAlert(true);
          setUserTicketOpen(otherTicket.data.user.name);
          setQueueTicketOpen(otherTicket.data.queue.name);
        } else {
          setLoading(false);
          setTabOpen(ticket.isGroup ? "group" : "open");
          handleSelectTicket(otherTicket.data);
          history.push(`/tickets/${otherTicket.uuid}`);
        }
      } else {
        let setting;

        try {
          setting = await getSetting({
            column: "sendGreetingAccepted",
          });
        } catch (err) {
          toastError(err);
        }

        if (
          setting.sendGreetingAccepted === "enabled" &&
          (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")
        ) {
          handleSendMessage(ticket.id);
        }
        if (isMounted.current) {
          setLoading(false);
        }

        setTabOpen(ticket.isGroup ? "group" : "open");
        handleSelectTicket(ticket);
        history.push(`/tickets/${ticket.uuid}`);
      }
    } catch (err) {
      setLoading(false);
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
    const msg = `${setting.greetingAcceptedMessage}`;
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

  const handleCloseAlert = useCallback(() => {
    setOpenAlert(false);
    setLoading(false);
  }, []);

  const handleSelectTicket = (ticket) => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setCurrentTicket({ id, uuid, code });
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
      history.push(`/tickets/`);
    } catch (err) {
      toastError(err);
    }
  };

  // Função para espionar ticket chatbot
  const handleSpyTicket = () => {
    handleSelectTicket(ticket);
    history.push(`/tickets/${ticket.uuid}`);
  };

  // Lógica de permissão para mensagens pending - MOVIDA PARA DEPOIS DE TODAS AS FUNÇÕES
  const shouldBlurMessages = ticket.status === "pending" && user?.allowSeeMessagesInPendingTickets === "disabled";

  // Função para renderizar a mensagem com base na permissão - MOVIDA PARA DEPOIS DE TODAS AS FUNÇÕES
  const renderLastMessage = () => {
    if (shouldBlurMessages) {
      return (
        <MarkdownWrapper>
          {i18n.t("tickets.messageHidden") || "Mensagem oculta"}
        </MarkdownWrapper>
      );
    }

    if (!ticket.lastMessage) {
      return <br />;
    }

    if (ticket.lastMessage.includes("data:image/png;base64")) {
      return <MarkdownWrapper>Localização</MarkdownWrapper>;
    }

    if (ticket.lastMessage.includes("BEGIN:VCARD")) {
      return <MarkdownWrapper>Contato</MarkdownWrapper>;
    }

    return (
      <MarkdownWrapper>
        {truncate(ticket.lastMessage, 40)}
      </MarkdownWrapper>
    );
  };

  return (
    <React.Fragment key={ticket.id}>
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
      {transferTicketModalOpen && (
        <TransferTicketModalCustom
          modalOpen={transferTicketModalOpen}
          onClose={handleCloseTransferTicketModal}
          ticketid={ticket.id}
          ticket={ticket}
        />
      )}
      <ListItem
        button
        dense
        onClick={(e) => {
          console.log("e", e);
          const isCheckboxClicked =
            (e.target.tagName.toLowerCase() === "input" &&
              e.target.type === "checkbox") ||
            (e.target.tagName.toLowerCase() === "svg" &&
              e.target.type === undefined) ||
            (e.target.tagName.toLowerCase() === "path" &&
              e.target.type === undefined);

          if (isCheckboxClicked) return;

          handleSelectTicket(ticket);
        }}
        selected={ticketId && ticketId === ticket.uuid}
        className={clsx(classes.ticket, {
          [classes.pendingTicket]: ticket.status === "pending",
        })}
      >
        <ListItemAvatar style={{ marginLeft: "-15px" }}>
          <Avatar
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
            }}
            src={`${ticket?.contact?.urlPicture}`}
            className={classes.clickableAvatar}
            onClick={handleImageClick}
          />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={
            <span className={classes.contactNameWrapper}>
              <Typography
                noWrap
                component="span"
                variant="body2"
              >
                {ticket.isGroup && ticket.channel === "whatsapp" && (
                  <GroupIcon
                    fontSize="small"
                    style={{
                      color: grey[700],
                      marginBottom: "-1px",
                      marginLeft: "5px",
                    }}
                  />
                )}{" "}
                &nbsp;
                {ticket.channel && (
                  <ConnectionIcon
                    width="20"
                    height="20"
                    className={classes.connectionIcon}
                    connectionType={ticket.channel}
                  />
                )}{" "}
                &nbsp;
                {truncate(ticket.contact?.name, 60)}
              </Typography>
            </span>
          }
          secondary={
            <span className={classes.contactNameWrapper}>
              <Typography
                className={
                  Number(ticket.unreadMessages) > 0
                    ? classes.contactLastMessageUnread
                    : classes.contactLastMessage
                }
                noWrap
                component="span"
                variant="body2"
              >
                {renderLastMessage()}
                <span className={classes.secondaryContentSecond}>
                  {ticket?.whatsapp ? (
                    <Badge
                      className={classes.connectionTag}
                      style={{
                        backgroundColor:
                          ticket.channel === "whatsapp"
                            ? ticket.whatsapp?.color || "#25D366"
                            : ticket.channel === "facebook"
                            ? "#4267B2"
                            : "#E1306C",
                      }}
                    >
                      {ticket.whatsapp?.name.toUpperCase()}
                    </Badge>
                  ) : (
                    <br></br>
                  )}
                  {
                    <Badge
                      style={{
                        backgroundColor: ticket.queue?.color || "#7c7c7c",
                      }}
                      className={classes.connectionTag}
                    >
                      {ticket.queueId
                        ? ticket.queue?.name.toUpperCase()
                        : ticket.status === "lgpd"
                        ? "LGPD"
                        : `${i18n.t("momentsUser.noqueue")}`}
                    </Badge>
                  }
                  {ticket?.user && (
                    <Badge
                      style={{ backgroundColor: "#000000" }}
                      className={classes.connectionTag}
                    >
                      {ticket.user?.name.toUpperCase()}
                    </Badge>
                  )}
                </span>
                <span className={classes.secondaryContentSecond}>
                  {ticket?.contact?.tags?.map((tag) => {
                    return (
                      <ContactTag
                        tag={tag}
                        key={`ticket-contact-tag-${ticket.id}-${tag.id}`}
                      />
                    );
                  })}
                </span>
                <span className={classes.secondaryContentSecond}>
                  {ticket.tags?.map((tag) => {
                    return (
                      <ContactTag
                        tag={tag}
                        key={`ticket-contact-tag-${ticket.id}-${tag.id}`}
                      />
                    );
                  })}
                </span>
              </Typography>

              <Badge
                className={classes.newMessagesCount}
                badgeContent={shouldBlurMessages ? "?" : ticket.unreadMessages}
                classes={{
                  badge: classes.badgeStyle,
                }}
              />
            </span>
          }
        />
        <ListItemSecondaryAction>
          {ticket.lastMessage && (
            <>
              <Typography
                className={
                  Number(ticket.unreadMessages) > 0
                    ? classes.lastMessageTimeUnread
                    : classes.lastMessageTime
                }
                component="span"
                variant="body2"
              >
                {isSameDay(parseISO(ticket.updatedAt), new Date()) ? (
                  <>{format(parseISO(ticket.updatedAt), "HH:mm")}</>
                ) : (
                  <>{format(parseISO(ticket.updatedAt), "dd/MM/yyyy")}</>
                )}
              </Typography>

              <br />
            </>
          )}
        </ListItemSecondaryAction>
        <ListItemSecondaryAction>
          {/* Para tickets com status chatbot, mostrar apenas o ícone de spy */}
          {ticket.status === "chatbot" && (
            <span className={classes.secondaryContentSecond}>
              <ButtonWithSpinner
                style={{
                  backgroundColor: "transparent",
                  boxShadow: "none",
                  border: "none",
                  color: theme.mode === "light" ? "blue" : "#FFF",
                  padding: "0px",
                  borderRadius: "50%",
                  right: "1px",
                  fontSize: "0.6rem",
                  bottom: "-30px",
                  minWidth: "2em",
                  width: "auto",
                }}
                variant="contained"
                className={classes.acceptButton}
                size="small"
                loading={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpyTicket();
                }}
              >
                <Tooltip title="Espiar conversa do chatbot">
                  <VisibilityIcon />
                </Tooltip>
              </ButtonWithSpinner>
            </span>
          )}

          {/* Para todos os outros status, manter os botões originais */}
          {ticket.status !== "chatbot" && (
            <>
              <span className={classes.secondaryContentSecond}>
                {ticket.status === "pending" &&
                  (ticket.queueId === null || ticket.queueId === undefined) && (
                    <ButtonWithSpinner
                      style={{
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        border: "none",
                        color: theme.mode === "light" ? "green" : "#FFF",
                        padding: "0px",
                        borderRadius: "50%",
                        right: "51px",
                        fontSize: "0.6rem",
                        bottom: "-30px",
                        minWidth: "2em",
                        width: "auto",
                      }}
                      variant="contained"
                      className={classes.acceptButton}
                      size="small"
                      loading={loading}
                      onClick={(e) => handleOpenAcceptTicketWithouSelectQueue()}
                    >
                      <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                        <Done />
                      </Tooltip>
                    </ButtonWithSpinner>
                  )}
              </span>
              <span className={classes.secondaryContentSecond}>
                {ticket.status === "pending" && ticket.queueId !== null && (
                  <ButtonWithSpinner
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      border: "none",
                      color: theme.mode === "light" ? "green" : "#FFF",
                      padding: "0px",
                      borderRadius: "50%",
                      right: "51px",
                      fontSize: "0.6rem",
                      bottom: "-30px",
                      minWidth: "2em",
                      width: "auto",
                    }}
                    variant="contained"
                    className={classes.acceptButton}
                    size="small"
                    loading={loading}
                    onClick={(e) => handleAcepptTicket(ticket.id)}
                  >
                    <Tooltip title={`${i18n.t("ticketsList.buttons.accept")}`}>
                      <Done />
                    </Tooltip>
                  </ButtonWithSpinner>
                )}
              </span>
              <span className={classes.secondaryContentSecond1}>
                {(ticket.status === "pending" ||
                  ticket.status === "open" ||
                  ticket.status === "group") && (
                  <ButtonWithSpinner
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      border: "none",
                      color: theme.mode === "light" ? "purple" : "#FFF",
                      padding: "0px",
                      borderRadius: "50%",
                      right: "26px",
                      position: "absolute",
                      fontSize: "0.6rem",
                      bottom: "-30px",
                      minWidth: "2em",
                      width: "auto",
                    }}
                    variant="contained"
                    className={classes.acceptButton}
                    size="small"
                    loading={loading}
                    onClick={handleOpenTransferModal}
                  >
                    <Tooltip title={`${i18n.t("ticketsList.buttons.transfer")}`}>
                      <SwapHoriz />
                    </Tooltip>
                  </ButtonWithSpinner>
                )}
              </span>
              <span className={classes.secondaryContentSecond}>
                {(ticket.status === "open" || ticket.status === "group") && (
                  <ButtonWithSpinner
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      border: "none",
                      color: theme.mode === "light" ? "red" : "#FFF",
                      padding: "0px",
                      bottom: "0px",
                      borderRadius: "50%",
                      right: "1px",
                      fontSize: "0.6rem",
                      bottom: "-30px",
                      minWidth: "2em",
                      width: "auto",
                    }}
                    variant="contained"
                    className={classes.acceptButton}
                    size="small"
                    loading={loading}
                    onClick={(e) => handleCloseTicket(ticket.id)}
                  >
                    <Tooltip title={`${i18n.t("ticketsList.buttons.closed")}`}>
                      <HighlightOff />
                    </Tooltip>
                  </ButtonWithSpinner>
                )}
              </span>
              <span className={classes.secondaryContentSecond}>
                {(ticket.status === "pending" || ticket.status === "lgpd") &&
                  (user.userClosePendingTicket === "enabled" ||
                    user.profile === "admin") && (
                    <ButtonWithSpinner
                      style={{
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        border: "none",
                        color: theme.mode === "light" ? "red" : "#FFF",
                        padding: "0px",
                        bottom: "0px",
                        borderRadius: "50%",
                        right: "1px",
                        fontSize: "0.6rem",
                        bottom: "-30px",
                        minWidth: "2em",
                        width: "auto",
                      }}
                      variant="contained"
                      className={classes.acceptButton}
                      size="small"
                      loading={loading}
                      onClick={(e) => handleCloseIgnoreTicket(ticket.id)}
                    >
                      <Tooltip title={`${i18n.t("ticketsList.buttons.ignore")}`}>
                        <HighlightOff />
                      </Tooltip>
                    </ButtonWithSpinner>
                  )}
              </span>
              <span className={classes.secondaryContentSecond}>
                {ticket.status === "closed" &&
                  (ticket.queueId === null || ticket.queueId === undefined) && (
                    <ButtonWithSpinner
                      style={{
                        backgroundColor: "transparent",
                        boxShadow: "none",
                        border: "none",
                        color: theme.mode === "light" ? "orange" : "#FFF",
                        padding: "0px",
                        bottom: "0px",
                        borderRadius: "50%",
                        right: "1px",
                        fontSize: "0.6rem",
                        bottom: "-30px",
                        minWidth: "2em",
                        width: "auto",
                      }}
                      variant="contained"
                      className={classes.acceptButton}
                      size="small"
                      loading={loading}
                      onClick={(e) => handleOpenAcceptTicketWithouSelectQueue()}
                    >
                      <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                        <Replay />
                      </Tooltip>
                    </ButtonWithSpinner>
                  )}
              </span>
              <span className={classes.secondaryContentSecond}>
                {ticket.status === "closed" && ticket.queueId !== null && (
                  <ButtonWithSpinner
                    style={{
                      backgroundColor: "transparent",
                      boxShadow: "none",
                      border: "none",
                      color: theme.mode === "light" ? "orange" : "#FFF",
                      padding: "0px",
                      bottom: "0px",
                      borderRadius: "50%",
                      right: "1px",
                      fontSize: "0.6rem",
                      bottom: "-30px",
                      minWidth: "2em",
                      width: "auto",
                    }}
                    variant="contained"
                    className={classes.acceptButton}
                    size="small"
                    loading={loading}
                    onClick={(e) => handleAcepptTicket(ticket.id)}
                  >
                    <Tooltip title={`${i18n.t("ticketsList.buttons.reopen")}`}>
                      <Replay />
                    </Tooltip>
                  </ButtonWithSpinner>
                )}
              </span>
            </>
          )}
        </ListItemSecondaryAction>
      </ListItem>

      {/* Modal de Finalização de Venda */}
      {openFinalizacaoVenda && (
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
      )}

      {/* Modal de Opções de Finalização */}
      {showFinalizacaoOptions && (
        <Dialog
          open={showFinalizacaoOptions}
          onClose={() => setShowFinalizacaoOptions(false)}
          aria-labelledby="finalizacao-options-title"
        >
          <DialogTitle id="finalizacao-options-title">
            Como deseja finalizar?
          </DialogTitle>
          <DialogActions>
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

      {/* Modal da Imagem */}
      <Dialog
        open={imageModalOpen}
        onClose={handleImageModalClose}
        className={classes.imageModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent className={classes.imageModalContent}>
          <img 
            src={ticket?.contact?.urlPicture} 
            alt={ticket?.contact?.name || "Foto do contato"}
            className={classes.expandedImage}
          />
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

export default TicketListItemCustom;