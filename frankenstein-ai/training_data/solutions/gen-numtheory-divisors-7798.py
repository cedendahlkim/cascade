# Task: gen-numtheory-divisors-7798 | Score: 100% | 2026-02-15T10:28:34.385405

n = int(input())
print(' '.join(str(d) for d in range(1, n+1) if n % d == 0))