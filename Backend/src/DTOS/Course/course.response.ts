export interface CourseResponse {
  id: number;
  type: string;
  name: string;
  courseSkill: string;
  status: string;
  price: number;
  sale: number;
  thumbnail: string | null;
  totalSession: number;
  minBand: number | null;
  maxBand: number | null;
  createdAt: Date;
  updatedAt: Date;
}
