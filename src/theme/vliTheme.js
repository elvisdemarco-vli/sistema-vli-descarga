// Design System VLI - Tema Profissional
// Baseado na estratégia de melhorias documentada

export const vliColors = {
  // Cores primárias VLI
  primary: {
    main: '#1565C0', // Azul VLI principal
    light: '#42A5F5',
    dark: '#0D47A1',
    contrastText: '#FFFFFF'
  },
  
  // Cores secundárias
  secondary: {
    main: '#FF6F00', // Laranja VLI
    light: '#FFB74D',
    dark: '#E65100',
    contrastText: '#FFFFFF'
  },
  
  // Estados e feedback
  success: {
    main: '#2E7D32',
    light: '#66BB6A',
    dark: '#1B5E20'
  },
  
  warning: {
    main: '#F57C00',
    light: '#FFB74D',
    dark: '#E65100'
  },
  
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828'
  },
  
  info: {
    main: '#1976D2',
    light: '#64B5F6',
    dark: '#1565C0'
  },
  
  // Tons de cinza
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  },
  
  // Backgrounds
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    elevated: '#F8F9FA'
  },
  
  // Gradientes VLI
  gradients: {
    primary: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
    secondary: 'linear-gradient(135deg, #FF6F00 0%, #FFB74D 100%)',
    success: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)',
    card: 'linear-gradient(120deg, #e3f2fd 0%, #bbdefb 100%)'
  }
};

export const vliTypography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  
  // Hierarquia tipográfica
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em'
  },
  
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.00833em'
  },
  
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em'
  },
  
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.00735em'
  },
  
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0em'
  },
  
  h6: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: '0.0075em'
  },
  
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em'
  },
  
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em'
  },
  
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em'
  },
  
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase'
  }
};

export const vliSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem'      // 48px
};

export const vliBorderRadius = {
  small: '4px',
  medium: '8px',
  large: '12px',
  xlarge: '16px',
  round: '50%'
};

export const vliShadows = {
  none: 'none',
  small: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  medium: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  large: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  elevated: '0 8px 32px rgba(25, 118, 210, 0.13)'
};

// Breakpoints responsivos
export const vliBreakpoints = {
  xs: '0px',
  sm: '600px',
  md: '960px',
  lg: '1280px',
  xl: '1920px'
};

// Tema completo VLI
export const vliTheme = {
  colors: vliColors,
  typography: vliTypography,
  spacing: vliSpacing,
  borderRadius: vliBorderRadius,
  shadows: vliShadows,
  breakpoints: vliBreakpoints
};

export default vliTheme;