import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Switch,
  Select,
  Button,
  useColorMode,
  useColorModeValue,
  IconButton,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiArrowLeft, FiMoon, FiSun, FiBell, FiUser, FiGlobe, FiGrid, FiBox } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { retrieveSettings, updateSettings } from '../../slices/settings';
import { updateProfile } from '../../slices/auth';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';
import ModuleService from '../../services/ModuleService';

const MODULE_ICONS = { box: FiBox };

const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const mainBg = useColorModeValue('gray.50', 'gray.800');
  const { colorMode, toggleColorMode } = useColorMode();
  const { settings } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const [localSettings, setLocalSettings] = useState({
    email_notifications: true,
    task_reminders: true,
    weekly_digest: false,
    language: 'en',
    timezone: 'UTC',
    theme: colorMode,
  });
  // Profile fields live on the User record, not UserSettings -- saved
  // through a separate PUT /users/{id} call (see handleSave), which is
  // also why email isn't editable here: there's no backend support for
  // changing it yet, so it's shown read-only rather than accepting an
  // edit that would silently never save.
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', bio: '' });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);

  useEffect(() => {
    dispatch(retrieveSettings());
    loadModules();
  }, [dispatch]);

  const loadModules = async () => {
    try {
      const response = await ModuleService.getAll();
      setModules(response.data);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setModulesLoading(false);
    }
  };

  const handleToggleModule = async (moduleKey, enabled) => {
    setTogglingKey(moduleKey);
    try {
      const response = await ModuleService.toggle(moduleKey, enabled);
      setModules(prev => prev.map(m => m.key === moduleKey ? response.data : m));
      toast({
        title: `${response.data.name} ${enabled ? 'enabled' : 'disabled'}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Couldn't update module",
        description: error.response?.data?.detail || 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTogglingKey(null);
    }
  };

  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = (key, value) => {
    setProfileForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const updates = [dispatch(updateSettings(localSettings)).unwrap()];
      if (user?.user_id) {
        updates.push(dispatch(updateProfile({ userId: user.user_id, data: profileForm })).unwrap());
      }
      await Promise.all(updates);
      toast({
        title: 'Success',
        description: 'Settings updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: typeof error === 'string' ? error : (error.message || 'Failed to update settings'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!settings) {
    return (
      <Box minH="100vh" bg={pageBg}>
        <Navbar isCollapsed={isMenuCollapsed} />
        <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }}>
          <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" />
          </Flex>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg}>
      <Navbar isCollapsed={isMenuCollapsed} />
      <Box ml={{ base: 0, md: isMenuCollapsed ? '60px' : '250px' }} transition="all 0.3s ease">
        <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
        <Box as="main" p={{ base: 3, md: 4 }} minH="calc(100vh - 4rem)" bg={mainBg} borderRadius="lg" boxShadow="sm">
    <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              icon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            />
            <Heading size="lg">Settings</Heading>
          </HStack>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={!settings}
          >
            Save Changes
          </Button>
        </Flex>

        {/* Settings Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <FiUser />
                <Text>Profile</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiBell />
                <Text>Notifications</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiGlobe />
                <Text>Preferences</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiGrid />
                <Text>Modules</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Profile Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Profile Information</Heading>
                    <HStack spacing={4} align="flex-start">
                      <FormControl>
                        <FormLabel>First Name</FormLabel>
                        <Input
                          value={profileForm.first_name}
                          onChange={(e) => handleProfileChange('first_name', e.target.value)}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Last Name</FormLabel>
                        <Input
                          value={profileForm.last_name}
                          onChange={(e) => handleProfileChange('last_name', e.target.value)}
                        />
                      </FormControl>
                    </HStack>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input value={user?.email || ''} isReadOnly isDisabled />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Email changes aren't supported yet.
                      </Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Bio</FormLabel>
                      <Textarea
                        value={profileForm.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>

            {/* Notification Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Notification Preferences</Heading>
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Email Notifications</FormLabel>
                      <Switch
                        isChecked={localSettings.email_notifications}
                        onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Task Reminders</FormLabel>
                      <Switch
                        isChecked={localSettings.task_reminders}
                        onChange={(e) => handleSettingChange('task_reminders', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Weekly Digest</FormLabel>
                      <Switch
                        isChecked={localSettings.weekly_digest}
                        onChange={(e) => handleSettingChange('weekly_digest', e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>

            {/* Preferences Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Appearance & Language</Heading>
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Dark Mode</FormLabel>
                      <IconButton
                        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                        onClick={toggleColorMode}
                        variant="ghost"
                        aria-label="Toggle color mode"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Language</FormLabel>
                      <Select
                        value={localSettings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Timezone</FormLabel>
                      <Select
                        value={localSettings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                      >
                        <option value="UTC">UTC</option>
                        <option value="EST">Eastern Time</option>
                        <option value="PST">Pacific Time</option>
                        <option value="GMT">GMT</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>

            {/* Modules -- plug-and-play feature modules (ERP etc.), each
                enabled independently per workspace. */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Modules</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Turn on additional feature modules for this workspace. Disabled modules are
                      completely hidden from navigation and their APIs refuse requests.
                    </Text>
                    {modulesLoading ? (
                      <Spinner size="sm" />
                    ) : (
                      modules.map(module => {
                        const ModuleIcon = MODULE_ICONS[module.icon] || FiGrid;
                        return (
                          <FormControl key={module.key} display="flex" alignItems="center" justifyContent="space-between">
                            <HStack spacing={3}>
                              <ModuleIcon />
                              <Box>
                                <FormLabel mb={0}>{module.name}</FormLabel>
                                <Text fontSize="xs" color="gray.500">{module.description}</Text>
                              </Box>
                            </HStack>
                            <Switch
                              isChecked={module.enabled}
                              isDisabled={togglingKey === module.key}
                              onChange={(e) => handleToggleModule(module.key, e.target.checked)}
                            />
                          </FormControl>
                        );
                      })
                    )}
                    {!modulesLoading && modules.length === 0 && (
                      <Text fontSize="sm" color="gray.400">No modules available yet.</Text>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage; 