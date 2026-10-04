Script-Controlled ACL – Restrict Record Access Based on Field Value

Objective

To restrict access to records in ServiceNow based on specific field values using a Script-Controlled Access Control List (ACL).

Description

A Script-Controlled ACL uses a custom JavaScript condition to determine whether a user can access a record. Access is granted only when the script evaluates to true.

Implementation Steps

1. Open the ServiceNow instance.
2. Navigate to System Security → Access Control (ACL).
3. Create or configure an ACL for the required table and operation.
4. Add the appropriate script to check the required field value and user permissions.
5. Test the ACL with authorized and unauthorized users.

Expected Result

Authorized users can access records that satisfy the configured conditions. Other users are denied access according to the ACL rules.

Technologies Used

- ServiceNow
- Access Control Lists (ACL)
- JavaScript
