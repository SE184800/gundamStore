import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import {
  createAdminRoleApi,
  createAdminUserApi,
  getAdminRolesApi,
  getAdminUsersApi,
  updateAdminRoleApi,
  updateAdminUserApi,
} from "../../services/AdminUserApiService";

const ACTIVE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function passwordPolicyErrors(password = "") {
  const value = String(password || "");
  const errors = [];

  if (value.length < 12) errors.push("ít nhất 12 ký tự");
  if (!/[a-z]/.test(value)) errors.push("1 chữ thường");
  if (!/[A-Z]/.test(value)) errors.push("1 chữ hoa");
  if (!/[0-9]/.test(value)) errors.push("1 chữ số");
  if (!/[^A-Za-z0-9]/.test(value)) errors.push("1 ký tự đặc biệt");
  if (/\s/.test(value)) errors.push("không có khoảng trắng");

  return errors;
}

function roleTone(code = "") {
  const value = String(code || "").toUpperCase();

  if (value === "ADMIN" || value === "SUPER_ADMIN") return "bg-red-50 text-red-700";
  if (value === "MANAGER") return "bg-violet-50 text-violet-700";
  if (value === "STAFF") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function emptyUserDraft(defaultRoleId = "") {
  return {
    id: "",
    name: "",
    email: "",
    password: "",
    roleId: defaultRoleId,
    active: true,
  };
}

function emptyRoleDraft() {
  return {
    id: "",
    code: "",
    name: "",
    permissions: [],
  };
}

export default function AdminUsers() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [summary, setSummary] = useState({});
  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("");
  const [active, setActive] = useState("ALL");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [userDraft, setUserDraft] = useState(emptyUserDraft());
  const [roleDraft, setRoleDraft] = useState(emptyRoleDraft());
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const roleOptions = useMemo(() => {
    return [
      { value: "", label: "All roles" },
      ...roles.map((role) => ({ value: role.id, label: `${role.code} · ${role.name}` })),
    ];
  }, [roles]);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [userData, roleData] = await Promise.all([
        getAdminUsersApi({ q: query, roleId, active }),
        getAdminRolesApi(),
      ]);

      setUsers(userData.users || []);
      setSummary(userData.summary || {});
      setRoles(roleData.roles || []);
      setPermissions(roleData.permissions || []);
    } catch (error) {
      setApiError(error?.message || "Cannot load user center.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, active]);

  function openCreateUser() {
    setTemporaryPassword("");
    setUserDraft(emptyUserDraft(roles[0]?.id || ""));
    setUserDrawerOpen(true);
  }

  function openEditUser(user) {
    setTemporaryPassword("");
    setUserDraft({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      password: "",
      roleId: user.roleId || user.role?.id || "",
      active: user.active !== false,
    });
    setUserDrawerOpen(true);
  }

  function openCreateRole() {
    setRoleDraft(emptyRoleDraft());
    setRoleDrawerOpen(true);
  }

  function openEditRole(role) {
    setRoleDraft({
      id: role.id,
      code: role.code || "",
      name: role.name || "",
      permissions: role.permissions || [],
    });
    setRoleDrawerOpen(true);
  }

  async function saveUser() {
    try {
      const passwordErrors = userDraft.password
        ? passwordPolicyErrors(userDraft.password)
        : [];

      if (passwordErrors.length) {
        alert(`Mật khẩu cần: ${passwordErrors.join(", ")}.`);
        return;
      }

      const payload = {
        name: userDraft.name,
        roleId: userDraft.roleId,
        active: userDraft.active !== false,
        ...(userDraft.password ? { password: userDraft.password } : {}),
      };

      if (userDraft.id) {
        await updateAdminUserApi(userDraft.id, payload);
        setUserDrawerOpen(false);
        await reload();
        return;
      }

      const created = await createAdminUserApi({
        ...payload,
        email: userDraft.email,
      });

      setTemporaryPassword(created.temporaryPassword || "");
      await reload();
    } catch (error) {
      alert(error?.message || "Cannot save user.");
    }
  }

  async function saveRole() {
    try {
      const payload = {
        code: roleDraft.code,
        name: roleDraft.name,
        permissions: roleDraft.permissions,
      };

      if (roleDraft.id) {
        await updateAdminRoleApi(roleDraft.id, payload);
      } else {
        await createAdminRoleApi(payload);
      }

      setRoleDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Cannot save role.");
    }
  }

  function togglePermission(code) {
    setRoleDraft((prev) => {
      const exists = prev.permissions.includes(code);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((item) => item !== code)
          : [...prev.permissions, code],
      };
    });
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Access control"
        title="Admin User / Role / Permission Center"
        desc="Manage admin accounts, role assignment, active status, password reset, and role permissions."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void reload()}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={15} className="mr-1 inline" />
              {loading ? "Loading..." : "Refresh"}
            </button>
            <button
              onClick={tab === "users" ? openCreateUser : openCreateRole}
              className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
            >
              <Plus size={15} className="mr-1 inline" />
              {tab === "users" ? "New user" : "New role"}
            </button>
          </div>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Users</p>
          <p className="mt-2 text-2xl font-black">{summary.total || users.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.active || 0}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Admins</p>
          <p className="mt-2 text-2xl font-black text-red-600">{summary.admins || 0}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Roles</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{roles.length}</p>
        </div>
      </section>

      <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTab("users")}
            className={`rounded-2xl px-4 py-2 text-xs font-black ${
              tab === "users" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <Users size={14} className="mr-1 inline" />
            Users
          </button>
          <button
            onClick={() => setTab("roles")}
            className={`rounded-2xl px-4 py-2 text-xs font-black ${
              tab === "roles" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <ShieldCheck size={14} className="mr-1 inline" />
            Roles & permissions
          </button>
        </div>

        {tab === "users" && (
          <div className="grid gap-3 lg:grid-cols-[220px_220px_1fr_auto]">
            <AdminSelect label="Role" options={roleOptions} value={roleId} onChange={setRoleId} />
            <AdminSelect label="Active" options={ACTIVE_OPTIONS} value={active} onChange={setActive} />
            <div>
              <label className="text-xs font-black uppercase text-slate-400">Search</label>
              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-3">
                <Search size={16} className="text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, role..."
                  className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => void reload()}
              className="self-end rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white"
            >
              Search
            </button>
          </div>
        )}
      </section>

      {tab === "users" ? (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <UserRound size={18} />
                        </div>
                        <div>
                          <div className="font-black text-slate-950">{user.name}</div>
                          <div className="text-xs font-bold text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${roleTone(user.role?.code)}`}>
                        {user.role?.code || "-"}
                      </span>
                      <div className="mt-1 text-xs font-bold text-slate-500">{user.role?.name || "-"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-black text-slate-600">
                        {user.role?.permissions?.length || 0} permission(s)
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {user.active ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            <CheckCircle2 size={13} className="mr-1 inline" />
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                            <XCircle size={13} className="mr-1 inline" />
                            Inactive
                          </span>
                        )}

                        {user.mustChangePassword && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                            <KeyRound size={12} className="mr-1 inline" />
                            Must change password
                          </span>
                        )}

                        {user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now() && (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-black text-red-700">
                            Locked until {shortDate(user.lockedUntil)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-500">{shortDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditUser(user)}
                        className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!users.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {roles.map((role) => (
            <article key={role.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${roleTone(role.code)}`}>
                    {role.code}
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-950">{role.name}</h3>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {role.activeUserCount || 0}/{role.userCount || 0} active user(s)
                  </p>
                </div>
                <button
                  onClick={() => openEditRole(role)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                >
                  Edit role
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(role.permissions || []).slice(0, 14).map((permission) => (
                  <span key={permission} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                    {permission}
                  </span>
                ))}
                {(role.permissions || []).length > 14 && (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">
                    +{role.permissions.length - 14}
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      <AdminDrawer
        open={userDrawerOpen}
        title={userDraft.id ? "Edit admin user" : "Create admin user"}
        onClose={() => setUserDrawerOpen(false)}
        onSave={() => void saveUser()}
        saveLabel={userDraft.id ? "Save user" : "Create user"}
        width="max-w-2xl"
      >
        <div className="space-y-4">
          {temporaryPassword && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-black text-amber-800">
              Mật khẩu tạm dùng một lần: <span className="font-mono">{temporaryPassword}</span>
              <div className="mt-2 text-xs font-bold">Hãy gửi riêng cho user. Hệ thống sẽ bắt đổi ngay lần đăng nhập đầu.</div>
            </div>
          )}

          <AdminTextField label="Name" value={userDraft.name} onChange={(value) => setUserDraft((prev) => ({ ...prev, name: value }))} />
          <AdminTextField label="Email" type="email" value={userDraft.email} disabled={Boolean(userDraft.id)} onChange={(value) => setUserDraft((prev) => ({ ...prev, email: value }))} />
          <AdminSelect label="Role" options={roleOptions.filter((item) => item.value)} value={userDraft.roleId} onChange={(value) => setUserDraft((prev) => ({ ...prev, roleId: value }))} />
          <AdminTextField
            label={userDraft.id ? "Mật khẩu tạm mới (bỏ trống nếu không reset)" : "Mật khẩu tạm (bỏ trống để tự tạo)"}
            type="password"
            value={userDraft.password}
            onChange={(value) => setUserDraft((prev) => ({ ...prev, password: value }))}
          />
          <AdminToggle label="Active" checked={userDraft.active !== false} onChange={(value) => setUserDraft((prev) => ({ ...prev, active: value }))} />

          {userDraft.password && passwordPolicyErrors(userDraft.password).length > 0 && (
            <div className="rounded-2xl bg-red-50 p-3 text-xs font-black leading-5 text-red-700">
              Mật khẩu cần: {passwordPolicyErrors(userDraft.password).join(", ")}.
            </div>
          )}

          <div className="rounded-2xl bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-800">
            <KeyRound size={14} className="mr-1 inline" />
            Tối thiểu 12 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt. Tạo mới hoặc reset đều bắt user tự đổi mật khẩu ở lần đăng nhập kế tiếp.
          </div>
        </div>
      </AdminDrawer>

      <AdminDrawer
        open={roleDrawerOpen}
        title={roleDraft.id ? "Edit role permissions" : "Create role"}
        onClose={() => setRoleDrawerOpen(false)}
        onSave={() => void saveRole()}
        saveLabel={roleDraft.id ? "Save role" : "Create role"}
        width="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <AdminTextField label="Role code" value={roleDraft.code} onChange={(value) => setRoleDraft((prev) => ({ ...prev, code: value }))} />
            <AdminTextField label="Role name" value={roleDraft.name} onChange={(value) => setRoleDraft((prev) => ({ ...prev, name: value }))} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
              <ShieldAlert size={16} />
              Permissions
            </div>

            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {permissions.map((permission) => {
                const checked = roleDraft.permissions.includes(permission.code);

                return (
                  <label
                    key={permission.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm transition ${
                      checked ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(permission.code)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-black text-slate-900">{permission.code}</span>
                      <span className="block text-xs font-bold text-slate-500">{permission.name}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
