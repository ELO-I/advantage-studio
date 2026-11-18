import {
  ArrowRight,
  BookOpen,
  FileCheck2,
  Keyboard,
  ShieldCheck,
  Usb,
} from 'lucide-react';
import { Fragment } from 'react';
import { useI18n } from '../i18n/context';

export function HelpView({ onConnect }: { onConnect: () => void }) {
  const { t } = useI18n();
  const { edit, connect, apply, restore } = t.help;
  return (
    <>
      <div className="view-heading">
        <div>
          <h1>{t.help.title}</h1>
        </div>
        <BookOpen className="heading-icon" size={38} strokeWidth={1.2} />
      </div>
      <div className="guide-grid">
        <article className="guide-card">
          <Keyboard size={25} />
          <h2>{edit.title}</h2>
          <p>{edit.text}</p>
          <p>{edit.colors}</p>
        </article>
        <article className="guide-card">
          <Usb size={25} />
          <h2>{connect.title}</h2>
          <p>
            {connect.powerUser} <kbd>{connect.powerUserKeys}</kbd>
            {connect.openDrive} <kbd>Program + F1</kbd>.
          </p>
          <p>{connect.detected}</p>
          <button className="text-button" onClick={onConnect}>
            {connect.button} <ArrowRight size={15} />
          </button>
        </article>
        <article className="guide-card">
          <FileCheck2 size={25} />
          <h2>{apply.title}</h2>
          <p>{apply.text}</p>
          <p>
            {apply.reloadQwerty} <kbd>Program + F3</kbd>
            {apply.reloadDvorak} <kbd>Program + F4</kbd>
            {apply.reloadHotkey} <kbd>{apply.hotkeyKeys}</kbd>.
          </p>
        </article>
        <article className="guide-card">
          <ShieldCheck size={25} />
          <h2>{restore.title}</h2>
          <p>{restore.text}</p>
          <p>{restore.export}</p>
        </article>
      </div>
      <div className="help-notes">
        <h2>{t.help.notesTitle}</h2>
        <dl>
          {t.help.notes.map(([term, definition]) => (
            <Fragment key={term}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </>
  );
}
