# MNOP Core Database Design

## 1. Document Information

* Application: MNOP — Monitoring Network Operations Platform
* Database: PostgreSQL 17
* ORM: SQLAlchemy 2.x
* Migration: Alembic
* Architecture: Clean Architecture
* Initial baseline revision: `20260719_0001`
* Core schema version: `1.0`

## 2. Design Objectives

Database MNOP dirancang untuk:

1. Menyimpan struktur organisasi dan lokasi jaringan.
2. Mengelola user, role, dan permission menggunakan RBAC.
3. Menyimpan inventaris perangkat dan interface jaringan.
4. Merepresentasikan hubungan topologi antar-interface.
5. Mengelola konfigurasi monitoring perangkat dan konektivitas.
6. Menyimpan hasil availability, latency, dan packet loss.
7. Menghitung pencapaian Service Level Agreement.
8. Mencatat incident dan seluruh perubahan statusnya.
9. Menyediakan audit trail untuk aktivitas user dan sistem.
10. Mendukung pertumbuhan data monitoring dalam skala enterprise.

## 3. Database Conventions

### 3.1 Naming

* Nama tabel menggunakan bentuk jamak dan `snake_case`.
* Nama kolom menggunakan `snake_case`.
* Primary key standar bernama `id`.
* Foreign key menggunakan pola `<entity>_id`.
* Unique constraint menggunakan awalan `uq_`.
* Check constraint menggunakan awalan `ck_`.
* Foreign key constraint menggunakan awalan `fk_`.
* Index menggunakan awalan `ix_`.

### 3.2 Identifier

Tabel master dan tabel bisnis menggunakan UUID:

* organizations
* sites
* users
* roles
* devices
* monitoring_checks
* sla_policies
* incidents

Tabel dengan pertumbuhan data tinggi menggunakan BIGINT:

* check_results
* incident_events
* audit_logs

UUID dibuat oleh aplikasi agar implementasi tidak bergantung pada satu database engine untuk pembuatan identifier.

### 3.3 Timestamp

Semua tabel master menggunakan:

* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Timestamp disimpan dalam UTC.

Zona waktu organisasi atau site hanya digunakan untuk:

* Presentasi waktu.
* Penjadwalan monitoring.
* Perhitungan periode SLA.
* Penjadwalan maintenance.

### 3.4 Deletion Policy

Data konfigurasi utama tidak langsung dihapus secara fisik.

Master data menggunakan:

* `is_active`
* `deleted_at`, apabila diperlukan

Data historis seperti hasil monitoring, incident event, SLA summary, dan audit log tidak menggunakan soft delete.

## 4. Organization Domain

### 4.1 organizations

Menyimpan perusahaan atau tenant pemilik sistem.

Kolom utama:

* `id UUID PRIMARY KEY`
* `code VARCHAR(50) NOT NULL`
* `name VARCHAR(255) NOT NULL`
* `timezone VARCHAR(64) NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `settings JSONB NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Constraint:

* `code` harus unik.
* Zona waktu default organisasi menggunakan zona waktu yang valid.

### 4.2 sites

Menyimpan lokasi operasional, kantor, data center, site tambang, atau area jaringan.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `code VARCHAR(50) NOT NULL`
* `name VARCHAR(255) NOT NULL`
* `description TEXT`
* `address TEXT`
* `latitude NUMERIC(9,6)`
* `longitude NUMERIC(9,6)`
* `timezone VARCHAR(64) NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Relasi:

* Satu organization memiliki banyak site.
* Satu site hanya dimiliki oleh satu organization.

Constraint:

* Kombinasi `organization_id` dan `code` harus unik.

## 5. Identity and Access Domain

### 5.1 users

Menyimpan akun pengguna aplikasi.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `username VARCHAR(100) NOT NULL`
* `email VARCHAR(255) NOT NULL`
* `password_hash VARCHAR(255) NOT NULL`
* `full_name VARCHAR(255) NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `is_superuser BOOLEAN NOT NULL`
* `must_change_password BOOLEAN NOT NULL`
* `last_login_at TIMESTAMPTZ`
* `password_changed_at TIMESTAMPTZ`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Constraint:

* Username unik dalam satu organization.
* Email unik dalam satu organization.
* Password tidak pernah disimpan dalam bentuk plaintext.

### 5.2 roles

Menyimpan role seperti:

