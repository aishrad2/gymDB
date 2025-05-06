# csc440-fp-team02

Create a  `.env` file in the root that includes: <br>
`MYSQL_HOST=localhost`<br>
`MYSQL_USER=(your username)`<br>
`MYSQL_PASSWORD=(your password)`<br>
`MYSQL_DATABASE=gymdb`<br>

Libraries that need to be installed<br>
Install npm and Node <br>
npm i to install all dependencies <br>
npm install cors <br> 
Clone repository

SQL setup <br>
SQL Dump file is under `database/db_schema`<br> 
Initial Data SQL file is also under `database/db_schema`<br> 
copy and paste both schemas into MySQLWorkbench before running the code <br>
then run the schema <br>

How to run the applicaiton <br>
First cd to the backend folder then in the terminal enter node login.js <br>

There are three type of roles:user, admin, employee/instructor, member/user<br>
First, you must register. Then, using the same credentials, you can log in and will be taken to the appropriate dashboard. When registering, make sure you select the appropriate role using the dropdown, and ensure the birth date is before the current date.<br>







