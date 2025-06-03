import React, { useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
    Grid,
    GridItem,
    Textarea,
    Select,
    useToast
} from '@chakra-ui/react';
import { useDispatch } from 'react-redux';
import { addActivity } from '../../slices/crm/activitiesSlice';

const CreateActivityModal = ({ isOpen, onClose, workspaceId }) => {
    const dispatch = useDispatch();
    const toast = useToast();
    const [formData, setFormData] = useState({
        type: '',
        description: '',
        date: '',
        contact_id: '',
        deal_id: '',
        tags: []
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.type) newErrors.type = 'Type is required';
        if (!formData.description) newErrors.description = 'Description is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            await dispatch(addActivity({ workspaceId, activityData: formData })).unwrap();
            toast({
                title: 'Activity created',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create activity',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>Create New Activity</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                            <GridItem>
                                <FormControl isInvalid={errors.type} isRequired>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select type</option>
                                        <option value="call">Call</option>
                                        <option value="email">Email</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="note">Note</option>
                                    </Select>
                                    <FormErrorMessage>{errors.type}</FormErrorMessage>
                                </FormControl>
                            </GridItem>

                            <GridItem>
                                <FormControl>
                                    <FormLabel>Contact</FormLabel>
                                    <Select
                                        name="contact_id"
                                        value={formData.contact_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select contact</option>
                                        {/* Add contact options here */}
                                    </Select>
                                </FormControl>
                            </GridItem>

                            <GridItem>
                                <FormControl>
                                    <FormLabel>Deal</FormLabel>
                                    <Select
                                        name="deal_id"
                                        value={formData.deal_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select deal</option>
                                        {/* Add deal options here */}
                                    </Select>
                                </FormControl>
                            </GridItem>

                            <GridItem colSpan={2}>
                                <FormControl isInvalid={errors.description} isRequired>
                                    <FormLabel>Description</FormLabel>
                                    <Input
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Enter activity description"
                                    />
                                    <FormErrorMessage>{errors.description}</FormErrorMessage>
                                </FormControl>
                            </GridItem>

                            <GridItem colSpan={2}>
                                <FormControl>
                                    <FormLabel>Date</FormLabel>
                                    <Input
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        type="datetime-local"
                                    />
                                </FormControl>
                            </GridItem>

                            <GridItem colSpan={2}>
                                <FormControl>
                                    <FormLabel>Tags</FormLabel>
                                    <Input
                                        name="tags"
                                        value={formData.tags.join(', ')}
                                        onChange={(e) => {
                                            const tags = e.target.value
                                                .split(',')
                                                .map(tag => tag.trim())
                                                .filter(tag => tag);
                                            setFormData(prev => ({
                                                ...prev,
                                                tags
                                            }));
                                        }}
                                        placeholder="Enter tags (comma-separated)"
                                    />
                                </FormControl>
                            </GridItem>
                        </Grid>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            Create Activity
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default CreateActivityModal; 