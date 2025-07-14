#!/usr/bin/env node

/**
 * Test script to debug position inheritance
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function testInheritance() {
  console.log('🔍 Testing position inheritance logic...\n');
  
  const departmentId = '737b7fa9-d703-4bc2-a18e-51403a598ffc';
  
  // Get department with company
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { company: true }
  });
  
  console.log('📊 Department data:', {
    id: department?.id,
    name: department?.name,
    companyId: department?.companyId
  });
  
  console.log('🏢 Company data:', {
    id: department?.company?.id,
    name: department?.company?.name,
    city: department?.company?.city,
    country: department?.company?.country
  });
  
  // Test inheritance logic
  let positionData = {
    title: 'Test Position',
    description: 'Test description',
    salaryRange: '$50,000',
    employmentType: 'Full-time'
  };
  
  console.log('\n🔧 Original position data:', positionData);
  
  // Apply inheritance logic
  if (department?.company) {
    const company = department.company;
    
    // Inherit location if missing
    if (!positionData.location && (company.city || company.country)) {
      if (company.city && company.country) {
        positionData.location = `${company.city}, ${company.country}`;
      } else if (company.city) {
        positionData.location = company.city;
      } else if (company.country) {
        positionData.location = company.country;
      }
    }
    
    // Inherit city if missing
    if (!positionData.city && company.city) {
      positionData.city = company.city;
    }
    
    // Inherit country if missing
    if (!positionData.country && company.country) {
      positionData.country = company.country;
    }
  }
  
  console.log('✅ Position data after inheritance:', positionData);
  
  // Test creating a position with inheritance
  console.log('\n🚀 Creating position with inheritance...');
  
  const position = await prisma.position.create({
    data: {
      ...positionData,
      departments: {
        create: [{ department: { connect: { id: departmentId } } }]
      }
    }
  });
  
  console.log('📋 Created position:', {
    id: position.id,
    title: position.title,
    location: position.location,
    city: position.city,
    country: position.country
  });
  
  // Clean up - delete the test position
  await prisma.position.delete({ where: { id: position.id } });
  console.log('🗑️  Cleaned up test position');
}

async function main() {
  try {
    await testInheritance();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 