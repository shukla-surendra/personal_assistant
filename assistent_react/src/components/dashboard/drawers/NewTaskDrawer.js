import React, { useState } from "react";
import { Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter } from "@chakra-ui/react";
import { FormLabel, Select, Box, Button, FormControl, Input, VStack, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { Icon } from "@chakra-ui/react";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import FtTextEditor from "../sections/FtTextEditor";
import { createTask } from "../../../slices/tasks";

export default function NewTaskDrawer(props) {
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
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { isOpen, onOpen, onClose } = props.disclosures;
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const dispatch = useDispatch();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const saveTask = () => {
    const { title, description, priority, due_on } = currentTask;
    dispatch(createTask({ title, description, priority, due_on }))
      .unwrap()
      .then(data => {
        console.log(data);
        setCurrentTask({
          id: data.id,
          title: data.title,
          priority: data.priority,
          description: data.description,
          due_on: data.due_on,
          published: data.published
        });
        setSubmitted(true);
        onClose()
      })
      .catch(e => {
        console.log(e);
      });
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
            <Text fontSize="xl" fontWeight="bold">New Task</Text>
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

            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Priority</FormLabel>
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

            <FormControl>
              <FormLabel color={labelColor} fontSize="sm" fontWeight="medium">Due Date</FormLabel>
              <Input
                type="date"
                name="due_on"
                value={currentTask.due_on}
                onChange={handleInputChange}
                borderColor={borderColor}
                bg={inputBg}
                _focus={{ borderColor: "blue.400", boxShadow: "none" }}
              />
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
          <Button
            onClick={saveTask}
            leftIcon={<Icon as={FaSave} />}
            colorScheme="blue"
            size="md"
            px={6}
          >
            Create Task
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}