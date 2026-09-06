import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, Heading, Text, HStack, Badge, IconButton,
  useColorModeValue, useDisclosure, Spinner, Center, useToast, Icon,
} from '@chakra-ui/react';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { BsKanban } from 'react-icons/bs';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import NewTaskDrawer from '../../components/dashboard/drawers/NewTaskDrawer';
import EditTaskDrawer from '../../components/dashboard/drawers/EditTaskDrawer';
import BoardService from '../../services/BoardService';
import TaskService from '../../services/taskservice';

const DEFAULT_COLUMNS = ["todo", "in_progress", "review", "done"];

// Covers the TaskStatus enum (constants.py) -- anything not listed here
// still renders, just Title Cased from its raw value.
const STATUS_LABELS = {
  todo: "To Do", backlog: "Backlog", in_progress: "In Progress", blocked: "Blocked",
  review: "Review", approved: "Approved", done: "Done", cancelled: "Cancelled",
  archived: "Archived", scheduled: "Scheduled", on_hold: "On Hold",
};
const labelFor = (status) => STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PRIORITY_COLOR = { urgent: 'red', high: 'orange', medium: 'yellow', low: 'green', none: 'gray' };

function KanbanCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.task_id });
  const cardBg = useColorModeValue('white', 'gray.700');
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      bg={cardBg}
      p={3}
      mb={2}
      borderRadius="md"
      boxShadow="sm"
      cursor="grab"
      onClick={() => onClick(task)}
      _hover={{ boxShadow: 'md' }}
    >
      <Text fontSize="sm" fontWeight="medium" mb={2} noOfLines={3}>{task.title}</Text>
      <HStack spacing={2}>
        <Badge colorScheme={PRIORITY_COLOR[task.priority] || 'gray'} fontSize="2xs">{task.priority}</Badge>
        {task.due_on && (
          <Text fontSize="2xs" color="gray.500">
            {new Date(task.due_on).toLocaleDateString()}
          </Text>
        )}
      </HStack>
    </Box>
  );
}

