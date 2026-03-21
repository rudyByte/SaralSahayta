import { LucideIcon } from 'lucide-react';
import { 
    GraduationCap, 
    School, 
    Baby, 
    Heart, 
    Briefcase, 
    AlertCircle, 
    Store, 
    Home, 
    UserPlus, 
    Activity, 
    Users,
    TrendingDown,
    Calendar,
    Award
} from 'lucide-react';

export type LifeEventCategory = 
  | 'EDUCATION'
  | 'EMPLOYMENT'
  | 'FAMILY'
  | 'ECONOMIC'
  | 'HOUSING'
  | 'HEALTH'
  | 'SENIOR_CITIZEN';

export type LifeEventType = 
  // Education
  | 'TENTH_PASS'
  | 'TWELFTH_PASS'
  | 'COLLEGE_ADMISSION'
  | 'GRADUATION'
  | 'POST_GRADUATION'
  // Employment
  | 'FIRST_JOB'
  | 'JOB_LOSS'
  | 'UNEMPLOYED'
  | 'SKILL_UPGRADE'
  | 'RETIREMENT'
  // Family
  | 'MARRIAGE'
  | 'CHILDBIRTH'
  | 'WIDOWHOOD'
  | 'DIVORCE'
  // Economic
  | 'STARTING_BUSINESS'
  | 'FARMING_INITIATED'
  | 'LOW_INCOME'
  | 'CROP_LOSS'
  // Housing
  | 'BUYING_HOUSE'
  | 'BUILDING_HOUSE'
  | 'HOMELESS'
  // Health
  | 'DISABILITY'
  | 'SERIOUS_ILLNESS'
  // Senior
  | 'TURNED_60'
  | 'TURNED_70';

export interface LifeEvent {
  id: string;
  user_id: string;
  event_type: LifeEventType;
  event_category: LifeEventCategory;
  event_date: string;
  event_details?: any;
  is_verified: boolean;
  created_at: string;
  scheme_count?: number;
}

export interface LifeEventConfig {
  icon: LucideIcon;
  color: string;
  label: string;
  description: string;
}

export const LIFE_EVENT_CONFIGS: Record<LifeEventType, LifeEventConfig> = {
  // Education
  TENTH_PASS: { icon: Award, color: 'blue', label: '10th Pass', description: 'Completed Matriculation' },
  TWELFTH_PASS: { icon: Award, color: 'blue', label: '12th Pass', description: 'Completed Intermediate' },
  COLLEGE_ADMISSION: { icon: School, color: 'indigo', label: 'College Admission', description: 'Started Higher Education' },
  GRADUATION: { icon: GraduationCap, color: 'indigo', label: 'Graduation', description: 'Completed Degree' },
  POST_GRADUATION: { icon: GraduationCap, color: 'violet', label: 'Post Graduation', description: 'Masters/PhD' },
  
  // Employment
  FIRST_JOB: { icon: Briefcase, color: 'green', label: 'First Job', description: 'Started Career' },
  JOB_LOSS: { icon: TrendingDown, color: 'orange', label: 'Job Loss', description: 'Recently Unemployed' },
  UNEMPLOYED: { icon: AlertCircle, color: 'slate', label: 'Unemployed', description: 'Looking for Work' },
  SKILL_UPGRADE: { icon: Activity, color: 'emerald', label: 'Skill Upgrade', description: 'Vocational Training' },
  RETIREMENT: { icon: Calendar, color: 'amber', label: 'Retirement', description: 'End of Career' },
  
  // Family
  MARRIAGE: { icon: Heart, color: 'rose', label: 'Marriage', description: 'Started Family Life' },
  CHILDBIRTH: { icon: Baby, color: 'pink', label: 'Childbirth', description: 'New Family Member' },
  WIDOWHOOD: { icon: Users, color: 'slate', label: 'Widowhood', description: 'Loss of Spouse' },
  DIVORCE: { icon: Users, color: 'slate', label: 'Divorce', description: 'Legal Separation' },
  
  // Economic
  STARTING_BUSINESS: { icon: Store, color: 'cyan', label: 'Starting Business', description: 'New Entrepreneurship' },
  FARMING_INITIATED: { icon: Activity, color: 'green', label: 'Farming Initiated', description: 'Started Agricultural Activity' },
  LOW_INCOME: { icon: TrendingDown, color: 'orange', label: 'Low Income', description: 'Financial Struggles' },
  CROP_LOSS: { icon: AlertCircle, color: 'red', label: 'Crop Loss', description: 'Agricultural Failure' },
  
  // Housing
  BUYING_HOUSE: { icon: Home, color: 'amber', label: 'Buying House', description: 'New Property Purchase' },
  BUILDING_HOUSE: { icon: Home, color: 'amber', label: 'Building House', description: 'Constructing Home' },
  HOMELESS: { icon: AlertCircle, color: 'red', label: 'Homeless', description: 'In Need of Shelter' },
  
  // Health
  DISABILITY: { icon: Activity, color: 'purple', label: 'Disability', description: 'Physical/Mental Challenge' },
  SERIOUS_ILLNESS: { icon: Activity, color: 'red', label: 'Serious Illness', description: 'Medical Emergency' },
  
  // Senior
  TURNED_60: { icon: UserPlus, color: 'amber', label: 'Turned 60', description: 'Senior Citizen Status' },
  TURNED_70: { icon: UserPlus, color: 'amber', label: 'Turned 70', description: 'Super Senior Status' },
};

export const CATEGORY_LABELS: Record<LifeEventCategory, string> = {
  EDUCATION: 'Education',
  EMPLOYMENT: 'Career & Work',
  FAMILY: 'Family & Marriage',
  ECONOMIC: 'Business & Finance',
  HOUSING: 'Housing & Home',
  HEALTH: 'Health & Wellbeing',
  SENIOR_CITIZEN: 'Senior Citizen',
};

export const CATEGORY_EVENTS: Record<LifeEventCategory, LifeEventType[]> = {
    EDUCATION: ['TENTH_PASS', 'TWELFTH_PASS', 'COLLEGE_ADMISSION', 'GRADUATION', 'POST_GRADUATION'],
    EMPLOYMENT: ['FIRST_JOB', 'JOB_LOSS', 'UNEMPLOYED', 'SKILL_UPGRADE', 'RETIREMENT'],
    FAMILY: ['MARRIAGE', 'CHILDBIRTH', 'WIDOWHOOD', 'DIVORCE'],
    ECONOMIC: ['STARTING_BUSINESS', 'FARMING_INITIATED', 'LOW_INCOME', 'CROP_LOSS'],
    HOUSING: ['BUYING_HOUSE', 'BUILDING_HOUSE', 'HOMELESS'],
    HEALTH: ['DISABILITY', 'SERIOUS_ILLNESS'],
    SENIOR_CITIZEN: ['TURNED_60', 'TURNED_70'],
};
