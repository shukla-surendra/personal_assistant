import React, { useEffect } from 'react';
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
    VStack
} from '@chakra-ui/react';
import { fetchContacts } from '../../slices/crm/contactsSlice';
import { fetchDeals } from '../../slices/crm/dealsSlice';
import { fetchActivities } from '../../slices/crm/activitiesSlice';
import ActivitiesPanel from '../../components/crm/ActivitiesPanel';
import ContactsPanel from '../../components/crm/ContactsPanel';
import DealsPanel from '../../components/crm/DealsPanel';
import { useNavigate } from 'react-router-dom';
import { selectWorkspace } from '../../store/slices/workspaceSlice';
import config from '../../utils/config';

const CRMPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();
    const { selectedWorkspace } = useSelector((state) => state.workspaces || {});
    const contacts = useSelector((state) => state.contacts || {});
    const deals = useSelector((state) => state.deals || {});
    const activities = useSelector((state) => state.activities || {});

    const isLoading = contacts.loading || deals.loading || activities.loading;
    const hasError = contacts.error || deals.error || activities.error;

    useEffect(() => {
        // Get the workspace from localStorage that was set during login
        const savedWorkspace = localStorage.getItem('workspace');
        if (savedWorkspace) {
            try {
                const workspace = JSON.parse(savedWorkspace);
                console.log('Found saved workspace:', workspace);
                if (workspace && workspace.workspace_id) {
                    dispatch(selectWorkspace(workspace));
                }
            } catch (error) {
                console.error('Error parsing saved workspace:', error);
            }
        }
    }, [dispatch]);

    useEffect(() => {
        if (selectedWorkspace) {
            console.log('Selected workspace changed, fetching data for:', selectedWorkspace);
            dispatch(fetchContacts(selectedWorkspace.workspace_id));
            dispatch(fetchDeals(selectedWorkspace.workspace_id));
            dispatch(fetchActivities(selectedWorkspace.workspace_id));
        }
    }, [dispatch, selectedWorkspace]);

    useEffect(() => {
        if (hasError) {
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
        return (
            <Box p={4}>
                <VStack spacing={4} align="center" justify="center" minH="50vh">
                    <Text fontSize="xl">Please select a workspace to view CRM data.</Text>
                    <Button colorScheme="blue" onClick={() => navigate('/workspaces')}>
                        Go to Workspaces
                    </Button>
                </VStack>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        <Box p={4}>
            <Heading mb={6}>CRM Dashboard - {selectedWorkspace.name}</Heading>
            <Tabs variant="enclosed">
                <TabList>
                    <Tab>Activities</Tab>
                    <Tab>Contacts</Tab>
                    <Tab>Deals</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <ActivitiesPanel />
                    </TabPanel>
                    <TabPanel>
                        <ContactsPanel />
                    </TabPanel>
                    <TabPanel>
                        <DealsPanel />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    );
};

export default CRMPage; 