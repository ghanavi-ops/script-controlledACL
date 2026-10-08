/**
 * ServiceNow Access Control List (ACL) — DELETE Operation
 * =========================================================================
 * Milestone-6: Creation of Access Control List - DELETE
 *
 * ACL Configuration Details:
 *   - Type            : record
 *   - Operation       : delete
 *   - Name            : u_institution_details (Institution Details)
 *   - Active          : true
 *   - Requires Role   : bb4 (custom role)
 *   - Data Condition  : None required
 *
 * Verification Outcome:
 *   - Users with 'bb1', 'bb2', 'bb3', and 'bb4' roles can view, create, edit,
 *     and delete the EEE branch records in u_institution_details.
 */

(function () {
    if (gs.hasRole('admin') || gs.hasRole('bb4')) {
        return true;
    }
    return false;
})();
