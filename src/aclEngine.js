/**
 * ServiceNow Script-Controlled ACL Evaluation Engine
 * ===================================================
 * Faithfully implements ServiceNow's server-side GlideSystem (gs.hasRole) and
 * Record ACL evaluation pipeline (Role Check + Data Condition + Script Execution)
 * for table `u_institution_details` (Institution Details).
 */

(function (globalScope) {
  'use strict';

  /**
   * Default Users & Roles as specified in Milestone-1
   */
  const INITIAL_USERS = {
    admin: {
      sys_id: '6816f79cc0a8016401c5a33be04be441',
      user_name: 'admin',
      first_name: 'System',
      last_name: 'Administrator',
      email: 'admin@servicenow.example.com',
      title: 'ServiceNow System Administrator',
      roles: ['admin', 'security_admin']
    },
    eee_user: {
      sys_id: 'a8f98bb0eb32010045e1a5115206fe3a',
      user_name: 'EEE User',
      first_name: 'EEE',
      last_name: 'User',
      email: 'eeeuser@gmail.com',
      title: 'EEE Department Test User',
      roles: ['bb1', 'bb2', 'bb3', 'bb4']
    },
    unauthorized_user: {
      sys_id: 'c9b12dd0eb32010045e1a5115206fe99',
      user_name: 'guest.student',
      first_name: 'Unauthorized',
      last_name: 'User',
      email: 'unauthorized.user@gmail.com',
      title: 'Standard User (No Custom Roles)',
      roles: []
    }
  };

  const CUSTOM_ROLES = [
    {
      name: 'bb1',
      milestone: 'Milestone-1 / Milestone-3 (READ)',
      operation: 'read',
      description: 'Grants READ access to EEE branch records in u_institution_details when combined with Branch=EEE condition and script.'
    },
    {
      name: 'bb2',
      milestone: 'Milestone-1 / Milestone-4 (CREATE)',
      operation: 'create',
      description: 'Grants CREATE access (enables New button) on u_institution_details.'
    },
    {
      name: 'bb3',
      milestone: 'Milestone-1 / Milestone-5 (WRITE)',
      operation: 'write',
      description: 'Grants WRITE (Edit/Update) access to accessible EEE branch records on u_institution_details.'
    },
    {
      name: 'bb4',
      milestone: 'Milestone-1 / Milestone-6 (DELETE)',
      operation: 'delete',
      description: 'Grants DELETE access to accessible EEE branch records on u_institution_details.'
    }
  ];

  /**
   * Initial Student Records in `u_institution_details` across EEE, ECE, and CSE branches (Milestone-2)
   */
  const INITIAL_RECORDS = [
    {
      sys_id: 'rec_inst_001',
      u_student_roll_number: 'INST0001001',
      u_student_name: 'Ghanavi N',
      u_faculty_name: 'Dr. Ramesh Kumar',
      u_branch: 'EEE',
      u_email: 'ghanavighanu7@gmail.com',
      u_phone_number: '+91-9845011223',
      u_description: 'Power Systems & Smart Grid Protection — EEE Branch Record'
    },
    {
      sys_id: 'rec_inst_002',
      u_student_roll_number: 'INST0001002',
      u_student_name: 'Selvadevi R',
      u_faculty_name: 'Prof. Anitha Sharma',
      u_branch: 'EEE',
      u_email: 'selvadevi701@gmail.com',
      u_phone_number: '+91-9845011224',
      u_description: 'Electrical Machines & Control Engineering — EEE Branch Record'
    },
    {
      sys_id: 'rec_inst_003',
      u_student_roll_number: 'INST0001003',
      u_student_name: 'Yakshini M',
      u_faculty_name: 'Dr. Suresh Verma',
      u_branch: 'ECE',
      u_email: 'yakshiniskitchen@gmail.com',
      u_phone_number: '+91-9845011225',
      u_description: 'VLSI Signal Processing & Embedded Systems — ECE Branch Record'
    },
    {
      sys_id: 'rec_inst_004',
      u_student_roll_number: 'INST0001004',
      u_student_name: 'Aswin S',
      u_faculty_name: 'Dr. Meenakshi Iyer',
      u_branch: 'CSE',
      u_email: 'aswinceo2004@gmail.com',
      u_phone_number: '+91-9845011226',
      u_description: 'Distributed Cloud & Enterprise Security — CSE Branch Record'
    },
    {
      sys_id: 'rec_inst_005',
      u_student_roll_number: 'INST0001005',
      u_student_name: 'EEE User',
      u_faculty_name: 'Dr. Ramesh Kumar',
      u_branch: 'EEE',
      u_email: 'eeeuser@gmail.com',
      u_phone_number: '+91-9845011227',
      u_description: 'High Voltage Direct Current (HVDC) Lab — EEE Branch Record'
    },
    {
      sys_id: 'rec_inst_006',
      u_student_roll_number: 'INST0001006',
      u_student_name: 'Karthik V',
      u_faculty_name: 'Dr. Suresh Verma',
      u_branch: 'ECE',
      u_email: 'karthik.ece@institution.edu',
      u_phone_number: '+91-9845011228',
      u_description: 'RF & Microwave Engineering — ECE Branch Record'
    }
  ];

  /**
   * Simulated ServiceNow GlideSystem (`gs`) object for a given user context
   */
  function createGlideSystem(user) {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return {
      hasRole: function (roleName) {
        if (!roleName) return false;
        // In ServiceNow, 'admin' automatically satisfies standard role checks when admin_overrides is true
        if (roles.includes('admin') && roleName !== 'security_admin') {
          return true;
        }
        return roles.includes(roleName);
      },
      getUserName: function () {
        return user?.user_name || 'guest';
      },
      getUserDisplayName: function () {
        return `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Guest';
      }
    };
  }

  /**
   * Exact Script-Controlled READ ACL script from Milestone-3
   */
  function executeReadAclScript(gs) {
    return (function () {
      // Allow admin users full access
      if (gs.hasRole('admin')) {
        return true;
      }
      // Allow only EEE branch users to see EEE records
      if (gs.hasRole('bb1')) {
        return true;
      }
      // Deny access for all others
      return false;
    })();
  }

  /**
   * Evaluates a ServiceNow Record ACL on `u_institution_details`
   *
   * ServiceNow ACL Evaluation Order:
   *   1. Admin Override check (if user has 'admin' role, access is granted to all branches/operations)
   *   2. Required Role check (read: bb1, create: bb2, write: bb3, delete: bb4)
   *   3. Data Condition check (read: u_branch === 'EEE')
   *   4. Script evaluation (for Advanced Script-Controlled ACL)
   */
  function evaluateRecordACL(operation, user, record) {
    const gs = createGlideSystem(user);
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes('admin');

    if (operation === 'read') {
      const rolePassed = isAdmin || gs.hasRole('bb1');
      const conditionPassed = isAdmin ? true : (record && record.u_branch === 'EEE');
      const scriptPassed = executeReadAclScript(gs);
      const allowed = Boolean(rolePassed && conditionPassed && scriptPassed);

      return {
        operation: 'read',
        table: 'u_institution_details',
        user: user?.user_name || 'unknown',
        recordRoll: record?.u_student_roll_number || 'N/A',
        branch: record?.u_branch || 'N/A',
        requiredRole: 'bb1',
        rolePassed,
        condition: 'Branch is EEE (u_branch = EEE)',
        conditionPassed,
        scriptPassed,
        allowed,
        reason: isAdmin
          ? 'Allowed via Admin override (gs.hasRole("admin") === true)'
          : allowed
            ? 'Allowed: Role bb1 verified, Data Condition (Branch is EEE) matched, and ACL Script returned true'
            : !rolePassed
              ? 'Denied: User lacks required role bb1 (and is not admin)'
              : 'Denied: Data Condition failed (Record Branch is ' + (record?.u_branch || 'unknown') + ', expected EEE)'
      };
    }

    if (operation === 'create') {
      // To see the table & New button effectively in the student workflow, user has bb1 + bb2 (or admin)
      const rolePassed = isAdmin || gs.hasRole('bb2');
      const allowed = Boolean(rolePassed);
      return {
        operation: 'create',
        table: 'u_institution_details',
        user: user?.user_name || 'unknown',
        requiredRole: 'bb2',
        rolePassed,
        condition: 'None',
        conditionPassed: true,
        scriptPassed: true,
        allowed,
        reason: isAdmin
          ? 'Allowed via Admin role'
          : allowed
            ? 'Allowed: User possesses required role bb2 for CREATE ACL'
            : 'Denied: User lacks required role bb2 for CREATE ACL'
      };
    }

    if (operation === 'write') {
      // User can only edit records they can read (EEE branch for non-admin) and must hold bb3
      const readEval = evaluateRecordACL('read', user, record);
      const rolePassed = isAdmin || gs.hasRole('bb3');
      const allowed = Boolean(readEval.allowed && rolePassed);
      return {
        operation: 'write',
        table: 'u_institution_details',
        user: user?.user_name || 'unknown',
        recordRoll: record?.u_student_roll_number || 'N/A',
        branch: record?.u_branch || 'N/A',
        requiredRole: 'bb3',
        rolePassed,
        condition: 'None (inherits EEE record visibility from READ ACL)',
        conditionPassed: readEval.conditionPassed,
        scriptPassed: true,
        allowed,
        reason: isAdmin
          ? 'Allowed via Admin role'
          : !readEval.allowed
            ? 'Denied: Record is not accessible under READ ACL (' + readEval.reason + ')'
            : allowed
              ? 'Allowed: User possesses required role bb3 for WRITE ACL on EEE record'
              : 'Denied: User lacks required role bb3 for WRITE ACL'
      };
    }

    if (operation === 'delete') {
      // User can only delete records they can read (EEE branch for non-admin) and must hold bb4
      const readEval = evaluateRecordACL('read', user, record);
      const rolePassed = isAdmin || gs.hasRole('bb4');
      const allowed = Boolean(readEval.allowed && rolePassed);
      return {
        operation: 'delete',
        table: 'u_institution_details',
        user: user?.user_name || 'unknown',
        recordRoll: record?.u_student_roll_number || 'N/A',
        branch: record?.u_branch || 'N/A',
        requiredRole: 'bb4',
        rolePassed,
        condition: 'None (inherits EEE record visibility from READ ACL)',
        conditionPassed: readEval.conditionPassed,
        scriptPassed: true,
        allowed,
        reason: isAdmin
          ? 'Allowed via Admin role'
          : !readEval.allowed
            ? 'Denied: Record is not accessible under READ ACL (' + readEval.reason + ')'
            : allowed
              ? 'Allowed: User possesses required role bb4 for DELETE ACL on EEE record'
              : 'Denied: User lacks required role bb4 for DELETE ACL'
      };
    }

    throw new Error('Unsupported ACL operation: ' + operation);
  }

  /**
   * Filters a list of `u_institution_details` records using the READ ACL
   */
  function queryReadableRecords(records, user) {
    const traces = [];
    const visible = [];
    for (const rec of records) {
      const res = evaluateRecordACL('read', user, rec);
      traces.push(res);
      if (res.allowed) {
        visible.push(rec);
      }
    }
    return { visible, traces };
  }

  /**
   * Automated Verification Suite validating all 8 MySkillWallet Stories / 7 Milestones
   */
  function runAllVerificationTests() {
    const results = [];
    const eeeRecord = INITIAL_RECORDS.find(r => r.u_branch === 'EEE');
    const eceRecord = INITIAL_RECORDS.find(r => r.u_branch === 'ECE');
    const cseRecord = INITIAL_RECORDS.find(r => r.u_branch === 'CSE');

    function assertTest(id, milestone, title, passed, expected, actual) {
      results.push({ id, milestone, title, passed: Boolean(passed), expected, actual });
    }

    // Test 1: Milestone-1 Story 1 — EEE User specification
    const eeeUser = INITIAL_USERS.eee_user;
    assertTest(
      'T01',
      'Milestone-1 (Users Creation)',
      'Test user "EEE User" exists with First name "EEE", Last name "User", and Email "eeeuser@gmail.com"',
      eeeUser.user_name === 'EEE User' &&
        eeeUser.first_name === 'EEE' &&
        eeeUser.last_name === 'User' &&
        eeeUser.email === 'eeeuser@gmail.com',
      'user_name="EEE User", email="eeeuser@gmail.com"',
      `user_name="${eeeUser.user_name}", email="${eeeUser.email}"`
    );

    // Test 2: Milestone-1 Story 2 — Custom Roles bb1, bb2, bb3, bb4 created and assigned
    const hasAllFourRoles = ['bb1', 'bb2', 'bb3', 'bb4'].every(r => eeeUser.roles.includes(r));
    assertTest(
      'T02',
      'Milestone-1 (Roles Creation)',
      'Custom roles bb1, bb2, bb3, bb4 are defined and assigned to EEE User',
      hasAllFourRoles && CUSTOM_ROLES.length === 4,
      'Assigned roles: [bb1, bb2, bb3, bb4]',
      `Assigned roles: [${eeeUser.roles.join(', ')}]`
    );

    // Test 3: Milestone-2 Story 3 — Table u_institution_details & multi-branch records
    const branchesPresent = ['EEE', 'ECE', 'CSE'].every(b => INITIAL_RECORDS.some(r => r.u_branch === b));
    const fieldsPresent = [
      'u_student_roll_number',
      'u_student_name',
      'u_faculty_name',
      'u_branch',
      'u_email',
      'u_phone_number',
      'u_description'
    ].every(f => Object.prototype.hasOwnProperty.call(eeeRecord, f));
    assertTest(
      'T03',
      'Milestone-2 (Creation of Table)',
      'Table u_institution_details (Institution Details) contains all 7 required columns and records for ECE, EEE, CSE',
      branchesPresent && fieldsPresent,
      '7 columns present & branches [ECE, EEE, CSE] populated',
      `7 columns=${fieldsPresent}, branches=[EEE, ECE, CSE]`
    );

    // Test 4: Milestone-3 Story 4 — Admin full read access across all branches
    const adminQuery = queryReadableRecords(INITIAL_RECORDS, INITIAL_USERS.admin);
    assertTest(
      'T04',
      'Milestone-3 (ACL-READ: Admin)',
      'Admin user can view all records regardless of branch (EEE, ECE, CSE)',
      adminQuery.visible.length === INITIAL_RECORDS.length,
      `${INITIAL_RECORDS.length} of ${INITIAL_RECORDS.length} records visible (EEE, ECE, CSE)`,
      `${adminQuery.visible.length} of ${INITIAL_RECORDS.length} records visible`
    );

    // Test 5: Milestone-3 Story 4 — User with bb1 role can view ONLY EEE branch records
    const bb1OnlyUser = { ...eeeUser, roles: ['bb1'] };
    const bb1Query = queryReadableRecords(INITIAL_RECORDS, bb1OnlyUser);
    const onlyEeeVisible =
      bb1Query.visible.length > 0 &&
      bb1Query.visible.every(r => r.u_branch === 'EEE') &&
      !evaluateRecordACL('read', bb1OnlyUser, eceRecord).allowed &&
      !evaluateRecordACL('read', bb1OnlyUser, cseRecord).allowed;
    assertTest(
      'T05',
      'Milestone-3 (ACL-READ: Role bb1)',
      'User with bb1 role can view ONLY EEE branch records; ECE and CSE records are restricted',
      onlyEeeVisible,
      'Only EEE records visible (3 records); ECE & CSE denied',
      `Visible branches: [${Array.from(new Set(bb1Query.visible.map(r => r.u_branch))).join(', ')}] (${bb1Query.visible.length} records)`
    );

    // Test 6: Milestone-3 Story 4 — Unauthorized user cannot view any records
    const unauthQuery = queryReadableRecords(INITIAL_RECORDS, INITIAL_USERS.unauthorized_user);
    assertTest(
      'T06',
      'Milestone-3 (ACL-READ: Unauthorized)',
      'User without bb1 or admin role cannot view any records in u_institution_details',
      unauthQuery.visible.length === 0,
      '0 records visible (Access Denied)',
      `${unauthQuery.visible.length} records visible`
    );

    // Test 7: Milestone-4 Story 5 — Create ACL requires bb2 role
    const createDeniedForBb1 = !evaluateRecordACL('create', bb1OnlyUser, null).allowed;
    const bb1AndBb2User = { ...eeeUser, roles: ['bb1', 'bb2'] };
    const createAllowedForBb2 = evaluateRecordACL('create', bb1AndBb2User, null).allowed;
    assertTest(
      'T07',
      'Milestone-4 (ACL-CREATE: Role bb2)',
      'User with bb1 & bb2 roles can view only EEE branch records and access the New button (Create ACL)',
      createDeniedForBb1 && createAllowedForBb2,
      'bb1 only -> Create Denied; bb1+bb2 -> Create Allowed (New Button enabled)',
      `bb1 Create=${!createDeniedForBb1}, bb1+bb2 Create=${createAllowedForBb2}`
    );

    // Test 8: Milestone-5 Story 6 — Write ACL requires bb3 role
    const writeDeniedWithoutBb3 = !evaluateRecordACL('write', bb1AndBb2User, eeeRecord).allowed;
    const bb123User = { ...eeeUser, roles: ['bb1', 'bb2', 'bb3'] };
    const writeAllowedOnEee = evaluateRecordACL('write', bb123User, eeeRecord).allowed;
    const writeDeniedOnEce = !evaluateRecordACL('write', bb123User, eceRecord).allowed;
    assertTest(
      'T08',
      'Milestone-5 (ACL-WRITE: Role bb3)',
      'User with bb1, bb2 & bb3 roles can view, create, and edit (Write) EEE branch records only',
      writeDeniedWithoutBb3 && writeAllowedOnEee && writeDeniedOnEce,
      'EEE Write=true, ECE Write=false, without bb3 Write=false',
      `EEE Write=${writeAllowedOnEee}, ECE Write=${!writeDeniedOnEce}, no-bb3 Write=${!writeDeniedWithoutBb3}`
    );

    // Test 9: Milestone-6 Story 7 — Delete ACL requires bb4 role
    const deleteDeniedWithoutBb4 = !evaluateRecordACL('delete', bb123User, eeeRecord).allowed;
    const bb1234User = { ...eeeUser, roles: ['bb1', 'bb2', 'bb3', 'bb4'] };
    const deleteAllowedOnEee = evaluateRecordACL('delete', bb1234User, eeeRecord).allowed;
    const deleteDeniedOnCse = !evaluateRecordACL('delete', bb1234User, cseRecord).allowed;
    assertTest(
      'T09',
      'Milestone-6 (ACL-DELETE: Role bb4)',
      'User with bb1, bb2, bb3 & bb4 roles has full CRUD (see, create, edit, delete) on EEE branch records',
      deleteDeniedWithoutBb4 && deleteAllowedOnEee && deleteDeniedOnCse,
      'EEE Delete=true, CSE Delete=false, without bb4 Delete=false',
      `EEE Delete=${deleteAllowedOnEee}, CSE Delete=${!deleteDeniedOnCse}, no-bb4 Delete=${!deleteDeniedWithoutBb4}`
    );

    // Test 10: Milestone-7 Story 8 — End-to-End Security Matrix Integrity
    const allPassed = results.every(r => r.passed);
    assertTest(
      'T10',
      'Milestone-7 (Project Outcome)',
      'Complete Script-Controlled READ, CREATE, WRITE, and DELETE ACL security lifecycle verified',
      allPassed,
      '100% ACL security matrix checks passed',
      allPassed ? 'All 10/10 verification checks passed' : 'Some checks failed'
    );

    return {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results
    };
  }

  const exported = {
    INITIAL_USERS,
    CUSTOM_ROLES,
    INITIAL_RECORDS,
    createGlideSystem,
    executeReadAclScript,
    evaluateRecordACL,
    queryReadableRecords,
    runAllVerificationTests
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  globalScope.ServiceNowACLEngine = exported;
})(typeof window !== 'undefined' ? window : globalThis);
