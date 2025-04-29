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
import { useDispatch } from 'react-redux';
import { logout } from '../../slices/auth';
import auth from '../../utils/auth';
import UserSettings from './modals/UserSettings';
import UserProfile from './modals/UserProfile';
import UnifiedCreateButton from './UnifiedCreateButton';
import NewTaskDrawer from './drawers/NewTaskDrawer';
import NewNoteDrawer from './drawers/NewNoteDrawer';

const Header = ({ menu_open }) => {
    const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
    const { isOpen: isNotificationsOpen, onOpen: onNotificationsOpen, onClose: onNotificationsClose } = useDisclosure();
    const { isOpen: isNewTaskOpen, onOpen: onNewTaskOpen, onClose: onNewTaskClose } = useDisclosure();
    const { isOpen: isNewNoteOpen, onOpen: onNewNoteOpen, onClose: onNewNoteClose } = useDisclosure();

    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const { colorMode, toggleColorMode } = useColorMode();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [workspaces, setWorkspaces] = useState([]);
    const [currentWorkspace, setCurrentWorkspace] = useState(null);

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
    };

    return (
        <Flex
            as="header"
            align="center"
            justify="space-between"
            w="full"
            px={4}
            py={3}
            bg={bg}
            borderBottom="1px"
            borderColor={borderColor}
        >
            <IconButton
                aria-label="Open menu"
                icon={<FiMenu />}
                variant="ghost"
                onClick={menu_open.onOpen}
            />

            <HStack spacing={4}>
                <IconButton
                    aria-label="Search"
                    icon={<FiSearch />}
                    variant="ghost"
                    color={useColorModeValue('gray.600', 'gray.300')}
                    _hover={{
                        color: useColorModeValue('brand.600', 'brand.300'),
                    }}
                />
                <UnifiedCreateButton 
                    onCreateNote={onNewNoteOpen}
                    onCreateTask={onNewTaskOpen}
                />
                <Popover
                    isOpen={isNotificationsOpen}
                    onClose={onNotificationsClose}
                    placement="bottom-end"
                >
                    <PopoverTrigger>
                        <IconButton
                            aria-label="Notifications"
                            icon={<FiBell />}
                            variant="ghost"
                            onClick={onNotificationsOpen}
                        />
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverBody>
                            <NotificationList />
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
                <IconButton
                    aria-label="Toggle color mode"
                    icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                    onClick={toggleColorMode}
                    variant="ghost"
                    color={useColorModeValue('gray.600', 'gray.300')}
                    _hover={{
                        color: useColorModeValue('brand.600', 'brand.300'),
                    }}
                />
            </HStack>

            <HStack spacing={4}>
                <Menu>
                    <MenuButton
                        as={Button}
                        variant="ghost"
                        leftIcon={<Avatar size="sm" />}
                        rightIcon={<FiUser />}
                    >
                        Profile
                    </MenuButton>
                    <MenuList>
                        <MenuItem icon={<FiUser />} onClick={onProfileOpen}>
                            Profile
                        </MenuItem>
                        <MenuItem icon={<FiSettings />} onClick={onSettingsOpen}>
                            Settings
                        </MenuItem>
                        <MenuItem icon={<FiMoon />} onClick={handleLogout}>
                            Logout
                        </MenuItem>
                    </MenuList>
                </Menu>
            </HStack>

            <UserProfile isOpen={isProfileOpen} onClose={onProfileClose} />
            <UserSettings isOpen={isSettingsOpen} onClose={onSettingsClose} />
            <NewTaskDrawer disclosures={{ isOpen: isNewTaskOpen, onOpen: onNewTaskOpen, onClose: onNewTaskClose }} />
            <NewNoteDrawer disclosures={{ isOpen: isNewNoteOpen, onOpen: onNewNoteOpen, onClose: onNewNoteClose }} />
        </Flex>
    );
};

export default Header;

