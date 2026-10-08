/**
 * ServiceNow Access Control List (ACL) — CREATE Operation
 * =========================================================================
 * Milestone-4: Creation of Access Control List - CREATE
 *
 * ACL Configuration Details:
 *   - Type            : record
 *   - Operation       : create
 *   - Name            : u_institution_details (Institution Details)
 *   - Active          : true
 *   - Requires Role   : bb2 (custom role)
 *   - Data Condition  : None required
 *
 * Verification Outcome:
 *   - Users with 'bb1' & 'bb2' roles can view only EEE branch records
 *     AND have access to the 'New' button to create records in u_institution_details.
 */

(function () {
    if (gs.hasRole('admin') || gs.hasRole('bb2')) {
        return true;
    }
    return false;
})();
