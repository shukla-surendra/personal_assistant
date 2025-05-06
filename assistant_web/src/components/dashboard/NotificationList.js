import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const notifications = [
  {
    id: 1,
    title: "Task Assigned",
    description: "You have been assigned to 'Design Homepage'.",
    time: "2 min ago",
    type: "task",
    read: false,
  },
  {
    id: 2,
    title: "Meeting Reminder",
    description: "Team meeting at 3:00 PM.",
    time: "1 hr ago",
    type: "meeting",
    read: true,
  },
  // ...add more as needed
];

export default function NotificationList() {
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

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

  return (
    <Box w="340px" maxH="400px" overflowY="auto" p={3}>
      <VStack align="stretch" spacing={3}>
        {notifications.length === 0 && (
          <Text color="gray.500" textAlign="center">
            No notifications
          </Text>
        )}
        {notifications.map((n) => (
          <Box
            key={n.id}
            p={3}
            borderRadius="md"
            bg={n.read ? "gray.100" : "blue.50"}
            boxShadow="sm"
            _hover={{ bg: "blue.100" }}
          >
            <HStack justify="space-between">
              <Text fontWeight="bold">{n.title}</Text>
              <Badge colorScheme={n.read ? "gray" : "blue"}>{n.time}</Badge>
            </HStack>
            <Text fontSize="sm" color="gray.700" mt={1}>
              {n.description}
            </Text>
            <HStack mt={2} spacing={2}>
              <Badge colorScheme={getTypeColor(n.type)}>
                {n.type}
              </Badge>
              {!n.read && (
                <Badge colorScheme="blue">New</Badge>
              )}
            </HStack>
          </Box>
        ))}
      </VStack>
      <Button 
        mt={4} 
        w="100%" 
        size="sm" 
        colorScheme="blue" 
        variant="outline"
        onClick={() => navigate('/notifications')}
      >
        View all notifications
      </Button>
    </Box>
  );
}
