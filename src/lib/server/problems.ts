// Messages/codes in this class are authored by the app, never raw provider errors.
export class AuthProblem extends Error {
  constructor(
    message: string,
    public status = 401,
    public code = "AUTH_REQUIRED",
  ) {
    super(message);
    this.name = "AuthProblem";
  }
}
