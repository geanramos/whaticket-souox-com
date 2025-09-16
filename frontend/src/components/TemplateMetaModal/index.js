import React, { useState } from 'react';
import {
    Modal,
    Box,
    TextField,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Button
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    modal: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalContent: {
        width: '80%',
        maxHeight: '80%',
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        overflowY: 'auto',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
    },
    searchInput: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },
    templateItem: {
        backgroundColor: theme.palette.optionsBackground,
        color: theme.palette.primary,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        marginBottom: theme.spacing(2),
    },
    templateInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    category: {
        marginTop: theme.spacing(1),
    },
}));

const TemplateModal = ({ open, handleClose, templates, onSelectTemplate }) => {
    const classes = useStyles();
    const [search, setSearch] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [variables, setVariables] = useState([]);
    const [variableValues, setVariableValues] = useState({});
    const [renderedContent, setRenderedContent] = useState('');

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    };

    const extractVariablesByComponent = (components) => {
        const regex = /{{(\d+)}}/g;
        let variables = {
            header: [],
            body: [],
            footer: [],
            buttons: []
        };

        components.forEach((component) => {
            let match;
            const type = component.type?.toLowerCase();
            const text = component.text || '';

            if (type === 'header' && ['IMAGE', 'VIDEO'].includes(component?.format)) {
                variables[type].push({ type: `${component?.format.toLowerCase()}`, prompt: component?.format.toLowerCase() === 'image' ? 'Insira a URL da imagem' : 'Insira a URL do vídeo' });
            }
            // Para os botões, verifique a URL para variáveis
            if (type === 'buttons') {
                const buttons = JSON.parse(component.buttons)
                buttons.forEach((button, index) => {
                    if (button.example) {
                        console.log("button", button, index)
                        variables[type].push({ type: button.type, prompt: button.example, index: index });
                    }
                    else if (variables[type]) {
                        while ((match = regex.exec(text)) !== null) {
                            variables[type].push(match[0]);
                        }
                    }
                });
            } else if (variables[type]) {
                while ((match = regex.exec(text)) !== null) {
                    variables[type].push({ type: 'text', prompt: match[0] });
                }
            } else {
                console.warn(`Tipo de componente desconhecido: ${type}`);
            }
        });
        return variables;
    };



    const handleSelectTemplate = (template) => {
        const components = template?.components || [];
        const extractedVariables = extractVariablesByComponent(components);

        setSelectedTemplate(template);
        setVariables(extractedVariables);
        setRenderedContent(components.map((component) => component?.text).join(`\n`));
    };

    // const generateBodyToSave = (content, variables) => {
    //     let bodyToSave = content;
    //     console.log("variables", variables)
    //     console.log("bodyToSave", bodyToSave)
    //     Object.keys(variables).forEach((componentType) => {
    //         console.log("componentType", componentType)
    //         const componentVariables = variables[componentType];
    //         console.log("componentVariables", componentVariables, typeof componentVariables)
    //         // Verificar se componentVariables é um array
    //         if (Array.isArray(componentVariables)) {
    //             componentVariables.forEach((variable, index) => {
    //                 const placeholder = `{{${index + 1}}}`;
    //                 const value = variable?.value || '';
    //                 bodyToSave = bodyToSave.replace(placeholder, value);
    //             });
    //         } else if (typeof componentVariables === 'object') {
    //             Object.keys(componentVariables).forEach((key, index) => {
    //                 const placeholder = `{{${index + 1}}}`;
    //                 const value = componentVariables[key]?.value || '';
    //                 bodyToSave = bodyToSave.replace(placeholder, value);
    //             });
    //         } else {
    //             console.error(`Expected array or object for componentType: ${componentType}, but got`, componentVariables);
    //         }
    //     });
    //     console.log("bodyToSave", bodyToSave)

    //     return bodyToSave;
    // };
    const generateBodyToSave = (content, variables) => {
        let bodyToSave = content;
        Object.keys(variables).forEach((componentType) => {
            const componentVariables = variables[componentType];

            if (Array.isArray(componentVariables)) {
                console.log("componentVariables ARRAY", componentVariables)
                // Se for um array, iteramos sobre ele substituindo as variáveis
                componentVariables.forEach((variable, index) => {
                    const placeholder = `{{${index + 1}}}`;
                    const value = variable?.value || '';
                    bodyToSave = bodyToSave.replace(placeholder, value);
                });
            } else if (typeof componentVariables === 'object') {
                console.log("componentVariables OBJECT", componentVariables)
                // Se for um objeto (caso do header com uma imagem ou outro tipo de conteúdo)
                if (componentType === 'header') {
                    console.log("componentVariables", componentVariables)
                    // Substituir um placeholder específico no header por uma URL de imagem
                    Object.keys(componentVariables).forEach((key, index) => {
                        const value = componentVariables[key]?.value || '';
                        console.log("value", value, value.startsWith("http"))
                        if (value.startsWith("http")) {                            
                            bodyToSave = `${value} \n ${bodyToSave}`
                            console.log("bodyToSave", bodyToSave)
                        } else {
                            const placeholder = `{{${index + 1}}}`;

                            bodyToSave = bodyToSave.replace(placeholder, value);
                        }
                    });
                } else {
                    // Para texto ou outros tipos de componentes, substituímos as variáveis como antes
                    Object.keys(componentVariables).forEach((key, index) => {
                        const placeholder = `{{${index + 1}}}`;
                        const value = componentVariables[key]?.value || '';
                        bodyToSave = bodyToSave.replace(placeholder, value);
                    });
                }
            } else {
                console.error(`Expected array or object for componentType: ${componentType}, but got`, componentVariables);
            }
        });

        console.log("bodyToSave", bodyToSave);
        return bodyToSave;
    };

    const handleSendTemplate = () => {
        const bodyToSave = generateBodyToSave(renderedContent, variableValues);
        const templateWithVariables = {
            ...selectedTemplate,
            variables: variableValues,
            bodyToSave
        };
        onSelectTemplate(templateWithVariables);
    };

    const handleVariableChange = (componentType, index, value, buttonIndex) => {
        // Atualiza o estado das variáveis por tipo de componente
        const newComponentValues = { ...variableValues[componentType], [index]: { value, buttonIndex } };
        const newValues = { ...variableValues, [componentType]: newComponentValues };
        setVariableValues(newValues);
    };

    const filteredTemplates = templates.filter((template) =>
        template?.shortcode?.toLowerCase().includes(search?.toLowerCase())
    )

    return (
        <Modal
            open={open}
            onClose={handleClose}
            className={classes.modal}
            maxWidth="md"
            aria-labelledby="template-modal-title"
        >
            <Box className={classes.modalContent}>
                <Typography variant="h6" id="template-modal-title">
                    Templates do WhatsApp
                </Typography>
                {!selectedTemplate && (
                    <>
                        <div className={classes.searchContainer}>
                            <SearchIcon />
                            <TextField
                                variant="outlined"
                                placeholder="Pesquisar Templates"
                                value={search}
                                onChange={handleSearchChange}
                                className={classes.searchInput}
                            />
                        </div>

                        <List>
                            {filteredTemplates.map((template, index) => (
                                <ListItem
                                    key={index}
                                    className={classes.templateItem}
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    <ListItemText
                                        primary={
                                            <div className={classes.templateInfo}>
                                                <Typography variant="body1">{template.shortcode}</Typography>
                                                <Typography variant="body2">Idioma: {template.language}</Typography>
                                            </div>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" component="div">
                                                    Conteúdo do Template: {template?.components?.map(component => component?.text).join(`\n`)}
                                                </Typography>
                                                <Typography variant="body2" className={classes.category}>
                                                    Categoria: {template.category}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
                {selectedTemplate && (
                    <Box mt={2}>
                        <Typography variant="h6">Detalhes do Template Selecionado</Typography>
                        <Typography variant="body1">Nome: {selectedTemplate.name}</Typography>
                        <Typography variant="body2">Conteúdo: {renderedContent}</Typography>
                        <Typography variant="body2">Idioma: {selectedTemplate.language}</Typography>
                        <Typography variant="body2">Categoria: {selectedTemplate.category}</Typography>
                        {/* Renderização dos campos para preencher as variáveis */}
                        {Object.keys(variables).map((componentType, index) => (
                            <div key={`${componentType}-${index}`}>
                                {variables[componentType].length > 0 && (
                                    <>
                                        <Typography variant="h6">{componentType.toUpperCase()}</Typography>
                                        {variables[componentType].map((variable, index) => (
                                            <TextField
                                                key={`${componentType}-${index}`}
                                                label={`${variable?.prompt}`}
                                                value={variableValues[componentType]?.[index]?.value || ''}
                                                onChange={(e) => handleVariableChange(componentType, index, e.target.value, variable?.index || 0)}
                                                fullWidth
                                                margin="normal"
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSendTemplate}
                            fullWidth
                            style={{ marginTop: 16 }}
                        >
                            Enviar
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setSelectedTemplate(null);
                                setVariableValues({});
                                setRenderedContent('');
                            }}
                            fullWidth
                            style={{ marginTop: 8 }}
                        >
                            Voltar
                        </Button>
                    </Box>
                )}
            </Box>
        </Modal>
    );
};

export default TemplateModal;
