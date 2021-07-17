export default interface Question{
  id: number;
  title: string;
  type: number;
  answers: string;
  full_answers?: string;
  point: number;
  updated_at?: string;
  created_at?: string;
  image?: string;
  assessment_id: number;
}