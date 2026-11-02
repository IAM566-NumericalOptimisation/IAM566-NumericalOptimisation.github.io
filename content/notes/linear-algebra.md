---
title: Linear Algebra
code: "0.1"
order: 1
status: published
pdf: https://github.com/IAM566-NumericalOptimisation/lecture-notes_AI-Generated/blob/main/0.1%20-%20Linear%20Algebra.pdf
---

A minimizer is a point at which a function attains its lowest value. To know when that point exists, and to measure a step toward it, one needs bounds on the real line, then lengths, angles, and the subspaces a matrix produces.

## Supremum and infimum

Some functions come arbitrarily close to a value and never attain it. Minimum and maximum are the wrong words for that value.

**Definition.** A set $A \subseteq \mathbb{R}$ is bounded from above when some $y$ satisfies $x \le y$ for every $x \in A$, and bounded from below when some $y$ satisfies $x \ge y$ for every $x \in A$. The least upper bound is $\sup A$. The greatest lower bound is $\inf A$.

Thus $\sup A$ is the tightest ceiling on $A$ and $\inf A$ is the tightest floor under it. Neither need lie in $A$. If the supremum lies in $A$ it is the maximum; if the infimum lies in $A$ it is the minimum.

Let $A = \{x : 1 \le x < 3\}$. Then $\sup A = 3$ and $\inf A = 1$. The infimum is a minimum, since $1 \in A$. The supremum is not a maximum, since $3 \notin A$.

On a feasible set the numbers one compares are the values of an objective $f$. For $f(x) = e^{-x}$ on $\mathbb{R}$,

$$
\inf_{x \in \mathbb{R}} e^{-x} = 0,
$$

and no $x$ attains the value $0$. A minimizer exists exactly when the infimum is attained, and then the infimum is the minimum.

On $x \ge 0$,

$$
f(x) = \frac{x}{1+x} = 1 - \frac{1}{1+x}
$$

satisfies $0 \le f(x) < 1$. The infimum $0$ is attained at $x^\star = 0$. The supremum $1$ is not attained, so there is no maximizer.

A set of points in $\mathbb{R}^n$ has no ceiling: vectors are not ordered. There, bounded means that the set fits in a ball. That requires a length.

## Vector spaces and subspaces

The design variables of a problem sit in a vector, and a step has the form $\vec x_k + \alpha_k \vec p_k$. A vector space is a set these two operations do not leave.

**Definition.** A nonempty set $V$, with addition and scalar multiplication, is a vector space when $\vec x + \vec y \in V$ and $\alpha \vec x \in V$ for all $\vec x, \vec y \in V$ and all $\alpha \in \mathbb{R}$, and the usual rules hold: addition is commutative and associative, there is a zero and an additive inverse, $1\vec x = \vec x$, and scalars distribute.

The line that matters is closure. The standard examples are $\mathbb{R}$ and $\mathbb{R}^n$. The continuous functions $C[a,b]$ form a vector space as well: a function is a vector.

**Definition.** If $V$ and $W$ are vector spaces under the same operations and $V \subseteq W$, then $V$ is a subspace of $W$.

The algebraic rules already hold in $W$, so a subset is tested only for the two closures. Taking the scalar $0$ puts $\vec 0$ in every subspace. A set that misses the origin is not a subspace. $W$ itself is a subspace, and $\{\vec 0\}$ is the smallest one.

In $\mathbb{R}^2$, a line through the origin is a subspace. The same line translated off the origin is not. A curve through the origin is not either: the sum of two of its points leaves the curve.

**Definition.** For a subspace $V$ and a vector $\vec x_0$, the set $\vec x_0 + V = \{\vec x_0 + \vec v : \vec v \in V\}$ is an affine space.

An affine space is a subspace translated off the origin. If $\vec a \neq \vec 0$ and $b \neq 0$, then

$$
V = \{\vec x : \vec a^\mathsf{T}\vec x = 0\}
$$

is a subspace, while $A = \{\vec x : \vec a^\mathsf{T}\vec x = b\}$ misses the origin. It is the affine space $\vec x_0 + V$ for any one solution $\vec x_0$. With $\vec a = (1,1)^\mathsf{T}$ and $b = 4$, $V$ is the line $x_1 + x_2 = 0$ and $A = (4,0)^\mathsf{T} + V$ is the line $x_1 + x_2 = 4$.

[[Affine]]

## Span and linear independence

