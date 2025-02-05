import inquirer from 'inquirer';
import pool from './db';

// Function to display the main menu
const mainMenu = async (): Promise<void> => {
    try {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    'View all departments',
                    'View all roles',
                    'View all employees',
                    'Add a department',
                    'Add a role',
                    'Add an employee',
                    'Update an employee role',
                    'Exit'
                ]
            }
        ]);

        switch (action) {
            case 'View all departments':
                await viewDepartments();
                break;
            case 'View all roles':
                await viewRoles();
                break;
            case 'View all employees':
                await viewEmployees();
                break;
            case 'Add a department':
                await addDepartment();
                break;
            case 'Add a role':
                await addRole();
                break;
            case 'Add an employee':
                await addEmployee();
                break;
            case 'Update an employee role':
                await updateEmployeeRole();
                break;
            case 'Exit':
                console.log('Goodbye!');
                process.exit();
        }

        mainMenu();
    } catch (error) {
        console.error('Error in main menu:', error);
        mainMenu();
    }
};

// Function to view all departments
const viewDepartments = async (): Promise<void> => {
    try {
        const { rows } = await pool.query('SELECT * FROM department');
        console.table(rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
};

// Function to view all roles
const viewRoles = async (): Promise<void> => {
    try {
        const { rows } = await pool.query(`
            SELECT role.id, role.title, role.salary, department.name AS department
            FROM role
            JOIN department ON role.department_id = department.id`);
        console.table(rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
    }
};

// Function to view all employees
const viewEmployees = async (): Promise<void> => {
    try {
        const { rows } = await pool.query(`
            SELECT employee.id, employee.first_name, employee.last_name, role.title AS job_title, department.name AS department, role.salary, 
                   COALESCE(manager.first_name || ' ' || manager.last_name, 'None') AS manager
            FROM employee
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id
            LEFT JOIN employee AS manager ON employee.manager_id = manager.id`);
        console.table(rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
};

// Function to add a new department
const addDepartment = async (): Promise<void> => {
    try {
        const { name } = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter the department name:'
            }
        ]);

        await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
        console.log(`Department "${name}" added successfully!`);
    } catch (error) {
        console.error('Error adding department:', error);
    }
};

// Function to add a new role
const addRole = async (): Promise<void> => {
    try {
        const { rows: departments } = await pool.query('SELECT * FROM department');

        if (departments.length === 0) {
            console.log('No departments found. Please add a department first.');
            return;
        }

        const { title, salary, department_id } = await inquirer.prompt([
            { type: 'input', name: 'title', message: 'Enter the role title:' },
            { 
                type: 'input', 
                name: 'salary', 
                message: 'Enter the salary for this role:',
                validate: input => !isNaN(parseFloat(input)) ? true : 'Please enter a valid number'
            },
            { 
                type: 'list', 
                name: 'department_id', 
                message: 'Select the department:',
                choices: departments.map(dept => ({ name: dept.name, value: dept.id }))
            }
        ]);

        await pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, department_id]);
        console.log(`Role "${title}" added successfully!`);
    } catch (error) {
        console.error('Error adding role:', error);
    }
};

// Function to add a new employee
const addEmployee = async (): Promise<void> => {
    try {
        const { rows: roles } = await pool.query('SELECT * FROM role');
        const { rows: employees } = await pool.query('SELECT * FROM employee');

        if (roles.length === 0) {
            console.log('No roles found. Please add a role first.');
            return;
        }

        const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
            { type: 'input', name: 'first_name', message: 'Enter the employee\'s first name:' },
            { type: 'input', name: 'last_name', message: 'Enter the employee\'s last name:' },
            { 
                type: 'list', 
                name: 'role_id', 
                message: 'Select the employee\'s role:', 
                choices: roles.map(role => ({ name: role.title, value: role.id }))
            },
            { 
                type: 'list', 
                name: 'manager_id', 
                message: 'Select the employee\'s manager (or choose "None" if they have no manager):',
                choices: [{ name: 'None', value: null }, ...employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }))]
            }
        ]);

        await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [first_name, last_name, role_id, manager_id]);
        console.log(`Employee "${first_name} ${last_name}" added successfully!`);
    } catch (error) {
        console.error('Error adding employee:', error);
    }
};

// Function to update an employee's role
const updateEmployeeRole = async (): Promise<void> => {
    try {
        const { rows: employees } = await pool.query('SELECT * FROM employee');
        const { rows: roles } = await pool.query('SELECT * FROM role');

        if (employees.length === 0) {
            console.log('No employees found. Please add an employee first.');
            return;
        }

        if (roles.length === 0) {
            console.log('No roles found. Please add a role first.');
            return;
        }

        const { employee_id, new_role_id } = await inquirer.prompt([
            { 
                type: 'list', 
                name: 'employee_id', 
                message: 'Select the employee to update:', 
                choices: employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }))
            },
            { 
                type: 'list', 
                name: 'new_role_id', 
                message: 'Select the new role:', 
                choices: roles.map(role => ({ name: role.title, value: role.id }))
            }
        ]);

        await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [new_role_id, employee_id]);
        console.log('Employee role updated successfully!');
    } catch (error) {
        console.error('Error updating employee role:', error);
    }
};

// Start the application
mainMenu();