import { CodeValidation } from '../entities/code-validation.entity';

export interface CodeValidationRepository {
  create(codevalidation: CodeValidation): Promise<CodeValidation>;
  save(codevalidation: CodeValidation): Promise<CodeValidation>;
  findByValue(value: string): Promise<CodeValidation | null>;
}
