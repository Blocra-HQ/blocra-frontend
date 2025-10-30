interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  walletAddress: string;
  role: string;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
}

export class ProfileService {
  private static STORAGE_KEY = 'user_profile';

  static async updateProfile(profileData: Partial<Profile>): Promise<Profile> {
    try {
      // In a real app, this would be an API call
      const currentProfile = this.getProfile();
      const updatedProfile = {
        ...currentProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 500));

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  static getProfile(): Profile {
    const savedProfile = localStorage.getItem(this.STORAGE_KEY);
    return savedProfile ? JSON.parse(savedProfile) : {
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
      walletAddress: '',
      role: 'analyst',
      preferences: {
        theme: 'system',
        notifications: true,
        language: 'en'
      }
    };
  }

  static async saveBio(bio: string): Promise<void> {
    const currentProfile = this.getProfile();
    await this.updateProfile({ ...currentProfile, bio });
  }

  static async savePreferences(preferences: Partial<Profile['preferences']>): Promise<void> {
    const currentProfile = this.getProfile();
    await this.updateProfile({
      ...currentProfile,
      preferences: {
        ...currentProfile.preferences,
        ...preferences
      }
    });
  }
}