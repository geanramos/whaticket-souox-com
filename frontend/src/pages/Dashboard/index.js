import React, { useContext, useState, useEffect } from "react";

import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
// import {  Button, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
import { IconButton } from "@mui/material";
import { Groups, SaveAlt } from "@mui/icons-material";

import CallIcon from "@material-ui/icons/Call";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import FilterListIcon from "@material-ui/icons/FilterList";
import ClearIcon from "@material-ui/icons/Clear";
import SendIcon from "@material-ui/icons/Send";
import MessageIcon from "@material-ui/icons/Message";
import AccessAlarmIcon from "@material-ui/icons/AccessAlarm";
import TimerIcon from "@material-ui/icons/Timer";
import * as XLSX from "xlsx";
import CheckCircleOutlineIcon from "@material-ui/icons/RecordVoiceOver";
import ErrorOutlineIcon from "@material-ui/icons/RecordVoiceOver";

import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import MainContainer from "../../components/MainContainer";
import TabPanel from "../../components/TabPanel";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { isArray } from "lodash";

import { AuthContext } from "../../context/Auth/AuthContext";

import useDashboard from "../../hooks/useDashboard";
import useContacts from "../../hooks/useContacts";
import useMessages from "../../hooks/useMessages";
import { ChatsUser } from "./ChartsUser";

import Filters from "./Filters";
import { isEmpty } from "lodash";
import moment from "moment";
import { ChartsDate } from "./ChartsDate";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  SvgIcon,
  Tab,
  Tabs,
  LinearProgress,
  Box,
} from "@mui/material";
import { i18n } from "../../translate/i18n";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import ForbiddenPage from "../../components/ForbiddenPage";
import { ArrowDownward, ArrowUpward } from "@material-ui/icons";

const useStyles = makeStyles((theme) => ({
  overline: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: theme.palette.text.secondary,
    letterSpacing: "0.5px",
    lineHeight: 2.5,
    textTransform: "uppercase",
    fontFamily: "'Plus Jakarta Sans', sans-serif'",
  },
  h4: {
    fontFamily: "'Plus Jakarta Sans', sans-serif'",
    fontWeight: 500,
    fontSize: "2rem",
    lineHeight: 1,
    color: theme.palette.text.primary,
  },
  tab: {
    minWidth: "auto",
    width: "auto",
    padding: theme.spacing(0.5, 1),
    borderRadius: 8,
    transition: "0.3s",
    borderWidth: "1px",
    borderStyle: "solid",
    marginRight: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),

    [theme.breakpoints.down("lg")]: {
      fontSize: "0.9rem",
      padding: theme.spacing(0.4, 0.8),
      marginRight: theme.spacing(0.4),
      marginLeft: theme.spacing(0.4),
    },
    [theme.breakpoints.down("md")]: {
      fontSize: "0.8rem",
      padding: theme.spacing(0.3, 0.6),
      marginRight: theme.spacing(0.3),
      marginLeft: theme.spacing(0.3),
    },
    "&:hover": {
      backgroundColor: "rgba(6, 81, 131, 0.3)",
    },
    "&$selected": {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.main,
    },
  },
  tabIndicator: {
    borderWidth: "2px",
    borderStyle: "solid",
    height: 6,
    bottom: 0,
    color:
      theme.palette.mode === "light"
        ? theme.palette.primary.main
        : theme.palette.primary.contrastText,
  },
  container: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  nps: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.padding,
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles,
  },
  cardAvatar: {
    fontSize: "55px",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: theme.palette.primary.main,
  },
  cardSubtitle: {
    color: theme.palette.text.secondary,
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
  iframeDashboard: {
    width: "100%",
    height: "calc(100vh - 64px)",
    border: "none",
  },
  customFixedHeightPaperLg: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: "100%",
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  mainPaper: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
    backgroundColor: "transparent !important",
    borderRadius: "10px",
  },
  paper: {
    padding: theme.spacing(2),
    borderRadius: 12,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
  },
  barContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1),
  },
  progressBar: {
    flex: 1,
    marginRight: theme.spacing(1),
    borderRadius: 5,
    height: 10,
  },
  progressLabel: {
    minWidth: 50,
    textAlign: "right",
    fontWeight: 500,
    color: theme.palette.mode === "light" ? theme.palette.text.secondary : theme.palette.text.primary,
  },
  infoCard: {
    padding: theme.spacing(2),
    textAlign: "center",
    borderRadius: 12,
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.background.paper,
    marginBottom: theme.spacing(2),
  },
  infoIcon: {
    fontSize: "2rem",
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
  },
}));

