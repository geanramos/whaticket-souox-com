import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";

import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import SearchIcon from "@material-ui/icons/Search";
import {
  AddCircle,
  Build,
  ContentCopy,
  DevicesFold,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  Pause,
} from "@mui/icons-material";

import {
  Button,
  CircularProgress,
  Stack,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Fab,
  useScrollTrigger,
  Slide,
  AppBar,
  Toolbar,
  Divider,
  Avatar,
} from "@mui/material";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import FlowBuilderModal from "../../components/FlowBuilderModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { SocketContext } from "../../context/Socket/SocketContext";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
  },
  mainContainer: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
  },
  
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 16,
    marginTop: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
  },
  
  header: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    borderRadius: 16,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    border: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      marginBottom: theme.spacing(2),
      borderRadius: 12,
    },
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    margin: 0,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.5rem',
    },
  },
  searchContainer: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 16,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    boxShadow: theme.shadows[1],
    border: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
      marginBottom: theme.spacing(2),
      borderRadius: 12,
    },
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
      borderRadius: 12,
      '& fieldset': {
        border: 'none',
      },
      '&:hover': {
        backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[700] : theme.palette.grey[100],
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.type === 'dark' 
          ? '0 0 0 3px rgba(144, 202, 249, 0.16)' 
          : '0 0 0 3px rgba(25, 118, 210, 0.12)',
      },
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      fontSize: '0.95rem',
    },
  },
  flowCard: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 16,
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.light,
    },
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(1.5),
      borderRadius: 12,
    },
  },
  flowCardContent: {
    padding: theme.spacing(3),
    '&:last-child': {
      paddingBottom: theme.spacing(3),
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      '&:last-child': {
        paddingBottom: theme.spacing(2),
      },
    },
  },
  flowIcon: {
    width: 48,
    height: 48,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      width: 40,
      height: 40,
      marginRight: theme.spacing(1.5),
    },
  },
  flowName: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    lineHeight: 1.4,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1rem',
    },
  },
  flowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1.5),
    },
  },
  statusChip: {
    fontWeight: 500,
    borderRadius: 8,
    '&.active': {
      backgroundColor: theme.palette.type === 'dark' ? '#1b5e20' : '#e8f5e8',
      color: theme.palette.type === 'dark' ? '#4caf50' : '#2e7d32',
      border: `1px solid ${theme.palette.type === 'dark' ? '#2e7d32' : '#c8e6c9'}`,
    },
    '&.inactive': {
      backgroundColor: theme.palette.type === 'dark' ? '#b71c1c' : '#ffebee',
      color: theme.palette.type === 'dark' ? '#f44336' : '#c62828',
      border: `1px solid ${theme.palette.type === 'dark' ? '#c62828' : '#ffcdd2'}`,
    },
  },
  actionButton: {
    minWidth: 40,
    width: 40,
    height: 40,
    borderRadius: 10,
    color: theme.palette.text.secondary,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.primary.main,
    },
    [theme.breakpoints.down('sm')]: {
      minWidth: 36,
      width: 36,
      height: 36,
    },
  },
  menuButton: {
    minWidth: 40,
    width: 40,
    height: 40,
    borderRadius: 10,
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.text.secondary,
    },
  },
  emptyState: {
    textAlign: 'center',
    padding: theme.spacing(6),
    backgroundColor: theme.palette.background.paper,
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(4),
    },
  },
  emptyIcon: {
    fontSize: 64,
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(2),
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  emptyDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.95rem',
  },
  addButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 12,
    padding: theme.spacing(1.5, 3),
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
    boxShadow: theme.shadows[3],
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.shadows[6],
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.2, 2.5),
    },
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    width: 64,
    height: 64,
    boxShadow: theme.shadows[6],
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.shadows[12],
    },
    [theme.breakpoints.down('sm')]: {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
      width: 56,
      height: 56,
    },
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
  },
  menu: {
    '& .MuiPaper-root': {
      borderRadius: 12,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: theme.shadows[8],
      minWidth: 180,
      backgroundColor: theme.palette.background.paper,
    },
    '& .MuiMenuItem-root': {
      padding: theme.spacing(1.5, 2),
      fontSize: '0.9rem',
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  },
}));

function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  
  return (
    <Slide appear={false} direction="up" in={!trigger}>
      {children}
    </Slide>
  );
}

function FlowCard({ flow, onEdit, onDuplicate, onDelete, onNavigate, classes }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    action();
  };

  const handleCardClick = (event) => {
    // Verifica se o clique foi em um botão de ação
    if (event.target.closest('button') || event.target.closest('[role="button"]')) {
      return;
    }
    onNavigate(flow.id);
  };

  const handleEditClick = (event) => {
    event.stopPropagation();
    onEdit();
  };

  const handleDuplicateClick = (event) => {
    event.stopPropagation();
    onDuplicate();
  };

  return (
    <Card className={classes.flowCard} onClick={handleCardClick}>
      <CardContent className={classes.flowCardContent}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <div className={classes.flowIcon}>
            <DevicesFold style={{ color: theme.palette.primary.contrastText, fontSize: isMobile ? 20 : 24 }} />
          </div>
          
          <Box flex={1}>
            <Typography className={classes.flowName}>
              {flow.name}
            </Typography>
            
            <div className={classes.flowActions}>
              <Chip
                size="small"
                label={flow.active ? "Ativo" : "Inativo"}
                className={`${classes.statusChip} ${flow.active ? 'active' : 'inactive'}`}
                icon={flow.active ? <PlayArrow /> : <Pause />}
              />
              
              <Box flex={1} />
              
              <IconButton
                className={classes.actionButton}
                onClick={handleEditClick}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
              
              <IconButton
                className={classes.actionButton}
                onClick={handleDuplicateClick}
                size="small"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
              
              <IconButton
                className={classes.menuButton}
                onClick={handleMenuOpen}
                size="small"
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </div>
          </Box>
        </Stack>
        
        <Menu
          className={classes.menu}
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAction(() => onNavigate(flow.id))}>
            <Build fontSize="small" style={{ marginRight: 12, color: theme.palette.text.secondary }} />
            Editar fluxo
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleAction(() => onDelete(flow.id))}>
            <Delete fontSize="small" style={{ marginRight: 12, color: theme.palette.error.main }} />
            Excluir fluxo
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}

