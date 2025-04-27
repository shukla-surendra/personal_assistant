import {
    Box,
    Flex,
    useColorModeValue,
    Drawer,
    DrawerContent,
    DrawerOverlay,
    Text,
    useDisclosure,
  
} from '@chakra-ui/react';
import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { retrieveTasks } from "../../slices/tasks";
import Navbar from "../../components/dashboard/Navbar";
import { Helmet } from 'react-helmet';
import Header from '../../components/dashboard/Header';

import EventsCalendar from "../../components/dashboard/EventsCalendar";
import enUS from 'date-fns/locale/en-US';
const locales = { 'en-US': enUS };

export default function DashboardResponsive() {
    const menu_open = useDisclosure();
    const tasks = useSelector(state => state.tasks.tasks);

    const dispatch = useDispatch();

    const initFetch = useCallback(() => {
        dispatch(retrieveTasks());
    }, [dispatch])

    useEffect(() => {
        initFetch()
    }, [initFetch])

    return (
        <>
            <Helmet>
                <title>Notes</title>
                <meta name="description" content="App Description" />
                <meta name="theme-color" content="#008f68" />
            </Helmet>

            <Box as="section" bg={useColorModeValue('gray.50', 'gray.700')} minH="100vh">
                <Navbar display={{ base: 'none', md: 'unset' }} />
                <Drawer isOpen={menu_open.isOpen} onClose={menu_open.onClose} placement="left">
                    <DrawerOverlay />
                    <DrawerContent>
                        <Navbar w="full" borderRight="none" />
                    </DrawerContent>
                </Drawer>
                <Box ml={{ base: 0, md: 60 }} transition=".3s ease">
                    <Header menu_open={menu_open}></Header>
                    <Box as="main" p={4} minH="25rem" bg={useColorModeValue('auto', 'gray.800')}>
                        <EventsCalendar />
                    </Box>
                </Box>
            </Box>
        </>
    );
}
