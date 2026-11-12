---
title: Convex Functions
code: "6"
order: 8
status: published
---

A derivative describes what happens near one point. Convexity compares values at different points and controls what can happen between them, which is why it turns local information into global conclusions: local minimizers are global, tangents are lower bounds, and a curvature test on the Hessian settles the question. The chapter uses convex sets, gradients and Hessians, and positive semidefinite matrices from [Linear Algebra](/notes/linear-algebra/).

## What convexity asks of a function

Let $C\subseteq\mathbb R^n$ be convex. Given $x,y\in C$ and $t\in[0,1]$, define

$$
z_t=(1-t)x+ty.
$$

There are two natural heights associated with this point. The first is the actual value $f(z_t)$. The second interpolates the endpoint values,

$$
\ell_t=(1-t)f(x)+tf(y).
$$

The point $(z_t,\ell_t)$ lies on the chord joining $(x,f(x))$ and $(y,f(y))$. The point $(z_t,f(z_t))$ lies on the graph. Convexity asks that the graph never rise above the chord.

**Definition.** Let $C\subseteq\mathbb R^n$ be convex. A function $f:C\to\mathbb R$ is convex when $f((1-t)x+ty)\le (1-t)f(x)+tf(y)$ for every $x,y\in C$ and every $t\in[0,1]$. It is strictly convex if the inequality is strict whenever $x\ne y$ and $0<t<1$. It is concave if $-f$ is convex, equivalently if the chord inequality is reversed.

The inequality says that interpolation in the input followed by evaluation is no larger than interpolation of the output values. It does not say that $f$ must be positive, increasing, symmetric, or differentiable.

The domain condition matters. Convexity of $C$ guarantees that $z_t$ belongs to the domain. A convex formula restricted to a disconnected feasible set does not produce a convex program. In the strict version the endpoints $t=0,1$ and the case $x=y$ are excluded because equality is unavoidable there.

[[ChordGap]]

### 1.1 The chord gap

Define

$$
G(x,y,t)=(1-t)f(x)+tf(y)-f((1-t)x+ty).
$$

Convexity is exactly the statement $G\ge0$ for all admissible triples. One negative gap disproves convexity. A finite collection of nonnegative gaps does not prove it.

For $f(x)=x^2$, expansion gives

$$
\begin{aligned}
G(x,y,t)
&=(1-t)x^2+ty^2-((1-t)x+ty)^2\\
&=t(1-t)(x-y)^2.
\end{aligned}
$$

Every factor is nonnegative. When $x\ne y$ and $0<t<1$, every factor is positive. Thus $x^2$ is strictly convex on $\mathbb R$.

This calculation explains the geometry quantitatively. The gap vanishes when the endpoints coincide, vanishes at the chord endpoints, and is largest at $t=1/2$ for fixed $x,y$.

### 1.2 Examples and distinctions

For an affine function $f(x)=a^Tx+b$, substitution gives equality in the chord inequality. Every affine function is both convex and concave. On a domain with two distinct points it is not strictly convex.

The function $e^{ax}$ is convex for every real $a$, since its second derivative is $a^2e^{ax}\ge0$. It is strictly convex if $a\ne0$ and constant if $a=0$. We justify the second-derivative criterion later.

The function $\log x$ is strictly concave on $(0,\infty)$ because its second derivative is $-1/x^2<0$. Consequently $-\log x$ is strictly convex there.

The function $x^3$ is neither convex nor concave on $\mathbb R$. At endpoints $-2,0$, the midpoint value is $-1$ while the chord height is $-4$, violating convexity. At endpoints $0,2$, the midpoint value is $1$ while the chord height is $4$, violating concavity. The domain is essential here. The same function is convex on $[0,\infty)$ and concave on $(-\infty,0]$.

Every norm is convex. The triangle inequality and positive homogeneity give

$$
\|(1-t)x+ty\|\le (1-t)\|x\|+t\|y\|.
$$

A norm need not be differentiable. In particular, $|x|$ is convex even though it has no derivative at zero. No norm on a nonzero vector space is strictly convex as a function on the whole space, because equality holds along positive rays. The phrase “strictly convex norm” refers to the geometry of its unit ball, a different convention. In contrast, the squared Euclidean norm is strictly convex.

### 1.3 Restricting to lines

Fix a point $x$ and direction $d$. Along a line, define $\phi(s)=f(x+sd)$ on the interval where $x+sd\in C$. A convex function has a convex restriction to every such line. Conversely, convexity of all line restrictions implies convexity of $f$, since every pair of points lies on a line.

