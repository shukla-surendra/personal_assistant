import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveTasks, retrieveNotes, updateTask } from "../../slices/tasks";
import {
  Box,
  Flex,
  Grid,
  Text,
  useDisclosure,
  Tbody,
  Table,
  Thead,
  Th,
  Tr,
  Td,
  VStack,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Badge,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Stack,
  StackDivider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { 
  FiSearch, 
  FiFilter, 
  FiCalendar, 
  FiTag, 
  FiBook,
  FiFileText,
  FiDatabase,
  FiUsers,
  FiBarChart2,
  FiPlus,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiChevronRight,
  FiEye
} from 'react-icons/fi';
import Navbar from "../../components/dashboard/Navbar";
import EditTaskDrawer from "../../components/dashboard/drawers/EditTaskDrawer";
import EditNoteDrawer from "../../components/dashboard/drawers/EditNoteDrawer";
import Header from "../../components/dashboard/Header";
import { Helmet } from 'react-helmet';
import { formatLocalDateTime } from "../../utils/locale";
import { useNavigate } from "react-router-dom";
import NewTaskDrawer from "../../components/dashboard/drawers/NewTaskDrawer";
import NewNoteDrawer from "../../components/dashboard/drawers/NewNoteDrawer";
import TaskViewModal from "../../components/dashboard/modals/TaskViewModal";
import NoteViewModal from "../../components/dashboard/modals/NoteViewModal";
import DeleteTaskNoteModal from "../../components/dashboard/modals/DeleteTaskNoteModal";

export default function DashboardResponsive() {
  const dispatch = useDispatch();
  const { tasks, notes, loading, error } = useSelector((state) => state.tasks);
  const { isOpen: isTaskEditOpen, onOpen: onTaskEditOpen, onClose: onTaskEditClose } = useDisclosure();
  const { isOpen: isNoteEditOpen, onOpen: onNoteEditOpen, onClose: onNoteEditClose } = useDisclosure();
  const { isOpen: isNewTaskOpen, onOpen: onNewTaskOpen, onClose: onNewTaskClose } = useDisclosure();
  const { isOpen: isNewNoteOpen, onOpen: onNewNoteOpen, onClose: onNewNoteClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState({ task_id: "", title: "", description: "", status: "" });
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const navigate = useNavigate();
  const delete_modal = useDisclosure();

  useEffect(() => {
    dispatch(retrieveTasks());
    dispatch(retrieveNotes());
  }, [dispatch]);

  const handleUpdateItem = (task) => {
    setSelectedTask(task);
    onTaskEditOpen();
  };

  const handleDeleteItem = (item) => {
    setSelectedTask(item);
    delete_modal.onOpen();
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      onTaskEditClose();
      await dispatch(updateTask({ 
        task_id: updatedTask.task_id, 
        data: updatedTask 
      })).unwrap();
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleUpdateNote = (note) => {
    setSelectedTask({
      task_id: note.task_id,
      title: note.title,
      description: note.description || '',
      status: note.status || '',
      task_type: 'note'
    });
    onNoteEditOpen();
  };

  const priorityColorMapping = {
    'High': 'red',
    'Medium': 'yellow',
    'Low': 'green',
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');

  const extractTextFromLexicalJSON = (json) => {
    if (!json || !json.root || !json.root.children) return '';
    
    return json.root.children
      .map(child => {
        if (child.type === 'paragraph' && child.children) {
          return child.children.map(text => text.text).join('');
        }
        return '';
      })
      .join('\n');
  };

  const TaskCard = React.memo(({ task }) => {
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    return (
      <>
        <Card key={task.task_id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="sm">{task.title}</Heading>
              <HStack spacing={1}>
                <IconButton
                  aria-label="View Task"
                  icon={<FiEye />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsViewModalOpen(true)}
                />
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiEdit2 />} onClick={() => handleUpdateItem(task)}>
                      Edit
                    </MenuItem>
                    <MenuItem icon={<FiTrash2 />} onClick={() => handleDeleteItem(task)}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing="4">
              {/* <Box>
                <Box 
                  className="ProseMirror"
                  fontSize="sm" 
                  color={textColor} 
                  noOfLines={3}
                  dangerouslySetInnerHTML={{ __html: task.description || "No description provided." }}
                />
              </Box> */}
              <Flex wrap="wrap" gap={2}>
                <Badge colorScheme={priorityColorMapping[task.priority] || 'gray'}>
                  {task.priority || 'No Priority'}
                </Badge>
                <Badge colorScheme="blue">
                  {task.status || 'No Status'}
                </Badge>
              </Flex>
            </Stack>
          </CardBody>
          <CardFooter>
            <Text fontSize="xs" color="gray.500">
              Updated: {formatLocalDateTime(task.updated_at)}
            </Text>
          </CardFooter>
        </Card>
        <TaskViewModal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          task={task}
          onEdit={handleUpdateItem}
        />
      </>
    );
  });

  const NoteCard = React.memo(({ note }) => {
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    return (
      <>
        <Card key={note.task_id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="sm">{note.title}</Heading>
              <HStack spacing={1}>
                <IconButton
                  aria-label="View Note"
                  icon={<FiEye />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsViewModalOpen(true)}
                />
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<FiEdit2 />} onClick={() => handleUpdateNote(note)}>
                      Edit
                    </MenuItem>
                    <MenuItem icon={<FiTrash2 />} onClick={() => handleDeleteItem(note)}>
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack divider={<StackDivider />} spacing="4">
              {/* <Box>
                <Box 
                  className="ProseMirror"
                  fontSize="sm" 
                  color={textColor} 
                  noOfLines={3}
                  dangerouslySetInnerHTML={{ __html: note.description || "No content provided." }}
                />
              </Box> */}
            </Stack>
          </CardBody>
          <CardFooter>
            <Text fontSize="xs" color="gray.500">
              Updated: {formatLocalDateTime(note.updated_at)}
            </Text>
          </CardFooter>
        </Card>
        <NoteViewModal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          note={note}
          onEdit={handleUpdateNote}
        />
      </>
    );
  });

  if (loading) {
    return (
      <Box minH="100vh" bg={bgColor} p={4}>
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} p={4}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Assistant.AI Dashboard</title>
        <meta name="description" content="App Description" />
        <meta name="theme-color" content="#008f68" />
      </Helmet>
      <EditTaskDrawer 
        currentTask={selectedTask} 
        setCurrentTask={setSelectedTask} 
        disclosures={{ isOpen: isTaskEditOpen, onClose: onTaskEditClose }}
        onTaskUpdate={handleTaskUpdate}
      />
      <EditNoteDrawer 
        currentTask={selectedTask} 
        setCurrentTask={setSelectedTask} 
        disclosures={{ isOpen: isNoteEditOpen, onClose: onNoteEditClose }}
        onTaskUpdate={handleTaskUpdate}
      />
      <NewTaskDrawer 
        currentTask={{}} 
        disclosures={{ isOpen: isNewTaskOpen, onClose: onNewTaskClose }}
      />
      <NewNoteDrawer 
        currentTask={{}} 
        disclosures={{ isOpen: isNewNoteOpen, onClose: onNewNoteClose }}
      />
      {selectedTask && selectedTask.task_id && (
        <DeleteTaskNoteModal 
          currentTask={selectedTask} 
          disclosures={delete_modal}
          type="task"
        />
      )}

      <Box minH="100vh" bg={bgColor}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box
          ml={{ base: 0, md: isMenuCollapsed ? "60px" : "250px" }}
          transition="all 0.3s ease"
          minH="100vh"
        >
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Box p="4">
            <VStack spacing={8} align="stretch">
              {/* Quick Actions */}
              <Flex justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold">Quick Actions</Text>
                <HStack spacing={4}>
                  <Button
                    leftIcon={<Icon as={FiPlus} />}
                    colorScheme="blue"
                    variant="solid"
                    onClick={onNewTaskOpen}
                  >
                    New Task
                  </Button>
                  <Button
                    leftIcon={<Icon as={FiPlus} />}
                    colorScheme="blue"
                    variant="solid"
                    onClick={onNewNoteOpen}
                  >
                    New Note
                  </Button>
                </HStack>
              </Flex>

              {/* Tasks Section */}
              <Box>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="xl" fontWeight="bold">Recent Tasks</Text>
                  <Button
                    variant="ghost"
                    rightIcon={<Icon as={FiChevronRight} />}
                    onClick={() => navigate('/tasks')}
                  >
                    View All
                  </Button>
                </Flex>
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={6}
                >
                  {tasks && tasks.slice(0, 6).map((task) => (
                    <TaskCard key={task.task_id} task={task} />
                  ))}
                </Grid>
              </Box>

              {/* Notes Section */}
              <Box>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="xl" fontWeight="bold">Recent Notes</Text>
                  <Button
                    variant="ghost"
                    rightIcon={<Icon as={FiChevronRight} />}
                    onClick={() => navigate('/notes')}
                  >
                    View All
                  </Button>
                </Flex>
                <Grid
                  templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                  gap={6}
                >
                  {notes && notes.slice(0, 6).map((note) => (
                    <NoteCard key={note.task_id} note={note} />
                  ))}
                </Grid>
              </Box>
            </VStack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
