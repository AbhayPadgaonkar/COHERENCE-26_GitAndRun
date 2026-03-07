import formData from "@/app/auth/options.json";

export type GeographyState = {
  state_code: string;
  state_name: string;
  districts: { district_code: string; district_name: string }[];
};

export type Department = { id: string; name: string };
export type Role = { id: string; name: string; requires_location: string | false };

export const options = formData as {
  departments: Department[];
  geography: GeographyState[];
  roles: Role[];
};

export default options;
