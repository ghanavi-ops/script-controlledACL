# ServiceNow Script-Controlled ACL Architecture (`u_institution_details`)

## 1. Overview
This project implements record-level security on the custom ServiceNow table **`Institution Details` (`u_institution_details`)** using **Script-Controlled Access Control Lists (ACLs)**. By combining role-based access control (`bb1`, `bb2`, `bb3`, `bb4`, and `admin`), data conditions (`Branch is EEE`), and server-side `GlideSystem` scripting (`gs.hasRole()`), the architecture ensures that non-administrative users with the `bb1` role can only view and operate on **`EEE` branch records**, while `ECE` and `CSE` branch records remain strictly protected.

---

## 2. Component & Security Evaluation Architecture

```text
+---------------------------------------------------------------------------------------------------+
|                           ServiceNow Platform — System Security (ACL)                             |
+---------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
|                   Target Table: Institution Details [u_institution_details]                       |
|   Columns: u_student_roll_number | u_student_name | u_faculty_name | u_branch (ECE, EEE, CSE)     |
|            u_email               | u_phone_number | u_description                                 |
+---------------------------------------------------------------------------------------------------+
                                                 |
       +--------------------+--------------------+--------------------+--------------------+
       |                    |                    |                    |                    |
       v                    v                    v                    v                    v
+--------------+    +---------------+    +---------------+    +---------------+    +---------------+
| READ ACL     |    | CREATE ACL    |    | WRITE ACL     |    | DELETE ACL    |    | Admin Override|
| Role: bb1    |    | Role: bb2     |    | Role: bb3     |    | Role: bb4     |    | Role: admin   |
| Cond: EEE    |    | Cond: None    |    | Cond: None    |    | Cond: None    |    | Full Access   |
| Script: true |    | New Button ON |    | Edit EEE Recs |    | Del EEE Recs  |    | ECE, EEE, CSE |
+------+-------+    +-------+-------+    +-------+-------+    +-------+-------+    +-------+-------+
       |                    |                    |                    |                    |
       +--------------------+--------------------+--------------------+--------------------+
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
|                             Record Access Decision Matrix (Runtime)                               |
|  1. System Administrator (admin)      -> View/Create/Edit/Delete ALL branches (EEE, ECE, CSE)     |
|  2. EEE User (bb1)                    -> View ONLY EEE branch records; ECE & CSE hidden           |
|  3. EEE User (bb1 + bb2)              -> View EEE records + Create new records ('New' button)     |
|  4. EEE User (bb1 + bb2 + bb3)        -> View EEE records + Create + Edit ('Write') EEE records   |
|  5. EEE User (bb1 + bb2 + bb3 + bb4)  -> Full CRUD on EEE branch records only                     |
|  6. Unauthorized User (No roles)      -> Access Denied (0 records visible)                        |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. ServiceNow ACL Evaluation Pipeline
When a user requests `u_institution_details.list` or opens a record form, ServiceNow evaluates the `record` ACL rule in three sequential stages:

1. **Privilege & Role Check (`Requires role`)**:
   - Checks whether the logged-in user possesses the required role (`bb1` for `read`, `bb2` for `create`, `bb3` for `write`, `bb4` for `delete`) or `admin` override.
2. **Data Condition Evaluation (`Condition`)**:
   - For the `read` ACL, verifies that the record field `u_branch` equals `EEE` (`u_branch=EEE^EQ`). Records with `u_branch=ECE` or `u_branch=CSE` fail this condition for non-admin users.
3. **Server-Side Script Execution (`Script`)**:
   - Executes the custom JavaScript block using `gs.hasRole('admin')` and `gs.hasRole('bb1')`. Access is granted only when all stages evaluate to `true`.
