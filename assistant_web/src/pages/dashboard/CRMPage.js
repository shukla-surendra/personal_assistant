import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    Flex,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Heading,
    Spinner,
    Text,
    useToast,
    Button,
    VStack,
    useColorModeValue,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription
} from '@chakra-ui/react';
import { fetchContacts } from '../../slices/crm/contactsSlice';
import { fetchDeals } from '../../slices/crm/dealsSlice';
import ActivitiesPanel from '../../components/crm/ActivitiesPanel';
import ContactsPanel from '../../components/crm/ContactsPanel';
import DealsPanel from '../../components/crm/DealsPanel';
import { useNavigate } from 'react-router-dom';
import { selectWorkspace, fetchWorkspaces } from '../../slices/workspaces';
import config from '../../utils/config';
import Navbar from '../../components/dashboard/Navbar';
import Header from '../../components/dashboard/Header';

const CRMPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();
    const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
    const { selectedWorkspace, workspaces } = useSelector((state) => state.workspaces || {});
    const { contacts, loading: contactsLoading, error: contactsError } = useSelector((state) => state.contacts || {});
    const { deals, loading: dealsLoading, error: dealsError } = useSelector((state) => state.deals || {});
    // Activities has no top-level fetch of its own -- ActivitiesPanel loads
    // its data (merged from the contact- and deal-scoped endpoints) on mount.
    const { activities } = useSelector((state) => state.activities || {});
    const bgColor = useColorModeValue('gray.50', 'gray.900');

    const isLoading = contactsLoading || dealsLoading;
    const hasError = contactsError || dealsError;

    // Debug logging for Redux state
    useEffect(() => {
        console.log('Current Redux state:', {
            selectedWorkspace,
            workspaces,
            contacts,
            deals,
            activities
        });
    }, [selectedWorkspace, workspaces, contacts, deals, activities]);

    // Initialize workspaces and select default workspace
    useEffect(() => {
        const initializeWorkspace = async () => {
            try {
                // First, fetch all workspaces
                const resultAction = await dispatch(fetchWorkspaces());
                console.log('Fetch workspaces result:', resultAction);
                
                // Then get the default workspace from config
                console.log('Attempting to get workspace from localStorage...');
                const workspaceFromStorage = localStorage.getItem('workspace');
                console.log('Raw workspace from localStorage:', workspaceFromStorage);

                if (workspaceFromStorage) {
                    const defaultWorkspace = JSON.parse(workspaceFromStorage);
                    console.log('Default workspace from storage:', defaultWorkspace);

                    if (defaultWorkspace && defaultWorkspace.workspace_id) {
                        console.log('Dispatching selectWorkspace action with:', defaultWorkspace);
                        const selectAction = dispatch(selectWorkspace(defaultWorkspace));
                        console.log('Select workspace action result:', selectAction);
                    } else {
                        console.warn('Default workspace is missing workspace_id:', defaultWorkspace);
                    }
                } else {
                    console.warn('No workspace found in localStorage');
                    toast({
                        title: 'No Workspace Selected',
                        description: 'Please select a workspace to continue.',
                        status: 'warning',
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } catch (error) {
                console.error('Error in workspace initialization:', error);
                console.error('Error stack:', error.stack);
                toast({
                    title: 'Error',
                    description: 'Failed to initialize workspace. Please try again.',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        };

        initializeWorkspace();
    }, [dispatch, toast]);

    useEffect(() => {
        if (selectedWorkspace) {
            console.log('Selected workspace changed, fetching data for:', selectedWorkspace);
            console.log('Workspace ID:', selectedWorkspace.workspace_id);
            dispatch(fetchContacts(selectedWorkspace.workspace_id));
            dispatch(fetchDeals(selectedWorkspace.workspace_id));
        } else {
            console.log('No selected workspace available');
        }
    }, [dispatch, selectedWorkspace]);

    useEffect(() => {
        if (hasError) {
            console.error('Error in CRM data:', hasError);
            toast({
                title: 'Error',
                description: 'Failed to load CRM data. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }, [hasError, toast]);

    if (!selectedWorkspace) {
        console.log('Rendering no workspace selected view');
        return (
            <Box minH="100vh" bg={bgColor}>
                <Navbar isCollapsed={isMenuCollapsed} />
                <Box
                    ml={{ base: 0, md: isMenuCollapsed ? "60px" : "250px" }}
                    transition="all 0.3s ease"
                    minH="100vh"
                >
                    <Header onMenuToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
                    <Box p={4}>
                        <VStack spacing={4} align="center" justify="center" minH="50vh">
                            <Text fontSize="xl">Please select a workspace to view CRM data.</Text>
                            <Button colorScheme="blue" onClick={() => navigate('/workspaces')}>
                                Go to Workspaces
                            </Button>
                        </VStack>
                    </Box>
                </Box>
            </Box>
        );
    }

    if (isLoading) {
        console.log('Rendering loading state');
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (hasError) {
        return (
            <Box p={4}>
                <Alert status="error">
                    <AlertIcon />
                    <AlertTitle>Error loading CRM data</AlertTitle>
                    <AlertDescription>
                        {contactsError && <Text>Error loading contacts: {contactsError}</Text>}
                        {dealsError && <Text>Error loading deals: {dealsError}</Text>}
                    </AlertDescription>
                </Alert>
            </Box>
        );
    }

    console.log('Rendering CRM dashboard with workspace:', selectedWorkspace);
    return (
        <Box bg={bgColor} minH="100vh">
            <Navbar isCollapsed={isMenuCollapsed} onToggle={() => setIsMenuCollapsed(!isMenuCollapsed)} />
            <Box ml={isMenuCollapsed ? "60px" : "240px"} p={4}>
                <Header title="CRM" />
                <Tabs variant="enclosed" mt={4}>
                    <TabList>
                        <Tab>Contacts</Tab>
                        <Tab>Deals</Tab>
                        <Tab>Activities</Tab>
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <ContactsPanel />
                        </TabPanel>
                        <TabPanel>
                            <DealsPanel />
                        </TabPanel>
                        <TabPanel>
                            <ActivitiesPanel 
                                contacts={contacts || []} 
                                deals={deals || []} 
                                workspaceId={selectedWorkspace?.workspace_id}
                            />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </Box>
    );
};

export default CRMPage; 