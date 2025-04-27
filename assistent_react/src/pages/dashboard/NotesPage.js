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
  Divider
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
                  <Box
                    key={task.task_id || index}
                    p={4}
                    bg={noteCardBg}
                    borderRadius="lg"
                    boxShadow="sm"
                    transition="all 0.2s"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "md"
                    }}
                  >
                    <Flex direction="column" height="100%">
                      <Box flex="1">
                        <Text
                          fontSize="lg"
                          fontWeight="semibold"
                          mb={2}
                          color="blue.600"
                          cursor="pointer"
                          onClick={() => handleUpdateItem(task)}
                          _hover={{ textDecoration: "underline" }}
                        >
                          {task.title}
                        </Text>
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          mb={2}
                        >
                          {formatLocalDateTime(task.created_at)}
                        </Text>
                        {task.category && (
                          <HStack mb={2}>
                            <Icon as={FaFolder} color="gray.500" />
                            <Text fontSize="sm" color="gray.600">{task.category}</Text>
                          </HStack>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <Wrap mb={4}>
                            {task.tags.map(tag => (
                              <Tag
                                key={tag}
                                size="sm"
                                borderRadius="full"
                                variant="subtle"
                                colorScheme="blue"
                              >
                                <TagLabel>{tag}</TagLabel>
                              </Tag>
                            ))}
                          </Wrap>
                        )}
                      </Box>
                      <Flex justify="flex-end" mt="auto">
                        <HStack spacing={2}>
                          <IconButton
                            icon={<Icon as={FaEye} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateItem(task)}
                            aria-label="View Task"
                          />
                          <UnifiedEditButton 
                            item={task} 
                            type="note" 
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
                      </Flex>
                    </Flex>
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
