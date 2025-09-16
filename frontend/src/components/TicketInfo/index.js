import React, { useState, useContext } from "react";
import { i18n } from "../../translate/i18n";
import { 
    Avatar, 
    CardHeader, 
    Grid,
    Dialog,
    DialogContent,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
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

const TicketInfo = ({ contact, ticket, onClick }) => {
    const classes = useStyles();
    const [amount, setAmount] = useState("");
    const { user } = useContext(AuthContext);
    const [imageModalOpen, setImageModalOpen] = useState(false); // Estado para o modal da imagem

    // Função para abrir modal da imagem
    const handleImageClick = (e) => {
        e.stopPropagation(); // Prevenir que o clique no avatar execute outros handlers
        if (contact?.urlPicture) {
            setImageModalOpen(true);
        }
    };

    // Função para fechar modal da imagem
    const handleImageModalClose = () => {
        setImageModalOpen(false);
    };

    const renderCardReader = () => {
        return (
            <CardHeader
                onClick={onClick}
                style={{ cursor: "pointer" }}
                titleTypographyProps={{ noWrap: true }}
                subheaderTypographyProps={{ noWrap: true }}
                avatar={
                    <Avatar 
                        src={contact?.urlPicture} 
                        alt="contact_image" 
                        className={classes.clickableAvatar}
                        onClick={handleImageClick}
                    />
                }
                title={`${contact?.name || '(sem contato)'} #${ticket?.id}`}
                subheader={[
                    ticket?.user && `${i18n.t("messagesList.header.assignedTo")} ${ticket?.user?.name}`,
                    contact?.contactWallets && contact.contactWallets.length > 0
                        ? `• ${i18n.t("wallets.wallet")}: ${contact.contactWallets[0].wallet?.name || 'N/A'}`
                        : null
                ].filter(Boolean).join(' ')}
            />
        );
    }

    const handleChange = (event) => {
        const value = event.target.value;
        setAmount(value);
    }

    return (
        <React.Fragment>
            <Grid container alignItems="center" spacing={10}>
                {/* Conteúdo do contato à esquerda */}
                <Grid item xs={6}>
                    {renderCardReader()}
                </Grid>
            </Grid>

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
                        src={contact?.urlPicture} 
                        alt={contact?.name || "Foto do contato"}
                        className={classes.expandedImage}
                    />
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
};

export default TicketInfo;