import React, { useState, useEffect, useRef } from "react";
import { parseISO, format } from "date-fns";
import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import CircularProgress from "@material-ui/core/CircularProgress";
import Switch from "@material-ui/core/Switch";


import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { TagsContainer } from "../TagsContainer";
// import AsyncSelect from "../AsyncSelect";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	textField: {
		marginRight: theme.spacing(1),
		flex: 1,
	},

	extraAttr: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},

	btnWrapper: {
		position: "relative",
	},

	buttonProgress: {
		color: green[500],
		position: "absolute",
		top: "50%",
		left: "50%",
		marginTop: -12,
		marginLeft: -12,
	},


}));

const formatDateForInput = (date) => {
	if (!date) return '';
	const d = new Date(date);
	// Adicionar um dia para compensar o timezone
	d.setDate(d.getDate() + 1);
	return d.toISOString().split('T')[0];
  };
  
  const parseDateFromInput = (dateString) => {
	if (!dateString) return null;
	// Retornar apenas a data no formato YYYY-MM-DD
	return dateString;
  };

const ContactSchema = Yup.object().shape({
	name: Yup.string()
		.min(2, "Too Short!")
		.max(250, "Too Long!")
		.required("Required"),
	number: Yup.string().min(8, "Too Short!").max(50, "Too Long!"),
	email: Yup.string().email("Invalid email"),
});

