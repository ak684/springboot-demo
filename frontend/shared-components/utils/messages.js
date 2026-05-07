export default {
  errors: {
    validation: {
      required: 'This field is required',
      email: 'This is not a valid email',
      passwordMinLength: 'Password minimum length is 6 symbols',
      arrayMin: 'This field cannot be empty',
      confirmPassword: 'Passwords do not match',
      number: 'Should be a number',
      minValue: (val) => `The minimum value is ${val}`,
      maxValue: (val) => `The maximum value is ${val}`,
      url: 'This is not a valid URL',
      dateOrder: 'End date cannot be before start date'
    },
  },
};
