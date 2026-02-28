import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { invitationsApi, getErrorMessage } from '../api';
import { Alert } from '../components/ui/alert';

interface InvitationInfo {
  email: string;
  role: string;
  status: string;
  orgName: string;
  projectName: string | null;
  expiresAt: string;
  isExistingUser: boolean;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  useEffect(() => {
    if (!token) return;
    invitationsApi.getByToken(token)
      .then((data) => {
        if (data.message) {
          setError(data.message);
        } else {
          setInvitation(data);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setAcceptError('');
    setSubmitting(true);
    try {
      const body: any = {};
      if (!invitation?.isExistingUser) {
        body.name = name;
        body.password = password;
      }
      await invitationsApi.accept(token, body);
      setAccepted(true);
    } catch (err: unknown) {
      setAcceptError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-text-muted">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="bg-bg-surface border border-border-default rounded-xl p-10 w-[400px] text-center">
          <h1 className="text-[22px] mb-2 text-accent font-bold">PIONTS</h1>
          <Alert className="mb-4">{error}</Alert>
          <Link to="/" className="text-accent text-sm font-semibold">Go to login</Link>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  const isInvalid = invitation.status !== 'pending';

  if (isInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="bg-bg-surface border border-border-default rounded-xl p-10 w-[400px] text-center">
          <h1 className="text-[22px] mb-2 text-accent font-bold">PIONTS</h1>
          <Alert className="mb-4">
            This invitation has been {invitation.status}. Please ask for a new invitation.
          </Alert>
          <Link to="/" className="text-accent text-sm font-semibold">Go to login</Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="bg-bg-surface border border-border-default rounded-xl p-10 w-[400px] text-center">
          <h1 className="text-[22px] mb-2 text-accent font-bold">PIONTS</h1>
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-text-primary text-[15px] font-semibold mb-2">You're in!</p>
          <p className="text-text-muted text-sm mb-6">
            You've joined <strong>{invitation.orgName}</strong>
            {invitation.projectName && <> on project <strong>{invitation.projectName}</strong></>}.
          </p>
          <Link
            to="/"
            className="inline-block bg-[#ededed] text-[#0a0a0a] border-none px-6 py-2.5 rounded-md text-sm font-semibold no-underline transition-colors duration-200 hover:bg-white"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page">
      <form
        className="bg-bg-surface border border-border-default rounded-xl p-10 w-[400px] text-center [&_input]:w-full [&_input]:bg-bg-surface-raised [&_input]:border [&_input]:border-border-default [&_input]:text-text-primary [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:rounded-md [&_input]:text-sm [&_input]:mb-4 [&_input]:box-border [&_input]:outline-none [&_input]:font-sans [&_input]:focus:border-border-focus [&_input]:placeholder:text-text-faint"
        onSubmit={handleAccept}
      >
        <h1 className="text-[22px] mb-2 text-accent font-bold">PIONTS</h1>
        <p className="text-text-muted text-sm mb-1">You've been invited to join</p>
        <p className="text-text-primary text-[16px] font-bold mb-1">
          {invitation.orgName}
        </p>
        {invitation.projectName && (
          <p className="text-text-muted text-sm mb-1">
            Project: <strong className="text-text-primary">{invitation.projectName}</strong>
          </p>
        )}
        <p className="text-text-muted text-sm mb-6">
          as <span className="capitalize font-semibold text-accent">{invitation.role}</span>
        </p>

        {acceptError && <Alert className="mb-4">{acceptError}</Alert>}

        <div className="text-left mb-2">
          <div className="text-[12px] text-text-muted mb-1">Email</div>
          <div className="bg-bg-surface-raised border border-border-default text-text-secondary px-3.5 py-2.5 rounded-md text-sm mb-4">
            {invitation.email}
          </div>
        </div>

        {!invitation.isExistingUser && (
          <>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#ededed] text-[#0a0a0a] border-none px-4 py-2.5 rounded-md cursor-pointer text-sm font-semibold font-sans transition-all duration-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? 'Accepting...'
            : invitation.isExistingUser
              ? 'Accept Invitation'
              : 'Create Account & Accept'}
        </button>

        <p className="mt-4 text-[12px] text-text-faint">
          Already have an account? <Link to="/" className="text-accent font-semibold">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
