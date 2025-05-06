import React, { useEffect, useState } from 'react';
import { getComponentsForRoles, logUsage, getUserPreferences, saveUserPreferences } from '../../services/dashboardApi';
import { getWidgetComponent } from './WidgetRegistry';
import { Box, Grid, Typography, CircularProgress, Alert, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { buildMenuTree } from '../../utils/menuTree';
import { IconButton, Tooltip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../context/AuthContext';

function localize(text, translationsJson, locale = 'en') {
  if (!translationsJson) return text;
  try {
    const translations = JSON.parse(translationsJson);
    return translations[locale] || text;
  } catch {
    return text;
  }
}

function renderMenuNode(node, locale) {
  // If node has children, render as Accordion
  if (node.children && node.children.length > 0) {
    return (
      <Accordion key={node.id} sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">{localize(node.title, node.translationsJson, locale)}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {node.children.map(child => renderMenuNode(child, locale))}
        </AccordionDetails>
      </Accordion>
    );
  }
  // Leaf node: render widget
  const Widget = getWidgetComponent(node.componentType);
  let config = {};
  try { config = node.configJson ? JSON.parse(node.configJson) : {}; } catch {}
  config.title = localize(node.title, node.translationsJson, locale);
  config.description = localize(node.description, node.translationsJson, locale);
  let style = {};
  try { style = node.themeJson ? JSON.parse(node.themeJson) : {}; } catch {}
  return (
    <Box key={node.id} mb={2}>
      <Box style={style}>
        <Widget config={config} component={node} />
      </Box>
    </Box>
  );
}

function hasWidgetAccess(node, user) {
  if (!node.permissionsJson) return true;
  try {
    const perms = JSON.parse(node.permissionsJson);
    if (perms.allowedUserIds && Array.isArray(perms.allowedUserIds)) {
      return perms.allowedUserIds.includes(user.id);
    }
    // Add more permission checks as needed
    return true;
  } catch {
    return true;
  }
}

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locale] = useState('en');
  const [customize, setCustomize] = useState(false);
  const [userLayout, setUserLayout] = useState([]);
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    setLoading(true);
    getComponentsForRoles(currentUser.roles)
      .then(data => {
        setComponents(data || []);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load dashboard');
        setLoading(false);
      });
  }, [currentUser.roles]);

  // Log analytics on view
  useEffect(() => {
    if (components.length > 0) {
      components.forEach(comp => {
        logUsage({
          userId: currentUser.id,
          componentId: comp.id,
          action: 'view',
          metadataJson: '{}',
        }).catch(() => {});
      });
    }
  }, [components, currentUser.id]);

  if (loading) return <Box mt={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Box mt={4}><Alert severity="error">{error}</Alert></Box>;

  // Build menu tree
  const tree = buildMenuTree(components);

  return (
    <Box mt={4} px={2}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      {/* Render dashboard widgets (respecting user layout and hidden) */}
      {!customize && userLayout && userLayout.filter(w => !preferences?.hidden?.includes(w.id)).map(node => {
        if (!hasWidgetAccess(node, currentUser)) return null;
        const Widget = getWidgetComponent(node.componentType);
        let config = {};
        try { config = node.configJson ? JSON.parse(node.configJson) : {}; } catch {}
        config.title = localize(node.title, node.translationsJson, locale);
        config.description = localize(node.description, node.translationsJson, locale);
        let style = {};
        try { style = node.themeJson ? JSON.parse(node.themeJson) : {}; } catch {}
        return (
          <Box key={node.id} mb={2}>
            <Box style={style}>
              <Widget config={config} component={node} />
            </Box>
          </Box>
        );
      })}
      {/* If not customizing and no userLayout, fallback to nested menu tree */}
      {!customize && (!userLayout || userLayout.length === 0) && tree.map(node => renderMenuNode(node, locale))}
      {/* In customization mode, show 'No Access' for widgets user can't access */}
      {customize && userLayout && (
        <Box mb={3}>
          <Typography variant="h6">Your Widgets</Typography>
          {userLayout.map((w, idx) => (
            <Box key={w.id} display="flex" alignItems="center" mb={1}>
              <Tooltip title="Move Up"><span><IconButton onClick={() => handleMove(idx, -1)} disabled={idx === 0}><ArrowUpwardIcon /></IconButton></span></Tooltip>
              <Tooltip title="Move Down"><span><IconButton onClick={() => handleMove(idx, 1)} disabled={idx === userLayout.length - 1}><ArrowDownwardIcon /></IconButton></span></Tooltip>
              <Tooltip title={preferences?.hidden?.includes(w.id) ? 'Show' : 'Hide'}>
                <IconButton onClick={() => handleToggleHide(w.id)}>
                  {preferences?.hidden?.includes(w.id) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
              <Typography>{w.title}</Typography>
              {!hasWidgetAccess(w, currentUser) && <Typography color="error" ml={2}>No Access</Typography>}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
} 