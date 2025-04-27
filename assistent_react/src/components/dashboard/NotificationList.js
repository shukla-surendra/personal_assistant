import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Badge,
  Button,
} from "@chakra-ui/react";

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
          </Box>
        ))}
      </VStack>
      <Button mt={4} w="100%" size="sm" colorScheme="blue" variant="outline">
        View all notifications
      </Button>
    </Box>
  );
}
