export const workspaceSections = [
  { id: 'intro', label: 'Intro', file: 'README.md' },
  { id: 'projects', label: 'Projects', file: 'projects/' },
  { id: 'focus', label: 'Focus', file: 'focus/' },
  { id: 'experience', label: 'Experience', file: 'experience/' },
  { id: 'writing', label: 'Writing', file: 'writing/' },
  { id: 'about', label: 'About', file: 'about/' },
  { id: 'contact', label: 'Contact', file: 'contact/' },
] as const

export type WorkspaceSection = (typeof workspaceSections)[number]['id']

export function sectionHref(section: WorkspaceSection, home: boolean) {
  return `${home ? '' : '/'}#${section}`
}
