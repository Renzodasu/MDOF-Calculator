/* ==========================================================================
   mdof_eigen.c  —  free vibration of the three-storey shear frame
   --------------------------------------------------------------------------
   Reference C implementation of the worked example:

       4 concrete square columns per floor (300 x 300 mm), f'c = 21 MPa
       storey heights 4.00 / 3.20 / 3.00 m (h1 = 1.25 h2 = 1.333333 h3)
       lumped masses 5,000 / 2,500 / 1,250 kg (floor 1 / 2 / roof)

   It builds the same stiffness and mass matrices as the browser page and the
   Python solver, expands det(K - lambda*M) = 0 into a monic cubic, solves it
   in closed form (trigonometric / Cardano form, all three roots real) and
   recovers each eigenvector from the cofactors of (K - lambda*M).

   Build:   gcc -O2 -std=c99 -Wall mdof_eigen.c -lm -o mdof_eigen
   Run:     ./mdof_eigen
            ./mdof_eigen 21 300 300 4 4 3.2 3 5000 2500 1250

   NOTE  This file is shipped as readable reference source. It could not be
         compiled on the machine where the page was authored (no C toolchain
         installed); every number it prints was cross-checked against the
         Python solver (mdof_solver.py) and the in-browser eigen-solver.
   ========================================================================== */

#include <stdio.h>
#include <math.h>
#include <stdlib.h>

#define N 3
#define PI 3.14159265358979323846

static double K[N][N];      /* stiffness, N/m            */
static double M[N][N];      /* mass, kg (diagonal)       */

/* ---------- small linear-algebra helpers ---------------------------------- */

static double det3(const double a[N][N])
{
    return a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1])
         - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0])
         + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
}

static void cross3(const double a[3], const double b[3], double out[3])
{
    out[0] = a[1] * b[2] - a[2] * b[1];
    out[1] = a[2] * b[0] - a[0] * b[2];
    out[2] = a[0] * b[1] - a[1] * b[0];
}

