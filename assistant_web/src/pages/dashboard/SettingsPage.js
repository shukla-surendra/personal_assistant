import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Switch,
  Select,
  Button,
  Divider,
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
} from '@chakra-ui/react';
import { FiArrowLeft, FiMoon, FiSun, FiBell, FiUser, FiGlobe } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    weeklyDigest: false,
    language: 'en',
    timezone: 'UTC',
    theme: colorMode,
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Product Manager at Tech Corp',
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving settings:', settings);
  };

  return (
    <Container maxW="container.xl" py={8}>
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
          <Button colorScheme="blue" onClick={handleSave}>
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
          </TabList>

          <TabPanels>
            {/* Profile Settings */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md">Profile Information</Heading>
                    <FormControl>
                      <FormLabel>Name</FormLabel>
                      <Input
                        value={settings.name}
                        onChange={(e) => handleSettingChange('name', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        value={settings.email}
                        onChange={(e) => handleSettingChange('email', e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Bio</FormLabel>
                      <Textarea
                        value={settings.bio}
                        onChange={(e) => handleSettingChange('bio', e.target.value)}
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
                        isChecked={settings.emailNotifications}
                        onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Task Reminders</FormLabel>
                      <Switch
                        isChecked={settings.taskReminders}
                        onChange={(e) => handleSettingChange('taskReminders', e.target.checked)}
                      />
                    </FormControl>
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel mb="0">Weekly Digest</FormLabel>
                      <Switch
                        isChecked={settings.weeklyDigest}
                        onChange={(e) => handleSettingChange('weeklyDigest', e.target.checked)}
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
                        value={settings.language}
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
                        value={settings.timezone}
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
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default SettingsPage; 