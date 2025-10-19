// Month Selector Component for Main GST Application
// Handles month selection and validation

class MonthSelector {
  constructor(appInstance) {
    this.app = appInstance;
    this.selectedMonth = appInstance.selectedMonth;
    this.availableMonths = this.generateAvailableMonths();
  }

  // Generate available months for selection
  generateAvailableMonths() {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      months.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }),
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });
    }
    
    return months;
  }

  // Validate month selection
  validateMonth(monthYear) {
    const [year, month] = monthYear.split('-');
    const selectedDate = new Date(year, month - 1, 1);
    const currentDate = new Date();
    
    // Check if month is not in the future
    if (selectedDate > currentDate) {
      return {
        valid: false,
        error: 'Cannot select future months'
      };
    }
    
    // Check if month is not too old (more than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    
    if (selectedDate < twoYearsAgo) {
      return {
        valid: false,
        error: 'Cannot select months older than 2 years'
      };
    }
    
    return {
      valid: true,
      error: null
    };
  }

  // Get month display name
  getMonthDisplayName(monthYear) {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  }

  // Get financial year for the month
  getFinancialYear(monthYear) {
    const [year, month] = monthYear.split('-');
    const monthNum = parseInt(month);
    
    if (monthNum >= 4) {
      // April to March - current year to next year
      return `${year}-${parseInt(year) + 1}`;
    } else {
      // January to March - previous year to current year
      return `${parseInt(year) - 1}-${year}`;
    }
  }

  // Get quarter for the month
  getQuarter(monthYear) {
    const [, month] = monthYear.split('-');
    const monthNum = parseInt(month);
    
    if (monthNum >= 1 && monthNum <= 3) return 'Q4';
    if (monthNum >= 4 && monthNum <= 6) return 'Q1';
    if (monthNum >= 7 && monthNum <= 9) return 'Q2';
    if (monthNum >= 10 && monthNum <= 12) return 'Q3';
  }

  // Get available months
  getAvailableMonths() {
    return this.availableMonths;
  }

  // Get current selected month
  getSelectedMonth() {
    return this.selectedMonth;
  }

  // Set selected month
  setSelectedMonth(monthYear) {
    const validation = this.validateMonth(monthYear);
    if (validation.valid) {
      this.selectedMonth = monthYear;
      return true;
    } else {
      throw new Error(validation.error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonthSelector;
} else if (typeof window !== 'undefined') {
  window.MonthSelector = MonthSelector;
}