* Super Administrator
* Administrator
* Network Engineer
* NOC Operator
* Viewer
* Auditor

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID`
* `name VARCHAR(100) NOT NULL`
* `slug VARCHAR(100) NOT NULL`
* `description TEXT`
* `is_system BOOLEAN NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Role dengan `organization_id` bernilai null merupakan system role.

### 5.3 permissions

Menyimpan izin granular seperti:

* `device.read`
* `device.create`
* `device.update`
* `device.delete`
* `monitoring.read`
* `monitoring.manage`
* `sla.read`
* `sla.manage`
* `incident.acknowledge`
* `incident.resolve`
* `user.manage`
* `audit.read`

Kolom utama:

* `id UUID PRIMARY KEY`
* `code VARCHAR(150) NOT NULL`
* `name VARCHAR(150) NOT NULL`
* `module VARCHAR(100) NOT NULL`
* `description TEXT`
* `created_at TIMESTAMPTZ NOT NULL`

Constraint:

* `code` harus unik secara global.

### 5.4 user_roles

Tabel penghubung many-to-many antara user dan role.

Kolom utama:

* `user_id UUID NOT NULL`
* `role_id UUID NOT NULL`
* `site_id UUID`
* `assigned_at TIMESTAMPTZ NOT NULL`
* `assigned_by UUID`

`site_id` dapat digunakan untuk membatasi role hanya pada site tertentu.

Primary key:

* `user_id`
* `role_id`
* `site_id`

### 5.5 role_permissions

Tabel penghubung many-to-many antara role dan permission.

Kolom utama:

* `role_id UUID NOT NULL`
* `permission_id UUID NOT NULL`

Primary key:

* `role_id`
* `permission_id`

## 6. Device Inventory Domain

### 6.1 device_vendors

Menyimpan vendor perangkat, seperti:

* MikroTik
* Fortinet
* VMware
* Microsoft
* Ruijie
* Cisco
* Ubiquiti

Kolom utama:

* `id UUID PRIMARY KEY`
* `name VARCHAR(150) NOT NULL`
* `slug VARCHAR(150) NOT NULL`
* `website VARCHAR(255)`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

### 6.2 device_models

Menyimpan model perangkat, seperti:

* CCR2004-16G-2S+
* CRS320-8P-8B-4S+
* RBSXTsqG-5acD
* FortiGate 100F

Kolom utama:

* `id UUID PRIMARY KEY`
* `vendor_id UUID NOT NULL`
* `name VARCHAR(150) NOT NULL`
* `device_type VARCHAR(50) NOT NULL`
* `os_family VARCHAR(100)`
* `manufacturer_part_number VARCHAR(150)`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Device type dapat berisi:

* router
* firewall
* switch
* access_point
* radio
* server
* virtual_machine
* hypervisor
* ups
* printer
* cctv
* snmp_device
* other

### 6.3 devices

Menyimpan perangkat yang dimonitor.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `site_id UUID NOT NULL`
* `model_id UUID`
* `parent_device_id UUID`
* `name VARCHAR(150) NOT NULL`
* `hostname VARCHAR(255)`
* `management_ip INET`
* `serial_number VARCHAR(150)`
* `asset_tag VARCHAR(150)`
* `status VARCHAR(30) NOT NULL`
* `firmware_version VARCHAR(100)`
* `operating_system VARCHAR(150)`
* `location_description TEXT`
* `snmp_enabled BOOLEAN NOT NULL`
* `ssh_enabled BOOLEAN NOT NULL`
* `api_enabled BOOLEAN NOT NULL`
* `last_seen_at TIMESTAMPTZ`
* `metadata JSONB NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`
* `deleted_at TIMESTAMPTZ`

Status perangkat:

* active
* inactive
* maintenance
* decommissioned

Constraint:

* Nama perangkat harus unik di dalam site.
* Management IP harus unik di dalam site ketika nilainya tersedia.
* Parent device tidak boleh menunjuk ke device yang sama.

### 6.4 device_credentials

Menyimpan referensi credential perangkat.

Kolom utama:

* `id UUID PRIMARY KEY`
* `device_id UUID NOT NULL`
* `credential_type VARCHAR(30) NOT NULL`
* `username VARCHAR(255)`
* `encrypted_secret BYTEA NOT NULL`
* `encryption_key_version VARCHAR(50) NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `last_verified_at TIMESTAMPTZ`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Credential type:

* snmp_v2c
* snmp_v3
* ssh
* api
* winrm
* vmware
* hyper_v

Secret harus dienkripsi di application layer sebelum disimpan.

### 6.5 device_interfaces

Menyimpan interface fisik atau logis perangkat.

Kolom utama:

* `id UUID PRIMARY KEY`
* `device_id UUID NOT NULL`
* `name VARCHAR(150) NOT NULL`
* `display_name VARCHAR(255)`
* `description TEXT`
* `if_index INTEGER`
* `mac_address MACADDR`
* `ip_address INET`
* `interface_type VARCHAR(50)`
* `speed_bps BIGINT`
* `admin_status VARCHAR(20)`
* `oper_status VARCHAR(20)`
* `is_uplink BOOLEAN NOT NULL`
* `is_wan BOOLEAN NOT NULL`
* `monitoring_enabled BOOLEAN NOT NULL`
* `metadata JSONB NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Constraint:

* Nama interface harus unik dalam satu device.
* `speed_bps` tidak boleh bernilai negatif.

## 7. Network Topology Domain

### 7.1 network_links

Merepresentasikan koneksi antara dua interface.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `site_id UUID NOT NULL`
* `name VARCHAR(255) NOT NULL`
* `a_interface_id UUID NOT NULL`
* `z_interface_id UUID NOT NULL`
* `link_type VARCHAR(50) NOT NULL`
* `capacity_bps BIGINT`
* `provider_name VARCHAR(255)`
* `circuit_id VARCHAR(150)`
* `is_active BOOLEAN NOT NULL`
* `metadata JSONB NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Link type:

* wan
* lan
* trunk
* access
* fiber
* wireless
* vpn
* virtual
* other

Constraint:

* Interface sisi A dan sisi Z tidak boleh sama.
* Satu pasangan interface tidak boleh didaftarkan dua kali.
* Capacity tidak boleh negatif.

## 8. Monitoring Domain

### 8.1 monitoring_profiles

Menyimpan konfigurasi reusable untuk proses monitoring.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `name VARCHAR(150) NOT NULL`
* `protocol VARCHAR(30) NOT NULL`
* `interval_seconds INTEGER NOT NULL`
* `timeout_seconds INTEGER NOT NULL`
* `retry_count SMALLINT NOT NULL`
* `parameters JSONB NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Protocol:

* icmp
* tcp
* http
* https
* snmp
* ssh
* api
* winrm
* vmware
* hyper_v

Constraint:

* Interval harus lebih besar dari nol.
* Timeout harus lebih besar dari nol.
* Timeout tidak boleh melebihi interval.
* Retry count tidak boleh negatif.

### 8.2 monitoring_checks

Menyimpan objek monitoring aktual.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `site_id UUID NOT NULL`
* `device_id UUID NOT NULL`
* `interface_id UUID`
* `profile_id UUID NOT NULL`
* `name VARCHAR(255) NOT NULL`
* `check_type VARCHAR(50) NOT NULL`
* `target_address VARCHAR(512)`
* `target_port INTEGER`
* `expected_status VARCHAR(100)`
* `is_enabled BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Check type:

* availability
* latency
* packet_loss
* interface_status
* bandwidth
* cpu
* memory
* storage
* temperature
* service
* api_response

### 8.3 check_results

Menyimpan hasil setiap eksekusi monitoring.

Kolom utama:

* `id BIGINT PRIMARY KEY`
* `check_id UUID NOT NULL`
* `observed_at TIMESTAMPTZ NOT NULL`
* `status VARCHAR(20) NOT NULL`
* `latency_ms NUMERIC(12,3)`
* `packet_loss_percent NUMERIC(5,2)`
* `response_time_ms NUMERIC(12,3)`
* `value_numeric NUMERIC`
* `value_text TEXT`
* `error_code VARCHAR(100)`
* `error_message TEXT`
* `metrics JSONB NOT NULL`

Status:

* up
* down
* degraded
* unknown

Tabel ini akan menjadi tabel dengan pertumbuhan tertinggi dan dipersiapkan untuk partitioning berdasarkan `observed_at`.

Index utama:

* `(check_id, observed_at DESC)`
* `(observed_at DESC)`
* `(status, observed_at DESC)`

### 8.4 check_states

Menyimpan status terbaru setiap monitoring check.

Kolom utama:

* `check_id UUID PRIMARY KEY`
* `current_status VARCHAR(20) NOT NULL`
* `status_since TIMESTAMPTZ NOT NULL`
* `last_checked_at TIMESTAMPTZ`
* `last_success_at TIMESTAMPTZ`
* `last_failure_at TIMESTAMPTZ`
* `consecutive_successes INTEGER NOT NULL`
* `consecutive_failures INTEGER NOT NULL`
* `last_latency_ms NUMERIC(12,3)`
* `last_packet_loss_percent NUMERIC(5,2)`
* `updated_at TIMESTAMPTZ NOT NULL`

Relasi dengan monitoring check adalah one-to-one.

Tabel ini digunakan dashboard agar sistem tidak perlu membaca seluruh `check_results` untuk memperoleh status terbaru.

## 9. SLA Domain

### 9.1 sla_policies

Menyimpan aturan SLA.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `name VARCHAR(255) NOT NULL`
* `description TEXT`
* `target_percentage NUMERIC(6,3) NOT NULL`
* `calculation_timezone VARCHAR(64) NOT NULL`
* `measurement_period VARCHAR(20) NOT NULL`
* `exclude_maintenance BOOLEAN NOT NULL`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Measurement period:

* daily
* monthly
* quarterly
* yearly

Constraint:

* Target SLA harus berada antara 0 dan 100.

### 9.2 sla_targets

Menghubungkan SLA policy dengan monitoring check.

Kolom utama:

* `id UUID PRIMARY KEY`
* `policy_id UUID NOT NULL`
* `check_id UUID NOT NULL`
* `valid_from DATE NOT NULL`
* `valid_until DATE`
* `is_active BOOLEAN NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Constraint:

