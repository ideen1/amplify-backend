// this adds a compile-time constraint on the generics
type NestedAssignable<T, F extends T> = never;

// as is from test this does not catch function break :-(
type NoBreakingChanges = NestedAssignable<
  Pick<
    typeof import('./client_config_new.js'),
    keyof typeof import('./client_config_old.js')
  >,
  typeof import('./client_config_old.js')
>;

// this does catch function break.
type NoBreakingChanges = NestedAssignable<
  Pick<
    typeof import('./client_config_old.js'),
    keyof typeof import('./client_config_old.js')
    >,
  typeof import('./client_config_new.js')
  >;