A vector space has infinitely many vectors. A few of them can name all the others, provided none of the few is wasted.

**Definition.** A linear combination of $\vec x_1, \ldots, \vec x_k$ is $\sum_{i=1}^k \alpha_i \vec x_i$. Their span is the set of all linear combinations. The vectors span a space $S$ when that set equals $S$.

The vectors $\vec v_1 = (1,0)^\mathsf{T}$ and $\vec v_2 = (1,1)^\mathsf{T}$ span $\mathbb{R}^2$. For $(x_1, x_2)^\mathsf{T}$ the weights $\alpha = x_1 - x_2$ and $\beta = x_2$ work, so $(5,2)^\mathsf{T} = 3\vec v_1 + 2\vec v_2$. The span of one nonzero vector is the line through the origin along it.

**Definition.** The vectors $\vec x_1, \ldots, \vec x_k$ are linearly independent when $\sum_i \alpha_i \vec x_i = \vec 0$ forces every $\alpha_i = 0$. Otherwise they are linearly dependent.

The zero vector can always be built with every weight equal to zero. Independence says that this is the only way. If the vectors are dependent, one of them is a linear combination of the others and adds nothing to the span.

With $\vec v_3 = (2,1)^\mathsf{T}$ one has $\vec v_3 = \vec v_1 + \vec v_2$, so $\vec v_1 + \vec v_2 - \vec v_3 = \vec 0$ with weights that are not all zero. The three vectors are dependent, and $\operatorname{span}\{\vec v_1, \vec v_2, \vec v_3\} = \operatorname{span}\{\vec v_1, \vec v_2\}$.

[[Span]]

## Basis and dimension

**Definition.** A set $B = \{\vec x_1, \ldots, \vec x_k\}$ is a basis of $V$ when it is linearly independent and spans $V$.

The pair $\vec v_1 = (1,0)^\mathsf{T}$, $\vec v_2 = (1,1)^\mathsf{T}$ is a basis of $\mathbb{R}^2$. The basis used most often is the standard basis $\{\vec e_1, \ldots, \vec e_n\}$, where $\vec e_i$ has a one in slot $i$ and zeros elsewhere.

The weights in $\vec x = \sum_i \alpha_i \vec x_i$ are unique precisely because a basis is independent: two expansions of the same vector differ by a combination equal to zero. Those weights are the coordinates $[\vec x]_B$. The vector is the point; the coordinates are its name in that basis. If $A$ has the basis vectors as its columns, the coordinates solve $A[\vec x]_B = \vec x$.

**Definition.** The dimension $\dim V$ is the number of vectors in a basis of $V$. Every basis of $V$ has the same number.

In a space of dimension $n$, more than $n$ vectors are dependent, and fewer than $n$ vectors cannot span the space.

Let $V = \{\vec x \in \mathbb{R}^3 : x_1 + x_2 + x_3 = 0\}$. This is a subspace. The vectors $(1,-1,0)^\mathsf{T}$ and $(1,0,-1)^\mathsf{T}$ lie in $V$, they are independent, and every solution is

$$
\vec x = x_2(1,-1,0)^\mathsf{T} + x_3(1,0,-1)^\mathsf{T}.
$$

They form a basis, and $\dim V = 2$. One linear condition on $\mathbb{R}^3$ leaves a plane.

## Metric and norm

The points of a walk toward a minimizer should get close, and a step should have a length. Those are different measurements.

**Definition.** A metric on a set $A$ is a function $d$ with $d(x,y) \ge 0$, with $d(x,y) = 0$ exactly when $x = y$, with $d(x,y) = d(y,x)$, and with $d(x,z) \le d(x,y) + d(y,z)$.

**Definition.** A norm on a vector space $V$ is a function $\|\vec x\|$ with $\|\vec x\| \ge 0$, with $\|\vec x\| = 0$ exactly when $\vec x = \vec 0$, with $\|\alpha \vec x\| = |\alpha|\,\|\vec x\|$, and with $\|\vec x + \vec y\| \le \|\vec x\| + \|\vec y\|$.

A norm measures one vector. A metric measures the gap between two points, and those points need not be vectors one can add. Every norm induces a metric by $d(\vec x, \vec y) = \|\vec x - \vec y\|$. The converse fails.

On $\mathbb{R}^2$, the function that equals $1$ when $\vec x \neq \vec y$ and equals $0$ when they coincide is a metric. It comes from no norm: scaling a vector would have to scale its length, and this distance ignores scaling.

