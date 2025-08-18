import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  workdayAPI,
  salesAPI,
  timeslotAPI,
  organizationAPI,
} from "../utils/api";
import { toast } from "react-toastify";

// Query keys
export const queryKeys = {
  workdays: (params) => ["workdays", params],
  sales: (params) => ["sales", params],
  timeslots: (params) => ["timeslots", params],
  organization: ["organization"],
  organizationMembers: ["organization", "members"],
};

// Workday hooks
export const useWorkdays = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.workdays(params),
    queryFn: () => workdayAPI.getAll(params).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useCreateWorkday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workdayAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Workday created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to create workday");
    },
  });
};

export const useUpdateWorkday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }) => workdayAPI.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Workday updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to update workday");
    },
  });
};

export const useDeleteWorkday = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workdayAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Workday deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to delete workday");
    },
  });
};

// Sales hooks
export const useSales = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.sales(params),
    queryFn: () => salesAPI.getAll(params).then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salesAPI.create,
    onSuccess: () => {
      // Invalidate both sales and workdays queries
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Sale recorded successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to record sale");
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Sale deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to delete sale");
    },
  });
};

// Timeslot hooks
export const useTimeslots = (params = {}) => {
  return useQuery({
    queryKey: queryKeys.timeslots(params),
    queryFn: () => timeslotAPI.getAll(params).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useAssignTimeslot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userData }) => timeslotAPI.assign(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Successfully assigned to timeslot");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to assign timeslot");
    },
  });
};

export const useUnassignTimeslot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }) => timeslotAPI.unassign(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeslots"] });
      queryClient.invalidateQueries({ queryKey: ["workdays"] });
      toast.success("Successfully unassigned from timeslot");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to unassign timeslot");
    },
  });
};

// Organization hooks
export const useOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => organizationAPI.getDetails().then((res) => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useOrganizationMembers = () => {
  return useQuery({
    queryKey: queryKeys.organizationMembers,
    queryFn: () => organizationAPI.getMembers().then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useJoinOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationAPI.join,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Successfully joined organization");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to join organization");
    },
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Organization created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.msg || "Failed to create organization");
    },
  });
};
