import { UnclutrClient } from './generated';
import { auth } from '../firebase';

// Create a configured instance of the auto-generated client
export const client = new UnclutrClient({
    BASE: '',
    TOKEN: async () => {
        const user = auth.currentUser;
        return user ? await user.getIdToken() : '';
    },
    HEADERS: async () => {
        // Read company ID from localStorage independently of React state
        const companyId = typeof window !== 'undefined' ? localStorage.getItem('unclutr_company_id') : null;
        return companyId ? { 'X-Company-ID': companyId } : {};
    }
});
