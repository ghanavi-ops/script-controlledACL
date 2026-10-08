/**
 * ServiceNow Script-Controlled ACL Workbench — Application Controller
 * ====================================================================
 * Drives the interactive ServiceNow simulator for `u_institution_details`
 * across all 7 Milestones and 8 Stories defined in MySkillWallet.
 */

(function () {
  'use strict';

  const Engine = window.ServiceNowACLEngine;

  // Application State
  const state = {
    activeTab: 'list', // 'list' | 'users' | 'table' | 'acls' | 'verify'
    impersonatedUserKey: 'eee_user', // 'admin' | 'eee_user' | 'unauthorized_user'
    securityAdminElevated: true,
    eeeUserRoles: ['bb1', 'bb2', 'bb3', 'bb4'],
    records: JSON.parse(JSON.stringify(Engine.INITIAL_RECORDS)),
    nextRollSequence: 1007,
    editingRecordId: null,
    lastActionMessage: 'Impersonating EEE User (eeeuser@gmail.com) with roles [bb1, bb2, bb3, bb4] — Restricted to EEE Branch records.'
  };

  function getCurrentUser() {
    if (state.impersonatedUserKey === 'admin') {
      return Engine.INITIAL_USERS.admin;
    }
    if (state.impersonatedUserKey === 'unauthorized_user') {
      return Engine.INITIAL_USERS.unauthorized_user;
    }
    return {
      ...Engine.INITIAL_USERS.eee_user,
      roles: [...state.eeeUserRoles]
    };
  }

  function showToast(msg) {
    state.lastActionMessage = msg;
    const banner = document.getElementById('statusToast');
    if (banner) {
      banner.textContent = msg;
      banner.classList.add('show');
    }
  }

  function renderHeaderAndRoleBar() {
    const user = getCurrentUser();
    const selectEl = document.getElementById('impersonateSelect');
    if (selectEl && selectEl.value !== state.impersonatedUserKey) {
      selectEl.value = state.impersonatedUserKey;
    }

    const activeUserBadge = document.getElementById('activeUserBadge');
    if (activeUserBadge) {
      const roleStr = user.roles.length ? user.roles.join(', ') : 'No Roles';
      activeUserBadge.textContent = `${user.user_name} (${user.email}) [${roleStr}]`;
    }

    const secAdminBtn = document.getElementById('elevateSecurityAdminBtn');
    if (secAdminBtn) {
      secAdminBtn.className = 'sn-pill ' + (state.securityAdminElevated ? 'elevated' : '');
      secAdminBtn.textContent = state.securityAdminElevated
        ? '🔒 security_admin: Elevated'
        : '🔓 Elevate security_admin';
    }

    // Render role toggles for EEE User
    const roleChipsContainer = document.getElementById('eeeRoleToggles');
    if (roleChipsContainer) {
      const isEeeUser = state.impersonatedUserKey === 'eee_user';
      const roleMeta = [
        { code: 'bb1', label: 'bb1 (Read EEE)' },
        { code: 'bb2', label: 'bb2 (Create / New)' },
        { code: 'bb3', label: 'bb3 (Write / Edit)' },
        { code: 'bb4', label: 'bb4 (Delete)' }
      ];

      roleChipsContainer.innerHTML = roleMeta
        .map(r => {
          const checked = isEeeUser
            ? state.eeeUserRoles.includes(r.code)
            : state.impersonatedUserKey === 'admin';
          const disabled = !isEeeUser;
          return `
            <label class="role-toggle ${checked ? 'active' : ''}" title="${
              disabled ? 'Switch to EEE User to customize bb1-bb4 roles' : 'Toggle role ' + r.code
            }">
              <input type="checkbox" data-role="${r.code}" ${checked ? 'checked' : ''} ${
                disabled ? 'disabled' : ''
              } />
              <span>${r.label}</span>
            </label>
          `;
        })
        .join('');

      roleChipsContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', e => {
          const role = e.target.getAttribute('data-role');
          if (e.target.checked) {
            if (!state.eeeUserRoles.includes(role)) state.eeeUserRoles.push(role);
          } else {
            state.eeeUserRoles = state.eeeUserRoles.filter(x => x !== role);
          }
          state.eeeUserRoles.sort();
          showToast(
            `Updated EEE User roles to: [${
              state.eeeUserRoles.length ? state.eeeUserRoles.join(', ') : 'none'
            }]`
          );
          renderAll();
        });
      });
    }
  }

  function renderPermissionStrip() {
    const user = getCurrentUser();
    const sampleEee = { u_student_roll_number: 'INST0001001', u_branch: 'EEE' };
    const readEval = Engine.evaluateRecordACL('read', user, sampleEee);
    const createEval = Engine.evaluateRecordACL('create', user, sampleEee);
    const writeEval = Engine.evaluateRecordACL('write', user, sampleEee);
    const deleteEval = Engine.evaluateRecordACL('delete', user, sampleEee);

    const strip = document.getElementById('aclStatusStrip');
    if (!strip) return;

    const items = [
      {
        op: 'READ ACL (Milestone-3)',
        role: 'Role: bb1 | Cond: Branch=EEE',
        evalObj: readEval
      },
      {
        op: 'CREATE ACL (Milestone-4)',
        role: 'Role: bb2 (New Button)',
        evalObj: createEval
      },
      {
        op: 'WRITE ACL (Milestone-5)',
        role: 'Role: bb3 (Edit EEE Record)',
        evalObj: writeEval
      },
      {
        op: 'DELETE ACL (Milestone-6)',
        role: 'Role: bb4 (Delete EEE Record)',
        evalObj: deleteEval
      }
    ];

    strip.innerHTML = items
      .map(
        item => `
        <div class="acl-perm-box ${item.evalObj.allowed ? 'allowed' : 'denied'}">
          <div class="acl-perm-title">
            <span>${item.op}</span>
            <span>${item.evalObj.allowed ? '✔ ALLOWED' : '✖ DENIED'}</span>
          </div>
          <div class="acl-perm-detail">${item.role}</div>
          <div class="acl-perm-detail" style="font-weight:600;color:#1e293b;">${item.evalObj.reason}</div>
        </div>
      `
      )
      .join('');
  }

  function renderListView(container) {
    const user = getCurrentUser();
    const queryResult = Engine.queryReadableRecords(state.records, user);
    const sampleEee = { u_student_roll_number: 'NEW', u_branch: 'EEE' };
    const canCreate = Engine.evaluateRecordACL('create', user, sampleEee).allowed &&
      (user.roles.includes('admin') || user.roles.includes('bb1'));

    const rowsHtml = queryResult.visible
      .map(rec => {
        const canWrite = Engine.evaluateRecordACL('write', user, rec).allowed;
        const canDelete = Engine.evaluateRecordACL('delete', user, rec).allowed;
        return `
          <tr data-sys-id="${rec.sys_id}">
            <td style="font-weight:700;color:#1d4ed8;">${rec.u_student_roll_number}</td>
            <td>${rec.u_student_name}</td>
            <td>${rec.u_faculty_name}</td>
            <td><span class="branch-badge branch-${rec.u_branch}">${rec.u_branch}</span></td>
            <td>${rec.u_email}</td>
            <td>${rec.u_phone_number}</td>
            <td>${rec.u_description}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-outline btn-sm edit-record-btn" data-id="${rec.sys_id}" ${
                canWrite ? '' : 'disabled title="Requires role bb3 (Write ACL)"'
              }>
                ✏ Edit
              </button>
              <button class="btn btn-danger btn-sm delete-record-btn" data-id="${rec.sys_id}" ${
                canDelete ? '' : 'disabled title="Requires role bb4 (Delete ACL)"'
              }>
                🗑 Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    const deniedBanner =
      queryResult.visible.length === 0
        ? `
          <div class="sn-security-deny" id="securityDenyBanner">
            <div>
              🔒 <strong>Security constraints prevent access to requested page (u_institution_details.list)</strong>
              <div style="font-size:0.78rem;font-weight:400;margin-top:0.2rem;">
                ACL Evaluation failed: Current user (${user.user_name}) does not satisfy the Script-Controlled READ ACL (requires role <code>bb1</code> and <code>Branch = EEE</code>, or <code>admin</code>).
              </div>
            </div>
            <span class="branch-badge" style="background:#991b1b;color:#fff;">0 Records Visible</span>
          </div>
        `
        : '';

    const traceRows = queryResult.traces
      .map(
        t => `
        <tr>
          <td><code>${t.recordRoll}</code></td>
          <td><span class="branch-badge branch-${t.branch}">${t.branch}</span></td>
          <td><code>${t.requiredRole}</code> (${t.rolePassed ? '✔' : '✖'})</td>
          <td><code>Branch = EEE</code> (${t.conditionPassed ? '✔' : '✖'})</td>
          <td><code>${t.scriptPassed ? 'true' : 'false'}</code></td>
          <td style="font-weight:700;color:${t.allowed ? '#059669' : '#dc2626'};">
            ${t.allowed ? 'ALLOW (Visible)' : 'DENY (Restricted)'}
          </td>
        </tr>
      `
      )
      .join('');

    container.innerHTML = `
      <div class="sn-card">
        <div class="sn-card-header">
          <div>
            <h2>📋 Institution Details [<code>u_institution_details.list</code>]</h2>
            <p style="font-size:0.78rem;color:#64748b;">
              Showing <strong>${queryResult.visible.length}</strong> of <strong>${
                state.records.length
              }</strong> total records based on Script-Controlled READ ACL evaluation for <strong>${
                user.user_name
              }</strong>
            </p>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <button class="btn btn-primary" id="newRecordBtn" ${
              canCreate ? '' : 'disabled title="Requires role bb2 (Create ACL) and bb1 (Read ACL)"'
            }>
              ➕ New
            </button>
            <button class="btn btn-outline" id="resetRecordsBtn">
              ↻ Reset Sample Data
            </button>
          </div>
        </div>
        <div class="sn-card-body">
          ${deniedBanner}
          ${
            queryResult.visible.length > 0
              ? `
            <div class="sn-table-wrap">
              <table class="sn-table" id="institutionTable">
                <thead>
                  <tr>
                    <th>Student Roll Number</th>
                    <th>Student Name (Ref: User)</th>
                    <th>Faculty Name (Ref: User)</th>
                    <th>Branch</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Description</th>
                    <th>ACL Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <div class="sn-card">
        <div class="sn-card-header">
          <h2>🔍 Live ServiceNow ACL Evaluation Debugger (<code>u_institution_details.read</code>)</h2>
          <span style="font-size:0.76rem;color:#475569;">Evaluates Role (<code>bb1</code>) + Data Condition (<code>Branch is EEE</code>) + Script (<code>gs.hasRole</code>)</span>
        </div>
        <div class="sn-card-body">
          <div class="sn-table-wrap">
            <table class="sn-table">
              <thead>
                <tr>
                  <th>Record Roll #</th>
                  <th>Record Branch</th>
                  <th>Requires Role</th>
                  <th>Data Condition</th>
                  <th>Script Return</th>
                  <th>ACL Decision</th>
                </tr>
              </thead>
              <tbody>
                ${traceRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Attach listeners
    const newBtn = document.getElementById('newRecordBtn');
    if (newBtn) {
      newBtn.addEventListener('click', () => openRecordModal(null));
    }

    const resetBtn = document.getElementById('resetRecordsBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.records = JSON.parse(JSON.stringify(Engine.INITIAL_RECORDS));
        showToast('Reset u_institution_details records to initial 6 multi-branch records (EEE, ECE, CSE).');
        renderAll();
      });
    }

    container.querySelectorAll('.edit-record-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const recId = btn.getAttribute('data-id');
        openRecordModal(recId);
      });
    });

    container.querySelectorAll('.delete-record-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const recId = btn.getAttribute('data-id');
        const target = state.records.find(r => r.sys_id === recId);
        if (!target) return;
        const evalDel = Engine.evaluateRecordACL('delete', getCurrentUser(), target);
        if (!evalDel.allowed) {
          showToast('Delete Denied by ACL: ' + evalDel.reason);
          return;
        }
        state.records = state.records.filter(r => r.sys_id !== recId);
        showToast(
          `DELETED record ${target.u_student_roll_number} (${target.u_student_name} - ${target.u_branch}) via DELETE ACL (role bb4).`
        );
        renderAll();
      });
    });
  }

  function renderUsersAndRolesView(container) {
    const eeeUser = Engine.INITIAL_USERS.eee_user;
    const rolesRows = Engine.CUSTOM_ROLES.map(
      r => `
        <tr>
          <td><code>${r.name}</code></td>
          <td>${r.milestone}</td>
          <td><span class="branch-badge branch-EEE">${r.operation.toUpperCase()}</span></td>
          <td>${r.description}</td>
          <td><code>EEE User (eeeuser@gmail.com)</code></td>
        </tr>
      `
    ).join('');

    container.innerHTML = `
      <div class="sn-card">
        <div class="sn-card-header">
          <h2>👤 Milestone-1: Creation of Users and Roles (<code>sys_user</code> & <code>sys_user_role</code>)</h2>
          <span class="branch-badge branch-EEE">Assigned: Ghanavi N</span>
        </div>
        <div class="sn-card-body" style="display:flex;flex-direction:column;gap:1.15rem;">
          <div>
            <h3 style="font-size:0.92rem;margin-bottom:0.5rem;">1. Test User Record (<code>User Administration → Users</code>)</h3>
            <div class="sn-table-wrap">
              <table class="sn-table">
                <thead>
                  <tr>
                    <th>User ID (<code>user_name</code>)</th>
                    <th>First Name (<code>first_name</code>)</th>
                    <th>Last Name (<code>last_name</code>)</th>
                    <th>Email (<code>email</code>)</th>
                    <th>Assigned Roles (<code>sys_user_has_role</code>)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>${eeeUser.user_name}</strong></td>
                    <td>${eeeUser.first_name}</td>
                    <td>${eeeUser.last_name}</td>
                    <td><code>${eeeUser.email}</code></td>
                    <td><code>bb1, bb2, bb3, bb4</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style="font-size:0.92rem;margin-bottom:0.5rem;">2. Custom Roles Created (<code>User Administration → Roles</code>)</h3>
            <div class="sn-table-wrap">
              <table class="sn-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Milestone Mapping</th>
                    <th>Operation</th>
                    <th>Role Purpose / Description</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  ${rolesRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTableSchemaView(container) {
    const columns = [
      { label: 'Student Roll Number', name: 'u_student_roll_number', type: 'Auto Number (INST0001001)', ref: 'sys_number' },
      { label: 'Student Name', name: 'u_student_name', type: 'Reference', ref: 'User (sys_user)' },
      { label: 'Faculty Name', name: 'u_faculty_name', type: 'Reference', ref: 'User (sys_user)' },
      { label: 'Branch', name: 'u_branch', type: 'Choice (ECE, EEE, CSE)', ref: 'sys_choice' },
      { label: 'Email', name: 'u_email', type: 'String (100)', ref: '—' },
      { label: 'Phone Number', name: 'u_phone_number', type: 'String (40)', ref: '—' },
      { label: 'Description', name: 'u_description', type: 'Multi String (4000)', ref: '—' }
    ];

    container.innerHTML = `
      <div class="sn-card">
        <div class="sn-card-header">
          <h2>🗂 Milestone-2: Creation of Table (<code>System Definition → Tables</code>)</h2>
          <span class="branch-badge branch-ECE">Assigned: Yakshini M</span>
        </div>
        <div class="sn-card-body" style="display:flex;flex-direction:column;gap:1rem;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">
            <div class="acl-perm-box allowed">
              <div class="acl-perm-title">Table Label</div>
              <div style="font-weight:700;font-size:0.95rem;">Institution Details</div>
            </div>
            <div class="acl-perm-box allowed">
              <div class="acl-perm-title">Table Name</div>
              <div style="font-weight:700;font-size:0.95rem;"><code>u_institution_details</code></div>
            </div>
            <div class="acl-perm-box allowed">
              <div class="acl-perm-title">Extends Table</div>
              <div style="font-weight:700;font-size:0.95rem;"><code>false</code> (Standalone Custom Table)</div>
            </div>
          </div>

          <h3 style="font-size:0.92rem;">Table Columns (<code>sys_dictionary</code>)</h3>
          <div class="sn-table-wrap">
            <table class="sn-table">
              <thead>
                <tr>
                  <th>Column Label</th>
                  <th>Column Name (Element)</th>
                  <th>Field Type</th>
                  <th>Reference / Choice Specification</th>
                </tr>
              </thead>
              <tbody>
                ${columns
                  .map(
                    c => `
                  <tr>
                    <td><strong>${c.label}</strong></td>
                    <td><code>${c.name}</code></td>
                    <td>${c.type}</td>
                    <td><code>${c.ref}</code></td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderAclRulesView(container) {
    container.innerHTML = `
      <div class="sn-card">
        <div class="sn-card-header">
          <h2>🛡️ Milestones 3–6: Access Control Lists (<code>System Security → Access Control (ACL)</code>)</h2>
          <span class="sn-pill elevated" style="background:#fef3c7;color:#92400e;border-color:#f59e0b;">Role Elevated: security_admin</span>
        </div>
        <div class="sn-card-body" style="display:flex;flex-direction:column;gap:1.15rem;">
          <div class="sn-table-wrap">
            <table class="sn-table">
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>ACL Type</th>
                  <th>Operation</th>
                  <th>Name (Table)</th>
                  <th>Active</th>
                  <th>Advanced</th>
                  <th>Requires Role</th>
                  <th>Data Condition</th>
                  <th>Assigned Member</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Milestone-3</strong></td>
                  <td><code>record</code></td>
                  <td><span class="branch-badge branch-EEE">read</span></td>
                  <td><code>u_institution_details</code></td>
                  <td><code>true</code></td>
                  <td><code>true</code></td>
                  <td><code>bb1</code></td>
                  <td><code>Branch is EEE</code></td>
                  <td>Selvadevi R</td>
                </tr>
                <tr>
                  <td><strong>Milestone-4</strong></td>
                  <td><code>record</code></td>
                  <td><span class="branch-badge branch-ECE">create</span></td>
                  <td><code>u_institution_details</code></td>
                  <td><code>true</code></td>
                  <td><code>false</code></td>
                  <td><code>bb2</code></td>
                  <td>None</td>
                  <td>Ghanavi N</td>
                </tr>
                <tr>
                  <td><strong>Milestone-5</strong></td>
                  <td><code>record</code></td>
                  <td><span class="branch-badge branch-CSE">write</span></td>
                  <td><code>u_institution_details</code></td>
                  <td><code>true</code></td>
                  <td><code>false</code></td>
                  <td><code>bb3</code></td>
                  <td>None</td>
                  <td>Aswin S</td>
                </tr>
                <tr>
                  <td><strong>Milestone-6</strong></td>
                  <td><code>record</code></td>
                  <td><span class="branch-badge" style="background:#fee2e2;color:#991b1b;">delete</span></td>
                  <td><code>u_institution_details</code></td>
                  <td><code>true</code></td>
                  <td><code>false</code></td>
                  <td><code>bb4</code></td>
                  <td>None</td>
                  <td>Yakshini M</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 style="font-size:0.92rem;margin-bottom:0.45rem;">Server-Side Script-Controlled READ ACL (<code>u_institution_details.read</code>)</h3>
            <pre class="sn-code">(function () {
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
})();</pre>
          </div>
        </div>
      </div>
    `;
  }

  function renderVerificationView(container) {
    const report = Engine.runAllVerificationTests();

    const rows = report.results
      .map(
        r => `
        <tr>
          <td><code>${r.id}</code></td>
          <td><strong>${r.milestone}</strong></td>
          <td>${r.title}</td>
          <td><code>${r.expected}</code></td>
          <td><code>${r.actual}</code></td>
          <td style="font-weight:700;color:${r.passed ? '#059669' : '#dc2626'};">
            ${r.passed ? '✔ PASS' : '✖ FAIL'}
          </td>
        </tr>
      `
      )
      .join('');

    container.innerHTML = `
      <div class="sn-card">
        <div class="sn-card-header">
          <div>
            <h2>✅ Milestone-7: Automated Requirement Verification & Project Conclusion</h2>
            <p style="font-size:0.78rem;color:#475569;">
              Verified <strong>${report.passed} / ${report.total}</strong> MySkillWallet functional & technical requirements
            </p>
          </div>
          <span class="branch-badge branch-EEE" style="font-size:0.85rem;padding:0.3rem 0.75rem;">
            ${report.passed}/${report.total} PASSED (100%)
          </span>
        </div>
        <div class="sn-card-body" style="display:flex;flex-direction:column;gap:1rem;">
          <div class="sn-table-wrap">
            <table class="sn-table" id="verificationResultsTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Milestone</th>
                  <th>Requirement Verification Check</th>
                  <th>Expected Outcome</th>
                  <th>Actual Verified Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          <div class="acl-perm-box allowed" style="padding:1rem;">
            <div class="acl-perm-title" style="margin-bottom:0.35rem;">Milestone-7: Project Outcome Summary</div>
            <p style="font-size:0.83rem;color:#1e293b;">
              By completing this project, we demonstrated how script-controlled <strong>READ</strong>, <strong>CREATE</strong>, <strong>WRITE</strong>, and <strong>DELETE</strong> ACLs on <code>u_institution_details</code> enforce record-level security in ServiceNow. User roles (<code>bb1</code>, <code>bb2</code>, <code>bb3</code>, <code>bb4</code>, and <code>admin</code>) and record field values (<code>Branch is EEE</code>) are evaluated together to make accurate access decisions across lists and forms.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  function openRecordModal(recordSysId) {
    const user = getCurrentUser();
    const modalBackdrop = document.getElementById('recordModalBackdrop');
    const modalTitle = document.getElementById('recordModalTitle');
    const rollInput = document.getElementById('formRollNumber');
    const studentInput = document.getElementById('formStudentName');
    const facultyInput = document.getElementById('formFacultyName');
    const branchSelect = document.getElementById('formBranch');
    const emailInput = document.getElementById('formEmail');
    const phoneInput = document.getElementById('formPhone');
    const descInput = document.getElementById('formDescription');

    if (recordSysId) {
      const rec = state.records.find(r => r.sys_id === recordSysId);
      if (!rec) return;
      const writeEval = Engine.evaluateRecordACL('write', user, rec);
      if (!writeEval.allowed) {
        showToast('Edit Denied by WRITE ACL: ' + writeEval.reason);
        return;
      }
      state.editingRecordId = recordSysId;
      modalTitle.textContent = `Edit Institution Details Record (${rec.u_student_roll_number})`;
      rollInput.value = rec.u_student_roll_number;
      studentInput.value = rec.u_student_name;
      facultyInput.value = rec.u_faculty_name;
      branchSelect.value = rec.u_branch;
      emailInput.value = rec.u_email;
      phoneInput.value = rec.u_phone_number;
      descInput.value = rec.u_description;
    } else {
      const createEval = Engine.evaluateRecordACL('create', user, null);
      if (!createEval.allowed) {
        showToast('Create Denied by CREATE ACL: ' + createEval.reason);
        return;
      }
      state.editingRecordId = null;
      const nextRoll = 'INST' + String(state.nextRollSequence).padStart(7, '0');
      modalTitle.textContent = `New Institution Details Record (${nextRoll})`;
      rollInput.value = nextRoll;
      studentInput.value = 'EEE User';
      facultyInput.value = 'Dr. Ramesh Kumar';
      branchSelect.value = 'EEE';
      emailInput.value = 'eeeuser@gmail.com';
      phoneInput.value = '+91-9845099887';
      descInput.value = 'Power Electronics & Smart Drives — Created via bb2 CREATE ACL';
    }

    modalBackdrop.classList.add('open');
  }

  function closeRecordModal() {
    const modalBackdrop = document.getElementById('recordModalBackdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('open');
    state.editingRecordId = null;
  }

  function saveRecordFromModal(e) {
    e.preventDefault();
    const roll = document.getElementById('formRollNumber').value.trim();
    const student = document.getElementById('formStudentName').value.trim();
    const faculty = document.getElementById('formFacultyName').value.trim();
    const branch = document.getElementById('formBranch').value;
    const email = document.getElementById('formEmail').value.trim();
    const phone = document.getElementById('formPhone').value.trim();
    const desc = document.getElementById('formDescription').value.trim();

    if (!student || !faculty) {
      showToast('Validation Error: Student Name and Faculty Name are required fields.');
      return;
    }

    if (state.editingRecordId) {
      const idx = state.records.findIndex(r => r.sys_id === state.editingRecordId);
      if (idx !== -1) {
        state.records[idx] = {
          ...state.records[idx],
          u_student_name: student,
          u_faculty_name: faculty,
          u_branch: branch,
          u_email: email,
          u_phone_number: phone,
          u_description: desc
        };
        showToast(`UPDATED record ${roll} (${student}) via WRITE ACL (role bb3).`);
      }
    } else {
      state.records.push({
        sys_id: 'rec_inst_' + Date.now(),
        u_student_roll_number: roll,
        u_student_name: student,
        u_faculty_name: faculty,
        u_branch: branch,
        u_email: email,
        u_phone_number: phone,
        u_description: desc
      });
      state.nextRollSequence += 1;
      showToast(`CREATED new record ${roll} (${student} - ${branch}) via CREATE ACL (role bb2).`);
    }

    closeRecordModal();
    renderAll();
  }

  function renderMainView() {
    const container = document.getElementById('mainViewContainer');
    if (!container) return;

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === state.activeTab);
    });

    if (state.activeTab === 'list') {
      renderListView(container);
    } else if (state.activeTab === 'users') {
      renderUsersAndRolesView(container);
    } else if (state.activeTab === 'table') {
      renderTableSchemaView(container);
    } else if (state.activeTab === 'acls') {
      renderAclRulesView(container);
    } else if (state.activeTab === 'verify') {
      renderVerificationView(container);
    }
  }

  function renderAll() {
    renderHeaderAndRoleBar();
    renderPermissionStrip();
    renderMainView();
  }

  function init() {
    // Impersonation selector
    const impSelect = document.getElementById('impersonateSelect');
    if (impSelect) {
      impSelect.addEventListener('change', e => {
        state.impersonatedUserKey = e.target.value;
        const u = getCurrentUser();
        showToast(`Switched impersonation to: ${u.user_name} (${u.email})`);
        renderAll();
      });
    }

    // Security Admin elevation button
    const secBtn = document.getElementById('elevateSecurityAdminBtn');
    if (secBtn) {
      secBtn.addEventListener('click', () => {
        state.securityAdminElevated = !state.securityAdminElevated;
        showToast(
          state.securityAdminElevated
            ? 'Elevated to security_admin role — ACL modification enabled.'
            : 'Dropped security_admin role elevation.'
        );
        renderAll();
      });
    }

    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-tab');
        renderAll();
      });
    });

    // Modal handlers
    const cancelBtn = document.getElementById('cancelModalBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', closeRecordModal);

    const recordForm = document.getElementById('recordModalForm');
    if (recordForm) recordForm.addEventListener('submit', saveRecordFromModal);

    showToast(state.lastActionMessage);
    renderAll();
  }

  // Expose state helpers for automated verification & walkthrough demo
  window.ACLWorkbenchApp = {
    getState: () => state,
    setImpersonation: (userKey, rolesArray) => {
      state.impersonatedUserKey = userKey;
      if (Array.isArray(rolesArray)) {
        state.eeeUserRoles = [...rolesArray];
      }
      renderAll();
    },
    setTab: tabName => {
      state.activeTab = tabName;
      renderAll();
    },
    openNewModal: () => openRecordModal(null),
    closeModal: () => closeRecordModal()
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
