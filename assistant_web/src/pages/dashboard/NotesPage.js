import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  VStack,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  Icon,
  Text,
  useDisclosure,
  Box,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stack,
  StackDivider,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveNotes } from "../../slices/tasks";
import { AddIcon, EditIcon, ChevronRightIcon, DeleteIcon, SearchIcon, FilterIcon } from '@chakra-ui/icons';
import Navbar from "../../components/dashboard/Navbar";
import { Helmet } from 'react-helmet';
import { formatLocalDateTime } from "../../utils/locale"
import NewNoteDrawer from "../../components/dashboard/drawers/NewNoteDrawer";
import EditNoteDrawer from '../../components/dashboard/drawers/EditNoteDrawer'
import DeleteTaskNoteModal from "../../components/dashboard/modals/DeleteTaskNoteModal";
import Header from "../../components/dashboard/Header";
import { FaTags, FaFolder, FaEye, FaTrash } from "react-icons/fa";
import UnifiedEditButton from "../../components/dashboard/UnifiedEditButton";
import UnifiedCreateButton from "../../components/dashboard/UnifiedCreateButton";
import { useNavigate } from "react-router-dom";
import NoteViewModal from "../../components/dashboard/modals/NoteViewModal";
import { FiEye, FiMoreVertical, FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";

export default function NotesPage() {
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const menu_open = useDisclosure();
  const [currentTask, setCurrentTask] = useState({ task_id: "" });
  const notes = useSelector(state => state.tasks.notes);
  const delete_modal = useDisclosure()
  const edit_note_drawer = useDisclosure()
  const new_note_drawer = useDisclosure()
  const view_task_modal = useDisclosure()
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const contentColor = useColorModeValue('gray.600', 'gray.400');

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

  // Refresh notes when edit drawer closes
  useEffect(() => {
    if (!edit_note_drawer.isOpen) {
      initFetch();
    }
  }, [edit_note_drawer.isOpen, initFetch]);

  // Refresh notes when new note drawer closes
  useEffect(() => {
    if (!new_note_drawer.isOpen) {
      initFetch();
    }
  }, [new_note_drawer.isOpen, initFetch]);

  // Get all unique categories and tags
  const { categories, tags } = useMemo(() => {
    const uniqueCategories = new Set();
    const uniqueTags = new Set();
    
    notes.forEach(note => {
      if (note.category) uniqueCategories.add(note.category);
      if (note.tags) note.tags.forEach(tag => uniqueTags.add(tag));
    });

    return {
      categories: Array.from(uniqueCategories),
      tags: Array.from(uniqueTags)
    };
  }, [notes]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (note.description && note.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = !selectedCategory || note.category === selectedCategory;
        const matchesTags = selectedTags.length === 0 || 
                          (note.tags && selectedTags.every(tag => note.tags.includes(tag)));
        
        return matchesSearch && matchesCategory && matchesTags;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at) - new Date(a.created_at);
          case 'oldest':
            return new Date(a.created_at) - new Date(b.created_at);
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [notes, searchQuery, selectedCategory, selectedTags, sortBy]);

  const handleTagClick = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleViewItem = (note) => {
    setCurrentTask(note);
    view_task_modal.onOpen();
  };

  const NoteCard = React.memo(({ note }) => {
    const [content, setContent] = useState('');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    useEffect(() => {
      if (note?.description) {
        try {
          const jsonContent = typeof note.description === 'string' 
            ? JSON.parse(note.description) 
            : note.description;
          
          const textContent = extractTextFromLexicalJSON(jsonContent);
          setContent(textContent);
        } catch (error) {
          console.error('Error parsing description:', error);
          setContent(note.description);
        }
      }
    }, [note?.description]);

    return (
      <>
        <Card key={note.task_id} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="sm">
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/note/${note.task_id}`)}
                  _hover={{ textDecoration: 'underline' }}
                  p={0}
                  h="auto"
                  fontWeight="semibold"
                >
                  {note.title}
                </Button>
              </Heading>
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
                    <MenuItem icon={<FiEdit2 />} onClick={() => handleUpdateItem(note)}>
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
              <Box>
                <Text fontSize="sm" color={textColor} noOfLines={3}>
                  {content}
                </Text>
              </Box>
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
          onEdit={handleUpdateItem}
        />
      </>
    );
  });

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
      <NoteViewModal 
        isOpen={view_task_modal.isOpen} 
        onClose={view_task_modal.onClose} 
        note={currentTask}
        onEdit={handleUpdateItem}
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
                <UnifiedCreateButton 
                  onCreateNote={handleAddItem}
                  onCreateTask={() => navigate('/tasks')}
                />
              </Flex>

              <Tabs variant="enclosed" colorScheme="blue" w="full">
                <TabList>
                  <Tab>Board View</Tab>
                  <Tab>Table View</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel p={0} mt={4}>
                    <Grid 
                      templateColumns={{ 
                        base: "1fr", 
                        md: "repeat(2, 1fr)", 
                        lg: "repeat(3, 1fr)" 
                      }} 
                      gap={6}
                    >
                      {filteredNotes.map((note, index) => (
                        <GridItem key={index}>
                          <Box 
                            bg={cardBg}
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="lg"
                            p={4}
                            _hover={{
                              transform: 'translateY(-2px)',
                              boxShadow: 'lg',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Flex justify="space-between" align="center" mb={4}>
                              <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                                {note.title}
                              </Text>
                              <HStack spacing={2}>
                                <IconButton
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewItem(note)}
                                  aria-label="View Note"
                                />
                                <IconButton
                                  icon={<FiExternalLink />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigate(`/note/${note.task_id}`)}
                                  aria-label="Open in new page"
                                />
                                <UnifiedEditButton 
                                  item={note} 
                                  type="note" 
                                  onEdit={handleUpdateItem}
                                />
                                <IconButton
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(note)}
                                  aria-label="Delete Note"
                                />
                              </HStack>
                            </Flex>
                            <Text 
                              fontSize="sm" 
                              color={contentColor} 
                              noOfLines={3}
                              mb={4}
                            >
                              {extractTextFromLexicalJSON(note.description)}
                            </Text>
                            <Flex justify="space-between" align="center">
                              <Text fontSize="xs" color="gray.500">
                                Updated: {formatLocalDateTime(note.updated_at)}
                              </Text>
                              {note.tags && note.tags.length > 0 && (
                                <HStack spacing={1}>
                                  {note.tags.slice(0, 2).map((tag, i) => (
                                    <Tag key={i} size="sm" colorScheme="blue">
                                      {tag}
                                    </Tag>
                                  ))}
                                  {note.tags.length > 2 && (
                                    <Tag size="sm" colorScheme="gray">
                                      +{note.tags.length - 2}
                                    </Tag>
                                  )}
                                </HStack>
                              )}
                            </Flex>
                          </Box>
                        </GridItem>
                      ))}
                    </Grid>
                  </TabPanel>

                  <TabPanel p={0} mt={4}>
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Title</Th>
                            <Th>Content</Th>
                            <Th>Updated At</Th>
                            <Th>Tags</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredNotes.map((note, index) => (
                            <Tr key={index}>
                              <Td>
                                <Text 
                                  fontWeight="medium" 
                                  cursor="pointer"
                                  onClick={() => handleUpdateItem(note)}
                                >
                                  {note.title}
                                </Text>
                              </Td>
                              <Td>
                                <Text noOfLines={2}>
                                  {extractTextFromLexicalJSON(note.description)}
                                </Text>
                              </Td>
                              <Td>{formatLocalDateTime(note.updated_at)}</Td>
                              <Td>
                                <HStack spacing={1}>
                                  {note.tags && note.tags.slice(0, 2).map((tag, i) => (
                                    <Tag key={i} size="sm" colorScheme="blue">
                                      {tag}
                                    </Tag>
                                  ))}
                                  {note.tags && note.tags.length > 2 && (
                                    <Tag size="sm" colorScheme="gray">
                                      +{note.tags.length - 2}
                                    </Tag>
                                  )}
                                </HStack>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    icon={<FiEye />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewItem(note)}
                                    aria-label="View Note"
                                  />
                                  <IconButton
                                    icon={<FiExternalLink />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => navigate(`/note/${note.task_id}`)}
                                    aria-label="Open in new page"
                                  />
                                  <UnifiedEditButton 
                                    item={note} 
                                    type="note" 
                                    onEdit={handleUpdateItem}
                                  />
                                  <IconButton
                                    icon={<FiTrash2 />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteItem(note)}
                                    aria-label="Delete Note"
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
            </VStack>
          </Box>
        </Box>
      </Box>
    </>
  );
}