This observation will turn multivariable curvature into a one-variable calculation. It also explains why checking the two coordinate directions is insufficient. A function may curve upwards along both axes and downwards along a diagonal.

## Why convex programs are special

A convex program minimizes a convex function over a nonempty convex feasible set,

$$
\inf_{x\in C}f(x).
$$

The infimum notation allows the possibility that no feasible point attains the best limiting value. When a minimizer exists, we may write a minimum.

**Definition.** A point $x^*\in C$ is a local minimizer of $f$ on $C$ when there is a $\delta>0$ with $f(x^*)\le f(x)$ for every $x\in C$ with $\|x-x^*\|<\delta$. The neighborhood is relative to $C$, so boundary points can be local minimizers.

### 2.1 Every local minimizer is global

**Theorem.** If $f$ is convex on a convex set $C$, every local minimizer of $f$ on $C$ is a global minimizer.

Suppose $x^*$ is a local minimizer, but some $y\in C$ satisfies $f(y)<f(x^*)$. For $0<t<1$, set

$$
z_t=(1-t)x^*+ty.
$$

Feasibility follows from convexity of $C$. Convexity of $f$ gives

$$
f(z_t)\le (1-t)f(x^*)+tf(y)<f(x^*).
$$

But $\|z_t-x^*\|=t\|y-x^*\|$, so $z_t$ can be made arbitrarily close to $x^*$. In particular, for a local-minimality radius $\delta>0$, choose

$$
0<t<\min\{1,\delta/\|y-x^*\|\}.
$$

The resulting feasible point lies in the neighborhood and has a smaller objective value, a contradiction. Therefore every local minimizer is global.

The proof uses both convexities for different reasons. Convexity of the feasible set supplies a feasible path towards the allegedly better point. Convexity of the function makes every interior point of that path better than $x^*$.

[[LocalGlobal]]

### 2.2 What fails without the hypotheses

Consider $f(x)=x^2$ on $C=[-3,-2]\cup[1,4]$. The objective is convex on $\mathbb R$, but the feasible set is disconnected. Both $-2$ and $1$ are local minimizers relative to $C$. Only $1$ is global because $f(1)=1<4=f(-2)$. The segment joining them passes through infeasible points.

Now consider $f(x)=x^3-3x$ on $[-3,3]$. The feasible set is convex, but the function is not. Its derivative is $3x^2-3$. The interior point $1$ is a local minimizer with value $-2$, while the left endpoint $-3$ is a relative local and global minimizer with value $-18$. The stationary point $-1$ is a local maximum. Convexity of the domain alone cannot rule out a suboptimal local minimum.

### 2.3 The optimal set is convex

Write

$$
X^*=\{x\in C:f(x)\le f(y)\text{ for every }y\in C\}.
$$

**Theorem.** For a convex program the optimal set $X^*$ is convex, and $f$ is constant on it. If $f$ is strictly convex, $X^*$ has at most one point.

If $X^*$ is empty, it is convex by convention. Otherwise let $u,v\in X^*$ and let $f^*$ be their common value. For $z_t=(1-t)u+tv$,

$$
f(z_t)\le(1-t)f(u)+tf(v)=f^*.
$$

Since $z_t\in C$, its value cannot be smaller than the minimum. Hence $f(z_t)=f^*$ and $z_t\in X^*$. The objective is constant on the entire segment joining two minimizers.

If $f$ is strictly convex, two distinct minimizers are impossible. Strict convexity would make their midpoint strictly smaller than their common minimum. Thus strict convexity gives at most one minimizer.

“At most one” is not an existence theorem. The function $x^2$ on $(1,2)$ is strictly convex and has infimum $1$, but no minimizer. The function $e^x$ on $\mathbb R$ is another example, with unattained infimum zero.

**Extension.** An additional existence principle is useful. A continuous function on a nonempty compact feasible set attains a minimum. This is a separate result from convexity. A continuous coercive function on $\mathbb R^n$, meaning $f(x)\to\infty$ as $\|x\|\to\infty$, also attains a minimum. These are supplementary observations, not new convexity criteria.

### 2.4 Flat valleys and unique minima

For $f(x_1,x_2)=x_1^2$, the minimum is zero and

$$
X^*=\{(0,s):s\in\mathbb R\}.
$$

The function is convex but has an entire line of minimizers. Moving in the $x_2$ direction does not change its value.

