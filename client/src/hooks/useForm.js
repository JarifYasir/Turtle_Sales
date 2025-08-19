import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Validation schemas
export const saleSchema = yup.object({
  name: yup
    .string()
    .required("Customer name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  number: yup
    .string()
    .required("Phone number is required")
    .matches(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"),
  address: yup
    .string()
    .required("Address is required")
    .min(5, "Please enter a complete address")
    .max(300, "Address cannot exceed 300 characters"),
  price: yup
    .number()
    .required("Price is required")
    .positive("Price must be positive")
    .max(999999.99, "Price cannot exceed $999,999.99"),
  details: yup
    .string()
    .required("Sale details are required")
    .max(500, "Details cannot exceed 500 characters"),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

export const organizationSchema = yup.object({
  name: yup
    .string()
    .required("Organization name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: yup
    .string()
    .max(500, "Description cannot exceed 500 characters"),
});

export const timeslotSchema = yup.object({
  date: yup
    .date()
    .required("Date is required")
    .min(new Date(), "Date cannot be in the past"),
  startTime: yup
    .string()
    .required("Start time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: yup
    .string()
    .required("End time is required")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")
    .test("is-after", "End time must be after start time", function (value) {
      const { startTime } = this.parent;
      if (!startTime || !value) return true;

      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${value}`);

      return end > start;
    }),
  maxEmployees: yup
    .number()
    .required("Maximum employees is required")
    .min(1, "Must allow at least 1 employee")
    .max(10, "Cannot exceed 10 employees"),
});

// Custom hooks for forms
export const useSaleForm = (defaultValues = {}, onSubmit) => {
  const form = useForm({
    resolver: yupResolver(saleSchema),
    defaultValues: {
      name: "",
      number: "",
      address: "",
      price: "",
      details: "",
      ...defaultValues,
    },
    mode: "onBlur",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  });

  return {
    ...form,
    handleSubmit,
  };
};

export const useLoginForm = (onSubmit) => {
  const form = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Login error:", error);
    }
  });

  return {
    ...form,
    handleSubmit,
  };
};

export const useRegisterForm = (onSubmit) => {
  const form = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const { confirmPassword, ...submitData } = data;
      await onSubmit(submitData);
    } catch (error) {
      console.error("Registration error:", error);
    }
  });

  return {
    ...form,
    handleSubmit,
  };
};

export const useOrganizationForm = (defaultValues = {}, onSubmit) => {
  const form = useForm({
    resolver: yupResolver(organizationSchema),
    defaultValues: {
      name: "",
      description: "",
      ...defaultValues,
    },
    mode: "onBlur",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      if (!defaultValues.name) {
        form.reset();
      }
    } catch (error) {
      console.error("Organization form error:", error);
    }
  });

  return {
    ...form,
    handleSubmit,
  };
};

export const useTimeslotForm = (defaultValues = {}, onSubmit) => {
  const form = useForm({
    resolver: yupResolver(timeslotSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      maxEmployees: 2,
      ...defaultValues,
    },
    mode: "onBlur",
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      if (!defaultValues.date) {
        form.reset();
      }
    } catch (error) {
      console.error("Timeslot form error:", error);
    }
  });

  return {
    ...form,
    handleSubmit,
  };
};