const Dashboard = () => {
  const theme = useTheme();
  const classes = useStyles();
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DD")
  );
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const { find } = useDashboard();

  //FILTROS NPS
  const [tab, setTab] = useState("Indicadores");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedQueues, setSelectedQueues] = useState([]);

  let newDate = new Date();
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let nowIni = `${year}-${month < 10 ? `0${month}` : `${month}`}-01`;

  let now = `${year}-${month < 10 ? `0${month}` : `${month}`
    }-${date < 10 ? `0${date}` : `${date}`}`;

  const [showFilter, setShowFilter] = useState(false);
  const [dateStartTicket, setDateStartTicket] = useState(nowIni);
  const [dateEndTicket, setDateEndTicket] = useState(now);
  const [queueTicket, setQueueTicket] = useState(false);
  const [fetchDataFilter, setFetchDataFilter] = useState(false);

  const { user } = useContext(AuthContext);

  const exportarGridParaExcel = () => {
    const ws = XLSX.utils.table_to_sheet(
      document.getElementById("grid-attendants")
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RelatorioDeAtendentes");
    XLSX.writeFile(wb, "relatorio-de-atendentes.xlsx");
  };

  var userQueueIds = [];

  if (user.queues && user.queues.length > 0) {
    userQueueIds = user.queues.map((q) => q.id);
  }

  useEffect(() => {
    let isMounted = true;
    
    async function firstLoad() {
      if (isMounted) {
        console.log('Executando firstLoad...');
        await fetchData();
      }
    }
    
    const timeoutId = setTimeout(() => {
      firstLoad();
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDataFilter]);

  async function fetchData() {
    setLoading(true);
    console.log('Iniciando fetchData...');
  
    let params = {};
  
    // Construir parâmetros de filtro
    if (period > 0) {
      params = {
        days: period,
      };
      console.log('Usando filtro por dias:', period);
    } else {
      // Se não há período específico, usar as datas
      if (!isEmpty(dateStartTicket) && moment(dateStartTicket).isValid()) {
        params = {
          ...params,
          date_from: moment(dateStartTicket).format("YYYY-MM-DD"),
        };
        console.log('Data de início:', dateStartTicket);
      }
  
      if (!isEmpty(dateEndTicket) && moment(dateEndTicket).isValid()) {
        params = {
          ...params,
          date_to: moment(dateEndTicket).format("YYYY-MM-DD"),
        };
        console.log('Data de fim:', dateEndTicket);
      }
    }
  
    // Se nenhum parâmetro foi definido, usar período padrão de 30 dias
    if (Object.keys(params).length === 0) {
      console.log('Nenhum filtro definido, usando 30 dias como padrão');
      params = { days: 30 };
    }
  
    console.log('Parâmetros finais para busca:', params);
  
    try {
      const data = await find(params);
      console.log('Dados recebidos no componente:', data);
  
      // Garantir que counters sempre tenha valores válidos
      const safeCounters = data.counters || {};
      
      // Verificar especificamente o campo tickets
      console.log('Campo tickets recebido:', safeCounters.tickets);
      
      setCounters(safeCounters);
      
      if (isArray(data.attendants)) {
        setAttendants(data.attendants);
      } else {
        console.warn('Attendants não é um array:', data.attendants);
        setAttendants([]);
      }
  
      console.log('Estado atualizado - Counters:', safeCounters);
      console.log('Estado atualizado - Attendants:', data.attendants);
      
      // Log específico para verificar se o campo tickets está presente
      console.log('Valor de tickets no estado:', safeCounters.tickets);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do dashboard');
      
      // Definir valores padrão em caso de erro
      setCounters({
        avgSupportTime: 0,
        avgWaitTime: 0,
        supportFinished: 0,
        supportHappening: 0,
        supportPending: 0,
        supportGroups: 0,
        leads: 0,
        activeTickets: 0,
        passiveTickets: 0,
        tickets: 0,
        waitRating: 0,
        withoutRating: 0,
        withRating: 0,
        percRating: 0,
        npsPromotersPerc: 0,
        npsPassivePerc: 0,
        npsDetractorsPerc: 0,
        npsScore: 0
      });
      setAttendants([]);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);
    setSelectedUsers(users);
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  function formatTime(minutes) {
    return moment().startOf("day").add(minutes, "minutes").format("HH[h] mm[m]");
  }

  const GetUsers = () => {
    let count;
    let userOnline = 0;
    attendants.forEach((user) => {
      if (user.online === true) {
        userOnline = userOnline + 1;
      }
    });
    count = userOnline === 0 ? 0 : userOnline;
    return count;
  };

  const GetContacts = (all) => {
    let props = {};
    if (all) {
      props = {};
    } else {
      props = {
        dateStart: dateStartTicket,
        dateEnd: dateEndTicket,
      };
    }
    const { count } = useContacts(props);
    return count;
  };

  const GetMessages = (all, fromMe) => {
    let props = {};
    if (all) {
      if (fromMe) {
        props = {
          fromMe: true,
        };
      } else {
        props = {
          fromMe: false,
        };
      }
    } else {
      if (fromMe) {
        props = {
          fromMe: true,
          dateStart: dateStartTicket,
          dateEnd: dateEndTicket,
        };
      } else {
        props = {
          fromMe: false,
          dateStart: dateStartTicket,
          dateEnd: dateEndTicket,
        };
      }
    }
    const { count } = useMessages(props);
    return count;
  };

  function toggleShowFilter() {
    setShowFilter(!showFilter);
  }

  return (
    <>
      {user.profile === "user" && user.showDashboard === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <MainContainer>
          <Paper
            className={classes.mainPaper}
            variant="outlined"
          >
            <Container maxWidth={false} className={classes.container} style={{ padding: '16px 8px', maxWidth: '100%', overflowX: 'hidden' }}>
              <Grid2 container spacing={2} className={classes.container} style={{ margin: 0, width: '100%' }}>
                {/* FILTROS */}
                <Grid2 xs={12} container justifyContent="flex-end">
                  <Button
                    onClick={toggleShowFilter}
                    color="primary"
                    startIcon={!showFilter ? <FilterListIcon /> : <ClearIcon />}
                  >
                    {showFilter ? "Ocultar Filtros" : "Mostrar Filtros"}
                  </Button>
                </Grid2>

                {showFilter && (
                  <Grid2 item xs={12} style={{ marginBottom: "20px" }}>
                    <Filters
                      classes={classes}
                      setDateStartTicket={setDateStartTicket}
                      setDateEndTicket={setDateEndTicket}
                      dateStartTicket={dateStartTicket}
                      dateEndTicket={dateEndTicket}
                      setQueueTicket={setQueueTicket}
                      queueTicket={queueTicket}
                      fetchData={setFetchDataFilter}
                    />
                  </Grid2>
                )}
                
                {/* Indicadores Gerais */}
                <Grid2 item xs={12} style={{ marginTop: '20px', paddingLeft: '4px' }}>
                  <Typography variant="h5" style={{ marginBottom: '10px', color: theme.palette.primary.main }}>Indicadores</Typography>
                </Grid2>
                {[
                  { label: "Em Atendimento", value: counters.supportHappening || 0, icon: <CallIcon style={{ color: "#01BBAC" }} /> },
                  { label: "Aguardando", value: counters.supportPending || 0, icon: <HourglassEmptyIcon style={{ color: "#47606e" }} /> },
                  { label: "Finalizados", value: counters.supportFinished || 0, icon: <CheckCircleIcon style={{ color: "#5852ab" }} /> },
                  { label: "Grupos", value: counters.supportGroups || 0, icon: <Groups style={{ color: "#01BBAC" }} /> },
                  { label: "Atendentes Ativos", value: `${GetUsers()}/${attendants.length}`, icon: <RecordVoiceOverIcon style={{ color: "#805753" }} /> },
                  { label: "Novos Contatos", value: counters.leads || 0, icon: <GroupAddIcon style={{ color: "#8c6b19" }} /> },
                  { label: "Mensagens Recebidas", value: `${GetMessages(false, false)}/${GetMessages(true, false)}`, icon: <MessageIcon style={{ color: "#333133" }} /> },
                  { label: "Mensagens Enviadas", value: `${GetMessages(false, true)}/${GetMessages(true, true)}`, icon: <SendIcon style={{ color: "#558a59" }} /> },
                  { label: "T.M. de Atendimento", value: formatTime(counters.avgSupportTime), icon: <AccessAlarmIcon style={{ color: "#F79009" }} /> },
                  { label: "T.M. de Espera", value: formatTime(counters.avgWaitTime), icon: <TimerIcon style={{ color: "#8a2c40" }} /> },
                  { label: "Tickets Ativos", value: counters.activeTickets || 0, icon: <ArrowUpward style={{ color: "#EE4512" }} /> },
                  { label: "Tickets Passivos", value: counters.passiveTickets || 0, icon: <ArrowDownward style={{ color: "#28C037" }} /> },
                ].map((indicator, index) => (
                  <Grid2 item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Paper className={classes.paper}>
                      <Box display="flex" alignItems="center">
                        {indicator.icon}
                        <Box ml={2}>
                          <Typography variant="h6">{indicator.value}</Typography>
                          <Typography variant="body2">{indicator.label}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid2>
                ))}

                {/* Pesquisa de Satisfação (NPS) */}
                <Grid2 item xs={12} style={{ marginTop: '40px', paddingLeft: '4px' }}>
                  <Typography variant="h5" style={{ marginBottom: '10px', color: theme.palette.primary.main }}>Pesquisa de satisfação</Typography>
                </Grid2>
                {["Score", "Promotores", "Neutros", "Detratores"].map((label, index) => (
                  <Grid2 item xs={12} md={6} lg={3} key={index}>
                    <Paper className={classes.paper}>
                      <Box className={classes.barContainer}>
                        <Typography className={classes.progressLabel}>{label}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={
                            label === "Score" ? counters.npsScore || 0 :
                              label === "Promotores" ? counters.npsPromotersPerc || 0 :
                                label === "Neutros" ? counters.npsPassivePerc || 0 :
                                  counters.npsDetractorsPerc || 0
                          }
                          className={classes.progressBar}
                          style={{
                            backgroundColor:
                              label === "Promotores" ? "#2EA85A" :
                                label === "Neutros" ? "#F7EC2C" :
                                  label === "Detratores" ? "#F73A2C" : "#000",
                          }}
                        />
                        <Typography className={classes.progressLabel}>{
                          label === "Score" ? counters.npsScore || 0 :
                            label === "Promotores" ? counters.npsPromotersPerc || 0 :
                              label === "Neutros" ? counters.npsPassivePerc || 0 :
                                counters.npsDetractorsPerc || 0
                        }%</Typography>
                      </Box>
                    </Paper>
                  </Grid2>
                ))}

                {/* Informações de Atendimento */}
                <Grid2 item xs={12} style={{ marginTop: '40px', paddingLeft: '4px' }}>
                  <Typography variant="h5" style={{ marginBottom: '10px', color: theme.palette.primary.main }}>Atendimentos</Typography>
                </Grid2>
                {[
                  { label: "Total de Atendimentos", value: counters.tickets || 0, icon: <CallIcon style={{ color: '#01BBAC' }} /> },
                  { label: "Atendimentos aguardando avaliação", value: counters.waitRating || 0, icon: <HourglassEmptyIcon style={{ color: '#47606e' }} /> },
                  { label: "Atendimentos sem avaliação", value: counters.withoutRating || 0, icon: <ErrorOutlineIcon style={{ color: '#8a2c40' }} /> },
                  { label: "Atendimentos avaliados", value: counters.withRating || 0, icon: <CheckCircleOutlineIcon style={{ color: '#805753' }} /> },
                ].map((attInfo, index) => (
                  <Grid2 item xs={12} sm={6} md={3} key={index}>
                    <Paper className={classes.infoCard} style={{ height: '100%' }}>
                      <Box display="flex" alignItems="center">
                        {attInfo.icon}
                        <Box ml={2}>
                          <Typography variant="h6">{attInfo.value}</Typography>
                          <Typography variant="body2">{attInfo.label}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid2>
                ))}

                {/* Índice de Avaliação */}
                <Grid2 item xs={12} style={{ marginTop: '40px', paddingLeft: '4px', paddingRight: '4px' }}>
                  <Typography variant="h6" style={{ marginBottom: '15px', color: theme.palette.primary.main }}>Índice de avaliação</Typography>
                  <Grid2 container alignItems="center" spacing={2}>
                    <Grid2 item xs={12} sm={2}>
                      <Paper className={classes.infoCard} style={{ textAlign: 'center', padding: '8px', backgroundColor: '#FFE3B3' }}>
                        <Typography variant="h6" style={{ color: '#F79009' }}>
                          {Number(counters.percRating / 100).toLocaleString(undefined, { style: 'percent' }) || "0%"}
                        </Typography>
                      </Paper>
                    </Grid2>
                    <Grid2 item xs={12} sm={10}>
                      <LinearProgress
                        variant="determinate"
                        value={counters.percRating || 0}
                        className={classes.progressBar}
                        style={{ backgroundColor: "#e0e0e0", height: 10, borderRadius: 5 }}
                      />
                    </Grid2>
                  </Grid2>
                </Grid2>

                {/* Tabela de Atendentes */}
                <Grid2 item xs={12} style={{ marginTop: '40px', paddingLeft: '4px' }}>
                  <Typography variant="h5" style={{ marginBottom: '10px', color: theme.palette.primary.main }}>Atendentes</Typography>
                  <Paper className={classes.paper}>
                    <TableAttendantsStatus
                      attendants={attendants}
                      loading={loading}
                    />
                  </Paper>
                </Grid2>

                {/* Gráficos */}
                <Grid2 container spacing={3} item xs={12}>
                  <Grid2 item xs={12} md={6}>
                    <Paper className={classes.paper} style={{ marginBottom: "16px" }}>
                      <ChatsUser />
                    </Paper>
                  </Grid2>
                  <Grid2 item xs={12} md={6}>
                    <Paper className={classes.paper}>
                      <ChartsDate />
                    </Paper>
                  </Grid2>
                </Grid2>
              </Grid2>
            </Container>
          </Paper>
        </MainContainer>
      )}
    </>
  );
};

export default Dashboard;