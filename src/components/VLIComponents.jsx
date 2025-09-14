// Componentes do Design System VLI
// Componentes reutilizáveis com tema profissional VLI

import React from 'react';
import { Button as MuiButton, Paper, Typography, Card, CardContent, Box } from '@mui/material';
import { vliColors, vliShadows, vliBorderRadius } from '../theme/vliTheme';

// Botão VLI com variantes
export const VLIButton = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  ...props 
}) => {
  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: vliBorderRadius.medium,
      fontWeight: 600,
      textTransform: 'none',
      boxShadow: vliShadows.small,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: vliShadows.medium,
        transform: 'translateY(-1px)'
      },
      '&:disabled': {
        opacity: 0.6,
        transform: 'none',
        boxShadow: 'none'
      }
    };

    const variants = {
      primary: {
        background: vliColors.gradients.primary,
        color: vliColors.primary.contrastText,
        '&:hover': {
          ...baseStyles['&:hover'],
          background: vliColors.primary.dark
        }
      },
      secondary: {
        background: vliColors.gradients.secondary,
        color: vliColors.secondary.contrastText,
        '&:hover': {
          ...baseStyles['&:hover'],
          background: vliColors.secondary.dark
        }
      },
      success: {
        background: vliColors.gradients.success,
        color: vliColors.success.contrastText || '#FFFFFF',
        '&:hover': {
          ...baseStyles['&:hover'],
          background: vliColors.success.dark
        }
      },
      outlined: {
        border: `2px solid ${vliColors.primary.main}`,
        color: vliColors.primary.main,
        backgroundColor: 'transparent',
        '&:hover': {
          ...baseStyles['&:hover'],
          backgroundColor: vliColors.primary.main,
          color: vliColors.primary.contrastText
        }
      }
    };

    const sizes = {
      small: { padding: '6px 16px', fontSize: '0.875rem' },
      medium: { padding: '8px 22px', fontSize: '0.9375rem' },
      large: { padding: '12px 30px', fontSize: '1rem' }
    };

    return {
      ...baseStyles,
      ...variants[variant],
      ...sizes[size],
      width: fullWidth ? '100%' : 'auto'
    };
  };

  return (
    <MuiButton
      sx={getButtonStyles()}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      onClick={onClick}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

// Card VLI com estilo profissional
export const VLICard = ({ 
  children, 
  elevation = 'medium',
  padding = 'md',
  gradient = false,
  ...props 
}) => {
  const getCardStyles = () => {
    const elevations = {
      none: { boxShadow: vliShadows.none },
      small: { boxShadow: vliShadows.small },
      medium: { boxShadow: vliShadows.medium },
      large: { boxShadow: vliShadows.large },
      elevated: { boxShadow: vliShadows.elevated }
    };

    const paddings = {
      sm: { padding: '12px' },
      md: { padding: '16px' },
      lg: { padding: '24px' },
      xl: { padding: '32px' }
    };

    return {
      borderRadius: vliBorderRadius.large,
      background: gradient ? vliColors.gradients.card : vliColors.background.paper,
      border: gradient ? `1.5px solid ${vliColors.primary.light}` : 'none',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: vliShadows.large
      },
      ...elevations[elevation],
      ...paddings[padding]
    };
  };

  return (
    <Paper sx={getCardStyles()} {...props}>
      {children}
    </Paper>
  );
};

// Typography VLI com estilos consistentes
export const VLITypography = ({ 
  variant = 'body1', 
  color = 'textPrimary',
  children,
  gradient = false,
  ...props 
}) => {
  const getTypographyStyles = () => {
    const colors = {
      primary: { color: vliColors.primary.main },
      secondary: { color: vliColors.secondary.main },
      success: { color: vliColors.success.main },
      error: { color: vliColors.error.main },
      warning: { color: vliColors.warning.main },
      textPrimary: { color: vliColors.grey[900] },
      textSecondary: { color: vliColors.grey[600] }
    };

    return {
      ...colors[color],
      ...(gradient && {
        background: vliColors.gradients.primary,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      })
    };
  };

  return (
    <Typography 
      variant={variant} 
      sx={getTypographyStyles()}
      {...props}
    >
      {children}
    </Typography>
  );
};

// Container VLI com layout responsivo
export const VLIContainer = ({ 
  children, 
  maxWidth = 'lg',
  padding = true,
  ...props 
}) => {
  const getContainerStyles = () => {
    const maxWidths = {
      xs: '100%',
      sm: '600px',
      md: '960px',
      lg: '1280px',
      xl: '1920px'
    };

    return {
      maxWidth: maxWidths[maxWidth],
      margin: '0 auto',
      padding: padding ? '0 16px' : '0',
      width: '100%'
    };
  };

  return (
    <Box sx={getContainerStyles()} {...props}>
      {children}
    </Box>
  );
};

// Status Badge VLI
export const VLIStatusBadge = ({ 
  status = 'default',
  children,
  size = 'medium',
  ...props 
}) => {
  const getBadgeStyles = () => {
    const statuses = {
      success: {
        backgroundColor: vliColors.success.light,
        color: vliColors.success.dark,
        border: `1px solid ${vliColors.success.main}`
      },
      warning: {
        backgroundColor: vliColors.warning.light,
        color: vliColors.warning.dark,
        border: `1px solid ${vliColors.warning.main}`
      },
      error: {
        backgroundColor: vliColors.error.light,
        color: vliColors.error.dark,
        border: `1px solid ${vliColors.error.main}`
      },
      info: {
        backgroundColor: vliColors.info.light,
        color: vliColors.info.dark,
        border: `1px solid ${vliColors.info.main}`
      },
      default: {
        backgroundColor: vliColors.grey[100],
        color: vliColors.grey[800],
        border: `1px solid ${vliColors.grey[300]}`
      }
    };

    const sizes = {
      small: { padding: '2px 8px', fontSize: '0.75rem' },
      medium: { padding: '4px 12px', fontSize: '0.875rem' },
      large: { padding: '6px 16px', fontSize: '1rem' }
    };

    return {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: vliBorderRadius.medium,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      ...statuses[status],
      ...sizes[size]
    };
  };

  return (
    <Box component="span" sx={getBadgeStyles()} {...props}>
      {children}
    </Box>
  );
};

// Grid responsivo VLI
export const VLIGrid = ({ 
  children, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  spacing = 'md',
  ...props 
}) => {
  const getGridStyles = () => {
    const spacings = {
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    };

    return {
      display: 'grid',
      gap: spacings[spacing],
      gridTemplateColumns: {
        xs: `repeat(${columns.xs || 1}, 1fr)`,
        sm: `repeat(${columns.sm || columns.xs || 1}, 1fr)`,
        md: `repeat(${columns.md || columns.sm || columns.xs || 1}, 1fr)`,
        lg: `repeat(${columns.lg || columns.md || columns.sm || columns.xs || 1}, 1fr)`,
        xl: `repeat(${columns.xl || columns.lg || columns.md || columns.sm || columns.xs || 1}, 1fr)`
      }
    };
  };

  return (
    <Box sx={getGridStyles()} {...props}>
      {children}
    </Box>
  );
};

export default {
  VLIButton,
  VLICard,
  VLITypography,
  VLIContainer,
  VLIStatusBadge,
  VLIGrid
};