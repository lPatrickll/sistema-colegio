// src/Login/application/login.usecase.ts
import { LoginFirebaseRepository } from "../repository/login.firebase.repository";
import { AuthUser, LoginCredentials } from "../domain/login.types";

export class LoginUseCase {
  private readonly repo: LoginFirebaseRepository;

  constructor(repo?: LoginFirebaseRepository) {
    this.repo = repo ?? new LoginFirebaseRepository();
  }

  async execute(credentials: LoginCredentials): Promise<AuthUser> {
    return this.repo.login(credentials);
  }
}

export class LogoutUseCase {
  private readonly repo: LoginFirebaseRepository;

  constructor(repo?: LoginFirebaseRepository) {
    this.repo = repo ?? new LoginFirebaseRepository();
  }

  async execute(): Promise<void> {
    return this.repo.logout();
  }
}
