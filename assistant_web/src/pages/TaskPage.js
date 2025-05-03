import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Divider,
  Avatar,
  AvatarBadge,
  AvatarGroup,
  Tag,
  TagLabel,
  Icon,
  Grid,
  GridItem,
  useToast,
  Spinner,
  Center,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  Input,
  FormControl,
  FormLabel,
  useColorMode
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
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaHistory,
  FaLink,
  FaRegComment,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import { formatLocalDateTime } from '../utils/locale';
import TaskService from '../services/taskservice';
import CommentService from '../services/CommentService';
import ConfigService from '../utils/config';

const TaskPage = () => {
  const { task_id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const toast = useToast();
  const { colorMode } = useColorMode();
  
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const infoBg = useColorModeValue("gray.50", "gray.700");
  const tagBg = useColorModeValue("blue.50", "blue.900");
  const tagColor = useColorModeValue("blue.700", "blue.200");

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      const workspace = ConfigService.getDefaultWorkspace();
      const response = await TaskService.get(task_id);
      setTask(response.data);
      setEditedTask(response.data);
      await fetchRelatedTasks(response.data);
    } catch (error) {
      toast({
        title: "Error fetching task",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (task_id) {
      fetchTask();
    }
  }, [task_id]);

  const fetchRelatedTasks = async (currentTask) => {
    try {
      const workspace = ConfigService.getDefaultWorkspace();
      const response = await TaskService.getAll();
      const related = response.data.filter(t => 
        t.task_id !== currentTask.task_id && 
        (t.labels?.some(label => currentTask.labels?.includes(label)) || 
         t.assignee_id === currentTask.assignee_id)
      );
      setRelatedTasks(related.slice(0, 3));
    } catch (error) {
      console.error('Error fetching related tasks:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsCommentLoading(true);
      const workspace = ConfigService.getDefaultWorkspace();
      const userId = ConfigService.getUserId();
      
      const commentData = {
        workspace_id: workspace.workspace_id,
        content: newComment,
        user_id: userId,
        task_id: task.task_id
      };

      await CommentService.createComment(workspace.workspace_id, commentData);
      setNewComment('');
      await fetchTask();
      toast({
        title: "Comment added",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error adding comment",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    try {
      const workspace = ConfigService.getDefaultWorkspace();
      await TaskService.update(task_id, editedTask);
      setTask(editedTask);
      setEditMode(false);
      toast({
        title: "Task updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error updating task",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTask = async () => {
    try {
      const workspace = ConfigService.getDefaultWorkspace();
      await TaskService.remove(task_id);
      toast({
        title: "Task deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate('/tasks');
    } catch (error) {
      toast({
        title: "Error deleting task",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
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

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!task) {
    return (
      <Center h="100vh">
        <Text>Task not found</Text>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box bg={bg} p={8} borderRadius="lg" boxShadow="md">
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="start" spacing={2}>
            {editMode ? (
              <Input
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                fontSize="3xl"
                fontWeight="bold"
                mb={2}
              />
            ) : (
              <Text fontSize="3xl" fontWeight="bold">{task.title}</Text>
            )}
            <HStack spacing={2}>
              {editMode ? (
                <Select
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                  size="sm"
                  width="150px"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </Select>
              ) : (
                <Badge colorScheme={getStatusColor(task.status)}>
                  {task.status === 'todo' ? 'To Do' : 
                   task.status === 'in_progress' ? 'In Progress' : 'Done'}
                </Badge>
              )}
              {editMode ? (
                <Select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                  size="sm"
                  width="150px"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              ) : (
                <Badge colorScheme={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              )}
            </HStack>
          </VStack>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<FaEllipsisV />}
              variant="ghost"
            />
            <MenuList>
              <MenuItem icon={<FaEdit />} onClick={() => setEditMode(true)}>
                Edit Task
              </MenuItem>
              <MenuItem icon={<FaTrash />} onClick={onOpen}>
                Delete Task
              </MenuItem>
              <MenuItem icon={<FaLink />} onClick={() => navigator.clipboard.writeText(window.location.href)}>
                Copy Link
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>Details</Tab>
            <Tab>Comments</Tab>
            <Tab>Activity</Tab>
            <Tab>Related Tasks</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Description Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Description</Text>
                  {editMode ? (
                    <Textarea
                      value={editedTask.description}
                      onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                      minH="200px"
                    />
                  ) : (
                    <Box 
                      p={3} 
                      bg={infoBg} 
                      borderRadius="md"
                      className="ProseMirror"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  )}
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
                      {editMode ? (
                        <Input
                          value={editedTask.storyPoints}
                          onChange={(e) => setEditedTask({ ...editedTask, storyPoints: e.target.value })}
                        />
                      ) : (
                        <Text fontSize="lg" fontWeight="bold">{task.storyPoints || "Not set"}</Text>
                      )}
                    </VStack>
                  </GridItem>

                  {/* Due Date */}
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Icon as={FaCalendarAlt} />
                        <Text fontWeight="medium">Due Date</Text>
                      </HStack>
                      {editMode ? (
                        <Input
                          type="datetime-local"
                          value={editedTask.dueDate}
                          onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                        />
                      ) : (
                        <Text fontSize="lg" fontWeight="bold">
                          {formatLocalDateTime(task.dueDate)}
                        </Text>
                      )}
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

                {editMode && (
                  <HStack justify="flex-end" mt={4}>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleUpdateTask}>
                      Save Changes
                    </Button>
                  </HStack>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {task.comments?.map((comment) => (
                  <Box
                    key={comment.comment_id}
                    p={4}
                    bg={infoBg}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack>
                        <Avatar size="sm" name="User">
                          <AvatarBadge boxSize="1.25em" bg="green.500" />
                        </Avatar>
                        <Text fontWeight="bold">User</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {formatLocalDateTime(comment.created_at)}
                      </Text>
                    </Flex>
                    <Text>{comment.content}</Text>
                  </Box>
                ))}

                <Box mt={4}>
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    mb={2}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={handleAddComment}
                    isLoading={isCommentLoading}
                    isDisabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </Box>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {task.activities?.map((activity, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg={infoBg}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <Icon as={FaHistory} />
                        <Text>{activity.description}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {formatLocalDateTime(activity.created_at)}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {relatedTasks.map((relatedTask) => (
                  <Box
                    key={relatedTask.task_id}
                    p={4}
                    bg={infoBg}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                    cursor="pointer"
                    onClick={() => navigate(`/page/${relatedTask.task_id}`)}
                  >
                    <Text fontWeight="bold">{relatedTask.title}</Text>
                    <HStack mt={2}>
                      <Badge colorScheme={getStatusColor(relatedTask.status)}>
                        {relatedTask.status}
                      </Badge>
                      <Badge colorScheme={getPriorityColor(relatedTask.priority)}>
                        {relatedTask.priority}
                      </Badge>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Task</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this task? This action cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteTask}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default TaskPage; 