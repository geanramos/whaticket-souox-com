import React, { useState, useCallback, useContext, useEffect, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import Hidden from "@material-ui/core/Hidden";
import { makeStyles } from "@material-ui/core/styles";
import TicketsManagerTabs from "../../components/TicketsManagerTabs";
import Ticket from "../../components/Ticket";

import { QueueSelectedProvider } from "../../context/QueuesSelected/QueuesSelectedContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import { CircularProgress } from "@material-ui/core";
import { getBackendUrl } from "../../config";
import logo from "../../assets/logo.png";
import logoDark from "../../assets/logo-black.png";

const defaultTicketsManagerWidth = 550;
const minTicketsManagerWidth = 404;
const maxTicketsManagerWidth = 700;

const useStyles = makeStyles((theme) => ({
	chatContainer: {
		flex: 1,
		padding: "2px",
		height: `calc(100% - 48px)`,
		overflowY: "hidden",
	},
	chatPapper: {
		display: "flex",
		height: "100%",
	},
	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflowY: "hidden",
		position: "relative",
		// Adicionar largura mínima como fallback
		minWidth: `${minTicketsManagerWidth}px`,
	},
	messagesWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		flexGrow: 1,
	},
	welcomeMsg: {
		background: theme.palette.tabHeaderBackground,
		display: "flex",
		justifyContent: "space-evenly",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
	},
	dragger: {
		width: "5px",
		cursor: "ew-resize",
		padding: "4px 0 0",
		borderTop: "1px solid #ddd",
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		zIndex: 100,
		backgroundColor: "#f4f7f9",
		userSelect: "none",
	},
	logo: {
		logo: theme.logo,
		content: "url(" + (theme.mode === "light" 
			? theme.calculatedLogoLight() 
			: theme.calculatedLogoDark()) + ")"
	},
}));

const TicketsCustom = () => {
	const { user } = useContext(AuthContext);
	
	// ⚠️ CORREÇÃO PRINCIPAL: Inicializar com largura padrão adequada
	const [ticketsManagerWidth, setTicketsManagerWidth] = useState(
		user?.defaultTicketsManagerWidth || defaultTicketsManagerWidth
	);
	
	const classes = useStyles({ ticketsManagerWidth });
	const { ticketId } = useParams();
	const ticketsManagerWidthRef = useRef(ticketsManagerWidth);

	// ⚠️ CORREÇÃO: useEffect mais robusto para inicialização
	useEffect(() => {
		// Definir largura baseada no usuário ou padrão
		const initialWidth = user?.defaultTicketsManagerWidth || defaultTicketsManagerWidth;
		
		// Garantir que a largura esteja dentro dos limites
		const validWidth = Math.max(
			minTicketsManagerWidth,
			Math.min(maxTicketsManagerWidth, initialWidth)
		);
		
		setTicketsManagerWidth(validWidth);
		ticketsManagerWidthRef.current = validWidth;
	}, [user]);

	const handleMouseDown = (e) => {
		document.addEventListener("mouseup", handleMouseUp, true);
		document.addEventListener("mousemove", handleMouseMove, true);
	};

	const handleSaveContact = async (value) => {
		// Garantir largura mínima antes de salvar
		const validValue = Math.max(minTicketsManagerWidth, value);
		
		try {
			await api.put(`/users/toggleChangeWidht/${user.id}`, { 
				defaultTicketsManagerWidth: validValue 
			});
		} catch (error) {
			console.error("Erro ao salvar largura:", error);
		}
	};

	const handleMouseMove = useCallback((e) => {
		const newWidth = e.clientX - document.body.offsetLeft;
		
		if (newWidth >= minTicketsManagerWidth && newWidth <= maxTicketsManagerWidth) {
			ticketsManagerWidthRef.current = newWidth;
			setTicketsManagerWidth(newWidth);
		}
	}, []);

	const handleMouseUp = async () => {
		document.removeEventListener("mouseup", handleMouseUp, true);
		document.removeEventListener("mousemove", handleMouseMove, true);

		const newWidth = ticketsManagerWidthRef.current;

		if (newWidth !== ticketsManagerWidth) {
			await handleSaveContact(newWidth);
		}
	};

	// ⚠️ CORREÇÃO: Garantir que a largura nunca seja 0 ou inválida
	const effectiveWidth = Math.max(minTicketsManagerWidth, ticketsManagerWidth);

	return (
		<QueueSelectedProvider>
			<div className={classes.chatContainer}>
				<div className={classes.chatPapper}>
					<div
						className={classes.contactsWrapper}
						style={{ 
							width: `${effectiveWidth}px`,
							// Adicionar fallbacks importantes
							minWidth: `${minTicketsManagerWidth}px`,
							maxWidth: `${maxTicketsManagerWidth}px`,
							// Garantir visibilidade
							opacity: effectiveWidth > 0 ? 1 : 0,
							visibility: effectiveWidth > 0 ? 'visible' : 'hidden'
						}}
					>
						<TicketsManagerTabs />
						<div 
							onMouseDown={handleMouseDown} 
							className={classes.dragger} 
						/>
					</div>
					<div className={classes.messagesWrapper}>
						{ticketId ? (
							<Ticket />
						) : (
							<Hidden only={["sm", "xs"]}>
								<Paper square variant="outlined" className={classes.welcomeMsg}>
									<span>
										<center>
											<img className={classes.logo} width="50%" alt="" />
										</center>
										{i18n.t("chat.noTicketMessage")}
									</span>
								</Paper>
							</Hidden>
						)}
					</div>
				</div>
			</div>
		</QueueSelectedProvider>
	);
};

export default TicketsCustom;