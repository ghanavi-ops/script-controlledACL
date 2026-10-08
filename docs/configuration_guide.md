# Configuration Guide: Script-Controlled ACL – Restrict Record Access Based on Field Value

## Target Environment & Project Metadata
- **MySkillWallet Module**: ServiceNow System Administrator - NM Eng
- **MySkillWallet Project Title**: Script-Controlled ACL – Restrict Record Access Based on Field Value
- **MySkillWallet Project ID**: `6a96be195827789d6375618f`
- **MySkillWallet Subscribed ID**: `6ab4b6d4a238dc999eb4fee7`
- **Target Custom Table**: `u_institution_details` (*Institution Details*)

---

## Step-by-Step ServiceNow Configuration across All 7 Milestones

### Milestone-1: Creation of Users and Roles

#### Story 1: Users Creation (`sys_user`)
1. Log in to the ServiceNow instance with `admin` access.
2. Navigate to **User Administration → Users** and click **New**.
3. Configure the test user with the following field values:
   - **User ID (`user_name`)**: `EEE User`
   - **First name (`first_name`)**: `EEE`
   - **Last name (`last_name`)**: `User`
   - **Email (`email`)**: `eeeuser@gmail.com`
   - **Active**: `true`
4. Click **Save**.

#### Story 2: Roles Creation (`sys_user_role` & `sys_user_has_role`)
1. Navigate to **User Administration → Roles** and click **New**.
2. Create the four custom roles required for granular CRUD verification:
   - **`bb1`** — *Read access role for EEE branch records in Institution Details*
   - **`bb2`** — *Create access role (enables New button) for Institution Details*
   - **`bb3`** — *Write/Edit access role for EEE branch records in Institution Details*
   - **`bb4`** — *Delete access role for EEE branch records in Institution Details*
3. Open the **EEE User** record (`User Administration → Users`) and assign all four roles (`bb1`, `bb2`, `bb3`, `bb4`) in the **Roles** related list.

---

### Milestone-2: Tables Creation (`sys_db_object` & `sys_dictionary`)

#### Story 3: Creation of Table (`u_institution_details`)
1. In the Application Navigator, navigate to **System Definition → Tables** and click **New**.
2. Enter the table properties:
   - **Label**: `Institution Details`
   - **Name**: `u_institution_details`
   - **Extends table**: `false` (Leave blank / standalone table)
3. Under the **Columns** tab, use **Insert a new row** to create the 7 required fields:

| Column Label | Column Name | Type | Reference / Choice Values |
|---|---|---|---|
| **Student Roll Number** | `u_student_roll_number` | Auto Number | Prefix `INST`, 7 digits (`INST0001001`) |
| **Student Name** | `u_student_name` | Reference | `User [sys_user]` |
| **Faculty Name** | `u_faculty_name` | Reference | `User [sys_user]` |
| **Branch** | `u_branch` | Choice | `ECE`, `EEE`, `CSE` |
| **Email** | `u_email` | String | Max length: `100` |
| **Phone Number** | `u_phone_number` | String | Max length: `40` |
| **Description** | `u_description` | Multi String | Max length: `4000` |

4. Save the table, click **Show List** under Related Links, and create multiple student records across the **`ECE`**, **`EEE`**, and **`CSE`** branches.

---

### Milestone-3: Creation of Access Control List — READ (`sys_security_acl`)

#### Story 4: ACL Configuration (READ)
1. Click the User Profile menu and select **Elevate role → `security_admin`**.
2. Navigate to **System Security → Access Control (ACL)** and click **New**.
3. Configure the READ ACL:
   - **Type**: `record`
   - **Operation**: `read`
   - **Name**: `u_institution_details`
   - **Active**: `true`
   - **Advanced**: `true`
   - **Requires role**: `bb1`
   - **Data Condition**: `Branch is EEE` (`u_branch=EEE^EQ`)
   - **Script**:
     ```javascript
     (function () {
         // Allow admin users full access
         if (gs.hasRole('admin')) {
             return true;
         }
         // Allow only EEE branch users to see EEE records
         if (gs.hasRole('bb1')){
             return true;
         }
         // Deny access for all others
         return false;
     })();
     ```
4. Save the ACL record.

---

### Milestone-4: Creation of Access Control List — CREATE

#### Story 5: Creation of ACL-Create
1. Navigate to **System Security → Access Control (ACL)** and click **New**.
2. Configure the CREATE ACL:
   - **Type**: `record`
   - **Operation**: `create`
   - **Name**: `u_institution_details`
   - **Active**: `true`
   - **Requires role**: `bb2`
   - **Data Condition**: None
3. Save the ACL record.

---

### Milestone-5: Creation of Access Control List — WRITE

#### Story 6: Creation of ACL-Write
1. Navigate to **System Security → Access Control (ACL)** and click **New**.
2. Configure the WRITE ACL:
   - **Type**: `record`
   - **Operation**: `write`
   - **Name**: `u_institution_details`
   - **Active**: `true`
   - **Requires role**: `bb3`
   - **Data Condition**: None
3. Save the ACL record.

---

### Milestone-6: Creation of Access Control List — DELETE

#### Story 7: Creation of ACL-DELETE
1. Navigate to **System Security → Access Control (ACL)** and click **New**.
2. Configure the DELETE ACL:
   - **Type**: `record`
   - **Operation**: `delete`
   - **Name**: `u_institution_details`
   - **Active**: `true`
   - **Requires role**: `bb4`
   - **Data Condition**: None
3. Save the ACL record.

---

### Milestone-7: Conclusion & Verification

#### Story 8: Project Outcome
Impersonate **`EEE User`**, **`System Administrator`**, and an **Unauthorized User** to verify that READ, CREATE, WRITE, and DELETE operations strictly obey role and `Branch = EEE` field value conditions across lists and forms.
