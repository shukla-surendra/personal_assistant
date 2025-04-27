import React, { useState, useEffect } from "react";
import { Box, Heading, Text, Stack } from '@chakra-ui/react';
import TaskDataService from '../../services/taskservice';
import { useParams } from "react-router-dom";
import Navbar from "../../components/landing/Nav/Navbar";
import Footer from "../../components/landing/Footer";
import { Node } from 'slate'
import { formatLocalDateTime } from "../../utils/locale";



// Define a serializing function that takes a value and returns a string.
const serialize = value => {
  return (
    value
      // Return the string content of each paragraph in the value's children.
      .map(n => Node.string(n))
      // Join them all with line breaks denoting paragraphs.
      .join('\n')
  )
}

// Define a deserializing function that takes a string and returns a value.
const deserialize = string => {
  // Return a value array of children derived by splitting the string.
  return string.split('\n').map(line => {
    return {
      children: [{ text: line }],
    }
  })
}



const BlogPage = () => {

    const [blogPost, setBlogPost] = useState({description: "[{\"type\":\"paragraph\",\"children\":[{\"text\":\"Anopeningparagraph...\"}]}]"});
    const { slug } = useParams();


    const getBlog = slug => {
        TaskDataService.getPostBySlug(slug)
          .then(response => {
            setBlogPost(response.data);
          })
          .catch(e => {
            console.log(e);
          });
      };

    useEffect(() => {
        getBlog(slug);
      }, [slug]);


  return (
    <>
    <Navbar></Navbar>

    <Box padding={10} margin={10}>
      <Heading as="h1" fontSize="20px" textAlign={'center'}>
        {blogPost.title}
      </Heading>
      <Text fontSize="lg" color="gray.500">
        {formatLocalDateTime(blogPost.created_at)}
      </Text>
      <Box mt={4}>
        {/* assuming the blog content is in HTML format */}
        <div dangerouslySetInnerHTML={{ __html:serialize(JSON.parse(blogPost.description))}} />
      </Box>
    </Box>
    <Footer></Footer>
    </>
  );
};

export default BlogPage;
