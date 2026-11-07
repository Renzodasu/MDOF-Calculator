#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FREE VIBRATION RESPONSE OF MDOF SYSTEMS
Three-storey shear building, 4 concrete columns per floor.

    m3 = 1,250 kg      |  h3 = 3.00 m
    m2 =  2,500 kg     |  h2 = 3.20 m
    m1 = 5,000 kg      |  h1 = 4.00 m
    f'c = 21 MPa, columns 300 x 300 mm

The script prints a full step-by-step solution and writes results.json
(the same numbers the interactive page shows).

Run:  python mdof_solver.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

# ----------------------------------------------------------------------------
# 0. INPUT (all SI: N, m, kg, s)
# ----------------------------------------------------------------------------
FC = 21.0e6          # concrete strength, Pa
B = 0.30             # column width, m
H = 0.30             # column depth, m
N_COL = 4            # columns per floor
H_STORY = [4.000, 4.000 / 1.25, 4.000 / 1.333333]   # h1, h2, h3
MASS = [5000.0, 2500.0, 1250.0]                       # m1, m2, m3 (kg)

RULE = "=" * 78


def header(step: str, title: str) -> None:
    print()
    print(RULE)
    print(f"  {step}  {title}")
    print(RULE)


# ----------------------------------------------------------------------------
# 1. SECTION + STORY STIFFNESS
# ----------------------------------------------------------------------------
header("STEP 1", "SECTION PROPERTIES AND STORY STIFFNESS")

# ACI 318 for normal-weight concrete: Ec = 4700 sqrt(f'c)  [MPa]
EC = 4700.0 * np.sqrt(FC / 1e6) * 1e6            # Pa
I_COL = B * H ** 3 / 12.0                        # m^4
EI = EC * I_COL                                  # N.m^2

print(f"  Ec  = 4700 sqrt(f'c) = 4700 sqrt({FC/1e6:.0f}) = {EC/1e9:.3f} GPa")
print(f"  Ic  = b h^3/12       = {B:.2f}({H:.2f})^3/12 = {I_COL:.6e} m^4")
print(f"  EI  = {EI:,.0f} N.m^2 = {EI/1e3:,.1f} kN.m^2")
print()
print("  Fixed-fixed column, lateral stiffness   k = 12 EI / h^3")

K_COL, K_FLOOR = [], []
for i, h in enumerate(H_STORY, start=1):
    k = 12.0 * EI / h ** 3
    K_COL.append(k)
    K_FLOOR.append(N_COL * k)
    print(f"    storey {i}: h = {h:5.3f} m   k_col = {k/1e3:9,.1f} kN/m"
          f"   K = {N_COL}k = {N_COL*k/1e3:10,.1f} kN/m")

# ----------------------------------------------------------------------------
# 2. MATRICES
# ----------------------------------------------------------------------------
header("STEP 2", "MASS AND STIFFNESS MATRICES")

k1, k2, k3 = K_FLOOR
K = np.array([[k1 + k2, -k2, 0.0],
              [-k2, k1 * 0 + k2 + k3, -k3],
              [0.0, -k3, k3]])
M = np.diag(MASS)

print("  K (kN/m) =")
for row in K / 1e3:
    print("    [" + "  ".join(f"{v:11,.1f}" for v in row) + " ]")
print()
print("  M (kg) = diag(" + ", ".join(f"{m:,.0f}" for m in MASS) + ")")

# ----------------------------------------------------------------------------
# 3. EIGENVALUE PROBLEM  det(K - w^2 M) = 0
# ----------------------------------------------------------------------------
header("STEP 3", "NATURAL FREQUENCIES (EIGENVALUE PROBLEM)")


