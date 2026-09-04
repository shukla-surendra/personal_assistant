import React, { useState } from "react";
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
import { createGeneralTask } from "../../../slices/tasks";
import { 
  FaArrowLeft, FaSave, FaCalendarAlt, FaTag, FaClipboardList, 
  FaUser, FaPaperclip, FaPlus, FaClock, FaUsers, FaHashtag,
  FaShare, FaEllipsisH, FaCheckCircle, FaRegCircle
} from "react-icons/fa";
import { FiMoreHorizontal, FiCheck, FiClock } from "react-icons/fi";
import RichTextEditor from '../editor/RichTextEditor';
import ConfigService from "../../../utils/config";

// Task templates
const TASK_TEMPLATES = [
  { id: 'bug', name: 'Bug Report', description: 'Template for reporting bugs' },
  { id: 'feature', name: 'Feature Request', description: 'Template for feature requests' },
  { id: 'research', name: 'Research Task', description: 'Template for research tasks' },
  { id: 'review', name: 'Code Review', description: 'Template for code reviews' },
];

// Available categories
const AVAILABLE_CATEGORIES = [
  'Development', 'Design', 'Testing', 'Documentation', 'Research', 'Planning', 'Review'
];

// Priority levels with colors
const PRIORITY_LEVELS = [
  { value: 'Low', color: 'green' },
  { value: 'Medium', color: 'yellow' },
  { value: 'High', color: 'orange' },
  { value: 'Urgent', color: 'red' }
];

// Status configuration
const STATUS_CONFIG = {
  todo: { color: "gray", label: "To Do" },
  in_progress: { color: "blue", label: "In Progress" },
  done: { color: "green", label: "Done" }
};

// Sample users for demonstration
const sampleUsers = [
  { id: 1, name: "John Doe", avatar: "https://bit.ly/dan-abramov" },
  { id: 2, name: "Jane Smith", avatar: "https://bit.ly/ryan-florence" },
  { id: 3, name: "Mike Johnson", avatar: "https://bit.ly/kent-c-dodds" },
];