const FlowBuilder = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWebhookName, setSelectedWebhookName] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const { user, socket } = useContext(AuthContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/flowbuilder");
          setWebhooks(data.flows);
          dispatch({ type: "LOAD_CONTACTS", payload: data.flows });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
          setLoading(false);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, reloadData]);

  useEffect(() => {
    const companyId = user.companyId;

    const onContact = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    };

    socket.on(`company-${companyId}-contact`, onContact);

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleEditContact = (contact) => {
    setSelectedContactId(contact.id);
    setSelectedWebhookName(contact.name);
    setContactModalOpen(true);
  };

  const handleDeleteWebhook = async (webhookId) => {
    try {
      await api.delete(`/flowbuilder/${webhookId}`).then((res) => {
        setDeletingContact(null);
        setReloadData((old) => !old);
      });
      toast.success("Fluxo excluído com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDuplicateFlow = async (flowId) => {
    try {
      await api
        .post(`/flowbuilder/duplicate`, { flowId: flowId })
        .then((res) => {
          setDeletingContact(null);
          setReloadData((old) => !old);
        });
      toast.success("Fluxo duplicado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const filteredWebhooks = webhooks.filter(webhook =>
    webhook.name.toLowerCase().includes(searchParam.toLowerCase())
  );

  return (
    <MainContainer className={classes.mainContainer}>
      {/* Modais - mantendo todos originais */}
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      
      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        flowId={selectedContactId}
        nameWebhook={selectedWebhookName}
        onSave={() => setReloadData((old) => !old)}
      />
      
      <ConfirmationModal
        title={
          deletingContact
            ? `Excluir fluxo "${deletingContact.name}"?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={(e) =>
          deletingContact ? handleDeleteWebhook(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Esta ação não pode ser desfeita. Todas as integrações relacionadas serão perdidas.`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      
      <ConfirmationModal
        title={
          deletingContact
            ? `Duplicar fluxo "${deletingContact.name}"?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmDuplicateOpen}
        onClose={setConfirmDuplicateOpen}
        onConfirm={(e) =>
          deletingContact ? handleDuplicateFlow(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Uma cópia do fluxo será criada para você editar.`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>

      {/* Header seguindo padrão da página Tags */}
      <MainHeader>
        <Title>Fluxos de Conversa ({webhooks.length})</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            className={classes.searchField}
            placeholder="Buscar fluxos..."
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenContactModal}
          >
            Novo Fluxo
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        {loading && !webhooks.length ? (
          <div className={classes.loadingContainer}>
            <CircularProgress style={{ color: theme.palette.primary.main }} />
          </div>
        ) : filteredWebhooks.length === 0 ? (
          <div className={classes.emptyState}>
            <DevicesFold className={classes.emptyIcon} />
            <Typography className={classes.emptyTitle}>
              {searchParam ? 'Nenhum fluxo encontrado' : 'Nenhum fluxo criado ainda'}
            </Typography>
            <Typography className={classes.emptyDescription}>
              {searchParam 
                ? 'Tente usar outros termos de pesquisa'
                : 'Crie seu primeiro fluxo de conversa para automatizar atendimentos'
              }
            </Typography>
            
            {!searchParam && (
              <Button
                className={classes.addButton}
                onClick={handleOpenContactModal}
                startIcon={<AddCircle />}
                style={{ marginTop: 24 }}
              >
                Criar Primeiro Fluxo
              </Button>
            )}
          </div>
        ) : (
          <Stack spacing={2}>
            {filteredWebhooks.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                classes={classes}
                onEdit={() => handleEditContact(flow)}
                onDuplicate={() => {
                  setDeletingContact(flow);
                  setConfirmDuplicateOpen(true);
                }}
                onDelete={() => {
                  setDeletingContact(flow);
                  setConfirmOpen(true);
                }}
                onNavigate={(id) => history.push(`/flowbuilder/${id}`)}
              />
            ))}

            {loading && webhooks.length > 0 && (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={24} style={{ color: theme.palette.primary.main }} />
              </Box>
            )}
          </Stack>
        )}
      </Paper>

      {isMobile && (
        <HideOnScroll>
          <Fab
            className={classes.fab}
            onClick={handleOpenContactModal}
            aria-label="Criar fluxo"
          >
            <AddCircle />
          </Fab>
        </HideOnScroll>
      )}
    </MainContainer>
  );
};

export default FlowBuilder;