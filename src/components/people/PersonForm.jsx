import { useState } from 'react';
import styles from './PersonForm.module.css';

const EMPTY_PERSON = {
  name: '',
  context: '',       // who they are / how you know them
  linkedPlace: '',   // e.g. "bartender at Cure"
  instagram: '',
  phone: '',
  notes: '',
};

export default function PersonForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_PERSON, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('A name is required.'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const isEdit = !!initial.id;

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <div className={styles.headerText}>
            <span>👁️</span>
            <h2 className={styles.title}>{isEdit ? 'Edit Person' : 'Add to the Court'}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>

          <Sec label="Who They Are" glyph="✦">
            <Field label="Name *">
              <input className="form-input" value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Their name or nickname" autoFocus />
            </Field>
            <Field label="Context — who are they?">
              <input className="form-input" value={form.context}
                onChange={e => set('context', e.target.value)}
                placeholder="e.g. Drag performer, local friend, bartender…" />
            </Field>
            <Field label="Where to Find Them">
              <input className="form-input" value={form.linkedPlace}
                onChange={e => set('linkedPlace', e.target.value)}
                placeholder="e.g. Performs at Bourbon Heat on Fridays" />
            </Field>
          </Sec>

          <Sec label="How to Reach Them" glyph="☽">
            <div className={styles.row2}>
              <Field label="Instagram / Handle">
                <input className="form-input" value={form.instagram}
                  onChange={e => set('instagram', e.target.value)}
                  placeholder="@handle" />
              </Field>
              <Field label="Phone / Text">
                <input className="form-input" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="Phone number" />
              </Field>
            </div>
          </Sec>

          <Sec label="Notes" glyph="🕯️">
            <Field label="Notes">
              <textarea className="form-textarea" value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Anything worth remembering about them…"
                rows={3} />
            </Field>
          </Sec>

        </div>

        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.footer}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={saving}>
            {saving ? '✦ Saving…' : isEdit ? '✦ Save Changes' : '✦ Add to Court'}
          </button>
        </div>

      </div>
    </div>
  );
}

function Sec({ label, glyph, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.secHeader}>
        <span className={styles.secGlyph}>{glyph}</span>
        <span className={styles.secLabel}>{label}</span>
        <span className={styles.secLine} />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