The function $\|\vec x\| = |x_1| + |x_2|$ is a norm. Nonnegativity and absolute homogeneity come from the absolute value, and the triangle inequality comes from $|a+b| \le |a| + |b|$ in each component. This is the $L_1$ norm of the next section.

## Lp norms and unit balls

There is more than one way to measure a vector, and the choice changes the minimizer.

**Definition.** For $p \ge 1$ and $\vec x \in \mathbb{R}^n$,

$$
\|\vec x\|_p = \left(\sum_{i=1}^n |x_i|^p\right)^{1/p}.
$$

The three members used in the course are

$$
\|\vec x\|_1 = \sum_{i=1}^n |x_i|,
\qquad
\|\vec x\|_2 = \left(\sum_{i=1}^n x_i^2\right)^{1/2},
\qquad
\|\vec x\|_\infty = \max_{1 \le i \le n} |x_i|.
$$

The Euclidean norm is $\|\cdot\|_2$. The limit $p \to \infty$ is the max norm, because for large $p$ the largest component dominates the sum: if $M = \max_i |x_i| > 0$ and $k$ components attain it, then

$$
M \le \|\vec x\|_p = M \left(\sum_{i=1}^n \left|\frac{x_i}{M}\right|^p\right)^{1/p} \le M\, k^{1/p},
$$

and $k^{1/p} \to 1$.

For $\vec x = (3,-4)^\mathsf{T}$,

$$
\begin{aligned}
\|\vec x\|_1 &= 7, \\
\|\vec x\|_2 &= 5, \\
\|\vec x\|_3 &= 91^{1/3} \approx 4.50, \\
\|\vec x\|_\infty &= 4.
\end{aligned}
$$

As $p$ grows, the norm falls toward the largest component. The exponent need not be an integer. Below $p = 1$ the triangle inequality fails. For $p = 1/2$,

$$
\|(1,0)^\mathsf{T}\|_{1/2} = \|(0,1)^\mathsf{T}\|_{1/2} = 1,
\qquad
\|(1,1)^\mathsf{T}\|_{1/2} = (1+1)^2 = 4 > 2.
$$

**Definition.** The unit ball of a norm is $B = \{\vec x : \|\vec x\| \le 1\}$.

In $\mathbb{R}^2$ the three balls are

$$
\begin{aligned}
\|\vec x\|_1 \le 1 &\Longleftrightarrow |x_1| + |x_2| \le 1, \\
\|\vec x\|_2 \le 1 &\Longleftrightarrow x_1^2 + x_2^2 \le 1, \\
\|\vec x\|_\infty \le 1 &\Longleftrightarrow \max\{|x_1|, |x_2|\} \le 1.
\end{aligned}
$$

The first is the square standing on a corner, the second is the disc, and the third is the square with sides parallel to the axes. As $p$ grows, the ball grows from the first square through the disc to the second. For $p = 1/2$ the curve bends inward: a segment between two interior points leaves the set.

A set $A \subseteq \mathbb{R}^n$ is bounded when $\|\vec x\| \le M$ for some $M$ and every $\vec x \in A$.

**Theorem.** Any two norms $\|\cdot\|_a$ and $\|\cdot\|_b$ on $\mathbb{R}^n$ are equivalent: there exist $\alpha, \beta > 0$ such that

$$
\alpha\, \|\vec x\|_a \le \|\vec x\|_b \le \beta\, \|\vec x\|_a
\qquad \text{for every } \vec x \in \mathbb{R}^n.
$$

A set that is bounded in one norm on $\mathbb{R}^n$ is bounded in every norm.

[[LpBall]]

## Inner product

A norm gives lengths and no directions. A descent step is a direction.

**Definition.** The inner product on $\mathbb{R}^n$ is $\langle \vec x, \vec y \rangle = \sum_{i=1}^n x_i y_i$, also written $\vec x \cdot \vec y$. On a general vector space an inner product is linear in the first argument, symmetric, and positive: $\langle \vec x, \vec x \rangle \ge 0$, with equality only at $\vec 0$.

It induces the norm $\|\vec x\| = \langle \vec x, \vec x \rangle^{1/2}$, and

$$
\langle \vec x, \vec y \rangle = \|\vec x\|\, \|\vec y\| \cos \theta.
$$

