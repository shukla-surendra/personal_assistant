import React, { useState, useEffect } from "react";
import {
  Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Box, Button, FormControl,
  Input, Menu, MenuButton, MenuItem, MenuList, Icon, Text, useColorModeValue,
  Badge, Tooltip, useToast, IconButton, VStack, HStack, Divider, Tag,
  TagLabel, TagCloseButton, Wrap, Select, InputGroup, InputLeftElement,
  InputRightElement, Spinner, Flex, Popover, PopoverTrigger, PopoverContent,
  PopoverBody, PopoverArrow, Portal, MenuDivider, FormLabel, AvatarGroup,
  Avatar, Progress
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from 'react-router-dom';
import { updateTask } from "../../../slices/tasks";
import { 
  FaArrowLeft, FaSave, FaCalendarAlt, FaTag, FaClipboardList, 
  FaUser, FaPaperclip, FaPlus, FaClock, FaUsers, FaHashtag,
  FaShare, FaEllipsisH, FaCheckCircle, FaRegCircle
} from "react-icons/fa";
import { FiMoreHorizontal, FiCheck, FiClock } from "react-icons/fi";
import RichTextEditor from '../editor/RichTextEditor';
import TaskDataService from "../../../services/taskservice";
import { formatLocalDateTime } from "../../../utils/locale";

// Sample data for demonstration
const sampleUsers = [
  { id: 1, name: "John Doe", avatar: "https://bit.ly/dan-abramov" },
  { id: 2, name: "Jane Smith", avatar: "https://bit.ly/ryan-florence" },
  { id: 3, name: "Mike Johnson", avatar: "https://bit.ly/kent-c-dodds" },
];

const sampleLabels = [
  "Frontend", "Backend", "Bug", "Feature", "UI/UX", "Documentation"
];

const storyPoints = [1, 2, 3, 5, 8, 13, 21];

const PRIORITY_COLORS = {
  Low: "green",
  Medium: "yellow",
  High: "orange",
  Urgent: "red"
};

const STATUS_CONFIG = {
  todo: { color: "gray", label: "To Do" },
  in_progress: { color: "blue", label: "In Progress" },
  done: { color: "green", label: "Done" }
};

export default function EditTaskDrawer(props) {
  const { currentTask, setCurrentTask, disclosures, onTaskUpdate } = props;
  const { isOpen, onClose } = disclosures;
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const toast = useToast();

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const labelColor = useColorModeValue("gray.700", "gray.300");

  useEffect(() => {
    if (isOpen && currentTask?.task_id) {
      getTask(currentTask.task_id);
    }
  }, [isOpen, currentTask?.task_id]);

  const getTask = async (id) => {
    setLoading(true);
    try {
      const response = await TaskDataService.get(id);
      if (response?.data) {
        setCurrentTask(response.data);
      }
    } catch (error) {
      console.error('Error loading task:', error);
      toast({
        title: "Error",
        description: "Failed to load task",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const updateContent = async () => {
    setLoading(true);
    try {
      await dispatch(updateTask({ task_id: currentTask.task_id, data: currentTask })).unwrap();
      toast({
        title: "Success",
        description: "Task updated successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      if (onTaskUpdate) {
        onTaskUpdate(currentTask);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer 
      onClose={onClose} 
      isOpen={isOpen} 
      size="xl"
      placement="right"
    >
      <DrawerOverlay backdropFilter="blur(4px)" />
      <DrawerContent 
        bg={bgColor} 
        borderLeft="1px" 
        borderColor={borderColor}
        boxShadow="xl"
      >
        <DrawerCloseButton top={4} right={4} />
        
        {/* Header */}
        <DrawerHeader 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          py={4}
          px={6}
        >
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <IconButton
                icon={<Icon as={FaArrowLeft} />}
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Back"
              />
              <Badge 
                colorScheme={STATUS_CONFIG[currentTask?.status || 'todo'].color}
                px={2}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                {STATUS_CONFIG[currentTask?.status || 'todo'].label}
              </Badge>
            </HStack>
            <HStack spacing={2}>
              <AvatarGroup size="sm" max={3}>
                {sampleUsers.map(user => (
                  <Avatar
                    key={user.id}
                    name={user.name}
                    src={user.avatar}
                    size="sm"
                  />
                ))}
              </AvatarGroup>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<Icon as={FiMoreHorizontal} />}
                  variant="ghost"
                  size="sm"
                  aria-label="More options"
                />
                <MenuList shadow="lg" py={2}>
                  <MenuItem icon={<Icon as={FaShare} />} py={2}>
                    Share
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaUsers} />} py={2}>
                    Assign
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<Icon as={FaCheckCircle} />} py={2}>
                    Mark as Complete
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </DrawerHeader>

        {/* Body */}
        <DrawerBody px={6} py={4}>
          <VStack spacing={6} align="stretch">
            {/* Title Input */}
            <FormControl>
              <Input
                placeholder="Task title"
                name="title"
                value={currentTask?.title || ''}
                onChange={handleInputChange}
                size="lg"
                fontSize="2xl"
                fontWeight="bold"
                variant="unstyled"
                px={0}
                _placeholder={{ color: mutedColor }}
              />
              <Text fontSize="sm" color={mutedColor}>
                Created {formatLocalDateTime(currentTask?.created_at)}
              </Text>
            </FormControl>

            <Divider />

            {/* Task Metadata */}
            <VStack spacing={4} align="stretch">
              {/* Status and Priority */}
              <HStack spacing={6}>
                <FormControl>
                  <HStack spacing={3}>
                    <Icon as={FaClipboardList} color={mutedColor} />
                    <Select
                      name="status"
                      value={currentTask?.status || ''}
                      onChange={handleInputChange}
                      size="sm"
                      width="150px"
                      variant="filled"
                      bg={inputBg}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </Select>
                  </HStack>
                </FormControl>

                <FormControl>
                  <HStack spacing={3}>
                    <Icon as={FaTag} color={mutedColor} />
                    <Select
                      name="priority"
                      value={currentTask?.priority || ''}
                      onChange={handleInputChange}
                      size="sm"
                      width="150px"
                      variant="filled"
                      bg={inputBg}
                    >
                      {Object.keys(PRIORITY_COLORS).map(priority => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                </FormControl>
              </HStack>

              {/* Due Date */}
              <FormControl>
                <HStack spacing={3}>
                  <Icon as={FaCalendarAlt} color={mutedColor} />
                  <Input
                    type="datetime-local"
                    name="due_on"
                    value={currentTask?.due_on || ''}
                    onChange={handleInputChange}
                    size="sm"
                    width="auto"
                    variant="filled"
                    bg={inputBg}
                  />
                </HStack>
              </FormControl>

              {/* Assignees */}
              <FormControl>
                <HStack spacing={3} align="flex-start">
                  <Icon as={FaUser} color={mutedColor} mt={2} />
                  <VStack align="stretch" spacing={2} flex={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Assignees
                      </Text>
                      <IconButton
                        icon={<Icon as={FaPlus} />}
                        size="xs"
                        variant="ghost"
                        aria-label="Add assignee"
                      />
                    </HStack>
                    <AvatarGroup size="sm" max={5}>
                      {sampleUsers.map(user => (
                        <Avatar
                          key={user.id}
                          name={user.name}
                          src={user.avatar}
                          size="sm"
                        />
                      ))}
                    </AvatarGroup>
                  </VStack>
                </HStack>
              </FormControl>

              {/* Labels */}
              <FormControl>
                <HStack spacing={3} align="flex-start">
                  <Icon as={FaHashtag} color={mutedColor} mt={2} />
                  <VStack align="stretch" spacing={2} flex={1}>
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        Labels
                      </Text>
                      <IconButton
                        icon={<Icon as={FaPlus} />}
                        size="xs"
                        variant="ghost"
                        aria-label="Add label"
                      />
                    </HStack>
                    <Wrap>
                      {sampleLabels.map(label => (
                        <Tag
                          key={label}
                          size="sm"
                          borderRadius="full"
                          variant="subtle"
                          colorScheme="blue"
                        >
                          <TagLabel>{label}</TagLabel>
                          <TagCloseButton />
                        </Tag>
                      ))}
                    </Wrap>
                  </VStack>
                </HStack>
              </FormControl>
            </VStack>

            <Divider />

            {/* Description */}
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="medium" color={textColor} mb={3}>
                Description
              </Text>
              <RichTextEditor
                value={currentTask?.description || ''}
                onChange={(newContent) => {
                  setCurrentTask(prev => ({
                    ...prev,
                    description: newContent
                  }));
                }}
              />
            </Box>
          </VStack>
        </DrawerBody>

        {/* Footer */}
        <DrawerFooter 
          borderTopWidth="1px" 
          borderColor={borderColor}
          py={4}
          px={6}
        >
          <Flex w="100%" justify="space-between" align="center">
            <Box>
              {loading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color={mutedColor}>
                    Saving changes...
                  </Text>
                </HStack>
              )}
            </Box>
            <HStack spacing={3}>
              <Button
                variant="ghost"
                onClick={onClose}
                size="md"
              >
                Close
              </Button>
              <Button
                colorScheme="blue"
                onClick={updateContent}
                isLoading={loading}
                leftIcon={<Icon as={FaSave} />}
                size="md"
              >
                Save
              </Button>
            </HStack>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}