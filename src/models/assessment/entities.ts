export default interface Assessment{
  id: number;
  title: string;
  time: number;
  is_deleted: number;
  description?: string;
  number_of_question: number;
  status: number;
  user_id: number;
  join_key: string;
  updated_at?: string;
  created_at?: string;
  questions?: any;
}