For the quotient to be a cosine it must lie in $[-1,1]$. That is the Cauchy–Schwarz inequality

$$
\langle \vec x, \vec y \rangle^2 \le \|\vec x\|^2 \|\vec y\|^2.
$$

It is the statement that $t \mapsto \|\vec x - t\vec y\|^2$ is a parabola that does not go below zero. Equality holds exactly when the two vectors are parallel.

**Definition.** $\vec x$ and $\vec y$ are orthogonal, written $\vec x \perp \vec y$, when $\langle \vec x, \vec y \rangle = 0$.

The angle is then a right angle. The sign of the inner product reads the rest: positive is acute, negative is obtuse.

A metric has distances, a norm adds lengths, and an inner product adds angles. A direction $\vec p$ is a descent direction at $\vec x_k$ when $\nabla f(\vec x_k)^\mathsf{T} \vec p < 0$: the step makes an angle greater than $\pi/2$ with the gradient, so the directional derivative is negative.

For $\vec x = (1,2,2)^\mathsf{T}$ and $\vec y = (3,0,4)^\mathsf{T}$,

$$
\langle \vec x, \vec y \rangle = 11,
\qquad
\|\vec x\| = 3,
\qquad
\|\vec y\| = 5,
\qquad
\cos \theta = 11/15.
$$

Cauchy–Schwarz is the comparison $11 \le 15$.

[[Cauchy]]

## Orthogonality and projection

**Definition.** Two subspaces are orthogonal when every vector of one is orthogonal to every vector of the other. The orthogonal complement of a subspace $S$ is

$$
S^\perp = \{\vec v : \langle \vec v, \vec s \rangle = 0 \text{ for every } \vec s \in S\}.
$$

$S^\perp$ is a subspace. In $\mathbb{R}^3$ the $x_3$-axis is the orthogonal complement of the $x_1 x_2$-plane. In $\mathbb{R}^2$, if $S = \operatorname{span}\{(1,1)^\mathsf{T}\}$, then $S^\perp$ is the line $x_1 + x_2 = 0$.

A set is orthonormal when the vectors are orthogonal and each has length one. In an orthonormal basis the coordinates are free: the weight of $\vec q_i$ in $\vec x$ is $\langle \vec x, \vec q_i \rangle$. Any $n$ orthogonal nonzero vectors in $\mathbb{R}^n$ are independent, hence a basis.

**Definition.** The projection of $\vec x$ onto a nonzero vector $\vec u$ is

$$
\operatorname{proj}_{\vec u} \vec x = \frac{\langle \vec x, \vec u \rangle}{\|\vec u\|^2}\, \vec u.
$$

The scalar projection is $\langle \vec x, \vec u \rangle / \|\vec u\| = \|\vec x\| \cos \theta$. It is negative when the angle exceeds $\pi/2$, and then the shadow falls on the opposite side of the origin.

The remainder $\vec x - \operatorname{proj}_{\vec u}\vec x$ is orthogonal to $\vec u$:

$$
\left\langle \vec x - \operatorname{proj}_{\vec u}\vec x,\, \vec u \right\rangle
= \langle \vec x, \vec u \rangle - \frac{\langle \vec x, \vec u \rangle}{\|\vec u\|^2} \langle \vec u, \vec u \rangle
= 0.
$$

For a unit vector $\vec q$ the same map is multiplication by the projection matrix $P = \vec q \vec q^\mathsf{T}$. Then $P^2 = P$, and $I - P$ is the remainder.

Let $\vec u = (2,1)^\mathsf{T}$, so $\|\vec u\|^2 = 5$. For $\vec x = (3,4)^\mathsf{T}$ one has $\langle \vec x, \vec u \rangle = 10$ and

$$
\operatorname{proj}_{\vec u}\vec x = (4,2)^\mathsf{T},
\qquad
\vec x - \operatorname{proj}_{\vec u}\vec x = (-1,2)^\mathsf{T}.
$$

The remainder has inner product zero with $\vec u$. For $\vec y = (-3,1)^\mathsf{T}$ the inner product is $-5$, the projection is $(-2,-1)^\mathsf{T}$, and the angle is $3\pi/4$.

[[Projection]]

## Gram-Schmidt and QR

Orthonormal coordinates cost an inner product. Gram–Schmidt builds them from any independent list by removing shadows.

Start with independent $\vec x_1, \ldots, \vec x_k$. Keep $\vec z_1 = \vec x_1$. Then

