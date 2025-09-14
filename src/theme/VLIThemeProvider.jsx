// Provider do Tema VLI
// Integração do design system VLI com Material-UI

import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { vliColors, vliTypography, vliBorderRadius, vliShadows } from './vliTheme';

// Criação do tema Material-UI customizado com identidade VLI
const createVLITheme = () => {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: vliColors.primary.main,
        light: vliColors.primary.light,
        dark: vliColors.primary.dark,
        contrastText: vliColors.primary.contrastText
      },
      secondary: {
        main: vliColors.secondary.main,
        light: vliColors.secondary.light,
        dark: vliColors.secondary.dark,
        contrastText: vliColors.secondary.contrastText
      },
      success: {
        main: vliColors.success.main,
        light: vliColors.success.light,
        dark: vliColors.success.dark
      },
      warning: {
        main: vliColors.warning.main,
        light: vliColors.warning.light,
        dark: vliColors.warning.dark
      },
      error: {
        main: vliColors.error.main,
        light: vliColors.error.light,
        dark: vliColors.error.dark
      },
      info: {
        main: vliColors.info.main,
        light: vliColors.info.light,
        dark: vliColors.info.dark
      },
      grey: vliColors.grey,
      background: {
        default: vliColors.background.default,
        paper: vliColors.background.paper
      },
      text: {
        primary: vliColors.grey[900],
        secondary: vliColors.grey[600]
      }
    },
    
    typography: {
      fontFamily: vliTypography.fontFamily,
      h1: {
        ...vliTypography.h1,
        color: vliColors.grey[900]
      },
      h2: {
        ...vliTypography.h2,
        color: vliColors.grey[900]
      },
      h3: {
        ...vliTypography.h3,
        color: vliColors.grey[900]
      },
      h4: {
        ...vliTypography.h4,
        color: vliColors.grey[900]
      },
      h5: {
        ...vliTypography.h5,
        color: vliColors.grey[900]
      },
      h6: {
        ...vliTypography.h6,
        color: vliColors.grey[900]
      },
      body1: {
        ...vliTypography.body1,
        color: vliColors.grey[800]
      },
      body2: {
        ...vliTypography.body2,
        color: vliColors.grey[700]
      },
      caption: {
        ...vliTypography.caption,
        color: vliColors.grey[600]
      },
      button: vliTypography.button
    },
    
    shape: {
      borderRadius: parseInt(vliBorderRadius.medium)
    },
    
    shadows: [
      'none',
      vliShadows.small,
      vliShadows.small,
      vliShadows.medium,
      vliShadows.medium,
      vliShadows.medium,
      vliShadows.large,
      vliShadows.large,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated,
      vliShadows.elevated
    ],
    
    components: {
      // Customização global dos componentes Material-UI
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: vliBorderRadius.medium,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: vliShadows.small,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: vliShadows.medium,
              transform: 'translateY(-1px)'
            }
          },
          containedPrimary: {
            background: vliColors.gradients.primary,
            '&:hover': {
              background: vliColors.primary.dark
            }
          },
          containedSecondary: {
            background: vliColors.gradients.secondary,
            '&:hover': {
              background: vliColors.secondary.dark
            }
          }
        }
      },
      
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: vliBorderRadius.large,
            transition: 'all 0.2s ease-in-out'
          },
          elevation1: {
            boxShadow: vliShadows.small
          },
          elevation2: {
            boxShadow: vliShadows.medium
          },
          elevation3: {
            boxShadow: vliShadows.large
          }
        }
      },
      
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: vliBorderRadius.large,
            boxShadow: vliShadows.medium,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: vliShadows.large
            }
          }
        }
      },
      
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: vliBorderRadius.medium,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: vliColors.primary.light
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: vliColors.primary.main,
                borderWidth: '2px'
              }
            }
          }
        }
      },
      
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: vliBorderRadius.medium,
            fontWeight: 500
          },
          colorPrimary: {
            backgroundColor: vliColors.primary.light,
            color: vliColors.primary.dark
          },
          colorSecondary: {
            backgroundColor: vliColors.secondary.light,
            color: vliColors.secondary.dark
          }
        }
      },
      
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: vliColors.gradients.primary,
            boxShadow: vliShadows.elevated
          }
        }
      },
      
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            borderRight: `1px solid ${vliColors.grey[200]}`
          }
        }
      },
      
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: vliColors.grey[50],
            '& .MuiTableCell-head': {
              fontWeight: 600,
              color: vliColors.grey[800]
            }
          }
        }
      },
      
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: vliColors.grey[50]
            }
          }
        }
      },
      
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: vliBorderRadius.large,
            boxShadow: vliShadows.elevated
          }
        }
      },
      
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: vliBorderRadius.medium,
            fontWeight: 500
          },
          standardSuccess: {
            backgroundColor: vliColors.success.light,
            color: vliColors.success.dark
          },
          standardWarning: {
            backgroundColor: vliColors.warning.light,
            color: vliColors.warning.dark
          },
          standardError: {
            backgroundColor: vliColors.error.light,
            color: vliColors.error.dark
          },
          standardInfo: {
            backgroundColor: vliColors.info.light,
            color: vliColors.info.dark
          }
        }
      }
    }
  });
};

// Provider do tema VLI
export const VLIThemeProvider = ({ children }) => {
  const theme = createVLITheme();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default VLIThemeProvider;