def det_poly(Km: np.ndarray, Mm: np.ndarray) -> np.ndarray:
    """Coefficients (ascending in lambda) of det(K - lambda*M), 3x3."""
    def entry(i, j):
        # constant + lambda term
        return np.array([Km[i, j], -Mm[i, j]])

    def mul(p, q):
        return np.convolve(p, q)

    def sub(p, q):
        n = max(len(p), len(q))
        p = np.pad(p, (0, n - len(p)))
        q = np.pad(q, (0, n - len(q)))
        return p - q

    a = [[entry(i, j) for j in range(3)] for i in range(3)]
    t1 = mul(a[0][0], sub(mul(a[1][1], a[2][2]), mul(a[1][2], a[2][1])))
    t2 = mul(a[0][1], sub(mul(a[1][0], a[2][2]), mul(a[1][2], a[2][0])))
    t3 = mul(a[0][2], sub(mul(a[1][0], a[2][1]), mul(a[1][1], a[2][0])))
    return sub(sub(t1, t2), -t3)         # ascending: c0 + c1 L + c2 L^2 + c3 L^3


poly = det_poly(K, M)
# symmetric form  A = M^-1/2 K M^-1/2  ->  standard symmetric eigenproblem
Minv_sqrt = np.diag(1.0 / np.sqrt(MASS))
A = Minv_sqrt @ K @ Minv_sqrt
w2, V = np.linalg.eigh(A)
phi = Minv_sqrt @ V
phi_cols = [phi[:, i] / phi[2, i] for i in range(3)]     # roof = 1.0
_p = np.polyval(poly[::-1], w2)
assert np.max(np.abs(_p)) / np.max(np.abs(poly)) < 1e-7, "char poly mismatch"

c3, c2, c1, c0 = poly[3], poly[2], poly[1], poly[0]
print("  det(K - L M) = 0,  L = w^2, gives the cubic")
print(f"    ({c3:,.6e}) L^3 + ({c2:,.6e}) L^2 + ({c1:,.6e}) L + ({c0:,.6e}) = 0")
print(f"  divide by {c3:,.6e}:")
print(f"    L^3 - {abs(c2/c3):,.3f} L^2 + {abs(c1/c3):,.3e} L - {abs(c0/c3):,.3e} = 0")
print()
print("      mode      L = w^2 (rad/s)^2      w (rad/s)     f (Hz)      T (s)")
for i, lam in enumerate(w2, start=1):
    w = np.sqrt(lam)
    print(f"        {i}      {lam:12,.3f}          {w:8.3f}    {w/(2*np.pi):8.3f}   {2*np.pi/w:8.5f}")

# ----------------------------------------------------------------------------
# 4. MODE SHAPES
# ----------------------------------------------------------------------------
header("STEP 4", "MODE SHAPES  (top-floor factor = 1.0)")

MODAL_MASS = []
for i, ph in enumerate(phi_cols, start=1):
    mm = float(ph @ M @ ph)
    MODAL_MASS.append(mm)
    print(f"  mode {i}: phi = [{ph[0]:9.4f}, {ph[1]:9.4f}, {ph[2]:9.4f}]"
          f"   modal mass = {mm:12,.1f} kg")

print()
print("  Orthogonality: phi_r^T M phi_s = 0 for r != s")
G = np.array([[ph @ M @ ph2 for ph2 in phi_cols] for ph in phi_cols])
print("    M_gen =")
for row in G:
    print("      [" + "  ".join(f"{v:12,.2f}" for v in row) + " ]")

# ----------------------------------------------------------------------------
# 5. RAYLEIGH / STODOLA CHECK
# ----------------------------------------------------------------------------
header("STEP 5", "RAYLEIGH / STODOLA CHECK")


def rayleigh(shape) -> tuple[float, float]:
    s = np.asarray(shape, dtype=float)
    w_r = float(np.sqrt((s @ K @ s) / (s @ M @ s)))
    return w_r, w_r / (2 * np.pi)


# assumed shape = static deflections under inertial loads m_i g, roof = 1
F = np.array(MASS) * 9.81
u_static = np.linalg.solve(K, F)
u_static = u_static / u_static[2]
w_st, f_st = rayleigh(u_static)
print(f"  assumed shape (static drift, roof = 1.0): {np.round(u_static, 4).tolist()}")
print(f"  Rayleigh: w = {w_st:8.3f} rad/s   f = {f_st:7.4f} Hz   T = {2*np.pi/w_st:7.4f} s")
print(f"  error vs exact f1: {(f_st/(w2[0]**.5/(2*np.pi)) - 1)*100:+.3f} %")