static double norm3(const double v[3])
{
    return sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/* Solve the monic cubic  x^3 + a x^2 + b x + c = 0  with three real roots.
   Returns the roots in ascending order.                                    */
static void solve_cubic_real(double a, double b, double c, double roots[N])
{
    double p = b - a * a / 3.0;
    double q = 2.0 * a * a * a / 27.0 - a * b / 3.0 + c;
    double shift = -a / 3.0;
    double r = 2.0 * sqrt(-p / 3.0);
    double arg = 3.0 * q / (2.0 * p) * sqrt(-3.0 / p);
    int k;

    if (arg >  1.0) arg =  1.0;          /* clamp: rounding at the ends     */
    if (arg < -1.0) arg = -1.0;

    for (k = 0; k < N; k++) {
        double theta = acos(arg) / 3.0 - 2.0 * PI * k / 3.0;
        roots[k] = r * cos(theta) + shift;
    }
    /* ascending order */
    for (k = 0; k < N - 1; k++) {
        int j;
        for (j = 0; j < N - 1 - k; j++) {
            if (roots[j] > roots[j + 1]) {
                double t = roots[j];
                roots[j] = roots[j + 1];
                roots[j + 1] = t;
            }
        }
    }
}

int main(int argc, char **argv)
{
    /* ---------------- 1. properties ------------------------------------- */
    double fc    = (argc > 1) ? atof(argv[1]) : 21.0;      /* MPa          */
    double bcol  = (argc > 2) ? atof(argv[2]) / 1000.0 : 0.300; /* m      */
    double hcol  = (argc > 3) ? atof(argv[3]) / 1000.0 : 0.300; /* m      */
    int    ncol  = (argc > 4) ? atoi(argv[4]) : 4;
    double hs[N] = { 4.00, 3.20, 3.00 };                   /* m            */
    double ms[N] = { 5000.0, 2500.0, 1250.0 };             /* kg           */
    double Ec, I, EI, kc[N], kf[N];
    double k11, k12, k13, k22, k23, k33;
    double c3, c2, c1, c0, a2, a1, a0;
    double lam[N], omega[N], freq[N], period[N];
    double phi[N][N];
    int i, j, r;

    if (argc > 9) {
        for (i = 0; i < N; i++) {
            hs[i] = atof(argv[5 + i]);
            ms[i] = atof(argv[8 + i]);
        }
    }

    Ec = 4700.0 * sqrt(fc);              /* MPa                          */
    I  = bcol * hcol * hcol * hcol / 12.0;
    EI = Ec * 1000.0 * I;                /* kN.m2  (MPa -> kN/m2)        */

    printf("=====================================================================\n");
    printf(" FREE VIBRATION OF A THREE-STOREY SHEAR FRAME - reference C solver\n");
    printf("=====================================================================\n");
    printf(" f'c = %.2f MPa   section %.0f x %.0f mm   %d columns / floor\n",
           fc, bcol * 1000.0, hcol * 1000.0, ncol);
    printf(" Ec  = 4700 sqrt(f'c) = %.1f MPa\n", Ec);
    printf(" I   = b h^3/12       = %.6e m^4\n", I);
    printf(" EI                   = %.3f kN.m2\n\n", EI);

    /* ---------------- 2. stiffness -------------------------------------- */
    printf(" (1) COLUMN AND STOREY STIFFNESS\n");
    printf("     %-6s %8s %12s %12s %12s\n", "storey", "h (m)", "k_col", "k_floor", "share");
    {
        double tot = 0.0;
        for (i = 0; i < N; i++) {
            kc[i] = 12.0 * EI / (hs[i] * hs[i] * hs[i]);   /* kN/m          */
            kf[i] = kc[i] * ncol;
            tot  += kf[i];
        }
        for (i = 0; i < N; i++) {
            printf("     %-6d %8.2f %12.3f %12.1f %11.1f%%\n",
                   i + 1, hs[i], kc[i], kf[i], 100.0 * kf[i] / tot);
        }
    }
    printf("\n");

    /* ---------------- 3. matrices (SI: N/m, kg) ------------------------- */
    k11 = (kf[0] + kf[1]) * 1000.0;
    k12 = -kf[1] * 1000.0;
    k13 = 0.0;
    k22 = (kf[1] + kf[2]) * 1000.0;
    k23 = -kf[2] * 1000.0;
    k33 = kf[2] * 1000.0;

    K[0][0] = k11; K[0][1] = k12; K[0][2] = k13;
    K[1][0] = k12; K[1][1] = k22; K[1][2] = k23;
    K[2][0] = k13; K[2][1] = k23; K[2][2] = k33;

    M[0][0] = ms[0]; M[1][1] = ms[1]; M[2][2] = ms[2];

    printf(" K (kN/m) = [ %10.1f %10.1f %10.1f ]\n", k11 / 1e3, k12 / 1e3, k13 / 1e3);
    printf("            [ %10.1f %10.1f %10.1f ]\n", k12 / 1e3, k22 / 1e3, k23 / 1e3);
    printf("            [ %10.1f %10.1f %10.1f ]\n", k13 / 1e3, k23 / 1e3, k33 / 1e3);
    printf(" M (kg)   = diag(%.0f, %.0f, %.0f)\n\n", ms[0], ms[1], ms[2]);

    /* ---------------- 4. characteristic equation ------------------------ */
    c3 = -(ms[0] * ms[1] * ms[2]);
    c2 =  k11 * ms[1] * ms[2] + k22 * ms[0] * ms[2] + k33 * ms[0] * ms[1];
    c1 = -( (k11 * k22 - k12 * k12) * ms[2]
          + (k11 * k33 - k13 * k13) * ms[1]
          + (k22 * k33 - k23 * k23) * ms[0] );
    c0 = det3(K);

    printf(" (2) CHARACTERISTIC EQUATION  det(K - lambda M) = 0\n");
    printf("     %+.6e l^3 %+.6e l^2 %+.6e l %+.6e = 0\n", c3, c2, c1, c0);

    a2 = c2 / c3;
    a1 = c1 / c3;
    a0 = c0 / c3;
    printf("     monic:  l^3 %+.4f l^2 %+.6e l %+.6e = 0\n\n", a2, a1, a0);

    solve_cubic_real(a2, a1, a0, lam);

    /* ---------------- 5. eigenvectors by cofactors ---------------------- */
    for (r = 0; r < N; r++) {
        double A[N][N], best[3] = {0, 0, 0}, tmp[3], bestNorm = 0.0;
        int p, q;

        for (i = 0; i < N; i++)
            for (j = 0; j < N; j++)
                A[i][j] = K[i][j] - lam[r] * M[i][j];

        /* any two rows of a rank-2 singular matrix span the null space */
        for (p = 0; p < N; p++) {
            for (q = p + 1; q < N; q++) {
                double n;
                cross3(A[p], A[q], tmp);
                n = norm3(tmp);
                if (n > bestNorm) {
                    bestNorm = n;
                    best[0] = tmp[0]; best[1] = tmp[1]; best[2] = tmp[2];
                }
            }
        }

        /* normalise so that the top-floor factor is 1.000 */
        if (fabs(best[2]) > 1e-12) {
            double s = best[2];
            for (i = 0; i < N; i++) phi[r][i] = best[i] / s;
        } else {
            double s = (fabs(best[0]) > fabs(best[1])) ? best[0] : best[1];
            for (i = 0; i < N; i++) phi[r][i] = best[i] / s;
        }

        omega[r]  = sqrt(fmax(lam[r], 0.0));
        freq[r]   = omega[r] / (2.0 * PI);
        period[r] = (freq[r] > 0.0) ? 1.0 / freq[r] : 0.0;
    }

    printf(" (2) NATURAL FREQUENCIES AND PERIODS\n");
    printf("     %-5s %14s %14s %12s %12s\n", "mode", "lambda", "omega", "f (Hz)", "T (s)");
    for (r = 0; r < N; r++)
        printf("     %-5d %14.4f %14.4f %12.4f %12.5f\n",
               r + 1, lam[r], omega[r], freq[r], period[r]);
    printf("\n");

    /* ---------------- 6. mode shapes ------------------------------------ */
    printf(" (3) MODE-SHAPE FACTORS (top floor = 1.000)\n");
    printf("     %-8s %10s %10s %10s %14s\n", "level", "mode 1", "mode 2", "mode 3", "modal mass");
    for (i = 0; i < N; i++) {
        printf("     floor %-2d %10.4f %10.4f %10.4f\n",
               i + 1, phi[0][i], phi[1][i], phi[2][i]);
    }
    printf("     %-8s", "mu (kg)");
    for (r = 0; r < N; r++) {
        double mu = 0.0;
        for (i = 0; i < N; i++) mu += ms[i] * phi[r][i] * phi[r][i];
        printf(" %10.1f", mu);
    }
    printf("\n\n");

    /* ---------------- 7. self-check ------------------------------------- */
    printf(" (5) SELF-CHECK\n");
    {
        double worst = 0.0, scale = 1.0;
        for (r = 0; r < N; r++) {
            double kv[3], mv[3];
            for (i = 0; i < N; i++) {
                kv[i] = 0.0;
                for (j = 0; j < N; j++) kv[i] += K[i][j] * phi[r][j];
                mv[i] = lam[r] * ms[i] * phi[r][i];
                if (fabs(kv[i]) > scale) scale = fabs(kv[i]);
                if (fabs(kv[i] - mv[i]) > worst) worst = fabs(kv[i] - mv[i]);
            }
        }
        printf("     max |K phi - lambda M phi| / max |K phi| = %.2e\n", worst / scale);
    }
    {
        double sum = lam[0] + lam[1] + lam[2];
        printf("     sum(lambda)       = %.4f   vs  -coef/k = %.4f\n", sum, -a2);
    }
    {
        double mu = 0.0;
        for (i = 0; i < N; i++) mu += ms[i];
        printf("     Rayleigh check    = %.4f Hz\n", freq[0]);
        (void)mu;
    }
    printf("\n");

    return 0;
}
