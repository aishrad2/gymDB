USE gymDB;
# Data: Insert an instructor role into the Instructor database
-- INSERT INTO gymDB.Role(roleName, hourlyWage)
-- VALUES ('Instructor', '20');

-- # Data: Insert some employees into the Employee database
-- INSERT INTO gymDB.Employee(firstName, lastName, username, password, dateOfBirth, phoneNumber)
-- VALUES 
-- ('Jane', 'Smith', 'jsmith', 'password', '2000-01-10 10:00:00', '919-123-4567'),
-- ('Caroline', 'Jones', 'cjones', 'password', '1990-10-20 10:00:00', '919-456-9999'),
-- ('John', 'Grey', 'jgrey', 'password', '1989-12-22 3:30:00', '919-000-1099');


-- INSERT INTO gymDB.Employee_Role(employeeId, roleId)
-- VALUES (1,1), (2,1), (3,1);

# Get all employees who are instructors
SELECT firstName, lastName FROM gymDB.Employee
JOIN Employee_Role
ON Employee.employeeId = Employee_Role.employeeId
JOIN Role
ON Employee_Role.roleId = Role.roleId
WHERE roleName = 'Instructor';

-- INSERT INTO gymDB.Room(roomName)
-- VALUES
-- ('FL1 RM1.1'), ('FL1 RM1.2'), ('FL1 RM1.3'), 
-- ('FL2 RM2.1'), ('FL2 RM2.2'), ('FL2 RM2.3'), ('FL2 RM 2.4'),
-- ('FL3 RM3.1');


-- INSERT INTO gymDB.FitnessClass(fitnessClassName, fitnessClassType, startTime, endTime, fitnessClassCapacity, employeeId, roomId)
-- VALUES
-- ('Powerlifting: Beginner', 'Strength Training', '18:00:00', '19:00:00', 25, 1, 1);


INSERT INTO gymDB.FitnessClass(fitnessClassName, fitnessClassType, startTime, endTime, fitnessClassCapacity, employeeId, roomId)
VALUES
('Pilates', 'Yoga-Flexilibity', '19:30:00', '20:30:00', 12, 2, 2);

SELECT * FROM gymDB.FitnessClass;

-- SELECT * FROM gymDB.Day;

-- INSERT INTO gymDB.FitnessClass_Day(fitnessClassId, dayId)
-- VALUES
-- # weightlifting (id 1) taught on mondays and wednesdays (1, 3)
-- (1, 1),
-- (1, 3);

-- create a view for obtaining all fitness classes
CREATE OR REPLACE VIEW View_All_Fitness_Classes AS
SELECT FitnessClass.fitnessClassId, FitnessClass.fitnessClassName, FitnessClass.fitnessClassType, FitnessClass.startTime, fitnessClass.endTime,
Employee.firstName, Employee.lastName, Room.roomName, dayName FROM gymDB.FitnessClass
JOIN Employee on FitnessClass.employeeId = Employee.employeeId
JOIN Room on Room.roomId = FitnessClass.roomId
JOIN FitnessClass_Day on FitnessClass.fitnessClassId = FitnessClass_Day.fitnessClassId
JOIN Day on FitnessClass_Day.dayId = Day.dayId;

SELECT * FROM View_All_Fitness_Classes;


-- create a stored procedure for filtering fitness classes by type
DELIMITER //
CREATE PROCEDURE filterByType 
(
   fitnessClassTypeToLookFor varchar(25)
) 
BEGIN 
   SELECT FitnessClass.fitnessClassId, FitnessClass.fitnessClassName, FitnessClass.fitnessClassType, FitnessClass.startTime, fitnessClass.endTime,
	Employee.firstName, Employee.lastName, Room.roomName, dayName FROM gymDB.FitnessClass
	JOIN Employee on FitnessClass.employeeId = Employee.employeeId
	JOIN Room on Room.roomId = FitnessClass.roomId
	JOIN FitnessClass_Day on FitnessClass.fitnessClassId = FitnessClass_Day.fitnessClassId
	JOIN Day on FitnessClass_Day.dayId = Day.dayId
    WHERE fitnessClassType = fitnessClassTypeToLookFor;
    END//

