package com.example.employee_management.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.employee_management.model.Employee;

@Service
public class EmployeeService {

    private final List<Employee> employees = new ArrayList<>();

    // Constructor (initial data)
    public EmployeeService() {
        employees.add(new Employee(1L, "Rahul", "IT", 50000));
        employees.add(new Employee(2L, "Aman", "HR", 40000));
    }

    // Get all employees
    public List<Employee> getAllEmployees() {
        return employees;
    }

    // Get employee by ID
    public Employee getEmployeeById(Long id) {
        return employees.stream()
                .filter(emp -> emp.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    // Add employee
    public Employee addEmployee(Employee employee) {
        employees.add(employee);
        return employee;
    }

    // Update employee
    public Employee updateEmployee(Long id, Employee updatedEmployee) {
        Employee employee = getEmployeeById(id);

        if (employee != null) {
            employee.setName(updatedEmployee.getName());
            employee.setDepartment(updatedEmployee.getDepartment());
            employee.setSalary(updatedEmployee.getSalary());
        }

        return employee;
    }

    // Delete employee
    public String deleteEmployee(Long id) {
        employees.removeIf(emp -> emp.getId().equals(id));
        return "Employee deleted successfully";
    }
}