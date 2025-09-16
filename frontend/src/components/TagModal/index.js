import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Colorize } from "@material-ui/icons";
import { ColorBox } from 'material-ui-color';

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Select } from "@material-ui/core";
import { Grid } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
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
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
	},
	colorAdorment: {
		width: 20,
		height: 20,
	},
}));

const TagSchema = Yup.object().shape({
	name: Yup.string()
		.min(3, "Mensagem muito curta")
		.required("Obrigatório")
});

const TagModal = ({ open, onClose, tagId, kanban }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
	const [lanes, setLanes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedLane, setSelectedLane] = useState(null);
	const [selectedRollbackLane, setSelectedRollbackLane] = useState(null);

	const initialState = {
		name: "",
		color: getRandomHexColor(),
		kanban: kanban || 0,
		timeLane: 0,
		nextLaneId: 0,
		greetingMessageLane: "",
		rollbackLaneId: 0,
	};

	const [formData, setFormData] = useState(initialState);

	useEffect(() => {
		const fetchLanes = async () => {
			try {
				const { data } = await api.get("/tags/", {
					params: { kanban: 1, tagId },
				});
				setLanes(data.tags);
				setLoading(false);
			} catch (err) {
				toastError(err);
				setLoading(false);
			}
		};

		if (open) {
			setLoading(true);
			fetchLanes();
		}
	}, [open, tagId]);

	useEffect(() => {
		const fetchTag = async () => {
			try {
				const { data } = await api.get(`/tags/${tagId}`);
				setFormData(prev => ({ ...initialState, ...data }));
				setSelectedLane(data.nextLaneId || null);
				setSelectedRollbackLane(data.rollbackLaneId || null);
			} catch (err) {
				toastError(err);
			}
		};

		if (open && tagId) {
			fetchTag();
		} else if (open) {
			setFormData(initialState);
			setSelectedLane(null);
			setSelectedRollbackLane(null);
		}
	}, [tagId, open]);

	const handleClose = () => {
		setFormData(initialState);
		setColorPickerModalOpen(false);
		setSelectedLane(null);
		setSelectedRollbackLane(null);
		onClose();
	};

	const handleSaveTag = async values => {
		const tagData = {
			...values,
			userId: user?.id,
			kanban: kanban,
			nextLaneId: selectedLane,
			rollbackLaneId: selectedRollbackLane
		};

		try {
			if (tagId) {
				await api.put(`/tags/${tagId}`, tagData);
			} else {
				await api.post("/tags", tagData);
			}
			toast.success(kanban === 0 ? i18n.t("tagModal.success") : i18n.t("tagModal.successKanban"));
			handleClose();
		} catch (err) {
			toastError(err);
		}
	};

	function getRandomHexColor() {
		// Gerar valores aleatórios para os componentes de cor
		const red = Math.floor(Math.random() * 256); // Valor entre 0 e 255
		const green = Math.floor(Math.random() * 256); // Valor entre 0 e 255
		const blue = Math.floor(Math.random() * 256); // Valor entre 0 e 255

		// Converter os componentes de cor em uma cor hexadecimal
		const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;

		return hexColor;
	}

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="md"
				fullWidth
				scroll="paper"
			>
				<DialogTitle>
					{tagId 
						? kanban === 0 
							? i18n.t("tagModal.title.edit")
							: i18n.t("tagModal.title.editKanban")
						: kanban === 0
							? i18n.t("tagModal.title.add")
							: i18n.t("tagModal.title.addKanban")
					}
				</DialogTitle>
				<Formik
					initialValues={formData}
					enableReinitialize={true}
					validationSchema={TagSchema}
					onSubmit={handleSaveTag}
				>
					{({ touched, errors, isSubmitting, values, handleChange }) => (
						<Form>
							<DialogContent dividers>
								<Grid container spacing={1}>
									<Grid item xs={12}>
										<Field
											as={TextField}
											label={i18n.t("tagModal.form.name")}
											name="name"
											fullWidth
											error={touched.name && Boolean(errors.name)}
											helperText={touched.name && errors.name}
											variant="outlined"
											margin="dense"
											autoFocus
										/>
									</Grid>
									<Grid item xs={12}>
										<Field
											as={TextField}
											label={i18n.t("tagModal.form.color")}
											name="color"
											fullWidth
											variant="outlined"
											margin="dense"
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<div
															style={{ backgroundColor: values.color }}
															className={classes.colorAdorment}
														/>
													</InputAdornment>
												),
												endAdornment: (
													<IconButton
														onClick={() => setColorPickerModalOpen(!colorPickerModalOpen)}
													>
														<Colorize />
													</IconButton>
												),
											}}
										/>
										{colorPickerModalOpen && (
											<ColorBox
												disableAlpha
												hslGradient={false}
												style={{ margin: '20px auto 0' }}
												value={values.color}
												onChange={val => {
													handleChange({
														target: {
															name: 'color',
															value: `#${val.hex}`
														}
													});
												}}
											/>
										)}
									</Grid>

									{kanban === 1 && (
										<>
											<Grid item xs={12} md={6}>
												<Field
													as={TextField}
													label={i18n.t("tagModal.form.timeLane")}
													name="timeLane"
													fullWidth
													variant="outlined"
													margin="dense"
													type="number"
												/>
											</Grid>
											<Grid item xs={12} md={6}>
												<FormControl
													variant="outlined"
													margin="dense"
													fullWidth
												>
													<InputLabel>
														{i18n.t("tagModal.form.nextLaneId")}
													</InputLabel>
													<Select
														value={selectedLane || ''}
														onChange={(e) => setSelectedLane(e.target.value)}
														label={i18n.t("tagModal.form.nextLaneId")}
													>
														<MenuItem value="">&nbsp;</MenuItem>
														{lanes.map((lane) => (
															<MenuItem key={lane.id} value={lane.id}>
																{lane.name}
															</MenuItem>
														))}
													</Select>
												</FormControl>
											</Grid>
											<Grid item xs={12}>
												<Field
													as={TextField}
													label={i18n.t("tagModal.form.greetingMessageLane")}
													name="greetingMessageLane"
													fullWidth
													multiline
													rows={4}
													variant="outlined"
													margin="dense"
												/>
											</Grid>
											<Grid item xs={12}>
												<FormControl
													variant="outlined"
													margin="dense"
													fullWidth
												>
													<InputLabel>
														{i18n.t("tagModal.form.rollbackLaneId")}
													</InputLabel>
													<Select
														value={selectedRollbackLane || ''}
														onChange={(e) => setSelectedRollbackLane(e.target.value)}
														label={i18n.t("tagModal.form.rollbackLaneId")}
													>
														<MenuItem value="">&nbsp;</MenuItem>
														{lanes.map((lane) => (
															<MenuItem key={lane.id} value={lane.id}>
																{lane.name}
															</MenuItem>
														))}
													</Select>
												</FormControl>
											</Grid>
										</>
									)}
								</Grid>
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("tagModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{tagId
										? i18n.t("tagModal.buttons.okEdit")
										: i18n.t("tagModal.buttons.okAdd")}
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

export default TagModal;
