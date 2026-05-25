import { canAdminAction } from "../../services/AdminActionPermissionService";

export default function AdminActionButton({
  action,
  children,
  className = "",
  disabled,
  title,
  onClick,
  as: Component = "button",
  ...props
}) {
  const allowed = canAdminAction(action);
  const finalDisabled = disabled || !allowed;

  const blockedTitle =
    title ||
    (!allowed
      ? "Bạn không có quyền thực hiện thao tác này."
      : "");

  const finalClassName = `${className} ${
    !allowed ? "cursor-not-allowed opacity-45 grayscale" : ""
  }`;

  return (
    <Component
      {...props}
      onClick={allowed ? onClick : undefined}
      disabled={Component === "button" ? finalDisabled : undefined}
      title={blockedTitle}
      className={finalClassName}
    >
      {children}
    </Component>
  );
}