function KanbanColumn({ status, tasks, onCardClick, onAddCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const columnBg = useColorModeValue('gray.100', 'gray.900');

  return (
    <Box
      ref={setNodeRef}
      bg={isOver ? 'teal.50' : columnBg}
      borderRadius="lg"
      p={3}
      minW="280px"
      maxW="280px"
      flexShrink={0}
      transition="background 0.15s ease"
    >
      <HStack justify="space-between" mb={3}>
        <HStack>
          <Text fontWeight="bold" fontSize="sm">{labelFor(status)}</Text>
          <Badge borderRadius="full">{tasks.length}</Badge>
        </HStack>
        <IconButton
          icon={<FiPlus />}
          size="xs"
          variant="ghost"
          aria-label={`Add card to ${labelFor(status)}`}
          onClick={() => onAddCard(status)}
        />
      </HStack>
      <SortableContext items={tasks.map(t => t.task_id)} strategy={verticalListSortingStrategy}>
        <Box minH="40px">
          {tasks.map(task => (
            <KanbanCard key={task.task_id} task={task} onClick={onCardClick} />
          ))}
        </Box>
      </SortableContext>
    </Box>
  );
}

export default function BoardDetailPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const newCardDisclosure = useDisclosure();
  const editTaskDisclosure = useDisclosure();

  const [board, setBoard] = useState(null);
  const [tasksByStatus, setTasksByStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [newCardStatus, setNewCardStatus] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);

  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');

  const columns = useMemo(
    () => (board?.properties?.columns?.length ? board.properties.columns : DEFAULT_COLUMNS),
    [board]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const groupTasks = (tasks, cols) => {
    const grouped = Object.fromEntries(cols.map(c => [c, []]));
    for (const task of tasks) {
      (grouped[task.status] || (grouped[task.status] = [])).push(task);
    }
    return grouped;
  };

  const loadBoard = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([BoardService.get(boardId), TaskService.getByBoard(boardId)])
      .then(([boardRes, tasksRes]) => {
        setBoard(boardRes.data);
        const cols = boardRes.data?.properties?.columns?.length ? boardRes.data.properties.columns : DEFAULT_COLUMNS;
        setTasksByStatus(groupTasks(tasksRes.data, cols));
      })
      .catch(() => setError("Failed to load board"))
      .finally(() => setLoading(false));
  }, [boardId]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const findContainer = (id) => {
    if (id in tasksByStatus) return id; // dropped directly on a column
    return Object.keys(tasksByStatus).find(col => tasksByStatus[col].some(t => t.task_id === id));
  };

  const handleDragStart = (event) => {
    const task = Object.values(tasksByStatus).flat().find(t => t.task_id === event.active.id);
    setActiveTask(task);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setTasksByStatus(prev => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex(t => t.task_id === active.id);
      const overIndex = overItems.findIndex(t => t.task_id === over.id);
      const movedTask = { ...activeItems[activeIndex], status: overContainer };
      const newOverIndex = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...prev,
        [activeContainer]: activeItems.filter(t => t.task_id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newOverIndex),
          movedTask,
          ...overItems.slice(newOverIndex),
        ],
      };
    });
  };

  const persistColumn = (status, tasks) => {
    return Promise.all(tasks.map((task, index) =>
      TaskService.update(task.task_id, {
        task_id: task.task_id,
        workspace_id: task.workspace_id,
        user_id: task.user_id,
        status,
        order: index,
        board_id: boardId,
      })
    ));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);
    if (!activeContainer || !overContainer) return;

    let finalTasksByStatus = tasksByStatus;
    if (activeContainer === overContainer && active.id !== over.id) {
      const items = tasksByStatus[activeContainer];
      const oldIndex = items.findIndex(t => t.task_id === active.id);
      const newIndex = items.findIndex(t => t.task_id === over.id);
      finalTasksByStatus = { ...tasksByStatus, [activeContainer]: arrayMove(items, oldIndex, newIndex) };
      setTasksByStatus(finalTasksByStatus);
    }

    // Persist the column(s) that actually changed -- covers both a
    // same-column reorder and a cross-column move (handleDragOver already
    // moved the card locally in the cross-column case).
    const columnsToSave = new Set([activeContainer, overContainer]);
    columnsToSave.forEach(status => {
      persistColumn(status, finalTasksByStatus[status]).catch(() => {
        toast({ title: "Couldn't save card position", status: "error", duration: 3000, isClosable: true });
        loadBoard();
      });
    });
  };

  const handleAddCard = (status) => {
    setNewCardStatus(status);
    newCardDisclosure.onOpen();
  };

  const handleCardClick = (task) => {
    setCurrentTask(task);
    editTaskDisclosure.onOpen();
  };

  // EditTaskDrawer already persisted the edit itself (it dispatches its own
  // updateTask before calling this) -- just refresh the board's view.
  const handleTaskUpdate = () => {
    loadBoard();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }}>
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Center py={20}><Spinner /></Center>
        </Box>
      </Box>
    );
  }

  if (error || !board) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }}>
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Center py={20}><Text color="red.500">{error || "Board not found"}</Text></Center>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <Navbar isCollapsed={isMenuCollapsed} />
      <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }} transition="all 0.3s ease">
        <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
        <Box as="main" p={{ base: 3, md: 4 }} minH="calc(100vh - 4rem)" bg={mainBg} borderRadius="lg" boxShadow="sm">
          <HStack mb={6}>
            <IconButton icon={<FiArrowLeft />} variant="ghost" size="sm" aria-label="Back to boards" onClick={() => navigate('/boards')} />
            <Icon as={BsKanban} color="teal.500" />
            <Heading size="lg">{board.name}</Heading>
          </HStack>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <Flex gap={4} overflowX="auto" pb={4} align="flex-start">
              {columns.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status] || []}
                  onCardClick={handleCardClick}
                  onAddCard={handleAddCard}
                />
              ))}
            </Flex>
            <DragOverlay>
              {activeTask ? (
                <Box bg="white" p={3} borderRadius="md" boxShadow="lg" maxW="260px">
                  <Text fontSize="sm" fontWeight="medium">{activeTask.title}</Text>
                </Box>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>

      {newCardStatus && (
        <NewTaskDrawer
          key={newCardStatus}
          disclosures={{
            isOpen: newCardDisclosure.isOpen,
            onClose: () => { newCardDisclosure.onClose(); loadBoard(); },
          }}
          defaultValues={{ status: newCardStatus, board_id: boardId }}
        />
      )}
      <EditTaskDrawer
        currentTask={currentTask}
        setCurrentTask={setCurrentTask}
        disclosures={editTaskDisclosure}
        onTaskUpdate={handleTaskUpdate}
      />
    </Box>
  );
}
