/* ===========================
   UNIVERSAL CART SYSTEM
   Manages cart across all collections
=========================== */

const CART_KEY = 'agentEdgeCart';

// Cart structure in localStorage:
// {
//   marketing: [...flyer items],
//   advisory: {...report configs},
//   websites: [...property website items]
// }

class UniversalCart {
  constructor() {
    this.cart = this.load();
  }
  
  load() {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : {
      marketing: [],
      advisory: {},
      websites: [],
      cobrand: { enabled: false, layout: 'left' }
    };
  }
  
  save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
    this.updateBadge();
  }
  
  // Marketing Collection methods
  addMarketingItem(name) {
    if (!this.cart.marketing.includes(name)) {
      this.cart.marketing.push(name);
      this.save();
    }
  }
  
  removeMarketingItem(name) {
    this.cart.marketing = this.cart.marketing.filter(item => item !== name);
    this.save();
  }
  
  hasMarketingItem(name) {
    return this.cart.marketing.includes(name);
  }
  
  // Advisory Collection methods
  setAdvisoryReport(reportType, properties) {
    if (properties && properties.length > 0) {
      this.cart.advisory[reportType] = properties;
    } else {
      delete this.cart.advisory[reportType];
    }
    this.save();
  }
  
  getAdvisoryReport(reportType) {
    return this.cart.advisory[reportType] || null;
  }
  
  // Property Websites methods
  setWebsites(properties) {
    this.cart.websites = properties;
    this.save();
  }
  
  getWebsites() {
    return this.cart.websites;
  }
  
  // Get total item count
  getTotalCount() {
    let count = 0;
    
    // Marketing items
    count += this.cart.marketing.length;
    
    // Advisory reports (count number of reports, not properties)
    count += Object.keys(this.cart.advisory).length;
    
    // Website count
    count += this.cart.websites.length;
    
    return count;
  }
  
  // Update cart badge
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    const count = this.getTotalCount();
    
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }
  
  // Co-branding methods
  setCobrand(enabled, layout) {
    this.cart.cobrand = { enabled: !!enabled, layout: layout || 'left' };
    this.save();
  }
  
  getCobrand() {
    return this.cart.cobrand || { enabled: false, layout: 'left' };
  }
  
  // Clear entire cart
  clear() {
    this.cart = {
      marketing: [],
      advisory: {},
      websites: [],
      cobrand: { enabled: false, layout: 'left' }
    };
    localStorage.removeItem(CART_KEY);
    this.updateBadge();
  }
  
  // Get cart summary for display
  getSummary() {
    const summary = [];
    
    // Marketing items
    if (this.cart.marketing.length > 0) {
      summary.push({
        collection: 'Marketing Materials',
        items: this.cart.marketing.map(name => ({ type: 'flyer', name }))
      });
    }
    
    // Advisory reports
    const advisoryKeys = Object.keys(this.cart.advisory);
    if (advisoryKeys.length > 0) {
      const items = [];
      advisoryKeys.forEach(reportType => {
        const displayName = this.getReportDisplayName(reportType);
        const properties = this.cart.advisory[reportType];
        items.push({
          type: 'report',
          name: displayName,
          count: properties.length
        });
      });
      summary.push({
        collection: 'Advisory Reports',
        items
      });
    }
    
    // Property websites
    if (this.cart.websites.length > 0) {
      summary.push({
        collection: 'Property Websites',
        items: this.cart.websites.map(prop => ({
          type: 'website',
          name: prop.address,
          mls: prop.mls
        }))
      });
    }
    
    return summary;
  }
  
  getReportDisplayName(reportType) {
    const names = {
      bid: 'Bid Over Ask',
      buyrent: 'Buy vs Rent',
      costwaiting: 'Cost of Waiting',
      appreciation: 'Appreciation',
      investment: 'Investment Property',
      amortization: 'Mortgage Amortization',
      reportcard: 'Neighborhood Blueprint'
    };
    return names[reportType] || reportType;
  }
}

// Initialize global cart instance
const universalCart = new UniversalCart();

// Update badge on page load
document.addEventListener('DOMContentLoaded', () => {
  universalCart.updateBadge();
});
