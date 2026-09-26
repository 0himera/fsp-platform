export interface SlideAction {
  label: string;
  href: string;
}

export interface SlidePoint {
  title: string;
  desc: string;
}

export interface SlideItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  highlights: string[];
  points: SlidePoint[];
  actions?: SlideAction[];
}
