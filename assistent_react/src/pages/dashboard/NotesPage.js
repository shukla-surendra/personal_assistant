import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useColorModeValue
} from '@chakra-ui/react';

import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveNotes } from "../../slices/tasks";
import { Box, Flex, Grid, GridItem, Text, useDisclosure, Tbody, Table, Thead, Th, Tr, Td } from "@chakra-ui/react";
import { AddIcon, EditIcon, ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons';
import Navbar from "../../components/dashboard/Navbar";
import { IconButton } from '@chakra-ui/react';
import { Helmet } from 'react-helmet';
import { formatLocalDateTime } from "../../utils/locale"
import NewNoteDrawer from "../../components/dashboard/drawers/NewNoteDrawer";
import EditNoteDrawer from '../../components/dashboard/drawers/EditNoteDrawer'
import DeleteTaskNoteModal from "../../components/dashboard/modals/DeleteTaskNoteModal";
import Header from "../../components/dashboard/Header";

export default function DashboardResponsive() {
  const menu_open = useDisclosure();
  const [currentTask, setCurrentTask] = useState({ task_id: "" });
  const notes = useSelector(state => state.tasks.notes);
  const delete_modal = useDisclosure()
  const edit_note_drawer = useDisclosure()
  const new_note_drawer = useDisclosure()

  // Move hooks to component level
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');
  const noteCardBg = useColorModeValue('gray.50', 'gray.700');

  const handleAddItem = (task) => {
    setCurrentTask(task);
    new_note_drawer.onOpen(true);
  };

  const handleUpdateItem = (task) => {
    setCurrentTask(task);
    edit_note_drawer.onOpen(true);
  };

  const handleDeleteItem = (task) => {
    setCurrentTask(task);
    delete_modal.onOpen(true);
  };

  const dispatch = useDispatch();

  const initFetch = useCallback(() => {
    dispatch(retrieveNotes());
  }, [dispatch])

  useEffect(() => {
    initFetch()
  }, [initFetch])

  return (
    <>
      <Helmet>
        <title>Notes</title>
        <meta name="description" content="App Description" />
        <meta name="theme-color" content="#008f68" />
      </Helmet>
      <DeleteTaskNoteModal currentTask={currentTask} disclosures={delete_modal} />
      <NewNoteDrawer task={currentTask} disclosures={new_note_drawer} />
      <EditNoteDrawer currentTask={currentTask} setCurrentTask={setCurrentTask} disclosures={edit_note_drawer}></EditNoteDrawer>

      <Box minH="100vh" bg={pageBg}>
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
            bg={mainBg}
            borderRadius="lg"
            boxShadow="sm"
          >
            <Box
              bg="white"
              borderRadius="lg"
              p={{ base: 4, md: 6 }}
              boxShadow="md"
            >
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb={6}
              >
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="blue.600"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <ChevronRightIcon /> NOTES
                </Text>
                <IconButton
                  aria-label="Add Note"
                  icon={<AddIcon />}
                  size="sm"
                  onClick={() => handleAddItem({})}
                  variant="ghost"
                />
              </Flex>

              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)"
                }}
                gap={6}
              >
                {notes.map((task, index) => (
                  <Box
                    key={task.task_id || index}
                    p={4}
                    bg={noteCardBg}
                    borderRadius="md"
                    boxShadow="sm"
                  >
                    <Table variant="simple">
                      <Thead>
                        <Tr fontSize={'14px'} fontWeight={'bold'}>
                          <Th>Title</Th>
                          <Th>Created At</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr fontSize={'14px'}>
                          <Td onClick={() => handleUpdateItem(task)}>{task.title}</Td>
                          <Td>{formatLocalDateTime(task.created_at)}</Td>
                          <Td>
                            <Flex justify="space-between">
                              <Box flex={1} mr={2}>
                                <IconButton
                                  aria-label="Edit Task"
                                  icon={<EditIcon />}
                                  size="sm"
                                  onClick={() => handleUpdateItem(task)}
                                  variant="ghost"
                                />
                              </Box>
                              <Box flex={1}>
                                <IconButton
                                  aria-label="Delete Task"
                                  icon={<DeleteIcon />}
                                  onClick={() => handleDeleteItem(task)}
                                  size="sm"
                                  variant="ghost"
                                />
                              </Box>
                            </Flex>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </Box>
                ))}
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
