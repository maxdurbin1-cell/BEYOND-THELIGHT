// --- PATCH INSTRUCTIONS ---
// 1. Add { key: 'open-inventory', label: 'Open Inventory' } to the actions array in showTokenContextMenu (after 'sheet').
// 2. In runTokenContextAction, add a handler for 'open-inventory' before 'ping' that calls window.renderBackpackUI().
// --- END PATCH INSTRUCTIONS ---
