// ===== INIT =====
updateDashboard();
// Preload orders count for dashboard
loadOrders();
// Load scenarios, credit submissions, and hot leads banner
loadScenarios();
loadCreditSubmissions();
setTimeout(loadHotLeads, 1500);
// Preload calendar data so reminders work even without opening the Calendar view
setTimeout(function() { if (!calDataLoaded) calLoadData(); }, 2000);