On the unit square, let $f(x_1,x_2)=(x_1+x_2-1)^2$. Put $p=u_1+u_2-1$ and $q=v_1+v_2-1$. Its chord gap is

$$
t(1-t)(p-q)^2\ge0.
$$

The minimum zero is attained exactly on

$$
X^*=\{(s,1-s):0\le s\le1\}.
$$

For comparison, $g(x_1,x_2)=x_1x_2$ is neither convex nor concave on that square. The endpoints $(1,0),(0,1)$ give midpoint value $1/4$ and chord height zero, disproving convexity. The endpoints $(0,0),(1,1)$ give midpoint value $1/4$ and chord height $1/2$, disproving concavity.

[[OptimalSet]]

## Turning a function into a set

The graph records the exact height of a function. Its epigraph records all heights at least as large.

**Definition.** The epigraph of $f:C\to\mathbb R$ is $\operatorname{epi}(f)=\{(x,r)\in\mathbb R^{n+1}:x\in C,\ r\ge f(x)\}$ and its hypograph is $\operatorname{hyp}(f)=\{(x,r):x\in C,\ r\le f(x)\}$.

The domain remains part of both definitions. If $C=[a,b]$, the epigraph occupies only the vertical region over $[a,b]$.

### 3.1 Epigraph equivalence

**Theorem.** A function on a convex domain is convex if and only if its epigraph is convex.

Assume first that $f$ is convex. Take $(x,r),(y,s)\in\operatorname{epi}(f)$. Thus $r\ge f(x)$ and $s\ge f(y)$. Their convex combination has base point $z_t=(1-t)x+ty\in C$ and height $(1-t)r+ts$. Since

$$
f(z_t)\le(1-t)f(x)+tf(y)\le(1-t)r+ts,
$$

the combined point belongs to the epigraph.

Conversely, assume the epigraph is convex. The graph points $(x,f(x))$ and $(y,f(y))$ belong to it. Their convex combination also belongs to it, which says exactly

$$
f((1-t)x+ty)\le(1-t)f(x)+tf(y).
$$

The corresponding statement for concavity uses the hypograph. The graph itself is generally not convex as a set. For $x^2$, the chord between two distinct graph points lies above the graph, so its interior points are not graph points.

[[Epigraph]]

### 3.2 A polyhedral epigraph

On $C=[0,3]$, take $f(x)=|x-1|$. Since $|x-1|=\max\{x-1,1-x\}$, its epigraph is described by

$$
-x\le0,\qquad x\le3,\qquad x-r\le1,\qquad -x-r\le-1.
$$

Each condition defines a half-plane. Their intersection is convex, proving convexity of $f$ geometrically.

Replace $f$ by $g(x)=\min\{|x-1|,1\}$. Its graph agrees with the V until $x=2$ and then becomes horizontal. The points $(1,0)$ and $(3,1)$ belong to its epigraph, but their midpoint $(2,1/2)$ does not, because $g(2)=1$. Taking a pointwise minimum does not generally preserve convexity.

This has a set-theoretic explanation. Over a common domain, the epigraph of a pointwise maximum is the intersection of the epigraphs, while the epigraph of the minimum of two functions is their union. Intersections preserve convexity; unions need not.

## Sublevel sets and what they do not tell us

**Definition.** For $\alpha\in\mathbb R$, the sublevel set of $f$ is $C_\alpha=\{x\in C:f(x)\le\alpha\}$ and the level set is $\{x\in C:f(x)=\alpha\}$.

A sublevel set contains every point whose objective value is no greater than the threshold; a level set only those with value exactly $\alpha$.

**Theorem.** If $f$ is convex, every sublevel set of $f$ is convex.

Indeed, for $x,y\in C_\alpha$,

$$
f((1-t)x+ty)\le(1-t)f(x)+tf(y)\le\alpha.
$$

There is also a geometric proof. Intersect the epigraph with the horizontal hyperplane $r=\alpha$, then project that intersection onto the $x$ coordinates. The resulting set is exactly $C_\alpha$. Intersections with a hyperplane and linear projections preserve convexity.

The phrase “the level set is the boundary of the sublevel set” is only a useful picture in regular examples, not a universal identity. If $f\equiv0$ on $\mathbb R^n$ and $\alpha=0$, the level set and sublevel set are both $\mathbb R^n$, whose boundary is empty.

### 4.1 A bowl and its horizontal slices

For $f(x)=x_1^2+x_2^2$,

