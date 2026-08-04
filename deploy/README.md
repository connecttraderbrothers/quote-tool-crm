# Deploying OMEGA

Target stack: **Oracle Cloud (Always Free ARM) → Coolify → PocketBase + Gotenberg**,
with the frontend on Cloudflare Pages.

Work through this in order. Steps 1 and 6 are the two that stop you losing data —
do not skip them.

---

## 1. Oracle Cloud account

Three things matter here, and all three bite people who skip them.

**Choose `uk-london-1` as your home region.** Region is fixed at account creation.
Your customer data is UK personal data; keeping it in-country removes an entire
GDPR conversation about international transfers.

**Upgrade to Pay As You Go straight away.** Oracle reclaims Always Free compute
instances that sit idle — low CPU, low network, low memory over a rolling week.
A CRM for one builder is exactly that profile, so on a pure free account you are
in the reclamation window most weeks. Upgrading to PAYG stops that, keeps the
Always Free allowances free, and gives you priority when capacity is tight. You
pay nothing as long as you stay inside the free limits. Verify the current terms
when you sign up — Oracle changes them.

**Expect to retry on capacity.** The Ampere A1 shape (4 OCPU / 24 GB RAM free) is
in heavy demand and "Out of capacity" is routine. PAYG helps. Keep trying.

Provision:

- Shape: **VM.Standard.A1.Flex**, 4 OCPU / 24 GB RAM (the full free allowance)
- Image: Ubuntu 22.04 or 24.04 (**arm64**)
- Boot volume: 100 GB (within the free 200 GB)
- Save the SSH private key somewhere you will still have it in a year

Then open the firewall. Oracle blocks nearly everything by default, in **two**
places — the VCN security list *and* the instance's own iptables. Both need
ports 80 and 443:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Forgetting the iptables half is the single most common "my site won't load"
cause on Oracle.

---

## 2. Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

Open `http://<your-ip>:8000`, create the admin account **immediately** — that
page is unauthenticated until you do.

Point DNS at the VM before continuing, so Let's Encrypt can issue certificates:

| Record | Name  | Value             |
| ------ | ----- | ----------------- |
| A      | `api` | your VM public IP |

---

## 3. Deploy the backend

In Coolify: **New Resource → Docker Compose**, point it at this repository, and
set the compose path to `deploy/docker-compose.yml`.

Set the domain for the `pocketbase` service to `https://api.yourdomain.co.uk`
and let Coolify handle TLS. Leave `gotenberg` with no domain — it must stay
internal.

Deploy, then open `https://api.yourdomain.co.uk/_/` and create the PocketBase
superuser account.

---

## 4. Load the schema

In the PocketBase admin UI: **Settings → Import collections**, paste
`pocketbase/collections.json`, review the diff, apply.

> **Version note.** The JSON targets the PocketBase collection format used by
> the pinned image (`fields`, `autodate`). If your build rejects it, the usual
> cause is an older format that expects `schema` instead of `fields`. Rename the
> key and re-import. The hooks in `pocketbase/pb_hooks/` are written against the
> v0.23+ hook API (`onRecordCreate` + `e.next()`); on older builds the
> equivalents are `onRecordBeforeCreateRequest` and take no `e.next()`. If the
> container logs a hook error on boot, check the version first — that is almost
> always what it is.

Then bootstrap your own company and user, in this order:

1. **companies** → create one record with your details, bank details, VAT rate
   (`0.2`), and logo URL.
2. **users** → create your login, set `company` to that record and `role` to
   `owner`.

Everything else keys off those two rows. The API rules scope every query to
`@request.auth.company`, so a user without a company sees nothing.

---

## 5. Deploy the frontend

Cloudflare Pages, connected to this repo:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_PB_URL = https://api.yourdomain.co.uk`

Serving the frontend off the VM works too, but Pages is free, global, and stays
up while you restart containers.

Put Cloudflare in front of `api.yourdomain.co.uk` as well — it hides the origin
IP and absorbs junk traffic.

---

## 6. Backups — do this today, not later

Everything lives in one SQLite file on one VM in one region. A backup on that
same VM is not a backup.

PocketBase has scheduled backups with an S3 target built in:
**Settings → Backups → enable, set a cron, configure S3.**

Point it at Cloudflare R2 (10 GB free) or OCI Object Storage.

Then **test a restore**. An untested backup is a guess. Download one, spin
PocketBase up locally against it, confirm your data is there.

What you are protecting against is not dramatic: a free-tier account suspension
or a botched upgrade, and every quote and invoice the business has issued being
on that one disk.

---

## 7. Verify

- [ ] `https://api.yourdomain.co.uk/api/health` returns OK
- [ ] Admin UI loads over HTTPS with a valid certificate
- [ ] Gotenberg is **not** reachable from outside (`curl` its port from your
      laptop should fail — that is the correct result)
- [ ] You can sign in to the frontend
- [ ] Creating an estimate allocates number `0001`
- [ ] Preview and downloaded PDF look identical
- [ ] A backup has been taken **and restored** somewhere

---

## Local development

```bash
npm install
npm run dev
```

Run PocketBase locally on `:8090` and Vite proxies `/api` to it, so the browser
sees one origin and there is no CORS to configure.

```bash
./pocketbase serve --dir ./pocketbase/pb_data --hooksDir ./pocketbase/pb_hooks
```

## Running costs

| Item                  | Cost                          |
| --------------------- | ----------------------------- |
| Oracle Always Free VM | £0 (PAYG, inside free limits) |
| Coolify               | £0 (self-hosted)              |
| PocketBase, Gotenberg | £0                            |
| Cloudflare Pages + R2 | £0 at this scale              |
| Domain                | ~£10/yr                       |

PDFShift's £9–24/month is gone — Gotenberg does the same job on hardware you are
already paying nothing for.

## Data protection

Storing UK customers' names, addresses, phones and emails makes you a data
controller. Register with the ICO (usually £40–60/yr at your size) and publish a
privacy policy. Keep backups encrypted and in the UK region.
