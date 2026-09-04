import React, { useState, useEffect, useCallback } from "react";
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
  Input,
  HStack,
  Divider,
  Switch,
  useColorMode,
  Box,
  Select,
  Flex,
  Spinner,
  Center,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { updateProfile } from "../../../slices/auth";
import { updateWorkspace } from "../../../slices/workspaces";
import UserService from "../../../services/userservice";
import MemberService from "../../../services/MemberService";
import ConfigService from "../../../utils/config";
import Auth from "../../../utils/auth";
import AvatarUpload from "./AvatarUpload";

function fullName(user) {
  return `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
}

export default function UserSettings(props) {
  // Handle both direct props and disclosures prop
  const isOpen = props.isOpen || props.disclosures?.isOpen;
  const onClose = props.onClose || props.disclosures?.onClose;
  const user = props.user;
  const { colorMode, toggleColorMode } = useColorMode();
  const dispatch = useDispatch();
  const toast = useToast();

  // ---- Account -----------------------------------------------------------
  const [name, setName] = useState(fullName(user));
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setName(fullName(user));
  }, [user?.user_id, user?.first_name, user?.last_name]);

  const saveProfile = () => {
    const [first_name, ...rest] = name.trim().split(/\s+/);
    if (!first_name) {
      toast({ title: "Name can't be empty", status: "warning", duration: 2500, isClosable: true });
      return;
    }
    setIsSavingProfile(true);
    dispatch(updateProfile({ userId: user.user_id, data: { first_name, last_name: rest.join(" ") || null } }))
      .unwrap()
      .then(() => toast({ title: "Profile updated", status: "success", duration: 2500, isClosable: true }))
      .catch(err => toast({ title: "Couldn't update profile", description: err, status: "error", duration: 3500, isClosable: true }))
      .finally(() => setIsSavingProfile(false));
  };

  const deleteAccount = () => {
    setIsDeleting(true);
    UserService.remove(user.user_id)
      .then(() => {
        toast({ title: "Account deleted", status: "info", duration: 2000, isClosable: true });
        Auth.logout();
      })
      .catch(err => {
        toast({
          title: "Couldn't delete account",
          description: err.response?.data?.detail || "Please try again",
          status: "error", duration: 3500, isClosable: true,
        });
        setIsDeleting(false);
        setConfirmingDelete(false);
      });
  };

  // ---- Workspace + Members ------------------------------------------------
  let workspace = null;
  try { workspace = ConfigService.getDefaultWorkspace(); } catch (e) { /* none selected */ }
  const isOwner = !!(workspace && user && String(workspace.owner_id) === String(user.user_id));

  const [workspaceName, setWorkspaceName] = useState(workspace?.name || "");
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  useEffect(() => { setWorkspaceName(workspace?.name || ""); }, [workspace?.workspace_id]);

  const saveWorkspace = () => {
    if (!workspaceName.trim()) {
      toast({ title: "Workspace name can't be empty", status: "warning", duration: 2500, isClosable: true });
      return;
    }
    setIsSavingWorkspace(true);
    dispatch(updateWorkspace({ id: workspace.workspace_id, name: workspaceName.trim() }))
      .unwrap()
      .then((updated) => {
        ConfigService.setDefaultWorkspace({ ...workspace, name: updated.name });
        toast({ title: "Workspace renamed", status: "success", duration: 2500, isClosable: true });
      })
      .catch(err => toast({ title: "Couldn't rename workspace", description: err.message, status: "error", duration: 3500, isClosable: true }))
      .finally(() => setIsSavingWorkspace(false));
  };

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState(null);

  const loadMembers = useCallback(() => {
    if (!workspace?.workspace_id) return;
    setMembersLoading(true);
    setMembersError(null);
    MemberService.getMembers(workspace.workspace_id)
      .then(res => setMembers(res.data))
      .catch(() => setMembersError("Failed to load members"))
      .finally(() => setMembersLoading(false));
  }, [workspace?.workspace_id]);

  useEffect(() => {
    if (isOpen) loadMembers();
  }, [isOpen, loadMembers]);

  const inviteMember = () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    MemberService.addMember(workspace.workspace_id, user.user_id, inviteEmail.trim())
      .then(() => {
        toast({ title: "Member invited", status: "success", duration: 2500, isClosable: true });
        setInviteEmail("");
        loadMembers();
      })
      .catch(err => toast({
        title: "Couldn't invite member",
        description: err.response?.data?.detail || "Please try again",
        status: "error", duration: 3500, isClosable: true,
      }))
      .finally(() => setIsInviting(false));
  };

  const removeMember = (memberId) => {
    setBusyMemberId(memberId);
    MemberService.removeMember(workspace.workspace_id, memberId)
      .then(() => {
        toast({ title: "Member removed", status: "info", duration: 2000, isClosable: true });
        setMembers(prev => prev.filter(m => m.user_id !== memberId));
      })
      .catch(err => toast({
        title: "Couldn't remove member",
        description: err.response?.data?.detail || "Please try again",
        status: "error", duration: 3500, isClosable: true,
      }))
      .finally(() => setBusyMemberId(null));
  };

  const changeRole = (memberId, role) => {
    setBusyMemberId(memberId);
    MemberService.updateMemberRole(workspace.workspace_id, memberId, role)
      .then(() => {
        setMembers(prev => prev.map(m => (m.user_id === memberId ? { ...m, role } : m)));
        toast({ title: "Role updated", status: "success", duration: 2000, isClosable: true });
      })
      .catch(err => toast({
        title: "Couldn't update role",
        description: err.response?.data?.detail || "Please try again",
        status: "error", duration: 3500, isClosable: true,
      }))
      .finally(() => setBusyMemberId(null));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontWeight={600} fontSize={20}>
          Settings
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody fontSize={14} minH="500px">
          {!user ? (
            <Center py={20}><Spinner /></Center>
          ) : (
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
                    <AvatarUpload user={user} size="xl" />
                    <VStack align="flex-start" spacing={2}>
                      <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        fontWeight="bold"
                        fontSize="lg"
                        placeholder="Full Name"
                      />
                      <Input
                        value={user.email || ""}
                        placeholder="Email"
                        isReadOnly
                      />
                    </VStack>
                    <Button colorScheme="blue" size="sm" onClick={saveProfile} isLoading={isSavingProfile}>
                      Save
                    </Button>
                  </HStack>
                  <Divider />
                  <Tooltip label="Password changes aren't supported yet">
                    <Button colorScheme="blue" size="sm" isDisabled>Change Password</Button>
                  </Tooltip>
                  {!confirmingDelete ? (
                    <Button colorScheme="red" size="sm" variant="outline" onClick={() => setConfirmingDelete(true)}>
                      Delete Account
                    </Button>
                  ) : (
                    <HStack>
                      <Text color="red.500" fontSize="sm">This can't be undone. Are you sure?</Text>
                      <Button colorScheme="red" size="sm" onClick={deleteAccount} isLoading={isDeleting}>
                        Confirm Delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
                    </HStack>
                  )}
                </VStack>
              </TabPanel>
              {/* Workspace Tab */}
              <TabPanel>
                <VStack align="flex-start" spacing={6}>
                  {!workspace ? (
                    <Text color="gray.500">No workspace selected.</Text>
                  ) : (
                    <>
                      <Text fontWeight={500}>Workspace Name</Text>
                      <HStack w="100%">
                        <Input
                          value={workspaceName}
                          onChange={e => setWorkspaceName(e.target.value)}
                          placeholder="Workspace Name"
                          isReadOnly={!isOwner}
                        />
                        {isOwner && (
                          <Button colorScheme="blue" size="sm" onClick={saveWorkspace} isLoading={isSavingWorkspace}>
                            Save
                          </Button>
                        )}
                      </HStack>
                      {!isOwner && (
                        <Text fontSize="sm" color="gray.500">Only the workspace owner can rename this workspace.</Text>
                      )}
                    </>
                  )}
                </VStack>
              </TabPanel>
              {/* Members Tab */}
              <TabPanel>
                <VStack align="flex-start" spacing={6} w="100%">
                  <Text fontWeight={500}>Manage Members</Text>
                  {isOwner && (
                    <HStack>
                      <Input
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="Invite by email"
                        size="sm"
                      />
                      <Button colorScheme="green" size="sm" onClick={inviteMember} isLoading={isInviting}>
                        Invite
                      </Button>
                    </HStack>
                  )}
                  <Box w="100%">
                    {membersLoading && <Spinner size="sm" />}
                    {membersError && <Text color="red.500" fontSize="sm">{membersError}</Text>}
                    {!membersLoading && !membersError && members.length === 0 && (
                      <Text color="gray.500" fontSize="sm">No members yet.</Text>
                    )}
                    {members.map((member) => {
                      const isSelfOwner = String(member.user_id) === String(workspace?.owner_id);
                      return (
                        <Flex key={member.user_id} align="center" justify="space-between" py={2} borderBottom="1px solid #eee">
                          <Box>
                            <Text fontWeight="bold">{member.name}</Text>
                            <Text fontSize="sm" color="gray.500">{member.email}</Text>
                          </Box>
                          <HStack>
                            <Select
                              size="sm"
                              value={member.role}
                              w="110px"
                              isDisabled={!isOwner || isSelfOwner || busyMemberId === member.user_id}
                              onChange={e => changeRole(member.user_id, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="guest">Guest</option>
                            </Select>
                            {isOwner && !isSelfOwner && (
                              <Button
                                colorScheme="red"
                                size="xs"
                                variant="ghost"
                                isLoading={busyMemberId === member.user_id}
                                onClick={() => removeMember(member.user_id)}
                              >
                                Remove
                              </Button>
                            )}
                          </HStack>
                        </Flex>
                      );
                    })}
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
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
