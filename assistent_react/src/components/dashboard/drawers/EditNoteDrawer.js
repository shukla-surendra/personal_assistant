import React, { useState, useEffect } from "react";
import {
  Flex, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, DrawerFooter, Box, Button, FormControl,
  Input, Menu, MenuButton, MenuItem, MenuList, Icon, Text, useColorModeValue,
  Badge, Tooltip, useToast, IconButton, VStack, HStack, Divider
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { updateTask } from "../../../slices/tasks";
import TaskDataService from "../../../services/taskservice";
import { FaArrowLeft, FaSave, FaEye, FaEyeSlash, FaShare, FaDownload, FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";
import { BiCommentDetail } from "react-icons/bi";
import { BsGearFill } from "react-icons/bs";
import FtTextEditor from "../sections/FtTextEditor";
import { Spinner } from '@chakra-ui/react';
import { formatLocalDateTime } from "../../../utils/locale";

export default function EditNoteDrawer(props) {
  const [isLoading, setIsLoading] = useState(false);
  const { currentTask, setCurrentTask } = props;
  const [size] = useState('xl');
  const initialRef = React.useRef(null);
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const { isOpen, onOpen, onClose } = props.disclosures;
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getTask = task_id => {
    setIsLoading(true);
    TaskDataService.get(task_id)
      .then(response => {
        if (response && response.data) {
          setCurrentTask(response.data);
        }
      })
      .catch(e => {
        console.error('Error loading note:', e);
        setMessage("Error loading note");
        toast({
          title: "Error",
          description: "Failed to load note",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && currentTask && currentTask.task_id) {
      getTask(currentTask.task_id);
    }
  }, [isOpen, currentTask?.task_id]);

  const handleInputChange = event => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const updateContent = () => {
    setIsLoading(true);
    setMessage("Saving ...");
    dispatch(updateTask({ task_id: currentTask.task_id, data: currentTask }))
      .unwrap()
      .then(response => {
        setMessage("Saved !");
        toast({
          title: "Success",
          description: "Note saved successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setIsLoading(false);
        setTimeout(() => setMessage(""), 1000);
      })
      .catch(e => {
        setMessage("Error in Saving !");
        toast({
          title: "Error",
          description: "Failed to save note",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        setTimeout(() => setMessage(""), 2000);
      });
  };

  const handlePublishToggle = () => {
    const updatedTask = {
      ...currentTask,
      published: !currentTask.published
    };
    setCurrentTask(updatedTask);
    updateContent();
  };

  const handleExport = (format) => {
    // Implement export functionality
    toast({
      title: "Export",
      description: `Exporting to ${format}...`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Drawer onClose={onClose} isOpen={isOpen} size={size}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" pb={2}>
          <Flex justifyContent="space-between" alignItems="center" pr={10}>
            <Button onClick={onClose} leftIcon={<Icon as={FaArrowLeft} />} variant="ghost" size="sm">
              Back
            </Button>
            <Flex gap={2} alignItems="center">
              <Tooltip label="Comments">
                <IconButton
                  icon={<Icon as={BiCommentDetail} />}
                  variant="ghost"
                  size="sm"
                  aria-label="Comments"
                />
              </Tooltip>
              <Menu>
                <MenuButton as={IconButton} icon={<Icon as={BsGearFill} />} variant="ghost" size="sm" />
                <MenuList>
                  <MenuItem 
                    icon={<Icon as={currentTask?.published ? FaEyeSlash : FaEye} />} 
                    onClick={handlePublishToggle}
                  >
                    {currentTask?.published ? "Unpublish" : "Publish"}
                  </MenuItem>
                  <MenuItem icon={<Icon as={FaShare} />}>Share</MenuItem>
                  <Menu>
                    <MenuButton as={MenuItem} icon={<Icon as={FaDownload} />}>
                      Export
                    </MenuButton>
                    <MenuList>
                      <MenuItem icon={<Icon as={FaFilePdf} />} onClick={() => handleExport('PDF')}>PDF</MenuItem>
                      <MenuItem icon={<Icon as={FaFileWord} />} onClick={() => handleExport('Word')}>Word</MenuItem>
                      <MenuItem icon={<Icon as={FaFileAlt} />} onClick={() => handleExport('Markdown')}>Markdown</MenuItem>
                    </MenuList>
                  </Menu>
                </MenuList>
              </Menu>
            </Flex>
          </Flex>
        </DrawerHeader>

        <DrawerBody>
          <Box>
            <FormControl mb={4}>
              <Input
                ref={initialRef}
                placeholder="Title"
                id="title"
                required
                value={currentTask?.title || ''}
                onChange={handleInputChange}
                name="title"
                size="lg"
                fontWeight="bold"
                borderColor="gray.300"
                bg="gray.50"
                mb={2}
              />
              <Flex align="center" gap={2} mb={4}>
                <Badge colorScheme={currentTask?.published ? "green" : "gray"}>
                  {currentTask?.published ? "Published" : "Draft"}
                </Badge>
                <Text fontSize="sm" color="gray.500">
                  Last updated: {formatLocalDateTime(currentTask?.updated_at)}
                </Text>
              </Flex>
            </FormControl>
            <FormControl>
              <FtTextEditor currentTask={currentTask} setCurrentTask={setCurrentTask} />
            </FormControl>
          </Box>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px" pt={2}>
          <Flex w="100%" justify="space-between" align="center">
            <Box color={isLoading ? "blue.500" : "gray.600"} fontSize="sm">
              {isLoading && (
                <>
                  <Spinner size="sm" mr={2} />
                  {message}
                </>
              )}
              {!isLoading && message}
            </Box>
            <Flex gap={2}>
              <Button
                onClick={onClose}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={updateContent}
                leftIcon={<Icon as={FaSave} />}
                colorScheme="blue"
                isLoading={isLoading}
              >
                Save
              </Button>
            </Flex>
          </Flex>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}