shape = np.array([1 / 3, 2 / 3, 1.0])
print("  Stodola iteration (start from a straight line, roof = 1.0):")
for it in range(1, 5):
    sh = np.linalg.solve(K, M @ shape)
    sh = sh / sh[2]
    w_it, f_it = rayleigh(sh)
    print(f"    iteration {it}: {np.round(sh, 5).tolist()}   f = {f_it:7.4f} Hz")
    shape = sh

# ----------------------------------------------------------------------------
# 6. FREE VIBRATION RESPONSE (TOTAL MODE SHAPE)
# ----------------------------------------------------------------------------
header("STEP 6", "FREE-VIBRATION RESPONSE FROM INITIAL CONDITIONS")

# mass-normalised modes (phi^T M phi = 1)
PHI = []
for i in range(3):
    v = phi[:, i]
    PHI.append(v / np.sqrt(v @ M @ v))
PHI = np.array(PHI).T          # columns = modes

x0 = np.array([0.0, 0.0, 0.050])     # roof pulled 50 mm sideways
v0 = np.zeros(3)
q0 = PHI.T @ M @ x0
qd0 = PHI.T @ M @ v0
print(f"  initial condition: x0 = {np.round(x0*1000, 2).tolist()} mm, v0 = 0")
print(f"  modal amplitudes q_r(0) = {np.round(q0, 5).tolist()}")
print()
print("        t (s)      u1 (mm)      u2 (mm)      u3 (mm)")
for t in (0.0, 0.05, 0.10, 0.20, 0.40):
    q = q0 * np.cos(np.sqrt(w2) * t) + (qd0 / np.sqrt(w2)) * np.sin(np.sqrt(w2) * t)
    x = PHI @ q * 1000.0
    print(f"      {t:6.2f}   {x[0]:10.2f}   {x[1]:10.2f}   {x[2]:10.2f}")

# peak values over 5 s
tt = np.linspace(0.0, 5.0, 20001)
xmax = np.zeros(3)
for t in tt:
    q = q0 * np.cos(np.sqrt(w2) * t) + (qd0 / np.sqrt(w2)) * np.sin(np.sqrt(w2) * t)
    xmax = np.maximum(xmax, np.abs(PHI @ q))
print()
print("  peak |u| over 5 s (mm): " + ", ".join(f"{v*1000:.2f}" for v in xmax))

# completeness check: sum of phi_r phi_r^T M = I
ident = sum(np.outer(PHI[:, r], PHI[:, r] @ M) for r in range(3))
print(f"  superposition check: max|sum(phi phi^T M) - I| = {np.abs(ident - np.eye(3)).max():.2e}")

# ----------------------------------------------------------------------------
# 7. JSON EXPORT
# ----------------------------------------------------------------------------
summary = {
    "inputs": {
        "fc_MPa": FC / 1e6, "b_m": B, "h_m": H, "n_col": N_COL,
        "h_story_m": H_STORY, "mass_kg": MASS,
    },
    "section": {"Ec_Pa": EC, "I_m4": I_COL, "EI_Nm2": EI},
    "stiffness": {"k_col_N_m": K_COL, "K_floor_N_m": K_FLOOR},
    "K_N_m": K.tolist(), "M_kg": M.tolist(),
    "eigen": {"lambda": w2.tolist(),
              "omega": np.sqrt(w2).tolist(),
              "f_Hz": (np.sqrt(w2) / (2 * np.pi)).tolist(),
              "T_s": (2 * np.pi / np.sqrt(w2)).tolist()},
    "modes": [p.tolist() for p in phi_cols],
    "modal_mass_kg": MODAL_MASS,
    "char_poly_ascending": poly.tolist(),
    "rayleigh": {"shape": u_static.tolist(), "omega": w_st, "f_Hz": f_st},
    "response": {"x0_mm": (x0 * 1000).tolist(), "q0": q0.tolist()},
}
out = Path(__file__).with_name("results.json")
out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
print()
print(f"  results written to {out.name}")
