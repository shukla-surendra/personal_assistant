import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Avatar,
  Input,
  Button,
  FormLabel,
  HStack,
  Divider,
  Spinner,
  Center,
  useToast,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../../slices/auth";

function fullName(user) {
  return `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
}

export default function UserProfile(props) {
  // Handle both direct props and disclosures prop
  const isOpen = props.isOpen || props.disclosures?.isOpen;
  const onClose = props.onClose || props.disclosures?.onClose;
  const user = props.user;

  const dispatch = useDispatch();
  const toast = useToast();
  const [name, setName] = useState(fullName(user));
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync when the real user (e.g. after the demo/login swap) arrives.
  useEffect(() => {
    setName(fullName(user));
  }, [user?.user_id, user?.first_name, user?.last_name]);

  const handleSave = () => {
    const [first_name, ...rest] = name.trim().split(/\s+/);
    if (!first_name) {
      toast({ title: "Name can't be empty", status: "warning", duration: 2500, isClosable: true });
      return;
    }
    setIsSaving(true);
    dispatch(updateProfile({
      userId: user.user_id,
      data: { first_name, last_name: rest.join(" ") || null },
    }))
      .unwrap()
      .then(() => {
        toast({ title: "Profile updated", status: "success", duration: 2500, isClosable: true });
        onClose();
      })
      .catch((err) => {
        toast({ title: "Couldn't update profile", description: err, status: "error", duration: 3500, isClosable: true });
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontWeight={600} fontSize={20}>
          Profile
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!user ? (
            <Center py={10}><Spinner /></Center>
          ) : (
            <VStack align="center" spacing={6} pb={4}>
              <Avatar size="2xl" name={fullName(user) || user.email} />
              <VStack align="flex-start" spacing={2} w="100%">
                <FormLabel mb={0}>Name</FormLabel>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  fontWeight="bold"
                  fontSize="lg"
                  placeholder="Full Name"
                />
                <FormLabel mb={0}>Email</FormLabel>
                <Input
                  value={user.email || ""}
                  isReadOnly
                  fontSize="md"
                  placeholder="Email"
                />
              </VStack>
              <Divider />
              <HStack w="100%" justify="flex-end">
                <Button colorScheme="blue" size="sm" onClick={handleSave} isLoading={isSaving}>
                  Save Changes
                </Button>
              </HStack>
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
