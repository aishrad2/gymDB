DELIMITER //

CREATE PROCEDURE enrollment_transaction(
    IN p_memberId INT, 
    IN p_fitnessClassId INT
)
BEGIN
    DECLARE classCapacity INT;
    DECLARE currentEnrollment INT;
    DECLARE memName VARCHAR(45);
    DECLARE memberAlreadyEnrolled INT;
    
    -- Start the transaction
    START TRANSACTION;
    
    -- Retrieve the member's membership name
    SELECT membershipName INTO memName
    FROM Member AS m
    JOIN Membership ON Membership.membershipId = m.membershipId
    WHERE m.memberId = p_memberId;
    
    -- Check if the member's membership is 'Deluxe'
    IF memName != 'Deluxe' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membership must be Deluxe to enroll.';
    END IF;

    -- Check if the class is at capacity
    SELECT fitnessClassCapacity INTO classCapacity
    FROM FitnessClass
    WHERE fitnessClassId = p_fitnessClassId;

    SELECT COUNT(*) INTO currentEnrollment
    FROM Member_FitnessClass
    WHERE fitnessClassId = p_fitnessClassId;

    IF currentEnrollment >= classCapacity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The class is already at full capacity.';
    END IF;

    -- Check if the member is already enrolled in the fitness class
    SELECT COUNT(*) INTO memberAlreadyEnrolled
    FROM Member_FitnessClass
    WHERE memberId = p_memberId AND fitnessClassId = p_fitnessClassId;

    IF memberAlreadyEnrolled > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The member is already enrolled in this class.';
    END IF;

    -- If all checks pass, enroll the member in the class
    INSERT INTO Member_FitnessClass (memberId, fitnessClassId)
    VALUES (p_memberId, p_fitnessClassId);
    
    -- Commit the transaction
    COMMIT;
    
END //

DELIMITER ;