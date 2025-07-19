
import { AuthService } from './server/auth.js';
import { storage } from './server/storage.js';

async function createDefaultAdmin() {
  try {
    console.log('Creating default admin user...');
    
    const adminData = {
      username: 'admin',
      email: 'admin@millatumidi.uz',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'super_admin',
      isActive: true,
    };

    // Check if admin already exists
    const existingAdmin = await storage.getAdminByUsername(adminData.username);
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }

    const admin = await AuthService.createAdmin(adminData);
    console.log('Admin user created successfully:');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('');
    console.log('Login credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createDefaultAdmin().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});