DELIMITER ;

Call filterByType('Strength Training');
Call filterByType('Pilates');

-- create a stored procedure for filtering fitness classes by instructor
DELIMITER //
CREATE PROCEDURE filterByInstructor 
(
   instructorNameToLookFor varchar(25)
) 
BEGIN 
   SELECT FitnessClass.fitnessClassName, FitnessClass.fitnessClassId, FitnessClass.fitnessClassType, FitnessClass.startTime, fitnessClass.endTime,
	Employee.firstName, Employee.lastName, Room.roomName, dayName FROM gymDB.FitnessClass
	JOIN Employee on FitnessClass.employeeId = Employee.employeeId
	JOIN Room on Room.roomId = FitnessClass.roomId
	JOIN FitnessClass_Day on FitnessClass.fitnessClassId = FitnessClass_Day.fitnessClassId
	JOIN Day on FitnessClass_Day.dayId = Day.dayId
    WHERE CONCAT(Employee.firstName, ' ', Employee.lastName) = instructorNameToLookFor;
    END//

DELIMITER ;

Call filterByInstructor('Jane Smith');

INSERT INTO gymDB.Membership(fee, membershipName, membershipDescription)
VALUES
(50, 'Basic', 'No access to classes'),
(100, 'Deluxe', 'Access to classes');


INSERT INTO gymDB.Member(firstName, lastName, dateOfBirth, joinDate, membershipId, username, password)
VALUES
('Carolina', 'Bolnykh', '2025-04-19 00:00:00', '2025-04-19 00:00:00', 2, 'cbolnyk', 'password');

SELECT * FROM gymDB.FitnessClass;

INSERT INTO gymDB.Membership(fee, membershipName, membershipDescription)
VALUES
(50, 'Basic', 'No access to fitness classes'),
(100, 'Deluxe', 'Access to fitness classes');

  INSERT INTO 
    Member(firstName, lastName, dateOfBirth, joinDate, membershipId, username, password)
    VALUES ('Carolina', 'Bolnykh', '2005-10-19 00:00:00', NOW(), 2, 'cbolnyk', 'password');
    
SELECT * FROM gymDB.Member;

INSERT INTO gymDB.Member_FitnessClass
VALUES 
(1, 6),
(1,7);

-- creating a view for showing all classes the currently logged in user
-- is enrolled in
SELECT * FROM Member_FitnessClass;
DROP PROCEDURE IF EXISTS selectMyEnrolledClasses;
DELIMITER //
CREATE PROCEDURE selectMyEnrolledClasses 
(
   username varchar(25)
) 
BEGIN 
   SELECT FitnessClass.fitnessClassName, FitnessClass.fitnessClassId, FitnessClass.fitnessClassType, FitnessClass.startTime, fitnessClass.endTime,
	Employee.firstName, Employee.lastName, Room.roomName, dayName, Member.username FROM gymDB.FitnessClass
	JOIN Employee on FitnessClass.employeeId = Employee.employeeId
	JOIN Room on Room.roomId = FitnessClass.roomId
	JOIN FitnessClass_Day on FitnessClass.fitnessClassId = FitnessClass_Day.fitnessClassId
	JOIN Day on FitnessClass_Day.dayId = Day.dayId
    JOIN Member_FitnessClass on FitnessClass.fitnessClassId = Member_FitnessClass.fitnessClassId
    JOIN Member ON Member.memberId = Member_FitnessClass.memberId
    WHERE Member.username = username;
    END//

DELIMITER ;
-- Call selectMyEnrolledClasses('cbolnyk');

INSERT INTO gymDB.CurrentUser
VALUES (1, 'cbolnyk');
