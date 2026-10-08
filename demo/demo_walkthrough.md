# ServiceNow Script-Controlled ACL Demonstration Walkthrough

This walkthrough outlines the step-by-step live demonstration recorded in [`demo/script-controlled-acl-demo.webm`](script-controlled-acl-demo.webm) for the MySkillWallet project **Script-Controlled ACL – Restrict Record Access Based on Field Value**.

## Project & Environment Specifications
- **MySkillWallet Project**: `Script-Controlled ACL – Restrict Record Access Based on Field Value`
- **Project ID / Subscribed ID**: `6a96be195827789d6375618f` / `6ab4b6d4a238dc999eb4fee7`
- **Target Table**: `u_institution_details` (*Institution Details*)
- **Test User**: `EEE User` (`eeeuser@gmail.com`)
- **Custom Roles**: `bb1` (Read), `bb2` (Create), `bb3` (Write), `bb4` (Delete)

---

## Step-by-Step Functional Demonstration

### Scene 1: Milestone-1 & Milestone-2 — Users, Roles & Custom Table Setup
1. Open **User Administration → Users** and verify the test user **`EEE User`** (`First name: EEE`, `Last name: User`, `Email: eeeuser@gmail.com`).
2. Open **User Administration → Roles** and verify custom roles **`bb1`**, **`bb2`**, **`bb3`**, and **`bb4`** are assigned to `EEE User`.
3. Open **System Definition → Tables** and inspect **`Institution Details` (`u_institution_details`)** (`Extends table: false`) with its 7 required columns:
   - `Student Roll Number` (`u_student_roll_number`) — Auto Number
   - `Student Name` (`u_student_name`) — Reference (`sys_user`)
   - `Faculty Name` (`u_faculty_name`) — Reference (`sys_user`)
   - `Branch` (`u_branch`) — Choice (`ECE`, `EEE`, `CSE`)
   - `Email` (`u_email`) — String
   - `Phone Number` (`u_phone_number`) — String
   - `Description` (`u_description`) — Multi String

### Scene 2: Milestones 3–6 — Script-Controlled ACL Configuration
1. Elevate role to **`security_admin`**.
2. Open **System Security → Access Control (ACL)** and review the 4 record ACLs on `u_institution_details`:
   - **READ ACL (`Milestone-3`)**: `Requires role: bb1`, `Data condition: Branch is EEE`, `Advanced: true`, with server-side script validating `gs.hasRole('admin')` and `gs.hasRole('bb1')`.
   - **CREATE ACL (`Milestone-4`)**: `Requires role: bb2` (enables the **New** button).
   - **WRITE ACL (`Milestone-5`)**: `Requires role: bb3` (enables editing `EEE` branch records).
   - **DELETE ACL (`Milestone-6`)**: `Requires role: bb4` (enables deleting `EEE` branch records).

### Scene 3: Impersonating `EEE User` (`bb1`–`bb4`)
1. Impersonate **`EEE User (eeeuser@gmail.com)`** and navigate to `u_institution_details.list`.
2. **Observed Behavior**:
   - Only the **3 `EEE` branch records** (`INST0001001`, `INST0001002`, `INST0001005`) are displayed; `ECE` and `CSE` branch records are filtered out by the Script-Controlled READ ACL.
   - With `bb2` active, click **`+ New`** to create a new `EEE` student record.
   - With `bb3` active, click **`Edit`** to update an `EEE` student record.
   - With `bb4` active, click **`Delete`** to remove a test `EEE` record.

### Scene 4: Impersonating `System Administrator` vs `Unauthorized User`
1. Impersonate **`System Administrator (admin)`**:
   - All **6 records** across `EEE`, `ECE`, and `CSE` branches are visible (`gs.hasRole('admin') === true`).
2. Impersonate **`Unauthorized User`** (no `bb1` or `admin` role):
   - Access is denied (`0 Records Visible`) with the ServiceNow security constraint banner.

### Scene 5: Milestone-7 — Automated Verification Suite (10/10 Passed)
1. Open the **Verification Suite (M7)** view.
2. Confirm all **10/10** functional and technical verification checks pass (`100% PASS`).
