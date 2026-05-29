export interface PredefinedDevice {
  id: string;
  name: string;
  wattage: number;
}

export interface DeviceCategory {
  category: string;
  devices: PredefinedDevice[];
}

export const COMMON_DEVICES: DeviceCategory[] = [
  {
    category: "Household Appliances",
    devices: [
      { id: "led-bulb", name: "LED Light Bulb", wattage: 9 },
      { id: "cfl-bulb", name: "CFL Light Bulb", wattage: 15 },
      { id: "tube-light", name: "Fluorescent Tube Light", wattage: 40 },
      { id: "ceiling-fan", name: "Ceiling Fan", wattage: 75 },
      { id: "standing-fan", name: "Standing/Table Fan", wattage: 55 },
      { id: "smart-tv", name: "Smart TV (LED)", wattage: 100 },
      { id: "sound-system", name: "Sound System / Home Theater", wattage: 80 },
      { id: "refrigerator-inverter", name: "Refrigerator (Inverter)", wattage: 120 },
      { id: "refrigerator-standard", name: "Refrigerator (Standard)", wattage: 200 },
      { id: "microwave", name: "Microwave Oven", wattage: 1200 },
      { id: "ac-1hp-inverter", name: "Air Conditioner (1 HP, Inverter)", wattage: 800 },
      { id: "ac-1hp-standard", name: "Air Conditioner (1 HP, Standard)", wattage: 1000 },
      { id: "washing-machine", name: "Washing Machine", wattage: 500 },
      { id: "electric-kettle", name: "Electric Kettle", wattage: 1500 },
      { id: "rice-cooker", name: "Rice Cooker", wattage: 600 },
      { id: "blender", name: "Blender / Mixer", wattage: 350 },
      { id: "iron", name: "Electric Iron", wattage: 1000 },
      { id: "water-pump", name: "Water Pump (1 HP)", wattage: 750 },
      { id: "phone-charger", name: "Phone Charger", wattage: 15 },
      { id: "game-console", name: "Video Game Console", wattage: 150 }
    ]
  },
  {
    category: "Office Equipment",
    devices: [
      { id: "laptop", name: "Laptop Computer", wattage: 65 },
      { id: "desktop-pc", name: "Desktop Computer & Monitor", wattage: 150 },
      { id: "wifi-router", name: "Wi-Fi Router / Modem", wattage: 12 },
      { id: "laser-printer", name: "Laser Printer", wattage: 400 },
      { id: "photocopier", name: "Photocopy Machine", wattage: 800 },
      { id: "projector", name: "Office Projector", wattage: 250 },
      { id: "water-dispenser", name: "Water Dispenser (Hot/Cold)", wattage: 500 }
    ]
  },
  {
    category: "Hospital Equipment",
    devices: [
      { id: "infusion-pump", name: "Infusion / Syringe Pump", wattage: 25 },
      { id: "patient-monitor", name: "Patient Monitor (Vital Signs)", wattage: 80 },
      { id: "ventilator", name: "Mechanical Ventilator", wattage: 150 },
      { id: "incubator", name: "Neonatal Incubator", wattage: 300 },
      { id: "surgical-light", name: "Surgical LED Ceiling Light", wattage: 120 },
      { id: "defibrillator", name: "Defibrillator (Standby)", wattage: 50 },
      { id: "suction-pump", name: "Medical Aspirator / Suction Pump", wattage: 200 },
      { id: "blood-fridge", name: "Blood Bank Refrigerator (Small)", wattage: 300 },
      { id: "xray-standby", name: "Mobile X-Ray Machine (Standby)", wattage: 100 },
      { id: "oxygen-concentrator", name: "Oxygen Concentrator", wattage: 400 },
      { id: "ecg-machine", name: "ECG Machine", wattage: 75 },
      { id: "ultrasound", name: "Ultrasound Machine", wattage: 300 },
      { id: "autoclave", name: "Autoclave / Sterilizer", wattage: 2000 },
      { id: "cpap", name: "CPAP Machine", wattage: 40 }
    ]
  }
];

export function findPredefinedDevice(id: string): PredefinedDevice | undefined {
  for (const cat of COMMON_DEVICES) {
    const dev = cat.devices.find(d => d.id === id);
    if (dev) return dev;
  }
  return undefined;
}
