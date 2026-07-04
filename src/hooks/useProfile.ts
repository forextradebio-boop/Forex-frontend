import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../services/profile';
import { UpdateProfilePayload } from '../types';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    refetchInterval: false, // Don't auto poll profile heavily
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => updateProfile(data),
    onSuccess: (data) => {
      // Instantly update cache with new profile data
      queryClient.setQueryData(['profile'], data);
    },
  });
};
