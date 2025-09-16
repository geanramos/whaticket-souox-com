import React, { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const FinalizacaoVendaModal = ({ open, onClose, ticket, onFinalizar }) => {
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [vendaConcluida, setVendaConcluida] = useState(true);
  const [valorVenda, setValorVenda] = useState("");
  const [motivoNaoVenda, setMotivoNaoVenda] = useState("");
  const [motivoFinalizacao, setMotivoFinalizacao] = useState("");
  const [motivosFinalizacao, setMotivosFinalizacao] = useState([]);
  const [informarValorVenda, setInformarValorVenda] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [ticketDataToFinalize, setTicketDataToFinalize] = useState(null);

  const handleClose = () => {
    onClose();
    setVendaConcluida(true);
    setValorVenda("");
    setMotivoNaoVenda("");
    setMotivoFinalizacao("");
  };

  useEffect(() => {
    if (open) {
      setLoadingConfig(true);
      Promise.all([fetchMotivosFinalizacao(), fetchCompanySettings()]).then(
        () => setLoadingConfig(false)
      );
    }
  }, [open]);

  const fetchMotivosFinalizacao = async () => {
    try {
      const { data } = await api.get("/ticketFinalizationReasons");
      setMotivosFinalizacao(data);
    } catch (err) {
      console.error("Erro ao buscar motivos de finalização:", err);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const { data } = await api.get("/companySettings");
      setInformarValorVenda(data.informarValorVenda || false);
    } catch (err) {
      console.error("Erro ao buscar configurações da empresa:", err);
    }
  };

  const handleSubmit = async () => {
    if (informarValorVenda) {
      // Check ativado: lógica antiga
      if (vendaConcluida) {
        if (!valorVenda) {
          toast.error("Por favor, informe o valor da venda.");
          return;
        }
      } else {
        if (!motivoNaoVenda) {
          toast.error("Por favor, selecione o motivo da não venda.");
          return;
        }
      }
    } else {
      // Check desativado: só motivo de finalização
      if (!motivoFinalizacao) {
        toast.error("Por favor, selecione o motivo da finalização.");
        return;
      }
    }

    // Em vez de finalizar aqui, apenas passa os dados para o pai
    const ticketData = {
      status: "closed",
      userId: user?.id || null,
      // sendFarewellMessage e finalizacaoMessage serão definidos no modal seguinte
    };

    if (informarValorVenda) {
      ticketData.finalizadoComVenda = vendaConcluida;
      if (vendaConcluida) {
        ticketData.valorVenda = parseFloat(valorVenda);
        ticketData.motivoNaoVenda = null;
        ticketData.motivoFinalizacao = null;
      } else {
        ticketData.valorVenda = null;
        ticketData.motivoNaoVenda = motivoNaoVenda;
        ticketData.motivoFinalizacao = null;
      }
    } else {
      ticketData.finalizadoComVenda = null;
      ticketData.valorVenda = null;
      ticketData.motivoNaoVenda = null;
      ticketData.motivoFinalizacao = motivoFinalizacao;
    }

    // Chama o callback passando os dados
    if (onFinalizar) onFinalizar(ticketData);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Finalização de Atendimento - Valor de Venda</DialogTitle>
      {loadingConfig ? (
        <DialogContent>
          <Typography>Carregando configurações...</Typography>
        </DialogContent>
      ) : (
        <DialogContent>
          <Grid container spacing={2}>
            {informarValorVenda ? (
              <>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">
                      A venda foi concluída?
                    </FormLabel>
                    <RadioGroup
                      value={vendaConcluida}
                      onChange={(e) =>
                        setVendaConcluida(e.target.value === "true")
                      }
                    >
                      <FormControlLabel
                        value={true}
                        control={<Radio />}
                        label="Sim, venda concluída"
                      />
                      <FormControlLabel
                        value={false}
                        control={<Radio />}
                        label="Não, venda não concluída"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                {vendaConcluida ? (
                  <Grid item xs={12}>
                    <TextField
                      label="Valor da Venda (R$)"
                      type="number"
                      value={valorVenda}
                      onChange={(e) => setValorVenda(e.target.value)}
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      inputProps={{
                        step: "0.01",
                        min: "0",
                      }}
                      placeholder="0,00"
                    />
                  </Grid>
                ) : (
                  <Grid item xs={12}>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      required
                    >
                      <InputLabel>Motivo da Não Venda *</InputLabel>
                      <Select
                        value={motivoNaoVenda}
                        onChange={(e) => setMotivoNaoVenda(e.target.value)}
                        label="Motivo da Não Venda *"
                      >
                        <MenuItem value="">
                          <em>Selecione um motivo</em>
                        </MenuItem>
                        {motivosFinalizacao.map((motivo) => (
                          <MenuItem key={motivo.id} value={motivo.name}>
                            {motivo.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </>
            ) : (
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  required
                >
                  <InputLabel>Motivo da Finalização *</InputLabel>
                  <Select
                    value={motivoFinalizacao}
                    onChange={(e) => setMotivoFinalizacao(e.target.value)}
                    label="Motivo da Finalização *"
                  >
                    <MenuItem value="">
                      <em>Selecione um motivo</em>
                    </MenuItem>
                    {motivosFinalizacao.map((motivo) => (
                      <MenuItem key={motivo.id} value={motivo.name}>
                        {motivo.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || loadingConfig}
        >
          {loading ? "Finalizando..." : "Finalizar Atendimento"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinalizacaoVendaModal;
