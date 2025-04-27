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
  const { currentTask, setCurrentTask, disclosures } = props;
  const { isOpen, onClose } = disclosures;
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const toast = useToast();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const labelColor = useColorModeValue("gray.600", "gray.400");

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
    setCurrentTask(prev => ({ ...prev, [name]: value }));
  };

  const updateContent = () => {
    if (!currentTask?.task_id) return;

    dispatch(updateTask({ task_id: currentTask.task_id, data: currentTask }))
      .unwrap()
      .then(() => {
        onClose();
        toast({
          title: "Success",
          description: "Task updated successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      })
      .catch(error => {
        console.error('Error updating task:', error);
        toast({
          title: "Error",
          description: "Failed to update task",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      });
  };

  return (
    <Drawer onClose={onClose} isOpen={isOpen} size="xl">
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
          {loading ? (
            <Flex justify="center" align="center" h="200px">
              <Spinner />
            </Flex>
          ) : (
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Task Title</FormLabel>
                <Input
                  placeholder="Enter task title"
                  id="title"
                  name="title"
                  value={currentTask?.title || ''}
                  onChange={handleInputChange}
                  bg={inputBg}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Description</FormLabel>
                <FtTextEditor
                  currentTask={currentTask}
                  setCurrentTask={setCurrentTask}
                />
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Status</FormLabel>
                <Select
                  name="status"
                  value={currentTask?.status || ''}
                  onChange={handleInputChange}
                  bg={inputBg}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Priority</FormLabel>
                <Select
                  name="priority"
                  value={currentTask?.priority || ''}
                  onChange={handleInputChange}
                  bg={inputBg}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Due Date</FormLabel>
                <Input
                  type="datetime-local"
                  name="due_on"
                  value={currentTask?.due_on || ''}
                  onChange={handleInputChange}
                  bg={inputBg}
                />
              </FormControl>
            </VStack>
          )}
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" pt={4}>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={updateContent}
            isLoading={loading}
            leftIcon={<Icon as={FaSave} />}
          >
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}