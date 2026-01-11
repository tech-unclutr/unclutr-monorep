import { auth } from "@/lib/firebase";

export const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }
    return await user.getIdToken();
};
