export const FormSubmitError = ({ errorMessage }) => {
  return <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl">{errorMessage}</div>;
};

export const FormSubmitErrorV1 = ({ children }) => {
  return <div className="text-sm text-red-700 bg-destructive/10 p-3 rounded-xl">{children}</div>;
};
