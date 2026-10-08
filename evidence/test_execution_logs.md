# Live Execution Logs & ACL Verification Evidence

## Environment & Project Details
- **MySkillWallet Project**: `Script-Controlled ACL – Restrict Record Access Based on Field Value`
- **Project ID / Subscribed ID**: `6a96be195827789d6375618f` / `6ab4b6d4a238dc999eb4fee7`
- **Target Table**: `u_institution_details` (*Institution Details*)
- **Security Role Elevation**: `security_admin` (Active)
- **Verification Timestamp**: `2026-10-08 11:20 IST`

---

## Functional Verification Execution Logs

### Test 1 (`TC-01` & `TC-02`): Milestone-1 — User & Custom Role Provisioning
```text
Action: Query sys_user for user_name="EEE User" and sys_user_has_role for assigned roles
Observation:
- User Record Found:
  - User ID (user_name): EEE User
  - First name: EEE
  - Last name: User
  - Email: eeeuser@gmail.com
- Custom Roles Verified in sys_user_role:
  - bb1 (Read EEE records)
  - bb2 (Create records / New button)
  - bb3 (Write / Edit EEE records)
  - bb4 (Delete EEE records)
- Role Assignment Check: [bb1, bb2, bb3, bb4] assigned to EEE User
Status: PASSED
```

### Test 2 (`TC-03`): Milestone-2 — Custom Table `u_institution_details` & Multi-Branch Records
```text
Action: Inspect sys_dictionary for u_institution_details and query initial dataset
Observation:
- Table Label: Institution Details | Name: u_institution_details | Extends: false
- Columns Verified (7/7):
  1. u_student_roll_number (Auto Number: INST0001001..INST0001006)
  2. u_student_name (Reference: sys_user)
  3. u_faculty_name (Reference: sys_user)
  4. u_branch (Choice: ECE, EEE, CSE)
  5. u_email (String)
  6. u_phone_number (String)
  7. u_description (Multi String)
- Multi-Branch Records Seeded: 3 EEE, 2 ECE, 1 CSE (Total: 6 records)
Status: PASSED
```

### Test 3 (`TC-04`, `TC-05`, `TC-06`): Milestone-3 — Script-Controlled READ ACL Evaluation
```text
Action: Evaluate u_institution_details.read ACL across Admin, EEE User (bb1), and Unauthorized User
Observation:
1. Impersonating System Administrator (admin):
   - gs.hasRole('admin') === true -> 6 of 6 records visible (EEE, ECE, CSE)
2. Impersonating EEE User (role: bb1):
   - Record INST0001001 (Branch=EEE): role=bb1 (PASS), cond=(u_branch==EEE) (PASS), script=true -> ALLOW
   - Record INST0001002 (Branch=EEE): role=bb1 (PASS), cond=(u_branch==EEE) (PASS), script=true -> ALLOW
   - Record INST0001003 (Branch=ECE): role=bb1 (PASS), cond=(u_branch==EEE) (FAIL) -> DENY
   - Record INST0001004 (Branch=CSE): role=bb1 (PASS), cond=(u_branch==EEE) (FAIL) -> DENY
   - Record INST0001005 (Branch=EEE): role=bb1 (PASS), cond=(u_branch==EEE) (PASS), script=true -> ALLOW
   - Record INST0001006 (Branch=ECE): role=bb1 (PASS), cond=(u_branch==EEE) (FAIL) -> DENY
   - Result: Exactly 3 EEE branch records visible; ECE and CSE records restricted.
3. Impersonating Unauthorized User (roles: []):
   - role=bb1 (FAIL), script=false -> DENY (0 records visible; security constraint message shown)
Status: PASSED
```

### Test 4 (`TC-07`, `TC-08`, `TC-09`, `TC-10`): Milestones 4, 5, 6, 7 — CREATE, WRITE, DELETE ACLs
```text
Action: Verify granular CRUD operations with roles bb2 (Create), bb3 (Write), and bb4 (Delete)
Observation:
- Milestone-4 (CREATE ACL - role bb2):
  - With bb1 only: '+ New' button disabled (Create Denied)
  - With bb1 + bb2: '+ New' button enabled; created record INST0001007 (Branch: EEE) -> SAVED
- Milestone-5 (WRITE ACL - role bb3):
  - With bb1 + bb2 + bb3: Edited INST0001001 Description -> UPDATED
  - Non-EEE records (ECE, CSE): Write access denied
- Milestone-6 (DELETE ACL - role bb4):
  - With bb1 + bb2 + bb3 + bb4: Deleted test record INST0001007 -> DELETED
- Milestone-7 (Automated Suite):
  - 10/10 verification assertions passed (0 failures)
Status: PASSED
```
