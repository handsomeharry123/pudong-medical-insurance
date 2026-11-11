import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  parents: { title: string; to: string }[];
  title: string;
  meta?: ReactNode;
};

/** All profile levels share a consistent breadcrumb row and title row. */
export default function ProfilePageHeader({ parents, title, meta }: Props) {
  return <header className="profile-page-header">
    <nav aria-label="页面层级" className="profile-page-path">
      <ol>
        {parents.map(parent => <li key={parent.to}><Link to={parent.to} title={parent.title}>{parent.title}</Link><span aria-hidden="true" className="profile-path-separator">›</span></li>)}
        <li aria-current="page" className="profile-page-current"><span title={title}>{title}</span></li>
      </ol>
    </nav>
    <div className="profile-page-title-row">
      <h1 title={title}>{title}</h1>
      {meta && <div className="profile-page-meta">{meta}</div>}
    </div>
  </header>;
}
