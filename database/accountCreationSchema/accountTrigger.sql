DELIMITER //
CREATE TRIGGER RegisterAndLogInMember
AFTER INSERT ON member
FOR EACH ROW 
BEGIN 
	INSERT INTO currentuser 
    VALUES (NEW.memberId, NEW.username);
END;
//
DELIMITER ;

DELIMITER //
CREATE TRIGGER RegisterAndLogInEmployee
AFTER INSERT ON employee
FOR EACH ROW 
BEGIN 
	INSERT INTO currentuser 
    VALUES (NEW.employeeId, NEW.username);
END;
//
DELIMITER ;