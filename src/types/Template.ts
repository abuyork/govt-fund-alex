export interface Template {
  id: string;
  name: string;
  title: string;
  subtitle: string[];
  type: string;
  is_free: boolean; // This should always be false now, as all templates require payment
  color: string;
  sections: string[];
  prompt: string;
  template_id: string;
  created_at: string;
  updated_at: string;
}

// Types of templates
export type TemplateType = '기본 양식' | '특화 양식'; 