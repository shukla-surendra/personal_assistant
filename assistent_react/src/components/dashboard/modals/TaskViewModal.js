import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Badge,
  Box,
  Text,
  HStack,
  VStack,
  Divider,
  useColorModeValue,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  AvatarGroup,
  Tag,
  TagLabel,
  Icon,
  Grid,
  GridItem,
  Textarea,
  Button,
  AvatarBadge,
} from "@chakra-ui/react";
import { 
  FaCalendarAlt, 
  FaTag, 
  FaClipboardList, 
  FaUser, 
  FaPaperclip,
  FaClock,
  FaUsers,
  FaHashtag,
  FaRegComment,
  FaEdit
} from "react-icons/fa";
import { formatLocalDateTime } from '../../../utils/locale';

// Sample comments data
const sampleComments = [
  {
    id: 1,
    author: "John Doe",
    avatar: "https://bit.ly/dan-abramov",
    content: "I've completed the initial setup for the project. Please review the changes.",
    timestamp: "2024-03-15T10:30:00",
  },
  {
    id: 2,
    author: "Jane Smith",
    avatar: "https://bit.ly/ryan-florence",
    content: "The changes look good. I've added some additional requirements in the documentation.",
    timestamp: "2024-03-15T11:45:00",
  },
  {
    id: 3,
    author: "Mike Johnson",
    avatar: "https://bit.ly/kent-c-dodds",
    content: "I've reviewed the documentation and started working on the implementation.",
    timestamp: "2024-03-15T14:20:00",
  },
];

const TaskViewModal = ({ isOpen, onClose, task, onEdit }) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(sampleComments);
  const [content, setContent] = useState('');
  
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const infoBg = useColorModeValue("gray.50", "gray.700");
  const tagBg = useColorModeValue("blue.50", "blue.900");
  const tagColor = useColorModeValue("blue.700", "blue.200");
  const commentBg = useColorModeValue("gray.50", "gray.700");

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'green';
      case 'in_progress':
        return 'orange';
      case 'todo':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'red';
      case 'Medium':
        return 'yellow';
      case 'Low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        author: "Current User",
        avatar: "https://bit.ly/code-beast",
        content: newComment,
        timestamp: new Date().toISOString(),
      };
      setComments([...comments, newCommentObj]);
      setNewComment("");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bg}>
        <ModalHeader>
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={2}>
              <Text fontSize="xl" fontWeight="bold">{task.title}</Text>
              <HStack spacing={2}>
                <Badge colorScheme={getStatusColor(task.status)}>
                  {task.status === 'todo' ? 'To Do' : 
                   task.status === 'in_progress' ? 'In Progress' : 'Done'}
                </Badge>
                <Badge colorScheme={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </HStack>
            </VStack>
            <IconButton
              aria-label="Edit task"
              icon={<Icon as={FaEdit} />}
              variant="ghost"
              colorScheme="blue"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
            />
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Description Section */}
            <Box>
              <Text fontWeight="bold" mb={2}>Description</Text>
              <Box p={3} bg={infoBg} borderRadius="md">
                <Text>{content}</Text>
              </Box>
            </Box>

            <Divider />

            {/* Task Details Grid */}
            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              {/* Story Points */}
              <GridItem>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaClock} />
                    <Text fontWeight="medium">Story Points</Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold">{task.storyPoints || "Not set"}</Text>
                </VStack>
              </GridItem>

              {/* Due Date */}
              <GridItem>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaCalendarAlt} />
                    <Text fontWeight="medium">Due Date</Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    {formatLocalDateTime(task.dueDate)}
                  </Text>
                </VStack>
              </GridItem>

              {/* Assignees */}
              <GridItem>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaUsers} />
                    <Text fontWeight="medium">Assignees</Text>
                  </HStack>
                  {task.assignees && task.assignees.length > 0 ? (
                    <AvatarGroup size="md" max={3}>
                      {task.assignees.map((user, index) => (
                        <Avatar key={index} src={user.avatar} name={user.name} />
                      ))}
                    </AvatarGroup>
                  ) : (
                    <Text color="gray.500">No assignees</Text>
                  )}
                </VStack>
              </GridItem>

              {/* Labels */}
              <GridItem>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <Icon as={FaHashtag} />
                    <Text fontWeight="medium">Labels</Text>
                  </HStack>
                  {task.labels && task.labels.length > 0 ? (
                    <HStack flexWrap="wrap" spacing={2}>
                      {task.labels.map((label, index) => (
                        <Tag
                          key={index}
                          size="md"
                          borderRadius="full"
                          variant="solid"
                          bg={tagBg}
                          color={tagColor}
                        >
                          <TagLabel>{label}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>
                  ) : (
                    <Text color="gray.500">No labels</Text>
                  )}
                </VStack>
              </GridItem>
            </Grid>

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <>
                <Divider />
                <Box>
                  <HStack mb={2}>
                    <Icon as={FaPaperclip} />
                    <Text fontWeight="medium">Attachments</Text>
                  </HStack>
                  <VStack align="start" spacing={2}>
                    {task.attachments.map((file, index) => (
                      <HStack
                        key={index}
                        p={2}
                        bg={infoBg}
                        borderRadius="md"
                        w="100%"
                        justify="space-between"
                      >
                        <Text fontSize="sm">{file.name}</Text>
                        <IconButton
                          size="xs"
                          icon={<FaPaperclip />}
                          variant="ghost"
                          onClick={() => window.open(file.url, '_blank')}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {/* Comments Section */}
            <Divider />
            <Box>
              <Flex align="center" mb={4}>
                <Icon as={FaRegComment} mr={2} />
                <Text fontWeight="bold">Comments</Text>
              </Flex>

              <VStack align="start" spacing={4} mb={4}>
                {comments.map((comment) => (
                  <Box
                    key={comment.id}
                    w="100%"
                    p={3}
                    bg={commentBg}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack>
                        <Avatar size="sm" src={comment.avatar}>
                          <AvatarBadge boxSize="1.25em" bg="green.500" />
                        </Avatar>
                        <Text fontWeight="bold">{comment.author}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(comment.timestamp).toLocaleString()}
                      </Text>
                    </Flex>
                    <Text>{comment.content}</Text>
                  </Box>
                ))}
              </VStack>

              <Box w="100%">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  mb={2}
                  size="sm"
                  rows={3}
                />
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={handleAddComment}
                  isDisabled={!newComment.trim()}
                >
                  Add Comment
                </Button>
              </Box>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TaskViewModal;
