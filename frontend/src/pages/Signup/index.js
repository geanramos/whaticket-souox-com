import React, { useState, useEffect } from "react";
import qs from 'query-string'

import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";

import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import usePlans from '../../hooks/usePlans';
import { i18n } from "../../translate/i18n";
import { FormControl } from "@material-ui/core";
import { InputLabel, MenuItem, Select } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";

import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import useSettings from "../../hooks/useSettings";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
    // Root da página - forçar centralização
    root: {
        width: "100vw !important",
        height: "100vh !important",
        display: "flex !important",
        alignItems: "center !important",
        justifyContent: "center !important",
        padding: "20px 0 !important",
        margin: "0 !important",
        boxSizing: "border-box !important",
        overflow: "auto !important", // Permitir scroll se necessário
        background: theme.palette.background.default,
    },
    // Container específico para signup - forçar centralização
    containerSignup: {
        padding: "16px !important",
        maxWidth: "500px !important", // Signup é um pouco maior que login
        width: "auto !important",
        margin: "0 auto !important",
        position: "relative !important",
        left: "auto !important",
        right: "auto !important",
        transform: "none !important",
        flex: "none !important",
    },
    paper: {
        marginTop: theme.spacing(2),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
        maxWidth: "480px !important",
        width: "100% !important",
        margin: "0 auto !important",
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: "100%",
        marginTop: theme.spacing(3),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

const UserSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    companyName: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    document: Yup.string()
        .test('document-format', 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos', function(value) {
            if (!value) return false;
            const numbers = value.replace(/\D/g, '');
            return numbers.length === 11 || numbers.length === 14;
        })
        .required("CPF ou CNPJ é obrigatório"),
    password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
    email: Yup.string().email("Invalid email").required("Required"),
    phone: Yup.string().required("Required"),
});