$$
C_\alpha=
\begin{cases}
\varnothing,&\alpha<0,\\
\{0\},&\alpha=0,\\
\{x:\|x\|_2\le\sqrt\alpha\},&\alpha>0.
\end{cases}
$$

The level set for $\alpha>0$ is a circle. The sublevel set is the filled disk. The circle is not convex, although the disk is.

### 4.2 Convex sublevel sets do not imply convexity

For $f(x)=\sqrt{|x|}$,

$$
C_\alpha=\varnothing\quad(\alpha<0),\qquad
C_\alpha=[-\alpha^2,\alpha^2]\quad(\alpha\ge0).
$$

Every sublevel set is convex. Yet for endpoints zero and four,

$$
f(2)=\sqrt2>1=\tfrac12f(0)+\tfrac12f(4).
$$

Thus the function is not convex.

**Extension.** Functions with convex sublevel sets are called quasiconvex. This terminology goes beyond the course notes. Quasiconvexity compares a mixed value with the larger endpoint value, rather than the weighted average, $f((1-t)x+ty)\le\max\{f(x),f(y)\}$. The equivalence follows by choosing $\alpha=\max\{f(x),f(y)\}$ in one direction, and using the displayed inequality for two points in a sublevel set in the other.

### 4.3 A ring-shaped valley

Consider

$$
f(x)=(x_1^2+x_2^2-1)^2=(\|x\|_2^2-1)^2.
$$

For $\alpha\ge0$, the condition $f(x)\le\alpha$ is equivalent to

$$
1-\sqrt\alpha\le\|x\|_2^2\le1+\sqrt\alpha.
$$

For negative $\alpha$ the sublevel set is empty. At zero it is the unit circle. For $0<\alpha<1$ it is a closed annulus with inner and outer radii

$$
r_{\mathrm{in}}=\sqrt{1-\sqrt\alpha},\qquad
r_{\mathrm{out}}=\sqrt{1+\sqrt\alpha}.
$$

For $\alpha\ge1$, it is the disk of radius $\sqrt{1+\sqrt\alpha}$. At $\alpha=1$, the hole closes and the origin is included.

The nonconvex sublevel set at zero is already enough to disprove convexity. The points $(1,0)$ and $(-1,0)$ have value zero, but their midpoint has value one. Some higher sublevel sets are convex, which does not repair the function's failure of convexity.

[[Sublevel]]

## First-order information becomes a global bound

For the differentiable statements below, assume $f$ is differentiable on an open neighborhood of a convex set $C$, and convexity is being considered on $C$. This convention makes gradients at boundary points unambiguous. On an open convex domain, no extension convention is needed.

The affine approximation at $x$ is

$$
h_x(y)=f(x)+\nabla f(x)^T(y-x).
$$

For a general smooth function this approximation is local. For a convex differentiable function it is a global lower bound on its domain.

**Theorem.** A differentiable $f$ is convex on $C$ if and only if $f(y)\ge f(x)+\nabla f(x)^T(y-x)$ for all $x,y\in C$.

This is the gradient inequality, also called the first-order characterization of convexity.

### 5.1 From convexity to the gradient inequality

Apply convexity along the segment from $x$ to $y$,

$$
f(x+t(y-x))\le f(x)+t(f(y)-f(x)).
$$

For $t>0$, subtract $f(x)$ and divide by $t$,

$$
\frac{f(x+t(y-x))-f(x)}{t}\le f(y)-f(x).
$$

As $t\downarrow0$, the left side tends to the directional derivative $\nabla f(x)^T(y-x)$. Rearranging proves the inequality. Geometrically, a secant approaches the tangent while retaining the global comparison with the distant point $y$.

### 5.2 From the gradient inequality to convexity

Assume the gradient inequality holds for all pairs. Put $z=(1-t)x+ty$ with $0<t<1$. Apply the inequality at the common base point $z$,

$$
f(x)\ge f(z)+\nabla f(z)^T(x-z),
$$

$$
f(y)\ge f(z)+\nabla f(z)^T(y-z).
$$

Multiply these inequalities by $1-t$ and $t$, respectively, and add. The gradient terms cancel because

$$
(1-t)(x-z)+t(y-z)=0.
$$

Therefore $(1-t)f(x)+tf(y)\ge f(z)$, which is convexity. Choosing the mixed point as the tangent base point is what creates this cancellation.

### 5.3 The strict version, including the missing argument

