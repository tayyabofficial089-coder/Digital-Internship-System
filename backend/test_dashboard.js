const jwt = require('jsonwebtoken');
const sequelize = require('./src/config/database');
const { User, CompanyHR, Internship, Application, Supervisor } = require('./src/models');
require('dotenv').config();

async function testCompanyDashboard() {
    try {
        await sequelize.authenticate();
        
        // Get a company HR user
        const companyUser = await User.findOne({ where: { role: 'company_hr' } });
        if (!companyUser) {
            console.log("No company user found");
            process.exit();
        }

        const company = await CompanyHR.findOne({ where: { userId: companyUser.id } });
        console.log(`Company ID: ${company.id}, Name: ${companyUser.name}`);

        const internships = await Internship.findAll({ where: { companyHRId: company.id } });
        console.log(`Total Internships: ${internships.length}`);

        const applications = await Application.findAll({
            include: [{
                model: Internship,
                where: { companyHRId: company.id }
            }]
        });
        console.log(`Total Applications: ${applications.length}`);

        const supervisors = await Supervisor.findAll({ where: { companyHRId: company.id } });
        console.log(`Total Supervisors: ${supervisors.length}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testCompanyDashboard();
