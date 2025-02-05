-- Insert departments
INSERT INTO department (name) VALUES 
('HR'), 
('Engineering'), 
('Finance');

-- Insert roles
INSERT INTO role (title, salary, department_id) VALUES 
('Software Engineer', 75000, 2),
('Accountant', 60000, 3),
('HR Manager', 80000, 1);

-- Insert employees
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES 
('Alice', 'Johnson', 1, NULL),
('Bob', 'Smith', 2, 1),
('Charlie', 'Davis', 3, NULL);