* `valid_until` tidak boleh lebih awal daripada `valid_from`.

### 9.3 maintenance_windows

Menyimpan jadwal maintenance yang dikecualikan dari perhitungan SLA.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `name VARCHAR(255) NOT NULL`
* `reason TEXT`
* `start_at TIMESTAMPTZ NOT NULL`
* `end_at TIMESTAMPTZ NOT NULL`
* `status VARCHAR(20) NOT NULL`
* `created_by UUID NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Status:

* scheduled
* active
* completed
* cancelled

Constraint:

* `end_at` harus lebih besar dari `start_at`.

### 9.4 maintenance_window_checks

Tabel penghubung many-to-many antara maintenance window dan monitoring check.

Kolom utama:

* `maintenance_window_id UUID NOT NULL`
* `check_id UUID NOT NULL`

Primary key:

* `maintenance_window_id`
* `check_id`

### 9.5 sla_daily_summaries

Menyimpan hasil agregasi SLA harian.

Kolom utama:

* `id UUID PRIMARY KEY`
* `sla_target_id UUID NOT NULL`
* `summary_date DATE NOT NULL`
* `expected_seconds INTEGER NOT NULL`
* `excluded_seconds INTEGER NOT NULL`
* `up_seconds INTEGER NOT NULL`
* `down_seconds INTEGER NOT NULL`
* `degraded_seconds INTEGER NOT NULL`
* `unknown_seconds INTEGER NOT NULL`
* `availability_percentage NUMERIC(8,5) NOT NULL`
* `outage_count INTEGER NOT NULL`
* `mttr_seconds INTEGER`
* `calculated_at TIMESTAMPTZ NOT NULL`

Constraint:

* Kombinasi `sla_target_id` dan `summary_date` harus unik.
* Semua nilai durasi tidak boleh negatif.
* Availability harus berada antara 0 dan 100.

Rekap bulanan dihitung dari data harian agar tidak menduplikasi sumber data.

## 10. Incident Domain

### 10.1 incidents

Menyimpan gangguan yang terdeteksi sistem atau dibuat manual.

Kolom utama:

* `id UUID PRIMARY KEY`
* `organization_id UUID NOT NULL`
* `site_id UUID NOT NULL`
* `check_id UUID`
* `device_id UUID`
* `interface_id UUID`
* `severity VARCHAR(20) NOT NULL`
* `status VARCHAR(30) NOT NULL`
* `title VARCHAR(255) NOT NULL`
* `description TEXT`
* `started_at TIMESTAMPTZ NOT NULL`
* `detected_at TIMESTAMPTZ NOT NULL`
* `acknowledged_at TIMESTAMPTZ`
* `acknowledged_by UUID`
* `resolved_at TIMESTAMPTZ`
* `resolved_by UUID`
* `root_cause TEXT`
* `resolution TEXT`
* `created_at TIMESTAMPTZ NOT NULL`
* `updated_at TIMESTAMPTZ NOT NULL`

Severity:

* info
* warning
* minor
* major
* critical

Status:

* open
* acknowledged
* investigating
* resolved
* closed

Index utama:

* Incident aktif berdasarkan `status`.
* Incident berdasarkan `device_id` dan `started_at`.
* Incident berdasarkan `site_id` dan `started_at`.

### 10.2 incident_events

Menyimpan timeline perubahan incident.

Kolom utama:

* `id BIGINT PRIMARY KEY`
* `incident_id UUID NOT NULL`
* `event_type VARCHAR(50) NOT NULL`
* `occurred_at TIMESTAMPTZ NOT NULL`
* `actor_user_id UUID`
* `message TEXT`
* `details JSONB NOT NULL`

Event type:

* created
* status_changed
* acknowledged
* assigned
* comment
* escalated
* resolved
* reopened
* closed

## 11. Audit Domain

### 11.1 audit_logs

Menyimpan aktivitas administratif dan perubahan data penting.

Kolom utama:

* `id BIGINT PRIMARY KEY`
* `organization_id UUID`
* `user_id UUID`
* `action VARCHAR(100) NOT NULL`
* `resource_type VARCHAR(100) NOT NULL`
* `resource_id UUID`
* `request_id UUID`
* `ip_address INET`
* `user_agent TEXT`
* `before_data JSONB`
* `after_data JSONB`
* `metadata JSONB NOT NULL`
* `created_at TIMESTAMPTZ NOT NULL`

Audit log bersifat append-only.

Data audit tidak diperbarui atau dihapus melalui API aplikasi biasa.

## 12. Core Relationships

* Organization memiliki banyak site.
* Organization memiliki banyak user.
* Organization memiliki banyak device.
* Site memiliki banyak device.
* Vendor memiliki banyak model.
* Model memiliki banyak device.
* Device memiliki banyak interface.
* Device dapat memiliki parent device.
* Network link menghubungkan dua interface.
* Monitoring profile digunakan oleh banyak monitoring check.
* Monitoring check dimiliki oleh satu device.
* Monitoring check dapat diarahkan ke satu interface.
* Monitoring check memiliki banyak result.
* Monitoring check memiliki satu current state.
* SLA policy memiliki banyak SLA target.
* SLA target menunjuk ke satu monitoring check.
* Maintenance window memiliki banyak monitoring check.
* Monitoring check dapat berada dalam banyak maintenance window.
* SLA target memiliki banyak SLA daily summary.
* Incident dapat berkaitan dengan check, device, dan interface.
* Incident memiliki banyak incident event.
* User dan role memiliki relasi many-to-many.
* Role dan permission memiliki relasi many-to-many.

## 13. Migration Plan

Migration akan dibuat dalam urutan berikut:

1. `20260719_0002_identity_and_rbac.py`
2. `20260719_0003_device_inventory.py`
3. `20260719_0004_network_monitoring.py`
4. `20260719_0005_sla_and_incidents.py`
5. `20260719_0006_audit_and_indexes.py`
6. Migration partitioning untuk `check_results`
7. Migration seed role dan permission awal

Setiap migration harus memiliki fungsi `upgrade()` dan `downgrade()` yang lengkap dan dapat diuji.

## 14. Security Requirements

* Password hanya disimpan sebagai secure password hash.
* Credential perangkat harus dienkripsi sebelum masuk database.
* Encryption key tidak boleh disimpan di database.
* Secret tidak boleh muncul dalam log.
* Audit log harus mencatat perubahan data penting.
* Foreign key digunakan untuk menjaga integritas data.
* User query harus selalu dibatasi berdasarkan organization dan hak aksesnya.
* API tidak boleh mengembalikan password hash atau encrypted secret.
* Database user aplikasi tidak menggunakan akun superuser PostgreSQL.

## 15. Performance Requirements

* Tambahkan index hanya pada kolom yang benar-benar digunakan untuk filter, join, atau sorting.
* Hindari index berlebihan pada `check_results`.
* Gunakan `check_states` untuk membaca status terkini.
* Gunakan `sla_daily_summaries` untuk laporan SLA.
* Gunakan batch insert untuk hasil monitoring.
* Gunakan retention policy untuk data hasil monitoring.
* Terapkan partitioning berdasarkan waktu setelah tabel monitoring dasar tervalidasi.
* Index JSONB hanya dibuat ketika query JSONB sudah didefinisikan.
