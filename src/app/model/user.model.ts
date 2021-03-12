export class User {
    firstName: string;
    lastName: string;
    email: string;
    userId?: number;

    constructor(firstName: string, lastName: string, email: string, userId?: number) {
      this.firstName = firstName;
      this.lastName = lastName;
      this.email = email;
      this.userId = userId;
    }
}