**Theorem.** A differentiable $f$ is strictly convex on $C$ if and only if $f(y)>f(x)+\nabla f(x)^T(y-x)$ whenever $x\ne y$.

The reverse implication follows from the same weighted-sum proof with strict inequalities. For the forward implication, a limit of strict inequalities alone is insufficient because strictness can be lost in a limit.

Instead, suppose $f$ is strictly convex but equality holds for distinct $x,y$. At $z=(1-t)x+ty$, strict convexity gives

$$
f(z)<(1-t)f(x)+tf(y)
=f(x)+t\nabla f(x)^T(y-x)=h_x(z).
$$

The ordinary gradient inequality gives $f(z)\ge h_x(z)$, a contradiction. Hence equality at distinct points is impossible.

### 5.4 Tangent gaps and monotone gradients

For $f(x)=x^2$, the tangent at $a$ is $h_a(x)=2ax-a^2$, and

$$
f(x)-h_a(x)=(x-a)^2.
$$

The gap is nonnegative everywhere and zero only at the point of contact.

Apply the gradient inequality once from $x$ to $y$ and once from $y$ to $x$. Adding gives

$$
(\nabla f(y)-\nabla f(x))^T(y-x)\ge0.
$$

This is monotonicity of the gradient. In one dimension, if $x<y$, division by $y-x>0$ gives $f'(x)\le f'(y)$. Under strict convexity, the two tangent inequalities are strict and the derivative is strictly increasing in this pairwise sense. That does not require $f''$ to be positive at every point.

[[Tangent]]

## Lower bounds and constrained optimality

For any base point $a\in C$, the gradient inequality yields

$$
\inf_{x\in C}h_a(x)\le\inf_{x\in C}f(x).
$$

This is a genuine lower bound, although it may equal $-\infty$ on an unbounded feasible set. A tangent picture alone does not guarantee a useful finite bound.

For $f(x)=x^2$ on $[1,3]$, the tangent at $a\in[1,3]$ is $h_a(x)=2ax-a^2$. Since its slope is positive, its minimum on the interval occurs at one,

$$
L(a)=2a-a^2.
$$

At $a=2$, the bound is zero while the true minimum is one. At $a=1$, the bound equals one and is exact. A feasible objective value $U=f(\bar x)$ and a lower bound $L$ bracket the optimum,

$$
L\le f^*\le U.
$$

Their difference $U-L$ bounds the suboptimality of the feasible point $\bar x$.

### 6.1 Stationary points

**Theorem.** If $f$ is differentiable and convex on $C$, and $x^*\in C$ satisfies $\nabla f(x^*)=0$, then $x^*$ is a global minimizer of $f$ on $C$.

The tangent inequality at $x^*$ gives $f(y)\ge f(x^*)$ for every feasible $y$.

Openness is needed to infer stationarity from unconstrained local optimality, because small movements in both directions must be feasible. It is not needed for the sufficiency of a zero gradient when the gradient inequality already applies.

A constrained minimizer can have nonzero gradient. For $x^2$ on $[1,3]$, the minimizer is one and its derivative is two.

### 6.2 The feasible-direction condition

**Extension.** The following is an explanatory extension of the course notes. For differentiable convex $f$ on convex $C$, a feasible $x^*$ minimizes $f$ if and only if $\nabla f(x^*)^T(y-x^*)\ge0$ for every $y\in C$.

Sufficiency follows immediately from the gradient inequality. For necessity, minimality implies $f(x^*+t(y-x^*))-f(x^*)\ge0$ for $0<t\le1$. Divide by $t$ and let $t\downarrow0$.

This condition says that no direction towards another feasible point has a negative first-order change. It is a variational inequality and will be useful when connecting convex optimization to constrained equilibrium problems.

For $f(x)=x_1^2+x_1x_2+x_2^2$ on $C=\{x_1\ge1,x_2\ge1\}$, the tangent gap at any base point with displacement $d$ is

$$
d_1^2+d_1d_2+d_2^2=(d_1+d_2/2)^2+3d_2^2/4.
$$

It is positive for $d\ne0$, so $f$ is strictly convex. At $a=(2,1)$, $f(a)=7$, $\nabla f(a)=(5,4)$, and the tangent is $5x_1+4x_2-7$, whose minimum over $C$ is two. At $a=(1,1)$, the tangent is $3+3(x_1-1)+3(x_2-1)$, whose minimum is three. Since $f(1,1)=3$, the bound is attained and $(1,1)$ is the unique minimizer. Its gradient $(3,3)$ is not zero, but its inner product with every feasible displacement is nonnegative.

