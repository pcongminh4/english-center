export interface UpdateTeacherRequest {
  fullname?: string;
  email?: string;
  phone?: string;
  password?: string;
  degree?: string;
  isTeaching?: boolean | string;
  avatar?: string;
}