$$
\vec z_k = \vec x_k - \sum_{j=1}^{k-1} \frac{\langle \vec x_k, \vec z_j \rangle}{\|\vec z_j\|^2}\, \vec z_j,
\qquad
\vec q_k = \frac{\vec z_k}{\|\vec z_k\|}.
$$

The vectors $\vec z_k$ are orthogonal, the vectors $\vec q_k$ are orthonormal, and the first $k$ new vectors span the same subspace as the first $k$ old ones. If the original list is dependent, some $\vec z_k$ is zero: that $\vec x_k$ already lay in the span of the earlier vectors.

For $\vec x_1 = (1,2,2)^\mathsf{T}$, $\vec x_2 = (0,3,6)^\mathsf{T}$ and $\vec x_3 = (6,3,3)^\mathsf{T}$, each $\vec z_j$ has length $3$:

$$
\vec z_1 = (1,2,2)^\mathsf{T},
\quad
\vec z_2 = (-2,-1,2)^\mathsf{T},
\quad
\vec z_3 = (2,-2,1)^\mathsf{T}.
$$

The coefficient of the shadow of $\vec x_3$ on $\vec z_2$ is negative: the angle is obtuse. Dividing by $3$ gives the orthonormal frame.

[[GramSchmidt]]

Put independent columns $\vec a_j$ into a square matrix $A$. Gram–Schmidt writes each column as a combination of $\vec q_1, \ldots, \vec q_j$. In matrices this is the QR decomposition $A = QR$: the columns of $Q$ are the $\vec q_j$, and $R$ is upper triangular with

$$
r_{jj} = \|\vec z_j\|,
\qquad
r_{ij} = \langle \vec a_j, \vec q_i \rangle
\quad (i < j).
$$

In the example the diagonal of $R$ is $3,3,3$.

**Definition.** A square matrix with orthonormal columns is an orthogonal matrix. Then $Q^\mathsf{T} Q = I$, so $Q^{-1} = Q^\mathsf{T}$.

The system $A\vec x = \vec b$ becomes the triangular system $R\vec x = Q^\mathsf{T}\vec b$. A numerical QR can change the sign of a column of $Q$ and of the matching row of $R$. The product $QR$ is unchanged.

## The four subspaces

One matrix carries the bookkeeping. Let

