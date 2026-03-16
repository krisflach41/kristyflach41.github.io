// ===== INIT =====
updateDashboard();
// Preload orders count for dashboard
loadOrders();
// Load scenarios, credit submissions, and hot leads banner
loadScenarios();
loadCreditSubmissions();
setTimeout(loadHotLeads, 1500);
