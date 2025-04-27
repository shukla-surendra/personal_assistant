import { ModalBody, Button, Modal, ModalOverlay, ModalContent, ModalHeader, FormControl, ModalFooter, Input, useDisclosure } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import { deleteNotes } from "../../../slices/tasks";
import {useToast} from '@chakra-ui/react';

export default function DeleteNoteModal(props) {
    const { isOpen, onOpen, onClose } = props.disclosures;
    const { task_id }= props.currentTask;
    let navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const toast = useToast();
    const dispatch = useDispatch();

    const removeTask = () => {
      dispatch(deleteNotes({ task_id }))
        .unwrap()
        .then(() => {
          onClose();
        toast({
          title: 'Item deleted.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
          navigate("/notes");
        })
        .catch(e => {
          console.log(e);
        toast({
          title: 'An error occurred.',
          description: 'Unable to delete item.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        });
    };
  

  return (
    <>
<Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Item</ModalHeader>
          <ModalBody>Are you sure you want to delete this item?</ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" ml={3} onClick={removeTask} isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}