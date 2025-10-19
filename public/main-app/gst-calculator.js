// GST Calculator for Main GST Application
// Handles GST calculations and tax computations

class GSTCalculator {
  constructor(appInstance) {
    this.app = appInstance;
    this.gstRates = {
      '0%': 0,
      '5%': 5,
      '12%': 12,
      '18%': 18,
      '28%': 28
    };
  }

  // Calculate GST for sales
  calculateSalesGST(salesAmount, gstRate = '18%') {
    const rate = this.gstRates[gstRate] / 100;
    const cgst = (salesAmount * rate) / 2;
    const sgst = (salesAmount * rate) / 2;
    const igst = salesAmount * rate;
    
    return {
      salesAmount: salesAmount,
      gstRate: gstRate,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      totalGST: igst,
      totalAmount: salesAmount + igst
    };
  }

  // Calculate GST for purchases
  calculatePurchaseGST(purchaseAmount, gstRate = '18%') {
    const rate = this.gstRates[gstRate] / 100;
    const cgst = (purchaseAmount * rate) / 2;
    const sgst = (purchaseAmount * rate) / 2;
    const igst = purchaseAmount * rate;
    
    return {
      purchaseAmount: purchaseAmount,
      gstRate: gstRate,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      totalGST: igst,
      totalAmount: purchaseAmount + igst
    };
  }

  // Calculate net GST payable
  calculateNetGST(salesGST, purchaseGST) {
    const netGST = salesGST.totalGST - purchaseGST.totalGST;
    
    return {
      salesGST: salesGST.totalGST,
      purchaseGST: purchaseGST.totalGST,
      netGST: netGST,
      gstPayable: netGST > 0 ? netGST : 0,
      gstCredit: netGST < 0 ? Math.abs(netGST) : 0
    };
  }

  // Calculate GST for composition scheme
  calculateCompositionGST(turnover, compositionRate = 1) {
    const gstAmount = (turnover * compositionRate) / 100;
    
    return {
      turnover: turnover,
      compositionRate: compositionRate,
      gstAmount: gstAmount,
      totalAmount: turnover + gstAmount
    };
  }

  // Calculate reverse charge GST
  calculateReverseChargeGST(amount, gstRate = '18%') {
    const rate = this.gstRates[gstRate] / 100;
    const gstAmount = amount * rate;
    
    return {
      amount: amount,
      gstRate: gstRate,
      gstAmount: gstAmount,
      totalAmount: amount + gstAmount,
      isReverseCharge: true
    };
  }

  // Calculate interest on delayed payment
  calculateInterest(amount, daysDelayed, interestRate = 18) {
    const dailyRate = interestRate / 365 / 100;
    const interest = amount * dailyRate * daysDelayed;
    
    return {
      principalAmount: amount,
      daysDelayed: daysDelayed,
      interestRate: interestRate,
      interestAmount: interest,
      totalAmount: amount + interest
    };
  }

  // Calculate late fee
  calculateLateFee(daysDelayed, gstType = 'REGULAR') {
    const lateFeeRates = {
      'REGULAR': {
        '1-15': 200,
        '16-30': 500,
        '31+': 1000
      },
      'COMPOSITION': {
        '1-15': 100,
        '16-30': 200,
        '31+': 500
      }
    };
    
    let lateFee = 0;
    const rates = lateFeeRates[gstType];
    
    if (daysDelayed <= 15) {
      lateFee = rates['1-15'];
    } else if (daysDelayed <= 30) {
      lateFee = rates['16-30'];
    } else {
      lateFee = rates['31+'];
    }
    
    return {
      daysDelayed: daysDelayed,
      gstType: gstType,
      lateFee: lateFee
    };
  }

  // Get available GST rates
  getGSTRates() {
    return this.gstRates;
  }

  // Validate GST number
  validateGSTNumber(gstNumber) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  // Extract state code from GST number
  extractStateCode(gstNumber) {
    if (this.validateGSTNumber(gstNumber)) {
      return gstNumber.substring(0, 2);
    }
    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GSTCalculator;
} else if (typeof window !== 'undefined') {
  window.GSTCalculator = GSTCalculator;
}