$$
A = \begin{bmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \end{bmatrix}.
$$

It sends $\mathbb{R}^3$ to $\mathbb{R}^2$, and

$$
A\vec x = x_1 \begin{bmatrix} 1 \\ 2 \end{bmatrix} + x_2 \begin{bmatrix} 2 \\ 4 \end{bmatrix} + x_3 \begin{bmatrix} 3 \\ 6 \end{bmatrix}.
$$

**Definition.** The column space, or range, is $\mathcal{R}(A) = \{A\vec x : \vec x \in \mathbb{R}^n\} \subseteq \mathbb{R}^m$. It is the span of the columns. The null space is $\mathcal{N}(A) = \{\vec x : A\vec x = \vec 0\} \subseteq \mathbb{R}^n$.

The equation $A\vec x = \vec b$ has a solution exactly when $\vec b \in \mathcal{R}(A)$. The null space holds the inputs sent to zero. It lives in the domain; the column space lives in the codomain.

The second column of this $A$ is twice the first, and the third is three times the first, so $\mathcal{R}(A) = \operatorname{span}\{(1,2)^\mathsf{T}\}$, a line in $\mathbb{R}^2$. The equation $A\vec x = \vec 0$ is the single condition $x_1 + 2x_2 + 3x_3 = 0$, hence

$$
\mathcal{N}(A) = \operatorname{span}\{(-2,1,0)^\mathsf{T}, (-3,0,1)^\mathsf{T}\},
$$

a plane in $\mathbb{R}^3$. If $\vec x_0$ solves $A\vec x = \vec b$, every solution is the affine space $\vec x_0 + \mathcal{N}(A)$. There is exactly one solution when $\mathcal{N}(A) = \{\vec 0\}$.

The vector $(2,4)^\mathsf{T} = 2(1,2)^\mathsf{T}$ is reachable, and one solution is $(2,0,0)^\mathsf{T}$. Every solution is then

$$
(2,0,0)^\mathsf{T} + s(-2,1,0)^\mathsf{T} + t(-3,0,1)^\mathsf{T}.
$$

The vector $(-1,3)^\mathsf{T}$ is not a multiple of $(1,2)^\mathsf{T}$, so that system has no solution. The best substitute is the nearest point of the column space, which is least squares.

**Definition.** The row space is $\mathcal{R}(A^\mathsf{T})$, the span of the rows. The left null space is $\mathcal{N}(A^\mathsf{T}) = \{\vec z : A^\mathsf{T}\vec z = \vec 0\}$.

For this $A$ the row space is $\operatorname{span}\{(1,2,3)^\mathsf{T}\}$ in $\mathbb{R}^3$, and the left null space is $\operatorname{span}\{(-2,1)^\mathsf{T}\}$ in $\mathbb{R}^2$.

**Theorem.** The column rank and the row rank are equal. Their common value is $r = \operatorname{rank} A$, and $r \le \min\{m,n\}$. Rank–nullity says $\dim \mathcal{N}(A) = n - r$: of the $n$ directions in the domain, $r$ are carried to independent directions and the other $n - r$ are sent to zero.

Here $r = 1$ and $\dim \mathcal{N}(A) = 2$.

**Theorem.** The null spaces are the orthogonal complements of the row and column spaces:

$$
\mathcal{N}(A) = \mathcal{R}(A^\mathsf{T})^\perp,
\qquad
\mathcal{N}(A^\mathsf{T}) = \mathcal{R}(A)^\perp.
$$

Indeed $A\vec x = \vec 0$ says that $\vec x$ has inner product zero with every row, hence with the whole row space. The dimensions add:

$$
\dim \mathcal{R}(A^\mathsf{T}) + \dim \mathcal{N}(A) = n,
\qquad
\dim \mathcal{R}(A) + \dim \mathcal{N}(A^\mathsf{T}) = m.
$$

[[Subspaces]]

## Eigenvalues and diagonalization

A matrix usually turns a vector into a new direction. Along a few directions it only stretches, and along such a direction a power $A^k$ becomes a power of a number.

**Definition.** For $A \in \mathbb{R}^{n \times n}$, a nonzero $\vec x$ with $A\vec x = \lambda \vec x$ is an eigenvector, and $\lambda$ is its eigenvalue. A negative $\lambda$ stretches and reverses the direction. The zero vector is excluded: $A\vec 0 = \lambda \vec 0$ holds for every $\lambda$.

Rearranging gives $(A - \lambda I)\vec x = \vec 0$. An eigenvector is a nonzero vector of $\mathcal{N}(A - \lambda I)$, so it exists exactly when that matrix is singular:

$$
\lambda \text{ is an eigenvalue} \quad \Longleftrightarrow \quad \det(A - \lambda I) = 0.
$$

The polynomial $p(\lambda) = \det(A - \lambda I)$ is the characteristic polynomial, of degree $n$. The eigenspace $E_\lambda = \mathcal{N}(A - \lambda I)$ contains the eigenvectors of $\lambda$ together with $\vec 0$. It is a subspace, so every nonzero multiple of an eigenvector is an eigenvector. Some roots may be complex. The rotation by $\pi/2$, with rows $(0,-1)$ and $(1,0)$, has $p(\lambda) = \lambda^2 + 1$ and no real eigenvector: it turns every direction.

For

$$
A = \begin{bmatrix} 4 & -5 \\ 2 & -3 \end{bmatrix}
$$

one has $p(\lambda) = \lambda^2 - \lambda - 2 = (\lambda - 2)(\lambda + 1)$. The eigenvalues are $2$ and $-1$, with

$$
E_2 = \operatorname{span}\{(5,2)^\mathsf{T}\},
\qquad
E_{-1} = \operatorname{span}\{(1,1)^\mathsf{T}\}.
$$

Put those eigenvectors in the columns of $X$ and the eigenvalues on the diagonal of $\Lambda$. Then $AX = X\Lambda$. The columns are independent, so $A = X\Lambda X^{-1}$ and $A^k = X\Lambda^k X^{-1}$.

The vector $(1,0)^\mathsf{T}$ splits as $\tfrac13 (5,2)^\mathsf{T} - \tfrac23 (1,1)^\mathsf{T}$. After $k$ applications the coefficients are $2^k/3$ and $-\tfrac23 (-1)^k$. For large $k$ the factor $2^k$ dominates, so $A^k \vec x$ turns toward $(5,2)^\mathsf{T}$, the eigenvector of larger absolute eigenvalue.

[[Eigen]]
