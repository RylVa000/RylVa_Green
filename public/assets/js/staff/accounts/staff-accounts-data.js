"use strict";

window.staffAccountsFixture = Object.freeze(
[
  {
    id: "superadmin-01",
    name: "SuperAdmin RylVa",
    email: "superadmin@rylva.green",
    phone: "+6281212345678",
    role: "SUPERADMIN",
    accountStatus: "ACTIVE",
    activationStatus: "COMPLETE",
    invitedAt: null,
    invitationExpiresAt: null,
    mfaStatus: "ACTIVE",
    lastLogin: "2026-11-05T08:42:00+07:00",
    lastActivity: "2026-11-05T09:18:00+07:00",
    sessions: 1,
    pendingOrders: 0,
    failedLogins: 0,
    createdAt: "2026-10-01T08:00:00+07:00",
    note: "Akun awal yang ditetapkan melalui prosedur peluncuran.",
    activity:
    [
      { at: "2026-11-05T09:18:00+07:00", text: "Membuka halaman akun staf", result: "Berhasil" },
      { at: "2026-11-05T08:42:00+07:00", text: "Login staf dengan MFA", result: "Berhasil" }
    ]
  },
  {
    id: "admin-01",
    name: "Nadia Putri",
    email: "nadia.putri@rylva.green",
    phone: "+6281398765432",
    role: "ADMIN",
    accountStatus: "ACTIVE",
    activationStatus: "COMPLETE",
    invitedAt: "2026-10-21T09:00:00+07:00",
    invitationExpiresAt: "2026-10-22T09:00:00+07:00",
    mfaStatus: "ACTIVE",
    lastLogin: "2026-11-05T07:56:00+07:00",
    lastActivity: "2026-11-05T08:15:00+07:00",
    sessions: 2,
    pendingOrders: 4,
    failedLogins: 0,
    createdAt: "2026-10-21T09:00:00+07:00",
    note: "Mengelola antrean pesanan dan pemenuhan operasional.",
    activity:
    [
      { at: "2026-11-05T08:15:00+07:00", text: "Memperbarui status pesanan RV-261105-3F9K2A", result: "Berhasil" },
      { at: "2026-11-05T07:56:00+07:00", text: "Login staf dengan MFA", result: "Berhasil" }
    ]
  },
  {
    id: "admin-02",
    name: "Dimas Pratama",
    email: "dimas.pratama@rylva.green",
    phone: "+6281276543210",
    role: "ADMIN",
    accountStatus: "PENDING",
    activationStatus: "PENDING",
    invitedAt: "2026-11-04T10:15:00+07:00",
    invitationExpiresAt: "2026-11-05T10:15:00+07:00",
    mfaStatus: "NOT_READY",
    lastLogin: null,
    lastActivity: null,
    sessions: 0,
    pendingOrders: 0,
    failedLogins: 0,
    createdAt: "2026-11-04T10:15:00+07:00",
    note: "Undangan belum diselesaikan oleh penerima.",
    activity:
    [
      { at: "2026-11-04T10:15:00+07:00", text: "Undangan Admin dibuat", result: "Menunggu" }
    ]
  },
  {
    id: "admin-03",
    name: "Maya Lestari",
    email: "maya.lestari@rylva.green",
    phone: "+6281187654321",
    role: "ADMIN",
    accountStatus: "ACTIVE",
    activationStatus: "COMPLETE",
    invitedAt: "2026-10-12T13:10:00+07:00",
    invitationExpiresAt: "2026-10-13T13:10:00+07:00",
    mfaStatus: "RESET_REQUIRED",
    lastLogin: "2026-11-03T16:24:00+07:00",
    lastActivity: "2026-11-03T16:25:00+07:00",
    sessions: 0,
    pendingOrders: 2,
    failedLogins: 0,
    createdAt: "2026-10-12T13:10:00+07:00",
    note: "MFA dihapus setelah verifikasi pemulihan. Akses operasional menunggu pendaftaran ulang.",
    activity:
    [
      { at: "2026-11-03T16:25:00+07:00", text: "MFA ditandai untuk pendaftaran ulang", result: "Perlu tindakan" },
      { at: "2026-11-03T16:24:00+07:00", text: "Login staf ditolak karena MFA belum siap", result: "Ditolak" }
    ]
  },
  {
    id: "admin-04",
    name: "Budi Santoso",
    email: "budi.santoso@rylva.green",
    phone: "+6285223456789",
    role: "ADMIN",
    accountStatus: "SUSPENDED",
    activationStatus: "COMPLETE",
    invitedAt: "2026-09-02T09:25:00+07:00",
    invitationExpiresAt: "2026-09-03T09:25:00+07:00",
    mfaStatus: "ACTIVE",
    lastLogin: "2026-11-04T12:12:00+07:00",
    lastActivity: "2026-11-04T12:13:00+07:00",
    sessions: 0,
    pendingOrders: 0,
    failedLogins: 5,
    lockedUntil: "2026-11-04T12:42:00+07:00",
    createdAt: "2026-09-02T09:25:00+07:00",
    note: "Login ditahan sementara setelah percobaan gagal berulang.",
    activity:
    [
      { at: "2026-11-04T12:13:00+07:00", text: "Akun dikunci sementara oleh rate limit login", result: "Ditahan" },
      { at: "2026-11-04T12:12:00+07:00", text: "Login staf gagal", result: "Ditolak" }
    ]
  },
  {
    id: "admin-05",
    name: "Rani Wijaya",
    email: "rani.wijaya@rylva.green",
    phone: "+6281776543290",
    role: "ADMIN",
    accountStatus: "DEACTIVATED",
    activationStatus: "COMPLETE",
    invitedAt: "2026-08-01T09:00:00+07:00",
    invitationExpiresAt: "2026-08-02T09:00:00+07:00",
    mfaStatus: "ACTIVE",
    lastLogin: "2026-10-20T17:20:00+07:00",
    lastActivity: "2026-10-20T17:21:00+07:00",
    sessions: 0,
    pendingOrders: 0,
    failedLogins: 0,
    createdAt: "2026-08-01T09:00:00+07:00",
    deactivatedAt: "2026-10-21T09:00:00+07:00",
    deactivationReason: "Perubahan penugasan tim",
    note: "Riwayat akun dipertahankan; sesi aktif sudah dicabut.",
    activity:
    [
      { at: "2026-10-21T09:00:00+07:00", text: "Akun dinonaktifkan oleh SuperAdmin", result: "Berhasil" },
      { at: "2026-10-20T17:21:00+07:00", text: "Logout staf", result: "Berhasil" }
    ]
  }
]);
