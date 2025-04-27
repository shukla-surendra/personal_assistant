import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  Button,
  Avatar,
  Input,
  HStack,
  Divider,
  Switch,
  useColorMode,
  Box,
  Select,
  Flex,
} from "@chakra-ui/react";

export default function UserSettings(props) {
  // Handle both direct props and disclosures prop
  const isOpen = props.isOpen || props.disclosures?.isOpen;
  const onClose = props.onClose || props.disclosures?.onClose;
  const { colorMode, toggleColorMode } = useColorMode();

  // Example state for profile editing
  const [profile, setProfile] = useState({
    name: "Surendra Shukla",
    email: "surendra.shukla29@gmail.com",
    avatar: "",
  });
  const [workspaceName, setWorkspaceName] = useState("Surendra's Workspace");
  const [members] = useState([
    { name: "Surendra Shukla", email: "surendra.shukla29@gmail.com", role: "Owner" },
    { name: "Jane Doe", email: "jane@example.com", role: "Member" },
  ]);
  const [inviteEmail, setInviteEmail] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontWeight={600} fontSize={20}>
          Settings
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody fontSize={14} minH="500px">
          <Tabs isLazy orientation="vertical" size="lg" variant="enclosed">
            <TabList minW="200px" borderRight="1px solid #eee">
              <Tab fontWeight={500} fontSize={16}>Account</Tab>
              <Tab fontWeight={500} fontSize={16}>Workspace</Tab>
              <Tab fontWeight={500} fontSize={16}>Members</Tab>
              <Tab fontWeight={500} fontSize={16}>Theme</Tab>
            </TabList>
            <TabPanels>
              {/* Account Tab */}
              <TabPanel>
                <VStack align="flex-start" spacing={6}>
                  <HStack spacing={4}>
                    <Avatar size="xl" name={profile.name} src={profile.avatar} />
                    <VStack align="flex-start" spacing={2}>
                      <Input
                        value={profile.name}
                        onChange={e => setProfile({ ...profile, name: e.target.value })}
                        fontWeight="bold"
                        fontSize="lg"
                        placeholder="Full Name"
                      />
                      <Input
                        value={profile.email}
                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                        placeholder="Email"
                        isReadOnly
                      />
                    </VStack>
                  </HStack>
                  <Divider />
                  <Button colorScheme="blue" size="sm">Change Password</Button>
                  <Button colorScheme="red" size="sm" variant="outline">Delete Account</Button>
                </VStack>
              </TabPanel>
              {/* Workspace Tab */}
              <TabPanel>
                <VStack align="flex-start" spacing={6}>
                  <Text fontWeight={500}>Workspace Name</Text>
                  <Input
                    value={workspaceName}
                    onChange={e => setWorkspaceName(e.target.value)}
                    placeholder="Workspace Name"
                  />
                </VStack>
              </TabPanel>
              {/* Members Tab */}
              <TabPanel>
                <VStack align="flex-start" spacing={6} w="100%">
                  <Text fontWeight={500}>Manage Members</Text>
                  <HStack>
                    <Input
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="Invite by email"
                      size="sm"
                    />
                    <Button colorScheme="green" size="sm">Invite</Button>
                  </HStack>
                  <Box w="100%">
                    {members.map((member, idx) => (
                      <Flex key={idx} align="center" justify="space-between" py={2} borderBottom="1px solid #eee">
                        <Box>
                          <Text fontWeight="bold">{member.name}</Text>
                          <Text fontSize="sm" color="gray.500">{member.email}</Text>
                        </Box>
                        <HStack>
                          <Select size="sm" value={member.role} w="100px" readOnly>
                            <option value="Owner">Owner</option>
                            <option value="Member">Member</option>
                          </Select>
                          <Button colorScheme="red" size="xs" variant="ghost">Remove</Button>
                        </HStack>
                      </Flex>
                    ))}
                  </Box>
                </VStack>
              </TabPanel>
              {/* Theme Tab */}
              <TabPanel>
                <VStack align="flex-start" spacing={6}>
                  <Text fontWeight={500}>Theme</Text>
                  <HStack>
                    <Text>Dark Mode</Text>
                    <Switch isChecked={colorMode === "dark"} onChange={toggleColorMode} />
                  </HStack>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
