import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveTasks } from "../../slices/tasks";
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
  MenuDivider,
} from "@chakra-ui/react";
import { FiSearch, FiFilter, FiCalendar, FiTag, FiUser, FiChevronDown, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Navbar from "../../components/dashboard/Navbar";
import Header from "../../components/dashboard/Header";
import { formatLocalDateTime } from "../../utils/locale";

export default function SearchTasksPage() {
  const menu_open = useDisclosure();
  const filterDrawer = useDisclosure();
  const dispatch = useDispatch();
  const tasks = useSelector(state => state.tasks.tasks);
  
  // Move hooks to component level
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get unique tags and users for filters
  const allTags = [...new Set(tasks.flatMap(task => task.tags || []))];
  const allUsers = [...new Set(tasks.map(task => task.assigned_to))];

  const initFetch = useCallback(() => {
    dispatch(retrieveTasks());
  }, [dispatch]);

  useEffect(() => {
    initFetch();
  }, [initFetch]);

  // Filter tasks based on search and filter criteria
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      const matchesTags = selectedTags.length === 0 || 
                         (task.tags && selectedTags.some(tag => task.tags.includes(tag)));
      
      const matchesUsers = selectedUsers.length === 0 || 
                          selectedUsers.includes(task.assigned_to);

      return matchesSearch && matchesStatus && matchesPriority && matchesTags && matchesUsers;
    })
    .sort((a, b) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'created_at') {
        return order * (new Date(a.created_at) - new Date(b.created_at));
      } else if (sortBy === 'due_date') {
        return order * (new Date(a.due_date) - new Date(b.due_date));
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return order * (priorityOrder[a.priority] - priorityOrder[b.priority]);
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
                <Heading size="lg">Search Tasks</Heading>
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
                      <MenuItem onClick={() => handleSort('due_date')}>
                        <Flex align="center" gap={2}>
                          <Icon as={sortBy === 'due_date' ? (sortOrder === 'asc' ? FiArrowUp : FiArrowDown) : null} />
                          Due Date
                        </Flex>
                      </MenuItem>
                      <MenuItem onClick={() => handleSort('priority')}>
                        <Flex align="center" gap={2}>
                          <Icon as={sortBy === 'priority' ? (sortOrder === 'asc' ? FiArrowUp : FiArrowDown) : null} />
                          Priority
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
                  placeholder="Search tasks..."
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
                {filteredTasks.map((task) => (
                  <Box
                    key={task.task_id}
                    p={4}
                    bg={cardBg}
                    borderRadius="md"
                    boxShadow="sm"
                    _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
                  >
                    <Stack spacing={3}>
                      <Text fontWeight="bold" fontSize="lg">
                        {task.title}
                      </Text>
                      <Box 
                        className="ProseMirror"
                        color={textColor} 
                        noOfLines={2}
                        dangerouslySetInnerHTML={{ __html: task.description || "No description provided." }}
                      />
                      <Flex wrap="wrap" gap={2}>
                        <Badge colorScheme={task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'orange' : 'blue'}>
                          {task.status === 'todo' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : 'Done'}
                        </Badge>
                        <Badge colorScheme={task.priority === 'high' ? 'red' : 'yellow'}>
                          {task.priority}
                        </Badge>
                        {task.tags?.map((tag, index) => (
                          <Badge key={index} colorScheme="purple">
                            {tag}
                          </Badge>
                        ))}
                      </Flex>
                      <Text fontSize="sm" color="gray.500">
                        Due: {formatLocalDateTime(task.due_date)}
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
          <DrawerHeader>Filter Tasks</DrawerHeader>
          <DrawerBody>
            <Stack spacing={6}>
              <Box>
                <Text mb={2}>Status</Text>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Select>
              </Box>

              <Box>
                <Text mb={2}>Priority</Text>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
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
                <Text mb={2}>Assigned To</Text>
                <CheckboxGroup
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                >
                  <Stack spacing={2}>
                    {allUsers.map((user) => (
                      <Checkbox key={user} value={user}>
                        {user}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              </Box>
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
} 