[[LowerBound]]

## The Hessian as directional curvature

Assume $\Omega\subseteq\mathbb R^n$ is open and convex and $f\in C^2(\Omega)$. The Hessian $H(x)=\nabla^2f(x)$ is symmetric. For $\phi(s)=f(x+sd)$, the chain rule gives

$$
\phi'(s)=\nabla f(x+sd)^Td,\qquad
\phi''(s)=d^TH(x+sd)d.
$$

Thus $d^TH(x)d$ is curvature along direction $d$. Positive semidefiniteness means this quantity is nonnegative for every direction. It is stronger than nonnegative diagonal entries.

### 7.1 Hessian characterization

**Theorem.** Let $\Omega$ be open and convex and $f\in C^2(\Omega)$. Then $f$ is convex on $\Omega$ if and only if $H(x)\succeq0$ for every $x\in\Omega$.

For sufficiency, put $d=y-x$ and apply Taylor's theorem along the segment,

$$
f(y)=f(x)+\nabla f(x)^Td+
\int_0^1(1-s)d^TH(x+sd)d\,ds.
$$

The segment remains in $\Omega$ by convexity. If every Hessian is positive semidefinite, the integral is nonnegative, giving the gradient inequality.

For necessity, suppose some point $x$ and direction $d$ satisfy $q=d^TH(x)d<0$. Openness allows $x+td\in\Omega$ for all sufficiently small $t$. Taylor expansion gives

$$
f(x+td)-f(x)-t\nabla f(x)^Td=\tfrac12t^2q+r(t),
\qquad \frac{r(t)}{t^2}\longrightarrow0.
$$

For sufficiently small nonzero $t$, choose $|r(t)|/t^2<-q/4$. Then the right side is at most $t^2q/4<0$. The function falls below its tangent, contradicting the gradient inequality. This proves necessity.

The notation $r(t)=o(t^2)$ means precisely that $r(t)/t^2\to0$. It does not mean that the remainder is identically zero. The negative quadratic term dominates it sufficiently close to the base point.

[[Curvature]]

### 7.2 Strict convexity is not pointwise positive curvature

If $H(x)\succ0$ everywhere on an open convex domain, the integral remainder is positive for every nonzero displacement. Hence $f$ is strictly convex. The converse fails.

For $f(x)=x^4$, $f''(0)=0$, but for $y\ne x$,

$$
f(y)-f(x)-f'(x)(y-x)
=(y-x)^2\big((y+x)^2+2x^2\big)>0.
$$

The bracket could vanish only if $x=y=0$, which is excluded. Therefore $x^4$ is strictly convex despite its zero curvature at the origin.

A Hessian that is positive semidefinite at a single stationary point does not establish convexity on a domain. It does not even establish local minimality. The function $-x^4$ has zero first and second derivatives at zero, which is a strict local maximum.

### 7.3 Strong convexity as an optional extension

**Extension.** A differentiable function is $m$-strongly convex, for $m>0$, when $f(y)\ge f(x)+\nabla f(x)^T(y-x)+\frac m2\|y-x\|_2^2$ for all $x,y$. For $C^2$ functions on an open convex domain, this is equivalent to $H(x)\succeq mI$ everywhere.

Strong convexity requires a uniform lower curvature bound. Strict convexity merely requires a strict comparison between distinct points.

The function $x^2$ is 2-strongly convex. The function $x^4$ is strictly convex but not strongly convex on $\mathbb R$. Also, $e^x$ has a positive Hessian everywhere, yet no positive uniform lower curvature bound on $\mathbb R$. These are three different levels of information.

## Quadratic optimization

For symmetric $Q\in\mathbb R^{n\times n}$, consider

$$
f(x)=\frac12x^TQx+c^Tx+b.
$$

Differentiating gives

$$
\nabla f(x)=Qx+c,\qquad \nabla^2f(x)=Q.
$$

The factor $1/2$ cancels the factor two from differentiating the symmetric quadratic form. If a matrix is not symmetric, the function depends only on its symmetric part $(Q+Q^T)/2$.

**Theorem.** The quadratic $f$ is convex exactly when $Q\succeq0$. If $Q\succ0$, it has the unique minimizer $x^*$ satisfying $Qx^*=-c$.

Algebraically, $x^*=-Q^{-1}c$. Numerically, solve the linear system instead of explicitly forming an inverse. Expanding around the minimizer shows

