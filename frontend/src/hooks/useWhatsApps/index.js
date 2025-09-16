import { useState, useEffect, useReducer, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";

const reducer = (state, action) => {
  if (action.type === "LOAD_WHATSAPPS") {
    const whatsApps = action.payload;
    return [...whatsApps];
  }

  if (action.type === "UPDATE_WHATSAPPS") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex] = whatsApp;
      return [...state];
    } else {
      return [whatsApp, ...state];
    }
  }

  if (action.type === "UPDATE_SESSION") {
    const whatsApp = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsApp.id);

    if (whatsAppIndex !== -1) {
      state[whatsAppIndex].status = whatsApp.status;
      state[whatsAppIndex].updatedAt = whatsApp.updatedAt;
      state[whatsAppIndex].qrcode = whatsApp.qrcode;
      state[whatsAppIndex].retries = whatsApp.retries;
      return [...state];
    } else {
      return [...state];
    }
  }

  if (action.type === "DELETE_WHATSAPPS") {
    const whatsAppId = action.payload;
    const whatsAppIndex = state.findIndex((s) => s.id === whatsAppId);
    if (whatsAppIndex !== -1) {
      state.splice(whatsAppIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useWhatsApps = () => {
  const [whatsApps, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(true);
  const { user, socket } = useContext(AuthContext);

  // Effect para carregar os dados iniciais
  useEffect(() => {
    setLoading(true);
    const fetchSession = async () => {
      try {
        const { data } = await api.get("/whatsapp/?session=0");
        dispatch({ type: "LOAD_WHATSAPPS", payload: data });
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar WhatsApps:", err);
        setLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Effect para configurar os listeners do socket
  useEffect(() => {
    // Debug para entender o que está chegando
    console.log('useWhatsApps - Debug:', {
      userId: user?.id,
      companyId: user?.companyId,
      socket: socket,
      socketType: typeof socket,
      hasOnMethod: socket && typeof socket.on === 'function',
      hasOffMethod: socket && typeof socket.off === 'function'
    });

    if (user?.companyId && socket && typeof socket.on === 'function' && typeof socket.off === 'function') {
      const companyId = user.companyId;
      
      const onCompanyWhatsapp = (data) => {
        console.log('Recebido evento whatsapp:', data);
        if (data.action === "update") {
          dispatch({ type: "UPDATE_WHATSAPPS", payload: data.whatsapp });
        }
        if (data.action === "delete") {
          dispatch({ type: "DELETE_WHATSAPPS", payload: data.whatsappId });
        }
      };

      const onCompanyWhatsappSession = (data) => {
        console.log('Recebido evento whatsapp session:', data);
        if (data.action === "update") {
          dispatch({ type: "UPDATE_SESSION", payload: data.session });
        }
      };

      const whatsappEvent = `company-${companyId}-whatsapp`;
      const sessionEvent = `company-${companyId}-whatsappSession`;

      console.log('Registrando listeners WhatsApp:', { whatsappEvent, sessionEvent });

      socket.on(whatsappEvent, onCompanyWhatsapp);
      socket.on(sessionEvent, onCompanyWhatsappSession);

      return () => {
        if (socket && typeof socket.off === 'function') {
          console.log('Removendo listeners WhatsApp:', { whatsappEvent, sessionEvent });
          socket.off(whatsappEvent, onCompanyWhatsapp);
          socket.off(sessionEvent, onCompanyWhatsappSession);
        }
      };
    } else {
      console.log('Condições não atendidas para listeners WhatsApp:', {
        hasCompanyId: !!user?.companyId,
        hasSocket: !!socket,
        hasOnMethod: socket && typeof socket.on === 'function',
        hasOffMethod: socket && typeof socket.off === 'function'
      });
    }
  }, [socket, user?.companyId]); // Dependências corretas

  return { whatsApps, loading };
};

export default useWhatsApps;