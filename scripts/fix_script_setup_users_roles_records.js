/**
 * ServiceNow Fix / Background Script — Milestone 1 & Milestone 2 Provisioning
 * ============================================================================
 * Automates the creation of:
 *   1. Test User: 'EEE User' (First name: EEE, Last name: User, Email: eeeuser@gmail.com)
 *   2. Custom Roles: 'bb1', 'bb2', 'bb3', 'bb4'
 *   3. Role Assignments to 'EEE User'
 *   4. Multi-branch Student Records in 'u_institution_details' (ECE, EEE, CSE)
 */

(function provisionScriptControlledACL() {
    // 1. Create or retrieve 'EEE User'
    var userSysId = '';
    var userGR = new GlideRecord('sys_user');
    userGR.addQuery('user_name', 'EEE User');
    userGR.query();
    if (userGR.next()) {
        userSysId = userGR.getUniqueValue();
    } else {
        userGR.initialize();
        userGR.setValue('user_name', 'EEE User');
        userGR.setValue('first_name', 'EEE');
        userGR.setValue('last_name', 'User');
        userGR.setValue('email', 'eeeuser@gmail.com');
        userGR.setValue('active', true);
        userSysId = userGR.insert();
        gs.info('Created test user EEE User with sys_id: ' + userSysId);
    }

    // 2. Create custom roles bb1, bb2, bb3, bb4 and assign to EEE User
    var roleDefinitions = [
        { name: 'bb1', description: 'Read access role for EEE branch records in u_institution_details' },
        { name: 'bb2', description: 'Create access role (New button) for u_institution_details' },
        { name: 'bb3', description: 'Write/Edit access role for u_institution_details' },
        { name: 'bb4', description: 'Delete access role for u_institution_details' }
    ];

    for (var i = 0; i < roleDefinitions.length; i++) {
        var roleDef = roleDefinitions[i];
        var roleSysId = '';
        var roleGR = new GlideRecord('sys_user_role');
        roleGR.addQuery('name', roleDef.name);
        roleGR.query();
        if (roleGR.next()) {
            roleSysId = roleGR.getUniqueValue();
        } else {
            roleGR.initialize();
            roleGR.setValue('name', roleDef.name);
            roleGR.setValue('description', roleDef.description);
            roleSysId = roleGR.insert();
            gs.info('Created custom role: ' + roleDef.name);
        }

        // Assign role to EEE User
        if (userSysId && roleSysId) {
            var hasRoleGR = new GlideRecord('sys_user_has_role');
            hasRoleGR.addQuery('user', userSysId);
            hasRoleGR.addQuery('role', roleSysId);
            hasRoleGR.query();
            if (!hasRoleGR.next()) {
                hasRoleGR.initialize();
                hasRoleGR.setValue('user', userSysId);
                hasRoleGR.setValue('role', roleSysId);
                hasRoleGR.setValue('state', 'active');
                hasRoleGR.insert();
                gs.info('Assigned role ' + roleDef.name + ' to EEE User');
            }
        }
    }

    // 3. Seed sample records in u_institution_details across EEE, ECE, and CSE branches
    var sampleRecords = [
        {
            roll: 'INST0001001',
            student: 'Ghanavi N',
            faculty: 'Dr. Ramesh Kumar',
            branch: 'EEE',
            email: 'ghanavi.eee@institution.edu',
            phone: '+91-9876543210',
            description: 'Power Systems & High Voltage Engineering track — Active EEE Student Record'
        },
        {
            roll: 'INST0001002',
            student: 'Selvadevi R',
            faculty: 'Prof. Anitha Sharma',
            branch: 'EEE',
            email: 'selvadevi.eee@institution.edu',
            phone: '+91-9876543211',
            description: 'Control Systems & Embedded Drives laboratory — Active EEE Student Record'
        },
        {
            roll: 'INST0001003',
            student: 'Yakshini M',
            faculty: 'Dr. Suresh Verma',
            branch: 'ECE',
            email: 'yakshini.ece@institution.edu',
            phone: '+91-9876543212',
            description: 'VLSI Design & Wireless Communication — ECE Branch Record (Restricted from EEE role)'
        },
        {
            roll: 'INST0001004',
            student: 'Aswin S',
            faculty: 'Dr. Meenakshi Iyer',
            branch: 'CSE',
            email: 'aswin.cse@institution.edu',
            phone: '+91-9876543213',
            description: 'Cloud Computing & Cybersecurity Architecture — CSE Branch Record (Restricted from EEE role)'
        },
        {
            roll: 'INST0001005',
            student: 'EEE User',
            faculty: 'Dr. Ramesh Kumar',
            branch: 'EEE',
            email: 'eeeuser@gmail.com',
            phone: '+91-9876543214',
            description: 'Renewable Energy & Smart Grid Systems — Active EEE Student Record'
        }
    ];

    for (var j = 0; j < sampleRecords.length; j++) {
        var rec = sampleRecords[j];
        var instGR = new GlideRecord('u_institution_details');
        instGR.addQuery('u_student_roll_number', rec.roll);
        instGR.query();
        if (!instGR.next()) {
            instGR.initialize();
            instGR.setValue('u_student_roll_number', rec.roll);
            instGR.setValue('u_student_name', rec.student);
            instGR.setValue('u_faculty_name', rec.faculty);
            instGR.setValue('u_branch', rec.branch);
            instGR.setValue('u_email', rec.email);
            instGR.setValue('u_phone_number', rec.phone);
            instGR.setValue('u_description', rec.description);
            instGR.insert();
        }
    }

    gs.info('Provisioning of u_institution_details records completed successfully.');
})();
