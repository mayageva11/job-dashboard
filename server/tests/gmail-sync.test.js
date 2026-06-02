process.env.TEST_DB_PATH  = ':memory:';
process.env.APPLY_NAME    = 'Maya Test';
process.env.APPLY_EMAIL   = 'test@example.com';
process.env.APPLY_PHONE   = '+972500000000';
process.env.APPLY_LINKEDIN= 'https://linkedin.com/in/test';

const { detectStatus, normalizeCompany, syncEmails } = require('../gmail-sync');
const db = require('../db');

describe('detectStatus', () => {
  test.each([
    ['We are moving forward with other candidates', 'Hi Maya', 'rejected'],
    ['Unfortunately we will not be moving forward', '', 'rejected'],
    ['Thank you for your interest, position has been filled', '', 'rejected'],
    ['We decided not to proceed with your application', '', 'rejected'],
    ['We would like to invite you for an interview', '', 'interview'],
    ['Next steps — schedule a phone screen', '', 'interview'],
    ['Technical interview invitation', '', 'interview'],
    ['Home assignment for QA role', '', 'interview'],
    ['Job Offer — QA Automation Engineer', '', 'accepted'],
    ['Congratulations! We are pleased to offer you', '', 'accepted'],
    ['Your application has been received', '', null],
    ['Weekly newsletter from JobBoard', '', null],
  ])('"%s" → %s', (subject, body, expected) => {
    expect(detectStatus(subject, body)).toBe(expected);
  });

  test('detects Hebrew rejection', () => {
    expect(detectStatus('עדכון לגבי המועמדות שלך', 'החלטנו לא להמשיך')).toBe('rejected');
  });

  test('detects Hebrew interview', () => {
    expect(detectStatus('ראיון עבודה', 'נשמח לדבר איתך')).toBe('interview');
  });

  test('accepted takes priority over rejected keywords', () => {
    expect(detectStatus('Congratulations — offer letter enclosed', 'unfortunately there is a delay')).toBe('accepted');
  });
});

describe('normalizeCompany', () => {
  test.each([
    ['WalkMe Ltd',            'walkme'],
    ['Wix Technologies',      'wix'],
    ['Monday.com',            'mondaycom'],
    ['Check Point Software',  'checkpoint'],
    ['ironSource',            'ironsource'],
    [null,                    ''],
    ['',                      ''],
  ])('%s → %s', (input, expected) => {
    expect(normalizeCompany(input)).toBe(expected);
  });
});

describe('syncEmails — end to end', () => {
  beforeAll(() => {
    db.insertManualApplication({ title: 'QA Engineer', company: 'WalkMe', status: 'applied' });
    db.insertManualApplication({ title: 'Test Engineer', company: 'Wix', status: 'applied' });
    db.insertManualApplication({ title: 'SDET', company: 'Monday.com', status: 'interview' });
  });

  test('updates WalkMe to rejected on rejection email', () => {
    const updates = syncEmails([{
      id: '1',
      subject: 'Your application at WalkMe',
      from: { address: 'hr@walkme.com', name: 'WalkMe HR' },
      body: 'Thank you for applying. Unfortunately, we are moving forward with other candidates.',
      date: new Date().toISOString(),
    }]);
    expect(updates).toHaveLength(1);
    expect(updates[0].company).toBe('WalkMe');
    expect(updates[0].newStatus).toBe('rejected');
    expect(updates[0].oldStatus).toBe('applied');
  });

  test('updates Wix to interview on interview email', () => {
    const updates = syncEmails([{
      id: '2',
      subject: 'Interview invitation — Wix',
      from: { address: 'talent@wix.com', name: 'Wix Talent' },
      body: 'We would like to invite you for a technical interview.',
      date: new Date().toISOString(),
    }]);
    expect(updates).toHaveLength(1);
    expect(updates[0].company).toBe('Wix');
    expect(updates[0].newStatus).toBe('interview');
  });

  test('skips email that matches no known company', () => {
    const updates = syncEmails([{
      id: '3',
      subject: 'Unfortunately we are not moving forward',
      from: { address: 'noreply@unknownstartup.io', name: 'Unknown Startup' },
      body: 'We went with another candidate.',
      date: new Date().toISOString(),
    }]);
    expect(updates).toHaveLength(0);
  });

  test('skips email with no status signal', () => {
    const updates = syncEmails([{
      id: '4',
      subject: 'Application received — Monday.com',
      from: { address: 'jobs@monday.com', name: 'Monday.com' },
      body: 'We have received your application and will be in touch.',
      date: new Date().toISOString(),
    }]);
    expect(updates).toHaveLength(0);
  });

  test('skips update if status already matches', () => {
    const updates = syncEmails([{
      id: '5',
      subject: 'Technical interview — Monday.com',
      from: { address: 'hr@monday.com', name: 'Monday HR' },
      body: 'We would like to invite you for an interview.',
      date: new Date().toISOString(),
    }]);
    expect(updates).toHaveLength(0);
  });

  test('processes multiple emails in one call', () => {
    db.insertManualApplication({ title: 'Dev', company: 'IronSource', status: 'applied' });
    db.insertManualApplication({ title: 'Dev', company: 'Fiverr', status: 'applied' });
    const updates = syncEmails([
      { id: '6', subject: 'Interview at IronSource', from: { address: 'hr@ironsource.com', name: 'IronSource' }, body: 'We want to schedule a call.', date: '' },
      { id: '7', subject: 'Fiverr application update', from: { address: 'talent@fiverr.com', name: 'Fiverr' }, body: 'Unfortunately we are not moving forward.', date: '' },
    ]);
    expect(updates).toHaveLength(2);
    const statuses = Object.fromEntries(updates.map((u) => [u.company, u.newStatus]));
    expect(statuses.IronSource).toBe('interview');
    expect(statuses.Fiverr).toBe('rejected');
  });
});
