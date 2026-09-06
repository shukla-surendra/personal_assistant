import {
  Avatar,
  Icon,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useColorModeValue,
  Box,
  Flex,
  Grid,
  Stack,
  GridItem,
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
  Badge,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  StackDivider,
  Heading,
  Button
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
// Here we have used react-icons package for the icons
import { StatusIndicator } from '../../components/dashboard/StatusIndicator'
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveTasks, updateTask } from "../../slices/tasks";
import { AddIcon } from '@chakra-ui/icons';
import Navbar from "../../components/dashboard/Navbar";
import EditTaskDrawer from "../../components/dashboard/drawers/EditTaskDrawer";
import NewTaskDrawer from "../../components/dashboard/drawers/NewTaskDrawer";
import DeleteTaskNoteModal from "../../components/dashboard/modals/DeleteTaskNoteModal";
import { Helmet } from 'react-helmet';
import { formatLocalDateTime } from "../../utils/locale"
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'
import Header from "../../components/dashboard/Header";
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import TaskViewModal from "../../components/dashboard/modals/TaskViewModal";
import UnifiedEditButton from "../../components/dashboard/UnifiedEditButton";
import UnifiedCreateButton from "../../components/dashboard/UnifiedCreateButton";
import { ChevronRightIcon } from '@chakra-ui/icons';
import { FiEye, FiMoreVertical, FiEdit2, FiTrash2, FiExternalLink, FiPlus } from 'react-icons/fi';

export default function TasksPage() {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const menu_open = useDisclosure();
  const [currentTask, setCurrentTask] = useState({ task_id: "", title: "", descrtiption: "", status: "" });
  const delete_modal = useDisclosure()
  const edit_task_drawer = useDisclosure()
  const new_task_drawer = useDisclosure()
  const view_task_modal = useDisclosure()
  const tasks = useSelector(state => state.tasks.tasks);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleDeleteItem = (task) => {
    setCurrentTask(task);
    delete_modal.onOpen(true);
  };

  const handleAddItem = () => {
    new_task_drawer.onOpen();
  };

  const handleUpdateItem = (task) => {
    setCurrentTask(task);
    edit_task_drawer.onOpen();
  };

  const handleTaskUpdate = (updatedTask) => {
    dispatch(updateTask({ task_id: updatedTask.task_id, data: updatedTask }))
      .unwrap()
      .then(() => {
        dispatch(retrieveTasks());
      });
  };

  const handleViewItem = (task) => {
    setCurrentTask(task);
    view_task_modal.onOpen();
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
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  const initFetch = useCallback(() => {
    dispatch(retrieveTasks());
  }, [dispatch])

  useEffect(() => {
    initFetch()
  }, [initFetch])

  useEffect(() => {
    if (!edit_task_drawer.isOpen) {
      initFetch();
    }
  }, [edit_task_drawer.isOpen]);

  useEffect(() => {
    if (!new_task_drawer.isOpen) {
      initFetch();
    }
  }, [new_task_drawer.isOpen]);

  const TaskCard = React.memo(({ task }) => {
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    return (
      <>
        <Card key={task.task_id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="sm">
                <Link 
                  to={`/page/${task.task_id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    color: textColor,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {task.title}
                </Link>
              </Heading>
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

  return (
    <>
      <Helmet>
        <title>Tasks - Assistant AI</title>
        <meta name="description" content="Task Management" />
      </Helmet>

      <Box minH="100vh" bg={bgColor}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box
          ml={{ base: 0, md: isMenuCollapsed ? "60px" : "250px" }}
          transition="all 0.3s ease"
          minH="100vh"
        >
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Box p="3">
            <Stack spacing={6}>
              {/* Header Section */}
              <Flex
                justifyContent="space-between"
                alignItems="center"
                p={6}
                bg={cardBg}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color={textColor}>Tasks</Heading>
                  <Text color={subTextColor}>Manage your tasks and to-dos</Text>
                </VStack>

                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  onClick={() => new_task_drawer.onOpen()}
                >
                  Add Task
                </Button>
              </Flex>

              <Tabs variant="enclosed" colorScheme="blue">
                <TabList>
                  <Tab>Board View</Tab>
                  <Tab>Table View</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel p={0} mt={4}>
                    <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                      <GridItem>
                        <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                          <Text fontSize="lg" fontWeight="semibold" mb={4}>To Do</Text>
                          <VStack spacing={4} align="stretch">
                            {tasks.filter(task => task.status === 'todo').map((task, index) => (
                              <TaskCard key={index} task={task} />
                            ))}
                          </VStack>
                        </Box>
                      </GridItem>

                      <GridItem>
                        <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                          <Text fontSize="lg" fontWeight="semibold" mb={4}>In Progress</Text>
                          <VStack spacing={4} align="stretch">
                            {tasks.filter(task => task.status === 'in_progress').map((task, index) => (
                              <TaskCard key={index} task={task} />
                            ))}
                          </VStack>
                        </Box>
                      </GridItem>

                      <GridItem>
                        <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                          <Text fontSize="lg" fontWeight="semibold" mb={4}>Done</Text>
                          <VStack spacing={4} align="stretch">
                            {tasks.filter(task => task.status === 'done').map((task, index) => (
                              <TaskCard key={index} task={task} />
                            ))}
                          </VStack>
                        </Box>
                      </GridItem>
                    </Grid>
                  </TabPanel>

                  <TabPanel p={0} mt={4}>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Title</Th>
                            <Th>Due On</Th>
                            <Th>Created At</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {tasks.map((task, index) => (
                            <Tr key={index}>
                              <Td>
                                <Text 
                                  fontWeight="medium" 
                                  cursor="pointer"
                                  onClick={() => handleUpdateItem(task)}
                                >
                                  {task.title}
                                </Text>
                              </Td>
                              <Td>{formatLocalDateTime(task.due_on)}</Td>
                              <Td>{formatLocalDateTime(task.created_at)}</Td>
                              <Td>
                                <StatusIndicator status={task.status} />
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FiEye />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewItem(task)}
                                    aria-label="View Task"
                                  />
                                  <IconButton
                                    icon={<FiExternalLink />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => navigate(`/page/${task.task_id}`)}
                                    aria-label="Open in new page"
                                  />
                                  <UnifiedEditButton 
                                    item={task} 
                                    type="task" 
                                    onEdit={handleUpdateItem}
                                  />
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteItem(task)}
                                    aria-label="Delete Task"
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Modals and Drawers */}
      <EditTaskDrawer 
        currentTask={currentTask} 
        setCurrentTask={setCurrentTask} 
        disclosures={edit_task_drawer}
        onTaskUpdate={handleTaskUpdate}
      />
      <NewTaskDrawer 
        currentTask={{}} 
        disclosures={new_task_drawer}
      />
      <DeleteTaskNoteModal 
        currentTask={currentTask} 
        disclosures={delete_modal}
        type="task"
      />
      <TaskViewModal 
        isOpen={view_task_modal.isOpen} 
        onClose={view_task_modal.onClose} 
        task={currentTask}
        onEdit={handleUpdateItem}
      />

      {/* Task Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        size="md"
      >
        {/* ... existing drawer content ... */}
      </Drawer>
    </>
  );
}
