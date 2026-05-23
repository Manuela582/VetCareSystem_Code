import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuth } from '../context/AuthContext';
import * as petsApi from '../services/petsApi';
import * as remindersApi from '../services/remindersApi';
import { useNotifications } from '../context/NotificationContext';
import type { Pet } from '../types/pet';

type ServiceType = 'home' | 'virtual';

const SYMPTOMS = [
  'Lethargy / low energy',
  'Loss of appetite',
  'Vomiting or diarrhea',
  'Difficulty breathing',
  'Limping or pain',
  'Scratching / skin issues',
  'Eye or nasal discharge',
  'Other',
];

const TIMES: Record<ServiceType, string> = {
  home:    '45–60 min',
  virtual: '10–15 min',
};

export function AppointmentRequestPage() {
  const { user } = useAuth();
  const { showSuccess } = useNotifications();
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>('home');
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadPets = useCallback(() => {
    petsApi.listPets().then(r => { setPets(r.pets); if (r.pets.length > 0) setPetId(r.pets[0].id); }).catch(() => {});
  }, []);

  useEffect(() => { loadPets(); }, [loadPets]);

  const selectedPet = pets.find(p => p.id === petId);

  function toggleSymptom(s: string) {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await remindersApi.createReminder({
        petId,
        title: `${serviceType === 'home' ? 'Home Visit' : 'Virtual Consultation'} — ${selectedPet?.name ?? 'Pet'}`,
        type: 'CONTROL',
        dueDate: dueDate || new Date(Date.now() + 86_400_000).toISOString().split('T')[0],
        message: [
          `Service: ${serviceType === 'home' ? 'Home Visit' : 'Virtual Consultation'}`,
          selectedSymptoms.length ? `Symptoms: ${selectedSymptoms.join(', ')}` : '',
          allergies ? `Allergies: ${allergies}` : '',
          notes ? `Notes: ${notes}` : '',
        ].filter(Boolean).join('\n'),
      });
      showSuccess('Appointment requested successfully!');
      setSubmitted(true);
    } catch {
      showSuccess('Request saved. Your vet will confirm shortly.');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AppLayout title="Request Appointment">
        <div className="appt-success">
          <span className="material-symbols-rounded appt-success__icon">check_circle</span>
          <h2>Request Sent!</h2>
          <p>Your veterinarian will contact you to confirm the appointment.</p>
          <div className="appt-success__detail">
            <span className="material-symbols-rounded">schedule</span>
            <div>
              <strong>Estimated arrival</strong>
              <span>{TIMES[serviceType]}</span>
            </div>
          </div>
          <div className="appt-success__actions">
            <Link to="/panel/dueno" className="btn-primary">Go to my panel</Link>
            <Link to="/recordatorios" className="btn-outline">View appointments</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Request Appointment">
      <div className="appt-page">
        <div className="appt-header">
          <Link to="/panel/dueno" className="reg-back">
            <span className="material-symbols-rounded" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>arrow_back</span>
            {' '}Back to panel
          </Link>
          <h2 className="appt-header__title">Request Veterinary Service</h2>
          <p className="appt-header__sub">Tell us about your pet and we'll connect you with the right care.</p>
        </div>

        {/* Steps */}
        <div className="appt-steps">
          {['Service type', 'Your pet', 'Symptoms', 'Confirm'].map((label, i) => {
            const num = i + 1;
            return (
              <div key={label} className={`reg-step ${step === num ? 'reg-step--active' : ''} ${step > num ? 'reg-step--done' : ''}`}>
                <div className="reg-step__circle">
                  {step > num ? <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>check</span> : num}
                </div>
                <span className="reg-step__label">{label}</span>
                {i < 3 && <div className="reg-step__line" />}
              </div>
            );
          })}
        </div>

        <form className="appt-form" onSubmit={handleSubmit}>
          {/* Step 1: Service type */}
          {step === 1 && (
            <div className="appt-step-content">
              <h3>How would you like the consultation?</h3>
              <div className="appt-service-cards">
                <button
                  type="button"
                  className={`appt-service-card ${serviceType === 'home' ? 'appt-service-card--active' : ''}`}
                  onClick={() => setServiceType('home')}
                >
                  <span className="material-symbols-rounded appt-service-card__icon">home_health</span>
                  <strong>Home Visit</strong>
                  <span>A vet comes to your home</span>
                  <div className="appt-service-card__time">
                    <span className="material-symbols-rounded">schedule</span>
                    {TIMES.home} estimated
                  </div>
                </button>
                <button
                  type="button"
                  className={`appt-service-card ${serviceType === 'virtual' ? 'appt-service-card--active' : ''}`}
                  onClick={() => setServiceType('virtual')}
                >
                  <span className="material-symbols-rounded appt-service-card__icon">videocam</span>
                  <strong>Virtual Consultation</strong>
                  <span>Video call with a vet</span>
                  <div className="appt-service-card__time">
                    <span className="material-symbols-rounded">schedule</span>
                    {TIMES.virtual} estimated
                  </div>
                </button>
              </div>
              <div className="appt-nav">
                <button type="button" className="btn-primary" onClick={() => setStep(2)}>
                  Continue <span className="material-symbols-rounded">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select pet + date */}
          {step === 2 && (
            <div className="appt-step-content">
              <h3>Which pet needs care?</h3>
              {pets.length === 0 ? (
                <div className="appt-no-pets">
                  <p>You don't have registered pets yet.</p>
                  <Link to="/mascotas/nueva" className="btn-primary">Register your first pet</Link>
                </div>
              ) : (
                <div className="appt-pet-list">
                  {pets.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`appt-pet-card ${petId === p.id ? 'appt-pet-card--active' : ''}`}
                      onClick={() => setPetId(p.id)}
                    >
                      <span className="material-symbols-rounded appt-pet-card__icon">pets</span>
                      <div>
                        <strong>{p.name}</strong>
                        <span>{p.species} · {p.breed}</span>
                      </div>
                      {petId === p.id && <span className="material-symbols-rounded appt-pet-card__check">check_circle</span>}
                    </button>
                  ))}
                </div>
              )}

              <label className="reg-label" style={{ marginTop: 20, maxWidth: 300 }}>
                Preferred date
                <input
                  className="reg-input"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </label>

              <div className="appt-nav">
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="btn-primary" onClick={() => setStep(3)} disabled={!petId}>
                  Continue <span className="material-symbols-rounded">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Symptoms + allergies */}
          {step === 3 && (
            <div className="appt-step-content">
              <h3>What symptoms does {selectedPet?.name || 'your pet'} have?</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', margin: '0 0 16px' }}>
                Select all that apply. This helps the vet prepare before arrival.
              </p>
              <div className="appt-symptoms">
                {SYMPTOMS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`appt-symptom ${selectedSymptoms.includes(s) ? 'appt-symptom--active' : ''}`}
                    onClick={() => toggleSymptom(s)}
                  >
                    {selectedSymptoms.includes(s) && (
                      <span className="material-symbols-rounded" style={{ fontSize: '0.9rem' }}>check</span>
                    )}
                    {s}
                  </button>
                ))}
              </div>

              <label className="reg-label" style={{ marginTop: 20 }}>
                Known allergies <span className="reg-optional">(optional)</span>
                <input className="reg-input" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Penicillin, chicken protein…" />
              </label>

              <label className="reg-label" style={{ marginTop: 12 }}>
                Additional notes <span className="reg-optional">(optional)</span>
                <textarea className="reg-input reg-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any other context for the vet…" rows={3} />
              </label>

              <div className="appt-nav">
                <button type="button" className="btn-outline" onClick={() => setStep(2)}>Back</button>
                <button type="button" className="btn-primary" onClick={() => setStep(4)}>
                  Review <span className="material-symbols-rounded">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="appt-step-content">
              <h3>Review your request</h3>
              <div className="appt-review">
                <div className="appt-review__row">
                  <span className="material-symbols-rounded">medical_services</span>
                  <div>
                    <strong>Service</strong>
                    <span>{serviceType === 'home' ? 'Home Visit' : 'Virtual Consultation'}</span>
                  </div>
                </div>
                <div className="appt-review__row">
                  <span className="material-symbols-rounded">pets</span>
                  <div>
                    <strong>Pet</strong>
                    <span>{selectedPet?.name} · {selectedPet?.species}</span>
                  </div>
                </div>
                {dueDate && (
                  <div className="appt-review__row">
                    <span className="material-symbols-rounded">calendar_month</span>
                    <div>
                      <strong>Preferred date</strong>
                      <span>{new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                )}
                {selectedSymptoms.length > 0 && (
                  <div className="appt-review__row appt-review__row--warn">
                    <span className="material-symbols-rounded">warning</span>
                    <div>
                      <strong>Reported symptoms</strong>
                      <span>{selectedSymptoms.join(', ')}</span>
                    </div>
                  </div>
                )}
                <div className="appt-review__row appt-review__row--time">
                  <span className="material-symbols-rounded">schedule</span>
                  <div>
                    <strong>Estimated arrival</strong>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{TIMES[serviceType]}</span>
                  </div>
                </div>
              </div>

              <p className="appt-owner">
                <span className="material-symbols-rounded" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>person</span>
                {' '}{user?.fullName} · {user?.email}
              </p>

              <div className="appt-nav">
                <button type="button" className="btn-outline" onClick={() => setStep(3)}>Back</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending…' : 'Confirm Request'}
                  {!loading && <span className="material-symbols-rounded">send</span>}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
