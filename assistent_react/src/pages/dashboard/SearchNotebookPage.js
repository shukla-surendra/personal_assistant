import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveNotes } from "../../slices/tasks";
import {
  Box,
  Flex,
  Grid,
  Text,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Button,
  Icon,
  Stack,
  Badge,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Checkbox,
  CheckboxGroup,
  Heading,
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
  FiChevronDown,
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';
import Navbar from "../../components/dashboard/Navbar";
import Header from "../../components/dashboard/Header";
import { formatLocalDateTime } from "../../utils/locale";

export default function SearchNotebookPage() {
  const menu_open = useDisclosure();
  const filterDrawer = useDisclosure();
  const dispatch = useDispatch();
  const notes = useSelector(state => state.tasks.notes);
  
  // Move hooks to component level
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique tags and categories for filters
  const allTags = [...new Set(notes.flatMap(note => note.tags || []))];
  const allCategories = [...new Set(notes.map(note => note.category))];

  const initFetch = useCallback(() => {
    dispatch(retrieveNotes());
  }, [dispatch]);

  useEffect(() => {
    initFetch();
  }, [initFetch]);

  // Filter notes based on search and filter criteria
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
      
      const matchesTags = selectedTags.length === 0 || 
                         (note.tags && selectedTags.some(tag => note.tags.includes(tag)));

      return matchesSearch && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'created_at') {
        return order * (new Date(a.created_at) - new Date(b.created_at));
      } else if (sortBy === 'title') {
        return order * a.title.localeCompare(b.title);
      }
      return 0;
    });

  const handleSort = (field) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <>
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
            <Stack spacing={6}>
              <Flex
                justifyContent="space-between"
                alignItems="center"
                mb={6}
              >
                <Heading size="lg">Search Notebooks</Heading>
                <Flex gap={2}>
                  <Menu>
                    <MenuButton as={Button} rightIcon={<FiChevronDown />} variant="outline">
                      Sort by: {sortBy.replace('_', ' ')}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => handleSort('created_at')}>
                        <Flex align="center" gap={2}>
                          <Icon as={sortBy === 'created_at' ? (sortOrder === 'asc' ? FiArrowUp : FiArrowDown) : null} />
                          Created Date
                        </Flex>
                      </MenuItem>
                      <MenuItem onClick={() => handleSort('title')}>
                        <Flex align="center" gap={2}>
                          <Icon as={sortBy === 'title' ? (sortOrder === 'asc' ? FiArrowUp : FiArrowDown) : null} />
                          Title
                        </Flex>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                  <Button
                    leftIcon={<FiFilter />}
                    onClick={filterDrawer.onOpen}
                    variant="outline"
                  >
                    Filters
                  </Button>
                </Flex>
              </Flex>

              <InputGroup maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                  lg: "repeat(4, 1fr)"
                }}
                gap={6}
              >
                {filteredNotes.map((note) => (
                  <Box
                    key={note.note_id}
                    p={4}
                    bg={cardBg}
                    borderRadius="md"
                    boxShadow="sm"
                    _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                  >
                    <Stack spacing={3}>
                      <Text fontWeight="bold" fontSize="lg">
                        {note.title}
                      </Text>
                      <Text color={textColor} noOfLines={3}>
                        {note.content}
                      </Text>
                      <Flex wrap="wrap" gap={2}>
                        <Badge colorScheme="blue">
                          {note.category}
                        </Badge>
                        {note.tags?.map((tag, index) => (
                          <Badge key={index} colorScheme="purple">
                            {tag}
                          </Badge>
                        ))}
                      </Flex>
                      <Text fontSize="sm" color="gray.500">
                        Created: {formatLocalDateTime(note.created_at)}
                      </Text>
                    </Stack>
                  </Box>
                ))}
              </Grid>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterDrawer.isOpen}
        placement="right"
        onClose={filterDrawer.onClose}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter Notes</DrawerHeader>
          <DrawerBody>
            <Stack spacing={6}>
              <Box>
                <Text mb={2}>Category</Text>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text mb={2}>Tags</Text>
                <CheckboxGroup
                  value={selectedTags}
                  onChange={setSelectedTags}
                >
                  <Stack spacing={2}>
                    {allTags.map((tag) => (
                      <Checkbox key={tag} value={tag}>
                        {tag}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </Box>

              <Box>
                <Text mb={2}>Date Range</Text>
                <Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </Select>
              </Box>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
} 