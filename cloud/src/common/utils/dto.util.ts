import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'OneOf', async: false })
export class OneOfConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const fields = args.constraints; // e.g., ['email', 'name']

    // Count how many of the specified fields have values
    const presentFields = fields.filter(
      (field) =>
        object[field] !== undefined &&
        object[field] !== null &&
        object[field] !== '',
    );

    return presentFields.length === 1;
  }

  defaultMessage(args: ValidationArguments) {
    return `Exactly one of the following fields must be provided: ${args.constraints.join(', ')}`;
  }
}
