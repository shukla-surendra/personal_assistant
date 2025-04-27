import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  FormLabel,
  Select,
  Flex,
  Box,
  Button,
  FormControl,
  Input,
  Icon,
  Spinner,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  useToast,
  Avatar,
  AvatarGroup,
  Tag,
  TagLabel,
  TagCloseButton,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from 'react-router-dom';
import { updateTask } from "../../../slices/tasks";
import { 
  FaArrowLeft, 
  FaSave, 
  FaCalendarAlt, 
  FaTag, 
  FaClipboardList, 
  FaUser, 
  FaPaperclip,
  FaPlus,
  FaClock,
  FaUsers,
  FaHashtag
} from "react-icons/fa";
import FtTextEditor from "../sections/FtTextEditor";
import TaskDataService from "../../../services/taskservice";

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

export default function EditTaskDrawer(props) {
  const initialTaskState = {
    task_id: null,
    title: "",
    description: "",
    priority: "",
    due_on: "",
    published: false
  };

  const [size, setSize] = React.useState('xl');
  const initialRef = React.useRef(null);
  let navigate = useNavigate();
  const { isOpen, onOpen, onClose } = props.disclosures;
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { id } = useParams();
  const toast = useToast();

  // Sample state for new features
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [assignees, setAssignees] = useState([]);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const tagBg = useColorModeValue("blue.50", "blue.900");
  const tagColor = useColorModeValue("blue.700", "blue.200");

  useEffect(() => {
    if (isOpen && currentTask.task_id) {
      getTask(currentTask.task_id);
    }
  }, [isOpen, currentTask.task_id]);

  const getTask = id => {
    setLoading(true);
    console.log('Fetching task with ID:', id); // Debug log
    TaskDataService.get(id)
      .then(response => {
        console.log('Task response:', response); // Debug log
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
        // Ensure description is in HTML format for Tiptap
        const taskData = response.data;
        if (taskData.description && !taskData.description.startsWith('<')) {
          taskData.description = `<p>${taskData.description}</p>`;
        }
        setCurrentTask(taskData);
      })
      .catch(e => {
        console.error('Error loading task:', e); // Debug log
        toast({
          title: "Error",
          description: e.message || "Failed to load task",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const updateContent = () => {
    dispatch(updateTask({ id: currentTask.task_id, data: currentTask }))
      .unwrap()
      .then(data => {
        console.log(data);
        onClose();
        toast({
          title: "Success",
          description: "Task updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch(e => {
        console.log(e);
        toast({
          title: "Error",
          description: "Failed to update task",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
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

  const handleAddLabel = () => {
    if (newLabel.trim() && !selectedLabels.includes(newLabel.trim())) {
      setSelectedLabels([...selectedLabels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (label) => {
    setSelectedLabels(selectedLabels.filter(l => l !== label));
  };

  const handleAddAssignee = (user) => {
    if (!assignees.find(a => a.id === user.id)) {
      setAssignees([...assignees, user]);
    }
  };

  const handleRemoveAssignee = (userId) => {
    setAssignees(assignees.filter(a => a.id !== userId));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAttachments([...attachments, ...files]);
  };

  return (
    <Drawer onClose={onClose} isOpen={isOpen} size={size}>
      <DrawerOverlay />
      <DrawerContent bg={bg}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" py={4}>
          <HStack>
            <Button
              onClick={onClose}
              leftIcon={<Icon as={FaArrowLeft} />}
              variant="ghost"
              size="sm"
              colorScheme="gray"
            >
              Back
            </Button>
          </HStack>
        </DrawerHeader>
        <DrawerBody py={6}>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Task Title</FormLabel>
              <Input
                ref={initialRef}
                placeholder="Enter task title"
                id="title"
                required
                value={currentTask.title || ''}
                onChange={handleInputChange}
                name="title"
                size="lg"
                fontWeight="medium"
                borderColor={borderColor}
                bg={inputBg}
                _focus={{ borderColor: "blue.400", boxShadow: "none" }}
              />
            </FormControl>

            <HStack spacing={4}>
              <FormControl flex="1">
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                  <HStack spacing={2}>
                    <Icon as={FaTag} />
                    <Text>Priority</Text>
                  </HStack>
                </FormLabel>
                <Select
                  placeholder="Select priority"
                  name="priority"
                  required
                  onChange={handleInputChange}
                  value={currentTask.priority}
                  borderColor={borderColor}
                  bg={inputBg}
                  _focus={{ borderColor: "blue.400", boxShadow: "none" }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Select>
              </FormControl>

              <FormControl flex="1">
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                  <HStack spacing={2}>
                    <Icon as={FaClipboardList} />
                    <Text>Status</Text>
                  </HStack>
                </FormLabel>
                <Select
                  placeholder="Select status"
                  name="status"
                  required
                  onChange={handleInputChange}
                  value={currentTask.status}
                  borderColor={borderColor}
                  bg={inputBg}
                  _focus={{ borderColor: "blue.400", boxShadow: "none" }}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4}>
              <FormControl flex="1">
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                  <HStack spacing={2}>
                    <Icon as={FaClock} />
                    <Text>Story Points</Text>
                  </HStack>
                </FormLabel>
                <Select
                  placeholder="Select story points"
                  name="storyPoints"
                  onChange={handleInputChange}
                  value={currentTask.storyPoints}
                  borderColor={borderColor}
                  bg={inputBg}
                  _focus={{ borderColor: "blue.400", boxShadow: "none" }}
                >
                  {storyPoints.map(point => (
                    <option key={point} value={point}>{point}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl flex="1">
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                  <HStack spacing={2}>
                    <Icon as={FaCalendarAlt} />
                    <Text>Due Date</Text>
                  </HStack>
                </FormLabel>
                <Input
                  type="date"
                  name="due_on"
                  onChange={handleInputChange}
                  value={currentTask.due_on}
                  borderColor={borderColor}
                  bg={inputBg}
                  _focus={{ borderColor: "blue.400", boxShadow: "none" }}
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                <HStack spacing={2}>
                  <Icon as={FaUsers} />
                  <Text>Assignees</Text>
                </HStack>
              </FormLabel>
              <HStack spacing={2}>
                <AvatarGroup size="sm" max={3}>
                  {assignees.map(user => (
                    <Avatar key={user.id} src={user.avatar} name={user.name} />
                  ))}
                </AvatarGroup>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaPlus />}
                    size="sm"
                    variant="ghost"
                  />
                  <MenuList>
                    {sampleUsers.map(user => (
                      <MenuItem
                        key={user.id}
                        onClick={() => handleAddAssignee(user)}
                        isDisabled={assignees.find(a => a.id === user.id)}
                      >
                        <HStack>
                          <Avatar size="xs" src={user.avatar} />
                          <Text>{user.name}</Text>
                        </HStack>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                <HStack spacing={2}>
                  <Icon as={FaHashtag} />
                  <Text>Labels</Text>
                </HStack>
              </FormLabel>
              <VStack align="start" spacing={2}>
                <HStack flexWrap="wrap" spacing={2}>
                  {selectedLabels.map(label => (
                    <Tag
                      key={label}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      bg={tagBg}
                      color={tagColor}
                    >
                      <TagLabel>{label}</TagLabel>
                      <TagCloseButton onClick={() => handleRemoveLabel(label)} />
                    </Tag>
                  ))}
                </HStack>
                <InputGroup size="sm" maxW="200px">
                  <InputLeftElement pointerEvents="none">
                    <FaTag color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Add label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                  />
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      icon={<FaPlus />}
                      onClick={handleAddLabel}
                      isDisabled={!newLabel.trim()}
                    />
                  </InputRightElement>
                </InputGroup>
              </VStack>
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">
                <HStack spacing={2}>
                  <Icon as={FaPaperclip} />
                  <Text>Attachments</Text>
                </HStack>
              </FormLabel>
              <VStack align="start" spacing={2}>
                {attachments.map((file, index) => (
                  <HStack key={index} spacing={2}>
                    <Text fontSize="sm">{file.name}</Text>
                    <IconButton
                      size="xs"
                      icon={<FaPlus style={{ transform: 'rotate(45deg)' }} />}
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    />
                  </HStack>
                ))}
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  display="none"
                  id="file-upload"
                />
                <Button
                  leftIcon={<FaPaperclip />}
                  size="sm"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  Add Attachment
                </Button>
              </VStack>
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Description</FormLabel>
              <Box border="1px solid" borderColor={borderColor} borderRadius="md" p={2}>
                <FtTextEditor currentTask={currentTask} setCurrentTask={setCurrentTask} />
              </Box>
            </FormControl>
          </VStack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" py={4}>
          <Flex w="100%" justify="space-between" align="center">
            <HStack spacing={2}>
              {loading && <Spinner size="sm" color="blue.500" />}
              <Text fontSize="sm" color="gray.500">Saving changes...</Text>
            </HStack>
            <Button
              onClick={updateContent}
              leftIcon={<Icon as={FaSave} />}
              colorScheme="blue"
              isLoading={loading}
              loadingText="Saving..."
              size="md"
              px={6}
            >
              Save Changes
            </Button>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}