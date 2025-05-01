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
  Heading
} from '@chakra-ui/react';

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
import { FiEye, FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";

export default function DashboardResponsive() {
  const menu_open = useDisclosure();
  const [currentTask, setCurrentTask] = useState({ task_id: "" });
  const notes = useSelector(state => state.tasks.notes);
  const delete_modal = useDisclosure()
  const edit_note_drawer = useDisclosure()
  const new_note_drawer = useDisclosure()
  const navigate = useNavigate();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  // Move hooks to component level
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');
  const noteCardBg = useColorModeValue('gray.50', 'gray.700');

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
        <Card key={note.task_id} bg={noteCardBg} borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
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
                <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} noOfLines={3}>
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
                <UnifiedCreateButton 
                  onCreateNote={handleAddItem}
                  onCreateTask={() => {
                    navigate('/tasks');
                  }}
                />
              </Flex>

              {/* Search and Filter Section */}
              <VStack align="stretch" spacing={4} mb={6}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                <HStack spacing={4}>
                  <Select
                    placeholder="Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    width="200px"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Select>

                  <Select
                    placeholder="Sort by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    width="150px"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title</option>
                  </Select>
                </HStack>

                {/* Tags */}
                <Box>
                  <HStack mb={2}>
                    <Icon as={FaTags} color="gray.500" />
                    <Text fontSize="sm" fontWeight="medium">Tags</Text>
                  </HStack>
                  <Wrap>
                    {tags.map(tag => (
                      <Tag
                        key={tag}
                        size="md"
                        borderRadius="full"
                        variant={selectedTags.includes(tag) ? "solid" : "outline"}
                        colorScheme="blue"
                        cursor="pointer"
                        onClick={() => handleTagClick(tag)}
                      >
                        <TagLabel>{tag}</TagLabel>
                      </Tag>
                    ))}
                  </Wrap>
                </Box>
              </VStack>

              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)"
                }}
                gap={6}
              >
                {filteredNotes.map((task, index) => (
                  <NoteCard key={task.task_id || index} note={task} />
                ))}
              </Grid>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
