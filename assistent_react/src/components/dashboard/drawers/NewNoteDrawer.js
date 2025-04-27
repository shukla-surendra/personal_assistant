import React, { useState } from "react";
import { Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, DrawerFooter } from "@chakra-ui/react";
import { Box, Button, FormControl, Input } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { withReact } from 'slate-react'
import { createEditor } from 'slate'
import { Icon } from "@chakra-ui/react";
import { FaArrowLeft, FaSave } from "react-icons/fa";
import FtTextEditor from "../sections/FtTextEditor";
import { createNotes } from "../../../slices/tasks";

export default function NewNoteDrawer(props) {
  const initialTaskState = {
    task_id: null,
    title: "",
    description: "", // Initially empty, handled as markdown string
    priority: "",
    task_type: 'note',
    published: false
  };

  const [editor] = useState(() => withReact(createEditor()));
  const [size, setSize] = React.useState('xl');
  const initialRef = React.useRef(null);
  const finalRef = React.useRef(null);
  let navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { isOpen, onOpen, onClose } = props.disclosures;
  const [currentTask, setCurrentTask] = useState(initialTaskState);
  const dispatch = useDispatch();

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCurrentTask({ ...currentTask, [name]: value });
  };

  const saveTask = () => {
    const { title, description, priority, task_type } = currentTask;
    dispatch(createNotes({ title, description, priority, task_type }))
      .unwrap()
      .then((data) => {
        console.log(data);
        setCurrentTask({
          id: data.id,
          title: data.title,
          priority: data.priority,
          task_type: 'note',
          description: data.description,
          published: data.published
        });
        setSubmitted(true);
        onClose();
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <>
      <Drawer onClose={onClose} isOpen={isOpen} size={size}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Button onClick={onClose} leftIcon={<Icon as={FaArrowLeft} />} />
          </DrawerHeader>
          <DrawerBody>
            <Box>
              <FormControl>
                <Input
                  ref={initialRef}
                  placeholder='Untitled'
                  id="title"
                  required
                  value={currentTask.title || ''}
                  onChange={handleInputChange}
                  name="title"
                />
              </FormControl>
              <FormControl mt={4}>
                <FtTextEditor
                  currentTask={currentTask}
                  setCurrentTask={setCurrentTask} // Pass the state updater to sync changes
                />
              </FormControl>
              <FormControl>
                {/* You can add any other inputs here */}
              </FormControl>
            </Box>
          </DrawerBody>
          <DrawerFooter>
            <Button onClick={saveTask} leftIcon={<Icon as={FaSave} />} children="Save" />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