$$
f(x)=f(x^*)+\frac12(x-x^*)^TQ(x-x^*).
$$

This identity exhibits both global optimality and the shape of the level sets.

### 8.1 Singular curvature requires a second question

**Extension.** If $Q\succeq0$ is singular, convexity alone does not guarantee a minimizer. If $Qx=-c$ has a solution $x_0$, all minimizers are $x_0+\ker Q$. If it has no solution, $c$ has a nonzero component along $\ker Q$, and a suitable direction in that kernel sends the linear term to $-\infty$.

For example, $f(x_1,x_2)=x_1^2$ has a flat line of minima, whereas $x_1^2+x_2$ is convex and unbounded below. Their Hessians are identical. This prevents the misleading rule “singular PSD always means many minimizers.”

### 8.2 A worked positive definite example

Let

$$
f(x)=2x_1^2+2x_1x_2+x_2^2-2x_1.
$$

Then

$$
Q=\begin{pmatrix}4&2\\2&2\end{pmatrix},\qquad c=\binom{-2}{0}.
$$

The leading principal minors are $4$ and $4$, both positive, so $Q\succ0$. The stationary equations are $4x_1+2x_2=2$ and $2x_1+2x_2=0$, giving $x^*=(1,-1)$ and $f(x^*)=-1$.

Replace the cross term by $4x_1x_2$. The Hessian becomes

$$
\begin{pmatrix}4&4\\4&2\end{pmatrix},
$$

whose determinant is $-8$. It is indefinite. The stationary point is $(-1/2,1)$ with value $1/2$, while the origin has value zero. Along $d=(1,-2)$, the directional quadratic form equals $-4$, so the objective is unbounded below along a suitable line through the stationary point.

## Conclusions depend on the domain

Consider

$$
f(x_1,x_2)=x_1^3-3x_1+x_2^2.
$$

Its derivatives are

$$
\nabla f=\binom{3x_1^2-3}{2x_2},\qquad
H=\begin{pmatrix}6x_1&0\\0&2\end{pmatrix}.
$$

On the open convex half-plane $x_1>0$, the Hessian is positive definite. The only stationary point there is $(1,0)$, which is the unique global minimizer over that domain, with value $-2$.

On all of $\mathbb R^2$, the function is not convex and is unbounded below as $x_1\to-\infty$ with $x_2=0$. The point $(1,0)$ remains a local minimum but is not global. The other stationary point $(-1,0)$ has an indefinite Hessian and is a saddle.

For a one-variable example, $f(x)=x\log x$ on $(0,\infty)$ has derivative $\log x+1$ and second derivative $1/x>0$. Its unique minimizer is $e^{-1}$ with value $-e^{-1}$. The domain excludes zero, so formulas involving $\log x$ must never be evaluated there.

[[DomainMatters]]

## Least squares connects geometry, rank and convexity

Let $A\in\mathbb R^{m\times n}$, $b\in\mathbb R^m$, and

$$
f(x)=\frac12\|Ax-b\|_2^2.
$$

Expansion gives

$$
f(x)=\frac12x^TA^TAx-b^TAx+\frac12b^Tb,
$$

so

$$
\nabla f(x)=A^T(Ax-b),\qquad H=A^TA.
$$

For every direction $d$,

$$
d^TA^TAd=\|Ad\|_2^2\ge0.
$$

**Theorem.** Least squares is always convex. It is strictly convex exactly when $A$ has full column rank.

Indeed, positive definiteness of $A^TA$ is equivalent to $Ad=0$ implying $d=0$. If $Ad=0$ for a nonzero direction, then $f(x+td)=f(x)$ for every $t$, which rules out strict convexity directly.

### 10.1 Normal equations and projection

The minimizers satisfy

$$
A^TAx=A^Tb.
$$

Equivalently, $A^T(b-Ax)=0$. The residual is orthogonal to every column of $A$, so $Ax$ is the orthogonal projection of $b$ onto $\operatorname{range}(A)$.

A least-squares minimizer always exists in finite dimensions, even without full column rank. The range of $A$ is a closed linear subspace, and the orthogonal projection exists. This is more information than generic convexity alone provides.

With full column rank, the solution is unique. Otherwise all minimizers have the form

$$
X^*=A^+b+\ker A.
$$

All these parameter vectors produce the same fitted vector. Nonuniqueness of parameters does not mean nonuniqueness of the fit.

### 10.2 Why the pseudoinverse chooses minimum norm

