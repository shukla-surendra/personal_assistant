import React, { useState } from "react";
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
  Text,
} from "@chakra-ui/react";

export default function UserProfile(props) {
  // Handle both direct props and disclosures prop
  const isOpen = props.isOpen || props.disclosures?.isOpen;
  const onClose = props.onClose || props.disclosures?.onClose;
  const user = props.user || {};

  const [profile, setProfile] = useState({
    name: user?.name || "Surendra Shukla",
    email: user?.email || "surendra.shukla29@gmail.com",
    avatar: user?.avatar || "",
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontWeight={600} fontSize={20}>
          Profile
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="center" spacing={6}>
            <Avatar size="2xl" name={profile.name} src={profile.avatar} />
            <VStack align="flex-start" spacing={2} w="100%">
              <FormLabel>Name</FormLabel>
              <Input
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                fontWeight="bold"
                fontSize="lg"
                placeholder="Full Name"
              />
              <FormLabel>Email</FormLabel>
              <Input
                value={profile.email}
                isReadOnly
                fontSize="md"
                placeholder="Email"
              />
            </VStack>
            <Divider />
            <HStack w="100%" justify="flex-end">
              <Button colorScheme="blue" size="sm">
                Save Changes
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}