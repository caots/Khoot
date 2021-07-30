export default interface ResultAssessment{
  id: number;
  assessment_id: number;
  player_id: number;
  point: number;
  updated_at?: string;
  created_at?: string;
  results: string;
}