const SignUp = () => {
    const classes = useStyles();
    const history = useHistory();
    const { getPlanList } = usePlans()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(false);
    const [validatingCnpj, setValidatingCnpj] = useState(false);
    const [lastValidatedDocument, setLastValidatedDocument] = useState("");
    const { getPublicSetting } = useSettings();

    let companyId = null
    const params = qs.parse(window.location.search)
    if (params.companyId !== undefined) {
        companyId = params.companyId
    }

    const initialState = { name: "", email: "", password: "", phone: "", companyId, companyName: "", document: "", planId: "" };

    const [user] = useState(initialState);

    useEffect(() => {
        getPublicSetting("userCreation")
            .then((data) => {
                if (data === "disabled") {
                    toast.error(i18n.t("signup.toasts.disabled"));
                    history.push("/login");
                }
            })
            .catch((error) => {
                console.log("Error reading setting", error);
            });
    }, []);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            const planList = await getPlanList({ listPublic: "false" });

            setPlans(planList);
            setLoading(false);
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Função para validar CPF
    const validateCpf = (cpf) => {
        // Remove caracteres não numéricos
        const cleanCpf = cpf.replace(/\D/g, '');
        
        // Verifica se tem 11 dígitos
        if (cleanCpf.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
        
        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
        
        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
        
        return true;
    };

    // Função para formatar CPF
    const formatCpf = (value) => {
        const numbers = value.replace(/\D/g, '');
        const limitedNumbers = numbers.slice(0, 11);
        
        if (limitedNumbers.length <= 3) return limitedNumbers;
        if (limitedNumbers.length <= 6) return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
        if (limitedNumbers.length <= 9) return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`;
        return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9)}`;
    };

    // Função para formatar CNPJ
    const formatCnpj = (value) => {
        const numbers = value.replace(/\D/g, '');
        const limitedNumbers = numbers.slice(0, 14);
        
        if (limitedNumbers.length <= 2) return limitedNumbers;
        if (limitedNumbers.length <= 5) return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2)}`;
        if (limitedNumbers.length <= 8) return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5)}`;
        if (limitedNumbers.length <= 12) return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8)}`;
        return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8, 12)}-${limitedNumbers.slice(12)}`;
    };

    // Função para detectar se é CPF ou CNPJ
    const detectDocumentType = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) return 'cpf';
        return 'cnpj';
    };

    // Função para formatar documento (CPF ou CNPJ)
    const formatDocument = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 11) {
            return formatCpf(value);
        } else {
            return formatCnpj(value);
        }
    };

    const validateDocument = async (document, setFieldValue) => {
        const cleanDocument = document.replace(/\D/g, '');
        
        // Evitar validação duplicada
        if (lastValidatedDocument === cleanDocument) {
            return true;
        }
        
        const documentType = detectDocumentType(document);
        
        if (documentType === 'cpf') {
            // Validação local do CPF
            if (validateCpf(document)) {
                setLastValidatedDocument(cleanDocument);
                toast.success("CPF válido!");
                return true;
            } else {
                setLastValidatedDocument(cleanDocument);
                toast.error("CPF inválido!");
                return false;
            }
        } else {
            // Validação do CNPJ na Receita Federal
            if (cleanDocument.length !== 14) return false;
            
            setValidatingCnpj(true);
            try {
                const response = await openApi.post("/auth/validate-cnpj", { cnpj: cleanDocument });
                const data = response.data;
                setValidatingCnpj(false);
                
                if (data.valid && data.data.nome) {
                    // Se for CNPJ, preencher o nome da empresa
                    if (data.data.tipo === 'cnpj') {
                        setFieldValue('companyName', data.data.nome);
                        toast.success("CNPJ válido! Nome da empresa preenchido automaticamente.");
                    } else {
                        toast.success("CPF válido!");
                    }
                    setLastValidatedDocument(cleanDocument);
                    return true;
                } else {
                    setLastValidatedDocument(cleanDocument);
                    toast.error("Documento inválido ou não encontrado na Receita Federal");
                    return false;
                }
            } catch (error) {
                setValidatingCnpj(false);
                console.error("Erro ao validar documento:", error);
                toast.error("Erro ao validar documento. Tente novamente.");
                setLastValidatedDocument(cleanDocument);
                return false;
            }
        }
    };

    const handleSignUp = async values => {
        try {
            await openApi.post("/auth/signup", values);
            toast.success(i18n.t("signup.toasts.success"));
            history.push("/login");
        } catch (err) {
            toastError(err);
        }
    };

    return (
        <div 
            className={clsx(classes.root, "signup-page")}
            style={{
                // Backup inline styles - vão sobrescrever qualquer CSS global
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 0',
                margin: '0',
                boxSizing: 'border-box',
                overflow: 'auto'
            }}
        >
            <Container 
                component="main" 
                maxWidth="sm"
                className={classes.containerSignup}
                style={{
                    // Backup inline styles para forçar centralização
                    maxWidth: '500px',
                    width: 'auto',
                    margin: '0 auto',
                    padding: '16px',
                    position: 'relative',
                    left: 'auto',
                    right: 'auto',
                    transform: 'none',
                    flex: 'none'
                }}
            >
                <CssBaseline />
                <div className={classes.paper}>
                    <Avatar className={classes.avatar}>
                        <LockOutlinedIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        {i18n.t("signup.title")}
                    </Typography>
                    {/* <form className={classes.form} noValidate onSubmit={handleSignUp}> */}
                    <Formik
                        initialValues={user}
                        enableReinitialize={true}
                        validationSchema={UserSchema}
                        onSubmit={(values, actions) => {
                            setTimeout(() => {
                                handleSignUp(values);
                                actions.setSubmitting(false);
                            }, 400);
                        }}
                    >
                        {({ touched, errors, isSubmitting, setFieldValue }) => (
                            <Form className={classes.form}>
                                <Grid container spacing={2}>

                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            id="document"
                                            label="CPF ou CNPJ"
                                            name="document"
                                            error={touched.document && Boolean(errors.document)}
                                            helperText={touched.document && errors.document || "Digite CPF (11 dígitos) ou CNPJ (14 dígitos)"}
                                            autoComplete="document"
                                            inputProps={{ 
                                                maxLength: 18,
                                                style: { textTransform: 'none' }
                                            }}
                                            InputProps={{
                                                endAdornment: validatingCnpj && (
                                                    <CircularProgress size={20} />
                                                ),
                                            }}
                                            autoFocus
                                            onChange={(e) => {
                                                let value = e.target.value;
                                                
                                                // Remover caracteres não numéricos
                                                const numbers = value.replace(/\D/g, '');
                                                
                                                // Limpar estado de validação anterior se o documento mudou
                                                if (lastValidatedDocument && lastValidatedDocument !== numbers) {
                                                    setLastValidatedDocument("");
                                                }
                                                
                                                // Formatar dinamicamente (CPF ou CNPJ)
                                                const formattedValue = formatDocument(value);
                                                setFieldValue('document', formattedValue);
                                                
                                                // Validar quando tiver o número correto de dígitos
                                                if (numbers.length === 11) {
                                                    // CPF - validar imediatamente
                                                    validateDocument(formattedValue, setFieldValue);
                                                } else if (numbers.length === 14) {
                                                    // CNPJ - validar imediatamente
                                                    validateDocument(formattedValue, setFieldValue);
                                                }
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            id="companyName"
                                            label={i18n.t("signup.form.company")}
                                            error={touched.companyName && Boolean(errors.companyName)}
                                            helperText={touched.companyName && errors.companyName}
                                            name="companyName"
                                            autoComplete="companyName"
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            autoComplete="name"
                                            name="name"
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            variant="outlined"
                                            fullWidth
                                            id="name"
                                            label={i18n.t("signup.form.name")}
                                        // autoFocus
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            id="email"
                                            label={i18n.t("signup.form.email")}
                                            name="email"
                                            error={touched.email && Boolean(errors.email)}
                                            helperText={touched.email && errors.email}
                                            autoComplete="email"
                                            inputProps={{ style: { textTransform: 'lowercase' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            name="password"
                                            error={touched.password && Boolean(errors.password)}
                                            helperText={touched.password && errors.password}
                                            label={i18n.t("signup.form.password")}
                                            type="password"
                                            id="password"
                                            autoComplete="current-password"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            id="phone"
                                            label={i18n.t("signup.form.phone")}
                                            name="phone"
                                            autoComplete="phone"
                                        />
                                    </Grid>

                                    {/* TOKEN */}
                                    {/* <Grid item xs={12}>
                                        <Field
                                            as={TextField}
                                            variant="outlined"
                                            fullWidth
                                            id="token"
                                            label={i18n.t("auth.token")}
                                            name="token"
                                            autoComplete="token"
                                        />
                                    </Grid> */}

                                    <Grid item xs={12}>
                                        <InputLabel htmlFor="plan-selection">Plano</InputLabel>
                                        <Field
                                            as={Select}
                                            variant="outlined"
                                            fullWidth
                                            id="plan-selection"
                                            label="Plano"
                                            name="planId"
                                            required
                                        >
                                            {plans.map((plan, key) => (
                                                <MenuItem key={key} value={plan.id}>
                                                    {plan.name} - Atendentes: {plan.users} - WhatsApp: {plan.connections} - Filas: {plan.queues} - R$ {plan.amount}
                                                </MenuItem>
                                            ))}
                                        </Field>
                                    </Grid>

                                </Grid>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    className={classes.submit}
                                    disabled={validatingCnpj}
                                >
                                    {i18n.t("signup.buttons.submit")}
                                </Button>
                                <Grid container>
                                    <Grid item>
                                        <Link
                                            href="#"
                                            variant="body2"
                                            component={RouterLink}
                                            to="/login"
                                        >
                                            {i18n.t("signup.buttons.login")}
                                        </Link>
                                    </Grid>
                                </Grid>
                            </Form>
                        )}
                    </Formik>
                </div>
                <Box mt={5}>{/* <Copyright /> */}</Box>
            </Container>
        </div>
    );
};

export default SignUp;