import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Heading, VStack } from '@chakra-ui/react';
import TaskBoardViewBox from './TaskBoardViewBox';

const columns = [
  { key: 'todo', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const BoardView = ({ tasks, onStatusChange, onEdit, onDelete }) => {
  const tasksByStatus = columns.reduce((acc, col) => {
    acc[col.key] = tasks.filter(task => task.status === col.key);
    return acc;
  }, {});

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;
    onStatusChange(draggableId, destination.droppableId);
  };

  const handleUpdateItem = (task) => {
    onEdit(task);
  };

  const handleDeleteItem = (task) => {
    onDelete(task);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box display="flex" gap={4} justifyContent="center">
        {columns.map(col => (
          <Droppable droppableId={col.key} key={col.key}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                minW="320px"
                bg={snapshot.isDraggingOver ? 'gray.100' : 'gray.50'}
                borderRadius="md"
                p={2}
              >
                <Heading size="md" mb={2}>{col.label}</Heading>
                <VStack spacing={2} align="stretch">
                  {tasksByStatus[col.key].map((task, idx) => (
                    <Draggable draggableId={String(task.task_id)} index={idx} key={task.task_id}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TaskBoardViewBox
                            task={task}
                            handleUpdateItem={handleUpdateItem}
                            handleDeleteItem={handleDeleteItem}
                            onEdit={onEdit}
                          />
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </VStack>
              </Box>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default BoardView;