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
    useToast
} from '@chakra-ui/react';
import { fetchContacts } from '../../slices/crm/contactsSlice';
import { fetchDeals } from '../../slices/crm/dealsSlice';
import { fetchActivities } from '../../slices/crm/activitiesSlice';
import ActivitiesPanel from '../../components/crm/ActivitiesPanel';
import ContactsPanel from '../../components/crm/ContactsPanel';
import DealsPanel from '../../components/crm/DealsPanel';

const CRMPage = () => {
    const dispatch = useDispatch();
    const toast = useToast();
    const { selectedWorkspace } = useSelector((state) => state.workspace);
    const { loading: contactsLoading, error: contactsError } = useSelector((state) => state.contacts);
    const { loading: dealsLoading, error: dealsError } = useSelector((state) => state.deals);
    const { loading: activitiesLoading, error: activitiesError } = useSelector((state) => state.activities);

    useEffect(() => {
        if (selectedWorkspace) {
            dispatch(fetchContacts(selectedWorkspace.workspace_id));
            dispatch(fetchDeals(selectedWorkspace.workspace_id));
            dispatch(fetchActivities(selectedWorkspace.workspace_id));
        }
    }, [dispatch, selectedWorkspace]);

    useEffect(() => {
        if (contactsError || dealsError || activitiesError) {
            toast({
                title: 'Error',
                description: 'Failed to load CRM data. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }, [contactsError, dealsError, activitiesError, toast]);

    if (!selectedWorkspace) {
        return (
            <Box p={4}>
                <Text>Please select a workspace to view CRM data.</Text>
            </Box>
        );
    }

    if (contactsLoading || dealsLoading || activitiesLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        <Box p={4}>
            <Heading mb={6}>CRM Dashboard</Heading>
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