For a rank-$r$ SVD,

$$
A=U\Sigma V^T,\qquad
A^+=\sum_{i=1}^r\frac1{\sigma_i}v_i u_i^T.
$$

Only nonzero singular values are inverted. The vector $x^\dagger=A^+b$ lies in $\operatorname{range}(A^T)$, which is orthogonal to $\ker A$. For any other minimizer $x^\dagger+z$, with $z\in\ker A$,

$$
\|x^\dagger+z\|_2^2=\|x^\dagger\|_2^2+\|z\|_2^2.
$$

Therefore $x^\dagger$ is the unique minimizer with the smallest Euclidean norm.

### 10.3 Rank-deficient worked example

Take

$$
A=\begin{pmatrix}1&2\\1&2\\1&2\end{pmatrix},\qquad
b=\begin{pmatrix}1\\2\\6\end{pmatrix}.
$$

Then

$$
A^TA=\begin{pmatrix}3&6\\6&12\end{pmatrix},\qquad A^Tb=\binom9{18}.
$$

The normal equations reduce to $x_1+2x_2=3$. Hence

$$
X^*=\{(3-2s,s):s\in\mathbb R\}.
$$

Every minimizer has fitted vector $(3,3,3)^T$, residual $b-Ax=(-2,-1,3)^T$, and objective value seven.

The nonzero singular value is $\sqrt{15}$, with

$$
v_1=\frac1{\sqrt5}\binom12,\qquad
u_1=\frac1{\sqrt3}\begin{pmatrix}1\\1\\1\end{pmatrix}.
$$

Therefore

$$
x^\dagger=\frac{u_1^Tb}{\sqrt{15}}v_1
=\binom{3/5}{6/5}.
$$

Its squared norm is $9/5$. The null direction $(-2,1)$ is perpendicular to $x^\dagger$. Moving along that direction leaves the objective unchanged and increases the norm away from $x^\dagger$.

For the smaller example with both rows of $A$ equal to $(1,1)$ and $b=(1,3)^T$, the minimizers satisfy $x_1+x_2=2$. The minimum-norm solution is $(1,1)$, the fitted vector is $(2,2)^T$, and the minimum objective is one.

### 10.4 Full-rank line fitting

For data $(t,y)=(0,1),(1,2),(2,4)$, fit $y=x_1+x_2t$ with

$$
A=\begin{pmatrix}1&0\\1&1\\1&2\end{pmatrix},\qquad b=\begin{pmatrix}1\\2\\4\end{pmatrix}.
$$

Then

$$
A^TA=\begin{pmatrix}3&3\\3&5\end{pmatrix},\qquad A^Tb=\binom7{10}.
$$

The determinant is six, so the Hessian is positive definite. Solving the normal equations gives

$$
x^*=\binom{5/6}{3/2},\qquad \widehat y(t)=\frac56+\frac32t.
$$

The residual $b-Ax^*$ is $(1/6,-1/3,1/6)^T$, whose squared norm is $1/6$. Thus the objective minimum is $1/12$.

For numerical implementations, normal equations explain the mathematics, but QR or SVD is preferable for solving general least-squares problems. Forming $A^TA$ squares the spectral condition number when $A$ has full column rank. The figure below displays the normal-equation derivation but computes with a QR factorization.

[[LeastSquaresRank]]

## Optional extension: finite Jensen inequality

**Extension.** This section goes beyond the course notes. It extends the two-point definition without changing its basic idea.

**Theorem.** If $f$ is convex, $w_i\ge0$ and $\sum_{i=1}^m w_i=1$, then $f\left(\sum_{i=1}^m w_i x_i\right)\le\sum_{i=1}^m w_i f(x_i)$.

An induction proves it. The two-point case is the definition. For the induction step, put $s=\sum_{i=1}^{m-1}w_i$. If $s=0$, only the last weight is nonzero and equality holds. Otherwise normalize the first $m-1$ weights and write the full average as $sz+(1-s)x_m$, where $z=\sum_{i<m}(w_i/s)x_i$. Apply two-point convexity, then the induction hypothesis to $f(z)$. For a strictly convex function, equality requires all points with positive weights to coincide.

For $f(x)=x^2$, the Jensen gap is the weighted variance,

$$
\sum_i w_i x_i^2-\left(\sum_i w_i x_i\right)^2
=\sum_i w_i(x_i-\bar x)^2,\qquad \bar x=\sum_iw_ix_i.
$$

[[Jensen]]
