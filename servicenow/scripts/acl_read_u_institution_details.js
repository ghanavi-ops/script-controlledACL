/**
 * ServiceNow Script-Controlled Access Control List (ACL) — READ Operation
 * =========================================================================
 * Milestone-3: Creation of Access Control List - READ
 *
 * ACL Configuration Details:
 *   - Type            : record
 *   - Operation       : read
 *   - Name            : u_institution_details (Institution Details)
 *   - Active          : true
 *   - Advanced        : true
 *   - Requires Role   : bb1
 *   - Data Condition  : Branch is EEE (u_branch = EEE)
 *
 * Evaluation Behavior:
 *   1. System Administrator ('admin') has full access to view all records across all branches.
 *   2. Users with the 'bb1' role pass the script check and, combined with the Data Condition
 *      (Branch is EEE), can view ONLY EEE branch records.
 *   3. Users without 'admin' or 'bb1' are denied read access to all records.
 */

(function () {
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
