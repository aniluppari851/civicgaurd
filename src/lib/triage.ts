export const triageComplaint = (description: string) => {
  const desc = description.toLowerCase();
  
  let category = 'Others';
  let priority = 'MEDIUM';

  // Category Detection
  if (desc.includes('garbage') || desc.includes('waste') || desc.includes('smell') || desc.includes('dump')) {
    category = 'Sanitation';
  } else if (desc.includes('road') || desc.includes('pothole') || desc.includes('bridge') || desc.includes('infrastructure')) {
    category = 'Roads & Infrastructure';
  } else if (desc.includes('water') || desc.includes('pipe') || desc.includes('leak') || desc.includes('sewage')) {
    category = 'Water Supply';
  } else if (desc.includes('light') || desc.includes('electricity') || desc.includes('power') || desc.includes('transformer')) {
    category = 'Electricity';
  } else if (desc.includes('safety') || desc.includes('crime') || desc.includes('police') || desc.includes('threat')) {
    category = 'Public Safety';
  }

  // Priority Detection
  const urgentKeywords = ['urgent', 'danger', 'accident', 'emergency', 'life', 'immediate', 'risk', 'child', 'blood'];
  const highKeywords = ['broken', 'heavy', 'serious', 'blocked', 'stuck', 'main', 'major'];

  if (urgentKeywords.some(kw => desc.includes(kw))) {
    priority = 'URGENT';
  } else if (highKeywords.some(kw => desc.includes(kw))) {
    priority = 'HIGH';
  }

  return { category, priority };
};
