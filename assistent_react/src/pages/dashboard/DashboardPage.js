import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveTasks, retrieveNotes } from "../../slices/tasks";
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
  FiStar
} from 'react-icons/fi';
import { ChevronRightIcon } from '@chakra-ui/icons';
import Navbar from "../../components/dashboard/Navbar";
import EditTaskDrawer from "../../components/dashboard/drawers/EditTaskDrawer";
import EditNoteDrawer from "../../components/dashboard/drawers/EditNoteDrawer";
import Header from "../../components/dashboard/Header";
import { Helmet } from 'react-helmet';
import { formatLocalDateTime } from "../../utils/locale";

export default function DashboardResponsive() {
  const menu_open = useDisclosure();
  const [currentTask, setCurrentTask] = useState({ task_id: "", title: "", description: "", status: "" });
  const view_modal = useDisclosure();
  const delete_modal = useDisclosure();
  const edit_task_drawer = useDisclosure();
  const edit_note_drawer = useDisclosure();
  const tasks = useSelector(state => state.tasks.tasks);
  const notes = useSelector(state => state.tasks.notes);
  const dispatch = useDispatch();

  const initFetch = useCallback(() => {
    dispatch(retrieveTasks());
    dispatch(retrieveNotes());
  }, [dispatch]);

  useEffect(() => {
    initFetch();
  }, [initFetch]);

  const handleViewItem = (task) => {
    setCurrentTask(task);
    view_modal.onOpen(true);
  };

  const handleDeleteItem = (task) => {
    setCurrentTask(task);
    delete_modal.onOpen(true);
  };

  const handleUpdateItem = (task) => {
    setCurrentTask(task);
    edit_task_drawer.onOpen();
  };

  const handleUpdateNote = (note) => {
    setCurrentTask({
      task_id: note.task_id,
      title: note.title,
      description: note.description || '',
      status: note.status || '',
      task_type: 'note'
    });
    edit_note_drawer.onOpen();
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

  const TaskCard = ({ task }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
      if (task?.description) {
        try {
          const jsonContent = typeof task.description === 'string' 
            ? JSON.parse(task.description) 
            : task.description;
          
          const textContent = extractTextFromLexicalJSON(jsonContent);
          setContent(textContent);
        } catch (error) {
          console.error('Error parsing description:', error);
          setContent(task.description);
        }
      }
    }, [task?.description]);

    return (
      <Card key={task.task_id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="sm">{task.title}</Heading>
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
          </Flex>
        </CardHeader>
        <CardBody>
          <Stack divider={<StackDivider />} spacing="4">
            <Box>
              <Text fontSize="sm" color={textColor} noOfLines={3}>
                {content}
              </Text>
            </Box>
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
    );
  };

  return (
    <>
      <Helmet>
        <title>Assistant AI Dashboard</title>
        <meta name="description" content="App Description" />
        <meta name="theme-color" content="#008f68" />
      </Helmet>
      <EditTaskDrawer currentTask={currentTask} setCurrentTask={setCurrentTask} disclosures={edit_task_drawer} />
      <EditNoteDrawer currentTask={currentTask} setCurrentTask={setCurrentTask} disclosures={edit_note_drawer} />

      <Box minH="100vh" bg={bgColor}>
        <Navbar />
        <Box
          ml={{ base: 0, md: 60 }}
          transition=".3s ease"
          p={{ base: 4, md: 6, lg: 8 }}
        >
          <Header menu_open={menu_open} />
          <Box
            as="main"
            p={{ base: 4, md: 6 }}
            minH="calc(100vh - 4rem)"
            bg={cardBg}
            borderRadius="lg"
            boxShadow="sm"
          >
            {/* Search and Filter Bar */}
            <Flex mb={6} gap={4} align="center">
              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input placeholder="Search..." />
              </InputGroup>
              <Button leftIcon={<Icon as={FiFilter} />} variant="outline">
                Filter
              </Button>
              <Button leftIcon={<Icon as={FiPlus} />} colorScheme="blue">
                New
              </Button>
            </Flex>

            {/* Recent Items Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
              {tasks.slice(0, 6).map((task) => (
                <TaskCard key={task.task_id} task={task} />
              ))}
            </SimpleGrid>

            {/* Recent Notes Section */}
            <Box mb={8}>
              <Flex justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                  Recent Notes
                </Text>
                <Button size="sm" variant="ghost" rightIcon={<ChevronRightIcon />}>
                  View All
                </Button>
              </Flex>
              <Table variant="simple" size="md">
                <Thead>
                  <Tr>
                    <Th fontWeight="bold" fontSize="md" color="gray.600">Title</Th>
                    <Th fontWeight="bold" fontSize="md" color="gray.600">Created At</Th>
                    <Th fontWeight="bold" fontSize="md" color="gray.600">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {notes.slice(0, 5).map((note, index) => (
                    <Tr key={note.task_id || index} fontSize="14px">
                      <Td>
                        <Text isTruncated fontWeight="semibold">{note.title}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.500">
                          {note.created_at ? formatLocalDateTime(note.created_at) : "-"}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit note"
                            icon={<FiEdit2 />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateNote(note)}
                          />
                          <IconButton
                            aria-label="Delete note"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(note)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
