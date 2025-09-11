
import { doc, setDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';

async function restoreAdmin() {
  const adminId = '4xM4XWqy3qX4z9IQYxyHSXX7WaK2';
  const adminRef = doc(db, 'users', adminId);

  try {
    await setDoc(adminRef, {
      email: 'admin@example.com', // Placeholder email, please update in the UI later
      name: 'Administrador',
      role: 'admin',
      // Add other default fields that might be necessary
      personalPrompt: '',
      photoURL: ''
    });
    console.log(`User ${adminId} restored successfully.`);
  } catch (error) {
    console.error(`Failed to restore admin user:`, error);
  }
}

restoreAdmin();
