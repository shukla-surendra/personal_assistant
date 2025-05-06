import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Divider,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { FiBell, FiSearch, FiFilter, FiCheck, FiTrash2, FiMoreVertical } from 'react-icons/fi';

// Sample notifications data
const sampleNotifications = [
  {
    id: 1,
    title: "Task Assigned",
    description: "You have been assigned to 'Design Homepage' project",
    time: "2 minutes ago",
    type: "task",
    read: false,
    priority: "high",
  },
  {
    id: 2,
    title: "Meeting Reminder",
    description: "Team sync meeting at 3:00 PM",
    time: "1 hour ago",
    type: "meeting",
    read: true,
    priority: "medium",
  },
  {
    id: 3,
    title: "Document Updated",
    description: "Project requirements document has been updated",
    time: "2 hours ago",
    type: "document",
    read: false,
    priority: "low",
  },
  {
    id: 4,
    title: "New Comment",
    description: "John commented on your task 'Implement API endpoints'",
    time: "3 hours ago",
    type: "comment",
    read: true,
    priority: "medium",
  },
  {
    id: 5,
    title: "Project Deadline",
    description: "Project 'Website Redesign' deadline is approaching",
    time: "1 day ago",
    type: "deadline",
    read: false,
    priority: "high",
  },
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'task':
        return 'blue';
      case 'meeting':
        return 'purple';
      case 'document':
        return 'teal';
      case 'comment':
        return 'yellow';
      case 'deadline':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === 'read' && notification.read);
    
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg">Notifications</Heading>
          <HStack spacing={4}>
            <Button
              leftIcon={<FiCheck />}
              onClick={handleMarkAllAsRead}
              size="sm"
              variant="outline"
            >
              Mark all as read
            </Button>
            <Button
              leftIcon={<FiTrash2 />}
              onClick={handleClearAll}
              size="sm"
              variant="outline"
              colorScheme="red"
            >
              Clear all
            </Button>
          </HStack>
        </Flex>

        {/* Filters and Search */}
        <Flex gap={4} wrap="wrap">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            w={{ base: 'full', md: '200px' }}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </Select>
          <InputGroup w={{ base: 'full', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Flex>

        {/* Notifications List */}
        <VStack spacing={4} align="stretch">
          {filteredNotifications.length === 0 ? (
            <Box
              p={8}
              textAlign="center"
              bg={bgColor}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Text color="gray.500">No notifications found</Text>
            </Box>
          ) : (
            filteredNotifications.map((notification) => (
              <Box
                key={notification.id}
                p={4}
                bg={bgColor}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                position="relative"
                opacity={notification.read ? 0.8 : 1}
              >
                <Flex justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack spacing={2}>
                      <Badge colorScheme={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <Badge colorScheme={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      {!notification.read && (
                        <Badge colorScheme="blue">New</Badge>
                      )}
                    </HStack>
                    <Heading size="sm">{notification.title}</Heading>
                    <Text color="gray.600">{notification.description}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {notification.time}
                    </Text>
                  </VStack>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<FiMoreVertical />}
                      variant="ghost"
                      size="sm"
                    />
                    <MenuList>
                      {!notification.read && (
                        <MenuItem
                          icon={<FiCheck />}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </MenuItem>
                      )}
                      <MenuItem
                        icon={<FiTrash2 />}
                        onClick={() => handleDelete(notification.id)}
                        color="red.500"
                      >
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Box>
            ))
          )}
        </VStack>
      </VStack>
    </Container>
  );
};

export default NotificationsPage; 