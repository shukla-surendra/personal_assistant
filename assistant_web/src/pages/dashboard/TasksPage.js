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

export default function DashboardResponsive() {
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

      <Box as="section" bg={useColorModeValue('gray.50', 'gray.700')} minH="100vh">
        <Navbar display={{ base: 'none', md: 'unset' }} />
        <Drawer isOpen={menu_open.isOpen} onClose={menu_open.onClose} placement="left">
          <DrawerOverlay />
          <DrawerContent>
            <Navbar w="full" borderRight="none" />
          </DrawerContent>
        </Drawer>
        <Box ml={{ base: 0, md: 60 }} transition=".3s ease">
          <Header menu_open={menu_open}></Header>

          <Box as="main" p={4} minH="25rem" bg={useColorModeValue('auto', 'gray.800')}>
            <Flex direction={'column'} justifyContent="center">
              <Box>
                <Stack bg="#FFFFFF" m={'5px'} p={'30px'} borderRadius="10px">
                  <Flex justifyContent="left">
                    <Box>
                      <Flex>
                        <Tabs>
                          <TabList>
                            <Tab>Board View</Tab>
                            <Tab>Table View</Tab>
                            <Stack>
                              <UnifiedCreateButton 
                                onCreateNote={() => {
                                  // Navigate to notes page or handle note creation
                                  navigate('/notes');
                                }}
                                onCreateTask={handleAddItem}
                              />
                            </Stack>
                          </TabList>

                          <TabPanels>
                            <TabPanel>
                              <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                                <GridItem>
                                  <Text as='b' fontSize={14}>Not Started</Text>
                                  <Box>
                                    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                                      {tasks.filter(task => task.status === 'todo').map((task, index) => (
                                        <GridItem key={index}>
                                          <TaskCard 
                                            task={task} 
                                            onUpdate={handleUpdateItem}
                                            onDelete={handleDeleteItem}
                                            onView={handleViewItem}
                                          />
                                        </GridItem>
                                      ))}
                                    </Grid>
                                  </Box>
                                </GridItem>

                                <GridItem>
                                  <Text as='b' fontSize={14}>In Progress</Text>
                                  <Box>
                                    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                                      {tasks.filter(task => task.status === 'in_progress').map((task, index) => (
                                        <GridItem key={index}>
                                          <TaskCard 
                                            task={task} 
                                            onUpdate={handleUpdateItem}
                                            onDelete={handleDeleteItem}
                                            onView={handleViewItem}
                                          />
                                        </GridItem>
                                      ))}
                                    </Grid>
                                  </Box>
                                </GridItem>

                                <GridItem>
                                  <Text as='b' fontSize={14}>Done</Text>
                                  <Box>
                                    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                                      {tasks.filter(task => task.status === 'done').map((task, index) => (
                                        <GridItem key={index}>
                                          <TaskCard 
                                            task={task} 
                                            onUpdate={handleUpdateItem}
                                            onDelete={handleDeleteItem}
                                            onView={handleViewItem}
                                          />
                                        </GridItem>
                                      ))}
                                    </Grid>
                                  </Box>
                                </GridItem>
                              </Grid>
                            </TabPanel>

                            <TabPanel>
                              <Grid templateColumns="repeat(1, 1fr)" gap={6}>
                                <GridItem>
                                  <Box>
                                    <Table variant="simple">
                                      <Thead>
                                        <Tr fontSize={'14px'} fontWeight={'bold'}>
                                          <Th>Title</Th>
                                          <Th>Due On</Th>
                                          <Th>Created At</Th>
                                          <Th>Status</Th>
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {tasks.map((task, index) => (
                                          <Tr key={index} fontSize={'14px'}>
                                            <Td><Text onClick={() => handleUpdateItem(task)}>{task.title}</Text></Td>
                                            <Td>{formatLocalDateTime(task.due_on)}</Td>
                                            <Td>{formatLocalDateTime(task.created_at)}</Td>
                                            <td><StatusIndicator status={task.status} /></td>
                                          </Tr>
                                        ))}
                                      </Tbody>
                                    </Table>
                                  </Box>
                                </GridItem>
                              </Grid>
                            </TabPanel>
                          </TabPanels>
                        </Tabs>
                      </Flex>
                    </Box>
                  </Flex>
                </Stack>
              </Box>
            </Flex>
          </Box>
        </Box>
      </Box>
    </>
  );
}
