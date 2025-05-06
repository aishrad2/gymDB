INSERT INTO gymDB.Room(roomName)
VALUES
('Free Weights'), ('Machines'), ('Cardio Room'), 
('Studio'), ('Room 100'), ('Room 200'), ('Room 300'),
('Room 400');

INSERT INTO gymDB.Role(roleName, hourlyWage)
VALUES ('Instructor', 20), ('Admin', 30);

INSERT INTO gymDB.Membership(fee, membershipName, membershipDescription)
VALUES
(50, 'Basic', 'No access to fitness classes'),
(100, 'Deluxe', 'Access to fitness classes');

INSERT INTO gymDB.musclegroup (muscleGroupName)
VALUES
("Biceps"),
("Quads"),
("Glutes"),
("Chest"),
("Back"),
("Hamstrings"),
("Abs"),
("Full Body");

INSERT INTO gymDB.equipment (equipmentName, quantity, roomId, muscleGroupId)
VALUES 
("Bench Press", 4, 2, 1),
("Squat Rack", 6, 5, 2),
("Hip Thrust Machine", 3, 5, 3),
("Seated Arm Curl", 3, 2, 1),
("Seated Press", 5, 2, 4),
("Rowing Machine", 5, 3, 8),
("Lat Pulldown", 6, 2, 5),
("Seated Leg Curl", 3, 5, 6),
("Hanging Leg Raise", 2, 6, 7),
("Dumbbells", 40, 1, 8),
("Treadmill", 20, 3, 8),
("Medicine Balls", 15, 1, 8);