const ContactModal = ({ open, onClose, contactId, initialValues, onSave }) => {
	const classes = useStyles();
	const isMounted = useRef(true);

	const initialState = {
		name: "",
		number: "",
		email: "",
		disableBot: false,
		lgpdAcceptedAt: "",
		birthDate: ""
	};

	const [contact, setContact] = useState(initialState);
	const [disableBot, setDisableBot] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [selectedQueue, setSelectedQueue] = useState(null);
	const [queues, setQueues] = useState([]);
	const [allQueues, setAllQueues] = useState([]);
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");


	useEffect(() => {
		return () => {
			isMounted.current = false;
		};
	}, []);

	useEffect(() => {
		if (!open || searchParam.length < 3) {
			setLoading(false);
			setSelectedQueue("");
			return;
		}
		const delayDebounceFn = setTimeout(() => {
			setLoading(true);
			const fetchUsers = async () => {
				try {
					const { data } = await api.get("/users/", {
						params: { searchParam },
					});
					setOptions(data.users);
					setLoading(false);
				} catch (err) {
					setLoading(false);
					toastError(err);
				}
			};

			fetchUsers();
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, [searchParam, open]);

	useEffect(() => {
		const fetchContact = async () => {
		  if (initialValues) {
			setContact(prevState => {
			  return { 
				...prevState, 
				...initialValues,
				// Formatar a data corretamente
				birthDate: formatDateForInput(initialValues.birthDate)
			  };
			});
		  }

			if (!contactId) return;

			try {
				const { data } = await api.get(`/contacts/${contactId}`);
				if (isMounted.current) {
					setContact({
						...data,
						birthDate: formatDateForInput(data.birthDate)
				});
					setDisableBot(data.disableBot)

					// Preenche automaticamente os campos de Wallet e Queue
					if (data.contactWallets && data.contactWallets.length > 0) {
						const wallet = data.contactWallets[0].wallet;
						const queue = data.contactWallets[0].queue;

						setSelectedUser({
							id: wallet.id,
							name: wallet.name,
						});
						setSelectedQueue(queue.id);

						// Atualiza as filas disponíveis no campo de seleção
						setQueues([{ id: queue.id, name: queue.name }]);
					} else {
						// Limpa os valores quando não há contactWallets
						setSelectedUser(null);
						setSelectedQueue(null);
						setQueues([]);
					}
				}
			} catch (err) {
				toastError(err);
			}
		};

		fetchContact();
	}, [contactId, open, initialValues]);

	const handleClose = () => {
		onClose();
		setContact(initialState);
		setSelectedUser(null);
		setSelectedQueue(null);
		setQueues([]);
	};

	const handleSaveContact = async values => {
		try {
		  // Preparar os dados com a data corretamente formatada
		  const contactData = {
			...values,
			disableBot: disableBot,
			birthDate: parseDateFromInput(values.birthDate)
		  };
	  
		  if (contactId) {
			if (!selectedUser && !selectedQueue) {
			  delete contact.contactWallets;
			  await api.delete(`/contacts/wallet/${contactId}`);
			}
	  
			const { contactWallets, ...valuesWithoutWallets } = contactData;
			delete contact.contactWallets;
	  
			await api.put(`/contacts/${contactId}`, contactData);
	  
			if (selectedUser && selectedQueue && selectedUser !== null && selectedQueue !== null) {
			  await api.put(`/contacts/wallet/${contactId}`, {
				wallets: {
				  userId: selectedUser.id,
				  queueId: selectedQueue,
				},
			  });
			}
	  
			handleClose();
	  
		  } else {
			delete contactData.contactWallets;
	  
			const { data } = await api.post("/contacts", contactData);
	  
			if (data.id && selectedUser && selectedQueue) {
			  await api.put(`/contacts/wallet/${data.id}`, {
				wallets: {
				  userId: selectedUser.id,
				  queueId: selectedQueue,
				},
			  });
			}
	  
			if (onSave) {
			  onSave(data);
			}
	  
			handleClose();
		  }
		  toast.success(i18n.t("contactModal.success"));
		} catch (err) {
		  toastError(err);
		}
	  };

	return (
		<div className={classes.root}>
			<Dialog open={open} onClose={handleClose} maxWidth="lg" scroll="paper">
				<DialogTitle id="form-dialog-title">
					{contactId
						? `${i18n.t("contactModal.title.edit")}`
						: `${i18n.t("contactModal.title.add")}`}
				</DialogTitle>
				<Formik
					initialValues={contact}
					enableReinitialize={true}
					validationSchema={ContactSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveContact(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ values, errors, touched, isSubmitting, setFieldValue }) => (
						<Form>
							<DialogContent dividers>
								<Typography variant="subtitle1" gutterBottom>
									{i18n.t("contactModal.form.mainInfo")}
								</Typography>
								<Field
									as={TextField}
									label={i18n.t("contactModal.form.name")}
									name="name"
									autoFocus
									error={touched.name && Boolean(errors.name)}
									helperText={touched.name && errors.name}
									variant="outlined"
									margin="dense"
									className={classes.textField}
								/>
								<Field
									as={TextField}
									label={i18n.t("contactModal.form.number")}
									name="number"
									error={touched.number && Boolean(errors.number)}
									helperText={touched.number && errors.number}
									placeholder="5513912344321"
									variant="outlined"
									margin="dense"
								/>
								<div>
									<Field
										as={TextField}
										label={i18n.t("contactModal.form.email")}
										name="email"
										error={touched.email && Boolean(errors.email)}
										helperText={touched.email && errors.email}
										placeholder="Email address"
										fullWidth
										margin="dense"
										variant="outlined"
									/>
								</div>
								<div>
  <Field
    as={TextField}
    label="Data de Nascimento"
    name="birthDate"
    type="date"
    InputLabelProps={{
      shrink: true,
    }}
    fullWidth
    margin="dense"
    variant="outlined"
    helperText="Data de nascimento para mensagens automáticas de aniversário"
  />
</div>

								<div>
									<TagsContainer contact={contact} className={classes.textField} />
								</div>

								<Grid item>
									<Typography
										variant="subtitle1"
										gutterBottom
										style={{ marginTop: 24, marginBottom: 8 }}
									>
										<b>{i18n.t("contactModal.form.assignWallet")}</b>
									</Typography>
								</Grid>
								{/* <div className={classes.blockCustomerField}> */}
								<Grid container spacing={2}>
									<Grid xs={12} sm={6} xl={6} item>
										<Autocomplete
											value={selectedUser}
											fullWidth
											getOptionLabel={(option) => `${option.name}`}
											onChange={(e, newValue) => {
												setSelectedUser(newValue);
												if (
													newValue != null &&
													Array.isArray(newValue.queues)
												) {
													if (newValue.queues.length === 1) {
														setSelectedQueue(newValue.queues[0].id);
													}
													setQueues(newValue.queues);
												} else {
													setQueues(allQueues);
													setSelectedQueue(null);
													setSelectedUser(null);
												}
											}}
											options={options}
											filterOptions={(options, { inputValue }) =>
												options.filter((option) =>
													option.name
														.toLowerCase()
														.includes(inputValue.toLowerCase())
												)
											}
											freeSolo
											autoHighlight
											noOptionsText={i18n.t("transferTicketModal.noOptions")}
											loading={loading}
											renderOption={(props, option) => (
												<li {...props}>
													<span style={{ marginLeft: 8 }}>{option.name}</span>
												</li>
											)}
											renderInput={(params) => (
												<TextField
													{...params}
													label={i18n.t("transferTicketModal.fieldLabel")}
													variant="outlined"
													onChange={(e) => setSearchParam(e.target.value)}
													InputProps={{
														...params.InputProps,
														endAdornment: (
															<React.Fragment>
																{loading ? (
																	<CircularProgress color="inherit" size={20} />
																) : null}
																{params.InputProps.endAdornment}
															</React.Fragment>
														),
													}}
												/>
											)}
										/>
									</Grid>

									<Grid xs={12} sm={6} xl={6} item>
										<FormControl variant="outlined" fullWidth>
											<InputLabel>
												{i18n.t("transferTicketModal.fieldQueueLabel")}
											</InputLabel>
											<Select
												value={selectedQueue}
												onChange={(e) => setSelectedQueue(e.target.value)}
												label={i18n.t(
													"transferTicketModal.fieldQueuePlaceholder"
												)}
											>
												{queues.map((queue) => (
													<MenuItem key={queue.id} value={queue.id}>
														{queue.name}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Grid>
								</Grid>

								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									<Switch
										size="small"
										checked={disableBot}
										onChange={() =>
											setDisableBot(!disableBot)
										}
										name="disableBot"
									/>
									{i18n.t("contactModal.form.chatBotContact")}
								</Typography>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.whatsapp")} {contact?.whatsapp ? contact?.whatsapp.name : ""}
								</Typography>
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.termsLGDP")} {contact?.lgpdAcceptedAt ? format(new Date(contact?.lgpdAcceptedAt), "dd/MM/yyyy 'às' HH:mm") : ""}
								</Typography>

								{/* <Typography variant="subtitle1" gutterBottom>{i18n.t("contactModal.form.customer_portfolio")}</Typography> */}
								{/* <div style={{ marginTop: 10 }}>
									<AsyncSelect url="/users" dictKey={"users"}
										initialValue={values.user} width="100%" label={i18n.t("contactModal.form.attendant")}
										onChange={(event, value) => setFieldValue("userId", value ? value.id : null)} />
								</div>
								<div style={{ marginTop: 10 }}>
									<AsyncSelect url="/queue" dictKey={null}
										initialValue={values.queue} width="100%" label={i18n.t("contactModal.form.queue")}
										onChange={(event, value) => setFieldValue("queueId", value ? value.id : null)} />
								</div> */}
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									{i18n.t("contactModal.form.extraInfo")}
								</Typography>

								<FieldArray name="extraInfo">
									{({ push, remove }) => (
										<>
											{values.extraInfo &&
												values.extraInfo.length > 0 &&
												values.extraInfo.map((info, index) => (
													<div
														className={classes.extraAttr}
														key={`${index}-info`}
													>
														<Field
															as={TextField}
															label={i18n.t("contactModal.form.extraName")}
															name={`extraInfo[${index}].name`}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
														<Field
															as={TextField}
															label={i18n.t("contactModal.form.extraValue")}
															name={`extraInfo[${index}].value`}
															variant="outlined"
															margin="dense"
															className={classes.textField}
														/>
														<IconButton
															size="small"
															onClick={() => remove(index)}
														>
															<DeleteOutlineIcon />
														</IconButton>
													</div>
												))}
											<div className={classes.extraAttr}>
												<Button
													style={{ flex: 1, marginTop: 8 }}
													variant="outlined"
													color="primary"
													onClick={() => push({ name: "", value: "" })}
												>
													{`+ ${i18n.t("contactModal.buttons.addExtraInfo")}`}
												</Button>
											</div>
										</>
									)}
								</FieldArray>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("contactModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{contactId
										? `${i18n.t("contactModal.buttons.okEdit")}`
										: `${i18n.t("contactModal.buttons.okAdd")}`}
									{isSubmitting && (
										<CircularProgress
											size={24}
											className={classes.buttonProgress}
										/>
									)}
								</Button>
							</DialogActions>
						</Form>
					)}
				</Formik>
			</Dialog>
		</div>
	);
};

export default ContactModal;
