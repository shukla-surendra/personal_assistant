import React, { useState, useEffect } from 'react';
import {
    IconButton,
    Flex,
    HStack,
    useColorModeValue,
    useDisclosure,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverBody,
    Text,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    useColorMode,
    Select,
    Box,
    Button
} from '@chakra-ui/react';
import { FiMenu, FiBell, FiSearch, FiSun, FiMoon, FiChevronDown, FiLogOut, FiUser, FiSettings } from 'react-icons/fi';
import NotificationList from "./NotificationList";
import ConfigService from '../../utils/config';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../slices/auth';
import auth from '../../utils/auth';
import UserSettings from './modals/UserSettings';
import UserProfile from './modals/UserProfile';
import UnifiedCreateButton from './UnifiedCreateButton';
import NewTaskDrawer from './drawers/NewTaskDrawer';
import NewNoteDrawer from './drawers/NewNoteDrawer';

const Header = ({ onMenuToggle }) => {
    const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
    const { isOpen: isNotificationsOpen, onOpen: onNotificationsOpen, onClose: onNotificationsClose } = useDisclosure();
    const { isOpen: isNewTaskOpen, onOpen: onNewTaskOpen, onClose: onNewTaskClose } = useDisclosure();
    const { isOpen: isNewNoteOpen, onOpen: onNewNoteOpen, onClose: onNewNoteClose } = useDisclosure();

    const bgColor = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const { colorMode, toggleColorMode } = useColorMode();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const user = useSelector(state => state.auth.user);

    useEffect(() => {
        // Fetch workspaces from API or localStorage
        const defaultWorkspace = ConfigService.getDefaultWorkspace();
        setCurrentWorkspace(defaultWorkspace);
        
        // TODO: Replace with actual API call to fetch user's workspaces
        const userWorkspaces = [
            defaultWorkspace,
            { workspace_id: "workspace2", name: "Workspace 2" },
            { workspace_id: "workspace3", name: "Workspace 3" }
        ];
        setWorkspaces(userWorkspaces);
    }, []);

    const handleWorkspaceChange = (workspaceId) => {
        const selectedWorkspace = workspaces.find(w => w.workspace_id === workspaceId);
        if (selectedWorkspace) {
            ConfigService.setDefaultWorkspace(selectedWorkspace);
            setCurrentWorkspace(selectedWorkspace);
            // Refresh the page to update workspace context
            window.location.reload();
        }
    };

    const handleLogout = () => {
        dispatch(logout()); // Dispatch Redux logout action
        auth.logout(); // Call auth service logout
        navigate('/login'); // Redirect to login page
    };

    return (
        <Box
            as="header"
            position="sticky"
            top="0"
            zIndex="sticky"
            bg={bgColor}
            borderBottom="1px"
            borderColor={borderColor}
        >
            <Flex
                h="16"
                alignItems="center"
                justifyContent="space-between"
                px={4}
            >
                <HStack spacing={4}>
                    <IconButton
                        icon={<FiMenu />}
                        variant="ghost"
                        onClick={onMenuToggle}
                        aria-label="Toggle menu"
                    />
                    <IconButton
                        icon={<FiSearch />}
                        variant="ghost"
                        aria-label="Search"
                    />
                </HStack>

                <HStack spacing={4}>
                    <Popover
                        isOpen={isNotificationsOpen}
                        onClose={onNotificationsClose}
                        placement="bottom-end"
                    >
                        <PopoverTrigger>
                            <IconButton
                                icon={<FiBell />}
                                variant="ghost"
                                onClick={onNotificationsOpen}
                                aria-label="Notifications"
                            />
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverBody>
                                <NotificationList />
                            </PopoverBody>
                        </PopoverContent>
                    </Popover>

                    <Menu>
                        <MenuButton
                            as={Button}
                            rightIcon={<FiChevronDown />}
                            variant="ghost"
                            leftIcon={<Avatar size="sm" name={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'} />}
                        >
                            <Text display={{ base: "none", md: "block" }}>
                                {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                            </Text>
                        </MenuButton>
                        <MenuList>
                            <MenuItem icon={<FiUser />} onClick={onProfileOpen}>
                                Profile
                            </MenuItem>
                            <MenuItem icon={<FiSettings />} onClick={onSettingsOpen}>
                                Settings
                            </MenuItem>
                            <MenuDivider />
                            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                                Logout
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
            </Flex>

            {/* Modals and Drawers */}
            <UserProfile isOpen={isProfileOpen} onClose={onProfileClose} />
            <UserSettings isOpen={isSettingsOpen} onClose={onSettingsClose} />
            <NewTaskDrawer 
                currentTask={{}} 
                disclosures={{ 
                    isOpen: isNewTaskOpen, 
                    onOpen: onNewTaskOpen, 
                    onClose: onNewTaskClose 
                }} 
            />
            <NewNoteDrawer 
                currentTask={{}} 
                disclosures={{ 
                    isOpen: isNewNoteOpen, 
                    onOpen: onNewNoteOpen, 
                    onClose: onNewNoteClose 
                }} 
            />
        </Box>
    );
};

export default Header;

