/**
 * ServiceNow Access Control List (ACL) — WRITE Operation
 * =========================================================================
 * Milestone-5: Creation of Access Control List - WRITE
 *
 * ACL Configuration Details:
 *   - Type            : record
 *   - Operation       : write
 *   - Name            : u_institution_details (Institution Details)
 *   - Active          : true
 *   - Requires Role   : bb3 (custom role)
 *   - Data Condition  : None required (Read ACL restricts visibility to EEE branch)
 *
 * Verification Outcome:
 *   - Users with 'bb1', 'bb2', and 'bb3' roles can view and edit (update)
 *     the EEE branch records along with using the 'New' button.
 */

(function () {
    if (gs.hasRole('admin') || gs.hasRole('bb3')) {
        return true;
    }
    return false;
})();
