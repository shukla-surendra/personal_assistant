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
  IconButton
} from '@chakra-ui/react';
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

  const TaskCard = ({ task, onUpdate, onDelete, onView }) => {
    const [content, setContent] = useState('');

    useEffect(() => {
      if (task?.description) {
        try {
          const jsonContent = typeof task.description === 'string' 
            ? JSON.parse(task.description) 
            : task.description;
          
          // Extract text content from the JSON structure
          const textContent = extractTextFromLexicalJSON(jsonContent);
          setContent(textContent);
        } catch (error) {
          console.error('Error parsing description:', error);
          setContent(task.description);
        }
      }
    }, [task?.description]);

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

    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        bg={useColorModeValue('white', 'gray.700')}
      >
        <VStack align="stretch" spacing={3}>
          <Text fontSize="lg" fontWeight="bold">{task.title}</Text>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} noOfLines={3}>
            {content}
          </Text>
          <HStack justify="space-between">
            <Badge colorScheme={priorityColorMapping[task.priority] || 'gray'}>
              {task.priority}
            </Badge>
            <HStack spacing={2}>
              <IconButton
                icon={<Icon as={FaEye} />}
                size="sm"
                variant="ghost"
                onClick={() => onView(task)}
                aria-label="View Task"
              />
              <UnifiedEditButton 
                item={task} 
                type="task" 
                onEdit={onUpdate}
              />
              <IconButton
                icon={<Icon as={FaTrash} />}
                size="sm"
                variant="ghost"
                onClick={() => onDelete(task)}
                aria-label="Delete Task"
              />
            </HStack>
          </HStack>
        </VStack>
      </Box>
    );
  };

  return (
    <>
      <Helmet>
        <title>Tasks</title>
        <meta name="description" content="App Description" />
        <meta name="theme-color" content="#008f68" />
      </Helmet>
      <EditTaskDrawer
        currentTask={currentTask}
        setCurrentTask={setCurrentTask}
        disclosures={edit_task_drawer}
        onTaskUpdate={handleTaskUpdate}
      />
      <NewTaskDrawer currentTask={{}} disclosures={new_task_drawer}></NewTaskDrawer>
      <DeleteTaskNoteModal currentTask={currentTask} disclosures={delete_modal} />
      <TaskViewModal 
        isOpen={view_task_modal.isOpen} 
        onClose={view_task_modal.onClose} 
        task={currentTask} 
      />

<Box minH="100vh" bg={bgColor}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box
          ml={{ base: 0, md: isMenuCollapsed ? "60px" : "250px" }}
          transition="all 0.3s ease"
          minH="100vh"
        >
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Box p="4">
            <VStack spacing={6}>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                w="full"
                mb={4}
              >
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="blue.600"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <ChevronRightIcon /> TASKS
                </Text>
                <UnifiedCreateButton 
                  onCreateNote={() => navigate('/notes')}
                  onCreateTask={handleAddItem}
                />
              </Flex>

              <Stack spacing={6} w="full">
                <Tabs variant="enclosed" colorScheme="blue">
                  <TabList>
                    <Tab>Board View</Tab>
                    <Tab>Table View</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel p={0}>
                      <Grid 
                        templateColumns={{ 
                          base: "1fr", 
                          md: "repeat(2, 1fr)", 
                          lg: "repeat(3, 1fr)" 
                        }} 
                        gap={6}
                      >
                        <GridItem>
                          <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>Not Started</Text>
                            <VStack spacing={4} align="stretch">
                              {tasks.filter(task => task.status === 'todo').map((task, index) => (
                                <TaskCard 
                                  key={index}
                                  task={task} 
                                  onUpdate={handleUpdateItem}
                                  onDelete={handleDeleteItem}
                                  onView={handleViewItem}
                                />
                              ))}
                            </VStack>
                          </Box>
                        </GridItem>

                        <GridItem>
                          <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>In Progress</Text>
                            <VStack spacing={4} align="stretch">
                              {tasks.filter(task => task.status === 'in_progress').map((task, index) => (
                                <TaskCard 
                                  key={index}
                                  task={task} 
                                  onUpdate={handleUpdateItem}
                                  onDelete={handleDeleteItem}
                                  onView={handleViewItem}
                                />
                              ))}
                            </VStack>
                          </Box>
                        </GridItem>

                        <GridItem>
                          <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
                            <Text fontSize="lg" fontWeight="semibold" mb={4}>Done</Text>
                            <VStack spacing={4} align="stretch">
                              {tasks.filter(task => task.status === 'done').map((task, index) => (
                                <TaskCard 
                                  key={index}
                                  task={task} 
                                  onUpdate={handleUpdateItem}
                                  onDelete={handleDeleteItem}
                                  onView={handleViewItem}
                                />
                              ))}
                            </VStack>
                          </Box>
                        </GridItem>
                      </Grid>
                    </TabPanel>

                    <TabPanel p={0}>
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
                                      icon={<Icon as={FaEye} />}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewItem(task)}
                                      aria-label="View Task"
                                    />
                                    <UnifiedEditButton 
                                      item={task} 
                                      type="task" 
                                      onEdit={handleUpdateItem}
                                    />
                                    <IconButton
                                      icon={<Icon as={FaTrash} />}
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
            </VStack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
