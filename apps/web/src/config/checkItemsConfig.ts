/**
 * Equipment Check Items Configuration
 * Defines all check items with their pass/fail criteria
 */

export interface CheckItemConfig {
  id: string;
  name: string;
  category: string;
  type: 'numeric' | 'percentage' | 'dropdown' | 'checkbox';
  critical: boolean; // If true, failure makes vehicle unfit for service
  passCondition: {
    min?: number;
    max?: number;
    required?: boolean;
    allowedValues?: string[];
  };
  failureMessage: string;
  unit?: string;
  options?: { value: string; label: string }[];
}

export const CHECK_ITEMS: CheckItemConfig[] = [
  // ==================== TYRES ====================
  {
    id: 'tyre_front_left',
    name: 'Front Left Tyre Pressure',
    category: 'Tyres',
    type: 'numeric',
    critical: true,
    passCondition: { min: 30, max: 35 },
    failureMessage: 'Tyre pressure must be between 30-35 PSI',
    unit: 'PSI'
  },
  {
    id: 'tyre_front_right',
    name: 'Front Right Tyre Pressure',
    category: 'Tyres',
    type: 'numeric',
    critical: true,
    passCondition: { min: 30, max: 35 },
    failureMessage: 'Tyre pressure must be between 30-35 PSI',
    unit: 'PSI'
  },
  {
    id: 'tyre_rear_left',
    name: 'Rear Left Tyre Pressure',
    category: 'Tyres',
    type: 'numeric',
    critical: true,
    passCondition: { min: 30, max: 35 },
    failureMessage: 'Tyre pressure must be between 30-35 PSI',
    unit: 'PSI'
  },
  {
    id: 'tyre_rear_right',
    name: 'Rear Right Tyre Pressure',
    category: 'Tyres',
    type: 'numeric',
    critical: true,
    passCondition: { min: 30, max: 35 },
    failureMessage: 'Tyre pressure must be between 30-35 PSI',
    unit: 'PSI'
  },
  {
    id: 'tyre_spare',
    name: 'Spare Tyre Pressure',
    category: 'Tyres',
    type: 'numeric',
    critical: false,
    passCondition: { min: 30 },
    failureMessage: 'Spare tyre must be at least 30 PSI',
    unit: 'PSI'
  },

  // ==================== FUEL ====================
  {
    id: 'fuel_level',
    name: 'Fuel Level',
    category: 'Fuel System',
    type: 'percentage',
    critical: true,
    passCondition: { min: 50, max: 100 },
    failureMessage: 'Fuel level must be at least 50% for emergency readiness',
    unit: '%'
  },

  // ==================== ENGINE OIL ====================
  {
    id: 'engine_oil_level',
    name: 'Engine Oil Level',
    category: 'Engine',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['between_marks', 'at_max'] },
    failureMessage: 'Oil level must be between MIN and MAX marks',
    options: [
      { value: 'below_min', label: 'Below MIN (CRITICAL)' },
      { value: 'between_marks', label: 'Between MIN and MAX (Good)' },
      { value: 'at_max', label: 'At MAX (Good)' },
      { value: 'above_max', label: 'Above MAX (Overfilled)' }
    ]
  },
  {
    id: 'engine_oil_condition',
    name: 'Engine Oil Condition',
    category: 'Engine',
    type: 'dropdown',
    critical: false,
    passCondition: { allowedValues: ['clean', 'light_brown'] },
    failureMessage: 'Oil appears burnt/contaminated - service required soon',
    options: [
      { value: 'clean', label: 'Clean/Clear (Excellent)' },
      { value: 'light_brown', label: 'Light Brown (Good)' },
      { value: 'dark_brown', label: 'Dark Brown (Needs Change)' },
      { value: 'black', label: 'Black/Burnt (CRITICAL)' }
    ]
  },
  {
    id: 'engine_oil_leaks',
    name: 'Oil Leaks',
    category: 'Engine',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['none'] },
    failureMessage: 'Oil leaks detected - immediate attention required',
    options: [
      { value: 'none', label: 'No Leaks (Good)' },
      { value: 'minor_seepage', label: 'Minor Seepage (Warning)' },
      { value: 'active_leak', label: 'Active Leak (CRITICAL)' }
    ]
  },

  // ==================== BRAKE FLUID ====================
  {
    id: 'brake_fluid_level',
    name: 'Brake Fluid Level',
    category: 'Brakes',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['between_marks', 'at_max'] },
    failureMessage: 'Brake fluid level below minimum - CRITICAL SAFETY ISSUE',
    options: [
      { value: 'below_min', label: 'Below MIN (CRITICAL)' },
      { value: 'between_marks', label: 'Between MIN and MAX (Good)' },
      { value: 'at_max', label: 'At MAX (Good)' }
    ]
  },
  {
    id: 'brake_fluid_condition',
    name: 'Brake Fluid Condition',
    category: 'Brakes',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['clear', 'amber'] },
    failureMessage: 'Brake fluid contaminated - flush required IMMEDIATELY',
    options: [
      { value: 'clear', label: 'Clear (Excellent)' },
      { value: 'amber', label: 'Light Amber (Good)' },
      { value: 'dark', label: 'Dark Brown (CRITICAL)' },
      { value: 'contaminated', label: 'Contaminated/Dirty (CRITICAL)' }
    ]
  },

  // ==================== COOLANT ====================
  {
    id: 'coolant_level',
    name: 'Coolant Level',
    category: 'Cooling System',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['between_marks', 'at_max'] },
    failureMessage: 'Coolant level low - risk of overheating',
    options: [
      { value: 'below_min', label: 'Below MIN (CRITICAL)' },
      { value: 'between_marks', label: 'Between MIN and MAX (Good)' },
      { value: 'at_max', label: 'At MAX (Good)' }
    ]
  },
  {
    id: 'coolant_leaks',
    name: 'Coolant Leaks',
    category: 'Cooling System',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['none'] },
    failureMessage: 'Coolant leaks detected - risk of overheating',
    options: [
      { value: 'none', label: 'No Leaks (Good)' },
      { value: 'minor', label: 'Minor Seepage (Warning)' },
      { value: 'active', label: 'Active Leak (CRITICAL)' }
    ]
  },

  // ==================== BATTERY ====================
  {
    id: 'battery_voltage',
    name: 'Battery Voltage',
    category: 'Electrical',
    type: 'numeric',
    critical: true,
    passCondition: { min: 12.4, max: 14.8 },
    failureMessage: 'Battery voltage outside safe range - charging issue or weak battery',
    unit: 'V'
  },
  {
    id: 'battery_terminals',
    name: 'Battery Terminals Condition',
    category: 'Electrical',
    type: 'dropdown',
    critical: false,
    passCondition: { allowedValues: ['clean_tight', 'minor_corrosion'] },
    failureMessage: 'Battery terminals heavily corroded or loose',
    options: [
      { value: 'clean_tight', label: 'Clean & Tight (Excellent)' },
      { value: 'minor_corrosion', label: 'Minor Corrosion (Acceptable)' },
      { value: 'heavy_corrosion', label: 'Heavy Corrosion (Needs Cleaning)' },
      { value: 'loose', label: 'Loose Terminals (CRITICAL)' }
    ]
  },

  // ==================== LIGHTS & SIGNALS ====================
  {
    id: 'headlights',
    name: 'Headlights (High/Low Beam)',
    category: 'Lights & Signals',
    type: 'checkbox',
    critical: true,
    passCondition: { required: true },
    failureMessage: 'Headlights not working - unsafe for operation'
  },
  {
    id: 'brake_lights',
    name: 'Brake Lights',
    category: 'Lights & Signals',
    type: 'checkbox',
    critical: true,
    passCondition: { required: true },
    failureMessage: 'Brake lights not working - CRITICAL SAFETY ISSUE'
  },
  {
    id: 'turn_signals',
    name: 'Turn Signals (All 4)',
    category: 'Lights & Signals',
    type: 'checkbox',
    critical: false,
    passCondition: { required: true },
    failureMessage: 'Turn signals not working'
  },
  {
    id: 'emergency_lights',
    name: 'Emergency Lights',
    category: 'Lights & Signals',
    type: 'checkbox',
    critical: true,
    passCondition: { required: true },
    failureMessage: 'Emergency lights not working - vehicle cannot respond to emergencies'
  },

  // ==================== AUDIO SYSTEMS ====================
  {
    id: 'horn',
    name: 'Horn',
    category: 'Audio Systems',
    type: 'checkbox',
    critical: false,
    passCondition: { required: true },
    failureMessage: 'Horn not working'
  },
  {
    id: 'siren',
    name: 'Siren (All Tones)',
    category: 'Audio Systems',
    type: 'checkbox',
    critical: true,
    passCondition: { required: true },
    failureMessage: 'Siren not working - cannot respond to emergencies'
  },

  // ==================== BRAKES ====================
  {
    id: 'brake_pedal',
    name: 'Brake Pedal Firmness',
    category: 'Brakes',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['firm'] },
    failureMessage: 'Brake pedal spongy/soft - brake system issue',
    options: [
      { value: 'firm', label: 'Firm (Good)' },
      { value: 'slightly_soft', label: 'Slightly Soft (Warning)' },
      { value: 'spongy', label: 'Spongy (CRITICAL)' },
      { value: 'goes_to_floor', label: 'Goes to Floor (CRITICAL)' }
    ]
  },
  {
    id: 'brake_performance',
    name: 'Brake Performance',
    category: 'Brakes',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['smooth_stop', 'no_issues'] },
    failureMessage: 'Brake performance issue detected',
    options: [
      { value: 'smooth_stop', label: 'Smooth Stop (Excellent)' },
      { value: 'no_issues', label: 'No Issues (Good)' },
      { value: 'pulls_to_side', label: 'Pulls to One Side (CRITICAL)' },
      { value: 'grinding_noise', label: 'Grinding Noise (CRITICAL)' },
      { value: 'delayed_stop', label: 'Delayed Stop (CRITICAL)' }
    ]
  },
  {
    id: 'parking_brake',
    name: 'Parking Brake',
    category: 'Brakes',
    type: 'checkbox',
    critical: true,
    passCondition: { required: true },
    failureMessage: 'Parking brake doesn\'t hold - adjustment required'
  },

  // ==================== VISIBILITY ====================
  {
    id: 'windscreen_condition',
    name: 'Windscreen Condition',
    category: 'Visibility',
    type: 'dropdown',
    critical: true,
    passCondition: { allowedValues: ['no_damage', 'minor_chips_outside_view'] },
    failureMessage: 'Windscreen damaged in driver\'s vision area',
    options: [
      { value: 'no_damage', label: 'No Damage (Excellent)' },
      { value: 'minor_chips_outside_view', label: 'Minor Chips Outside View (Acceptable)' },
      { value: 'crack_in_view', label: 'Crack in Driver View (CRITICAL)' },
      { value: 'major_damage', label: 'Major Damage (CRITICAL)' }
    ]
  },
  {
    id: 'wipers',
    name: 'Windscreen Wipers',
    category: 'Visibility',
    type: 'checkbox',
    critical: false,
    passCondition: { required: true },
    failureMessage: 'Wipers not working properly'
  },
  {
    id: 'washer_fluid',
    name: 'Washer Fluid Level',
    category: 'Visibility',
    type: 'percentage',
    critical: false,
    passCondition: { min: 50 },
    failureMessage: 'Washer fluid low - refill recommended',
    unit: '%'
  }
];

/**
 * Validates a single check item value against its pass conditions
 */
export const validateCheckItem = (item: CheckItemConfig, value: any): { pass: boolean; message: string } => {
  const { type, passCondition } = item;

  switch (type) {
    case 'numeric':
    case 'percentage':
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { pass: false, message: 'Invalid numeric value' };
      }
      if (passCondition.min !== undefined && numValue < passCondition.min) {
        return { pass: false, message: item.failureMessage };
      }
      if (passCondition.max !== undefined && numValue > passCondition.max) {
        return { pass: false, message: item.failureMessage };
      }
      return { pass: true, message: 'OK' };

    case 'dropdown':
      if (!passCondition.allowedValues?.includes(value)) {
        return { pass: false, message: item.failureMessage };
      }
      return { pass: true, message: 'OK' };

    case 'checkbox':
      if (passCondition.required && !value) {
        return { pass: false, message: item.failureMessage };
      }
      return { pass: true, message: 'OK' };

    default:
      return { pass: false, message: 'Unknown check type' };
  }
};

/**
 * Groups check items by category
 */
export const getCheckItemsByCategory = () => {
  const categories: Record<string, CheckItemConfig[]> = {};
  
  CHECK_ITEMS.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  
  return categories;
};
