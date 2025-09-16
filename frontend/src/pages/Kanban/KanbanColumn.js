import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Droppable } from 'react-beautiful-dnd';
import KanbanCard from './KanbanCard';
import { Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  column: props => ({
    backgroundColor: props.color || '#ebecf0',
    borderRadius: 8,
    minWidth: 272,
    maxWidth: 272,
    padding: theme.spacing(1),
    marginRight: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  }),
  columnTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 'bold',
    fontSize: '1rem',
    color: "#D6D6D6",
  },
  cardList: {
    flexGrow: 1,
    overflowY: 'auto',
    ...theme.scrollbarStyles,
    maxHeight: 'calc(100vh - 200px)',
  },
  totalValue: {
    fontSize: '1rem',
    color: "#D6D6D6",
    fontWeight: 'bold',
  },
  columnHeader: {
    marginBottom: theme.spacing(1),
  },
}));

const KanbanColumn = ({ id, title, tickets, color, updateTicket }) => {
  const classes = useStyles({ color });

  const totalValue = tickets.reduce((acc, ticket) => {
    const customFields = ticket.contact.extraInfo || [];
    const valueField = customFields.find(field => field.name === 'valor');
    const opportunityValue = valueField ? parseFloat(valueField.value) : 0;
    return acc + opportunityValue;
  }, 0);

  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          className={classes.column}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className={classes.columnHeader}>
            <Typography className={classes.columnTitle}>{title}</Typography>
            <Typography className={classes.totalValue}>
              Total: R$ {totalValue.toFixed(2)}
            </Typography>
          </div>
          <div className={classes.cardList}>
            {tickets.map((ticket, index) => (
              <KanbanCard
                key={ticket.id}
                ticket={ticket}
                index={index}
                updateTicket={updateTicket}
              />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default KanbanColumn;
