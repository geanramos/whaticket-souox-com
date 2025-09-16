import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { DragDropContext } from 'react-beautiful-dnd';
import KanbanColumn from './KanbanColumn';

const useStyles = makeStyles(theme => ({
  board: {
    display: 'flex',
    overflowX: 'auto',
    ...theme.scrollbarStyles,
    padding: theme.spacing(1),
  },
}));

const KanbanBoard = ({ lanes, onCardMove, updateTicket }) => {
  const classes = useStyles();

  const handleDragEnd = result => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (
      source.droppableId !== destination.droppableId ||
      source.index !== destination.index
    ) {
      onCardMove(
        draggableId,
        destination.droppableId,
        source.droppableId,
        source.index,
        destination.index
      );
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={classes.board}>
        {lanes.map(lane => (
          <KanbanColumn
            key={lane.id}
            id={lane.id}
            title={lane.title}
            tickets={lane.tickets}
            color={lane.color}
            updateTicket={updateTicket}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
