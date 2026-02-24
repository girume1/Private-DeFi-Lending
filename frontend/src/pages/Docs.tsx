import React from 'react';
import { Box, Container, Typography, Paper, alpha, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import Docs from '../components/Docs';

export const DocsPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
      {/* Background Elements */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0) 70%)',
            filter: 'blur(40px)',
          }}
        />
        
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0) 70%)',
            filter: 'blur(50px)',
          }}
        />
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Docs variant="full" showHeader={true} />
        </motion.div>
      </Container>
    </Box>
  );
};

export default DocsPage;