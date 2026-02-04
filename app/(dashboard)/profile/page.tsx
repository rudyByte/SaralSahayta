import type { Metadata } from 'next';
import ProfileForm from '@/components/profile/profile-form';

export const metadata: Metadata = {
    title: 'My Profile | SaralSahayta',
    description: 'Manage your personal information and eligibility details',
};

export default function ProfilePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and set up your profile to discover relevant schemes.
                </p>
            </div>

            <div className="py-6">
                <ProfileForm />
            </div>
        </div>
    );
}