export default function NewTaskDrawer(props) {
  const initialTaskState = {
    task_id: null,
    title: "",
    description: "",
    priority: "Medium",
    status: "todo",
    due_on: "",
    assignees: [],
    labels: [],
    task_type: 'task',
    // Lets a caller (e.g. a Kanban board's "+ Add card" on a specific
    // column) pre-fill board_id/status without this drawer needing to know
    // anything about boards -- unused by existing callers, who don't pass it.
    ...props.defaultValues
  };

  const [size] = useState('xl');
  const { isOpen, onClose } = props.disclosures;
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const dispatch = useDispatch();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);

  // Theme colors
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const labelColor = useColorModeValue("gray.700", "gray.300");

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const handleApplyTemplate = (template) => {
    let initialContent = "";
    switch (template.id) {
      case 'bug':
        initialContent = `<h1>🐛 Bug Report</h1>
<h2>Overview</h2>
<p>Brief description of the bug and its impact.</p>

<h2>Environment</h2>
<ul>
  <li>Browser/Device: </li>
  <li>Operating System: </li>
  <li>Version: </li>
</ul>

<h2>Steps to Reproduce</h2>
<ol>
  <li>Step 1</li>
  <li>Step 2</li>
  <li>Step 3</li>
</ol>

<h2>Expected Behavior</h2>
<p>What should happen when following the steps above.</p>

<h2>Actual Behavior</h2>
<p>What actually happens when following the steps above.</p>

<h2>Additional Context</h2>
<ul>
  <li>Screenshots/Videos: </li>
  <li>Error Messages: </li>
  <li>Related Issues: </li>
</ul>

<h2>Possible Solution</h2>
<p>Any ideas on how to fix this issue.</p>`;
        break;

      case 'feature':
        initialContent = `<h1>✨ Feature Request</h1>
<h2>Problem Statement</h2>
<p>Describe the problem this feature would solve.</p>

<h2>Proposed Solution</h2>
<p>Describe your proposed solution in detail.</p>

<h2>User Story</h2>
<p>As a [type of user], I want [goal] so that [benefit].</p>

<h2>Acceptance Criteria</h2>
<ul>
  <li>Given [context], when [action], then [result]</li>
  <li>Given [context], when [action], then [result]</li>
  <li>Given [context], when [action], then [result]</li>
</ul>

<h2>Technical Requirements</h2>
<ul>
  <li>Performance considerations</li>
  <li>Security requirements</li>
  <li>Integration points</li>
</ul>

<h2>Design Requirements</h2>
<ul>
  <li>UI/UX considerations</li>
  <li>Accessibility requirements</li>
  <li>Mobile responsiveness</li>
</ul>

<h2>Additional Context</h2>
<p>Any other relevant information, examples, or references.</p>`;
        break;

      case 'research':
        initialContent = `<h1>🔍 Research Task</h1>
<h2>Research Objective</h2>
<p>Clear statement of what we're trying to learn or understand.</p>

<h2>Key Questions</h2>
<ul>
  <li>Primary research question</li>
  <li>Secondary questions</li>
  <li>Hypotheses to test</li>
</ul>

<h2>Research Methodology</h2>
<ul>
  <li>Approach: [Qualitative/Quantitative/Mixed]</li>
  <li>Data collection methods</li>
  <li>Analysis methods</li>
</ul>

<h2>Resources to Review</h2>
<ul>
  <li>Academic papers</li>
  <li>Industry reports</li>
  <li>Competitor analysis</li>
  <li>User feedback</li>
</ul>

<h2>Timeline</h2>
<ul>
  <li>Research phase: [dates]</li>
  <li>Analysis phase: [dates]</li>
  <li>Reporting phase: [dates]</li>
</ul>

<h2>Expected Deliverables</h2>
<ul>
  <li>Research report</li>
  <li>Data analysis</li>
  <li>Recommendations</li>
  <li>Next steps</li>
</ul>`;
        break;

      case 'review':
        initialContent = `<h1>👀 Code Review</h1>
<h2>Overview</h2>
<p>Brief description of the changes and their purpose.</p>

<h2>Files to Review</h2>
<ul>
  <li>File 1: [path] - [purpose]</li>
  <li>File 2: [path] - [purpose]</li>
</ul>

<h2>Key Areas to Focus On</h2>
<ul>
  <li>Code quality and standards</li>
  <li>Performance implications</li>
  <li>Security considerations</li>
  <li>Test coverage</li>
</ul>

<h2>Review Checklist</h2>
<ul>
  <li>✅ Code follows style guide</li>
  <li>✅ Tests are included and passing</li>
  <li>✅ Documentation is updated</li>
  <li>✅ No security vulnerabilities</li>
  <li>✅ Performance is considered</li>
  <li>✅ Error handling is implemented</li>
</ul>

<h2>Testing Instructions</h2>
<ol>
  <li>Setup steps</li>
  <li>Test cases to verify</li>
  <li>Edge cases to consider</li>
</ol>

<h2>Additional Context</h2>
<p>Any relevant background information or related changes.</p>`;
        break;

      default:
        initialContent = `<h1>📝 New Task</h1>
<p>Describe your task here...</p>

<h2>Objectives</h2>
<ul>
  <li>Key objective 1</li>
  <li>Key objective 2</li>
</ul>

<h2>Requirements</h2>
<ul>
  <li>Requirement 1</li>
  <li>Requirement 2</li>
</ul>

<h2>Notes</h2>
<p>Additional information, context, or considerations.</p>`;
    }
    setCurrentTask({
      ...currentTask,
      description: initialContent
    });
  };

  const saveTask = async () => {
    setIsLoading(true);
    
    try {
      // Get workspace ID and user ID from config
      const workspace_id = ConfigService.getDefaultWorkspace().workspace_id;
      const user_id = ConfigService.getUserId();
      
      const payload = {
        ...currentTask,
        workspace_id,
        user_id,
        task_type: 'task'  // Ensure task_type is set
      };

      await dispatch(createGeneralTask(payload)).unwrap();
      toast({
        title: "Success",
        description: "Task created successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !currentTask.labels?.includes(newLabel.trim())) {
      setCurrentTask(prev => ({
        ...prev,
        labels: [...(prev.labels || []), newLabel.trim()]
      }));
      setNewLabel('');
    }
    setIsAddingLabel(false);
  };

  const handleRemoveLabel = (labelToRemove) => {
    setCurrentTask(prev => ({
      ...prev,
      labels: prev.labels?.filter(label => label !== labelToRemove) || []
    }));
  };

  return (
    <Drawer 
      onClose={onClose} 
      isOpen={isOpen} 
      size={size}
      placement="right"
    >
      <DrawerOverlay backdropFilter="blur(4px)" />
      <DrawerContent 
        bg={bgColor} 
        borderLeft="1px" 
        borderColor={borderColor}
        boxShadow="xl"
      >
        <DrawerCloseButton top={4} right={4} zIndex={2} />
        
        {/* Header */}
        <DrawerHeader 
          borderBottomWidth="1px" 
          borderColor={borderColor}
          py={4}
          px={6}
        >
          <Flex justify="space-between" align="center" position="relative">
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
            <HStack spacing={2} position="absolute" right="4" zIndex={1}>
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
                  <MenuItem icon={<Icon as={TASK_TEMPLATES[0].icon} />} py={2}>
                    Apply Template
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
                      {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                        <option key={value} value={value}>
                          {config.label}
                        </option>
                      ))}
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
                      {PRIORITY_LEVELS.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.value}
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
                      {currentTask?.assignees?.map(user => (
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
                      <Popover
                        isOpen={isAddingLabel}
                        onClose={() => setIsAddingLabel(false)}
                        placement="bottom-start"
                      >
                        <PopoverTrigger>
                          <IconButton
                            icon={<Icon as={FaPlus} />}
                            size="xs"
                            variant="ghost"
                            aria-label="Add label"
                            onClick={() => setIsAddingLabel(true)}
                          />
                        </PopoverTrigger>
                        <Portal>
                          <PopoverContent>
                            <PopoverArrow />
                            <PopoverBody p={4}>
                              <InputGroup size="sm">
                                <Input
                                  placeholder="Add new label"
                                  value={newLabel}
                                  onChange={(e) => setNewLabel(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddLabel();
                                    }
                                  }}
                                />
                                <InputRightElement width="4.5rem">
                                  <Button
                                    h="1.75rem"
                                    size="sm"
                                    onClick={handleAddLabel}
                                    colorScheme="blue"
                                  >
                                    Add
                                  </Button>
                                </InputRightElement>
                              </InputGroup>
                            </PopoverBody>
                          </PopoverContent>
                        </Portal>
                      </Popover>
                    </HStack>
                    <Wrap>
                      {currentTask?.labels?.map(label => (
                        <Tag
                          key={label}
                          size="sm"
                          borderRadius="full"
                          variant="subtle"
                          colorScheme="blue"
                        >
                          <TagLabel>{label}</TagLabel>
                          <TagCloseButton onClick={() => handleRemoveLabel(label)} />
                        </Tag>
                      ))}
                    </Wrap>
                  </VStack>
                </HStack>
              </FormControl>
            </VStack>

            <Divider />

            {/* Templates */}
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="medium" color={textColor}>
                Templates
              </Text>
              <Wrap spacing={2}>
                {TASK_TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyTemplate(template)}
                    _hover={{ bg: hoverBg }}
                  >
                    {template.name}
                  </Button>
                ))}
              </Wrap>
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
              {isLoading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color={mutedColor}>
                    Creating task...
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
                onClick={saveTask}
                isLoading={isLoading}
                leftIcon={<Icon as={FaSave} />}
                size="md"
              >
                Create Task
              </Button>
            </HStack>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}